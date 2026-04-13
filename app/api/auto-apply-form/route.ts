export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

async function fillField(el: any, value: string) {
  await el.click({ clickCount: 3 });
  await el.type(value, { delay: 30 });
}

export async function POST(req: NextRequest) {
  let browser: any;
  try {
    const { jobUrl, candidateName, candidateEmail, candidatePhone } = await req.json();

    if (!jobUrl) {
      return NextResponse.json({ error: 'Job URL is required' }, { status: 400 });
    }

    let puppeteer: any;
    try {
      puppeteer = await import('puppeteer');
    } catch {
      return NextResponse.json({
        success: false,
        requiresManual: true,
        message: 'Auto-fill service is temporarily unavailable. Please apply directly on the employer site.',
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

    await page.goto(jobUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Detect CAPTCHA or login walls
    const pageText = await page.evaluate(() => document.body.innerText.toLowerCase());
    const blockers = ['captcha', 'robot', 'sign in to apply', 'log in to apply', 'create account to apply', 'login required'];
    if (blockers.some(b => pageText.includes(b))) {
      return NextResponse.json({
        success: false,
        requiresManual: true,
        message: 'This employer requires you to log in or complete a CAPTCHA to apply. Please apply directly on their site.',
        jobUrl,
      });
    }

    const firstName = candidateName?.split(' ')[0] || '';
    const lastName = candidateName?.split(' ').slice(1).join(' ') || '';
    const filled: string[] = [];

    // First name
    for (const sel of ['input[name="first_name"]', 'input[name="firstName"]', '#first_name', '#firstName', 'input[placeholder*="first" i]']) {
      const el = await page.$(sel);
      if (el) { await fillField(el, firstName); filled.push('first_name'); break; }
    }

    // Last name
    for (const sel of ['input[name="last_name"]', 'input[name="lastName"]', '#last_name', '#lastName', 'input[placeholder*="last" i]']) {
      const el = await page.$(sel);
      if (el) { await fillField(el, lastName); filled.push('last_name'); break; }
    }

    // Full name (if no separate first/last)
    if (!filled.includes('first_name')) {
      for (const sel of ['input[name="name"]', 'input[name="fullName"]', 'input[placeholder*="full name" i]', 'input[placeholder*="your name" i]']) {
        const el = await page.$(sel);
        if (el) { await fillField(el, candidateName || ''); filled.push('name'); break; }
      }
    }

    // Email
    for (const sel of ['input[type="email"]', 'input[name="email"]', 'input[name="emailAddress"]', 'input[placeholder*="email" i]']) {
      const el = await page.$(sel);
      if (el) { await fillField(el, candidateEmail || ''); filled.push('email'); break; }
    }

    // Phone
    if (candidatePhone) {
      for (const sel of ['input[type="tel"]', 'input[name="phone"]', 'input[name="phoneNumber"]', 'input[placeholder*="phone" i]']) {
        const el = await page.$(sel);
        if (el) { await fillField(el, candidatePhone); filled.push('phone'); break; }
      }
    }

    if (filled.length === 0) {
      return NextResponse.json({
        success: false,
        requiresManual: true,
        message: 'Could not find standard application form fields on this page. Please apply directly.',
        jobUrl,
      });
    }

    console.log(`[Auto-apply-form] Filled: ${filled.join(', ')} on ${jobUrl}`);
    return NextResponse.json({
      success: true,
      filled,
      message: `Form fields filled (${filled.join(', ')}). Please review and submit your application.`,
    });
  } catch (err: any) {
    console.error('[Auto-apply-form] Error:', err);
    return NextResponse.json({
      success: false,
      requiresManual: true,
      message: 'Auto-fill encountered an error. Please apply directly on the employer site.',
      jobUrl: '',
    });
  } finally {
    if (browser) {
      try { await browser.close(); } catch {}
    }
  }
}
