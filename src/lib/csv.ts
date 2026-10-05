export function parseCsv(text: string): string[][] {
 const input=text.replace(/^\uFEFF/,'');
 const first=input.split(/\r?\n/,1)[0];const delimiter=first.includes(';')?';':',';
 const rows:string[][]=[];let row:string[]=[];let field='';let quoted=false;
 for(let i=0;i<input.length;i++){
  const char=input[i];
  if(char==='"'){if(quoted&&input[i+1]==='"'){field+='"';i++;}else if(!quoted&&field.length){throw new Error('Tırnak işareti alan başında olmalı.');}else quoted=!quoted;}
  else if(!quoted&&char===delimiter){row.push(field);field='';}
  else if(!quoted&&(char==='\n'||char==='\r')){if(char==='\r'&&input[i+1]==='\n')i++;row.push(field);if(row.some(v=>v.trim()))rows.push(row);row=[];field='';}
  else field+=char;
  if(field.length>10000||rows.length>1000)throw new Error('CSV dosyası çok büyük.');
 }
 if(quoted)throw new Error('CSV dosyasında kapanmamış tırnak var.');
 row.push(field);if(row.some(v=>v.trim()))rows.push(row);
 return rows;
}
export function encodeCsv(rows: unknown[][]): string {
 const cell=(value:unknown)=>{let text=String(value??'');if(/^[\s]*[=+\-@]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';};
 return '\uFEFF'+rows.map(row=>row.map(cell).join(';')).join('\r\n');
}
