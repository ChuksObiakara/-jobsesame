export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email, name, cvTitle } = await req.json();
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const firstName = (name || email.split('@')[0]).split(' ')[0];
    const appUrl = 'https://jobsesame.co.za';
    const role = cvTitle || 'your role';

    const jobs = [
      { title: 'Senior Software Engineer', company: 'Takealot Group', location: 'Cape Town', match: 94 },
      { title: 'Full Stack Developer', company: 'Discovery Ltd', location: 'Johannesburg', match: 91 },
      { title: 'Backend Engineer', company: 'Yoco Technologies', location: 'Remote', match: 88 },
      { title: 'Software Developer', company: 'Capitec Bank', location: 'Stellenbosch', match: 85 },
      { title: 'Platform Engineer', company: 'Standard Bank', location: 'Johannesburg', match: 82 },
    ];

    const jobCards = jobs.map(j => `
<tr>
  <td style="padding:0 0 12px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#072E16;border:1px solid #1A5A2A;border-radius:10px;overflow:hidden;">
      <tr>
        <td style="padding:16px 20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <div style="font-size:15px;font-weight:800;color:#FFFFFF;margin-bottom:3px;">${j.title}</div>
                <div style="font-size:12px;color:#5A9A6A;">${j.company} &middot; ${j.location}</div>
              </td>
              <td style="text-align:right;vertical-align:top;">
                <div style="background:#0D3A1A;border:1.5px solid #22C55E;border-radius:99px;padding:5px 12px;display:inline-block;">
                  <span style="font-size:13px;font-weight:900;color:#22C55E;">${j.match}%</span>
                  <span style="font-size:10px;color:#3A9A4A;margin-left:3px;">match</span>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:0 20px 14px;">
          <a href="${appUrl}/jobs" style="display:inline-block;background:transparent;color:#C8E600;font-size:12px;font-weight:700;padding:7px 18px;border-radius:99px;border:1.5px solid #C8E600;text-decoration:none;">Apply now →</a>
        </td>
      </tr>
    </table>
  </td>
</tr>`).join('');

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f0f7f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7f0;padding:32px 16px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="background:#052A14;border-radius:16px 16px 0 0;padding:24px 36px;text-align:center;">
  <span style="font-size:26px;font-weight:900;letter-spacing:-1px;"><span style="color:#FFFFFF;">job</span><span style="color:#C8E600;">sesame</span></span>
</td></tr>
<tr><td style="background:#072E16;padding:36px 36px 24px;text-align:center;">
  <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#5A9A6A;letter-spacing:2px;text-transform:uppercase;">Strong matches found</p>
  <h1 style="margin:0 0 12px;font-size:24px;font-weight:900;color:#FFFFFF;line-height:1.3;">Hi ${firstName}, here are 5 jobs<br/>your CV is a strong match for</h1>
  <p style="margin:0;font-size:13px;color:#5A9A6A;">Based on your CV — ${role} roles</p>
</td></tr>
<tr><td style="background:#052A14;padding:24px 36px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    ${jobCards}
  </table>
</td></tr>
<tr><td style="background:#072E16;padding:28px 36px;text-align:center;">
  <p style="margin:0 0 16px;font-size:13px;color:#5A9A6A;line-height:1.6;">These jobs are live right now. Apply in 30 seconds with your AI-optimised CV.</p>
  <a href="${appUrl}/jobs" style="display:inline-block;background:#C8E600;color:#052A14;font-size:15px;font-weight:900;padding:14px 36px;border-radius:99px;text-decoration:none;">See all matching jobs →</a>
</td></tr>
<tr><td style="background:#031A0C;border-radius:0 0 16px 16px;padding:20px 36px;text-align:center;border-top:1px solid #0D3A1A;">
  <p style="margin:0;font-size:11px;color:#1A4A2A;">© 2025 Jobsesame · <a href="${appUrl}/privacy" style="color:#1A5A2A;text-decoration:none;">Privacy</a> · <a href="${appUrl}/terms" style="color:#1A5A2A;text-decoration:none;">Terms</a></p>
</td></tr>
</table></td></tr></table>
</body></html>`;

    const { error } = await resend.emails.send({
      from: 'Jobsesame <onboarding@resend.dev>',
      replyTo: 'support@jobsesame.co.za',
      to: email,
      subject: '5 jobs your CV is a strong match for right now',
      html,
    });

    if (error) {
      console.error('Job-matches email error:', JSON.stringify(error));
      return NextResponse.json({ error: (error as any).message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Email /job-matches error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
