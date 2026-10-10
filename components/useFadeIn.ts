"use client";

import { useEffect } from "react";

export function useFadeIn(revision?: string) {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));

    const markVisible = (el: HTMLElement) => {
      el.classList.add("visible");
      el.setAttribute("data-revealed", "true");
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      elements.forEach(markVisible);
      return;
    }

    document.documentElement.classList.add("motion-ready");

    elements.forEach((element) => {
      if (element.getAttribute("data-revealed") === "true") {
        element.classList.add("visible");
        return;
      }
      const rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        markVisible(element);
      }
    });

    const observer = new IntersectionObserver((entries, activeObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          markVisible(entry.target as HTMLElement);
          activeObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05, rootMargin: "50px 0px 50px 0px" });

    elements.forEach((element) => {
      if (!element.classList.contains("visible") && element.getAttribute("data-revealed") !== "true") {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [revision]);
}

