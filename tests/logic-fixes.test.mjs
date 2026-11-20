import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { registerHooks } from "node:module";
import test from "node:test";
import { calculatePainterJobCost } from "../packages/core/src/jobs/painter-calculation.ts";
import { calculateProfessionJob } from "../packages/core/src/professions/engine.ts";
import { isCalendarDate, validateFieldValues } from "../packages/core/src/professions/schema.ts";
import { hvacTemplate } from "../packages/core/src/professions/templates.ts";
import { quoteAmounts } from "../packages/core/src/quote-tax.ts";
import { parseCostInput } from "../src/lib/costs/format.ts";

const source = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("tahsilat kabul edilen teklifin KDV'li toplamını ve geçerli pazar yeri anlaşmasını kullanır", async () => {
  assert.equal(quoteAmounts(1000, "included", 20).total - 1200, 0);
  assert.equal(quoteAmounts(1000, "included").total, 1000);
  const panel = await source("src/components/jobs/payment-panel.tsx");
  assert.match(panel, /quoteAmounts\(q.sale_price, q.tax_mode, q.tax_rate\)\.total/);
  assert.match(panel, /\["accepted", "scheduled", "in_progress", "completed"\]\.includes\(job.status\)/);
  assert.match(panel, /PaymentForm.+payments=\{payments/);
});

test("maliyet girişi Türkçe gruplamayı ve mevcut üst sınırı destekler", () => {
  assert.equal(parseCostInput("1.234,56"), 1234.56);
  assert.equal(parseCostInput("0"), 0);
  assert.equal(parseCostInput("999.999.999.999,99"), 999999999999.99);
  for (const value of ["1.000.000.000.000,00", "12.34,56", "1,234", "-1"]) assert.equal(parseCostInput(value), null);
});

test("klima borusu, ek maliyetler ve KDV yarım kuruşu yukarı yuvarlar", () => {
  const extra = { id: "extra", key: "extra", name: "Ek", category: "other", unit: "meter",
    unit_cost: 1, template_id: null, is_active: true };
  const costs = hvacTemplate.costs.map(item => ({ id: item.key, key: item.key, name: item.name,
    category: item.category, unit: item.unit, unit_cost: item.key === "copper_pipe" ? 1 : item.defaultValue,
    template_id: item.key, is_active: true }));
  const hvac = calculateProfessionJob({ template: hvacTemplate, fieldValues: { pipe_length: 1.005 },
    businessCosts: [...costs, extra], manualExtraCosts: [{ costItemId: extra.id, quantity: 1.005 }] });
  assert.equal(hvac.costBreakdown.find(line => line.key === "copper_pipe").total_cost, 1.01);
  assert.equal(hvac.costBreakdown.find(line => line.key === "extra").total_cost, 1.01);

  const painter = calculatePainterJobCost({
    work: { wall_area: 10.05, ceiling_area: 0, wall_coats: 1, ceiling_coats: 1, primer_required: false,
      primer_coats: 1, putty_required: false, putty_area: 0, days: 1, master_count: 0, helper_count: 0,
      include_consumables: false, include_transport: false, waste_percentage: 0, notes: "" },
    settings: { paint_coverage_per_liter: 10, primer_coverage_per_liter: 10, ceiling_paint_coverage_per_liter: 10,
      putty_kg_per_square_meter: 1, waste_percentage: 0 },
    costs: [{ ...extra, id: "paint", key: "interior_paint", unit: "liter", category: "material" }, extra],
    extras: [{ cost_item_id: extra.id, quantity: 1.005 }],
  });
  assert.deepEqual(painter.breakdown.map(line => line.total_cost), [1.01, 1.01]);
  assert.deepEqual(quoteAmounts(8.20, "included", 7.5), { subtotal: 8.20, tax: 0.62, total: 8.82, rate: 7.5 });
});

test("iş ve teklif tarihleri takvimde var olan günlerle sınırlıdır", async () => {
  const template = { fields: [{ key: "visit", fieldType: "date" }] };
  assert.ok(validateFieldValues(template, { visit: "2027-02-30" }).errors.visit);
  assert.deepEqual(validateFieldValues(template, { visit: "2028-02-29" }).errors, {});
  for (const value of ["2027-02-29", "2027-04-31", "2027-13-01", "0000-01-01"]) assert.equal(isCalendarDate(value), false);
  assert.match(await source("src/app/actions/quotes.ts"), /if \(!isCalendarDate\(input.validUntil\)\)/);
});

test("gerçek kâr paket özelliğine bağlıdır ve maliyet kaydı bağlantı hatasından sonra yeniden denenebilir", async () => {
  const form = await source("src/components/jobs/actual-cost-fields.tsx");
  assert.match(form, /try \{\s*const result = await saveActualCosts[\s\S]+catch \{\s*setError\([\s\S]+finally \{\s*setBusy\(false\)/);
  assert.match(form, /canViewActualProfit && <div[^>]*><dt>\{summary\.actualProfit/);
  assert.match(await source("src/components/jobs/actual-cost-form.tsx"), /getEffectivePlan[\s\S]+hasFeature\(plan, "actual_profit"\)/);
  assert.match(await source("src/components/jobs/generic-job-detail.tsx"), /hasFeature\(await getEffectivePlan\(job.business_id\), "actual_profit"\)/);
});

const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return nextResolve("data:text/javascript,", context);
    if (specifier === "./iyzico-store") {
      return nextResolve("data:text/javascript," + encodeURIComponent("export const billingRpc = async () => null, getCheckoutAttempt = async () => null, applyEntryPayment = async () => false;"), context);
    }
    if (context.parentURL?.includes("/src/lib/billing/") && /^\.\/[\w-]+$/.test(specifier)) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
});
const { billingAvailable } = await import("../src/lib/billing/provider.ts");
hooks.deregister();

const env = { BILLING_PROVIDER: "iyzico", APP_URL: "https://example.test", IYZICO_ENV: "sandbox",
  IYZICO_API_KEY: "testKey", IYZICO_SECRET_KEY: "testSecret", IYZICO_MERCHANT_ID: "12345" };

test("faturalama uygunluğu eksik yapılandırmayı reddeder ve usta kayıt tercihi seçilebilir", async () => {
  assert.equal(billingAvailable({ BILLING_PROVIDER: "iyzico" }), false);
  assert.equal(billingAvailable(env), true);
  const register = await source("src/app/(auth)/register/page.tsx");
  assert.match(register, /requestReturnPath\(returnTo\)/);
  assert.match(register, /<RegisterForm account=\{account === "provider"/);
});
