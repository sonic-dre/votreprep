"use server";

import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

export async function createAdminInterview(params: CreateAdminInterviewParams) {
  const { adminId, role, level, type, techstack, amount, passmark, jobDescription } = params;

  const jdContext = jobDescription
    ? `\nAdditional context from the job description:\n${jobDescription}`
    : "";

  try {
    const { text: questions } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `Prepare questions for a job interview.
        The job role is ${role}.
        The job experience level is ${level}.
        The key tools and skills relevant to the role are: ${techstack}.
        The focus between behavioural and technical questions should lean towards: ${type}.
        The amount of questions required is: ${amount}.${jdContext}
        Please return only the questions, without any additional text.
        The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
        Return the questions formatted like this:
        ["Question 1", "Question 2", "Question 3"]
      `,
    });

    let parsedQuestions: string[] = [];
    try {
      const match = questions.match(/\[[\s\S]*\]/);
      parsedQuestions = match ? JSON.parse(match[0]) : JSON.parse(questions);
    } catch {
      parsedQuestions = questions
        .split("\n")
        .map((l) => l.replace(/^[-\d.)\s]+/, "").trim())
        .filter((l) => l.length > 0)
        .slice(0, amount);
    }

    const interview = {
      role,
      type,
      level,
      techstack: techstack.split(",").map((s) => s.trim()).filter(Boolean),
      questions: parsedQuestions,
      userId: adminId,
      passmark,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    const doc = await db.collection("interviews").add(interview);

    return { success: true, interviewId: doc.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Error creating admin interview:", message);
    return { success: false, interviewId: null, error: message };
  }
}

export async function getAdminInterviews(adminId: string): Promise<Interview[]> {
  const snap = await db
    .collection("interviews")
    .where("userId", "==", adminId)
    .orderBy("createdAt", "desc")
    .get();

  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Interview[];
}

export async function getInterviewCandidates(interviewId: string): Promise<CandidateResult[]> {
  const feedbackSnap = await db
    .collection("feedback")
    .where("interviewId", "==", interviewId)
    .get();

  if (feedbackSnap.empty) return [];

  const results = await Promise.all(
    feedbackSnap.docs.map(async (doc) => {
      const data = doc.data();
      const userDoc = await db.collection("users").doc(data.userId).get();
      const user = userDoc.data();
      return {
        feedbackId: doc.id,
        userId: data.userId,
        userName: user?.name ?? "Unknown",
        userEmail: user?.email ?? "",
        totalScore: data.totalScore ?? 0,
        createdAt: data.createdAt ?? "",
      } as CandidateResult;
    })
  );

  return results.sort((a, b) => b.totalScore - a.totalScore);
}

export async function getFeedbackById(feedbackId: string): Promise<Feedback | null> {
  const doc = await db.collection("feedback").doc(feedbackId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() } as Feedback;
}
