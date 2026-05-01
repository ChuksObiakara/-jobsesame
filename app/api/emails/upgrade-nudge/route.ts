export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email, name, currency } = await req.json();
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const firstName = (name || email.split('@')[0]).split(' ')[0];
    const appUrl = 'https://jobsesame.co.za';
    const isZAR = !currency || currency === 'ZAR';
    const price = isZAR ? 'R249/month' : '$14/month';
    const upgradeUrl = `${appUrl}/pricing`;

    const loseItems = [
      'Unlimited AI-rewritten CVs for every job',
      'Auto-apply to 100+ jobs per day',
      'Priority matching — top of the applicant pile',
      'Salary intelligence for your role',
      'Cover letter generator',
    ];

    const loseHtml = loseItems.map(item =>
      `<tr><td style="padding:6px 0;font-size:13px;color:#F09595;vertical-align:top;padding-right:8px;">✗</td><td style="padding:6px 0;font-size:13px;color:#D0D0D0;line-height:1.5;">${item}</td></tr>`
    ).join('');

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f0f7f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7f0;padding:32px 16px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="background:#052A14;border-radius:16px 16px 0 0;padding:24px 36px;text-align:center;">
  <span style="font-size:26px;font-weight:900;letter-spacing:-1px;"><span style="color:#FFFFFF;">job</span><span style="color:#C8E600;">sesame</span></span>
</td></tr>
<tr><td style="background:#3A0A0A;padding:28px 36px;text-align:center;border-bottom:1px solid #5A1A1A;">
  <div style="font-size:36px;margin-bottom:10px;">⚠️</div>
  <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#F59E0B;letter-spacing:2px;text-transform:uppercase;">Running low</p>
  <h1 style="margin:0;font-size:24px;font-weight:900;color:#FFFFFF;line-height:1.3;">Hi ${firstName}, you have<br/><span style="color:#EF4444;">1 free application left</span></h1>
</td></tr>
<tr><td style="background:#1A0808;padding:28px 36px;">
  <p style="margin:0 0 14px;font-size:13px;color:#D0D0D0;line-height:1.6;">When your free applications run out, you will lose access to:</p>
  <table width="100%" cellpadding="0" cellspacing="0">
    ${loseHtml}
  </table>
</td></tr>
<tr><td style="background:#072E16;padding:32px 36px;text-align:center;">
  <div style="background:#0D3A1A;border:1.5px solid #1A5A2A;border-radius:12px;padding:20px;margin-bottom:20px;">
    <p style="margin:0 0 4px;font-size:12px;color:#5A9A6A;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Pro Plan</p>
    <div style="font-size:32px;font-weight:900;color:#C8E600;margin-bottom:4px;">${price}</div>
    <p style="margin:0;font-size:12px;color:#3A7A4A;">Cancel any time · No hidden fees</p>
  </div>
  <a href="${upgradeUrl}" style="display:inline-block;background:#C8E600;color:#052A14;font-size:16px;font-weight:900;padding:16px 40px;border-radius:99px;text-decoration:none;">Upgrade now — keep applying →</a>
  <p style="margin:14px 0 0;font-size:11px;color:#3A7A4A;">Most users get an interview within 14 days of upgrading</p>
</td></tr>
<tr><td style="background:#031A0C;border-radius:0 0 16px 16px;padding:20px 36px;text-align:center;border-top:1px solid #0D3A1A;">
  <p style="margin:0 0 8px;font-size:11px;color:#1A4A2A;">© 2025 Jobsesame (Pty) Ltd · <a href="${appUrl}/privacy" style="color:#1A5A2A;text-decoration:none;">Privacy</a> · <a href="${appUrl}/terms" style="color:#1A5A2A;text-decoration:none;">Terms</a></p>
  <p style="margin:0 0 6px;font-size:11px;color:#1A4A2A;">Jobsesame (Pty) Ltd, South Africa</p>
  <p style="margin:0;font-size:11px;"><a href="${appUrl}/unsubscribe" style="color:#3A7A4A;text-decoration:underline;">Don't want these emails? Unsubscribe here</a></p>
</td></tr>
</table></td></tr></table>
</body></html>`;

    const { error } = await resend.emails.send({
      from: 'Jobsesame <onboarding@resend.dev>',
      replyTo: 'support@jobsesame.co.za',
      to: email,
      subject: 'You have 1 free application left — upgrade before it runs out',
      html,
    });

    if (error) {
      console.error('Upgrade-nudge email error:', JSON.stringify(error));
      return NextResponse.json({ error: (error as any).message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Email /upgrade-nudge error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
