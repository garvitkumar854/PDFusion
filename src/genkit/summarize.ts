import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";

const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_API_KEY!,
    }),
  ],
});

export async function summarizeText(text: string) {
  const result = await ai.generate({
    model: "gemini-1.5-flash",
    prompt: `
Summarize the following text clearly and shortly:

${text}
`,
  });

  return result.text();
}
