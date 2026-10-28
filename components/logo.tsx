import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
  href?: string;
  inverted?: boolean;
};

export function Logo({ className, href = '/', inverted = false }: LogoProps) {
  return (
    <Link
      href={href}
      aria-label='BrandRadar home'
      className={cn(
        'inline-flex items-center gap-2.5 text-lg font-bold tracking-tight group',
        inverted ? 'text-primary-foreground' : 'text-foreground',
        className,
      )}
    >
      <span className='relative flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-[7px] shadow-xs ring-1 ring-border/20 transition-transform duration-200 group-hover:scale-105'>
        <Image
          src='/brand-logo.png'
          alt='BrandRadar symbol'
          width={28}
          height={28}
          className='size-full object-cover'
          priority
        />
      </span>
      <span>
        Brand
        <span className={inverted ? 'text-primary-foreground' : 'text-primary'}>
          Radar
        </span>
      </span>
    </Link>
  );
}
