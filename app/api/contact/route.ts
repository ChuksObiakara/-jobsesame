export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sendWithFallback } from '@/app/lib/email-from';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
function checkRateLimit(key: string, max: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + 3_600_000 });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!checkRateLimit(ip, 5)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Please fill in all fields.' }, { status: 400 });
    }
    if (typeof email !== 'string' || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }
    if (typeof message !== 'string' || message.trim().length < 5) {
      return NextResponse.json({ error: 'Please include a short message.' }, { status: 400 });
    }
    if (String(name).length > 200 || String(email).length > 200 || String(message).length > 5000) {
      return NextResponse.json({ error: 'One of the fields is too long.' }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error('Contact form: RESEND_API_KEY not configured');
      return NextResponse.json({ error: 'Something went wrong on our end. Please email hello@jobsesame.co directly.' }, { status: 500 });
    }

    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);

    const safe = (s: string) => String(s).replace(/[<>]/g, '');

    const emailOpts = {
      to: 'hello@jobsesame.co',
      replyTo: email,
      subject: `New contact form message from ${safe(name)}`,
      html: `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#052A14;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
<tr><td style="background:#072E16;border:1.5px solid #1A4A2A;border-radius:16px;padding:36px;">
  <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#5A9A6A;letter-spacing:2px;text-transform:uppercase;">Contact form</p>
  <h1 style="margin:0 0 20px;font-size:22px;font-weight:900;color:#C8E600;line-height:1.2;">New message from ${safe(name)}</h1>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D3A1A;border:1px solid #1A5A2A;border-radius:10px;padding:0;margin:0 0 20px;">
    <tr><td style="padding:16px 20px;">
      <p style="margin:0 0 8px;font-size:12px;color:#5A9A6A;">Name: <strong style="color:#FFFFFF;">${safe(name)}</strong></p>
      <p style="margin:0;font-size:12px;color:#5A9A6A;">Email: <strong style="color:#FFFFFF;">${safe(email)}</strong></p>
    </td></tr>
  </table>
  <p style="margin:0 0 8px;font-size:12px;color:#5A9A6A;text-transform:uppercase;letter-spacing:1px;">Message</p>
  <p style="margin:0;font-size:14px;color:#E8F4E8;line-height:1.7;white-space:pre-wrap;">${safe(message)}</p>
</td></tr>
</table></td></tr></table>
</body></html>`,
    };

    const { error } = await sendWithFallback(resend, emailOpts);

    if (error) {
      console.error('Contact form send error:', error.message);
      return NextResponse.json({ error: 'Something went wrong sending your message. Please email hello@jobsesame.co directly.' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Contact form error:', err?.message);
    return NextResponse.json({ error: 'Something went wrong. Please email hello@jobsesame.co directly.' }, { status: 500 });
  }
}
