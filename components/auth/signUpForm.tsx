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
import { signUpSchema, type SignUpValues } from '@/lib/auth-schemas';

export function SignUpForm() {
  const router = useRouter();
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const handleSignUp = async (values: SignUpValues) => {
    const { error } = await authClient.signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
    });

    if (error) {
      toast.error(error.message || 'We could not create your account.');
      return;
    }

    toast.success('User created successfully!');
    router.push('/ai-keyword');
    router.refresh();
  };

  return (
    <form onSubmit={form.handleSubmit(handleSignUp)} noValidate>
      <FieldGroup className='gap-5'>
        <Field data-invalid={Boolean(form.formState.errors.name)}>
          <FieldLabel htmlFor='sign-up-name'>Name</FieldLabel>
          <Input
            id='sign-up-name'
            autoComplete='name'
            placeholder='Your name'
            aria-invalid={Boolean(form.formState.errors.name)}
            className='h-11 rounded-lg border border-input bg-background px-3 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20'
            {...form.register('name')}
          />
          <FieldError errors={[form.formState.errors.name]} />
        </Field>

        <Field data-invalid={Boolean(form.formState.errors.email)}>
          <FieldLabel htmlFor='sign-up-email'>Email</FieldLabel>
          <Input
            id='sign-up-email'
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
          <FieldLabel htmlFor='sign-up-password'>Password</FieldLabel>
          <Input
            id='sign-up-password'
            type='password'
            autoComplete='new-password'
            placeholder='At least 8 characters'
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
          {form.formState.isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </FieldGroup>

      <p className='mt-5 text-center text-sm text-muted-foreground'>
        Already have an account?{' '}
        <Link
          href='/auth/sign-in'
          className='font-semibold text-primary hover:underline'
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
