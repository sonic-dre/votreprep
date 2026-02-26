import React from 'react';
import dayjs from 'dayjs';
import Link from 'next/link';
import { getFeedbackByInterviewId } from '@/lib/actions/general.action';

const EyeIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);

const ScoreRing = ({ score, size = 52 }: { score: number; size?: number }) => {
  const color = score >= 80 ? "var(--accent)" : score >= 60 ? "var(--warn)" : score > 0 ? "var(--danger)" : "var(--border2)";
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

const InterviewCard = async ({ id, userId, role, type, techstack, createdAt }: InterviewCardProps) => {
  const feedback = userId && id ? await getFeedbackByInterviewId({ interviewId: id, userId }) : null;
  const normalizedType = /mix/gi.test(type) ? 'Mixed' : type;
  const formattedDate = dayjs(feedback?.createdAt || createdAt || Date.now()).format('MMM D, YYYY');
  const badgeClass = normalizedType === 'Technical' ? 'badge-blue' : normalizedType === 'Behavioural' ? 'badge-purple' : 'badge-green';
  const href = feedback ? `/interview/${id}/feedback` : `/interview/${id}`;

  return (
    <div className="vp-card" style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <ScoreRing score={feedback?.totalScore ?? 0} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, marginBottom: 5, textTransform: "capitalize", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {role} Interview
        </p>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span className={`badge ${badgeClass}`}>{normalizedType}</span>
          <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{formattedDate}</span>
          {techstack?.slice(0, 2).map((t) => (
            <span key={t} style={{ fontSize: 11, color: "var(--muted-foreground)", background: "var(--surface2)", padding: "2px 8px", borderRadius: 20, border: "1px solid var(--border2)" }}>{t}</span>
          ))}
        </div>
      </div>
      <Link href={href} style={{
        display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
        background: "var(--surface2)", border: "1px solid var(--border2)", borderRadius: 8,
        fontSize: 13, color: "var(--text)", textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0,
        transition: "border-color 0.2s",
      }}>
        <EyeIcon /> {feedback ? "Feedback" : "View"}
      </Link>
    </div>
  );
};

export default InterviewCard;
