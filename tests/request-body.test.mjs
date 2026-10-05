import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readJsonBody} from '../src/lib/security/body.ts';
test('chunked request cannot bypass the body size limit',async()=>{
 const body=new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('{"note":"'+'x'.repeat(2048)));c.enqueue(new TextEncoder().encode('"}'));c.close();}});
 const request=new Request('https://example.test',{method:'POST',body,duplex:'half'});
 assert.deepEqual(await readJsonBody(request,1024),{value:null,tooLarge:true});
});
test('only JSON objects are accepted, within the actual byte limit',async()=>{
 for(const body of ['null','[]','broken'])assert.deepEqual(await readJsonBody(new Request('https://example.test',{method:'POST',body}),100),{value:null,tooLarge:false});
 assert.deepEqual(await readJsonBody(new Request('https://example.test',{method:'POST',body:'{"note":"Türkçe"}'}),100),{value:{note:'Türkçe'},tooLarge:false});
});
test('an oversized declared body is rejected before it is read',async()=>{
 assert.deepEqual(await readJsonBody(new Request('https://example.test',{method:'POST',headers:{'content-length':'1001'},body:'{}'}),1000),{value:null,tooLarge:true});
});
