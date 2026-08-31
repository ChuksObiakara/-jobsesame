# Analytics & Growth integration

PostHog (product analytics) + Relevance AI (the "Jobsesame Growth Director" analysis agent).
Marketing-channel attribution is wired so new ad channels drop in without code changes.

## Status

| Stage | Scope | State |
|---|---|---|
| 0 | SDKs installed, attribution + channel scaffolding, event catalog | **done** |
| 1 | PostHog client provider + client events (`landing_page_viewed`, `signup_started`, `cv_downloaded`) | **done** |
| 2 | PostHog server events in `/api/cv` | next |
| 3 | PostHog server events in `/api/rewrite`, `/api/user/sync`, `/api/payment*` | blocked on Stage 1 |
| 4 | Relevance AI `Growth Director` + PostHog Query API | blocked on `RELEVANCE_AI_*` + `POSTHOG_PERSONAL_API_KEY` |
| 5 | Signed Relevance webhook receiver | blocked on Stage 4 |
| 6 | Finalise channel placeholders + this doc | — |

## Environment variables

Add these in the Vercel dashboard (Project → Settings → Environment Variables) and to
local `.env.local`. `.env*` is gitignored, so this table is the source of truth.

| Variable | Example | Client-safe? | Used by |
|---|---|---|---|
| `NEXT_PUBLIC_POSTHOG_KEY` | `phc_xxx` | **Yes** — write-only ingest key, safe in the browser bundle | client + server capture |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` | **Yes** — not a secret | client + server capture |
| `POSTHOG_PERSONAL_API_KEY` | `phx_xxx` | **No** — server-only secret | `/api/growth/*` (reads funnels) |
| `POSTHOG_PROJECT_ID` | `123456` | No (server-only, not secret) | `/api/growth/*` |
| `RELEVANCE_AI_API_KEY` | `sk-...` | **No** — server-only secret | `/api/growth/*` |
| `RELEVANCE_AI_PROJECT_ID` | `d7b62b3...` | No (server-only) | `/api/growth/*` |
| `RELEVANCE_AI_REGION` | `f1db6c` / `d7b62b` | No (server-only) | `/api/growth/*` base URL |
| `RELEVANCE_AI_AGENT_ID` | `agent_xxx` | No (server-only) | `/api/growth/analyze` |
| `RELEVANCE_WEBHOOK_SECRET` | generated (`openssl rand -hex 32`) | **No** — server-only secret | `/api/growth/webhook` auth |

Cloud region: **US** (`https://us.i.posthog.com`) — project created in the US region.

## Event catalog

Fire server-side where the action is server-side; client-side only where it isn't.

| Event | Fired from | Side |
|---|---|---|
| `landing_page_viewed` | `app/page.tsx` mount | client |
| `signup_started` | "Get started" / "Start free" CTA + `/sign-up` mount | client |
| `user_registered` | `/api/user/sync` when `isNewUser` | server |
| `cv_uploaded` | `/api/cv` after the file is received | server |
| `cv_analysis_completed` | `/api/cv` after Claude returns parsed CV | server |
| `cv_optimization_completed` | `/api/rewrite` success, `source = optimise_page` | server |
| `job_description_submitted` | `/api/rewrite` on entry, **once**, any source | server |
| `cv_tailoring_completed` | `/api/rewrite` success, `source = dashboard_tailor` \| `dashboard_job` | server |
| `cv_downloaded` | jsPDF download handlers in `optimise` + `dashboard` (only `source` is sent — never the filename, which contains the name) | client |
| `checkout_started` | `/api/payment` after transaction init | server |
| `subscription_completed` | `/api/payment/webhook` (+ `/verify`), idempotent on `reference` | server |

### Allowed properties (nothing else is ever sent)

`country`, `traffic_source`, `campaign`, `device_type`, `plan`, `subscription_status`,
`timestamp`, and `source` (rewrite-flow entry point).

`app/lib/analytics-events.ts` → `sanitizeEventProperties()` drops every other key. CV
text, CV file bytes, passwords, card/payment details, email and full names cannot pass
through it.

## Consent

PostHog boots with `opt_out_capturing_by_default: true`. It only starts capturing
once `localStorage.jobsesame_cookie_consent === 'accepted'` (the "Accept all cookies"
button in `CookieConsent`). "Necessary only" → nothing is sent. `CookieConsent` fires a
`jobsesame-consent-change` event so the opt-in/out takes effect without a reload.

`before_send` in `posthog-client.ts` is a last-line scrub: it drops any non-`$` property
whose key looks sensitive (email/name/phone/card/token/raw_text/…) from every outgoing
payload, including PostHog's own `$pageview` / `$identify`.

## Attribution (`app/lib/attribution.ts` + `attribution-server.ts`)

First landing writes a first-party cookie `jobsesame_attribution` (90 days) with
`utm_*`, `gclid` / `fbclid` / `ttclid` / `msclkid`, and referrer host. `attributionProps()`
/ `attributionPropsFromRequest()` derive the non-sensitive `traffic_source` + `campaign`
event props. `traffic_source` precedence: `utm_source` → click-id bucket → referrer host → `direct`.

## Marketing channels (`app/lib/channels.ts`)

Disabled placeholder slots for Meta, TikTok, Google Ads, SEO, influencer codes and
partnership links. Each lists the env vars it will need and the `utm_source` its links
should carry. Connecting a channel = add creds, flip `enabled`, hand out UTM links.
No ad-platform API is called and no budget is ever changed by this codebase.

## PostHog project settings to apply in the UI

- Cloud region **US**.
- **Autocapture OFF**, **Session Replay OFF**, **Heatmaps OFF**, **Web vitals OFF** —
  the job-description / CV textareas must never be captured.
- Person profiles: **identified events only**. We `identify()` by Clerk user id and set
  **no** person properties (no email, no name).
- Add all 11 events as event definitions; add the 8 properties as property definitions.
- Authorized URLs: `https://jobsesame.co.za` (+ preview domain if wanted).
- Consider a separate project for preview/local, or accept mixed data.

## Relevance AI setup

- Create agent **"Jobsesame Growth Director"** — analysis only. System prompt must forbid
  any action that changes ad spend, pricing or product behaviour.
- Input: a JSON funnel-data blob built by `/api/growth/analyze` (our server is the broker;
  the PostHog personal key never leaves our backend).
- Output: if async, configure the completion webhook to
  `POST https://jobsesame.co.za/api/growth/webhook` with header
  `x-relevance-signature: <RELEVANCE_WEBHOOK_SECRET>`.
- `/api/growth/analyze` is admin-gated (same `ADMIN_PASSWORD` pattern as `/api/admin/stats`).
