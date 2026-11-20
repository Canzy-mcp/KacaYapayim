import { decimalUnits, divideHalfUp } from "./decimal.ts";

export const taxLabels={unspecified:'KDV durumu belirtilmedi',included:'KDV dahil',excluded:'KDV hariç'} as const;
export type TaxMode=keyof typeof taxLabels;
// With a rate, both included and excluded modes store the pre-tax price.
// Without a rate the stored price remains the customer total.
export function quoteAmounts(price:number,mode:TaxMode='unspecified',rate:number|null=null){
 const subtotal = decimalUnits(price, 2);
 const tax = mode !== "unspecified" && rate !== null && Number.isFinite(rate) && rate >= 0 && rate <= 100
   ? divideHalfUp(subtotal * decimalUnits(rate, 2), BigInt(10_000)) : BigInt(0);
 return { subtotal: Number(subtotal) / 100, tax: Number(tax) / 100, total: Number(subtotal + tax) / 100,
   rate: mode === "unspecified" ? null : rate };
}
