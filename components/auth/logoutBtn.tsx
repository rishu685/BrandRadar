'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';

export function LogoutBtn() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleLogout = async () => {
    setIsPending(true);
    const { error } = await authClient.signOut();

    if (error) {
      toast.error(error.message || 'We could not sign you out.');
      setIsPending(false);
      return;
    }

    toast.success('User signed out successfully!');
    router.replace('/auth/sign-in');
    router.refresh();
  };

  return (
    <Button
      type='button'
      variant='outline'
      onClick={handleLogout}
      disabled={isPending}
    >
      <LogOut data-icon='inline-start' />
      {isPending ? 'Signing out…' : 'Log out'}
    </Button>
  );
}
