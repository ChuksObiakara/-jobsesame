// IMPORTANT — verify jobsesame.co.za domain on resend.com before this will work in production.
// The DNS records needed are shown in the Resend dashboard under Domains.

export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { employerEmail, jobTitle, jobCompany, candidateName, candidateEmail, cvData } = await req.json();

    if (!employerEmail || !jobTitle || !candidateEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    // Use Resend's shared test domain until jobsesame.co.za is verified in the Resend dashboard.
    // Switch back to noreply@jobsesame.co.za once DNS records are confirmed.
    const fromEmail = 'onboarding@resend.dev';

    const skillsList: string[] = cvData?.skills?.slice(0, 10) || [];
    const latestExp = cvData?.experience?.[0];
    const currentTitle = cvData?.title || (latestExp ? latestExp.title : '');
    const summary = cvData?.summary || '';
    const education = cvData?.education || '';
    const experienceYears = cvData?.experience_years ?? null;
    const languages: string[] = cvData?.languages || [];

    const skillBadges = skillsList.map((s: string) =>
      `<span style="background:#EAF5EA;color:#1A5A2A;padding:4px 12px;border-radius:99px;font-size:12px;font-weight:600;margin:3px 3px 3px 0;display:inline-block;">${s}</span>`
    ).join('');

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:Georgia,'Times New Roman',serif;background:#f4f6f4;margin:0;padding:0;">
  <div style="max-width:620px;margin:32px auto;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #d8e8d8;box-shadow:0 2px 12px rgba(0,0,0,0.07);">

    <!-- Header -->
    <div style="background:#052A14;padding:28px 32px 24px;">
      <div style="font-size:11px;font-weight:700;color:#C8E600;letter-spacing:2px;text-transform:uppercase;margin-bottom:10px;">Job Application</div>
      <div style="font-size:22px;font-weight:700;color:#ffffff;margin-bottom:12px;">Application for ${jobTitle}</div>
      <div style="font-size:15px;color:#A8D8B0;margin-bottom:14px;">
        <strong style="color:#ffffff;">${candidateName}</strong>${currentTitle ? ` &mdash; ${currentTitle}` : ''}
      </div>
      <span style="background:#C8E600;color:#052A14;font-size:11px;font-weight:800;padding:4px 14px;border-radius:99px;display:inline-block;">Submitted via Jobsesame.co.za</span>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="color:#444;line-height:1.8;font-size:14px;margin-top:0;">Dear Hiring Manager,</p>
      <p style="color:#444;line-height:1.8;font-size:14px;">
        I am writing to express my strong interest in the <strong>${jobTitle}</strong> position
        at <strong>${jobCompany}</strong>. Please find my details below.
      </p>

      ${summary ? `
      <div style="font-size:10px;font-weight:700;color:#1A7A3A;letter-spacing:1.5px;text-transform:uppercase;margin:24px 0 6px;">Professional Summary</div>
      <p style="color:#333;line-height:1.85;font-size:14px;font-style:italic;margin:0;padding:14px 18px;background:#f8fdf8;border-left:3px solid #C8E600;border-radius:0 6px 6px 0;">${summary}</p>
      ` : ''}

      ${(currentTitle || experienceYears !== null || education) ? `
      <div style="font-size:10px;font-weight:700;color:#1A7A3A;letter-spacing:1.5px;text-transform:uppercase;margin:24px 0 10px;">Profile</div>
      <table style="width:100%;border-collapse:collapse;">
        ${currentTitle ? `<tr><td style="padding:6px 0;color:#777;font-size:13px;width:160px;">Current title</td><td style="padding:6px 0;color:#222;font-size:13px;font-weight:600;">${currentTitle}</td></tr>` : ''}
        ${experienceYears !== null ? `<tr><td style="padding:6px 0;color:#777;font-size:13px;">Experience</td><td style="padding:6px 0;color:#222;font-size:13px;font-weight:600;">${experienceYears} year${experienceYears !== 1 ? 's' : ''}</td></tr>` : ''}
        ${education ? `<tr><td style="padding:6px 0;color:#777;font-size:13px;">Education</td><td style="padding:6px 0;color:#222;font-size:13px;font-weight:600;">${education}</td></tr>` : ''}
        ${languages.length ? `<tr><td style="padding:6px 0;color:#777;font-size:13px;">Languages</td><td style="padding:6px 0;color:#222;font-size:13px;font-weight:600;">${languages.join(', ')}</td></tr>` : ''}
      </table>
      ` : ''}

      ${skillBadges ? `
      <div style="font-size:10px;font-weight:700;color:#1A7A3A;letter-spacing:1.5px;text-transform:uppercase;margin:24px 0 10px;">Key Skills</div>
      <div style="margin-bottom:4px;">${skillBadges}</div>
      ` : ''}

      <div style="border-top:1px solid #e8f0e8;margin:28px 0 24px;"></div>

      <p style="color:#444;line-height:1.8;font-size:14px;margin:0 0 12px;">
        I would welcome the opportunity to discuss how my experience aligns with your requirements.
        Please reply directly to this email to reach me — it will go straight to my inbox.
      </p>
      <p style="color:#444;line-height:1.8;font-size:14px;margin:0 0 24px;">
        Thank you for your time and consideration.
      </p>
      <p style="color:#444;line-height:1.8;font-size:14px;margin:0;">
        Warm regards,<br>
        <strong style="color:#052A14;">${candidateName}</strong><br>
        <a href="mailto:${candidateEmail}" style="color:#1A7A3A;font-size:13px;">${candidateEmail}</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f4f9f4;padding:16px 32px;font-size:11px;color:#888;border-top:1px solid #dceadc;text-align:center;line-height:1.7;">
      This application was submitted via <a href="https://jobsesame.co.za" style="color:#1A7A3A;font-weight:600;">Jobsesame.co.za</a> — AI-powered job applications.<br>
      Reply directly to this email to contact the applicant at <a href="mailto:${candidateEmail}" style="color:#1A7A3A;">${candidateEmail}</a>.
    </div>
  </div>
</body>
</html>`;

    const { data, error } = await resend.emails.send({
      from: `Applications via Jobsesame <${fromEmail}>`,
      replyTo: candidateEmail,
      to: employerEmail,
      subject: `Application for ${jobTitle} — ${candidateName}`,
      html,
    });

    if (error) {
      console.error('Resend error full response:', JSON.stringify(error, null, 2));
      console.error('Resend from:', fromEmail, 'to:', employerEmail);
      return NextResponse.json({ error: (error as any).message || 'Email send failed', resendError: error }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err: any) {
    console.error('Auto-apply route error:', err);
    return NextResponse.json({ error: err.message || 'Failed to send application' }, { status: 500 });
  }
}
