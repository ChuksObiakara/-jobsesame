export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email, reason, message } = await req.json();
    if (!email || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const submittedAt = new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' });

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f0f7f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7f0;padding:32px 16px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="background:#052A14;border-radius:16px 16px 0 0;padding:24px 36px;text-align:center;">
  <span style="font-size:22px;font-weight:900;"><span style="color:#FFFFFF;">job</span><span style="color:#C8E600;">sesame</span></span>
  <p style="margin:8px 0 0;font-size:13px;color:#5A9A6A;font-weight:600;">DATA DELETION REQUEST</p>
</td></tr>
<tr><td style="background:#072E16;padding:28px 36px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="padding:10px 0;border-bottom:1px solid #0D4A20;"><span style="font-size:12px;color:#5A9A6A;font-weight:700;text-transform:uppercase;">Email</span><br/><span style="font-size:14px;color:#FFFFFF;">${email}</span></td></tr>
    <tr><td style="padding:10px 0;border-bottom:1px solid #0D4A20;"><span style="font-size:12px;color:#5A9A6A;font-weight:700;text-transform:uppercase;">Reason</span><br/><span style="font-size:14px;color:#FFFFFF;">${reason}</span></td></tr>
    <tr><td style="padding:10px 0;border-bottom:1px solid #0D4A20;"><span style="font-size:12px;color:#5A9A6A;font-weight:700;text-transform:uppercase;">Message</span><br/><span style="font-size:14px;color:#FFFFFF;">${message || '(none)'}</span></td></tr>
    <tr><td style="padding:10px 0;"><span style="font-size:12px;color:#5A9A6A;font-weight:700;text-transform:uppercase;">Submitted</span><br/><span style="font-size:14px;color:#FFFFFF;">${submittedAt} (SAST)</span></td></tr>
  </table>
</td></tr>
<tr><td style="background:#031A0C;border-radius:0 0 16px 16px;padding:20px 36px;text-align:center;">
  <p style="margin:0;font-size:12px;color:#3A7A4A;">Process this request within 30 days per POPIA s.24. Confirm deletion by email to the requester.</p>
</td></tr>
</table></td></tr></table>
</body></html>`;

    const { error } = await resend.emails.send({
      from: 'Jobsesame <onboarding@resend.dev>',
      replyTo: email,
      to: 'privacy@jobsesame.co.za',
      subject: `Data deletion request from ${email}`,
      html,
    });

    if (error) {
      console.error('Data deletion email error:', JSON.stringify(error));
      return NextResponse.json({ error: (error as any).message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Data deletion route error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
