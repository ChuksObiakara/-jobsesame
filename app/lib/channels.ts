// ── Marketing channel registry (placeholders — NOTHING is connected) ───────
// Each entry is a config slot for a future acquisition channel. Connecting one
// later means: add its credentials to env, flip `enabled: true`, and point its
// ad links at the site with the `utmSource` below. No structural change.
//
// This file deliberately contains NO API calls, NO spend logic, NO budget
// controls. It is metadata only. The Relevance AI "Growth Director" reads
// channel performance from PostHog funnel data, never from an ad platform.

export interface ChannelConfig {
  key: string;
  label: string;
  /** Flip to true only when credentials exist AND you intend to attribute traffic to it. */
  enabled: boolean;
  /** The utm_source value links from this channel are expected to carry. */
  utmSource: string;
  /** Env vars this channel WILL need when connected. Not read anywhere yet. */
  plannedEnvVars: string[];
  notes: string;
}

export const MARKETING_CHANNELS: Record<string, ChannelConfig> = {
  meta: {
    key: 'meta',
    label: 'Meta Ads (Facebook / Instagram)',
    enabled: false,
    utmSource: 'facebook',
    plannedEnvVars: ['META_ACCESS_TOKEN', 'META_AD_ACCOUNT_ID', 'META_PIXEL_ID'],
    notes: 'Conversions API + pixel. utm_medium=paid_social, utm_campaign=<campaign name>.',
  },
  tiktok: {
    key: 'tiktok',
    label: 'TikTok Ads',
    enabled: false,
    utmSource: 'tiktok',
    plannedEnvVars: ['TIKTOK_ACCESS_TOKEN', 'TIKTOK_ADVERTISER_ID', 'TIKTOK_PIXEL_CODE'],
    notes: 'Events API. Click id param is ttclid. utm_medium=paid_social.',
  },
  google_ads: {
    key: 'google_ads',
    label: 'Google Ads',
    enabled: false,
    utmSource: 'google',
    plannedEnvVars: ['GOOGLE_ADS_DEVELOPER_TOKEN', 'GOOGLE_ADS_CUSTOMER_ID', 'GOOGLE_ADS_REFRESH_TOKEN'],
    notes: 'Offline conversion import. Click id param is gclid. utm_medium=cpc.',
  },
  seo: {
    key: 'seo',
    label: 'SEO / content',
    enabled: false,
    utmSource: 'organic',
    plannedEnvVars: ['GSC_SITE_URL', 'GSC_SERVICE_ACCOUNT_JSON'],
    notes: 'No paid spend. Attribution is referrer-based; blog links may set utm_medium=content.',
  },
  influencer: {
    key: 'influencer',
    label: 'Influencer / creator codes',
    enabled: false,
    utmSource: 'influencer',
    plannedEnvVars: [],
    notes: 'Per-creator code goes in utm_campaign (e.g. utm_campaign=creator_thabo). Track via REFERRAL_CODES below.',
  },
  partnership: {
    key: 'partnership',
    label: 'Partnership / referral links',
    enabled: false,
    utmSource: 'partner',
    plannedEnvVars: [],
    notes: 'Per-partner slug in utm_campaign (e.g. utm_campaign=partner_acme). Existing /api/referral covers user-to-user referrals.',
  },
};

// ── Named campaign / code slots ────────────────────────────────────────────
// Fill in as real codes are issued. `campaign` is what gets attached to
// events (matches utm_campaign on the link you hand out).
export interface ReferralCodeConfig {
  code: string;
  channelKey: keyof typeof MARKETING_CHANNELS;
  campaign: string;
  active: boolean;
}

export const REFERRAL_CODES: ReferralCodeConfig[] = [
  // { code: 'THABO10', channelKey: 'influencer', campaign: 'creator_thabo', active: false },
];

export function resolveCampaignFromCode(code: string): string | undefined {
  return REFERRAL_CODES.find(c => c.active && c.code.toLowerCase() === code.toLowerCase())?.campaign;
}
