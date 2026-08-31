// ── First-touch attribution (server) ───────────────────────────────────────
// Reads the same jobsesame_attribution cookie that app/lib/attribution.ts
// writes on the client, so Route Handlers can attach traffic_source / campaign
// to server-side events without the client having to resend it.

import type { Attribution, AttributionProps } from './attribution';

const CLICK_ID_SOURCE: Record<string, string> = {
  gclid: 'google',
  fbclid: 'facebook',
  ttclid: 'tiktok',
  msclkid: 'bing',
};

export function readAttributionFromRequest(req: Request): Attribution | null {
  const cookieHeader = req.headers.get('cookie');
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/(?:^|;\s*)jobsesame_attribution=([^;]+)/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1])) as Attribution;
  } catch {
    return null;
  }
}

export function attributionPropsFromRequest(req: Request): AttributionProps {
  const a = readAttributionFromRequest(req);
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

// ── Request geo / device helpers ───────────────────────────────────────────
// country comes from the CDN edge header (Vercel sets x-vercel-ip-country).
// No IP is stored or forwarded — only the resolved country code.
export function countryFromRequest(req: Request): string | undefined {
  return (
    req.headers.get('x-vercel-ip-country') ||
    req.headers.get('cf-ipcountry') ||
    undefined
  ) ?? undefined;
}

export function deviceTypeFromRequest(req: Request): 'mobile' | 'tablet' | 'desktop' {
  const ua = (req.headers.get('user-agent') || '').toLowerCase();
  if (/ipad|tablet|(android(?!.*mobile))/.test(ua)) return 'tablet';
  if (/mobi|iphone|android|ipod|blackberry|iemobile|opera mini/.test(ua)) return 'mobile';
  return 'desktop';
}
