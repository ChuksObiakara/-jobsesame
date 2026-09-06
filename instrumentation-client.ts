import * as Sentry from '@sentry/nextjs';

// Browser-side error monitoring — catches uncaught client component
// crashes. See sentry.server.config.ts for why an empty
// NEXT_PUBLIC_SENTRY_DSN is safe to ship before a Sentry project exists.
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
