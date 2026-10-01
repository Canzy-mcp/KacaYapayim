import { notFound } from "next/navigation";
import { CustomerForm } from "@/components/customers/customer-form";
import { getCustomerById } from "@/lib/customers/service";
export const metadata = { title: "Müşteriyi Düzenle" };
export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await getCustomerById(id);
  if (!customer) notFound();
  return <CustomerForm customer={customer} />;
}
