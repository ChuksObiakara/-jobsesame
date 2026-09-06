import { Resend } from 'resend';

// Single source of truth for which address every transactional email tries
// to send from. Before this, routes were split three ways — some read
// RESEND_FROM_EMAIL, some read EMAIL_FROM, two (data-deletion, auto-apply)
// hardcoded Resend's own onboarding@resend.dev outright — so setting one
// environment variable could never make "all emails come from
// hello@jobsesame.co" true; each route needed its own env var name in sync.
const PRIMARY_ADDRESS = process.env.EMAIL_FROM || 'hello@jobsesame.co';
// Resend's shared, always-valid sending domain. If jobsesame.co isn't (yet)
// verified in the Resend dashboard, sending from PRIMARY_ADDRESS is
// rejected — sendWithFallback below retries once against this address so
// the email still goes out instead of silently failing.
const FALLBACK_ADDRESS = 'onboarding@resend.dev';

export const PRIMARY_FROM = `Jobsesame <${PRIMARY_ADDRESS}>`;
export const FALLBACK_FROM = `Jobsesame <${FALLBACK_ADDRESS}>`;

interface SendOpts {
  /** Display name shown before the address, e.g. "Jobsesame" (default) or "Applications via Jobsesame". */
  fromName?: string;
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendWithFallback(resend: Resend, opts: SendOpts) {
  const { fromName = 'Jobsesame', ...rest } = opts;
  let { data, error } = await resend.emails.send({ from: `${fromName} <${PRIMARY_ADDRESS}>`, ...rest });
  if (error && PRIMARY_ADDRESS !== FALLBACK_ADDRESS) {
    ({ data, error } = await resend.emails.send({ from: `${fromName} <${FALLBACK_ADDRESS}>`, ...rest }));
  }
  return { data, error };
}
