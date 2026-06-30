"use client";

import { useEffect } from "react";

interface WebVitalMetric {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  id: string;
  navigationType: string;
}

function sendToAnalytics(metric: WebVitalMetric) {
  // Send to your analytics endpoint
  if (typeof window !== "undefined" && navigator.sendBeacon) {
    try {
      const body = JSON.stringify({
        name: metric.name,
        value: metric.value.toFixed(2),
        rating: metric.rating,
        delta: metric.delta.toFixed(2),
        id: metric.id,
        navigationType: metric.navigationType,
        url: window.location.href,
        timestamp: Date.now(),
      });

      navigator.sendBeacon("/api/analytics/web-vitals", body);
    } catch {
      // Ignore sendBeacon errors
    }
  }

  // Also log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: metric.value.toFixed(2),
      rating: metric.rating,
      delta: metric.delta.toFixed(2),
    });
  }
}

export function WebVitals() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Dynamic import to avoid bundling web-vitals in production if not needed
    import("web-vitals").then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
      onCLS(sendToAnalytics);
      onFCP(sendToAnalytics);
      onLCP(sendToAnalytics);
      onTTFB(sendToAnalytics);
      onINP(sendToAnalytics);
    }).catch(() => {});
  }, []);

  return null;
}