'use client';

import * as Sentry from '@sentry/nextjs';
import NextError from 'next/error';
import { useEffect } from 'react';

// Next's App Router only calls a global-error boundary for errors that
// escape every nested error.tsx — without this file, those crashes were
// invisible: no error page telling the user something broke, and no
// report anywhere Claude or the team would see it.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
