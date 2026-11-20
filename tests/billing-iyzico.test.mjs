import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import { registerHooks } from "node:module";
import test from "node:test";
import { readBillingDetails } from "../src/lib/billing/details.ts";
import { ENTRY_FEE_KURUS, ENTRY_FEE_PRICE, fallbackPlans, isEntryRequiredMessage } from "../src/lib/billing/catalog.ts";
import { entryBasketId, hostedCheckoutUrl, iyzicoAuthHeaders, readIyzicoConfig, verifyCheckoutFormWebhook, verifyEntryPayment } from "../src/lib/billing/iyzico-protocol.ts";

const env = {
  BILLING_PROVIDER: "iyzico",
  APP_URL: "https://preview.example.test",
  IYZICO_ENV: "sandbox",
  IYZICO_API_KEY: "sandboxKey",
  IYZICO_SECRET_KEY: "sandboxSecret",
  IYZICO_MERCHANT_ID: "12345",
};
const business = "business-1";
const token = "checkout-1";
const payment = {
  status: "success", paymentStatus: "SUCCESS", paidPrice: 199, price: 199, currency: "TRY",
  basketId: entryBasketId(business), conversationId: entryBasketId(business), paymentId: 987654321, token,
};
const notice = {
  iyziEventType: "CHECKOUT_FORM_AUTH", iyziPaymentId: 987654321, token, paymentConversationId: entryBasketId(business),
  status: "SUCCESS", merchantId: "12345", iyziReferenceCode: "ref-1", iyziEventTime: 1795200000000,
};
const sign = (body, secret = env.IYZICO_SECRET_KEY) => createHmac("sha256", secret).update(
  secret + body.iyziEventType + body.iyziPaymentId + body.token + body.paymentConversationId + body.status).digest("hex");

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

const attempt = { business_id: business, plan_id: "pro", billing_interval: "once", plan_reference: "entry-fee", status: "pending" };

function billingFixture(t, fetchProvider) {
  const rpcCalls = [];
  const requests = [];
  const applied = [];
  const attempts = new Map([[token, { ...attempt }]]);
  const fixture = { rpcCalls, requests, applied, attempts, limit: async () => true };
  fixture.client = {
    async rpc(name, args) {
      rpcCalls.push([name, args]);
      switch (name) {
        case "get_iyzico_checkout": return { data: attempts.get(args.p_token) ?? null };
        case "get_pending_iyzico_checkout": return { data: [...attempts].find(([, item]) =>
          item.status === "pending" && item.business_id === args.p_business_id)?.[0] ?? null };
        case "apply_entry_fee_event":
          applied.push(args);
          attempts.get(args.p_token).status = "completed";
          return { data: true };
        case "save_iyzico_checkout": return { data: args.p_payment_url };
        default: assert.fail(name);
      }
    },
  };
  globalThis.iyzicoTest = fixture;
  const originalEnv = process.env;
  process.env = { ...originalEnv, ...env, NODE_ENV: "test", VERCEL_ENV: "", DEPLOYMENT_ENV: "" };
  t.after(() => { delete globalThis.iyzicoTest; process.env = originalEnv; });
  t.mock.method(globalThis, "fetch", async (url, options) => {
    const path = new URL(url).pathname;
    requests.push([path, options?.body ? JSON.parse(options.body) : null]);
    return fetchProvider(path, options);
  });
  return fixture;
}

const detail = data => Response.json({ status: "success", ...data });
const receiveCallback = (value = token) => callback(new Request("https://preview.example.test/api/billing/iyzico/callback", {
  method: "POST", body: new URLSearchParams({ token: value }),
}));
const receiveWebhook = (body = notice, header = sign(body)) => webhook(new Request("https://preview.example.test/api/billing/iyzico/webhook", {
  method: "POST", body: JSON.stringify(body), headers: { "Content-Type": "application/json", "X-IYZ-SIGNATURE-V3": header },
}));

