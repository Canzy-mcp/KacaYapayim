import { redirect } from "next/navigation";
export default async function NewJobAlias({ searchParams }: { searchParams: Promise<{ customer_id?: string }> }) {
  const { customer_id } = await searchParams;
  redirect(`/new-quote${customer_id ? `?customer_id=${encodeURIComponent(customer_id)}` : ""}`);
}
