"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";

import {
  SPONSORED_HIDDEN_EVENT,
  SUPPORTER_EVENT,
  readSponsoredHidden,
  readStoredLicenseKey,
  readSupporter,
  writeSponsoredHidden,
  writeStoredLicenseKey,
  writeSupporter,
} from "~/lib/sponsored";

type Status = "idle" | "verifying" | "error";

/**
 * "Supporter" settings section: Gumroad license-key verification that marks
 * the user as a supporter. Renders inside the header ⋯ settings menu.
 *
 * Choice model: a successful verification sets `dawn_supporter="1"` and
 * persists the key itself (`dawn_tip_license_key`) — it does NOT hide the
 * strip automatically. The supporter then chooses: a "Hide sponsored strip"
 * toggle (default OFF) writes `dawn_sponsored_hidden`; the strip hides
 * immediately, and flipping the toggle back off shows it again.
 *
 * The input stays pre-filled with the stored key, with a copy button for
 * reuse on another device/app. The stored key is only ever sent to
 * /api/verify-tip on an explicit Verify click, never auto-submitted.
 *
 * Hydration-safe: localStorage is only read inside `useEffect`.
 */
export function SponsoredVerify() {
  const [mounted, setMounted] = useState(false);
  const [supporter, setSupporter] = useState(false);
  const [hideStrip, setHideStrip] = useState(false);
  const [key, setKey] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
    const sync = () => {
      setSupporter(readSupporter());
      setHideStrip(readSponsoredHidden());
    };
    sync();
    const stored = readStoredLicenseKey();
    if (stored) setKey(stored);
    window.addEventListener(SPONSORED_HIDDEN_EVENT, sync);
    window.addEventListener(SUPPORTER_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SPONSORED_HIDDEN_EVENT, sync);
      window.removeEventListener(SUPPORTER_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
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
        // Persist the key for pre-fill + copy, mark the device as a
        // supporter, and leave the strip as-is (no auto-hide).
        writeStoredLicenseKey(key.trim());
        writeSupporter(true);
        setSupporter(true);
        setStatus("idle");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const toggleHideStrip = (on: boolean) => {
    // The explicit choice: hiding also marks the device for future
    // supporter features; unhiding just shows the strip again.
    writeSponsoredHidden(on);
    setHideStrip(on);
  };

  return (
    <div className="text-sm text-zinc-800 dark:text-zinc-200">
      {supporter ? (
        <div>
          <p className="flex items-center gap-2">
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{ backgroundColor: "#F0A832", color: "#000000" }}
            >
              ☕ Supporter
            </span>
            <span>thanks for tipping!</span>
          </p>
          <button
            type="button"
            role="switch"
            aria-checked={hideStrip}
            aria-label="Hide sponsored strip"
            onClick={() => toggleHideStrip(!hideStrip)}
            className="mt-2 flex items-center gap-2"
          >
            <span
              aria-hidden="true"
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                hideStrip ? "bg-zinc-800 dark:bg-zinc-100" : "bg-zinc-300 dark:bg-zinc-600"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  hideStrip ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </span>
            <span className="text-sm text-zinc-800 dark:text-zinc-200">
              Hide sponsored strip
            </span>
          </button>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Supporters can hide the strip anytime.
          </p>
        </div>
      ) : (
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Tipped us on Gumroad? Enter the license key from your purchase receipt
          email to become a supporter.
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
        {!supporter && (
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
