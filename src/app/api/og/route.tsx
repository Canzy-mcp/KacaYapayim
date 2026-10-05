import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
export const runtime="nodejs";
export async function GET(request:Request){
 const params=new URL(request.url).searchParams;const title=(params.get('title')||'İşinin maliyetini bil. Kârını koru.').slice(0,100);const description=(params.get('description')||'Ustalar için maliyet hesabı ve profesyonel teklif hazırlama.').slice(0,160);
 const font=await readFile(path.join(process.cwd(),'public/fonts/NotoSans-Bold.ttf'));
 return new ImageResponse(<div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',justifyContent:'space-between',padding:'64px 74px',background:'#101d31',color:'#ffffff',fontFamily:'Noto',position:'relative'}}><div style={{display:'flex',fontSize:30,color:'#79b9ff'}}>KaçaYapayım</div><div style={{display:'flex',flexDirection:'column',gap:25}}><div style={{display:'flex',fontSize:58,lineHeight:1.15,letterSpacing:-2,maxWidth:1040}}>{title}</div><div style={{display:'flex',fontSize:25,lineHeight:1.4,color:'#c2d0e2',maxWidth:950}}>{description}</div></div><div style={{display:'flex',fontSize:20,color:'#79b9ff'}}>Maliyet · Fiyat · Teklif</div></div>,{width:1200,height:630,fonts:[{name:'Noto',data:font.buffer.slice(font.byteOffset,font.byteOffset+font.byteLength) as ArrayBuffer,weight:700,style:'normal'}],headers:{'Cache-Control':'public, max-age=86400'}});
}
