import {spawnSync} from 'node:child_process';
import fs from 'node:fs/promises';
// Only these two current toolchain advisories are recorded exceptions, not all high alerts.
const known=new Map([
 ['https://github.com/advisories/GHSA-vfj7-8cjw-p6xm',{name:'braces',severity:'high'}],
 ['https://github.com/advisories/GHSA-86w9-cpqp-85rv',{name:'node-forge',severity:'high'}],
]);
const command=process.platform==='win32'?'npm.cmd':'npm';
const result=spawnSync(command,['audit','--json'],{encoding:'utf8',shell:process.platform==='win32',maxBuffer:4*1024*1024});
let report;try{report=JSON.parse(result.stdout);if(report.error||!report.vulnerabilities)throw new Error('Audit unavailable');}catch{console.error('Dependency audit unavailable; verification cannot pass.');process.exit(1);}
await fs.mkdir('tmp',{recursive:true});await fs.writeFile('tmp/dependency-audit.json',JSON.stringify(report,null,2));
const failures=[];
for(const [name,v] of Object.entries(report.vulnerabilities))for(const via of v.via){
 if(typeof via==='string')continue;
 const exception=known.get(via.url);
 if(!exception||exception.name!==name||exception.severity!==via.severity||Date.now()>Date.parse('2026-11-06T00:00:00Z'))failures.push(`${name}: ${via.url} (${via.severity})`);
}
if(failures.length){console.error('Unreviewed dependency advisories:\n'+failures.join('\n'));process.exitCode=1;}
else console.log(`Only two documented mobile build-chain advisories remain (${report.metadata.vulnerabilities.total} affected packages). Re-review exceptions by 2026-11-06.`);
