"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { REFERRAL_LINKS, TIP_JAR_URL } from "~/lib/sponsored";

/** localStorage flag: "1" = the user hid the strip (honor-system gesture for tippers). */
const HIDDEN_KEY = "dawn_sponsored_hidden";

/**
 * Slim sponsored strip: the first content block under the app header.
 *
 * Hydration-safe: `localStorage` is only read inside `useEffect`, and the
 * strip renders nothing until that check has run — no server/client mismatch.
 * Dismiss is an honor-system gesture, NOT license verification: no restore UI.
 */
export function SponsoredStrip() {
  const [mounted, setMounted] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (localStorage.getItem(HIDDEN_KEY) === "1") setHidden(true);
  }, []);

  if (!mounted || hidden) return null;
  // The tip jar is always set; if it ever goes empty the strip renders nothing.
  if (!TIP_JAR_URL && REFERRAL_LINKS.length === 0) return null;

  const hide = () => {
    localStorage.setItem(HIDDEN_KEY, "1");
    setHidden(true);
  };

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
      <button
        type="button"
        onClick={hide}
        aria-label="Hide the sponsored strip"
        title="Tipped? Hide the sponsored strip"
        className="shrink-0 rounded-full p-1 text-zinc-500 opacity-40 transition-opacity hover:opacity-100"
      >
        <X size={12} />
      </button>
    </div>
  );
}
