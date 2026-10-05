import type { Business, Customer, Quote, QuoteExclusion, QuoteItem, QuoteStatus } from "../../types/database.ts";

function dateInIstanbul(timestamp: string) {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Istanbul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(timestamp));
}

export type CustomerQuotePreview = {
  business: { name: string; logoUrl: string | null; phone: string | null; city: string | null };
  customer: { name: string; companyName: string | null } | null;
  quoteNumber: string;
  date: string;
  validUntil: string;
  title: string;
  description: string | null;
  items: Array<{ name: string; description: string | null }>;
  exclusions: string[];
  estimatedDuration: string | null;
  salePrice: number;
  currency: string;
  paymentTerms: string | null;
  notes: string | null;
  taxRate?:number|null;
  taxMode?: "unspecified" | "included" | "excluded";
  showBranding?: boolean;
};
export type PublicQuote = CustomerQuotePreview & { status: QuoteStatus;packageOptions?:Array<{token:string;title:string;description:string|null;salePrice:number;taxRate?:number|null;taxMode?:"unspecified"|"included"|"excluded";status:QuoteStatus}> };

// Explicit projection prevents cost, profit, margin and internal cost lines from
// entering the customer-facing component's props or future public DTO.
export function toCustomerQuotePreview(input: {
  business: Business; customer: Customer | null; quote: Quote;
  items: QuoteItem[]; exclusions: QuoteExclusion[]; showBranding?: boolean; showLogo?: boolean;
}): CustomerQuotePreview {
  const { business, customer, quote, items, exclusions } = input;
  return {
    business: { name: business.name, logoUrl: input.showLogo ? business.logo_url : null, phone: business.phone, city: business.city },
    customer: customer ? { name: customer.name, companyName: customer.company_name } : null,
    quoteNumber: quote.quote_number, date: dateInIstanbul(quote.created_at), validUntil: quote.valid_until,
    title: quote.title, description: quote.description,
    items: items.map(({ name, description }) => ({ name, description })),
    exclusions: exclusions.map(({ text }) => text), estimatedDuration: quote.estimated_duration_text,
    taxRate:quote.tax_rate??null,taxMode: quote.tax_mode ?? "unspecified", salePrice: quote.sale_price, currency: quote.currency,
    paymentTerms: quote.payment_terms, notes: quote.notes, showBranding: input.showBranding ?? true,
  };
}
