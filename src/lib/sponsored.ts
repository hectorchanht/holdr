/**
 * Central config for the Sponsored strip shown at the top of the app.
 *
 * Conventions:
 * - The tip jar is Hector's own product: always set, linked with `rel="noopener"`.
 * - Everything else is a referral partner: linked with `rel="noopener sponsored"`.
 * - An empty-string URL renders NOTHING. When Hector pastes a real link into
 *   one of the placeholders below, its button appears in the strip automatically.
 * - If every URL were empty the strip would render nothing — but the tip jar
 *   URL is always set, so in practice the strip always has content.
 */

export interface SponsorLink {
  /** Destination URL. */
  href: string;
  /** Button label. */
  label: string;
  /** Button background color (hex). */
  bg: string;
  /** Button text color (hex). */
  fg: string;
  /** Link relationship attribute. */
  rel: string;
}

/** Gumroad tip jar for the app itself. Always set. */
export const TIP_JAR_URL = "https://dawnlimited.gumroad.com/l/holdr-tip";

/** Referral partner URLs. Leave "" to hide until a real link is pasted. */
export const WISE_URL = "https://wise.com/invite/dic/hotungc3";
export const COINBASE_URL =
  "https://advanced.coinbase.com/join/F95MLKD?src=referral-link";
export const BINANCE_URL =
  "https://www.binance.com/activity/referral-entry/CPA?ref=CPA_0027L6WVRQ";
/** Empty placeholders — render nothing until Hector pastes real links. */
export const AIRALO_URL = "";
export const KOINLY_URL = "";
export const AIRWALLEX_URL = "";

/** hasXLink()-style guards: a link only renders when its URL is non-empty. */
export const hasWiseLink = () => WISE_URL.length > 0;
export const hasCoinbaseLink = () => COINBASE_URL.length > 0;
export const hasBinanceLink = () => BINANCE_URL.length > 0;
export const hasAiraloLink = () => AIRALO_URL.length > 0;
export const hasKoinlyLink = () => KOINLY_URL.length > 0;
export const hasAirwallexLink = () => AIRWALLEX_URL.length > 0;

const referral = (
  href: string,
  label: string,
  bg: string,
  fg: string,
): SponsorLink | null =>
  href ? { href, label, bg, fg, rel: "noopener sponsored" } : null;

/**
 * Ordered referral links, empty URLs dropped. The tip jar is handled
 * separately (it is Hector's own product, not a sponsored referral).
 */
export const REFERRAL_LINKS: SponsorLink[] = (
  [
    referral(WISE_URL, "Wise · Send money abroad", "#9FE870", "#000000"),
    referral(COINBASE_URL, "Coinbase · Buy crypto", "#0052FF", "#FFFFFF"),
    referral(BINANCE_URL, "Binance · Trade on Binance", "#F0B90B", "#000000"),
    referral(AIRALO_URL, "Airalo", "#1a73e8", "#FFFFFF"),
    referral(KOINLY_URL, "Koinly", "#7136d6", "#FFFFFF"),
    referral(AIRWALLEX_URL, "Airwallex", "#5a2bd9", "#FFFFFF"),
  ] as (SponsorLink | null)[]
).filter((l): l is SponsorLink => l !== null);

/* ------------------------------------------------------------------ */
/* Sponsored-strip hide flag (choice model: explicit supporter toggle). */
/* ------------------------------------------------------------------ */

/**
 * localStorage flag: "1" = the strip is hidden. Only writable through the
 * "Supporter" settings section's explicit "Hide sponsored strip" toggle,
 * which is only available to verified supporters (Gumroad tip or admin key
 * via /api/verify-tip).
 */
export const SPONSORED_HIDDEN_KEY = "dawn_sponsored_hidden";

/**
 * Window event dispatched in the same tab whenever the flag changes, so
 * already-mounted components (the strip, the settings section) re-read it.
 * The "storage" event covers cross-tab changes.
 */
export const SPONSORED_HIDDEN_EVENT = "dawn:sponsored-hidden-changed";

/** Read the flag. Client-only: call inside useEffect / event handlers. */
export function readSponsoredHidden(): boolean {
  try {
    return localStorage.getItem(SPONSORED_HIDDEN_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Write the flag and notify listeners in this tab. Client-only.
 */
export function writeSponsoredHidden(hidden: boolean): void {
  try {
    if (hidden) localStorage.setItem(SPONSORED_HIDDEN_KEY, "1");
    else localStorage.removeItem(SPONSORED_HIDDEN_KEY);
  } catch {
    /* storage unavailable — listeners still get the event */
  }
  window.dispatchEvent(new Event(SPONSORED_HIDDEN_EVENT));
}

/* ------------------------------------------------------------------ */
/* Persisted license key (V2 refinement).                               */
/* ------------------------------------------------------------------ */

/**
 * localStorage key holding the last successfully verified license key.
 * This is the user's own key on their own device. It is ONLY ever sent to
 * the /api/verify-tip endpoint, and only on an explicit Verify click —
 * never auto-submitted.
 */
export const TIP_LICENSE_KEY_STORAGE = "dawn_tip_license_key";

/** Read the stored key, or null when absent. Client-only. */
export function readStoredLicenseKey(): string | null {
  try {
    const v = localStorage.getItem(TIP_LICENSE_KEY_STORAGE);
    return v && v.length > 0 ? v : null;
  } catch {
    return null;
  }
}

/** Persist the key after a successful verification. Client-only. */
export function writeStoredLicenseKey(key: string): void {
  try {
    localStorage.setItem(TIP_LICENSE_KEY_STORAGE, key);
  } catch {
    /* storage unavailable */
  }
}

/* ------------------------------------------------------------------ */
/* Supporter flag (choice model): verifying a tip marks the user as a   */
/* supporter; hiding the strip is a separate explicit toggle.           */
/* ------------------------------------------------------------------ */

/**
 * localStorage flag: "1" = this device verified a tip (Gumroad license or
 * admin key). Set on successful verification. It does NOT hide the
 * sponsored strip on its own — the strip only hides via the explicit
 * `dawn_sponsored_hidden` toggle. Kept for future supporter-gated features.
 */
export const SUPPORTER_KEY = "dawn_supporter";

/** Read the flag. Client-only: call inside useEffect / event handlers. */
export function readSupporter(): boolean {
  try {
    return localStorage.getItem(SUPPORTER_KEY) === "1";
  } catch {
    return false;
  }
}

/** Write the flag. Client-only. */
export function writeSupporter(supporter: boolean): void {
  try {
    if (supporter) localStorage.setItem(SUPPORTER_KEY, "1");
    else localStorage.removeItem(SUPPORTER_KEY);
  } catch {
    /* storage unavailable */
  }
}

/**
 * "Is this device a supporter?" SSR-safe: returns false during SSR/edge
 * rendering where localStorage doesn't exist, so it can be imported and
 * called anywhere without a hydration guard. Intended for future
 * feature-gating; nothing is gated yet.
 */
export function isSupporter(): boolean {
  if (typeof window === "undefined") return false;
  return readSupporter();
}
