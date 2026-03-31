import { NextRequest, NextResponse } from "next/server";

async function extractText(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  // TXT or any plain text file
  return buffer.toString("utf-8");
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "docx", "txt"].includes(ext ?? "")) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF, DOCX, or TXT file." },
        { status: 400 }
      );
    }

    const text = await extractText(file);

    if (!text.trim()) {
      return NextResponse.json({ error: "Could not extract text from file." }, { status: 422 });
    }

    // Truncate to avoid hitting token limits (keep first ~6000 chars)
    const truncated = text.slice(0, 6000);

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
- "type": use "Technical" if the role is engineering-heavy, "Behavioural" if it's management/soft-skills focused, "Mixed" otherwise.
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
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Groq API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const content: string = data.choices?.[0]?.message?.content ?? "";

    // Extract JSON from response
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Could not parse structured data from AI response.");

    const parsed = JSON.parse(match[0]);

    return NextResponse.json({
      role: parsed.role ?? "",
      level: ["Junior", "Mid", "Senior"].includes(parsed.level) ? parsed.level : "Mid",
      type: ["Technical", "Behavioural", "Mixed"].includes(parsed.type) ? parsed.type : "Mixed",
      techstack: parsed.techstack ?? "",
      passmark: String(Math.min(100, Math.max(0, Number(parsed.passmark) || 70))),
      amount: "8",
      jobDescription: text.slice(0, 4000),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[parse-jd]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
