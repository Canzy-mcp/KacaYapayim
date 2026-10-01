export type PricingStatus = "target" | "acceptable" | "below_minimum" | "loss";

export type PricingResult = {
  estimatedCost: number;
  targetMargin: number;
  minimumMargin: number;
  exactRecommendedPrice: number;
  roundedRecommendedPrice: number;
  exactMinimumPrice: number;
  minimumPrice: number;
  selectedPrice: number;
  profit: number;
  profitMargin: number | null;
  status: PricingStatus;
};

export function validateMargins(target: number, minimum: number) {
  return Number.isFinite(target) && Number.isFinite(minimum) && target > 0 && target <= 90 &&
    minimum >= 0 && minimum <= 89 && minimum <= target;
}

export function calculatePriceForMargin(cost: number, margin: number) {
  if (!Number.isFinite(cost) || cost < 0 || !Number.isFinite(margin) || margin < 0 || margin >= 100)
    throw new Error("Geçersiz maliyet veya kâr marjı.");
  return cost / (1 - margin / 100);
}

export function roundSuggestedPrice(price: number, step = 100) {
  if (!Number.isFinite(price) || price < 0 || !Number.isFinite(step) || step <= 0)
    throw new Error("Geçersiz fiyat veya yuvarlama adımı.");
  // Small floating point noise at an exact step must not add a whole step.
  return Math.ceil((price - 1e-8) / step) * step;
}

export function calculateProfit(cost: number, sale: number) {
  return Math.round((sale - cost) * 100) / 100;
}

// Percent units throughout: 30 means 30%, rather than 0.30.
export function calculateProfitMargin(cost: number, sale: number) {
  return sale === 0 ? null : (sale - cost) / sale * 100;
}

export function calculatePricingStatus(cost: number, sale: number, target: number, minimum: number): PricingStatus {
  if (sale < cost) return "loss";
  const margin = calculateProfitMargin(cost, sale) ?? 0;
  if (margin + 1e-9 < minimum) return "below_minimum";
  if (margin + 1e-9 < target) return "acceptable";
  return "target";
}

export function calculatePricingSummary(cost: number, target: number, minimum: number, selectedPrice?: number): PricingResult {
  if (!validateMargins(target, minimum)) throw new Error("Kâr marjlarını kontrol et.");
  if (!Number.isFinite(cost) || cost < 0) throw new Error("Geçersiz maliyet.");
  const exactRecommendedPrice = calculatePriceForMargin(cost, target);
  const exactMinimumPrice = calculatePriceForMargin(cost, minimum);
  const roundedRecommendedPrice = roundSuggestedPrice(exactRecommendedPrice);
  const minimumPrice = roundSuggestedPrice(exactMinimumPrice);
  const sale = selectedPrice ?? roundedRecommendedPrice;
  if (!Number.isFinite(sale) || sale < 0 || Math.abs(Math.round(sale * 100) - sale * 100) > 1e-6)
    throw new Error("Teklif fiyatını kontrol et.");
  return { estimatedCost: cost, targetMargin: target, minimumMargin: minimum,
    exactRecommendedPrice, roundedRecommendedPrice, exactMinimumPrice, minimumPrice,
    selectedPrice: sale, profit: calculateProfit(cost, sale), profitMargin: calculateProfitMargin(cost, sale),
    status: calculatePricingStatus(cost, sale, target, minimum) };
}
