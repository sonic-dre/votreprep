"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createAdminInterview } from "@/lib/actions/admin.action";
import Agent from "@/components/Agent";

const FormIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);
const MicIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>
  </svg>
);

const NewInterviewClient = ({ userId, userName }: { userId: string; userName: string }) => {
  const router = useRouter();
  const [tab, setTab] = useState<"form" | "voice">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    role: "",
    level: "Mid",
    type: "Mixed",
    techstack: "",
    amount: "8",
    passmark: "70",
    jobDescription: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.role.trim()) { setError("Job role is required."); return; }
    setError("");
    setLoading(true);
    try {
      const result = await createAdminInterview({
        adminId: userId,
        role: form.role.trim(),
        level: form.level,
        type: form.type,
        techstack: form.techstack,
        amount: Number(form.amount),
        passmark: Number(form.passmark),
        jobDescription: form.jobDescription || undefined,
      });
      if (result.success && result.interviewId) {
        router.push(`/admin/interviews/${result.interviewId}`);
      } else {
        setError("Failed to generate interview. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
          Create New Interview
        </h1>
        <p style={{ color: "var(--muted-foreground)", fontSize: 14 }}>
          Set up via form or let the AI guide you through voice
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: "var(--surface2)", borderRadius: 10, padding: 4, marginBottom: 28, width: "fit-content" }}>
        {([
          { key: "form" as const, label: "Form Setup", icon: <FormIcon /> },
          { key: "voice" as const, label: "Voice Setup", icon: <MicIcon /> },
        ]).map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: tab === key ? "var(--surface)" : "transparent",
              color: tab === key ? "var(--text)" : "var(--muted-foreground)",
              border: tab === key ? "1px solid var(--border2)" : "none",
              cursor: "pointer", transition: "all 0.2s",
            }}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ── FORM TAB ── */}
      {tab === "form" && (
        <div style={{ maxWidth: 720 }}>
          <div className="vp-card" style={{ padding: 32 }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                <div>
                  <label>Job Role / Position Title</label>
                  <input name="role" value={form.role} onChange={handleChange} placeholder="e.g. Senior React Developer" required />
                </div>
                <div>
                  <label>Experience Level</label>
                  <select name="level" value={form.level} onChange={handleChange}>
                    <option>Junior</option><option>Mid</option><option>Senior</option>
                  </select>
                </div>
              </div>

              <div>
                <label>Tech Stack / Focus Areas</label>
                <input name="techstack" value={form.techstack} onChange={handleChange} placeholder="e.g. React, TypeScript, Node.js, PostgreSQL" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>
                <div>
                  <label>Interview Type</label>
                  <select name="type" value={form.type} onChange={handleChange}>
                    <option>Technical</option><option>Behavioural</option><option>Mixed</option>
                  </select>
                </div>
                <div>
                  <label>Number of Questions</label>
                  <select name="amount" value={form.amount} onChange={handleChange}>
                    <option value="5">5</option><option value="8">8</option>
                    <option value="10">10</option><option value="15">15</option>
                  </select>
                </div>
                <div>
                  <label>Passmark (%)</label>
                  <input name="passmark" type="number" min={0} max={100} value={form.passmark} onChange={handleChange}
                    style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--warn)" }} />
                </div>
              </div>

              <div style={{ padding: 14, background: "rgba(255,209,102,0.06)", border: "1px solid rgba(255,209,102,0.15)", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
                </svg>
                <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
                  Candidates scoring below <strong style={{ color: "var(--warn)" }}>{form.passmark}%</strong> will be marked as failed.
                </span>
              </div>

              <div>
                <label>
                  Job Description{" "}
                  <span style={{ color: "var(--muted-foreground)", fontWeight: 400 }}>(optional — paste to generate tailored questions)</span>
                </label>
                <textarea name="jobDescription" value={form.jobDescription} onChange={handleChange}
                  rows={6} placeholder="Paste the full job description here…" style={{ resize: "vertical" }} />
              </div>

              {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}

              <div style={{ display: "flex", gap: 12 }}>
                <button type="submit" className="btn-primary glow-btn" disabled={loading}
                  style={{ flex: 1, padding: "14px", fontSize: 15, opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  {loading ? (
                    <>
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        style={{ animation: "spin 1s linear infinite" }}>
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      Generating questions…
                    </>
                  ) : "Generate Interview"}
                </button>
                <button type="button" className="btn-secondary" onClick={() => router.back()} style={{ padding: "14px 24px" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── VOICE TAB ── */}
      {tab === "voice" && (
        <div style={{ maxWidth: 560 }}>
          <div className="vp-card" style={{
            padding: 32,
            background: "linear-gradient(135deg, rgba(167,139,250,0.04) 0%, rgba(0,200,255,0.02) 100%)",
            border: "1px solid rgba(167,139,250,0.15)",
          }}>
            <p style={{ color: "var(--muted-foreground)", fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
              Click below to start a voice conversation. The AI will ask you about the role, level, and tech stack to generate a customised interview for your candidates.
            </p>
            <Agent
              userName={userName}
              userId={userId}
              type="generate"
              redirectTo="/admin/interviews"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default NewInterviewClient;
