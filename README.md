# FixJson.ai

Repair malformed JSON, see exactly what was wrong, and copy the clean result.
**Live demo:** https://fixjson-ai.vercel.app

The app lives in [`json-doctor/`](./json-doctor) (Next.js 16 · React 19 · TypeScript).

## What it does
- Paste malformed JSON (up to 50,000 characters) and get a repaired result, pretty-printed or minified.
- **Instant local fixes** for the most common problems — single quotes, trailing commas and unquoted keys —
  with an issues panel and a before/after diff (`src/lib/detector.ts`, `fixer.ts`, `diff.ts`, `validator.ts`).
- **"Fix with AI"** for harder cases: a server route (`app/api/repair-json`) asks the Gemini API to repair
  the input and return the fixed JSON plus a plain-English list of changes.
- Copy or download the result; keeps a history of recent repairs.

## How the AI path is kept safe
- The API key lives only in the server environment (`GEMINI_API_KEY`), never in client code.
- Input is length-capped and validated before it is sent.
- The model is asked for a single JSON object, and the response is cleaned and parsed before it is shown.

## Run locally
```bash
cd json-doctor
npm install
# optional, enables "Fix with AI":
echo "GEMINI_API_KEY=your-key" > .env.local
npm run dev        # http://localhost:3000
```
The local rule-based fixes work without any key.
