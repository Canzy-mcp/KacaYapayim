"use client";
import { useRouter } from "next/navigation";
import { PricingStep } from "@/components/jobs/pricing-step";
import type { Job } from "@/types/database";

export function ProfessionPricing({ job, customerName }: { job: Job; customerName: string }) {
  const router = useRouter();
  return <PricingStep job={job} cost={job.estimated_cost} customerName={customerName}
    onEdit={() => router.push(`/new-quote?job_id=${job.id}`)} onBack={() => router.push(`/jobs/${job.id}`)} />;
}
