// ── Analytics event catalog ────────────────────────────────────────────────
// Every PostHog event name lives here so client and server import the same
// string and a typo can't silently create a duplicate event.
//
// HARD PRIVACY RULE: the only properties any event may carry are the ones in
// AllowedEventProperties below. CV file contents, CV text, passwords,
// card / payment details, email addresses and full names must NEVER reach
// PostHog. The server capture helper (app/lib/posthog-server.ts) enforces this
// by forwarding ONLY these keys — see sanitizeEventProperties().

export const ANALYTICS_EVENTS = {
  LANDING_PAGE_VIEWED: 'landing_page_viewed',
  SIGNUP_STARTED: 'signup_started',
  USER_REGISTERED: 'user_registered',
  CV_UPLOADED: 'cv_uploaded',
  CV_ANALYSIS_COMPLETED: 'cv_analysis_completed',
  CV_OPTIMIZATION_COMPLETED: 'cv_optimization_completed',
  JOB_DESCRIPTION_SUBMITTED: 'job_description_submitted',
  CV_TAILORING_COMPLETED: 'cv_tailoring_completed',
  CV_DOWNLOADED: 'cv_downloaded',
  CHECKOUT_STARTED: 'checkout_started',
  SUBSCRIPTION_COMPLETED: 'subscription_completed',
} as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

// ── Rewrite-flow entry point ───────────────────────────────────────────────
// /api/rewrite is a single endpoint used by two genuinely different user
// intents. The client sends `source` so the route knows which completion
// event to fire AND attaches `source` as an event property, so funnel
// analysis can slice "which entry point converts best" without needing the
// two event names to do that job.
export type RewriteSource = 'optimise_page' | 'dashboard_tailor' | 'dashboard_job';

export const REWRITE_SOURCE_EVENT: Record<RewriteSource, AnalyticsEvent> = {
  optimise_page: ANALYTICS_EVENTS.CV_OPTIMIZATION_COMPLETED,
  dashboard_tailor: ANALYTICS_EVENTS.CV_TAILORING_COMPLETED,
  dashboard_job: ANALYTICS_EVENTS.CV_TAILORING_COMPLETED,
};

// ── Allowed event properties ───────────────────────────────────────────────
// country             — ISO-3166 country code, from a CDN geo header (never a full address)
// traffic_source      — utm_source, or a bucket derived from an ad click id / referrer
// campaign            — utm_campaign
// device_type         — 'mobile' | 'tablet' | 'desktop'
// plan                — 'free' | 'credits' | 'pro'
// subscription_status — 'none' | 'active' | 'expired'
// timestamp           — ISO 8601 string, set at capture time
// source              — rewrite-flow entry point (approved addition, see above)
export interface AllowedEventProperties {
  country?: string;
  traffic_source?: string;
  campaign?: string;
  device_type?: 'mobile' | 'tablet' | 'desktop';
  plan?: 'free' | 'credits' | 'pro';
  subscription_status?: 'none' | 'active' | 'expired';
  timestamp?: string;
  source?: RewriteSource;
}

export const ALLOWED_EVENT_PROPERTY_KEYS: (keyof AllowedEventProperties)[] = [
  'country',
  'traffic_source',
  'campaign',
  'device_type',
  'plan',
  'subscription_status',
  'timestamp',
  'source',
];

/**
 * Reduce any object to only the allow-listed, non-sensitive keys. Anything not
 * on the list (name, email, rawText, cvData, amount, card, …) is dropped.
 */
export function sanitizeEventProperties(
  input: Record<string, unknown> = {},
): AllowedEventProperties {
  const out: Record<string, unknown> = {};
  for (const key of ALLOWED_EVENT_PROPERTY_KEYS) {
    const value = input[key];
    if (value !== undefined && value !== null && value !== '') out[key] = value;
  }
  return out as AllowedEventProperties;
}
