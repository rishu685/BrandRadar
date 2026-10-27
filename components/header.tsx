'use client';
import { useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';

export function Header() {
  const pathname = usePathname();
  const isLandingPage = pathname === '/';
  const headerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (!isLandingPage) return;

      const timeline = gsap.timeline({
        defaults: { ease: 'power3.out' },
      });

      timeline
        .from(headerRef.current, {
          y: -24,
          scale: 0.985,
          opacity: 0,
          duration: 0.8,
          clearProps: 'transform,opacity',
        })
        .from(
          '[data-nav-reveal]',
          {
            y: -8,
            opacity: 0,
            duration: 0.45,
            stagger: 0.06,
            clearProps: 'transform,opacity',
          },
          '-=0.35',
        );
    },
    { scope: headerRef, dependencies: [isLandingPage], revertOnUpdate: true },
  );

  return (
    <header
      ref={headerRef}
      className={
        isLandingPage
          ? 'absolute inset-x-0 top-4 z-50 bg-transparent px-3 text-white sm:px-4'
          : 'top-0 border-b bg-background'
      }
    >
      <div
        className={
          isLandingPage
            ? 'mx-auto flex h-16 w-full max-w-330 items-center gap-6 rounded-[18px] border border-white/14 bg-[#061A0E]/72 px-4 shadow-[0_18px_55px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-[background-color,border-color] duration-500 hover:border-white/20 hover:bg-[#071F11]/82 sm:px-6'
            : 'mx-auto flex h-16 w-full max-w-350 items-center gap-6 px-4 sm:px-6 lg:px-8'
        }
      >
        <div data-nav-reveal>
          <Logo inverted={isLandingPage} />
        </div>

        <nav
          data-nav-reveal
          className={
            isLandingPage
              ? 'hidden items-center gap-7 text-sm font-medium text-white/68 sm:flex'
              : 'hidden items-center gap-5 text-sm font-semibold text-muted-foreground sm:flex'
          }
        >
          <Link
            href='/#products'
            className={
              isLandingPage
                ? 'relative py-2 transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-white after:transition-transform after:duration-300 hover:text-white hover:after:scale-x-100'
                : 'transition-colors hover:text-foreground'
            }
          >
            Products
          </Link>
          <Link
            href='/pricing'
            className={
              isLandingPage
                ? 'relative py-2 transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-white after:transition-transform after:duration-300 hover:text-white hover:after:scale-x-100'
                : 'transition-colors hover:text-foreground'
            }
          >
            Plans & Pricing
          </Link>
        </nav>

        <div data-nav-reveal className='ml-auto flex items-center gap-2'>
          <Button
            variant='ghost'
            className={
              isLandingPage
                ? 'rounded-[11px] text-white hover:bg-white/10 hover:text-white'
                : undefined
            }
            render={<Link href='/auth/sign-in' />}
          >
            Sign in
          </Button>
          <Button
            className={
              isLandingPage
                ? 'rounded-[11px] border border-white bg-white px-5 text-[#0A0A0A] shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition-transform duration-300 hover:-translate-y-0.5 hover:bg-white'
                : 'bg-linear-to-r from-primary to-brand-accent text-primary-foreground hover:opacity-90'
            }
            render={<Link href='/auth/sign-up' />}
          >
            Get started
          </Button>
        </div>
      </div>
    </header>
  );
}
