import { getCurrentUser } from "@/lib/actions/auth.action";
import { getAdminInterviews, getInterviewCandidates } from "@/lib/actions/admin.action";
import dayjs from "dayjs";
import Link from "next/link";

const PlusIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const StatCard = ({ label, value, color }: { label: string; value: string; color: string }) => (
  <div className="vp-card fade-up">
    <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 8 }}>{label}</p>
    <p style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, color }}>{value}</p>
  </div>
);

const AdminDashboard = async () => {
  const user = await getCurrentUser();
  const interviews = await getAdminInterviews(user!.id);

  // Gather candidate counts and scores for stats
  const candidateData = await Promise.all(
    interviews.slice(0, 10).map((iv) => getInterviewCandidates(iv.id))
  );

  const totalCandidates = candidateData.reduce((sum, c) => sum + c.length, 0);
  const allScores = candidateData.flat().map((c) => c.totalScore).filter((s) => s > 0);
  const avgScore = allScores.length > 0
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : 0;

  const recentInterviews = interviews.slice(0, 5);

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
            Interviewer Dashboard
          </h1>
          <p style={{ color: "var(--muted-foreground)", fontSize: 14 }}>
            Manage your interviews and track candidate performance
          </p>
        </div>
        <Link href="/admin/interviews/new" className="btn-primary glow-btn"
          style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <PlusIcon /> Create Interview
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 36 }}>
        <StatCard label="Total Interviews" value={String(interviews.length)} color="var(--accent3)" />
        <StatCard label="Total Candidates" value={String(totalCandidates)} color="var(--accent2)" />
        <StatCard label="Avg Score" value={avgScore > 0 ? String(avgScore) : "—"} color="var(--warn)" />
      </div>

      {/* Recent interviews */}
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
        Recent Interviews
      </h2>
      {recentInterviews.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {recentInterviews.map((iv) => {
            const normalizedType = /mix/gi.test(iv.type) ? "Mixed" : iv.type;
            const badgeClass = normalizedType === "Technical" ? "badge-blue" : normalizedType === "Behavioural" ? "badge-purple" : "badge-green";
            return (
              <div key={iv.id} className="vp-card" style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, marginBottom: 5, textTransform: "capitalize", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {iv.role}
                  </p>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span className={`badge ${badgeClass}`}>{normalizedType}</span>
                    {iv.passmark && (
                      <span style={{ fontSize: 12, color: "var(--warn)" }}>Passmark: {iv.passmark}%</span>
                    )}
                    <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                      {dayjs(iv.createdAt).format("MMM D, YYYY")}
                    </span>
                  </div>
                </div>
                <Link href={`/admin/interviews/${iv.id}`} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
                  background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 8,
                  fontSize: 13, color: "var(--text)", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0,
                }}>
                  View
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="vp-card" style={{ textAlign: "center", padding: 40 }}>
          <p style={{ color: "var(--muted-foreground)", marginBottom: 16 }}>
            No interviews yet. Create your first one!
          </p>
          <Link href="/admin/interviews/new" className="btn-primary glow-btn"
            style={{ textDecoration: "none", display: "inline-block", padding: "11px 24px" }}>
            Create Interview
          </Link>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
