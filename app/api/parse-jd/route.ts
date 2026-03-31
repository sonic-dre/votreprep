/**
 * POST /api/parse-jd
 *
 * Accepts a multipart form upload containing a job description file
 * (PDF, DOCX, or TXT), extracts its plain text, then sends that text
 * to Groq (llama-3.3-70b-versatile) to infer structured interview fields:
 *   role, level, type, techstack, passmark, amount, jobDescription
 *
 * The extracted fields are returned as JSON and used by NewInterviewClient
 * to auto-populate the interview creation form.
 */

import { NextRequest, NextResponse } from "next/server";

/**
 * Extracts plain text from the uploaded file based on its extension.
 *  - .pdf  → pdf-parse (reads embedded text layers)
 *  - .docx → mammoth  (converts Word XML to plain text)
 *  - .txt  → UTF-8 decode
 */
async function extractText(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) {
    // pdf-parse v1 exports the parse function as the module default
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (name.endsWith(".docx")) {
    // mammoth strips Word XML and returns clean plain text via extractRawText
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  // Plain text fallback — covers .txt and any other readable format
  return buffer.toString("utf-8");
}

export async function POST(req: NextRequest) {
  try {
    // ── 1. Parse incoming multipart form ──────────────────────────────────
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file extension — only PDF, DOCX, and TXT are supported
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "txt"].includes(ext ?? "")) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF, DOCX, or TXT file." },
        { status: 400 }
      );
    }

    // ── 2. Extract plain text from the file ───────────────────────────────
    const text = await extractText(file);

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from file." },
        { status: 422 }
      );
    }

    // Truncate to ~6 000 chars to stay within Groq token limits
    // while still capturing the key requirements of most JDs
    const truncated = text.slice(0, 6000);

    // ── 3. Ask Groq to infer structured interview fields ──────────────────
    const prompt = `You are a job description parser. Analyze the following job description and extract structured information.

Return ONLY a valid JSON object with these exact fields (no markdown, no extra text):
{
  "role": "the exact job title or position name",
  "level": "Junior" | "Mid" | "Senior",
  "type": "Technical" | "Behavioural" | "Mixed",
  "techstack": "comma-separated list of tools, languages, and frameworks mentioned",
  "passmark": a number between 50 and 90 representing a suitable pass threshold percentage,
  "amount": 8
}

Rules:
- "level": choose based on years of experience or seniority language in the JD. Default to "Mid" if unclear.
- "type": use "Technical" if the role is engineering-heavy, "Behavioural" if it is management or soft-skills focused, "Mixed" otherwise.
- "techstack": extract all technical tools, languages, frameworks, and platforms. Return empty string if none found.
- "passmark": suggest a reasonable pass threshold (e.g. 70 for mid-level, 75 for senior).
- "amount": always return 8.

Job Description:
${truncated}`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 512,
        temperature: 0.1, // Low temperature for deterministic, structured output
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq API error ${res.status}: ${err}`);
    }

    // ── 4. Parse the AI response and return structured fields ─────────────
    const data = await res.json();
    const content: string = data.choices?.[0]?.message?.content ?? "";

    // Extract the JSON object — the model sometimes wraps it in prose
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Could not parse structured data from AI response.");

    const parsed = JSON.parse(match[0]);

    return NextResponse.json({
      role:     parsed.role     ?? "",
      // Ensure level is one of the three valid options
      level:    ["Junior", "Mid", "Senior"].includes(parsed.level)           ? parsed.level : "Mid",
      // Ensure type is one of the three valid options
      type:     ["Technical", "Behavioural", "Mixed"].includes(parsed.type)  ? parsed.type  : "Mixed",
      techstack:      parsed.techstack ?? "",
      passmark:       String(Math.min(100, Math.max(0, Number(parsed.passmark) || 70))),
      amount:         "8",
      // Return the full (non-truncated) text so the form textarea is as complete as possible
      jobDescription: text.slice(0, 4000),
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[parse-jd]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
