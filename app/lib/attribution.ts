'use client';
// ── First-touch attribution capture (client) ───────────────────────────────
// On a visitor's FIRST landing we record the UTM params, ad click ids and
// referrer into a first-party cookie (jobsesame_attribution, 90 days). Both
// PostHog (client events) and the server (Route Handlers, via
// attribution-server.ts) read this same cookie, so connecting a real ad
// channel later is just pointing its links at the site with ?utm_source=… —
// no code restructuring. See app/lib/channels.ts for the channel slots.
//
// Nothing here is sensitive: UTM values and click ids are campaign metadata,
// not personal data.

export const ATTRIBUTION_COOKIE = 'jobsesame_attribution';
const MAX_AGE_SECONDS = 90 * 24 * 60 * 60;

export interface Attribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer?: string;
  gclid?: string; // Google Ads
  fbclid?: string; // Meta
  ttclid?: string; // TikTok
  msclkid?: string; // Microsoft Ads
  landing_path?: string;
  first_seen?: string;
}

// Non-sensitive buckets attached to events (see analytics-events.ts).
export interface AttributionProps {
  traffic_source?: string;
  campaign?: string;
}

const CLICK_ID_SOURCE: Record<string, string> = {
  gclid: 'google',
  fbclid: 'facebook',
  ttclid: 'tiktok',
  msclkid: 'bing',
};

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export function readAttribution(): Attribution | null {
  const raw = readCookie(ATTRIBUTION_COOKIE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Attribution;
  } catch {
    return null;
  }
}

/**
 * Capture attribution on first visit only. Safe to call on every landing —
 * it's a no-op once the cookie exists, so it stays "first touch".
 */
export function captureAttribution(): Attribution | null {
  if (typeof window === 'undefined') return null;
  const existing = readAttribution();
  if (existing) return existing;

  const params = new URLSearchParams(window.location.search);
  const pick = (key: string) => params.get(key)?.slice(0, 200) || undefined;

  const referrerHost = (() => {
    try {
      if (!document.referrer) return undefined;
      const host = new URL(document.referrer).hostname;
      return host && host !== window.location.hostname ? host : undefined;
    } catch {
      return undefined;
    }
  })();

  const attribution: Attribution = {
    utm_source: pick('utm_source'),
    utm_medium: pick('utm_medium'),
    utm_campaign: pick('utm_campaign'),
    utm_content: pick('utm_content'),
    utm_term: pick('utm_term'),
    gclid: pick('gclid'),
    fbclid: pick('fbclid'),
    ttclid: pick('ttclid'),
    msclkid: pick('msclkid'),
    referrer: referrerHost,
    landing_path: window.location.pathname.slice(0, 200),
    first_seen: new Date().toISOString(),
  };

  // Drop undefined keys so the cookie stays small.
  const clean: Attribution = Object.fromEntries(
    Object.entries(attribution).filter(([, v]) => v !== undefined),
  );

  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie =
    `${ATTRIBUTION_COOKIE}=${encodeURIComponent(JSON.stringify(clean))}` +
    `; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`;

  return clean;
}

/** Derive the two non-sensitive event props from stored attribution. */
export function attributionProps(a: Attribution | null = readAttribution()): AttributionProps {
  if (!a) return {};
  let traffic_source = a.utm_source;
  if (!traffic_source) {
    for (const [id, src] of Object.entries(CLICK_ID_SOURCE)) {
      if (a[id as keyof Attribution]) {
        traffic_source = src;
        break;
      }
    }
  }
  if (!traffic_source) traffic_source = a.referrer ? a.referrer : 'direct';
  return { traffic_source, campaign: a.utm_campaign };
}
