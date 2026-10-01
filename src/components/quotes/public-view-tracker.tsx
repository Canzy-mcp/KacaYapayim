"use client";

import { useEffect } from "react";

export function PublicViewTracker({ token, eventId }: { token: string; eventId: string }) {
  useEffect(() => {
    void fetch(`/api/public/quotes/${token}/view`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId }), cache: "no-store", keepalive: true,
    }).catch(() => {});
  }, [token, eventId]);
  return null;
}
