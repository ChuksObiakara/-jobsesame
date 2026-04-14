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

    const skillsList: string[] = cvData?.skills?.slice(0, 8) || [];
    const latestExp = cvData?.experience?.[0];
    const latestRole = latestExp ? `${latestExp.title} at ${latestExp.company}` : '';
    const summary = cvData?.summary || '';

    const skillBadges = skillsList.map((s: string) =>
      `<span style="background:#EAF5EA;color:#1A5A2A;padding:4px 12px;border-radius:99px;font-size:12px;font-weight:600;margin:2px;display:inline-block;">${s}</span>`
    ).join('');

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Georgia,'Times New Roman',serif;background:#f9f9f9;margin:0;padding:0;">
  <div style="max-width:600px;margin:32px auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e0e0e0;">
    <div style="background:#052A14;padding:28px 32px;">
      <div style="font-size:22px;font-weight:700;color:#ffffff;margin-bottom:8px;">Application for ${jobTitle}</div>
      <span style="background:#C8E600;color:#052A14;font-size:11px;font-weight:800;padding:4px 12px;border-radius:99px;display:inline-block;">Sent via Jobsesame AI</span>
    </div>
    <div style="padding:32px;">
      <p style="color:#444;line-height:1.8;font-size:14px;">Dear Hiring Manager,</p>
      <p style="color:#444;line-height:1.8;font-size:14px;">
        I am writing to express my strong interest in the <strong>${jobTitle}</strong> position at <strong>${jobCompany}</strong>.
        I am confident that my background and skills make me an excellent fit for this role.
      </p>
      ${summary ? `
      <div style="font-size:10px;font-weight:700;color:#1A7A3A;letter-spacing:1.5px;text-transform:uppercase;margin:20px 0 6px;">Professional Summary</div>
      <p style="color:#444;line-height:1.8;font-size:14px;font-style:italic;">${summary}</p>
      ` : ''}
      ${latestRole ? `
      <div style="font-size:10px;font-weight:700;color:#1A7A3A;letter-spacing:1.5px;text-transform:uppercase;margin:20px 0 6px;">Most Recent Role</div>
      <p style="color:#444;line-height:1.8;font-size:14px;"><strong>${latestRole}</strong></p>
      ` : ''}
      ${skillBadges ? `
      <div style="font-size:10px;font-weight:700;color:#1A7A3A;letter-spacing:1.5px;text-transform:uppercase;margin:20px 0 8px;">Key Skills</div>
      <div>${skillBadges}</div>
      ` : ''}
      <p style="color:#444;line-height:1.8;font-size:14px;margin-top:24px;">
        I would welcome the opportunity to discuss how my experience aligns with your requirements.
        Please feel free to reach me directly at <a href="mailto:${candidateEmail}" style="color:#1A7A3A;">${candidateEmail}</a>.
      </p>
      <p style="color:#444;line-height:1.8;font-size:14px;">
        Thank you for considering my application.
      </p>
      <p style="color:#444;line-height:1.8;font-size:14px;">
        Warm regards,<br>
        <strong>${candidateName}</strong><br>
        <a href="mailto:${candidateEmail}" style="color:#1A7A3A;">${candidateEmail}</a>
      </p>
    </div>
    <div style="background:#f4f4f4;padding:16px 32px;font-size:11px;color:#888;border-top:1px solid #e0e0e0;">
      This application was sent via <a href="https://jobsesame.co.za" style="color:#1A7A3A;">Jobsesame.co.za</a> — AI-powered job applications for African professionals.
    </div>
  </div>
</body>
</html>`;

    const { data, error } = await resend.emails.send({
      from: 'Jobsesame Applications <apply@jobsesame.co.za>',
      to: employerEmail,
      replyTo: candidateEmail,
      subject: `Application for ${jobTitle} — ${candidateName}`,
      html,
    });

    if (error) {
      return NextResponse.json({ error: (error as any).message || 'Email send failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to send application' }, { status: 500 });
  }
}
