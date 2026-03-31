import { getCurrentUser, isAuthenticated } from '@/lib/actions/auth.action'
import { redirect } from 'next/navigation'
import { ReactNode } from 'react'
import Sidebar from '@/components/Sidebar'

const RootLayout = async ({ children }: { children: ReactNode }) => {
  const isUserAuthenticated = await isAuthenticated();
  if (!isUserAuthenticated) redirect('/sign-in');

  const user = await getCurrentUser();
  if (user?.role === 'admin') redirect('/admin');

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar userName={user?.name} />
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

export default RootLayout;
