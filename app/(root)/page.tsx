import InterviewCard from '@/components/InterviewCard';
import { getInterviewByUserId } from '@/lib/actions/general.action';
import { getCurrentUser } from '@/lib/actions/auth.action';
import Link from 'next/link';

const PlusIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const MicIcon = () => (
  <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="22"/>
  </svg>
);

const StatCard = ({ label, value, color, icon }: { label: string; value: string; color: string; icon: React.ReactNode }) => (
  <div className="vp-card fade-up">
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginBottom: 8 }}>{label}</p>
        <p style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, color }}>{value}</p>
      </div>
      <div style={{ color, opacity: 0.7 }}>{icon}</div>
    </div>
  </div>
);

const page = async () => {
  const user = await getCurrentUser();

  const userInterviews = await getInterviewByUserId(user?.id!);
  const totalInterviews = userInterviews?.length ?? 0;

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
            Welcome back, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p style={{ color: "var(--muted-foreground)", fontSize: 14 }}>Ready to level up your interview game?</p>
        </div>
        <Link href="/interview" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}
          className="btn-primary glow-btn">
          <PlusIcon /> New Interview
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 36 }}>
        <StatCard label="Total Interviews" value={String(totalInterviews)} color="var(--accent)"
          icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>}
        />
        <StatCard label="Community Members" value="1.2k+" color="var(--accent3)"
          icon={<svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        />
      </div>

      {/* Main grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 28, alignItems: "start" }}>
        {/* Your Interviews */}
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
            Your Interviews
          </h2>
          {totalInterviews > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {userInterviews?.map((interview) => (
                <InterviewCard {...interview} key={interview.id} userId={user?.id} />
              ))}
            </div>
          ) : (
            <div className="vp-card" style={{ textAlign: "center", padding: 40 }}>
              <p style={{ color: "var(--muted-foreground)", marginBottom: 16 }}>No interviews yet. Start your first one!</p>
              <Link href="/interview" className="btn-primary glow-btn" style={{ textDecoration: "none", display: "inline-block", padding: "11px 24px" }}>
                Begin Now
              </Link>
            </div>
          )}
        </div>

        {/* Quick Start CTA */}
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 700, marginBottom: 20 }}>Quick Start</h2>
          <div className="vp-card" style={{
            background: "linear-gradient(135deg, rgba(79,255,176,0.07) 0%, rgba(0,200,255,0.05) 100%)",
            border: "1px solid rgba(79,255,176,0.15)",
            textAlign: "center",
            padding: 28,
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: "50%",
              background: "rgba(79,255,176,0.12)",
              border: "1px solid rgba(79,255,176,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <MicIcon />
            </div>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, marginBottom: 8 }}>
              Start AI Interview
            </h3>
            <p style={{ fontSize: 13, color: "var(--muted-foreground)", marginBottom: 20, lineHeight: 1.6 }}>
              Voice-based practice with instant AI feedback across 5 key dimensions
            </p>
            <Link href="/interview" className="btn-primary glow-btn"
              style={{ textDecoration: "none", display: "block", padding: "13px", textAlign: "center" }}>
              Begin Now
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default page;
