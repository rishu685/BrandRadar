import type { Metadata } from 'next';
import { Geist, Geist_Mono, DM_Sans } from 'next/font/google';
import { QueryProvider } from '@/components/queryProvider';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/themeProvider';
import { cn } from '@/lib/utils';
import './globals.css';

const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-sans' });

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'BrandRadar - AI Search Visibility, AEO & GEO Research',
  description:
    'Track AI brand visibility across ChatGPT and Gemini, audit robots.txt, and generate llms.txt.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang='en'
      className={cn(
        'h-full',
        'antialiased',
        geistSans.variable,
        geistMono.variable,
        'font-sans',
        dmSans.variable,
      )}
      suppressHydrationWarning
    >
      <head />
      <body className='min-h-full flex flex-col'>
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>{children}</QueryProvider>
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
