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
