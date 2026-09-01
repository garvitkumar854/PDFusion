/**
 * Google AdSense configuration.
 *
 * The site's publisher ID ships as a default (DEFAULT_ADSENSE_CLIENT below)
 * so ads work everywhere without extra setup. To use a different publisher
 * ID (or to disable ads entirely), set NEXT_PUBLIC_ADSENSE_CLIENT — an empty
 * string turns ads off; nothing is rendered or requested when no client is
 * configured.
 *
 * Environment variables (optional overrides, e.g. in Vercel / your host):
 *   NEXT_PUBLIC_ADSENSE_CLIENT  Your publisher ID, e.g. "ca-pub-1234567890123456"
 *                               (a bare numeric ID is accepted and normalised;
 *                               "" disables ads).
 *   NEXT_PUBLIC_ADSENSE_SLOT_HOME     Ad-unit slot shown on the homepage.
 *   NEXT_PUBLIC_ADSENSE_SLOT_CONTENT  Ad-unit slot shown above the footer on
 *                                     every page.
 *
 * Slot IDs come from AdSense -> Ads -> By ad unit -> the unit's "ad slot" id.
 */
const DEFAULT_ADSENSE_CLIENT = "ca-pub-4853497722580911";

const rawClient = (
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? DEFAULT_ADSENSE_CLIENT
).trim();

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
