"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Progressive enhancement: server content stays visible if JS is unavailable. */
export function MarketingMotion() {
  const pathname = usePathname();
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!('IntersectionObserver' in window) || preference.matches) return;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.remove("reveal-pending");
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.08, rootMargin: "0px 0px -24px 0px" });
    for (const element of elements) {
      if (element.getBoundingClientRect().top < window.innerHeight) continue;
      element.classList.add("reveal-pending");
      observer.observe(element);
    }
    const disable = () => {
      if (!preference.matches) return;
      observer.disconnect();
      elements.forEach(element => element.classList.remove("reveal-pending"));
    };
    preference.addEventListener("change", disable);
    return () => { observer.disconnect(); preference.removeEventListener("change", disable);
      elements.forEach(element => element.classList.remove("reveal-pending")); };
  }, [pathname]);
  return null;
}

