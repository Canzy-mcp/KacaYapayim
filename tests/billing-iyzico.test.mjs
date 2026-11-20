import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { registerHooks } from "node:module";
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

const mockExports = {
  "server-only": "",
  "@/lib/supabase/admin": "export const createServiceClient = () => globalThis.iyzicoTest.client",
  "@/lib/security/rate-limit": "export const consumeRateLimit = (...args) => globalThis.iyzicoTest.limit(...args)",
  "@/lib/observability/log": "export const logFailure = () => {}",
};
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (Object.hasOwn(mockExports, specifier)) {
      return nextResolve(`data:text/javascript,${encodeURIComponent(mockExports[specifier])}`, context);
    }
    if (specifier.startsWith("@/")) {
      return nextResolve(new URL(`../src/${specifier.slice(2)}.ts`, import.meta.url).href, context);
    }
    if (context.parentURL?.includes("/src/lib/billing/") && /^\.\/[\w-]+$/.test(specifier)) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
});
const { IyzicoBillingProvider, IyzicoAdditionalDetailsError } = await import("../src/lib/billing/iyzico.ts");
const { POST: callback } = await import("../src/app/api/billing/iyzico/callback/route.ts");
const { POST: webhook } = await import("../src/app/api/billing/iyzico/webhook/route.ts");
hooks.deregister();

const attempt = {
  business_id: "business-1", plan_id: "usta", billing_interval: "monthly", plan_reference: "usta-monthly", status: "pending",
};
const periodStart = Date.UTC(2026, 10, 1);
const periodEnd = Date.UTC(2026, 11, 1);
const subscription = {
  referenceCode: notice.subscriptionReferenceCode, customerReferenceCode: notice.customerReferenceCode,
  pricingPlanReferenceCode: attempt.plan_reference, subscriptionStatus: "ACTIVE", createdDate: periodStart,
  orders: [{ referenceCode: notice.orderReferenceCode, orderStatus: "SUCCESS", startPeriod: periodStart, endPeriod: periodEnd }],
};

function billingFixture(t, fetchProvider) {
  const rpcCalls = [];
  const requests = [];
  const events = new Map();
  const attempts = new Map([["checkout-1", { ...attempt }]]);
  const fixture = { events, rpcCalls, requests, attempts, local: null, tokens: ["checkout-1"], limit: async () => true };
  fixture.client = {
    async rpc(name, args) {
      rpcCalls.push([name, args]);
      switch (name) {
        case "get_iyzico_checkout": return { data: attempts.get(args.p_token) ?? null };
        case "get_pending_iyzico_checkout": return { data: [...attempts].find(([, item]) =>
          item.status === "pending" && item.business_id === args.p_business_id)?.[0] ?? null };
        case "list_pending_iyzico_checkouts": return { data: fixture.tokens.filter(token => token > args.p_after_token) };
        case "get_iyzico_subscription_plan": return { data: attempt.plan_reference };
        case "apply_iyzico_event": {
          const event = args.p_event;
          if (args.p_token) attempts.get(args.p_token).status = "completed";
          events.set(event.eventId, event);
          fixture.local = { ...attempt, provider_customer_id: event.providerCustomerId,
            current_period_start: event.currentPeriodStart, current_period_end: event.currentPeriodEnd };
          return { data: true };
        }
        default: assert.fail(name);
      }
    },
    from(table) {
      const query = { select: () => query, eq: (column, value) => {
        if (column === "provider_event_id") query.eventId = value;
        return query;
      }, maybeSingle: async () => ({ data: table === "subscriptions" ? fixture.local : events.get(query.eventId) ?? null }) };
      return query;
    },
  };
  globalThis.iyzicoTest = fixture;
  const originalEnv = process.env;
  process.env = { ...originalEnv, ...env, NODE_ENV: "test", VERCEL_ENV: "", DEPLOYMENT_ENV: "" };
  t.after(() => { delete globalThis.iyzicoTest; process.env = originalEnv; });
  t.mock.method(globalThis, "fetch", async (url, options) => {
    const path = new URL(url).pathname;
    requests.push(path);
    return fetchProvider(path, options);
  });
  return fixture;
}

const providerReply = data => Response.json({ status: "success", systemTime: periodStart + 1000, data });
const checkoutReply = (data, token) => Response.json({ status: "success", data, token });

function receiveNotice(body = notice) {
  const signed = [body.iyziEventType, body.subscriptionReferenceCode, body.orderReferenceCode ?? "", body.customerReferenceCode];
  const header = createHmac("sha256", env.IYZICO_SECRET_KEY)
    .update(env.IYZICO_MERCHANT_ID + env.IYZICO_SECRET_KEY + signed.join("")).digest("hex");
  return webhook(new Request("https://preview.example.test/api/billing/iyzico/webhook", {
    method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json", "X-IYZ-SIGNATURE-V3": header },
  }));
}

function receiveCallback(token = "checkout-1") {
  return callback(new Request("https://preview.example.test/api/billing/iyzico/callback", {
    method: "POST", body: new URLSearchParams({ token }),
  }));
}