test("the entry fee is a server constant of exactly 199 TL and the catalog agrees", () => {
  assert.equal(ENTRY_FEE_KURUS, 19900);
  assert.equal(ENTRY_FEE_PRICE, "199.00");
  const [free, member] = fallbackPlans;
  assert.equal(free.limits.monthly_quotes, 0);
  assert.equal(member.id, "pro");
  assert.equal(member.limits.monthly_quotes, null);
  assert.equal(member.monthly_price_kurus, ENTRY_FEE_KURUS);
});

test("checkout form verification rejects wrong status, amount, currency, basket and token", () => {
  assert.equal(verifyEntryPayment(payment, token, business), "987654321");
  assert.equal(verifyEntryPayment({ ...payment, paidPrice: "199.00", price: "199.00" }, token, business), "987654321");
  for (const change of [
    { status: "failure" }, { paymentStatus: "FAILURE" }, { paymentStatus: undefined }, { paidPrice: 198.99 }, { paidPrice: 1990 },
    { price: 100 }, { paidPrice: "abc" }, { currency: "USD" }, { basketId: "entry-business-2" },
    { conversationId: "other" }, { token: "other-token" }, { paymentId: "x1" }, { paymentId: undefined },
  ]) assert.equal(verifyEntryPayment({ ...payment, ...change }, token, business), null, JSON.stringify(change));
  assert.equal(verifyEntryPayment(payment, token, "business-2"), null);
  assert.equal(verifyEntryPayment(null, token, business), null);
});

test("callback activates only after iyzico itself confirms the exact payment, once", async t => {
  const fixture = billingFixture(t, () => detail(payment));
  const done = await receiveCallback();
  assert.equal(done.headers.get("Location"), "https://preview.example.test/billing/success");
  assert.equal(fixture.requests[0][0], "/payment/iyzipos/checkoutform/auth/ecom/detail");
  assert.equal(fixture.requests[0][1].token, token);
  assert.equal(fixture.applied.length, 1);
  const event = fixture.applied[0].p_event;
  assert.deepEqual([event.businessId, event.planId, event.status, event.providerSubscriptionId, event.currentPeriodEnd],
    [business, "pro", "active", "987654321", "2126-01-01T00:00:00.000Z"]);
  await receiveCallback();
  assert.equal(fixture.applied.length, 1, "repeat callback must not apply again");
  assert.equal(fixture.requests.length, 1);
});

test("callback leaves access closed for an unpaid, short, foreign-basket or unknown payment", async t => {
  let reply = detail({ ...payment, paymentStatus: "FAILURE" });
  const fixture = billingFixture(t, () => reply);
  const cancelled = response => response.headers.get("Location").endsWith("/billing/cancel");
  assert.ok(cancelled(await receiveCallback()));
  reply = detail({ ...payment, paidPrice: 1 });
  assert.ok(cancelled(await receiveCallback()));
  reply = detail({ ...payment, basketId: entryBasketId("business-2") });
  assert.ok(cancelled(await receiveCallback()));
  reply = Response.json({ status: "failure", errorCode: "1" }, { status: 400 });
  assert.ok(cancelled(await receiveCallback()));
  assert.ok(cancelled(await receiveCallback("unknown-token")));
  fixture.attempts.set("pro-monthly", { ...attempt, billing_interval: "monthly" });
  assert.ok(cancelled(await receiveCallback("pro-monthly")));
  assert.equal(fixture.applied.length, 0);
});

test("callback enforces both limits before token lookup and coalesces concurrent verification", async t => {
  const fixture = billingFixture(t, () => detail(payment));
  const limits = [];
  let blockedScope = "iyzico-callback-ip";
  fixture.limit = async (...args) => { limits.push(args); return args[0] !== blockedScope; };
  assert.equal((await receiveCallback()).status, 429);
  assert.deepEqual(limits, [["iyzico-callback-ip", 30]]);
  blockedScope = "iyzico-callback-token";
  assert.equal((await receiveCallback()).headers.get("Retry-After"), "60");
  assert.equal(fixture.rpcCalls.length, 0);
  blockedScope = null;
  const results = await Promise.all([receiveCallback(), receiveCallback()]);
  assert.ok(results.every(result => result.status === 303 && result.headers.get("Location").endsWith("/success")));
  assert.equal(fixture.rpcCalls.filter(([name]) => name === "get_iyzico_checkout").length, 1);
  assert.equal(fixture.requests.length, 1);
});

