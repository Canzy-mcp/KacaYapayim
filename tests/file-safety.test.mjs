import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import {PDFDocument,PDFName} from 'pdf-lib';
import {sanitizeUpload} from '../src/lib/storage/sanitize-core.ts';
test('images are decoded, oriented and rewritten without EXIF',async()=>{
 const bytes=await sharp({create:{width:32,height:16,channels:3,background:'white'}}).png().withMetadata({orientation:6}).toBuffer();
 const safe=await sanitizeUpload(new File([bytes],'image.png',{type:'image/png'}));
 const meta=await sharp(safe.bytes).metadata();assert.equal(safe.mime,'image/webp');assert.equal(meta.width,16);assert.equal(meta.height,32);assert.equal(meta.exif,undefined);
});
test('declared image format must match decoded content',async()=>{
 const png=await sharp({create:{width:2,height:2,channels:3,background:'white'}}).png().toBuffer();
 await assert.rejects(()=>sanitizeUpload(new File([png],'spoof.jpg',{type:'image/jpeg'})));
 await assert.rejects(()=>sanitizeUpload(new File([Buffer.from([137,80,78,71])],'broken.png',{type:'image/png'})));
});
test('high pixel count images are rejected before full processing',async()=>{
 const png=await sharp({create:{width:5000,height:5000,channels:3,background:'white'}}).png().toBuffer();
 await assert.rejects(()=>sanitizeUpload(new File([png],'large.png',{type:'image/png'})));
});
test('valid plain PDF survives; malformed and excessive-page PDFs are rejected',async()=>{
 const pdf=await PDFDocument.create();pdf.addPage();const valid=await sanitizeUpload(new File([await pdf.save()],'plain.pdf',{type:'application/pdf'}));assert.equal(valid.mime,'application/pdf');
 await assert.rejects(()=>sanitizeUpload(new File(['%PDF-broken'],'bad.pdf',{type:'application/pdf'})));
 for(let i=1;i<201;i++)pdf.addPage();await assert.rejects(async()=>sanitizeUpload(new File([await pdf.save()],'long.pdf',{type:'application/pdf'})));
});
test('PDF rejects nested scripts and embedded attachments',async()=>{
 const pdf=await PDFDocument.create();pdf.addPage();pdf.catalog.set(PDFName.of('Names'),pdf.context.obj({JavaScript:pdf.context.obj({Names:['test',pdf.context.obj({S:PDFName.of('JavaScript'),JS:'alert(1)'})]})}));
 await assert.rejects(async()=>sanitizeUpload(new File([await pdf.save()],'script.pdf',{type:'application/pdf'})));
 const attachment=await PDFDocument.create();attachment.addPage();await attachment.attach(new Uint8Array([1,2,3]),'embedded.bin');
 await assert.rejects(async()=>sanitizeUpload(new File([await attachment.save()],'attachment.pdf',{type:'application/pdf'})));
});
