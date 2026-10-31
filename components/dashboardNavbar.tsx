'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { GaugeIcon, LogOutIcon, MenuIcon, MoonIcon, StarIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { Logo } from '@/components/logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from './ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth-client';
import { useBilling } from '@/hooks/use-billing';

const navigationItems = [
  { title: 'AI Search Visibility', href: '/ai-search-visibility' },
  { title: 'AI Keyword Research', href: '/ai-keyword' },
  { title: '/llms.txt', href: '/llms-txt' },
  { title: 'Crawler Audit', href: '/crawler-audit' },
  { title: 'All Reports', href: '/reports' },
  { title: 'Status', href: '/billing' },
];

type DashboardUser = {
  name: string;
  email: string;
  image?: string | null;
};

export function DashboardNavbar({ user }: { user?: DashboardUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const billing = useBilling();
  const { resolvedTheme, setTheme } = useTheme();
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'BR';

  const handleSignOut = async () => {
    const { error } = await authClient.signOut();

    if (error) {
      toast.error(error.message || 'We could not sign you out.');
      return;
    }

    router.replace('/');
    router.refresh();
  };

  return (
    <header className='sticky top-0 z-40 border-b bg-background/95 backdrop-blur'>
      <div className='mx-auto flex h-16 w-full max-w-6xl items-center px-5 sm:px-8'>
        <Logo href='/ai-keyword' />

        <div className='mx-5 hidden h-8 w-px bg-border lg:block' />

        <nav
          aria-label='Dashboard navigation'
          className='hidden h-full items-center lg:flex'
        >
          {navigationItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex h-full items-center px-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground',
                  isActive &&
                    'text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-primary',
                )}
              >
                {item.title}
              </Link>
            );
          })}
        </nav>

        <div className='ml-auto flex items-center gap-2'>
          <a
            href='https://github.com/rishu685/BrandRadar'
            target='_blank'
            rel='noopener noreferrer'
            className='hidden items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent sm:inline-flex'
          >
            <StarIcon className='size-3.5 fill-amber-400 text-amber-400' />
            <span>Star</span>
          </a>

          <Badge
            render={<Link href='/billing' />}
            variant='default'
            className='hidden rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs text-primary xl:inline-flex'
            aria-label='BrandRadar Open Source Edition'
          >
            <GaugeIcon aria-hidden='true' />
            Open Source · Unlimited
          </Badge>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant='ghost'
                  size='icon-sm'
                  aria-label='Open dashboard navigation'
                  className='lg:hidden'
                />
              }
            >
              <MenuIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' sideOffset={10} className='w-64'>
              <DropdownMenuLabel>Navigation</DropdownMenuLabel>
              <div className='flex flex-col py-1'>
                {navigationItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'px-3 py-2 text-sm font-medium transition-colors hover:bg-accent',
                        isActive && 'bg-primary/10 text-primary',
                      )}
                    >
                      {item.title}
                    </Link>
                  );
                })}
                <span className='px-3 py-2 text-sm font-medium text-muted-foreground'>
                  Apps &amp; Integrations
                </span>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type='button'
                  className='rounded-full outline-none transition-opacity hover:opacity-85 focus-visible:ring-2 focus-visible:ring-ring'
                  aria-label='Open user menu'
                />
              }
            >
              <Avatar className='size-9 border'>
                <AvatarImage src='/brand-logo.png' alt='BrandRadar' />
                <AvatarFallback className='bg-primary/10 text-xs font-bold text-primary'>
                  BR
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>

            <DropdownMenuContent align='end' sideOffset={10} className='w-56'>
              <DropdownMenuGroup>
                <DropdownMenuLabel className='normal-case tracking-normal'>
                  <span className='flex min-w-0 flex-col gap-0.5'>
                    <span className='truncate text-sm font-semibold text-foreground'>
                      BrandRadar
                    </span>
                    <span className='truncate text-xs font-normal text-muted-foreground'>
                      Community Edition · Unlimited
                    </span>
                  </span>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <div className='flex items-center gap-3 px-3 py-2'>
                <MoonIcon className='size-3.5' aria-hidden='true' />
                <span className='text-xs font-medium tracking-wider uppercase'>
                  Dark mode
                </span>
                <Switch
                  className='ml-auto'
                  size='sm'
                  checked={resolvedTheme === 'dark'}
                  onCheckedChange={(checked) =>
                    setTheme(checked ? 'dark' : 'light')
                  }
                  aria-label='Toggle dark mode'
                />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
