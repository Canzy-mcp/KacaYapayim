import { createRequire } from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
await import('./prepare-product-ui-review.mjs');
const require=createRequire(import.meta.url);
const { chromium }=require('C:/Users/Victus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const executable=['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe'].find(p=>fs.existsSync(p));
const browser=await chromium.launch({headless:true,...(executable?{executablePath:executable}:{})});
const context=await browser.newContext({viewport:{width:390,height:844}});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://localhost:3005/product-ui-review',{waitUntil:'networkidle'});
 await page.getByRole('textbox',{name:'İş başlığı',exact:true}).fill('Cam montajı taslağım');
 await page.reload({waitUntil:'networkidle'});
 await assert.equal(await page.getByRole('textbox',{name:'İş başlığı',exact:true}).inputValue(),'Cam montajı taslağım');
 await page.getByRole('button',{name:'İşletme: A'}).click();
 await assert.equal(await page.getByRole('textbox',{name:'İş başlığı',exact:true}).inputValue(),'');
 await page.getByRole('button',{name:'İşletme: B'}).click();
 await assert.equal(await page.getByRole('textbox',{name:'İş başlığı',exact:true}).inputValue(),'Cam montajı taslağım');
 const opener=page.getByRole('button',{name:'Pencereyi Aç'});await opener.click();
 await page.getByRole('dialog',{name:'Odak kontrolü'}).waitFor();
 for(let i=0;i<7;i++){await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>!!document.activeElement?.closest('dialog')),true);}
 await page.keyboard.press('Escape');await page.getByRole('dialog').waitFor({state:'hidden'});
 assert.equal(await opener.evaluate(e=>e===document.activeElement),true);
 await page.route('**/product-ui-review',route=>route.request().method()==='POST'?route.abort('failed'):route.continue());
 const search=page.getByRole('searchbox',{name:'Müşteri ara'});await search.fill('Bağlantı testi');
 await page.getByRole('alert').filter({hasText:'Müşteriler yüklenemedi'}).waitFor();
 await search.fill('');await page.getByText('Müşteri bulunamadı',{exact:true}).waitFor();
 assert.equal(await page.getByText('Aranıyor...',{exact:true}).count(),0);
 await page.getByRole('button',{name:'Yeni müşteri oluştur'}).click();
 await page.getByRole('dialog',{name:'Yeni müşteri',exact:true}).waitFor();
 await page.keyboard.press('Escape');
 await assert.equal(await page.getByRole('textbox',{name:'İş başlığı',exact:true}).inputValue(),'Cam montajı taslağım');
 fs.mkdirSync('docs/screenshots/product-improvements',{recursive:true});
 await page.screenshot({path:'docs/screenshots/product-improvements/manual-mobile.png',fullPage:true});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
 await page.setViewportSize({width:1440,height:1000});
 await page.screenshot({path:'docs/screenshots/product-improvements/manual-desktop.png',fullPage:true});
 const image=await context.request.get('http://localhost:3005/api/og?title=Camcılar%20için%20maliyet%20hesabı');
 assert.equal(image.status(),200);assert.match(image.headers()['content-type'],/image\/png/);
 fs.writeFileSync('docs/screenshots/product-improvements/social-card.png',await image.body());
 assert.deepEqual(errors,[]);
 console.log('PASS: scoped draft recovery, cross-business separation, dialog focus/Escape/restore, customer error recovery, inline customer entry, mobile width, social card.');
}finally{
 await browser.close();
 fs.unlinkSync('src/app/product-ui-review/page.tsx');
 fs.rmdirSync('src/app/product-ui-review');
}
