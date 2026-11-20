import "server-only";
import { IyzicoBillingProvider } from "./iyzico";
import { readIyzicoConfig } from "./iyzico-protocol";

export type BillingDetails = {
  name: string;
  surname: string;
  email: string;
  city: string;
  address: string;
  gsmNumber: string;
  identityNumber: string;
};

export class BillingProviderUnavailableError extends Error {
  constructor() { super("Üyelik ödemesi henüz kullanıma açılmadı."); }
}

export function billingAvailable(env = process.env): boolean {
  return readIyzicoConfig(env) !== null;
}

export function getBillingProvider(): IyzicoBillingProvider {
  const config = readIyzicoConfig(process.env);
  if (!config) throw new BillingProviderUnavailableError();
  return new IyzicoBillingProvider(config);
}
