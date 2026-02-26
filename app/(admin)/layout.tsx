import { getCurrentUser } from "@/lib/actions/auth.action";
import { redirect } from "next/navigation";
import { ReactNode } from "react";
import AdminSidebar from "@/components/AdminSidebar";

const AdminLayout = async ({ children }: { children: ReactNode }) => {
  const user = await getCurrentUser();

  if (!user) redirect("/sign-in");
  if (user.role !== "admin") redirect("/");

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <AdminSidebar userName={user.name} />
      <main style={{
        marginLeft: 220,
        flex: 1,
        padding: "36px 40px",
        maxWidth: "calc(100vw - 220px)",
        minHeight: "100vh",
      }}>
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
