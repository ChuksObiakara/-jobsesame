export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEnv = process.env.RESEND_FROM_EMAIL;
  const testRecipient = 'chuksobiakara@gmail.com';

  const diagnostics: Record<string, unknown> = {
    hasApiKey: !!apiKey,
    apiKeyPrefix: apiKey ? `${apiKey.slice(0, 8)}...` : null,
    RESEND_FROM_EMAIL: fromEnv || '(not set)',
    primaryFrom: fromEnv
      ? `Jobsesame <${fromEnv}>`
      : 'Jobsesame <noreply@jobsesame.co.za>',
    fallbackFrom: 'Jobsesame <onboarding@resend.dev>',
    sentTo: testRecipient,
  };

  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      error: 'RESEND_API_KEY is not set in environment variables',
      diagnostics,
    }, { status: 500 });
  }

  const { Resend } = await import('resend');
  const resend = new Resend(apiKey);

  const primaryFrom = fromEnv
    ? `Jobsesame <${fromEnv}>`
    : 'Jobsesame <noreply@jobsesame.co.za>';

  const sentAt = new Date().toISOString();

  const emailOpts = {
    replyTo: 'support@jobsesame.co.za',
    to: testRecipient,
    subject: `[TEST] Jobsesame email test — ${sentAt}`,
    html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#052A14;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
<tr><td style="background:#072E16;border:1.5px solid #1A4A2A;border-radius:16px;padding:36px;">
  <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#5A9A6A;letter-spacing:2px;text-transform:uppercase;">Email test</p>
  <h1 style="margin:0 0 20px;font-size:24px;font-weight:900;color:#C8E600;line-height:1.2;">
    <span style="color:#FFFFFF;">job</span>sesame email test ✓
  </h1>
  <p style="margin:0 0 12px;font-size:14px;color:#90C898;line-height:1.6;">This is a test email confirming that the Resend integration is working correctly.</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D3A1A;border:1px solid #1A5A2A;border-radius:10px;padding:0;margin:0 0 20px;">
    <tr><td style="padding:16px 20px;">
      <p style="margin:0 0 8px;font-size:12px;color:#5A9A6A;">From address used: <strong style="color:#C8E600;">${primaryFrom}</strong></p>
      <p style="margin:0 0 8px;font-size:12px;color:#5A9A6A;">Sent at: <strong style="color:#FFFFFF;">${sentAt}</strong></p>
      <p style="margin:0;font-size:12px;color:#5A9A6A;">API key prefix: <strong style="color:#FFFFFF;">${apiKey.slice(0, 8)}...</strong></p>
    </td></tr>
  </table>
  <p style="margin:0;font-size:12px;color:#3A7A4A;">If you received this, the welcome email sequence is correctly configured.</p>
</td></tr>
</table></td></tr></table>
</body></html>`,
  };

  // Try primary from address (noreply@jobsesame.co.za via RESEND_FROM_EMAIL)
  let { data, error } = await resend.emails.send({ from: primaryFrom, ...emailOpts });
  let usedFrom = primaryFrom;
  let fallbackUsed = false;
  let primaryError: string | null = null;

  // If domain not verified, automatically retry with onboarding@resend.dev fallback
  if (error && primaryFrom !== 'Jobsesame <onboarding@resend.dev>') {
    primaryError = (error as any).message || 'Unknown error';
    const fallback = await resend.emails.send({
      from: 'Jobsesame <onboarding@resend.dev>',
      ...emailOpts,
      subject: `[TEST — fallback from] Jobsesame email test — ${sentAt}`,
    });
    data = fallback.data;
    error = fallback.error;
    usedFrom = 'Jobsesame <onboarding@resend.dev>';
    fallbackUsed = true;
  }

  return NextResponse.json({
    ok: !error,
    diagnostics,
    result: {
      usedFrom,
      fallbackUsed,
      primaryError,
      emailId: data?.id ?? null,
      error: error ? (error as any).message : null,
      sentTo: testRecipient,
      sentAt,
    },
    tests: {
      apiKeyPresent: !!apiKey,
      fromEnvSet: !!fromEnv,
      emailSent: !error,
      usedFallback: fallbackUsed,
      recommendation: fallbackUsed
        ? `Domain ${fromEnv} not verified in Resend — verify it at resend.com/domains to send from noreply@jobsesame.co.za`
        : 'All checks passed',
    },
  });
}
