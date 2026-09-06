import * as Sentry from '@sentry/nextjs';

// Edge runtime (middleware, edge API routes) error monitoring. See
// sentry.server.config.ts for why an empty SENTRY_DSN is safe here.
Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
});
