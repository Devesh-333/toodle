const MODEL = "gemini-3.5-flash";
async function apiError(response: Response): Promise<Error> {
  let providerMessage = "";
  try {
    const body = await response.clone().json() as { error?: { message?: string } };
    providerMessage = body.error?.message ?? "";
  } catch { /* The provider did not return a JSON error body. */ }
  if (response.status === 429) {
    if (/quota|billing/i.test(providerMessage)) return new Error("Your Gemini API quota is exhausted or billing is not enabled. Check the project's Google AI Studio rate limits and billing, then try again.");
    return new Error("The AI service is busy right now. Please wait a moment and try again.");
  }
  if (response.status === 503) return new Error("Gemini is temporarily at capacity. Please wait a minute and try again.");
  if (response.status === 401 || response.status === 403) return new Error("The Gemini API key was rejected. Check GOOGLE_GEMINI_API_KEY in your environment.");
  return new Error("The AI service had a problem. Please try again in a moment.");
}

export async function askGemini(prompt: string, schema: Record<string, unknown>): Promise<unknown> {
  const key = process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) throw new Error("AI_SETUP_REQUIRED");
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: `${prompt}\n\nReturn strictly valid JSON matching this schema: ${JSON.stringify(schema)}` }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
      }),
      signal: AbortSignal.timeout(55_000),
    });
  } catch {
    throw new Error("The AI service could not be reached. Check your connection and try again.");
  }
  if (!response.ok) {
    throw await apiError(response);
  }
  const body = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");
  if (!text) throw new Error("The AI returned an empty response. Please try again.");
  try { return JSON.parse(text); } catch { throw new Error("The AI returned an unreadable response. Please try again."); }
}

export function cleanIdea(value: unknown): string {
  if (typeof value !== "string") throw new Error("Add a short description of your idea to continue.");
  const idea = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
  if (idea.length < 15) throw new Error("Add a little more detail (at least 15 characters).");
  if (idea.length > 25000) throw new Error("Your idea must be 25,000 characters or fewer.");
  return idea;
}
