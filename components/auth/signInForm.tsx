'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { authClient } from '@/lib/auth-client';
import { signInSchema, type SignInValues } from '@/lib/auth-schemas';

export function SignInForm() {
  const router = useRouter();
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleSignIn = async (values: SignInValues) => {
    const { error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    });

    if (error) {
      toast.error(error.message || 'We could not sign you in.');
      return;
    }

    toast.success('User signed in successfully!');
    router.push('/ai-keyword');
    router.refresh();
  };

  return (
    <form onSubmit={form.handleSubmit(handleSignIn)} noValidate>
      <FieldGroup className='gap-5'>
        <Field data-invalid={Boolean(form.formState.errors.email)}>
          <FieldLabel htmlFor='sign-in-email'>Email</FieldLabel>
          <Input
            id='sign-in-email'
            type='email'
            autoComplete='email'
            placeholder='you@example.com'
            aria-invalid={Boolean(form.formState.errors.email)}
            className='h-11 rounded-lg border border-input bg-background px-3 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20'
            {...form.register('email')}
          />
          <FieldError errors={[form.formState.errors.email]} />
        </Field>

        <Field data-invalid={Boolean(form.formState.errors.password)}>
          <FieldLabel htmlFor='sign-in-password'>Password</FieldLabel>
          <Input
            id='sign-in-password'
            type='password'
            autoComplete='current-password'
            placeholder='Enter your password'
            aria-invalid={Boolean(form.formState.errors.password)}
            className='h-11 rounded-lg border border-input bg-background px-3 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20'
            {...form.register('password')}
          />
          <FieldError errors={[form.formState.errors.password]} />
        </Field>

        <Button
          type='submit'
          className='mt-1 w-full'
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </FieldGroup>

      <p className='mt-5 text-center text-sm text-muted-foreground'>
        New to BrandRadar?{' '}
        <Link
          href='/auth/sign-up'
          className='font-semibold text-primary hover:underline'
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
