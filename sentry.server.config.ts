import * as Sentry from '@sentry/nextjs';

// Server-side (Node runtime) error monitoring. Catches every uncaught
// error thrown inside an API route, server component, or server action.
//
// SENTRY_DSN is unset in every environment until someone creates a
// Sentry project and adds the DSN to Vercel's env vars — Sentry.init()
// with an empty dsn is a documented no-op, so this file is safe to ship
// before that happens; it just won't send anything yet.
Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  // Full request/response bodies can contain uploaded CVs and contact
  // details — keep breadcrumbs but don't let Sentry capture bodies.
  sendDefaultPii: false,
});