test("CF webhook signature is HMAC-SHA256 over secret + eventType + paymentId + token + conversationId + status", () => {
  assert.ok(verifyCheckoutFormWebhook(notice, sign(notice), env.IYZICO_SECRET_KEY));
  assert.equal(verifyCheckoutFormWebhook(notice, sign(notice).toUpperCase(), env.IYZICO_SECRET_KEY)?.token, token);
  assert.equal(verifyCheckoutFormWebhook(notice, null, env.IYZICO_SECRET_KEY), null);
  assert.equal(verifyCheckoutFormWebhook(notice, "z".repeat(64), env.IYZICO_SECRET_KEY), null);
  assert.equal(verifyCheckoutFormWebhook(notice, sign(notice, "otherSecret"), env.IYZICO_SECRET_KEY), null);
  for (const change of [{ status: "FAILURE" }, { token: "other" }, { iyziPaymentId: 1 }, { paymentConversationId: "x" }, { iyziEventType: "OTHER" }]) {
    assert.equal(verifyCheckoutFormWebhook({ ...notice, ...change }, sign(notice), env.IYZICO_SECRET_KEY), null, JSON.stringify(change));
  }
  assert.equal(verifyCheckoutFormWebhook({ ...notice, token: undefined }, sign(notice), env.IYZICO_SECRET_KEY), null);
  // Fields outside the signed set do not matter.
  assert.ok(verifyCheckoutFormWebhook({ ...notice, iyziReferenceCode: "changed", iyziEventTime: 1 }, sign(notice), env.IYZICO_SECRET_KEY));
});

test("webhook route: bad signature is 401, a signed SUCCESS re-reads the payment, other statuses do nothing", async t => {
  const fixture = billingFixture(t, () => detail(payment));
  assert.equal((await receiveWebhook(notice, "0".repeat(64))).status, 401);
  assert.equal((await receiveWebhook({ ...notice, status: "FAILURE" })).status, 204);
  assert.equal(fixture.requests.length, 0);
  assert.equal((await receiveWebhook()).status, 204);
  assert.equal(fixture.requests.length, 1, "payment is retrieved from iyzico, not trusted from the body");
  assert.equal(fixture.applied.length, 1);
  assert.equal((await receiveWebhook()).status, 204);
  assert.equal(fixture.applied.length, 1);
});

test("a signed webhook cannot activate a payment that iyzico does not confirm", async t => {
  const fixture = billingFixture(t, () => detail({ ...payment, paymentStatus: "FAILURE" }));
  assert.equal((await receiveWebhook()).status, 204);
  assert.equal(fixture.applied.length, 0);
});

test("initialization charges the server constant and stores a one-time attempt", async t => {
  const fixture = billingFixture(t, path => {
    assert.equal(path, "/payment/iyzipos/checkoutform/initialize/auth/ecom");
    return Response.json({ status: "success", token: "new-token", paymentPageUrl: "https://sandbox-cpp.iyzipay.com/?token=new-token&lang=tr" });
  });
  fixture.attempts.clear();
  const provider = new IyzicoBillingProvider(readIyzicoConfig(env));
  const result = await provider.createEntryCheckout({ businessId: business, ip: "203.0.113.5",
    billingDetails: { name: "Ada", surname: "Deniz", email: "ada@example.test", city: "İzmir", address: "Örnek 10", gsmNumber: "+905550000000", identityNumber: "11111111110" } });
  assert.equal(result.url, "https://sandbox-cpp.iyzipay.com/?token=new-token&lang=tr");
  const [, body] = fixture.requests[0];
  assert.equal(body.price, "199.00");
  assert.equal(body.paidPrice, "199.00");
  assert.equal(body.currency, "TRY");
  assert.equal(body.basketId, entryBasketId(business));
  assert.equal(body.callbackUrl, "https://preview.example.test/api/billing/iyzico/callback");
  assert.deepEqual(body.basketItems.map(item => [item.itemType, item.price]), [["VIRTUAL", "199.00"]]);
  const save = fixture.rpcCalls.find(([name]) => name === "save_iyzico_checkout")[1];
  assert.deepEqual([save.p_plan_id, save.p_interval, save.p_plan_reference], ["pro", "once", "entry-fee"]);
});

