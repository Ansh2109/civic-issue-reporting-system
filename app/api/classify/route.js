/**
 * POST /api/classify
 *
 * Body:    { description: string }
 * Returns: { category: string, urgency: number }
 *
 * Calls Groq first; falls back to Gemini if Groq fails or returns invalid JSON.
 * Both API keys are server-only env vars — never sent to the browser.
 */

const VALID_CATEGORIES = [
  "pothole", "streetlight", "garbage", "water_leak", "drainage",
  "illegal_construction", "stray_animal", "traffic_signal", "roads", "other"
];

const SYSTEM_PROMPT =
  "You are a civic issue classifier. " +
  "Classify the description into exactly one category and rate its urgency. " +
  "Respond with ONLY valid JSON — no markdown, no explanation, no extra text. " +
  'Example: {"category":"pothole","urgency":4}';

const USER_PROMPT = (description) =>
  `Classify this civic issue report:\n\n"${description}"\n\n` +
  "Rules:\n" +
  '- "category" must be exactly one of: pothole, streetlight, garbage, water_leak, drainage, illegal_construction, stray_animal, traffic_signal, roads, other\n' +
  '- Pick "other" ONLY when nothing else genuinely fits.\n' +
  '- "urgency" must be an integer 1 (minor inconvenience) to 5 (immediate danger)\n' +
  "Respond with ONLY the JSON object.";

/* ── Shared validation ───────────────────────────────────────────────────── */

function parseAndValidate(text) {
  // Temporarily log raw LLM response
  console.log("[classify] RAW LLM RESPONSE:", text);

  // Strip markdown code fences if the model wrapped the JSON anyway
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error("[classify] JSON Parse Error. Cleaned text:", cleaned, "Original error:", err);
    throw new Error(`Response is not valid JSON: ${text.slice(0, 200)}`);
  }

  const { category, urgency } = parsed;

  if (!VALID_CATEGORIES.includes(category)) {
    console.error(`[classify] Invalid category received: "${category}"`);
    throw new Error(`Unknown category "${category}"`);
  }
  const u = Number(urgency);
  if (!Number.isInteger(u) || u < 1 || u > 5) {
    console.error(`[classify] Invalid urgency received: "${urgency}"`);
    throw new Error(`Invalid urgency "${urgency}" — must be integer 1-5`);
  }

  return { category, urgency: u };
}

/* ── Groq (primary) ──────────────────────────────────────────────────────── */

async function classifyWithGroq(description) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      temperature: 0,
      response_format: { 
        type: "json_schema", 
        json_schema: { 
          name: "classify_report", 
          schema: { 
            type: "object", 
            properties: { 
              category: { 
                type: "string", 
                enum: VALID_CATEGORIES 
              }, 
              urgency: { 
                type: "integer", 
                minimum: 1, 
                maximum: 5 
              } 
            }, 
            required: ["category", "urgency"] 
          } 
        } 
      },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user",   content: USER_PROMPT(description) },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq API ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? "";
  
  return parseAndValidate(text);
}

/* ── Gemini (fallback) ───────────────────────────────────────────────────── */

async function classifyWithGemini(description) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const url =
    `https://generativelanguage.googleapis.com/v1/models/` +
    `gemini-3.6-flash:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 64,
        responseMimeType: "application/json",  // forces JSON-only output
      },
      contents: [
        {
          role: "user",
          parts: [{ text: SYSTEM_PROMPT + "\n\n" + USER_PROMPT(description) }],
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return parseAndValidate(text);
}

/* ── Route handler ───────────────────────────────────────────────────────── */

export async function POST(request) {
  // 1. Parse and validate request body
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const description = body?.description;
  if (!description || typeof description !== "string" || !description.trim()) {
    return Response.json({ error: "description is required and must be a non-empty string" }, { status: 400 });
  }

  const trimmed = description.trim();

  // 2. Try Groq
  let groqError = null;
  try {
    const result = await classifyWithGroq(trimmed);
    console.log("[classify] ✅ Success: classified using Groq (openai/gpt-oss-120b)");
    return Response.json(result);
  } catch (err) {
    groqError = err.message;
    console.error("[classify] Groq failed, trying Gemini fallback:", err);
  }

  // 3. Gemini fallback
  try {
    const result = await classifyWithGemini(trimmed);
    console.log("[classify] ✅ Success: classified using Gemini (gemini-3.6-flash)");
    return Response.json(result);
  } catch (err) {
    console.error("[classify] Both Groq and Gemini failed.", {
      groq: groqError,
      gemini: err,
    });
    return Response.json(
      {
        error: "Classification service unavailable",
        detail: { groq: groqError, gemini: err.message },
      },
      { status: 502 }
    );
  }
}
