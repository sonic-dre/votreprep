import Agent from "@/components/Agent";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getInterviewByUserId } from "@/lib/actions/general.action";
import Link from "next/link";

const EyeIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const ScoreRingSmall = ({ score }: { score: number }) => {
  const size = 48;
  const color = score >= 80 ? "var(--accent)" : score >= 60 ? "var(--warn)" : score > 0 ? "var(--danger)" : "var(--muted-foreground)";
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = score > 0 ? circ - (score / 100) * circ : circ;
  return (
    <div style={{ position: "relative", width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <svg width={size} height={size} style={{ position: "absolute", transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: size * 0.26, color }}>
        {score > 0 ? score : "—"}
      </span>
    </div>
  );
};

const page = async () => {
  const user = await getCurrentUser();
  const userInterviews = await getInterviewByUserId(user?.id!);

  return (
    <div className="fade-up">
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
        My Interviews
      </h1>
      <p style={{ color: "var(--muted-foreground)", fontSize: 14, marginBottom: 32 }}>
        Practice with the AI voice interviewer or review past sessions
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 28, alignItems: "start" }}>
        {/* Left: Voice setup via Agent */}
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
            Start New Interview
          </h2>
          <div className="vp-card" style={{
            padding: 32,
            background: "linear-gradient(135deg, rgba(79,255,176,0.04) 0%, rgba(0,200,255,0.02) 100%)",
            border: "1px solid rgba(79,255,176,0.12)",
          }}>
            <p style={{ color: "var(--muted-foreground)", fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
              Click below to start a voice conversation with the AI. It will ask you about the role, experience level, and tech stack to generate a personalized interview for you.
            </p>
            <Agent userName={user?.name ?? ""} userId={user?.id} type="generate" />
          </div>
        </div>

        {/* Right: Past sessions */}
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
            Past Sessions
          </h2>
          {(userInterviews?.length ?? 0) > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {userInterviews?.map((iv) => (
                <Link
                  key={iv.id}
                  href={`/interview/${iv.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <div className="vp-card" style={{ padding: 16, cursor: "pointer", transition: "border-color 0.2s" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <ScoreRingSmall score={0} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 3, textTransform: "capitalize", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {iv.role} Interview
                        </p>
                        <p style={{ fontSize: 12, color: "var(--muted-foreground)", textTransform: "capitalize" }}>
                          {iv.type}
                        </p>
                      </div>
                      <EyeIcon />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="vp-card" style={{ textAlign: "center", padding: 32 }}>
              <p style={{ color: "var(--muted-foreground)", fontSize: 14 }}>
                No past sessions yet. Start your first interview above!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default page;
