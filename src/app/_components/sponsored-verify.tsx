"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

import {
  readSponsoredHidden,
  readStoredLicenseKey,
  writeSponsoredHidden,
  writeStoredLicenseKey,
} from "~/lib/sponsored";

type Status = "idle" | "verifying" | "error";

/**
 * "Sponsored strip" settings section: Gumroad license-key verification that
 * hides the SponsoredStrip. Renders inside the header ⋯ settings menu.
 *
 * After a successful verification the key itself is persisted
 * (`dawn_tip_license_key`) and the input stays pre-filled, with a copy
 * button for reuse on another device/app. "Show again" clears only the
 * `dawn_sponsored_hidden` flag — the stored key survives, so re-hiding is
 * one Verify click. The stored key is only ever sent to /api/verify-tip on
 * an explicit Verify click, never auto-submitted.
 *
 * Hydration-safe: localStorage is only read inside `useEffect`.
 */
export function SponsoredVerify() {
  const [mounted, setMounted] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [key, setKey] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHidden(readSponsoredHidden());
    const stored = readStoredLicenseKey();
    if (stored) setKey(stored);
  }, []);

  if (!mounted) return null;

  const copyKey = async () => {
    if (!key) return;
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(key);
        ok = true;
      }
    } catch {
      /* fall through to the legacy fallback */
    }
    if (!ok) {
      try {
        const ta = document.createElement("textarea");
        ta.value = key;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        /* clipboard unavailable */
      }
    }
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const verify = async () => {
    if (status === "verifying") return;
    setStatus("verifying");
    try {
      const res = await fetch("/api/verify-tip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey: key }),
      });
      const data = (await res.json()) as { ok?: boolean };
      if (data.ok === true) {
        // Persist the key for pre-fill + copy, then hide the strip.
        writeStoredLicenseKey(key.trim());
        writeSponsoredHidden(true);
        setHidden(true);
        setStatus("idle");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const showAgain = () => {
    // Clears ONLY the hidden flag; the stored key stays pre-filled below.
    writeSponsoredHidden(false);
    setHidden(false);
  };

  return (
    <div className="text-sm text-zinc-800 dark:text-zinc-200">
      {hidden ? (
        <div>
          <p>☕ Thanks for tipping — the sponsored strip is hidden.</p>
          <button
            type="button"
            onClick={showAgain}
            className="mt-1 text-xs text-zinc-500 underline hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            Show again
          </button>
        </div>
      ) : (
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Tipped us on Gumroad? Enter the license key from your purchase receipt
          email to hide the sponsored strip.
        </p>
      )}
      <div className="mt-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
        Your license key
      </div>
      <div className="mt-1 flex gap-1.5">
        <input
          type="text"
          value={key}
          onChange={(e) => {
            setKey(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") void verify();
          }}
          placeholder="License key"
          autoComplete="off"
          spellCheck={false}
          disabled={status === "verifying"}
          aria-label="License key"
          className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          type="button"
          onClick={() => void copyKey()}
          disabled={!key}
          title={copied ? "Copied" : "Copy license key"}
          aria-label="Copy license key"
          className="flex shrink-0 items-center gap-1 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm text-zinc-700 disabled:opacity-40 dark:border-zinc-600 dark:text-zinc-300"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          <span className="sr-only" aria-live="polite">
            {copied ? "Copied" : ""}
          </span>
        </button>
        {!hidden && (
          <button
            type="button"
            onClick={() => void verify()}
            disabled={status === "verifying" || key.trim().length === 0}
            className="shrink-0 rounded-lg bg-zinc-800 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {status === "verifying" ? "…" : "Verify"}
          </button>
        )}
      </div>
      {status === "error" && (
        <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
          That key didn&apos;t verify — check the license key in your Gumroad
          receipt email.
        </p>
      )}
    </div>
  );
}
