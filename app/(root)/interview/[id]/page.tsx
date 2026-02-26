import Agent from "@/components/Agent";
import { getCurrentUser } from "@/lib/actions/auth.action";
import { getInterviewById } from "@/lib/actions/general.action";
import { redirect } from "next/navigation";

const page = async ({ params }: RouteParams) => {
  const { id } = await params;

  const interview = await getInterviewById(id);
  const user = await getCurrentUser();

  if (!interview) redirect("/");

  const normalizedType = /mix/gi.test(interview.type) ? "Mixed" : interview.type;
  const badgeClass =
    normalizedType === "Technical"
      ? "badge-blue"
      : normalizedType === "Behavioural"
      ? "badge-purple"
      : "badge-green";

  return (
    <div className="fade-up">
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, textTransform: "capitalize" }}>
            {interview.role} Interview
          </h1>
          <span className={`badge ${badgeClass}`}>{normalizedType}</span>
        </div>
        <p style={{ color: "var(--muted-foreground)", fontSize: 14 }}>
          Answer each question naturally — the AI will evaluate your responses
        </p>
      </div>

      {/* Interview info strip */}
      {interview.techstack?.length > 0 && (
        <div style={{
          display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28,
        }}>
          {interview.techstack.map((t: string) => (
            <span key={t} style={{
              fontSize: 12, color: "var(--muted-foreground)",
              background: "var(--surface2)", padding: "3px 10px",
              borderRadius: 20, border: "1px solid var(--border2)",
            }}>
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Agent voice UI */}
      <Agent
        userName={user?.name ?? ""}
        userId={user?.id}
        interviewId={id}
        type="interview"
        questions={interview.questions}
      />
    </div>
  );
};

export default page;
