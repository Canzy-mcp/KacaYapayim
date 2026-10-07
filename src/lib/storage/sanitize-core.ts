import sharp from "sharp";
import { PDFDocument, PDFDict, PDFName, PDFArray, PDFStream, type PDFObject } from "pdf-lib";

// Decode and rewrite images so metadata and appended payloads never reach Storage.
export async function sanitizeUpload(file: File, allowPdf = true) {
  const bytes = Buffer.from(await file.arrayBuffer());
  if (["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    const image = sharp(bytes, { limitInputPixels: 16_000_000, animated: false, failOn: "warning" });
    const meta = await image.metadata();
    const expected = file.type === "image/jpeg" ? "jpeg" : file.type.split("/")[1];
    if (meta.format !== expected || (meta.pages ?? 1) > 1) throw new Error("Görsel türü geçersiz.");
    const output = await image.rotate().webp({ quality: 85 }).toBuffer();
    if (output.length > 5 * 1024 * 1024) throw new Error("Görsel işlendikten sonra çok büyük.");
    return { bytes: output, mime: "image/webp", ext: "webp" };
  }
  if (allowPdf && file.type === "application/pdf" && bytes.subarray(0, 5).toString() === "%PDF-") {
    const pdf = await PDFDocument.load(bytes, { ignoreEncryption: false, updateMetadata: false });
    if (!pdf.getPageCount() || pdf.getPageCount() > 200) throw new Error("PDF sayfa sayısı geçersiz.");
    const forbidden = new Set(["JavaScript", "JS", "OpenAction", "AA", "EmbeddedFiles", "Filespec", "Launch", "RichMedia", "XFA", "SubmitForm", "ImportData"]);
    const seen = new Set<PDFObject>(); let visited = 0;
    function inspect(object: PDFObject, depth = 0) {
      if (seen.has(object)) return;
      if (depth > 100 || ++visited > 100000) throw new Error("PDF yapısı çok karmaşık.");
      seen.add(object);
      if (object instanceof PDFStream) inspect(object.dict, depth + 1);
      if (object instanceof PDFDict) {
        for (const [key, value] of object.entries()) {
          if (forbidden.has(key.decodeText()) || (value instanceof PDFName && forbidden.has(value.decodeText())))
            throw new Error("PDF etkin içerik veya ek dosya içeriyor.");
          inspect(value, depth + 1);
        }
      }
      if (object instanceof PDFArray) for (const value of object.asArray()) inspect(value, depth + 1);
    }
    for (const [, object] of pdf.context.enumerateIndirectObjects()) inspect(object);
    const output = await pdf.save();
    if (output.length > 5 * 1024 * 1024) throw new Error("PDF çok büyük.");
    return { bytes: output, mime: "application/pdf", ext: "pdf" };
  }
  throw new Error("Dosya türü desteklenmiyor.");
}
