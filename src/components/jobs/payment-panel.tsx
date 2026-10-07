import { createClient } from "@/lib/supabase/server";
import { requireCompletedViewer } from "@/lib/viewer";
import { PaymentForm } from "./payment-form";

export async function PaymentPanel({ jobId }: { jobId: string }) {
  const viewer = await requireCompletedViewer();
  const client = await createClient();
  const { data: job, error } = await client.from("jobs").select("accepted_quote_id,selected_sale_price").eq("id", jobId).eq("business_id", viewer.business!.id).maybeSingle();
  if (error || !job) throw new Error("Tahsilat bilgileri yüklenemedi.");
  const { data: payments, error: paymentError } = await client.from("job_payments").select("*").eq("job_id", jobId).eq("business_id", viewer.business!.id).order("paid_at", { ascending: false }).order("id").limit(100);
  if (paymentError) throw new Error("Tahsilat kayıtları yüklenemedi.");
  const quote = job.accepted_quote_id ? await client.from("quotes").select("sale_price,tax_mode,tax_rate").eq("id", job.accepted_quote_id).eq("business_id", viewer.business!.id).single() : null;
  if (quote?.error) throw new Error("Tahsilat tutarı yüklenemedi.");
  const q = quote?.data;
  const agreed = q ? (q.tax_mode === "excluded" && q.tax_rate != null ? Math.round(q.sale_price * (1 + q.tax_rate / 100) * 100) / 100 : q.sale_price) : null;
  const totals = await client.rpc("get_my_payment_total", { p_job_id: jobId });
  if (totals.error) throw new Error("Tahsilat toplamı yüklenemedi.");
  return <PaymentForm jobId={jobId} agreed={agreed} total={Number(totals.data)} payments={payments || []} hasMore={(payments?.length || 0) === 100} />;
}
