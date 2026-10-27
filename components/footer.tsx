import { Logo } from '@/components/logo';

export function Footer() {
  return (
    <footer className='border-t bg-background'>
      <div className='mx-auto flex min-h-20 w-full max-w-350 flex-col items-center justify-between gap-4 px-4 py-5 sm:flex-row sm:px-6 lg:px-8'>
        <Logo className='text-base' />
        <p className='text-center text-xs text-muted-foreground'>
          © 2026 BrandRadar. Open-source AEO & GEO intelligence.
        </p>
      </div>
    </footer>
  );
}
