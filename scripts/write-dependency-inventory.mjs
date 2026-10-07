import fs from 'node:fs/promises';
import path from 'node:path';
const lock=JSON.parse(await fs.readFile('package-lock.json','utf8'));
const packages=lock.packages;
function resolve(from,name){
 let directory=from;
 while(true){const candidate=(directory?directory+'/':'')+'node_modules/'+name;
  if(packages[candidate])return packages[candidate].link?packages[candidate].resolved:candidate;
  if(!directory)return null;
  const parent=path.posix.dirname(directory);directory=parent==='.'?'':parent;
 }
}
function inventory(root,includeDevelopment){
 const visited=new Set();const unresolved=[];
 const queue=Object.keys({...packages[root].dependencies,...packages[root].optionalDependencies,...(includeDevelopment?packages[root].devDependencies:{})}).map(name=>({from:root,name}));
 while(queue.length){const {from,name}=queue.pop();const location=resolve(from,name);
  if(!location){unresolved.push({from,name});continue;}if(visited.has(location))continue;visited.add(location);
  const pkg=packages[location];for(const dependency of Object.keys({...pkg.dependencies,...pkg.optionalDependencies}))queue.push({from:location,name:dependency});
 }
 return {root,includesDevelopment:includeDevelopment,unresolved,components:[...visited].sort().map(location=>{
  const pkg=packages[location];return {location,name:pkg.name||location.split('node_modules/').at(-1),version:pkg.version||null,integrity:pkg.integrity||null,license:pkg.license||null,optional:!!pkg.optional};
 })};
}
const report={schemaVersion:1,source:'package-lock.json',note:'Declared lockfile graph, including optional platforms; not a claim about runtime exploitability or an npm install validation.',web:inventory('',false),mobileBuild:inventory('apps/mobile',true)};
await fs.mkdir('tmp',{recursive:true});await fs.writeFile('tmp/dependency-inventory.json',JSON.stringify(report,null,2));
console.log(`Dependency inventory: ${report.web.components.length} web, ${report.mobileBuild.components.length} mobile components.`);
if(report.web.unresolved.length||report.mobileBuild.unresolved.length){console.error('Unresolved declared dependencies:',report.web.unresolved,report.mobileBuild.unresolved);process.exitCode=1;}
