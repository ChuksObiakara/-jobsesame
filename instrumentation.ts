import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Reports errors thrown during rendering/data-fetching that Next's App
// Router catches itself (nested error boundaries, server component
// errors) and would otherwise never reach Sentry.
export const onRequestError = Sentry.captureRequestError;
