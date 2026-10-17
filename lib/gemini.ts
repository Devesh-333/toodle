const GEMINI_MODELS = ["gemini-3.8-flash", "gemini-3.5-flash"];

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

  let lastError: Error | null = null;

  for (const model of GEMINI_MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: `${prompt}\n\nReturn strictly valid JSON matching this schema: ${JSON.stringify(schema)}` }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
          }),
          signal: AbortSignal.timeout(55_000),
        });

        if (response.ok) {
          const body = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
          const text = body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");
          if (!text) throw new Error("The AI returned an empty response. Please try again.");
          try {
            return JSON.parse(text);
          } catch {
            throw new Error("The AI returned an unreadable response. Please try again.");
          }
        }

        // If rate limited or 503 capacity spike, wait with jitter and retry
        if (response.status === 503 || response.status === 429) {
          lastError = await apiError(response);
          const jitter = Math.floor(Math.random() * 400);
          await wait(attempt * 1200 + jitter);
          continue;
        }

        // For non-transient status codes (401, 403, 400), don't retry same model
        throw await apiError(response);
      } catch (err: any) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < 2) {
          await wait(1000);
        }
      }
    }
  }

  throw lastError ?? new Error("The AI service is temporarily busy. Please wait a moment and try again.");
}

export function cleanIdea(value: unknown): string {
  if (typeof value !== "string") throw new Error("Add a short description of your idea to continue.");
  const idea = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
  if (idea.length < 15) throw new Error("Add a little more detail (at least 15 characters).");
  if (idea.length > 25000) throw new Error("Your idea must be 25,000 characters or fewer.");
  return idea;
}
