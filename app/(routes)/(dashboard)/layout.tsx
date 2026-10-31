import { redirect } from 'next/navigation';
import { DashboardNavbar } from '@/components/dashboardNavbar';
import { getSessionUser } from '@/lib/auth';

async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  return (
    <div className='flex min-h-svh flex-col bg-background'>
      <DashboardNavbar user={user} />
      <main className='flex-1'>{children}</main>
    </div>
  );
}

export default Layout;