test("a first webhook only settles the pending checkout with matching subscription, customer and plan", async t => {
  const other = { ...subscription, referenceCode: "sub-other" };
  const fixture = billingFixture(t, path => {
    if (path.endsWith("/checkout-other")) return checkoutReply(other);
    if (path.endsWith("/checkout-1")) return checkoutReply(subscription, "checkout-1");
    if (path.endsWith("/sub-other")) return providerReply(other);
    assert.match(path, /\/sub-123$/);
    return providerReply(subscription);
  });
  fixture.attempts.set("checkout-other", { ...attempt, business_id: "business-other" });
  fixture.tokens = ["checkout-other"];
  assert.equal((await receiveNotice()).status, 503);
  assert.equal(fixture.events.size, 0);
  fixture.attempts.set("checkout-1", { ...attempt, plan_reference: "pro-monthly" });
  fixture.tokens = ["checkout-1", "checkout-other"];
  assert.equal((await receiveNotice()).status, 503);
  assert.equal((await receiveNotice({ ...notice, customerReferenceCode: "customer-other" })).status, 503);
  assert.equal(fixture.events.size, 0);
  fixture.attempts.set("checkout-1", { ...attempt });
  assert.equal((await receiveNotice()).status, 204);
  assert.equal(fixture.attempts.get("checkout-other").status, "pending");
  assert.equal(fixture.attempts.get("checkout-1").status, "completed");
  assert.equal(fixture.events.get(verify(notice).eventId).businessId, attempt.business_id);
  const readCount = fixture.requests.length;
  assert.equal((await receiveNotice()).status, 204);
  assert.equal(fixture.requests.length, readCount);
});

test("billing reconciles an owner's pending token before loading the summary", async t => {
  const fixture = billingFixture(t, path => path.includes("checkoutform")
    ? checkoutReply(subscription) : providerReply(subscription));
  const provider = new IyzicoBillingProvider(readIyzicoConfig(env));
  assert.equal(await provider.reconcilePendingCheckout("business-other"), false);
  assert.equal(fixture.requests.length, 0);
  assert.equal(await provider.reconcilePendingCheckout(attempt.business_id), true);
  assert.equal(fixture.local.provider_customer_id, notice.customerReferenceCode);
  const page = await readFile(new URL("../src/app/(workspace)/billing/page.tsx", import.meta.url), "utf8");
  assert.match(page, /if \(owner && config\)[\s\S]+reconcilePendingCheckout\(business\.id\)[\s\S]+await getBillingSummary\(business\.id\)/);
});

test("terminal webhooks retry until the provider confirms the state and failed order", async t => {
  let snapshot = subscription;
  const fixture = billingFixture(t, () => providerReply(snapshot));
  fixture.local = { ...attempt, provider_customer_id: notice.customerReferenceCode };
  const failedOrder = { ...subscription.orders[0], referenceCode: "failed-order", orderStatus: "FAILED" };
  for (const [name, ready, localStatus] of [
    ["subscription.cancel", { subscriptionStatus: "CANCELED" }, "cancelled"],
    ["subscription.expired", { subscriptionStatus: "EXPIRED" }, "expired"],
    ["subscription.order.failure", { subscriptionStatus: "UNPAID", orders: [...subscription.orders, failedOrder] }, "past_due"],
  ]) {
    const body = { ...notice, iyziEventType: name, orderReferenceCode: name.endsWith("failure") ? failedOrder.referenceCode : "" };
    snapshot = subscription;
    assert.equal((await receiveNotice(body)).status, 503);
    if (name.endsWith("failure")) {
      snapshot = { ...subscription, subscriptionStatus: "UNPAID", orders: [...subscription.orders, { ...failedOrder, orderStatus: "SUCCESS" }] };
      assert.equal((await receiveNotice(body)).status, 503);
    }
    assert.equal([...fixture.events.values()].some(event => event.eventType === name), false);
    snapshot = { ...subscription, ...ready };
    assert.equal((await receiveNotice(body)).status, 204);
    assert.equal([...fixture.events.values()].find(event => event.eventType === name).status, localStatus);
  }
});

test("a first cancellation webhook settles a paid pending checkout without enabling it", async t => {
  let snapshot = subscription;
  const fixture = billingFixture(t, path => path.includes("checkoutform")
    ? checkoutReply(subscription) : providerReply(snapshot));
  const cancellation = { ...notice, iyziEventType: "subscription.cancel", orderReferenceCode: "" };
  assert.equal((await receiveNotice(cancellation)).status, 503);
  assert.equal(fixture.events.size, 0);
  assert.equal(fixture.attempts.get("checkout-1").status, "pending");
  snapshot = { ...subscription, subscriptionStatus: "CANCELED" };
  assert.equal((await receiveNotice(cancellation)).status, 204);
  assert.equal(fixture.attempts.get("checkout-1").status, "completed");
  assert.deepEqual([...fixture.events.values()].map(event => event.status), ["cancelled", "cancelled"]);
});

