import Link from 'next/link';
import { ChartNoAxesCombined } from 'lucide-react';
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
        'inline-flex items-center gap-2 text-lg font-bold tracking-tight',
        inverted ? 'text-primary-foreground' : 'text-foreground',
        className,
      )}
    >
      <span
        className={cn(
          'flex size-7 items-center justify-center rounded-md',
          inverted
            ? 'bg-primary-foreground text-primary'
            : 'bg-primary text-primary-foreground',
        )}
      >
        <ChartNoAxesCombined className='size-4' strokeWidth={2.5} />
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
