/**
 * Google AdSense configuration.
 *
 * Ads are fully opt-in: nothing is rendered or requested unless
 * NEXT_PUBLIC_ADSENSE_CLIENT is set, so the app behaves exactly as before
 * (and stays fast) until you add your publisher ID.
 *
 * Environment variables (set these in Vercel / your host):
 *   NEXT_PUBLIC_ADSENSE_CLIENT  Your publisher ID, e.g. "ca-pub-1234567890123456"
 *                               (a bare numeric ID is accepted and normalised).
 *   NEXT_PUBLIC_ADSENSE_SLOT_HOME     Ad-unit slot shown on the homepage.
 *   NEXT_PUBLIC_ADSENSE_SLOT_CONTENT  Ad-unit slot shown above the footer on
 *                                     every page.
 *
 * Slot IDs come from AdSense -> Ads -> By ad unit -> the unit's "ad slot" id.
 */
const rawClient = (process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "").trim();

/** Normalised publisher ID, always prefixed with "ca-pub-". Empty when unset. */
export const ADSENSE_CLIENT = rawClient
  ? rawClient.startsWith("ca-pub-")
    ? rawClient
    : `ca-pub-${rawClient.replace(/\D/g, "")}`
  : "";

/** True only when a client ID is configured. */
export const isAdSenseEnabled = ADSENSE_CLIENT.length > 0;

/** The loader script; loaded once, after the page is interactive. */
export const ADSENSE_SCRIPT_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;

/** Publisher ID without the "ca-" prefix, for ads.txt. */
export const ADSENSE_PUBLISHER_ID = ADSENSE_CLIENT.replace(/^ca-/, "");

export const ADSENSE_SLOT_HOME = (process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME ?? "").trim();
export const ADSENSE_SLOT_CONTENT = (process.env.NEXT_PUBLIC_ADSENSE_SLOT_CONTENT ?? "").trim();
