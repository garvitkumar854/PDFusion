export const runtime = "nodejs";

import { summarizeText } from "@/genkit/summarize";

export async function POST(req: Request) {
  const { text } = await req.json();

  if (!text) {
    return Response.json({ error: "Text is required" }, { status: 400 });
  }

  const summary = await summarizeText(text);

  return Response.json({ summary });
}
