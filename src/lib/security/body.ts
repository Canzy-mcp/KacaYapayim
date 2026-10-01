export async function readJsonBody(request: Request, maxBytes: number): Promise<{value:Record<string,unknown>|null;tooLarge:boolean}> {
  const declared=Number(request.headers.get("content-length")||0);
  if(declared>maxBytes)return {value:null,tooLarge:true};
  if(!request.body)return {value:null,tooLarge:false};
  const reader=request.body.getReader();const chunks:Uint8Array[]=[];let size=0;
  try{
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maxBytes){await reader.cancel();return {value:null,tooLarge:true};}chunks.push(value);}
    const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
    try{const data:unknown=JSON.parse(new TextDecoder().decode(bytes));return {value:data&&typeof data==="object"&&!Array.isArray(data)?data as Record<string,unknown>:null,tooLarge:false};}
    catch{return {value:null,tooLarge:false};}
  }catch{return {value:null,tooLarge:false};}
}
