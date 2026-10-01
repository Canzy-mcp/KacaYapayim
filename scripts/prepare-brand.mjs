import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';
const source='public/brand/logo-source.png';
for(const [file,size] of [['public/brand/logo.webp',256],['public/brand/logo.png',256],['src/app/icon.png',64],['src/app/apple-icon.png',180],['apps/mobile/assets/images/icon.png',1024],['apps/mobile/assets/images/android-icon-foreground.png',1024],['apps/mobile/assets/images/splash-icon.png',512],['apps/mobile/assets/images/favicon.png',64]]) {
  const pipeline=sharp(source).resize(size,size,{fit:'contain'});
  await (file.endsWith('.webp')?pipeline.webp({quality:88}):pipeline.png()).toFile(file);
}
await sharp({create:{width:1024,height:1024,channels:3,background:'#FFFFFF'}}).png().toFile('apps/mobile/assets/images/android-icon-background.png');
