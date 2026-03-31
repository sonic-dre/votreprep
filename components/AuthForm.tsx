"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase/client";
import { signUp, signIn } from "@/lib/actions/auth.action";
import Link from "next/link";
import { useState } from "react";

const MicIcon = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#050806" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="22"/>
  </svg>
);

const authFormSchema = (type: FormType) =>
  z.object({
    name: type === "sign-up" ? z.string().min(3) : z.string().optional(),
    email: z.string().email(),
    password: z.string().min(3),
  });

const AuthForm = ({ type }: { type: FormType }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"candidate" | "admin">("candidate");
  const isSignIn = type === "sign-in";
  const formSchema = authFormSchema(type);

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      if (type === "sign-up") {
        const { name, email, password } = data;
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const result = await signUp({ uid: userCredential.user.uid, name: name!, email, password, role });
        if (!result.success) { toast.error(result.message); return; }
        toast.success("Account created! Please sign in.");
        router.push("/sign-in");
      } else {
        const { email, password } = data;
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await userCredential.user.getIdToken();
        if (!idToken) { toast.error("Sign in failed. Try again."); return; }
        await signIn({ email, idToken });
        toast.success("Signed in successfully.");
        router.push("/");
      }
    } catch (error: any) {
      toast.error(error?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden", background: "var(--bg)" }}>
      {/* bg glow decorations */}
      <div style={{ position: "absolute", top: -200, left: -200, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(79,255,176,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -200, right: -200, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(0,200,255,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 440 }} className="fade-up">
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MicIcon />
            </div>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>VotrePrep</span>
          </div>
          <p style={{ color: "var(--muted-foreground)", fontSize: 14 }}>AI-powered mock interview platform</p>
        </div>

        <div className="vp-card" style={{ padding: 32 }}>
          {/* Tabs */}
          <div style={{ display: "flex", background: "var(--surface2)", borderRadius: 10, padding: 4, marginBottom: 28 }}>
            {(["sign-in", "sign-up"] as const).map((mode) => (
              <Link key={mode} href={mode === "sign-in" ? "/sign-in" : "/sign-up"} style={{
                flex: 1, padding: "8px", borderRadius: 8, fontSize: 13, fontWeight: 600, textAlign: "center",
                background: type === mode ? "var(--surface)" : "transparent",
                color: type === mode ? "var(--text)" : "var(--muted-foreground)",
                border: type === mode ? "1px solid var(--border2)" : "none",
                transition: "all 0.2s", textDecoration: "none",
              }}>
                {mode === "sign-in" ? "Sign In" : "Sign Up"}
              </Link>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {!isSignIn && (
              <div>
                <label>Full Name</label>
                <input {...register("name")} placeholder="Your name" />
                {errors.name && <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 4 }}>{errors.name.message}</p>}
              </div>
            )}
            <div>
              <label>Email Address</label>
              <input {...register("email")} type="email" placeholder="you@example.com" />
              {errors.email && <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 4 }}>{errors.email.message}</p>}
            </div>
            <div style={{ marginBottom: 8 }}>
              <label>Password</label>
              <input {...register("password")} type="password" placeholder="••••••••" />
              {errors.password && <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 4 }}>{errors.password.message}</p>}
            </div>

            {!isSignIn && (
              <div>
                <label>I am a</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {(["candidate", "admin"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      style={{
                        flex: 1, padding: "10px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                        background: role === r ? (r === "admin" ? "rgba(167,139,250,0.12)" : "rgba(79,255,176,0.1)") : "var(--surface2)",
                        color: role === r ? (r === "admin" ? "var(--accent3)" : "var(--accent)") : "var(--muted-foreground)",
                        border: role === r ? `1px solid ${r === "admin" ? "rgba(167,139,250,0.3)" : "rgba(79,255,176,0.25)"}` : "1px solid var(--border2)",
                        cursor: "pointer", transition: "all 0.2s",
                      }}
                    >
                      {r === "candidate" ? "Candidate" : "Interviewer"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" className="btn-primary glow-btn" disabled={loading}
              style={{ width: "100%", padding: "13px", fontSize: 15, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Please wait…" : isSignIn ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "var(--muted-foreground)" }}>
            {isSignIn ? "No account yet? " : "Already have an account? "}
            <Link href={isSignIn ? "/sign-up" : "/sign-in"}
              style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>
              {isSignIn ? "Sign Up" : "Sign In"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
