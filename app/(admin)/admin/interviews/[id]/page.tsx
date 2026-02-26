import { getInterviewById } from "@/lib/actions/general.action";
import { getInterviewCandidates } from "@/lib/actions/admin.action";
import { redirect } from "next/navigation";
import dayjs from "dayjs";
import Link from "next/link";
import CopyLinkButton from "@/components/CopyLinkButton";

const ScoreRingSmall = ({ score, passmark }: { score: number; passmark: number }) => {
  const size = 48;
  const passed = score >= passmark;
  const color = score >= 80 ? "var(--accent)" : score >= 60 ? "var(--warn)" : "var(--danger)";
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

const AdminInterviewDetailPage = async ({ params }: RouteParams) => {
  const { id } = await params;

  const interview = await getInterviewById(id);
  if (!interview) redirect("/admin/interviews");

  const candidates = await getInterviewCandidates(id);

  const passmark = interview.passmark ?? 70;
  const normalizedType = /mix/gi.test(interview.type) ? "Mixed" : interview.type;
  const badgeClass = normalizedType === "Technical" ? "badge-blue" : normalizedType === "Behavioural" ? "badge-purple" : "badge-green";

  const avgScore = candidates.length > 0
    ? Math.round(candidates.reduce((sum, c) => sum + c.totalScore, 0) / candidates.length)
    : 0;
  const passCount = candidates.filter((c) => c.totalScore >= passmark).length;
  const passRate = candidates.length > 0 ? Math.round((passCount / candidates.length) * 100) : 0;

  const interviewUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/interview/${id}`;

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ marginBottom: 8 }}>
        <Link href="/admin/interviews" style={{ fontSize: 13, color: "var(--muted-foreground)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
          ← Back to Interviews
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800, textTransform: "capitalize" }}>
            {interview.role}
          </h1>
          <span className={`badge ${badgeClass}`}>{normalizedType}</span>
          <span style={{ fontSize: 13, color: "var(--muted-foreground)", textTransform: "capitalize" }}>{interview.level}</span>
        </div>
        {interview.techstack?.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {interview.techstack.map((t: string) => (
              <span key={t} style={{ fontSize: 11, color: "var(--muted-foreground)", background: "var(--surface2)", padding: "2px 8px", borderRadius: 20, border: "1px solid var(--border2)" }}>
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Shareable link */}
      <div className="vp-card" style={{ marginBottom: 24, padding: 20 }}>
        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Candidate Link
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            /interview/{id}
          </div>
          <CopyLinkButton text={`${process.env.NEXT_PUBLIC_BASE_URL ?? (typeof window !== "undefined" ? window.location.origin : "")}/interview/${id}`} />
        </div>
        <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 8 }}>
          Share this link with candidates. They will need to create an account to take the interview.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
        {[
          { label: "Candidates", value: String(candidates.length), color: "var(--accent2)" },
          { label: "Avg Score", value: avgScore > 0 ? String(avgScore) : "—", color: "var(--accent)" },
          { label: "Pass Rate", value: candidates.length > 0 ? `${passRate}%` : "—", color: "var(--accent3)" },
          { label: "Passmark", value: `${passmark}%`, color: "var(--warn)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="vp-card" style={{ padding: 16 }}>
            <p style={{ fontSize: 11, color: "var(--muted-foreground)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
            <p style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 800, color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Candidates table */}
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
        Candidates
      </h2>
      {candidates.length > 0 ? (
        <div className="vp-card" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Candidate", "Email", "Score", "Status", "Date", ""].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "14px 20px", fontSize: 11, color: "var(--muted-foreground)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {candidates.map((c, i) => {
                const passed = c.totalScore >= passmark;
                return (
                  <tr key={c.feedbackId} style={{ borderBottom: i < candidates.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <td style={{ padding: "14px 20px", fontWeight: 500 }}>{c.userName}</td>
                    <td style={{ padding: "14px 20px", color: "var(--muted-foreground)" }}>{c.userEmail}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: c.totalScore >= 80 ? "var(--accent)" : c.totalScore >= 60 ? "var(--warn)" : "var(--danger)" }}>
                        {c.totalScore}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span className={`badge ${passed ? "badge-green" : "badge-red"}`}>
                        {passed ? "Passed" : "Failed"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px", color: "var(--muted-foreground)" }}>
                      {dayjs(c.createdAt).format("MMM D, YYYY")}
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <Link href={`/admin/interviews/${id}/candidates/${c.feedbackId}`}
                        style={{ fontSize: 13, color: "var(--accent2)", textDecoration: "none", fontWeight: 500 }}>
                        View Report
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="vp-card" style={{ textAlign: "center", padding: 40 }}>
          <p style={{ color: "var(--muted-foreground)" }}>
            No candidates have completed this interview yet.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminInterviewDetailPage;
