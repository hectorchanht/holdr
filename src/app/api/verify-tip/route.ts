/**
 * Tip-jar license verification.
 *   POST /api/verify-tip  with JSON body { licenseKey }
 *
 * Flow:
 *   1. Trim the input; reject empty or >200 chars -> { ok: false }.
 *   2. SHA-256 hex of the trimmed input is compared against the admin key
 *      hash. A match returns { ok: true, admin: true } WITHOUT calling
 *      Gumroad. The input is never logged.
 *   3. Otherwise the key is verified against Gumroad's license API for the
 *      holdr-tip product. success===true with no refund/chargeback ->
 *      { ok: true }, anything else -> { ok: false }.
 *
 * Fails closed on any network/API error. No D1/KV needed; everything is
 * computed per-request inside the handler (module scope holds only the
 * constant hash and the permalink).
 */

export const dynamic = "force-dynamic";

/** SHA-256 hex of the admin license key (hash-in-code; the plaintext key is never stored). */
const ADMIN_KEY_SHA256 =
  "67d2d8519b0160af28a8d8f6c3cc97d810fda37161d2b10b1359d480c4ecad77";

/** Gumroad product permalink for the holdr tip jar. */
const PRODUCT_PERMALINK = "holdr-tip";

const GUMROAD_VERIFY_URL = "https://api.gumroad.com/v2/licenses/verify";

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(input),
  );
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface GumroadVerifyResponse {
  success?: boolean;
  message?: string;
  purchase?: {
    refunded?: boolean;
    chargebacked?: boolean;
  } | null;
}

async function verifyWithGumroad(licenseKey: string): Promise<boolean> {
  const body = new URLSearchParams({
    product_permalink: PRODUCT_PERMALINK,
    license_key: licenseKey,
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(GUMROAD_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      signal: controller.signal,
    });
    if (!res.ok) return false;
    const data = (await res.json()) as GumroadVerifyResponse;
    if (data.success !== true) return false;
    const purchase = data.purchase;
    if (purchase?.refunded === true || purchase?.chargebacked === true) {
      return false;
    }
    return true;
  } catch {
    // Network error, timeout, bad JSON — fail closed.
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: Request) {
  let licenseKey = "";
  try {
    const body = (await req.json()) as { licenseKey?: unknown };
    licenseKey = typeof body.licenseKey === "string" ? body.licenseKey.trim() : "";
  } catch {
    return Response.json({ ok: false });
  }

  if (licenseKey.length === 0 || licenseKey.length > 200) {
    return Response.json({ ok: false });
  }

  // Admin key path: hash comparison only, never log the input.
  try {
    if ((await sha256Hex(licenseKey)) === ADMIN_KEY_SHA256) {
      return Response.json({ ok: true, admin: true });
    }
  } catch {
    return Response.json({ ok: false });
  }

  const ok = await verifyWithGumroad(licenseKey);
  return Response.json({ ok });
}
