export const taxLabels={unspecified:'KDV durumu belirtilmedi',included:'KDV dahil',excluded:'KDV hariç'} as const;
export type TaxMode=keyof typeof taxLabels;
// All newly rate-bearing quotes store the pre-tax price; legacy quotes have no rate.
export function quoteAmounts(price:number,mode:TaxMode='unspecified',rate:number|null=null){
 const subtotal=Math.round(price*100)/100;
 const tax=mode!=='unspecified'&&rate!==null&&Number.isFinite(rate)&&rate>=0&&rate<=100?Math.round(subtotal*rate)/100:0;
 return {subtotal,tax,total:Math.round((subtotal+tax)*100)/100,rate:mode==='unspecified'?null:rate};
}
