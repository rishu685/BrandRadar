import { DashboardNavbar } from '@/components/dashboardNavbar';
import { getEffectiveUser } from '@/lib/auth';

async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getEffectiveUser();

  return (
    <div className='flex min-h-svh flex-col bg-background'>
      <DashboardNavbar user={user} />
      <main className='flex-1'>{children}</main>
    </div>
  );
}

export default Layout;
