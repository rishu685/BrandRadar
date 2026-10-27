'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CircleCheckIcon, SearchIcon, SparklesIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { cn } from '@/lib/utils';
import {
  visibilitySearchSchema,
  VisibilitySearchValues,
} from '@/lib/search-visibility-schema';

type VisibilitySearchFormProps = {
  isSearching?: boolean;
  onSearch: (values: VisibilitySearchValues) => void | Promise<void>;
  remaining?: number;
  isPaid?: boolean;
};

const platforms = ['ChatGPT', 'Gemini'];

export function VisibilitySearchForm({
  isSearching = false,
  onSearch,
  remaining,
  isPaid = false,
}: VisibilitySearchFormProps) {
  const [platformIndex, setPlatformIndex] = useState(0);
  const usageExhausted = remaining === 0;
  const form = useForm<VisibilitySearchValues>({
    resolver: zodResolver(visibilitySearchSchema),
    mode: 'onChange',
    defaultValues: {
      website: '',
      brand: '',
      topic: '',
    },
  });

  useEffect(() => {
    const rotation = window.setInterval(() => {
      setPlatformIndex((current) => (current + 1) % platforms.length);
    }, 2600);

    return () => window.clearInterval(rotation);
  }, []);

  const { dirtyFields, errors, isSubmitting, isValid } = form.formState;

  function isFieldValid(field: keyof VisibilitySearchValues) {
    return Boolean(
      dirtyFields[field] && form.getValues(field).trim() && !errors[field],
    );
  }

  return (
    <section className='rounded-2xl bg-linear-to-b from-primary/10 via-primary/5 to-background px-4 py-10 sm:px-8 lg:py-12'>
      <div className='mx-auto flex max-w-4xl flex-col items-center gap-6 text-center'>
        <p className='rounded-full border border-primary/20 bg-background px-4 py-1.5 text-xs font-semibold text-primary shadow-sm'>
          AI Search Visibility
        </p>

        <div className='flex flex-col items-center gap-3'>
          <h1 className='flex gap-3 max-w-4xl text-4xl font-black tracking-tighter sm:text-5xl lg:text-[3.5rem]'>
            Check how you rank in{' '}
            <span
              className='relative inline-grid min-w-[7.6ch] text-left text-primary'
              aria-live='polite'
            >
              {platforms.map((platform, index) => (
                <span
                  key={platform}
                  className={cn(
                    '[grid-area:1/1] transition-all duration-500',
                    index === platformIndex
                      ? 'translate-y-0 opacity-100'
                      : '-translate-y-1 opacity-0',
                  )}
                  aria-hidden={index !== platformIndex}
                >
                  {platform}
                </span>
              ))}
            </span>
          </h1>
          <p className='max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-base'>
            Find opportunities in AI results to get your brand mentioned by LLM
            platforms.
          </p>
        </div>

        <form
          className='grid w-full max-w-2xl gap-4 text-left'
          onSubmit={form.handleSubmit(onSearch)}
          noValidate
        >
          <div className='grid gap-4 sm:grid-cols-2'>
            <Field className='gap-2' data-invalid={Boolean(errors.website)}>
              <FieldLabel
                htmlFor='visibility-website'
                className='text-sm font-semibold tracking-normal normal-case'
              >
                Website
              </FieldLabel>
              <InputGroup className='rounded-lg border border-input bg-background px-3 shadow-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
                <InputGroupInput
                  id='visibility-website'
                  type='url'
                  placeholder='https://brandradar.dev'
                  disabled={isSearching || usageExhausted}
                  aria-invalid={Boolean(errors.website)}
                  {...form.register('website')}
                />
                {isFieldValid('website') && (
                  <InputGroupAddon align='inline-end'>
                    <CircleCheckIcon className='size-4 text-primary' />
                  </InputGroupAddon>
                )}
              </InputGroup>
              <FieldError errors={[errors.website]} />
            </Field>

            <Field className='gap-2' data-invalid={Boolean(errors.brand)}>
              <FieldLabel
                htmlFor='visibility-brand'
                className='text-sm font-semibold tracking-normal normal-case'
              >
                Your brand
              </FieldLabel>
              <InputGroup className='rounded-lg border border-input bg-background px-3 shadow-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
                <InputGroupInput
                  id='visibility-brand'
                  placeholder='BrandRadar'
                  disabled={isSearching || usageExhausted}
                  aria-invalid={Boolean(errors.brand)}
                  {...form.register('brand')}
                />
                {isFieldValid('brand') && (
                  <InputGroupAddon align='inline-end'>
                    <CircleCheckIcon className='size-4 text-primary' />
                  </InputGroupAddon>
                )}
              </InputGroup>
              <FieldError errors={[errors.brand]} />
            </Field>
          </div>

          <Field className='gap-2' data-invalid={Boolean(errors.topic)}>
            <FieldLabel
              htmlFor='visibility-topic'
              className='text-sm font-semibold tracking-normal normal-case'
            >
              Topic
            </FieldLabel>
            <InputGroup className='rounded-lg border border-input bg-background px-3 shadow-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20'>
              <InputGroupAddon>
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput
                id='visibility-topic'
                placeholder='AI SEO tools for small businesses'
                disabled={isSearching || usageExhausted}
                aria-invalid={Boolean(errors.topic)}
                {...form.register('topic')}
              />
              {isFieldValid('topic') && (
                <InputGroupAddon align='inline-end'>
                  <CircleCheckIcon className='size-4 text-primary' />
                </InputGroupAddon>
              )}
            </InputGroup>
            <FieldError errors={[errors.topic]} />

            <div className='flex flex-wrap items-center gap-1.5 pt-0.5 text-xs text-muted-foreground'>
              <span className='font-medium text-muted-foreground'>✨ AEO/GEO Presets:</span>
              <button
                type='button'
                onClick={() => {
                  form.setValue('website', 'https://perplexity.ai', { shouldValidate: true, shouldDirty: true });
                  form.setValue('brand', 'Perplexity AI', { shouldValidate: true, shouldDirty: true });
                  form.setValue('topic', 'Conversational AI search engine and answer engine', { shouldValidate: true, shouldDirty: true });
                }}
                className='rounded-md border border-border bg-muted/60 px-2 py-0.5 font-medium text-foreground transition-colors hover:bg-accent'
              >
                Perplexity (Answer Engine)
              </button>
              <button
                type='button'
                onClick={() => {
                  form.setValue('website', 'https://brandradar.dev', { shouldValidate: true, shouldDirty: true });
                  form.setValue('brand', 'BrandRadar', { shouldValidate: true, shouldDirty: true });
                  form.setValue('topic', 'Generative engine optimization and AEO brand citations', { shouldValidate: true, shouldDirty: true });
                }}
                className='rounded-md border border-border bg-muted/60 px-2 py-0.5 font-medium text-foreground transition-colors hover:bg-accent'
              >
                BrandRadar (GEO Platform)
              </button>
              <button
                type='button'
                onClick={() => {
                  form.setValue('website', 'https://openai.com', { shouldValidate: true, shouldDirty: true });
                  form.setValue('brand', 'ChatGPT Search', { shouldValidate: true, shouldDirty: true });
                  form.setValue('topic', 'AI search and LLM citations', { shouldValidate: true, shouldDirty: true });
                }}
                className='rounded-md border border-border bg-muted/60 px-2 py-0.5 font-medium text-foreground transition-colors hover:bg-accent'
              >
                ChatGPT Search (AEO)
              </button>
            </div>
          </Field>

          <Button
            type='submit'
            size='lg'
            disabled={isSearching || isSubmitting || !isValid}
            className='w-full border-0 bg-neutral-800 text-sm font-semibold tracking-normal text-white shadow-xs hover:bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white'
          >
            <SparklesIcon
              data-icon='inline-start'
              className={
                isSearching || isSubmitting ? 'animate-spin' : undefined
              }
            />
            {isSearching || isSubmitting
              ? 'Checking visibility…'
              : 'Check AI visibility'}
          </Button>

          <div className='flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center text-xs text-muted-foreground'>
            <span className='font-medium text-emerald-600 dark:text-emerald-400'>
              ● Community Edition · Unlimited Scans & Insights
            </span>
          </div>
        </form>
      </div>
    </section>
  );
}
