import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const source=path.join(root,"public/brand/logo-source.png");
const destination=path.join(root,"apps/mobile/assets/images");
for (const [name,size] of [["icon.png",1024],["splash-icon.png",512],["favicon.png",64],["android-icon-foreground.png",1024]]) {
  await sharp(source).resize(size,size,{fit:"contain"}).png().toFile(path.join(destination,name));
}
await sharp({create:{width:1024,height:1024,channels:3,background:"#FFFFFF"}}).png().toFile(path.join(destination,"android-icon-background.png"));
