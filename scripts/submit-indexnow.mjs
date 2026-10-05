import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const origin=new URL(process.env.SITE_URL||'https://www.kacayapayim.com');
assert.equal(origin.origin,'https://www.kacayapayim.com','Submit only the owned canonical production host.');
const key=(await readFile(new URL('../public/indexnow-key.txt',import.meta.url),'utf8')).trim();
assert.match(key,/^[a-f0-9]{32}$/);
const keyLocation=new URL('/indexnow-key.txt',origin).href;
const proof=await fetch(keyLocation);assert.equal(proof.status,200);assert.equal((await proof.text()).trim(),key);
const response=await fetch(new URL('/sitemap.xml',origin));assert.equal(response.status,200);
const xml=await response.text();const urls=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1].replace(/&amp;/g,'&'));
assert.ok(urls.length>0&&urls.length<=10000);
for(const url of urls){const u=new URL(url);assert.equal(u.origin,origin.origin);assert.ok(!/^\/(?:t|quotes|jobs|dashboard|customers|settings|admin|work|team-work|team-invite|api)(?:\/|$)/.test(u.pathname));}
const submitted=await fetch('https://api.indexnow.org/indexnow',{method:'POST',headers:{'Content-Type':'application/json; charset=utf-8'},body:JSON.stringify({host:origin.hostname,key,keyLocation,urlList:urls})});
assert.ok([200,202].includes(submitted.status),`IndexNow rejected: ${submitted.status}`);
console.log(`IndexNow received ${urls.length} public URLs; HTTP ${submitted.status}. This confirms submission, not indexing or ranking.`);
