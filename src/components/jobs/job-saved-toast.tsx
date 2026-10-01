"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Toast } from "@/components/ui/toast";
export function JobSavedToast({ id }: { id: string }) {
  const router = useRouter();
  const [visible, setVisible] = useState(true);
  useEffect(() => { router.replace(`/jobs/${id}`, { scroll: false }); }, [id, router]);
  return visible ? <Toast message="İş kaydedildi." kind="success" onClose={() => setVisible(false)} /> : null;
}
