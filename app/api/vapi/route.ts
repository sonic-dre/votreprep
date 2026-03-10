import { db } from "@/firebase/admin";
import { NextRequest, NextResponse } from "next/server";

async function generateWithGroq(prompt: string): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1024,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message } = body;

    if (!message) return NextResponse.json({ success: true });

    // ── Handle tool-calls (workflow calls "createInterview" tool) ──────────
    if (message.type === "tool-calls") {
      const toolCallList: any[] = message.toolCallList ?? [];
      const results = [];

      for (const toolCall of toolCallList) {
        const fnName: string = toolCall?.function?.name;
        const rawArgs = toolCall?.function?.arguments;
        const params = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;

        if (fnName === "createInterview") {
          const interviewId = await saveInterview(params);
          results.push({
            toolCallId: toolCall.id,
            result: interviewId
              ? `Interview created with id ${interviewId}`
              : "Failed to create interview",
          });
        }
      }

      return NextResponse.json({ results });
    }

    // ── Handle end-of-call-report (workflow variables collected via conversation) ──
    if (message.type === "end-of-call-report") {
      const vars = message?.artifact?.variableValues ?? {};
      const { userId, role, level, type, techstack, amount } = vars;

      if (userId && role) {
        await saveInterview({ userId, role, level, type, techstack, amount });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[/api/vapi] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function saveInterview(params: {
  userId: string;
  role?: string;
  level?: string;
  type?: string;
  techstack?: string;
  amount?: number | string;
}): Promise<string | null> {
  const {
    userId,
    role = "Software Engineer",
    level = "Mid",
    type = "Mixed",
    techstack = "",
    amount = 5,
  } = params;

  const questionCount = Number(amount) || 5;
  const techList = techstack
    ? techstack.split(",").map((t: string) => t.trim()).filter(Boolean)
    : [];

  try {
    const text = await generateWithGroq(`Generate ${questionCount} interview questions for a ${level} ${role} position.
Interview type: ${type}.
${techList.length ? `Focus on these technologies: ${techList.join(", ")}.` : ""}
Return ONLY a valid JSON array of question strings, nothing else.
Example: ["Question 1?", "Question 2?"]`);

    let questions: string[] = [];
    try {
      const match = text.match(/\[[\s\S]*\]/);
      questions = match ? JSON.parse(match[0]) : [];
    } catch {
      questions = text
        .split("\n")
        .map((l) => l.replace(/^[-\d.)\s]+/, "").trim())
        .filter((l) => l.endsWith("?"))
        .slice(0, questionCount);
    }

    const ref = await db.collection("interviews").add({
      userId,
      role,
      level,
      type,
      techstack: techList,
      questions,
      finalized: true,
      createdAt: new Date().toISOString(),
    });

    return ref.id;
  } catch (err) {
    console.error("[saveInterview] Error:", err);
    return null;
  }
}
