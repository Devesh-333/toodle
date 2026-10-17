# Toodle

Toodle is a small, anonymous idea validation flow: describe an idea, answer six tailored questions, and get a candid report with practical next steps.

## Run locally

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env.local` and set `GROQ_API_KEY` for primary generation and `GOOGLE_GEMINI_API_KEY` for fallback generation and optional Google Search grounding.
3. Run `npm install`, then `npm run dev`.
4. Open `http://localhost:3000`.

Provider keys are read only by server routes and are never sent to the browser. Groq `llama-3.3-70b-versatile` handles structured generation first; if it fails or returns invalid output, Gemini `gemini-flash-lite-latest` is tried. Gemini 2.0 Flash is shut down. Without either key, the app loads normally and explains that AI generation needs a key when you start a validation.

## What is included

- Idea input (500 character limit) and category selection.
- AI generated, idea specific multiple choice questions.
- AI-powered idea analysis with an overall score, five breakdowns, and three personalized actions.
- Browser saved reports, shareable self-contained links, and print to PDF.
- Basic in-memory rate limiting for a single running instance.

Reports are generated from the idea and founder answers using AI analysis. Live web search is not part of the MVP. For a multi-instance deployment, replace the in-memory rate limiter with a shared store such as Redis. Reports are stored in the browser or encoded in a share link; there is no account system or server-side report database.
