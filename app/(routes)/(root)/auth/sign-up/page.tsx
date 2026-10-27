import type { Metadata } from 'next';
import { AuthCard } from '@/components/auth/authCard';
import { SignUpForm } from '@/components/auth/signUpForm';

export const metadata: Metadata = {
  title: 'Create your account | BrandRadar',
};

export default function SignUpPage() {
  return (
    <AuthCard
      title='Create your BrandRadar account'
      description='Start tracking AI brand visibility, citations, and GEO prompts.'
    >
      <SignUpForm />
    </AuthCard>
  );
}
