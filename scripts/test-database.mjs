import fs from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
const db=new PGlite({extensions:{pgcrypto}});
let stage='platform fixture';
try{
 await db.exec(await fs.readFile('tests/platform-fixture.sql','utf8'));
 await db.exec('create extension pgcrypto with schema extensions');
 const files=(await fs.readdir('supabase/migrations')).filter(f=>f.endsWith('.sql')).sort();
 for(const file of files){stage=file;let sql=await fs.readFile(`supabase/migrations/${file}`,'utf8');
  if(file==='20261006101414_audit_security_and_collections.sql') {
   // Reproduce the live baseline ACL discovered in the deployment preflight.
   await db.exec('grant execute on function public.update_my_settings(text,text,text,text,text,text,numeric,numeric) to anon');
  }
  // WASM Postgres cannot run a background worker. All other migration SQL is unmodified.
  sql=sql.replace(/create extension if not exists pg_cron;/g,'');
  await db.exec(sql);
 }
 for(const file of ['tests/product-database.sql','tests/audit-database.sql']){stage=file;const result=await db.exec(await fs.readFile(file,'utf8'));console.log(result.at(-1)?.rows);}
 console.log(`PASS: ${files.length} migrations replayed on isolated PostgreSQL; pg_cron execution excluded.`);
}catch(error){console.error(`FAIL at ${stage}:`,error.message);process.exitCode=1;}
finally{await db.close();}
