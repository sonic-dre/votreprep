import { getCurrentUser } from "@/lib/actions/auth.action";
import { getFeedbackByInterviewId, getInterviewById } from "@/lib/actions/general.action";
import dayjs from "dayjs";
import Link from "next/link";
import { redirect } from "next/navigation";

const CheckIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const ArrowIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

const ScoreRing = ({ score }: { score: number }) => {
  const size = 100;
  const color = score >= 80 ? "#4fffb0" : score >= 60 ? "var(--warn)" : "var(--danger)";
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg width={size} height={size} style={{ position: "absolute", transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: size * 0.25, color }}>{score}</span>
    </div>
  );
};

const CATEGORY_COLORS = ["#4fffb0", "#00c8ff", "#a78bfa", "#ffd166", "#ff8c42"];

const Feedback = async ({ params }: RouteParams) => {
  const { id } = await params;

  const user = await getCurrentUser();
  const interview = await getInterviewById(id);

  if (!interview) redirect("/");

  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user?.id!,
  });

  if (!feedback) redirect("/");

  const normalizedType = /mix/gi.test(interview.type) ? "Mixed" : interview.type;
  const date = dayjs(feedback.createdAt).format("MMM D, YYYY");
  const performanceLabel =
    feedback.totalScore >= 80
      ? "Strong Performance"
      : feedback.totalScore >= 60
      ? "Good Progress"
      : "Needs Improvement";
  const performanceBadge =
    feedback.totalScore >= 80 ? "badge-green" : feedback.totalScore >= 60 ? "badge-yellow" : "badge-red";

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
          Interview Feedback
        </h1>
        <p style={{ color: "var(--muted-foreground)", fontSize: 14, textTransform: "capitalize" }}>
          {interview.role} · {normalizedType} · {date}
        </p>
      </div>

      {/* Overall score banner */}
      <div style={{
        display: "flex", alignItems: "center", gap: 28, marginBottom: 32,
        padding: 24,
        background: "linear-gradient(135deg, rgba(79,255,176,0.06) 0%, rgba(0,200,255,0.04) 100%)",
        border: "1px solid rgba(79,255,176,0.15)",
        borderRadius: 16,
      }}>
        <ScoreRing score={feedback.totalScore ?? 0} />
        <div>
          <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Overall Score
          </p>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 800, color: "var(--accent)", marginBottom: 8 }}>
            {feedback.totalScore}
            <span style={{ fontSize: 18, color: "var(--muted-foreground)" }}>/100</span>
          </h2>
          <span className={`badge ${performanceBadge}`}>{performanceLabel}</span>
        </div>
      </div>

      {/* Category breakdown */}
      {feedback.categoryScores?.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
            Category Breakdown
          </h3>
          <div className="vp-card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {feedback.categoryScores.map((cat: { name: string; score: number; comment: string }, i: number) => {
              const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
              return (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{cat.name}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color }}>{cat.score}</span>
                  </div>
                  <div style={{ height: 6, background: "var(--surface2)", borderRadius: 6, overflow: "hidden", marginBottom: 6 }}>
                    <div style={{ height: "100%", width: `${cat.score}%`, background: color, borderRadius: 6 }} />
                  </div>
                  {cat.comment && (
                    <p style={{ fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.5 }}>{cat.comment}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Strengths & Improvements */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        {/* Strengths */}
        <div style={{
          padding: 20,
          background: "rgba(79,255,176,0.05)",
          border: "1px solid rgba(79,255,176,0.12)",
          borderRadius: 12,
        }}>
          <h4 style={{ color: "var(--accent)", fontWeight: 700, fontSize: 13, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            ✦ Strengths
          </h4>
          {feedback.strengths?.map((s: string, i: number) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <div style={{ flexShrink: 0, marginTop: 2 }}><CheckIcon /></div>
              <p style={{ fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.5 }}>{s}</p>
            </div>
          ))}
        </div>

        {/* Improvements */}
        <div style={{
          padding: 20,
          background: "rgba(255,95,126,0.05)",
          border: "1px solid rgba(255,95,126,0.12)",
          borderRadius: 12,
        }}>
          <h4 style={{ color: "var(--danger)", fontWeight: 700, fontSize: 13, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            ▲ Improve
          </h4>
          {feedback.areasForImprovement?.map((s: string, i: number) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <div style={{ flexShrink: 0, marginTop: 2 }}><ArrowIcon /></div>
              <p style={{ fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.5 }}>{s}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Final assessment */}
      {feedback.finalAssessment && (
        <div style={{
          padding: 20,
          background: "var(--surface2)",
          borderRadius: 12,
          border: "1px solid var(--border)",
          marginBottom: 32,
        }}>
          <h4 style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted-foreground)" }}>
            Final Assessment
          </h4>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--text)" }}>{feedback.finalAssessment}</p>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 12 }}>
        <Link href="/" className="btn-secondary" style={{
          textDecoration: "none", padding: "12px 24px", borderRadius: 10,
          fontSize: 14, fontWeight: 500,
        }}>
          Back to Dashboard
        </Link>
        <Link href={`/interview/${id}`} className="btn-primary glow-btn" style={{
          textDecoration: "none", padding: "12px 24px", borderRadius: 10,
          fontSize: 14, fontWeight: 600,
        }}>
          Retake Interview
        </Link>
      </div>
    </div>
  );
};

export default Feedback;