test("callback enforces both limits before token lookup and coalesces concurrent verification", async t => {
  const fixture = billingFixture(t, path => path.includes("checkoutform")
    ? checkoutReply(subscription) : providerReply(subscription));
  const limits = [];
  let blockedScope = "iyzico-callback-ip";
  fixture.limit = async (...args) => { limits.push(args); return args[0] !== blockedScope; };
  assert.equal((await receiveCallback()).status, 429);
  assert.deepEqual(limits, [["iyzico-callback-ip", 30]]);
  blockedScope = "iyzico-callback-token";
  assert.equal((await receiveCallback()).headers.get("Retry-After"), "60");
  assert.deepEqual(limits.at(-1), ["iyzico-callback-token", 10, 60, "checkout-1"]);
  assert.equal(fixture.rpcCalls.length, 0);
  assert.equal(fixture.requests.length, 0);
  blockedScope = null;
  const results = await Promise.all([receiveCallback(), receiveCallback()]);
  assert.ok(results.every(result => result.status === 303 && result.headers.get("Location").endsWith("/success")));
  assert.equal(fixture.rpcCalls.filter(([name]) => name === "get_iyzico_checkout").length, 1);
  assert.equal(fixture.requests.length, 2);
});

test("checkout initialization only identifies a field for a documented validation code", async t => {
  let errorCode = "25";
  billingFixture(t, path => {
    if (path.endsWith("/usta-monthly")) return providerReply({ referenceCode: "usta-monthly", price: 399,
      currencyCode: "TRY", status: "ACTIVE", paymentInterval: "MONTHLY", paymentIntervalCount: 1, planPaymentType: "RECURRING" });
    assert.match(path, /checkoutform\/initialize$/);
    return Response.json({ status: "failure", errorCode }, { status: 400 });
  });
  const provider = new IyzicoBillingProvider(readIyzicoConfig(env));
  const start = () => provider.createCheckoutSession({ businessId: "business-other", planId: "usta", interval: "monthly",
    amountKurus: 39900, currency: "TRY", billingDetails: { name: "Ada", surname: "Deniz", email: "ada@example.test", city: "İzmir", address: "Örnek 10" } });
  await assert.rejects(start(), error => error instanceof IyzicoAdditionalDetailsError && error.field === "phone");
  errorCode = "8";
  await assert.rejects(start(), error => error instanceof IyzicoAdditionalDetailsError && error.field === "identity");
  errorCode = "11";
  await assert.rejects(start(), error => !(error instanceof IyzicoAdditionalDetailsError) && /operation failed/.test(error.message));
});

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
    for (const name of [...baseline, "20261120000200_iyzico_billing.sql", "20261120000300_iyzico_reconcile.sql"]) {
      await db.exec(await readFile(new URL(name, folder), "utf8"));
    }
    await db.exec(`
      insert into auth.users(id,email) values ('00000000-0000-4000-8000-000000000101','owner@example.test');
      insert into public.businesses(id,owner_id,name) values ('${business}','00000000-0000-4000-8000-000000000101','Test');
      set role authenticated;
    `);
    await assert.rejects(db.query("select public.get_iyzico_checkout('checkout-1')"), /permission denied/);
    await assert.rejects(db.query("select public.list_pending_iyzico_checkouts('usta-monthly', now(), '')"), /permission denied/);
    await db.exec(`reset role; set role service_role; set request.jwt.claims = '{"role":"service_role"}'`);
    const reserve = async (token, plan = "usta") => (await db.query(
      "select public.save_iyzico_checkout($1,$2,$3,'monthly',$4,$5,now() + interval '30 minutes') as result",
      [business, token, plan, `${plan}-monthly`, `https://example.test/${token}`],
    )).rows[0].result;
    assert.equal(await reserve("checkout-1"), "https://example.test/checkout-1");
    assert.equal(await reserve("checkout-2"), "https://example.test/checkout-1");
    assert.equal(await reserve("checkout-3", "pro"), null);
    const list = async (plan, time, cursor = "") => (await db.query(
      "select public.list_pending_iyzico_checkouts($1,$2,$3) as result", [plan, time, cursor],
    )).rows[0].result;
    const time = (await db.query("select now() as time")).rows[0].time;
    assert.deepEqual(await list("usta-monthly", time), ["checkout-1"]);
    assert.deepEqual(await list("usta-monthly", new Date(time.getTime() + 3600_000)), []);
    assert.deepEqual(await list("pro-monthly", null), []);
    assert.deepEqual(await list("usta-monthly", null, "checkout-1"), []);

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
    assert.deepEqual(await list("usta-monthly", null), []);

    assert.equal(await apply({ ...event, status: "cancelled", eventId: "cancel:1", occurredAt: "2026-12-21T08:00:00Z" }), true);
    assert.equal(await reserve("checkout-5"), "https://example.test/checkout-5");
    const cancelledCheckout = { ...event, status: "cancelled", eventId: "checkout:5",
      providerSubscriptionId: "sub-cancelled", occurredAt: "2026-12-22T08:00:00Z" };
    assert.equal(await apply(cancelledCheckout, "checkout-5"), true);
    assert.equal((await db.query("select status from public.subscriptions")).rows[0].status, "cancelled");
    assert.deepEqual(await list("usta-monthly", null), []);
  } finally {
    await db.close();
  }
});
