"use client";

/**
 * NewInterviewClient
 *
 * Client component for the "Create New Interview" page.
 * Provides two creation modes:
 *  - Form Setup  : manual form with optional JD file upload that auto-fills fields
 *  - Voice Setup : AI-guided voice conversation via the Agent component
 */

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createAdminInterview } from "@/lib/actions/admin.action";
import Agent from "@/components/Agent";

// ─── Icon components ────────────────────────────────────────────────────────

/** Document / form icon used in the tab switcher */
const FormIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
);

/** Microphone icon used in the tab switcher */
const MicIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>
  </svg>
);

/** Upload arrow icon shown inside the JD dropzone */
const UploadIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

// ─── Types ───────────────────────────────────────────────────────────────────

/** Shape returned by the /api/parse-jd endpoint on success */
interface ParsedJD {
  role: string;
  level: string;
  type: string;
  techstack: string;
  passmark: string;
  amount: string;
  jobDescription: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

const NewInterviewClient = ({ userId, userName }: { userId: string; userName: string }) => {
  const router = useRouter();

  // Active tab: "form" (manual) or "voice" (AI-guided)
  const [tab, setTab] = useState<"form" | "voice">("form");

  // Form submission loading / error state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // JD file upload state machine
  const [uploadState, setUploadState] = useState<"idle" | "parsing" | "done" | "error">("idle");
  const [uploadError, setUploadError] = useState("");
  const [dragging, setDragging] = useState(false);

  // Hidden <input type="file"> reference — triggered by clicking the dropzone
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    role: "",           // Job title / position name
    level: "Mid",       // Seniority: Junior | Mid | Senior
    type: "Mixed",      // Interview focus: Technical | Behavioural | Mixed
    techstack: "",      // Comma-separated tools & languages
    amount: "8",        // Number of questions to generate
    passmark: "70",     // Minimum passing score (%)
    jobDescription: "", // Full JD text — passed to Groq for richer question generation
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  /** Generic controlled-input handler — updates the matching form field by name */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /**
   * Uploads the selected file to /api/parse-jd, which:
   *  1. Extracts plain text from PDF / DOCX / TXT
   *  2. Sends the text to Groq to infer role, level, type, techstack, passmark
   *  3. Returns a ParsedJD object
   *
   * On success the form fields are populated automatically.
   * Existing values are preserved when the API returns an empty string for a field.
   */
  const handleFileUpload = async (file: File) => {
    setUploadState("parsing");
    setUploadError("");

    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/parse-jd", { method: "POST", body: fd });
      const data: ParsedJD & { error?: string } = await res.json();

      if (!res.ok) {
        setUploadError(data.error ?? "Failed to parse file.");
        setUploadState("error");
        return;
      }

      // Merge parsed values into form — keep existing value when API returns empty
      setForm((prev) => ({
        ...prev,
        role:           data.role           || prev.role,
        level:          data.level          || prev.level,
        type:           data.type           || prev.type,
        techstack:      data.techstack      || prev.techstack,
        passmark:       data.passmark       || prev.passmark,
        amount:         data.amount         || prev.amount,
        jobDescription: data.jobDescription || prev.jobDescription,
      }));

      setUploadState("done");
    } catch {
      setUploadError("Something went wrong while parsing the file.");
      setUploadState("error");
    }
  };

