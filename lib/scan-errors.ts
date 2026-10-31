import { z } from 'zod';

export function sanitizeScanErrorMessage(error: unknown): string {
  if (!error) return 'An unexpected error occurred during scan execution.';

  if (typeof error === 'string') {
    const lower = error.toLowerCase();
    if (lower.includes('not configured')) {
      return 'AI analysis service is not configured.';
    }
    if (
      lower.includes('unauthorized') ||
      lower.includes('401') ||
      lower.includes('403') ||
      lower.includes('api_key_invalid')
    ) {
      return 'Authentication failed with upstream AI provider.';
    }
    if (
      lower.includes('rate limit') ||
      lower.includes('quota') ||
      lower.includes('429') ||
      lower.includes('resource_exhausted')
    ) {
      return 'Upstream rate limit reached. Please try again shortly.';
    }
    if (
      lower.includes('timed out') ||
      lower.includes('timeout') ||
      lower.includes('etimedout') ||
      lower.includes('fetch failed')
    ) {
      return 'Scan timed out while communicating with external providers.';
    }
    if (
      lower.includes('schema') ||
      lower.includes('validation') ||
      lower.includes('incompatible')
    ) {
      return 'AI provider returned incompatible or incomplete data.';
    }
    return 'An unexpected error occurred during scan execution.';
  }

  const err = error as Record<string, unknown>;
  const status = Number(err.statusCode || err.status);

  if (
    status === 401 ||
    status === 403 ||
    (typeof err.message === 'string' &&
      /unauthorized|api_key_invalid/i.test(err.message))
  ) {
    return 'Authentication failed with upstream AI provider.';
  }

  if (
    status === 429 ||
    (typeof err.message === 'string' &&
      /quota|rate limit|resource_exhausted/i.test(err.message))
  ) {
    return 'Upstream rate limit reached. Please try again shortly.';
  }

  if (
    err.name === 'AbortError' ||
    err.code === 'ETIMEDOUT' ||
    (typeof err.message === 'string' &&
      /timed?\s*out|fetch failed/i.test(err.message))
  ) {
    return 'Scan timed out while communicating with external providers.';
  }

  if (
    error instanceof z.ZodError ||
    err.name === 'ZodError' ||
    err.name === 'AI_NoObjectGeneratedError' ||
    (typeof err.message === 'string' && /schema|validation/i.test(err.message))
  ) {
    return 'AI provider returned incompatible or incomplete data.';
  }

  if (err.name === 'PrismaClientKnownRequestError') {
    return 'Database error while updating scan status.';
  }

  return 'An unexpected error occurred during scan execution.';
}
