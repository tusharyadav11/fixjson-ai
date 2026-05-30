import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;
const geminiModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_INPUT_LENGTH = 50_000;

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

function cleanGeminiJson(text: string) {
  return text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

export async function POST(req: Request) {
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured." },
      { status: 500 }
    );
  }

  const body = (await req.json()) as { json?: unknown };

  if (typeof body.json !== "string" || !body.json.trim()) {
    return NextResponse.json(
      { error: "Request body must include a non-empty json string." },
      { status: 400 }
    );
  }

  if (body.json.length > MAX_INPUT_LENGTH) {
    return NextResponse.json(
      {
        error: `Input is too large. Keep it under ${MAX_INPUT_LENGTH.toLocaleString()} characters.`,
      },
      { status: 413 }
    );
  }

  const prompt = `
Fix this malformed JSON and explain what you changed.

Return ONLY a single JSON object with this exact shape:
{
  "repaired": <the corrected JSON value, as real JSON (object/array/etc), NOT a string>,
  "summary": "<one short, friendly sentence describing the input and outcome>",
  "changes": ["<plain-English description of one fix>", "..."]
}

Rules:
- "repaired" must be valid, corrected JSON — preserve the original data where possible
- If a value is genuinely unknown, use null
- Keep "changes" concise and human-readable (max 6 items), e.g. "Added missing quotes around the key \\"name\\""
- No markdown, no code fences, no text outside the JSON object

Input:
${body.json}
`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    }
  );

  const data = (await response.json()) as GeminiResponse;

  if (!response.ok) {
    return NextResponse.json(
      {
        error:
          data.error?.message ||
          "Gemini API request failed.",
        upstreamStatus: response.status,
        model: geminiModel,
      },
      { status: 502 }
    );
  }

  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const cleaned = cleanGeminiJson(text);

  if (!cleaned) {
    return NextResponse.json(
      { error: "Gemini returned an empty response." },
      { status: 502 }
    );
  }

  try {
    const parsed = JSON.parse(cleaned);

    // The model is asked to wrap the result as { repaired, summary, changes },
    // but fall back gracefully if it returns the bare repaired JSON instead.
    const hasWrapper =
      parsed !== null &&
      typeof parsed === "object" &&
      !Array.isArray(parsed) &&
      "repaired" in parsed;

    const repaired = hasWrapper
      ? (parsed as { repaired: unknown }).repaired
      : parsed;
    const summary =
      hasWrapper && typeof (parsed as { summary?: unknown }).summary === "string"
        ? (parsed as { summary: string }).summary
        : null;
    const changes =
      hasWrapper && Array.isArray((parsed as { changes?: unknown }).changes)
        ? ((parsed as { changes: unknown[] }).changes.filter(
            (c) => typeof c === "string"
          ) as string[])
        : [];

    return NextResponse.json({
      success: true,
      repaired,
      repairedText: JSON.stringify(repaired, null, 2),
      summary,
      changes,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Gemini did not return valid JSON after sanitizing.",
        raw: text,
        cleaned,
      },
      { status: 502 }
    );
  }
}
