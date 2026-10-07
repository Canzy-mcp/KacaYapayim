// Accept Turkish grouping/decimal notation and ungrouped decimal amounts.
export function parsePrice(value: string): number | null {
  const raw = value.trim().replace(/\s/g, "");
  if(raw.includes(",")&&!/^(?:\d+|\d{1,3}(?:\.\d{3})+),\d{1,2}$/.test(raw))return null;
  const normalized = raw.includes(",") ? raw.replace(/\./g, "").replace(",", ".") :
    /^\d{1,3}(?:\.\d{3})+$/.test(raw) ? raw.replace(/\./g, "") : raw;
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount <= 99999999999999.99 ? amount : null;
}
export function parseQuantity(value:string):number|null{
 const raw=value.trim().replace(/\s/g,"");
 if(!/^(?:\d+(?:[.,]\d{1,3})?|\d{1,3}(?:\.\d{3})+,\d{1,3})$/.test(raw))return null;
 const normalized=raw.includes(",")?raw.replace(/\./g,"").replace(",","."):raw;
 const number=Number(normalized);return Number.isFinite(number)&&number>0&&number<=1000000?number:null;
}