  /** Handles file selection via the hidden <input type="file"> */
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  /** Handles files dropped onto the dropzone area */
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  /**
   * Submits the form to createAdminInterview():
   *  - Calls the Groq API to generate interview questions
   *  - Saves the interview document to Firestore
   *  - Redirects to the new interview's detail page on success
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.role.trim()) { setError("Job role is required."); return; }
    setError("");
    setLoading(true);

    try {
      const result = await createAdminInterview({
        adminId:        userId,
        role:           form.role.trim(),
        level:          form.level,
        type:           form.type,
        techstack:      form.techstack,
        amount:         Number(form.amount),
        passmark:       Number(form.passmark),
        jobDescription: form.jobDescription || undefined,
      });

      if (result.success && result.interviewId) {
        router.push(`/admin/interviews/${result.interviewId}`);
      } else {
        setError(`Failed to generate interview: ${(result as any).error ?? "Unknown error"}`);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="fade-up">
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, marginBottom: 6 }}>
          Create New Interview
        </h1>
        <p style={{ color: "var(--muted-foreground)", fontSize: 14 }}>
          Set up via form or let the AI guide you through voice
        </p>
      </div>

      {/* ── Tab switcher ── */}
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

      {/* ════════════════════════════════════════
          FORM TAB
          ════════════════════════════════════════ */}
      {tab === "form" && (
        <div style={{ maxWidth: 720 }}>

          {/* ── JD Upload Dropzone ──────────────────────────────────────────
              Accepts PDF, DOCX, or TXT job descriptions.
              On upload the file is sent to /api/parse-jd, which extracts the
              text and asks Groq to infer the interview fields automatically.
              The dropzone cycles through four visual states:
                idle    → prompt to drag/click
                parsing → spinner while waiting for API
                done    → green checkmark confirming fields were populated
                error   → inline error message
          ─────────────────────────────────────────────────────────────────── */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              marginBottom: 24,
              border: `2px dashed ${
                dragging                ? "var(--accent)" :
                uploadState === "done"  ? "var(--success, #22c55e)" :
                "var(--border2)"
              }`,
              borderRadius: 12,
              padding: "24px 20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
              background:
                dragging                ? "rgba(124,58,237,0.04)" :
                uploadState === "done"  ? "rgba(34,197,94,0.04)" :
                "var(--surface2)",
              transition: "all 0.2s",
            }}
          >
            {/* Hidden file input — programmatically clicked by the dropzone */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              style={{ display: "none" }}
              onChange={onFileChange}
            />

            {/* Parsing state: spinner */}
            {uploadState === "parsing" ? (
              <>
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"
                  style={{ animation: "spin 1s linear infinite" }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>Parsing job description…</span>
              </>

            ) : uploadState === "done" ? (
              /* Success state: green checkmark */
              <>
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--success, #22c55e)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span style={{ fontSize: 13, color: "var(--success, #22c55e)", fontWeight: 600 }}>Fields populated from JD</span>
                <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Click to upload a different file</span>
              </>

            ) : (
              /* Idle / error state: upload prompt */
              <>
                <UploadIcon />
                <span style={{ fontSize: 13, fontWeight: 600 }}>Upload Job Description</span>
                <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                  Drag & drop or click — PDF, DOCX, or TXT. Fields will be auto-filled from the JD.
                </span>
                {/* Show inline error only when the upload failed */}
                {uploadState === "error" && (
                  <span style={{ fontSize: 12, color: "var(--danger)" }}>{uploadError}</span>
                )}
              </>
            )}
          </div>

          {/* ── Interview Details Form ───────────────────────────────────────
              All fields are editable regardless of whether a JD was uploaded.
              The JD upload pre-fills values but the admin can override anything.
          ─────────────────────────────────────────────────────────────────── */}
          <div className="vp-card" style={{ padding: 32 }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

              {/* Row 1: Job role + Experience level */}
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

              {/* Row 2: Tech stack (comma-separated, split into array on the server) */}
              <div>
                <label>Tech Stack / Focus Areas</label>
                <input name="techstack" value={form.techstack} onChange={handleChange} placeholder="e.g. React, TypeScript, Node.js, PostgreSQL" />
              </div>

              {/* Row 3: Interview type + question count + passmark */}
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
                  {/* Passmark stored as a percentage; candidates below this score are marked failed */}
                  <label>Passmark (%)</label>
                  <input name="passmark" type="number" min={0} max={100} value={form.passmark} onChange={handleChange}
                    style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--warn)" }} />
                </div>
              </div>

              {/* Passmark explainer banner */}
              <div style={{ padding: 14, background: "rgba(255,209,102,0.06)", border: "1px solid rgba(255,209,102,0.15)", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>
                </svg>
                <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
                  Candidates scoring below <strong style={{ color: "var(--warn)" }}>{form.passmark}%</strong> will be marked as failed.
                </span>
              </div>

              {/* Job description textarea — pre-filled by upload or entered manually.
                  Forwarded to Groq so generated questions are contextually relevant. */}
              <div>
                <label>
                  Job Description{" "}
                  <span style={{ color: "var(--muted-foreground)", fontWeight: 400 }}>(optional — paste to generate tailored questions)</span>
                </label>
                <textarea name="jobDescription" value={form.jobDescription} onChange={handleChange}
                  rows={6} placeholder="Paste the full job description here…" style={{ resize: "vertical" }} />
              </div>

              {/* Submission error message */}
              {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}

              {/* Action buttons */}
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

      {/* ════════════════════════════════════════
          VOICE TAB
          The Agent component manages a Vapi voice session.
          The AI asks the admin about the role, level, and tech stack,
          then calls createAdminInterview() and redirects to /admin/interviews.
          ════════════════════════════════════════ */}
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
