export function decimalUnits(value: number, places: number): bigint {
  const [decimal, exponent = "0"] = Math.abs(value).toString().split("e");
  const [whole, fraction = ""] = decimal.split(".");
  const digits = BigInt(whole + fraction);
  const shift = places + Number(exponent) - fraction.length;
  const base = BigInt(10);
  const rounded = shift >= 0 ? digits * base ** BigInt(shift) : divideHalfUp(digits, base ** BigInt(-shift));
  return value < 0 ? -rounded : rounded;
}

export function divideHalfUp(value: bigint, divisor: bigint): bigint {
  const half = divisor / BigInt(2);
  return (value < BigInt(0) ? value - half : value + half) / divisor;
}

export function lineTotal(quantity: number, unitCost: number): number {
  return Number(divideHalfUp(decimalUnits(quantity, 4) * decimalUnits(unitCost, 2), BigInt(10_000))) / 100;
}
