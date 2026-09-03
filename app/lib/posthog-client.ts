'use client';
// ── PostHog (browser) ──────────────────────────────────────────────────────
// Loads only after the visitor has accepted analytics cookies. Autocapture,
// session replay, heatmaps and surveys are all OFF so no form field (CV text,
// job description) can ever be captured. Only the explicit events in
// analytics-events.ts are sent, and only with allow-listed properties.

import posthog from 'posthog-js';
import type { CaptureResult } from 'posthog-js';
import {
  sanitizeEventProperties,
  type AnalyticsEvent,
  type AllowedEventProperties,
} from './analytics-events';
import { captureAttribution, attributionProps } from './attribution';

const KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

export const CONSENT_KEY = 'jobsesame_cookie_consent';
export const CONSENT_EVENT = 'jobsesame-consent-change';

let initialized = false;
// Captures attempted before the visitor has consented aren't dropped, they're
// queued here and replayed the moment syncConsent() sees consent flip to
// granted (the mount-time landing_page_viewed call, made while the cookie
// banner is still up, would otherwise be lost forever since nothing else
// re-fires it).
let pendingActions: Array<() => void> = [];

function analyticsConsentGranted(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === 'accepted';
  } catch {
    return false;
  }
}

// ── Last-line PII scrub ────────────────────────────────────────────────────
// Belt-and-suspenders: even though captureClient() already allow-lists, this
// runs on EVERY outgoing payload (including PostHog's own $pageview /
// $identify) and strips any property whose key looks sensitive. It never
// touches $-prefixed PostHog internals.
const SENSITIVE_KEY = /(email|e-mail|password|passwd|card|cvv|cvc|iban|\bpan\b|secret|token|api[_-]?key|raw_?text|cv_?data|cv_?text|first_?name|last_?name|full_?name|\bname\b|phone|mobile|msisdn|id_?number|passport|ssn|dob|date_of_birth|address)/i;

function scrub(props?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!props) return props;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    if (k.startsWith('$') || k === 'token') { out[k] = v; continue; }
    if (SENSITIVE_KEY.test(k)) continue;
    out[k] = v;
  }
  return out;
}

function beforeSend(cr: CaptureResult | null): CaptureResult | null {
  if (!cr) return cr;
  cr.properties = scrub(cr.properties) as CaptureResult['properties'];
  if (cr.$set) cr.$set = scrub(cr.$set) as CaptureResult['$set'];
  if (cr.$set_once) cr.$set_once = scrub(cr.$set_once) as CaptureResult['$set_once'];
  return cr;
}

export function initPostHog(): void {
  if (initialized || typeof window === 'undefined' || !KEY) return;
  initialized = true;

  captureAttribution();

  posthog.init(KEY, {
    api_host: HOST,
    autocapture: false,
    capture_pageview: 'history_change',
    capture_pageleave: true,
    disable_session_recording: true,
    disable_surveys: true,
    person_profiles: 'identified_only',
    opt_out_capturing_by_default: true,
    persistence: 'localStorage+cookie',
    before_send: beforeSend,
    loaded: () => syncConsent(),
  });

  window.addEventListener(CONSENT_EVENT, syncConsent);
  window.addEventListener('storage', (e) => {
    if (e.key === CONSENT_KEY) syncConsent();
  });
}

/** Reconcile PostHog's opt-in state with the stored cookie-consent choice. */
export function syncConsent(): void {
  if (!initialized || !KEY) return;
  if (analyticsConsentGranted()) {
    if (posthog.has_opted_out_capturing()) posthog.opt_in_capturing();
    // Consent just became available (or already was) - replay anything that
    // was captured while the visitor hadn't decided yet.
    if (pendingActions.length) {
      const queued = pendingActions;
      pendingActions = [];
      queued.forEach((run) => run());
    }
  } else if (!posthog.has_opted_out_capturing()) {
    posthog.opt_out_capturing();
  }
}

function deviceType(): AllowedEventProperties['device_type'] {
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

function baseProps(): AllowedEventProperties {
  return sanitizeEventProperties({
    ...attributionProps(),
    device_type: deviceType(),
    timestamp: new Date().toISOString(),
  });
}

/**
 * Capture one of the catalog events. `extra` is sanitized down to the allowed
 * keys before it ever reaches posthog.capture — anything else is dropped here.
 */
export function captureClient(
  event: AnalyticsEvent,
  extra: Partial<AllowedEventProperties> = {},
): void {
  if (!initialized) initPostHog(); // safe if a page effect runs before the provider's
  if (!initialized || !KEY) return;
  if (!analyticsConsentGranted()) {
    pendingActions.push(() => captureClient(event, extra));
    return;
  }
  posthog.capture(event, sanitizeEventProperties({ ...baseProps(), ...extra }));
}

/** Identify by an opaque id (Clerk user id). No PII is set as a person property. */
export function identifyUser(
  distinctId: string,
  personProps: Partial<AllowedEventProperties> = {},
): void {
  if (!initialized) initPostHog();
  if (!initialized || !KEY || !distinctId) return;
  if (!analyticsConsentGranted()) {
    pendingActions.push(() => identifyUser(distinctId, personProps));
    return;
  }
  posthog.identify(distinctId, sanitizeEventProperties(personProps));
}

export { posthog };
