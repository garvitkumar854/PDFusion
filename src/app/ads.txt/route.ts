import { ADSENSE_PUBLISHER_ID, isAdSenseEnabled } from "@/lib/adsense";

export const dynamic = "force-static";

/**
 * Serves ads.txt (https://<host>/ads.txt) so buyers can verify you as the
 * authorised seller of your ad inventory — required for AdSense revenue.
 * Returns 404 until a publisher ID is configured.
 */
export function GET(): Response {
  if (!isAdSenseEnabled) {
    return new Response("not found", { status: 404 });
  }
  const body = `google.com, ${ADSENSE_PUBLISHER_ID}, DIRECT, f08c47fec0942749\n`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
