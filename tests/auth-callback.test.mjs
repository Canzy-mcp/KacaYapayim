import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const route=readFileSync(new URL('../src/app/auth/callback/route.ts',import.meta.url),'utf8');
const page=readFileSync(new URL('../src/app/auth/confirm/page.tsx',import.meta.url),'utf8');
const get=route.slice(route.indexOf('export async function GET'),route.indexOf('export async function POST'));
const post=route.slice(route.indexOf('export async function POST'));
test('GET never verifies a token_hash, it only redirects to the confirm page',()=>{
 assert.doesNotMatch(get,/verifyOtp/);
 assert.match(get,/\/auth\/confirm/);
 assert.match(get,/exchangeCodeForSession/);
});
test('POST verifies the token only after the same-origin checks',()=>{
 assert.match(post,/sameOrigin\(request\)/);
 assert.ok(post.indexOf('sameOrigin(request)')<post.indexOf('verifyOtp'));
 assert.match(route,/sec-fetch-site/);
 assert.match(route,/headers\.get\("origin"\)/);
 assert.match(route,/APP_URL/);
 assert.match(post,/status: 303/);
});
test('confirm page posts hidden fields without auto-submit script',()=>{
 assert.match(page,/method="post" action="\/auth\/callback"/);
 for(const n of ['token_hash','type','next'])assert.match(page,new RegExp(`type="hidden" name="${n}"`));
 assert.doesNotMatch(page,/<script|\.submit\(|onLoad/);
 assert.match(page,/index: false/);
});
