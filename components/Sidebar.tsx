"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase/client";
import { signOutAction } from "@/lib/actions/auth.action";

const MicIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="22"/>
  </svg>
);
const HomeIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
const ChartIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);
const UsersIcon = () => (
  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const LogoutIcon = () => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const navItems = [
  { href: "/",           label: "Dashboard",     icon: <HomeIcon /> },
  { href: "/interview",  label: "My Interviews",  icon: <MicIcon /> },
  { href: "/community",  label: "Community",      icon: <UsersIcon /> },
];

export default function Sidebar({ userName }: { userName?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut(auth);
    await signOutAction();
    router.push("/sign-in");
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
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
        <div style={{ width: 32, height: 32, borderRadius: 10, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <MicIcon />
        </div>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 17, color: "var(--text)" }}>VotrePrep</span>
      </div>

      {/* Nav links */}
      {navItems.map(({ href, label, icon }) => (
        <Link key={href} href={href} className={`sidebar-item ${isActive(href) ? "active" : ""}`}>
          {icon}
          {label}
        </Link>
      ))}

      <div style={{ flex: 1 }} />

      {/* Bottom */}
      <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 8 }}>
        {userName && (
          <div style={{ padding: "8px 12px", fontSize: 13, color: "var(--muted-foreground)", marginBottom: 4 }}>
            Signed in as <strong style={{ color: "var(--text)" }}>{userName}</strong>
          </div>
        )}
        <button className="sidebar-item" style={{ width: "100%", background: "none", textAlign: "left" }} onClick={handleSignOut}>
          <LogoutIcon /> Sign Out
        </button>
      </div>
    </aside>
  );
}
