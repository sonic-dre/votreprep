import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

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

export async function POST(request: Request) {
  const { type, role, level, skills, amount, userid } = await request.json();

  try {
    const text = await generateWithGroq(`Prepare questions for a job interview.
        The job role is ${role}.
        The job experience level is ${level}.
        The key tools and skills relevant to the role are: ${skills}.
        The focus between behavioural and technical questions should lean towards: ${type}.
        The amount of questions required is: ${amount}.
        Please return only the questions, without any additional text.
        The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
        Return the questions formatted like this:
        ["Question 1", "Question 2", "Question 3"]
    `);

    let questions: string[] = [];
    try {
      const match = text.match(/\[[\s\S]*\]/);
      questions = match ? JSON.parse(match[0]) : JSON.parse(text);
    } catch {
      questions = text
        .split("\n")
        .map((l) => l.replace(/^[-\d.)\s]+/, "").trim())
        .filter((l) => l.length > 0)
        .slice(0, Number(amount) || 5);
    }

    const interview = {
      role,
      type,
      level,
      techstack: skills ? skills.split(",").map((s: string) => s.trim()) : [],
      questions,
      userId: userid,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    await db.collection("interviews").add(interview);

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
}
