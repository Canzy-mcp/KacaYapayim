import type { BillingDetails } from "./provider";

export function readBillingDetails(form: FormData): BillingDetails | null {
  const read = (key: string) => {
    const value = form.get(key);
    return typeof value === "string" ? value.trim() : "";
  };
  const name = read("name");
  const surname = read("surname");
  const email = read("email");
  const city = read("city");
  const address = read("address");
  const identityNumber = read("identityNumber");
  const gsmNumber = read("gsmNumber").replace(/[ ()-]/g, "");
  if (!name || name.length > 80 || !surname || surname.length > 80 ||
    !city || city.length > 80 || address.length < 5 || address.length > 300 ||
    email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !/^\d{10,11}$/.test(identityNumber) || !/^\+[1-9]\d{7,14}$/.test(gsmNumber)) return null;
  return { name, surname, email, city, address, identityNumber, gsmNumber };
}
