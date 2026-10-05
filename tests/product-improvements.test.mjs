import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePrice } from '../src/lib/money.ts';
import { parseCsv,encodeCsv } from '../src/lib/csv.ts';
import {normalizeChannel,sanitizeCampaign} from '../src/lib/analytics/attribution.ts';
test('negotiation prices preserve Turkish grouping and cents',()=>{
 for(const [text,amount] of [['1.234,56',1234.56],['1.234',1234],['1234.56',1234.56],['0',0],[' 12 345,60 ',12345.6]])assert.equal(parsePrice(text),amount);
 for(const text of ['-1','NaN','1,000','12.34.56','Infinity','1e9',''])assert.equal(parsePrice(text),null);
});
test('CSV roundtrip supports Turkish names, quoted delimiters and multiline notes',()=>{
 const rows=[['name','notes'],['Çağrı Öztürk','İş; hazırlık\n"Renk" seçimi']];
 assert.deepEqual(parseCsv(encodeCsv(rows)),rows);
 assert.deepEqual(parseCsv('name,phone\r\n"Ali, Veli",05321234567'),[['name','phone'],['Ali, Veli','05321234567']]);
 assert.throws(()=>parseCsv('name;notes\nAli;"eksik'));
});
test('CSV export neutralizes spreadsheet formulas without dropping text',()=>{
 const rows=parseCsv(encodeCsv([['=HYPERLINK("x")','+1','@SUM(A1)','-123']]));
 assert.ok(rows[0].every(s=>s.startsWith("'")));
});
test('social campaign attribution preserves supported channels and bounded identifiers',()=>{
 assert.equal(normalizeChannel('IG'),'instagram');assert.equal(normalizeChannel('facebook'),'facebook');assert.equal(normalizeChannel('tiktok'),'tiktok');assert.equal(normalizeChannel('unlisted'),'other');
 assert.equal(sanitizeCampaign('launch_2026-contact@example.com'),'launch_2026-contactexamplecom');assert.equal(sanitizeCampaign('a'.repeat(100)).length,60);
});
