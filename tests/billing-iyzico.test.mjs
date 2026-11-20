import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { readBillingDetails } from "../src/lib/billing/details.ts";
import { hostedCheckoutUrl, iyzicoAuthHeaders, iyzicoStatus, readIyzicoConfig, verifyIyzicoWebhook, webhookStatus } from "../src/lib/billing/iyzico-protocol.ts";

const env = {
  BILLING_PROVIDER: "iyzico",
  APP_URL: "https://preview.example.test",
  IYZICO_ENV: "sandbox",
  IYZICO_API_KEY: "sandboxKey",
  IYZICO_SECRET_KEY: "sandboxSecret",
  IYZICO_MERCHANT_ID: "12345",
  IYZICO_PLAN_USTA_MONTHLY: "usta-monthly",
  IYZICO_PLAN_USTA_YEARLY: "usta-yearly",
  IYZICO_PLAN_PRO_MONTHLY: "pro-monthly",
  IYZICO_PLAN_PRO_YEARLY: "pro-yearly",
};
const notice = {
  iyziEventType: "subscription.order.success",
  subscriptionReferenceCode: "sub-123",
  orderReferenceCode: "order-456",
  customerReferenceCode: "customer-789",
  iyziReferenceCode: "notification-1",
  iyziEventTime: 1795200000000,
};
const signature = "4170ea1fc161f787abaad438560060f628c08ef063e85b4de8cb73220f407729";
const verify = (body, header = signature) => verifyIyzicoWebhook(body, header, env.IYZICO_MERCHANT_ID, env.IYZICO_SECRET_KEY);

test("IYZWSv2 signs the serialized body and path without its query", () => {
  assert.deepEqual(iyzicoAuthHeaders("sandboxKey", "sandboxSecret", "123456", "/v2/subscription/checkoutform/initialize?unused=1", '{"locale":"tr"}'), {
    authorization: "IYZWSv2 YXBpS2V5OnNhbmRib3hLZXkmcmFuZG9tS2V5OjEyMzQ1NiZzaWduYXR1cmU6MTljNWExMThmN2IyNTAzYjNkNDcxNjRkZTlkOGQ4ZmYzNDk1YWJiNWYwYjVhNmIxZmQzYjRiZjc5ZDllNzk3MQ==",
    "x-iyzi-rnd": "123456",
  });
});

test("webhook rejects invalid signatures and deduplicates on signed fields", () => {
  const result = verify(notice);
  assert.ok(result);
  assert.equal(verify(notice, null), null);
  assert.equal(verify(notice, "z".repeat(64)), null);
  assert.equal(verify({ ...notice, orderReferenceCode: "order-other" }), null);
  assert.equal(verify({ ...notice, orderReferenceCode: "" }), null);
  assert.equal(verify({ ...notice, iyziEventType: { toString: 0 } }), null);
  assert.equal(verify({ ...notice, iyziReferenceCode: "changed", iyziEventTime: 1 }).eventId, result.eventId);
});

test("iyzico requires complete distinct credentials and blocks sandbox on production", () => {
  for (const key of Object.keys(env)) assert.equal(readIyzicoConfig({ ...env, [key]: "" }), null, key);
  assert.equal(readIyzicoConfig({ ...env, IYZICO_PLAN_PRO_YEARLY: env.IYZICO_PLAN_PRO_MONTHLY }), null);
  assert.equal(readIyzicoConfig({ ...env, NODE_ENV: "production" }), null);
  assert.equal(readIyzicoConfig({ ...env, VERCEL_ENV: "production", DEPLOYMENT_ENV: "staging" }), null);
  assert.equal(readIyzicoConfig({ ...env, DEPLOYMENT_ENV: "production", VERCEL_ENV: "preview" }), null);
  assert.equal(readIyzicoConfig({ ...env, NODE_ENV: "production", VERCEL_ENV: "preview" }).apiUrl, "https://sandbox-api.iyzipay.com");
  assert.equal(readIyzicoConfig({ ...env, IYZICO_ENV: "production", VERCEL_ENV: "production" }).apiUrl, "https://api.iyzipay.com");
});

test("hosted checkout never navigates to an unrelated origin or other iyzico environment", () => {
  const hosted = "https://sandbox-cpp.iyzipay.com/?token=checkout-123&lang=tr";
  assert.equal(hostedCheckoutUrl("sandbox", "checkout-123"), hosted);
  assert.equal(hostedCheckoutUrl("sandbox", "checkout-123", hosted), hosted);
  for (const url of ["https://cpp.iyzipay.com", "https://sandbox-cpp.iyzipay.com.example.test", "http://sandbox-cpp.iyzipay.com"]) {
    assert.throws(() => hostedCheckoutUrl("sandbox", "checkout-123", url));
  }
});

