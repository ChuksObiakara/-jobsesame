export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

// ── Greenhouse direct API apply (no scraping needed) ─────────────────────────

function extractGreenhouseParams(url: string): { boardToken: string; jobId: string } | null {
  // Formats:
  //   https://boards.greenhouse.io/{token}/jobs/{id}
  //   https://job-boards.greenhouse.io/{token}/jobs/{id}  (newer URLs)
  const m = url.match(/greenhouse\.io\/([^/]+)\/jobs\/(\d+)/);
  if (!m) return null;
  return { boardToken: m[1], jobId: m[2] };
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

  // Attach a minimal PDF resume
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

async function fillField(el: any, value: string) {
  await el.click({ clickCount: 3 });
  await el.type(value, { delay: 25 });
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

  const streamContent = lines.map(l =>
    `(${escapePDF(String(l || ''))}) Tj T*`
  ).join('\n');

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

export async function POST(req: NextRequest) {
  let browser: any = null;
  let tempFile: string | null = null;

  const TOTAL_TIMEOUT = 30_000;

  const run = async () => {
    const body = await req.json();
    const { jobUrl, candidateName, candidateEmail, candidatePhone, cvData, jobType, boardToken: bodyToken, jobId: bodyJobId } = body;

    if (!jobUrl) {
      return NextResponse.json({ error: 'jobUrl required' }, { status: 400 });
    }

    // ── Fast path: Greenhouse API (no browser needed) ─────────────────────
    const ghParams = (jobType === 'greenhouse' && bodyToken && bodyJobId)
      ? { boardToken: bodyToken, jobId: bodyJobId }
      : extractGreenhouseParams(jobUrl);

    if (ghParams) {
      const firstName = (candidateName || '').split(' ')[0] || 'Candidate';
      const lastName = (candidateName || '').split(' ').slice(1).join(' ') || '';
      const result = await applyViaGreenhouse(
        ghParams.boardToken, ghParams.jobId,
        firstName, lastName, candidateEmail || '', candidatePhone || '', cvData
      );
      return NextResponse.json({
        success: result.success,
        message: result.message,
        requiresManual: !result.success,
        jobUrl: result.success ? undefined : jobUrl,
        filled: result.success ? ['first_name', 'last_name', 'email', 'phone', 'resume'] : [],
        autoSubmitted: result.success,
      });
    }

    let puppeteer: any;
    try {
      puppeteer = await import('puppeteer');
    } catch {
      return NextResponse.json({
        success: false, requiresManual: true,
        message: 'Auto-apply service unavailable. Please apply directly on the employer site.',
        jobUrl,
      });
    }

    browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1280, height: 900 });

    // Navigate — try fast load first, fall back
    try {
      await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 10_000 });
    } catch {
      try {
        await page.goto(jobUrl, { waitUntil: 'load', timeout: 10_000 });
      } catch {
        return NextResponse.json({
          success: false, requiresManual: true,
          message: 'Could not load job page. Please apply directly.',
          jobUrl,
        });
      }
    }

    // Check for login walls / CAPTCHA
    const pageText: string = await page.evaluate(() =>
      (document.body?.innerText || '').toLowerCase()
    );
    const blockers = [
      'captcha', 'i am not a robot', 'sign in to apply',
      'log in to apply', 'create account to apply', 'login required',
      'register to apply',
    ];
    if (blockers.some(b => pageText.includes(b))) {
      return NextResponse.json({
        success: false, requiresManual: true,
        message: 'This employer requires login or CAPTCHA to apply. Please apply directly on their site.',
        jobUrl,
      });
    }

    // Detect if a simple application form exists
    const formDetected: boolean = await page.evaluate(() => {
      const checks = [
        'input[name*="name"]', 'input[name*="email"]', 'input[name*="Name"]',
        'input[name*="Email"]', 'input[type="file"]', 'input[name*="phone"]',
        'textarea', 'form[action*="apply"]', 'button[type="submit"]',
      ];
      return checks.some(s => !!document.querySelector(s));
    });

    if (!formDetected) {
      return NextResponse.json({
        success: false, requiresManual: true,
        message: 'No simple application form found on this page. Please apply directly.',
        jobUrl,
      });
    }

    const firstName = (candidateName || '').split(' ')[0] || '';
    const lastName = (candidateName || '').split(' ').slice(1).join(' ') || '';
    const filled: string[] = [];

    const tryFill = async (selectors: string[], value: string, label: string) => {
      for (const sel of selectors) {
        try {
          const el = await page.$(sel);
          if (el) {
            await fillField(el, value);
            filled.push(label);
            return true;
          }
        } catch {}
      }
      return false;
    };

    // First name
    const gotFirst = await tryFill(
      ['input[name="first_name"]', 'input[name="firstName"]', 'input[name*="first"]',
       '#first_name', '#firstName', 'input[placeholder*="first" i]'],
      firstName, 'first_name'
    );
    // Last name
    await tryFill(
      ['input[name="last_name"]', 'input[name="lastName"]', 'input[name*="last"]',
       '#last_name', '#lastName', 'input[placeholder*="last" i]'],
      lastName, 'last_name'
    );
    // Full name fallback
    if (!gotFirst) {
      await tryFill(
        ['input[name="name"]', 'input[name="fullName"]', 'input[name*="name"]',
         'input[placeholder*="full name" i]', 'input[placeholder*="your name" i]'],
        candidateName || '', 'name'
      );
    }

    // Email
    await tryFill(
      ['input[type="email"]', 'input[name="email"]', 'input[name*="email"]',
       'input[placeholder*="email" i]'],
      candidateEmail || '', 'email'
    );

    // Phone
    if (candidatePhone) {
      await tryFill(
        ['input[type="tel"]', 'input[name="phone"]', 'input[name*="phone"]',
         'input[placeholder*="phone" i]'],
        candidatePhone, 'phone'
      );
    }

    // Summary → textarea
    if (cvData?.summary) {
      try {
        const ta = await page.$('textarea');
        if (ta) {
          await fillField(ta, cvData.summary);
          filled.push('cover_text');
        }
      } catch {}
    }

    // File upload
    try {
      const fileInput = await page.$('input[type="file"]');
      if (fileInput && cvData) {
        const pdfBuf = buildTempPDF(cvData);
        tempFile = path.join(os.tmpdir(), `jse_cv_${Date.now()}.pdf`);
        fs.writeFileSync(tempFile, pdfBuf);
        await (fileInput as any).uploadFile(tempFile);
        filled.push('cv_file');
      }
    } catch {}

    if (filled.length === 0) {
      return NextResponse.json({
        success: false, requiresManual: true,
        message: 'Could not fill any form fields on this page. Please apply directly.',
        jobUrl,
      });
    }

    // Find submit button
    const submitBtn: any = await page.evaluateHandle(() => {
      // Prefer explicit submit
      const explicit = document.querySelector<HTMLElement>('button[type="submit"], input[type="submit"]');
      if (explicit) return explicit;
      // Fall back to text match
      const all = Array.from(document.querySelectorAll<HTMLElement>('button, a[role="button"]'));
      return all.find(el => {
        const t = (el.textContent || '').toLowerCase();
        return t.includes('apply') || t.includes('submit') || t.includes('send application');
      }) || null;
    });

    const submitElement = submitBtn.asElement ? submitBtn.asElement() : null;
    if (!submitElement) {
      return NextResponse.json({
        success: false, requiresManual: true,
        message: `Filled fields (${filled.join(', ')}) but could not find submit button. Please review and submit manually.`,
        jobUrl, filled, partialFill: true,
      });
    }

    const urlBefore = page.url();
    await submitElement.click();

    // Wait for success signal
    try {
      await page.waitForFunction(() => {
        const t = (document.body?.innerText || '').toLowerCase();
        const u = window.location.href.toLowerCase();
        return (
          t.includes('thank you') || t.includes('application submitted') ||
          t.includes('successfully submitted') || t.includes('received your application') ||
          t.includes('application received') || t.includes('we will be in touch') ||
          u.includes('success') || u.includes('confirmation') ||
          u.includes('thank') || u.includes('submitted')
        );
      }, { timeout: 8_000 });

      return NextResponse.json({
        success: true, filled,
        message: 'Application submitted automatically. No further action needed.',
      });
    } catch {
      const urlAfter = page.url();
      if (urlAfter !== urlBefore) {
        return NextResponse.json({
          success: true, filled,
          message: 'Application submitted successfully.',
        });
      }
      return NextResponse.json({
        success: false, requiresManual: true,
        message: `Form fields filled (${filled.join(', ')}) but submission could not be confirmed. Please review and submit on the employer site.`,
        jobUrl, filled, partialFill: true,
      });
    }
  };

  const timeout = new Promise<NextResponse>(resolve =>
    setTimeout(() => resolve(NextResponse.json({
      success: false, requiresManual: true,
      message: 'Auto-apply timed out. Please apply directly on the employer site.',
      jobUrl: '',
    })), TOTAL_TIMEOUT)
  );

  try {
    return await Promise.race([run(), timeout]);
  } catch (err) {
    console.error('Auto-apply-form error:', err);
    return NextResponse.json({
      success: false, requiresManual: true,
      message: 'Auto-apply encountered an error. Please apply directly on the employer site.',
      jobUrl: '',
    });
  } finally {
    if (browser) { try { await browser.close(); } catch {} }
    if (tempFile) { try { fs.unlinkSync(tempFile); } catch {} }
  }
}
