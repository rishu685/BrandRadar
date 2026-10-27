import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { PricingSection } from '@/components/pricing/pricingSection';

export default function PricingPage() {
  return (
    <div className='flex min-h-svh flex-col bg-background'>
      <Header />
      <main className='mx-auto w-full max-w-6xl flex-1 px-5 py-14 sm:px-8'>
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
}