test("checkout initialization only identifies a field for a documented validation code", async t => {
  let errorCode = "25";
  const fixture = billingFixture(t, () => Response.json({ status: "failure", errorCode }, { status: 400 }));
  fixture.attempts.clear();
  const provider = new IyzicoBillingProvider(readIyzicoConfig(env));
  const start = () => provider.createEntryCheckout({ businessId: "business-other", billingDetails: {
    name: "Ada", surname: "Deniz", email: "ada@example.test", city: "İzmir", address: "Örnek 10", gsmNumber: "+905550000000", identityNumber: "11111111110" } });
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

test("iyzico needs only API credentials and APP_URL, and blocks sandbox on production", () => {
  for (const key of Object.keys(env)) assert.equal(readIyzicoConfig({ ...env, [key]: "" }), null, key);
  assert.ok(readIyzicoConfig(env));
  assert.equal(readIyzicoConfig({ ...env, NODE_ENV: "production" }), null);
  assert.equal(readIyzicoConfig({ ...env, VERCEL_ENV: "production", DEPLOYMENT_ENV: "staging" }), null);
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

test("billing details require identity and phone and validate lengths", () => {
  const form = new FormData();
  for (const [name, value] of Object.entries({ name: " Ada ", surname: "Deniz", email: "ada@example.test", city: "İzmir", address: "Örnek Mahallesi 10" })) {
    form.set(name, value);
  }
  assert.equal(readBillingDetails(form), null);
  form.set("identityNumber", "1234");
  form.set("gsmNumber", "+90 (555) 000 00 00");
  assert.equal(readBillingDetails(form), null);
  form.set("identityNumber", "1234567890");
  const details = readBillingDetails(form);
  assert.equal(details.name, "Ada");
  assert.equal(details.gsmNumber, "+905550000000");
  form.set("address", "x".repeat(301));
  assert.equal(readBillingDetails(form), null);
});

test("entry-required errors map to the new message on every gated surface", async () => {
  assert.ok(isEntryRequiredMessage("BILLING_ENTRY_REQUIRED"));
  assert.ok(isEntryRequiredMessage("BILLING_QUOTE_LIMIT"));
  assert.ok(!isEntryRequiredMessage("MARKET_ACCESS"));
  const read = path => readFile(new URL(`../${path}`, import.meta.url), "utf8");
  assert.match(await read("src/app/actions/quotes.ts"), /BILLING_ENTRY_REQUIRED[\s\S]+BILLING_ENTRY_REQUIRED_MESSAGE, needsUpgrade: true/);
  assert.match(await read("src/app/actions/marketplace.ts"), /isEntryRequiredMessage\(error\.message\)[\s\S]+needsEntry: true/);
  assert.match(await read("src/components/marketplace/form.tsx"), /state\.needsEntry[\s\S]+href="\/billing"/);
  assert.match(await read("src/components/billing/upgrade-modal.tsx"), /199 ₺ tek seferlik/);
  const migration = await read("supabase/migrations/20261120000500_entry_fee.sql");
  assert.match(migration, /BILLING_ENTRY_REQUIRED[\s\S]+BILLING_ENTRY_REQUIRED/);
  assert.match(migration, /'once'/);
  assert.match(migration, /grandfathered-/);
  const page = await read("src/app/(workspace)/billing/page.tsx");
  assert.match(page, /if \(owner && config\)[\s\S]+reconcilePendingCheckout\(business\.id\)[\s\S]+await getBillingSummary\(business\.id\)/);
});