test("order notifications and authoritative subscription states map to local statuses", () => {
  assert.equal(webhookStatus("subscription.order.success"), "active");
  assert.equal(webhookStatus("subscription.order.failure"), "past_due");
  assert.equal(webhookStatus("subscription.cancel"), "cancelled");
  assert.equal(webhookStatus("subscription.expired"), "expired");
  assert.equal(webhookStatus("payment.success"), null);
  assert.equal(iyzicoStatus("UNPAID"), "past_due");
  assert.equal(iyzicoStatus("CANCELED"), "cancelled");
  assert.equal(iyzicoStatus("PENDING"), "incomplete");
});

test("billing details validate lengths and preserve optional values", () => {
  const form = new FormData();
  for (const [name, value] of Object.entries({ name: " Ada ", surname: "Deniz", email: "ada@example.test", city: "İzmir", address: "Örnek Mahallesi 10" })) {
    form.set(name, value);
  }
  assert.equal(readBillingDetails(form).name, "Ada");
  assert.equal(readBillingDetails(form).identityNumber, undefined);
  form.set("identityNumber", "1234");
  assert.equal(readBillingDetails(form), null);
  form.set("identityNumber", "1234567890");
  form.set("gsmNumber", "+90 (555) 000 00 00");
  assert.equal(readBillingDetails(form).gsmNumber, "+905550000000");
  form.set("address", "x".repeat(301));
  assert.equal(readBillingDetails(form), null);
});

test("checkout settlement is atomic and duplicate webhooks cannot replace newer state", async () => {
  const db = new PGlite({ extensions: { pgcrypto } });
  const business = "00000000-0000-4000-8000-000000000201";
  const file = path => readFile(new URL(path, import.meta.url), "utf8");
  try {
    await db.exec(await file("./platform-fixture.sql"));
    await db.exec("create extension pgcrypto with schema extensions; create schema private");
    const folder = new URL("../supabase/migrations/", import.meta.url);
    const baseline = (await readdir(folder)).filter(name => name.endsWith(".sql") && name <= "202609300010_billing.sql").sort();
    for (const name of [...baseline, "20261120000200_iyzico_billing.sql"]) {
      await db.exec(await readFile(new URL(name, folder), "utf8"));
    }
    await db.exec(`
      insert into auth.users(id,email) values ('00000000-0000-4000-8000-000000000101','owner@example.test');
      insert into public.businesses(id,owner_id,name) values ('${business}','00000000-0000-4000-8000-000000000101','Test');
      set role authenticated;
    `);
    await assert.rejects(db.query("select public.get_iyzico_checkout('checkout-1')"), /permission denied/);
    await db.exec(`reset role; set role service_role; set request.jwt.claims = '{"role":"service_role"}'`);
    const reserve = async (token, plan = "usta") => (await db.query(
      "select public.save_iyzico_checkout($1,$2,$3,'monthly',$4,$5,now() + interval '30 minutes') as result",
      [business, token, plan, `${plan}-monthly`, `https://example.test/${token}`],
    )).rows[0].result;
    assert.equal(await reserve("checkout-1"), "https://example.test/checkout-1");
    assert.equal(await reserve("checkout-2"), "https://example.test/checkout-1");
    assert.equal(await reserve("checkout-3", "pro"), null);

    const event = {
      provider: "iyzico", eventId: "checkout:1", eventType: "subscription.checkout.completed",
      businessId: business, planId: "usta", planReference: "usta-monthly", interval: "monthly",
      status: "active", providerCustomerId: "customer-789", providerSubscriptionId: "sub-123",
      occurredAt: "2026-11-20T08:00:00Z", currentPeriodStart: "2026-11-20T08:00:00Z",
      currentPeriodEnd: "2026-12-20T08:00:00Z", cancelAtPeriodEnd: false, payloadHash: "fixture",
    };
    const apply = async (payload, token = null) => (await db.query(
      "select public.apply_iyzico_event($1::jsonb,$2::text) as result", [JSON.stringify(payload), token],
    )).rows[0].result;
    assert.equal(await apply(event), false);
    assert.equal(await apply({ ...event, planReference: "wrong-plan" }, "checkout-1"), false);
    assert.equal(await apply(event, "checkout-1"), true);
    assert.equal(await apply(event, "checkout-1"), true);
    assert.equal(await reserve("checkout-4"), null);
    const renewal = { ...event, eventId: verify(notice).eventId, eventType: notice.iyziEventType, occurredAt: "2026-12-20T09:00:00Z" };
    assert.equal(await apply(renewal), true);
    assert.equal(await apply({ ...renewal, status: "past_due", occurredAt: "2026-12-20T10:00:00Z" }), false);
    assert.equal((await db.query("select count(*)::int as count from public.billing_events")).rows[0].count, 2);
    assert.equal((await db.query("select status from public.subscriptions")).rows[0].status, "active");
    assert.equal((await db.query("select status, payment_url from private.billing_checkout_attempts")).rows[0].payment_url, null);
  } finally {
    await db.close();
  }
});
