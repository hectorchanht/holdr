"use client";

import { useEffect, useState } from "react";

import {
  REFERRAL_LINKS,
  SPONSORED_HIDDEN_EVENT,
  TIP_JAR_URL,
  readSponsoredHidden,
} from "~/lib/sponsored";

/**
 * Slim sponsored strip: the first content block under the app header.
 *
 * V2: no dismiss (×) button. The strip renders nothing when the
 * `dawn_sponsored_hidden` flag is set — that flag is only writable through
 * the "Sponsored strip" settings section after Gumroad license verification.
 *
 * Hydration-safe: `localStorage` is only read inside `useEffect`, and the
 * strip renders nothing until that check has run — no server/client mismatch.
 * A same-tab event + cross-tab "storage" event re-sync the flag live.
 */
export function SponsoredStrip() {
  const [mounted, setMounted] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setMounted(true);
    const sync = () => setHidden(readSponsoredHidden());
    sync();
    window.addEventListener(SPONSORED_HIDDEN_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SPONSORED_HIDDEN_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  if (!mounted || hidden) return null;
  // The tip jar is always set; if it ever goes empty the strip renders nothing.
  if (!TIP_JAR_URL && REFERRAL_LINKS.length === 0) return null;

  return (
    <div
      role="complementary"
      aria-label="Sponsored"
      className="flex flex-nowrap items-center gap-2 overflow-x-auto px-1 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
        Sponsored
      </span>
      <a
        href={TIP_JAR_URL}
        target="_blank"
        rel="noopener"
        className="shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold"
        style={{ backgroundColor: "#F0A832", color: "#000000" }}
      >
        ☕ Tip jar
      </a>
      {REFERRAL_LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel={link.rel}
          className="shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium"
          style={{ backgroundColor: link.bg, color: link.fg }}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}
