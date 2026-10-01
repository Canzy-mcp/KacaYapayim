import test from "node:test";
import assert from "node:assert/strict";
import { normalizeTurkishPhone, formatTurkishPhone, formatCustomerDate, customerInitials } from "../src/lib/customers/format.ts";

test("Turkish customer phones normalize and display consistently", () => {
  for (const input of ["5321234567", "05321234567", "+905321234567", "0532 123 45 67"]) {
    assert.equal(normalizeTurkishPhone(input), "+905321234567");
  }
  assert.equal(formatTurkishPhone("+905321234567"), "0532 123 45 67");
  assert.equal(normalizeTurkishPhone("123"), null);
  assert.equal(normalizeTurkishPhone("+991234567890"), null);
});

test("Customer dates and initials use Turkish presentation", () => {
  assert.equal(formatCustomerDate("2026-09-29T12:00:00Z"), "29 Eylül 2026");
  assert.equal(customerInitials("Ahmet Yılmaz"), "AY");
  assert.equal(customerInitials("Işık Şen"), "IŞ");
});
