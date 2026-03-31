import { getCurrentUser } from "@/lib/actions/auth.action";
import { getAdminInterviews, getInterviewCandidates } from "@/lib/actions/admin.action";
import dayjs from "dayjs";
import Link from "next/link";

const PlusIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const UsersIcon = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const AdminInterviewsPage = async () => {
  const user = await getCurrentUser();
  const interviews = await getAdminInterviews(user!.id);

  // Fetch candidate counts in parallel
  const candidateCounts = await Promise.all(
    interviews.map((iv) => getInterviewCandidates(iv.id).then((c) => c.length))
  );

  return (
    <div className="fade-up">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
            My Interviews
          </h1>
          <p style={{ color: "var(--muted-foreground)", fontSize: 14 }}>
            All interviews you have created
          </p>
        </div>
        <Link href="/admin/interviews/new" className="btn-primary glow-btn"
          style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <PlusIcon /> Create Interview
        </Link>
      </div>

      {interviews.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {interviews.map((iv, i) => {
            const normalizedType = /mix/gi.test(iv.type) ? "Mixed" : iv.type;
            const badgeClass = normalizedType === "Technical" ? "badge-blue" : normalizedType === "Behavioural" ? "badge-purple" : "badge-green";
            const count = candidateCounts[i];
            return (
              <div key={iv.id} className="vp-card" style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, marginBottom: 6, textTransform: "capitalize", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {iv.role}
                  </p>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span className={`badge ${badgeClass}`}>{normalizedType}</span>
                    <span style={{ fontSize: 12, color: "var(--muted-foreground)", textTransform: "capitalize" }}>{iv.level}</span>
                    {iv.passmark && (
                      <span style={{ fontSize: 12, color: "var(--warn)" }}>Passmark: {iv.passmark}%</span>
                    )}
                    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--muted-foreground)" }}>
                      <UsersIcon /> {count} candidate{count !== 1 ? "s" : ""}
                    </span>
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
        <div className="vp-card" style={{ textAlign: "center", padding: 48 }}>
          <p style={{ color: "var(--muted-foreground)", marginBottom: 16 }}>
            You haven't created any interviews yet.
          </p>
          <Link href="/admin/interviews/new" className="btn-primary glow-btn"
            style={{ textDecoration: "none", display: "inline-block", padding: "12px 28px" }}>
            Create Your First Interview
          </Link>
        </div>
      )}
    </div>
  );
};

export default AdminInterviewsPage;
