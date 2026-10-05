import fs from 'node:fs';
const dir='src/app/product-ui-review';
if(fs.existsSync(dir+'/page.tsx'))throw new Error('An existing review route must not be overwritten.');
fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(dir+'/page.tsx',`"use client";
import {useState} from 'react';
import {DraftProvider} from '@/components/draft-provider';
import {ManualJobForm} from '@/components/jobs/manual-job-form';
import {Dialog} from '@/components/ui/dialog';
import {CustomerSelect} from '@/components/jobs/customer-select';
export default function Review(){const [scope,setScope]=useState('A');const [open,setOpen]=useState(false);return <main className="min-h-screen bg-[#f5f5f7] p-5"><div className="mx-auto mb-6 flex max-w-3xl gap-3"><button className="min-h-11 rounded-xl border bg-white px-3" onClick={()=>setScope(s=>s==='A'?'B':'A')}>İşletme: {scope}</button><button className="min-h-11 rounded-xl border bg-white px-3" onClick={()=>setOpen(true)}>Pencereyi Aç</button></div><DraftProvider key={scope} scope={'test-user:'+scope}><ManualJobForm customers={[]} selectedCustomer={null}/></DraftProvider>{open&&<Dialog title="Odak kontrolü" onClose={()=>setOpen(false)}><label>Test alanı<input className="min-h-12 w-full rounded-xl border px-3"/></label><button className="mt-3 min-h-11 border p-3" onClick={()=>setOpen(false)}>Tamam</button></Dialog>}</main>;}
`);
