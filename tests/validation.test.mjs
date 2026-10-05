import test from "node:test";
import assert from "node:assert/strict";
import { emailError, marginErrors, parseMargin, passwordError } from "../src/lib/validation.ts";

test("business margins match the pricing limits without silent coercion", () => {
  assert.deepEqual(marginErrors(1, 0), {});
  assert.deepEqual(marginErrors(90, 89), {});
  assert.deepEqual(marginErrors(30, 20), {});
});

test("profit margins reject missing, out-of-range and inverted values", () => {
  assert.ok(marginErrors(parseMargin(null), 20).target);
  assert.ok(marginErrors(91, 20).target);
  assert.ok(marginErrors(0, 0).target);
  assert.ok(marginErrors(0.5, 0).target);
  assert.ok(marginErrors(90, 90).minimum);
  assert.ok(marginErrors(30, -1).minimum);
  assert.ok(marginErrors(20, 30).minimum);
});

test("auth inputs reject malformed email and short passwords", () => {
  assert.ok(emailError("invalid"));
  assert.equal(emailError("usta@example.com"), "");
  assert.ok(passwordError("1234567"));
  assert.equal(passwordError("12345678"), "");
});
