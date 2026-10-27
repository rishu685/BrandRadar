import { z } from 'zod';

export const visibilitySearchSchema = z.object({
  website: z
    .string()
    .trim()
    .min(1, 'Website is required')
    .max(500, 'Website is too long')
    .refine((value) => {
      try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch {
        return false;
      }
    }, 'Enter a valid URL'),
  brand: z
    .string()
    .trim()
    .min(2, 'Use 2+ characters')
    .max(120, 'Brand is too long'),
  topic: z
    .string()
    .trim()
    .min(3, 'Use 3+ characters')
    .max(180, 'Topic is too long'),
});

export type VisibilitySearchValues = z.infer<typeof visibilitySearchSchema>;
