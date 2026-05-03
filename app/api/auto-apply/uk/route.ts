export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// ── Greenhouse helpers (mirrors auto-apply-form/route.ts) ─────────────────────

function extractGreenhouseParams(url: string): { boardToken: string; jobId: string } | null {
  const m = url.match(/greenhouse\.io\/([^/]+)\/jobs\/(\d+)/);
  if (!m) return null;
  return { boardToken: m[1], jobId: m[2] };
}

function buildTempPDF(cvData: any): Buffer {
  const name = cvData?.name || 'Candidate';
  const email = cvData?.email || '';
  const phone = cvData?.phone || '';
  const title = cvData?.title || '';
  const summary = cvData?.summary || '';
  const skills = (cvData?.skills || []).slice(0, 12).join(', ');
  const lines = [
    name, title,
    [email, phone].filter(Boolean).join('  |  '),
    '',
    summary && `Summary: ${summary}`,
    skills && `Skills: ${skills}`,
    ...(cvData?.experience || []).slice(0, 3).flatMap((e: any) => [
      '', `${e.title} — ${e.company} (${e.duration || ''})`,
      ...(e.bullets || []).slice(0, 2).map((b: string) => `• ${b}`),
    ]),
  ].filter(s => s !== false && s !== undefined);

  const escapePDF = (s: string) =>
    s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').substring(0, 90);

  const streamContent = lines.map(l => `(${escapePDF(String(l || ''))}) Tj T*`).join('\n');
  const stream = `BT\n/F1 10 Tf\n72 740 Td\n13 TL\n${streamContent}\nET`;
  const streamLen = Buffer.byteLength(stream, 'utf8');

  const o1 = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  const o2 = `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`;
  const o3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n`;
  const o4 = `4 0 obj\n<< /Length ${streamLen} >>\nstream\n${stream}\nendstream\nendobj\n`;
  const o5 = `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;

  const header = '%PDF-1.4\n';
  const body = o1 + o2 + o3 + o4 + o5;
  const xrefPos = header.length + body.length;

  let off = header.length;
  const offsets = [off];
  off += o1.length; offsets.push(off);
  off += o2.length; offsets.push(off);
  off += o3.length; offsets.push(off);
  off += o4.length; offsets.push(off);

  const xref =
    `xref\n0 6\n0000000000 65535 f \n` +
    offsets.map(n => `${String(n).padStart(10, '0')} 00000 n `).join('\n') +
    `\ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;

  return Buffer.from(header + body + xref, 'utf8');
}

async function applyViaGreenhouse(
  boardToken: string,
  jobId: string,
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  cvData: any
): Promise<{ success: boolean; message: string }> {
  const form = new FormData();
  form.append('first_name', firstName);
  form.append('last_name', lastName || firstName);
  form.append('email', email);
  if (phone) form.append('phone', phone);

  const pdfBuf = buildTempPDF(cvData);
  const blob = new Blob([pdfBuf], { type: 'application/pdf' });
  form.append('resume', blob, `${firstName}_${lastName || 'CV'}.pdf`);

  const res = await fetch(
    `https://boards-api.greenhouse.io/v1/boards/${boardToken}/jobs/${jobId}`,
    { method: 'POST', body: form }
  );

  if (res.ok || res.status === 201) {
    return { success: true, message: 'Application submitted successfully. The employer will contact you directly.' };
  }
  const text = await res.text().catch(() => '');
  return { success: false, message: `Greenhouse API returned ${res.status}: ${text.substring(0, 120)}` };
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }

  const { prisma } = await import('@/app/lib/prisma');

  const body = await req.json();
  const { jobUrl, jobTitle, company, applyType, userCV, userEmail, userName, userPhone } = body;

  if (!jobUrl || !jobTitle || !company) {
    return NextResponse.json({ error: 'jobUrl, jobTitle, and company are required' }, { status: 400 });
  }

  // ── Subscription gate ─────────────────────────────────────────────────────
  const dbUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { ukSubscription: true },
  });

  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const sub = dbUser.ukSubscription;

  if (!sub || !sub.active) {
    return NextResponse.json(
      { error: 'UK subscription required', redirect: '/uk/subscribe' },
      { status: 403 }
    );
  }

  if (sub.plan === 'credits' && sub.credits <= 0) {
    return NextResponse.json(
      { error: 'No UK credits remaining', redirect: '/uk/subscribe' },
      { status: 402 }
    );
  }

  // ── Apply ─────────────────────────────────────────────────────────────────
  let applicationStatus = 'Applied';
  let resultMessage = `Application submitted to ${company}`;

  if (applyType === 'greenhouse') {
    const ghParams = extractGreenhouseParams(jobUrl);
    if (ghParams) {
      const firstName = (userName || '').split(' ')[0] || 'Candidate';
      const lastName = (userName || '').split(' ').slice(1).join(' ') || '';
      const result = await applyViaGreenhouse(
        ghParams.boardToken, ghParams.jobId,
        firstName, lastName, userEmail || '', userPhone || '', userCV
      );
      if (!result.success) {
        return NextResponse.json({ success: false, message: result.message }, { status: 500 });
      }
      resultMessage = result.message;
    } else {
      applicationStatus = 'Pending';
      resultMessage = 'Could not parse Greenhouse URL. Please apply directly.';
    }
  } else {
    // Direct apply — return pre-filled data for user review
    const coverLetterStub = `Dear Hiring Manager,

I am writing to express my strong interest in the ${jobTitle} position at ${company}. With my background in ${(userCV?.skills || []).slice(0, 3).join(', ') || 'relevant skills'}, I am confident I would be a valuable addition to your team.

${userCV?.summary || ''}

I look forward to discussing this opportunity further.

Kind regards,
${userName || userCV?.name || ''}`;

    // Save application record before returning prefill data
    await prisma.application.create({
      data: {
        userId: dbUser.id,
        jobTitle,
        company,
        jobUrl,
        status: 'Draft',
        market: 'GB',
      },
    });

    if (sub.plan === 'credits') {
      await prisma.uKSubscription.update({
        where: { userId: dbUser.id },
        data: { credits: { decrement: 1 } },
      });
    }

    return NextResponse.json({
      success: true,
      applyType: 'direct',
      message: 'Pre-filled application ready for your review',
      prefill: {
        name: userName || userCV?.name || '',
        email: userEmail || userCV?.email || '',
        phone: userPhone || userCV?.phone || '',
        cvSummary: userCV?.summary || '',
        skills: (userCV?.skills || []).slice(0, 10),
        coverLetter: coverLetterStub,
        jobUrl,
      },
    });
  }

  // ── Deduct credit (credits plan only) ────────────────────────────────────
  if (sub.plan === 'credits') {
    await prisma.uKSubscription.update({
      where: { userId: dbUser.id },
      data: { credits: { decrement: 1 } },
    });
  }

  // ── Save application record ───────────────────────────────────────────────
  await prisma.application.create({
    data: {
      userId: dbUser.id,
      jobTitle,
      company,
      jobUrl,
      status: applicationStatus,
      market: 'GB',
    },
  });

  return NextResponse.json({ success: true, message: resultMessage });
}
