/**
 * PostHog product analytics — client-only, browser-only init.
 *
 * Single shared PostHog project (org "dawn studio", project ID 657661),
 * so EVERY event must carry the super property `app: "holdr"`.
 *
 * Rules:
 * - Never import this module from server code; init runs inside a
 *   "use client" provider's useEffect only (never at module scope).
 * - posthog-js is dynamically imported so SSR never evaluates it.
 * - Session replay OFF, autocapture OFF — only explicit track() calls plus
 *   automatic $pageview / $pageleave.
 * - NO PII in any event or property (no emails, names, symbols as raw
 *   identifiers, quantities, API keys, account numbers). Buckets or counts
 *   only.
 */

import type posthog from "posthog-js";

export const POSTHOG_APP = "holdr";

/** Public client keys — safe to embed in frontend bundles. */
const FALLBACK_KEY = "phc_Dn2EebGR8eVrLKfQwArtfwxE4cUKQq2NPhwMRph4LqUf";
const FALLBACK_HOST = "https://us.i.posthog.com";

const FIRST_OPEN_KEY = "dawn_ph_first_open";

type PostHogInstance = typeof posthog;

let ph: PostHogInstance | null = null;
let inited = false;

/** Bucket a count into a coarse, non-identifying range. */
export function countBucket(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "0";
  if (n < 10) return "1-9";
  if (n < 50) return "10-49";
  return "50+";
}

/**
 * Fire-and-forget analytics event. No-op until initAnalytics() has loaded
 * the SDK, and a no-op during SSR. The `app` super property is attached
 * to every event.
 */
export function track(
  event: string,
  props?: Record<string, string | number | boolean | undefined>,
): void {
  if (!ph) return;
  const clean: Record<string, string | number | boolean> = {
    app: POSTHOG_APP,
  };
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v !== undefined) clean[k] = v;
    }
  }
  ph.capture(event, clean);
}

function trackFirstOpen(): void {
  try {
    if (window.localStorage.getItem(FIRST_OPEN_KEY)) return;
    window.localStorage.setItem(FIRST_OPEN_KEY, "1");
  } catch {
    /* storage unavailable — still report the open */
  }
  const params = new URLSearchParams(window.location.search);
  const nonEmpty = (v: string | null): string | undefined =>
    v !== null && v !== "" ? v : undefined;
  track("app_first_open", {
    referrer: nonEmpty(document.referrer),
    utm_source: nonEmpty(params.get("utm_source")),
    locale: nonEmpty(window.navigator.language),
  });
}

/**
 * Initialize PostHog once, in the browser. Safe to call from a client
 * component's useEffect; repeated calls are no-ops.
 */
export function initAnalytics(): void {
  if (inited || typeof window === "undefined") return;
  inited = true;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? FALLBACK_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? FALLBACK_HOST;
  void import("posthog-js")
    .then((mod) => {
      ph = mod.default;
      ph.init(key, {
        api_host: host,
        autocapture: false,
        capture_pageview: true,
        capture_pageleave: true,
        // Session replay stays OFF (cost + privacy).
      });
      // CRITICAL: shared project — this super property keeps holdr's
      // data separable from the other apps.
      ph.register({ app: POSTHOG_APP });
      trackFirstOpen();
    })
    .catch(() => {
      /* analytics must never break the app */
    });
}
