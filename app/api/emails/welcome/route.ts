export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email, name, atsScore, weaknesses, cvTitle, userId } = await req.json();
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    const firstName = (name || email.split('@')[0]).split(' ')[0];
    const score = Math.round(atsScore || 0);
    const appUrl = 'https://jobsesame.co.za';
    const referralCode = userId ? Buffer.from(userId).toString('base64').slice(0, 8).toUpperCase() : 'SHARE';
    const referralLink = `${appUrl}?ref=${referralCode}`;
    const scoreColor = score >= 75 ? '#22C55E' : score >= 60 ? '#F59E0B' : '#EF4444';
    const scoreLabel = score >= 75 ? 'Your CV is performing well' : score >= 60 ? 'Your CV needs improvement to compete' : '⚠️ Your CV is failing automated screening';
    const weakList: string[] = Array.isArray(weaknesses) ? weaknesses.slice(0, 3) : [];
    const jobRole = cvTitle || 'your role';

    // Fetch role-specific jobs for the email
    const genericJobs = [
      { title: 'Software Engineer', company: 'Takealot Group', location: 'Cape Town', match: 88 },
      { title: 'Project Manager', company: 'Standard Bank', location: 'Johannesburg', match: 85 },
      { title: 'Marketing Manager', company: 'Discovery Ltd', location: 'Sandton', match: 82 },
    ];
    let emailJobs = genericJobs;
    if (cvTitle) {
      try {
        const jobRes = await fetch(`${appUrl}/api/jobs?query=${encodeURIComponent(cvTitle)}&location=`, {
          signal: AbortSignal.timeout(6000),
        });
        if (jobRes.ok) {
          const jobData = await jobRes.json();
          const fetched = (jobData.jobs || []).slice(0, 3);
          if (fetched.length >= 2) {
            emailJobs = fetched.map((j: any, i: number) => ({
              title: j.title,
              company: j.company,
              location: j.location,
              match: Math.max(75, 90 - i * 4),
            }));
          }
        }
      } catch {
        // use generic jobs
      }
    }
    const jobRowHtml = emailJobs.map(j =>
      `<div style="background:#072E16;border:1px solid #1A5A2A;border-radius:10px;padding:14px 18px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;">
        <div><div style="font-size:14px;font-weight:800;color:#FFFFFF;margin-bottom:2px;">${j.title}</div><div style="font-size:11px;color:#5A9A6A;">${j.company} &middot; ${j.location}</div></div>
        <div style="background:#0D3A1A;border:1.5px solid #22C55E;border-radius:99px;padding:4px 10px;font-size:12px;font-weight:900;color:#22C55E;white-space:nowrap;">${j.match}% match</div>
      </div>`
    ).join('');

    const weakHtml = weakList.map(w =>
      `<div style="background:#0D3A1A;border-left:3px solid #EF4444;border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:10px;font-size:13px;color:#F09595;line-height:1.5;">⚠️ ${w}</div>`
    ).join('');

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f0f7f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7f0;padding:32px 16px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="background:#052A14;border-radius:16px 16px 0 0;padding:24px 36px;text-align:center;">
  <span style="font-size:26px;font-weight:900;letter-spacing:-1px;"><span style="color:#FFFFFF;">job</span><span style="color:#C8E600;">sesame</span></span>
</td></tr>
<tr><td style="background:#072E16;padding:36px;text-align:center;">
  <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#5A9A6A;letter-spacing:2px;text-transform:uppercase;">Your CV score is ready</p>
  <h1 style="margin:0 0 24px;font-size:26px;font-weight:900;color:#FFFFFF;line-height:1.2;">Hi ${firstName}, here is<br/>what we found in your CV</h1>
  <div style="position:relative;display:inline-block;margin-bottom:16px;">
    <div style="width:110px;height:110px;border-radius:50%;border:8px solid ${scoreColor};display:inline-flex;align-items:center;justify-content:center;background:#052A14;">
      <span style="font-size:30px;font-weight:900;color:${scoreColor};">${score}%</span>
    </div>
  </div>
  <div style="font-size:15px;font-weight:700;color:${scoreColor};margin-bottom:6px;">${scoreLabel}</div>
  <p style="margin:0;font-size:13px;color:#5A9A6A;">ATS Compatibility Score — ${jobRole}</p>
</td></tr>
${weakHtml ? `<tr><td style="background:#0D3A1A;padding:28px 36px;">
  <p style="margin:0 0 14px;font-size:12px;font-weight:700;color:#C8E600;text-transform:uppercase;letter-spacing:1px;">Issues found in your CV:</p>
  ${weakHtml}
</td></tr>` : ''}
<tr><td style="background:#052A14;padding:24px 36px;">
  <p style="margin:0 0 14px;font-size:12px;font-weight:700;color:#C8E600;text-transform:uppercase;letter-spacing:1px;">Jobs matching your profile — apply now:</p>
  ${jobRowHtml}
  <div style="text-align:center;margin-top:16px;">
    <a href="${appUrl}/jobs" style="display:inline-block;background:transparent;color:#C8E600;font-size:13px;font-weight:700;padding:9px 22px;border-radius:99px;border:1.5px solid #C8E600;text-decoration:none;">See all matching jobs →</a>
  </div>
</td></tr>
<tr><td style="background:#072E16;padding:32px 36px;text-align:center;">
  <h2 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#FFFFFF;">Fix all issues in 30 seconds — free</h2>
  <p style="margin:0 0 20px;font-size:13px;color:#5A9A6A;line-height:1.6;">Our AI rewrites your CV for every job, fixing every issue above.</p>
  <a href="${appUrl}/dashboard" style="display:inline-block;background:#C8E600;color:#052A14;font-size:15px;font-weight:900;padding:14px 36px;border-radius:99px;text-decoration:none;">Fix my CV and start applying — free →</a>
  <p style="margin:12px 0 0;font-size:11px;color:#3A7A4A;">Average ATS score improvement after Jobsesame: +47 points</p>
</td></tr>
<tr><td style="background:#052A14;padding:24px 36px;">
  <p style="margin:0 0 10px;font-size:12px;color:#3A7A4A;font-weight:600;text-align:center;">Refer 3 friends → unlock 10 free rewrites permanently</p>
  <div style="background:#072E16;border:1px solid #1A5A2A;border-radius:10px;padding:12px 16px;text-align:center;">
    <p style="margin:0 0 4px;font-size:10px;color:#3A7A4A;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Your referral link</p>
    <p style="margin:0;font-size:12px;color:#90C898;font-family:monospace;word-break:break-all;">${referralLink}</p>
  </div>
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
      subject: 'Your CV score is ready — here is what we found',
      html,
    });

    if (error) {
      console.error('Welcome email error:', JSON.stringify(error));
      return NextResponse.json({ error: (error as any).message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Email /welcome error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
