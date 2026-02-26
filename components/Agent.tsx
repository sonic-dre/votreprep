"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
}

const MicIcon = ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="22"/>
  </svg>
);

const CheckIcon = () => (
  <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const Waveform = ({ active }: { active: boolean }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 3, height: 30 }}>
    {[0.3, 0.6, 1, 0.8, 0.5, 0.9, 0.4, 0.7, 1, 0.6].map((h, i) => (
      <div key={i} className={active ? "wave-bar active" : "wave-bar"} style={{
        background: active ? "var(--accent)" : "var(--border2)",
        animationDelay: `${i * 0.07}s`,
        animationDuration: `${0.6 + i * 0.1}s`,
        height: active ? `${h * 24}px` : "6px",
      }} />
    ))}
  </div>
);

const Agent = ({ userName, userId, interviewId, feedbackId, type, questions, redirectTo }: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    const onCallStart = () => { setErrorMsg(""); setCallStatus(CallStatus.ACTIVE); };
    const onCallEnd = () => setCallStatus(CallStatus.FINISHED);
    const onMessage = (message: Message) => {
      if (message.type === "transcript" && message.transcriptType === "final") {
        setMessages((prev) => [...prev, { role: message.role, content: message.transcript }]);
      }
    };
    const onSpeechStart = () => setIsSpeaking(true);
    const onSpeechEnd = () => setIsSpeaking(false);
    const onError = (error: unknown) => {
      const e = error as any;
      // "daily-error" is Daily.co room cleanup that fires after every call ends normally.
      // It is not a real failure — ignore it completely.
      if (e?.type === "daily-error") return;
      console.error("Vapi error:", JSON.stringify(e, null, 2));
      const msg =
        e?.error?.message ||
        e?.error?.error?.message ||
        e?.message ||
        e?.error?.type ||
        e?.type ||
        "Connection failed. Check your Vapi dashboard and microphone permissions.";
      const detail = e?.error?.error?.message || e?.context?.errorMessage || "";
      setErrorMsg(detail ? `${msg}: ${detail}` : msg);
      setCallStatus(CallStatus.INACTIVE);
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) setLastMessage(messages[messages.length - 1].content);

    const handleGenerateFeedback = async (msgs: SavedMessage[]) => {
      const { success, feedbackId: id } = await createFeedback({
        interviewId: interviewId!,
        userId: userId!,
        transcript: msgs,
        feedbackId,
      });
      if (success && id) {
        router.push(`/interview/${interviewId}/feedback`);
      } else {
        router.push("/");
      }
    };

    if (callStatus === CallStatus.FINISHED) {
      if (type === "generate") {
        router.push(redirectTo ?? "/");
      } else {
        handleGenerateFeedback(messages);
      }
    }
  }, [messages, callStatus, feedbackId, interviewId, redirectTo, router, type, userId]);

  const handleCall = async () => {
    setCallStatus(CallStatus.CONNECTING);
    try {
      if (type === "generate") {
        await vapi.start(
          undefined,
          undefined,
          undefined,
          process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!,
          { variableValues: { userName, userId } }
        );
      } else {
        const formattedQuestions = questions?.map((q) => `- ${q}`).join("\n") ?? "";
        await vapi.start(interviewer, { variableValues: { questions: formattedQuestions } });
      }
    } catch (error) {
      console.error("Failed to start call:", error);
      setCallStatus(CallStatus.INACTIVE);
    }
  };

  const handleDisconnect = () => {
    setCallStatus(CallStatus.FINISHED);
    vapi.stop();
  };

  /* ── CONNECTING ── */
  if (callStatus === CallStatus.CONNECTING) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 380 }}>
        <div style={{ textAlign: "center", maxWidth: 420 }} className="fade-up">
          <div style={{ position: "relative", display: "inline-flex", marginBottom: 32 }}>
            <div className="animate-pulse-ring" style={{
              width: 120, height: 120, borderRadius: "50%",
              background: "rgba(79,255,176,0.08)", border: "2px solid rgba(79,255,176,0.2)",
            }} />
            <div style={{
              position: "absolute", inset: 12, borderRadius: "50%",
              background: "rgba(79,255,176,0.12)", border: "2px solid rgba(79,255,176,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ width: 60, height: 60, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MicIcon size={28} color="#050806" />
              </div>
            </div>
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
            Connecting to AI Interviewer
          </h2>
          <p style={{ color: "var(--muted-foreground)", marginBottom: 28, lineHeight: 1.6 }}>
            {type === "generate" ? "Preparing your personalized interview setup…" : "Joining your interview session…"}
          </p>
          <button className="btn-secondary" onClick={() => setCallStatus(CallStatus.INACTIVE)}>Cancel</button>
        </div>
      </div>
    );
  }

  /* ── ACTIVE ── */
  if (callStatus === CallStatus.ACTIVE) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 380 }}>
        <div style={{ width: "100%", maxWidth: 520 }} className="fade-up">
          <div className="vp-card" style={{
            padding: 36, textAlign: "center",
            border: "1px solid rgba(79,255,176,0.2)",
            background: "linear-gradient(135deg, rgba(79,255,176,0.04) 0%, transparent 100%)",
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
              <span className="badge badge-green animate-blink">● LIVE</span>
              <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
                {type === "generate" ? "Interview Setup" : "Interview in Progress"}
              </span>
            </div>
            <div style={{
              width: 90, height: 90, borderRadius: "50%",
              background: "rgba(79,255,176,0.08)", border: "2px solid rgba(79,255,176,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 24px",
            }}>
              <MicIcon size={36} color="var(--accent)" />
            </div>
            {lastMessage && (
              <p key={lastMessage} className="animate-fadeIn" style={{
                fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 500,
                lineHeight: 1.6, marginBottom: 28, color: "var(--text)",
              }}>
                "{lastMessage}"
              </p>
            )}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
              <Waveform active={isSpeaking} />
            </div>
            <button style={{
              padding: "12px 36px", borderRadius: 26,
              background: "var(--danger)", color: "white",
              fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer",
            }} onClick={handleDisconnect}>
              End Interview
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── FINISHED ── */
  if (callStatus === CallStatus.FINISHED) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 380 }}>
        <div style={{ textAlign: "center", maxWidth: 400 }} className="fade-up">
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "rgba(79,255,176,0.12)", border: "2px solid rgba(79,255,176,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px",
          }}>
            <CheckIcon />
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
            {type === "generate" ? "Interview Created!" : "Interview Complete!"}
          </h2>
          <p style={{ color: "var(--muted-foreground)", lineHeight: 1.6 }}>
            {type === "generate"
              ? "Your interview has been saved. Redirecting to dashboard…"
              : "Analyzing your responses and generating feedback…"}
          </p>
        </div>
      </div>
    );
  }

  /* ── INACTIVE (default) ── */
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 360 }}>
      <div style={{ textAlign: "center", maxWidth: 440 }} className="fade-up">
        <div style={{
          width: 90, height: 90, borderRadius: "50%",
          background: "rgba(79,255,176,0.08)", border: "2px solid rgba(79,255,176,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 28px",
        }}>
          <MicIcon size={36} color="var(--accent)" />
        </div>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, marginBottom: 10 }}>
          {type === "generate" ? "Set Up Your Interview" : `${userName}'s Interview`}
        </h2>
        <p style={{ color: "var(--muted-foreground)", marginBottom: 32, lineHeight: 1.6, fontSize: 14 }}>
          {type === "generate"
            ? "Click below to start a voice conversation. The AI will ask about the role, level, and stack to prepare your interview."
            : "Click to join your voice interview. Answer each question naturally and the AI will evaluate your responses."}
        </p>
        {errorMsg && (
          <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 16, background: "rgba(255,95,126,0.08)", border: "1px solid rgba(255,95,126,0.2)", borderRadius: 8, padding: "10px 14px" }}>
            {errorMsg}
          </p>
        )}
        <button className="btn-primary glow-btn" onClick={handleCall}
          style={{ padding: "14px 40px", fontSize: 15, display: "inline-flex", alignItems: "center", gap: 10 }}>
          <MicIcon size={18} color="#050806" />
          {type === "generate" ? "Start Voice Setup" : "Join Interview"}
        </button>
      </div>
    </div>
  );
};

export default Agent;
