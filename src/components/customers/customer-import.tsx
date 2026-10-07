"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { parseCsv, encodeCsv } from "@/lib/csv";
import { customerCsvColumns, mapCustomerRows, suggestCustomerColumns } from "@/lib/customer-csv";
import { importCustomers } from "@/app/actions/import-customers";
import { Dialog } from "@/components/ui/dialog";
function downloadCsv(name: string, rows: unknown[][]) {
  const url = URL.createObjectURL(new Blob([encodeCsv(rows)], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a"); link.href = url; link.download = name; link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function CustomerImport() {
  const router = useRouter();
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const [headers, setHeaders] = useState<string[]>([]), [rawRows, setRawRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, number>>({});
  const [failures, setFailures] = useState<Array<{ row: number; error: string }>>([]);
  const [failedData, setFailedData] = useState<unknown[][]>([]);
  let preview: Record<string, string>[] = [], mappingError = "";
  if (rawRows.length) try { preview = mapCustomerRows(rawRows, mapping); } catch (error) { mappingError = error instanceof Error ? error.message : "Sütunları kontrol et."; }
  return <div className="mb-5 flex flex-wrap gap-2">
    <a href="/settings#export" className="inline-flex min-h-11 items-center rounded-xl border bg-white px-4 text-sm">Verileri dışa aktar</a>
    <button onClick={() => { setOpen(true); setMessage(""); setRawRows([]); setHeaders([]); setFailures([]); }} className="min-h-11 rounded-xl border bg-white px-4 text-sm">CSV içeri aktar</button>
    {open && <Dialog title="Müşteri listesini içeri aktar" onClose={() => setOpen(false)} busy={busy}>
      <p className="text-sm leading-6 text-[#6e6e73]">Dosyanın sütunlarını aşağıdaki alanlarla eşleştir. Ad soyad zorunlu; diğerleri isteğe bağlı. Bir seferde 100 müşteri, 512 KB. Kayıtlı telefonlar tekrar eklenmez.</p>
      <button className="mt-3 min-h-11 text-sm text-[#0071e3]" onClick={() => downloadCsv("musteri-ornek.csv", [customerCsvColumns.map(c => c[1]), ["Örnek Müşteri", "", "", "", "", "", "", "Bu örnek satırı sil"]])}>Örnek CSV indir</button>
      <label className="mt-4 block text-sm font-medium">CSV dosyası<input disabled={busy} type="file" accept=".csv,text/csv" className="mt-3 block min-h-11 w-full" onChange={async e => {
        setRawRows([]); setMessage(""); setFailures([]); const file = e.target.files?.[0]; if (!file) return;
        if (file.size > 512 * 1024) { setMessage("Dosya en fazla 512 KB olabilir."); return; }
        try { const parsed = parseCsv(await file.text()); const columns = parsed.shift() ?? [];
          if (!columns.length || columns.length > 50 || parsed.length < 1 || parsed.length > 100) throw new Error("Dosyada başlık ve 1–100 müşteri olmalı; en fazla 50 sütun desteklenir.");
          if (parsed.some(row => row.length > columns.length)) throw new Error("Bazı satırlarda başlıklardan fazla sütun var. Ayırıcıları kontrol et.");
          setHeaders(columns); setMapping(suggestCustomerColumns(columns)); setRawRows(parsed);
        } catch (error) { setMessage(error instanceof Error ? error.message : "Dosya okunamadı."); }
      }}/></label>
      {rawRows.length > 0 && <><div className="mt-4 grid gap-3 sm:grid-cols-2">{customerCsvColumns.map(([key, label]) => <label key={key} className="text-sm">{label}{key === "name" ? " *" : ""}<select disabled={busy} value={mapping[key] ?? -1} onChange={e => setMapping(m => ({ ...m, [key]: Number(e.target.value) }))} className="mt-2 min-h-11 w-full rounded-xl border px-3"><option value={-1}>Aktarma</option>{headers.map((h, i) => <option key={i} value={i}>{i + 1}. {h || "Başlıksız"}</option>)}</select></label>)}</div>
        {mappingError && <p role="alert" className="mt-3 text-sm text-[#b42318]">{mappingError}</p>}
        <p className="mt-4 text-sm font-semibold">{rawRows.length} müşteri · İlk 10 satırın önizlemesi</p>
        <ul className="mt-2 max-h-40 overflow-auto text-sm">{preview.slice(0, 10).map((r, i) => <li key={i} className="py-1">{r.name || "Ad boş"} · {r.phone || "Telefon yok"}</li>)}</ul>
        <button disabled={busy || !!mappingError} className="mt-4 min-h-12 w-full rounded-xl bg-[#0071e3] text-white disabled:opacity-50" onClick={async () => {
          if (busy || mappingError) return; setBusy(true);
          try { const result = await importCustomers(preview); setMessage(`${result.created} müşteri eklendi. ${result.failures.length} satır eklenemedi. Hata dosyasını indirip listeyi kontrol et.`);
            setFailures(result.failures); setFailedData(result.failures.map(f => [f.row, f.error, ...customerCsvColumns.map(([key]) => preview[f.row - 2]?.[key] ?? "")]));
            setRawRows([]); router.refresh();
          } catch { setMessage("Aktarımın tamamlandığı doğrulanamadı. Yeniden yüklemeden önce müşteri listesini kontrol et; özellikle telefonu olmayan kayıtlarda tekrar oluşabilir."); setRawRows([]); }
          finally { setBusy(false); }
        }}>{busy ? "Aktarılıyor…" : "Gösterilen müşterileri ekle"}</button></>}
      {message && <p role="status" className="mt-4 text-sm">{message}</p>}
      {failures.length > 0 && <button className="mt-3 min-h-11 text-sm text-[#0071e3]" onClick={() => downloadCsv("musteri-aktarim-hatalari.csv", [["Satır", "Hata", ...customerCsvColumns.map(c => c[1])], ...failedData])}>Hatalı satırları indir</button>}
    </Dialog>}
  </div>;
}
