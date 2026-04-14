export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

function buildReferralLink(userId: string): string {
  const referralCode = Buffer.from(userId).toString('base64').slice(0, 8).toUpperCase();
  const appUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://jobsesame.co.za';
  return `${appUrl}?ref=${referralCode}`;
}

function buildEmailHtml(name: string, email: string, userId: string): string {
  const firstName = name.split(' ')[0];
  const referralLink = buildReferralLink(userId);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Jobsesame</title>
</head>
<body style="margin:0;padding:0;background:#f0f7f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f7f0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- HEADER -->
          <tr>
            <td style="background:#052A14;border-radius:16px 16px 0 0;padding:28px 36px;text-align:center;">
              <div style="display:inline-block;">
                <span style="font-size:28px;font-weight:900;letter-spacing:-1px;">
                  <span style="color:#FFFFFF;">job</span><span style="color:#C8E600;">sesame</span>
                </span>
              </div>
              <p style="margin:10px 0 0;font-size:12px;color:#3A7A4A;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;">
                AI Job Platform for Africa and the World
              </p>
            </td>
          </tr>

          <!-- HERO -->
          <tr>
            <td style="background:#072E16;padding:40px 36px 32px;text-align:center;">
              <div style="display:inline-block;background:rgba(200,230,0,0.12);border:1.5px solid #C8E600;border-radius:99px;padding:6px 18px;font-size:11px;color:#C8E600;font-weight:700;letter-spacing:1px;margin-bottom:20px;">
                YOUR DOORS ARE OPEN
              </div>
              <h1 style="margin:0 0 12px;font-size:30px;font-weight:900;color:#FFFFFF;line-height:1.2;letter-spacing:-0.5px;">
                Welcome, ${firstName}.<br/>
                <span style="color:#C8E600;">Your 3 free applications are ready.</span>
              </h1>
              <p style="margin:0;font-size:15px;color:#90C898;line-height:1.7;">
                Upload your CV once. AI rewrites it for every job in 30 seconds.<br/>
                Apply to jobs across 180 countries — <strong style="color:#FFFFFF;">starting right now, free.</strong>
              </p>
            </td>
          </tr>

          <!-- CREDITS SECTION -->
          <tr>
            <td style="background:#0D3A1A;padding:0 36px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:28px 0;border-bottom:1px solid #1A5A2A;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:56px;vertical-align:top;">
                          <div style="width:48px;height:48px;background:#C8E600;border-radius:12px;text-align:center;line-height:48px;font-size:22px;">⚡</div>
                        </td>
                        <td style="padding-left:16px;vertical-align:top;">
                          <p style="margin:0 0 4px;font-size:15px;font-weight:800;color:#FFFFFF;">3 free Quick Apply credits</p>
                          <p style="margin:0;font-size:13px;color:#5A9A6A;line-height:1.7;">
                            Each credit rewrites your CV for a specific job and opens the employer's application. No card. No catch. Just open doors.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px 0;border-bottom:1px solid #1A5A2A;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:56px;vertical-align:top;">
                          <div style="width:48px;height:48px;background:#C8E600;border-radius:12px;text-align:center;line-height:48px;font-size:22px;">🤖</div>
                        </td>
                        <td style="padding-left:16px;vertical-align:top;">
                          <p style="margin:0 0 4px;font-size:15px;font-weight:800;color:#FFFFFF;">AI rewrites your CV in 30 seconds</p>
                          <p style="margin:0;font-size:13px;color:#5A9A6A;line-height:1.7;">
                            Upload your CV once. Our AI extracts your skills and experience, then rebuilds it specifically for each job — optimised for ATS systems and recruiters.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px 0;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width:56px;vertical-align:top;">
                          <div style="width:48px;height:48px;background:#C8E600;border-radius:12px;text-align:center;line-height:48px;font-size:22px;">🌍</div>
                        </td>
                        <td style="padding-left:16px;vertical-align:top;">
                          <p style="margin:0 0 4px;font-size:15px;font-weight:800;color:#FFFFFF;">2.4M+ jobs across 180 countries</p>
                          <p style="margin:0;font-size:13px;color:#5A9A6A;line-height:1.7;">
                            Remote, relocation, local — every door is open. From Johannesburg to London, Lagos to Toronto, Nairobi to Dubai.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA BUTTON -->
          <tr>
            <td style="background:#072E16;padding:32px 36px;text-align:center;">
              <a href="https://jobsesame.co.za/dashboard"
                style="display:inline-block;background:#C8E600;color:#052A14;font-size:15px;font-weight:900;padding:15px 40px;border-radius:99px;text-decoration:none;letter-spacing:-0.2px;">
                Open your dashboard →
              </a>
            </td>
          </tr>

          <!-- REFERRAL SECTION -->
          <tr>
            <td style="background:#052A14;padding:32px 36px;border-top:1px solid #0D4A20;">
              <div style="background:#072E16;border:1.5px solid #1A5A2A;border-radius:14px;padding:24px;">
                <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#C8E600;letter-spacing:1.5px;text-transform:uppercase;">
                  Unlock 10 more free rewrites
                </p>
                <p style="margin:0 0 16px;font-size:20px;font-weight:900;color:#FFFFFF;line-height:1.3;">
                  Share Jobsesame with 3 friends.<br/>Get 10 free CV rewrites — permanently.
                </p>
                <p style="margin:0 0 16px;font-size:13px;color:#5A9A6A;line-height:1.7;">
                  When 3 friends sign up using your link, you unlock 10 free AI CV rewrites. No payment needed. Just share and they open your doors wider.
                </p>
                <div style="background:#0D3A1A;border:1px solid #1A5A2A;border-radius:10px;padding:14px 18px;margin-bottom:20px;">
                  <p style="margin:0 0 6px;font-size:10px;color:#3A7A4A;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Your unique referral link</p>
                  <p style="margin:0;font-size:13px;color:#90C898;font-family:monospace;word-break:break-all;">${referralLink}</p>
                </div>
                <div style="text-align:center;">
                  <a href="${referralLink}"
                    style="display:inline-block;background:transparent;color:#C8E600;font-size:13px;font-weight:700;padding:11px 28px;border-radius:99px;border:1.5px solid #C8E600;text-decoration:none;">
                    Share your link
                  </a>
                </div>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
                  <tr>
                    <td style="text-align:center;padding:12px 8px;border-right:1px solid #1A5A2A;">
                      <div style="font-size:20px;margin-bottom:4px;">👤</div>
                      <div style="font-size:10px;color:#3A7A4A;font-weight:600;">Friend 1</div>
                    </td>
                    <td style="text-align:center;padding:12px 8px;border-right:1px solid #1A5A2A;">
                      <div style="font-size:20px;margin-bottom:4px;">👤</div>
                      <div style="font-size:10px;color:#3A7A4A;font-weight:600;">Friend 2</div>
                    </td>
                    <td style="text-align:center;padding:12px 8px;">
                      <div style="font-size:20px;margin-bottom:4px;">👤</div>
                      <div style="font-size:10px;color:#3A7A4A;font-weight:600;">Friend 3</div>
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- QUOTE -->
          <tr>
            <td style="background:#052A14;padding:0 36px 32px;text-align:center;">
              <p style="margin:0;font-size:14px;color:#1A5A2A;font-style:italic;">
                &ldquo;Open sesame — and watch your future open.&rdquo;
              </p>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background:#031A0C;border-radius:0 0 16px 16px;padding:24px 36px;text-align:center;border-top:1px solid #0D3A1A;">
              <p style="margin:0 0 10px;font-size:12px;color:#1A4A2A;">
                You received this email because you signed up for Jobsesame with ${email}.
              </p>
              <p style="margin:0;font-size:11px;color:#0D3A1A;">
                © 2025 Jobsesame &nbsp;·&nbsp;
                <a href="https://jobsesame.co.za/privacy" style="color:#1A5A2A;text-decoration:none;">Privacy Policy</a>
                &nbsp;·&nbsp;
                <a href="https://jobsesame.co.za/terms" style="color:#1A5A2A;text-decoration:none;">Terms of Service</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const { email, name, userId } = await req.json();

    if (!email || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: 'Jobsesame <hello@jobsesame.co.za>',
      to: email,
      subject: 'Welcome to Jobsesame — your 3 free applications are ready',
      html: buildEmailHtml(name || email.split('@')[0], email, userId),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to send welcome email' }, { status: 500 });
  }
}
