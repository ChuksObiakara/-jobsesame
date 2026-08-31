'use client';
// Initialises PostHog in the browser once, on mount. Pageviews are captured by
// posthog-js itself (capture_pageview: 'history_change'), so this component
// only needs to boot the SDK — no route-change listener required.

import { useEffect } from 'react';
import { initPostHog } from '../lib/posthog-client';

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();
  }, []);

  return <>{children}</>;
}
