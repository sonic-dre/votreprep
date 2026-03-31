"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase/client";
import { signOutAction } from "@/lib/actions/auth.action";

const HomeIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const BriefcaseIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);
const LogoutIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const MicIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#050806" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>
  </svg>
);

const navItems = [
  { href: "/admin", label: "Dashboard", icon: <HomeIcon /> },
  { href: "/admin/interviews", label: "Interviews", icon: <BriefcaseIcon /> },
];

const AdminSidebar = ({ userName }: { userName?: string }) => {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    await signOutAction();
    router.push("/sign-in");
  };

  return (
    <aside style={{
      width: 220,
      borderRight: "1px solid var(--border)",
      padding: "24px 12px",
      display: "flex",
      flexDirection: "column",
      gap: 4,
      flexShrink: 0,
      position: "fixed",
      top: 0,
      left: 0,
      height: "100vh",
      background: "var(--bg)",
      zIndex: 10,
      overflowY: "auto",
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 20px" }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: "var(--accent3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <MicIcon />
        </div>
        <div>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17 }}>VotrePrep</span>
          <p style={{ fontSize: 10, color: "var(--accent3)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>Interviewer</p>
        </div>
      </div>

      {/* Nav */}
      {navItems.map(({ href, label, icon }) => {
        const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link key={href} href={href} style={{ textDecoration: "none" }}>
            <div className={`sidebar-item ${isActive ? "active" : ""}`} style={isActive ? { color: "var(--accent3)", background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.15)" } : {}}>
              {icon} {label}
            </div>
          </Link>
        );
      })}

      <div style={{ flex: 1 }} />

      {/* Footer */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 8 }}>
        {userName && (
          <div style={{ padding: "8px 12px", fontSize: 13, color: "var(--muted-foreground)", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {userName}
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="sidebar-item"
          style={{ width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, fontSize: 14, color: "var(--muted-foreground)" }}
        >
          <LogoutIcon /> Sign Out
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
