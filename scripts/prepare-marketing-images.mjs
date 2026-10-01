import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

// Usage: node scripts/prepare-marketing-images.mjs painter.png electrician.png plumber.png hvac.png
// Optimized assets are already checked in; source files are only needed when replacing a visual.
const sources = process.argv.slice(2);
if (sources.length !== 4) throw new Error("Dört kaynak görsel gir: boyacı, elektrikçi, tesisatçı, klimacı.");
const output = resolve("public/images/marketing");
await mkdir(output, { recursive: true });
for (const [index, name] of ["painter", "electrician", "plumber", "hvac"].entries()) {
  await sharp(resolve(sources[index])).rotate().resize({ width: name === "painter" ? 1100 : 900, withoutEnlargement: true }).webp({ quality: 80 }).toFile(resolve(output, `${name}.webp`));
}
