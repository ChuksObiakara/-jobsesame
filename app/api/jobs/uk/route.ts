export const revalidate = 1800;
import { NextRequest, NextResponse } from 'next/server';

const FETCH_TIMEOUT_MS = 6000;

// ── Timeout helper ────────────────────────────────────────────────────────────
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms)
    ),
  ]);
}

// ── Normalised shape ──────────────────────────────────────────────────────────
interface UKJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  url: string;
  source: string;
  description: string;
  tags: string[];
  postedAt: string;
  applyType: 'greenhouse' | 'direct';
  applyUrl: string;
}

function applyType(url: string): 'greenhouse' | 'direct' {
  return url.toLowerCase().includes('greenhouse.io') ? 'greenhouse' : 'direct';
}

function abortIn(ms: number) {
  return AbortSignal.timeout(ms);
}

// ── Adzuna GB ─────────────────────────────────────────────────────────────────
async function fetchAdzunaGB(page: number): Promise<UKJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const apiKey = process.env.ADZUNA_API_KEY;
  if (!appId || !apiKey) {
    console.warn('[UK Jobs] Adzuna GB: ADZUNA_APP_ID or ADZUNA_API_KEY not set');
    return [];
  }
  try {
    const url =
      `https://api.adzuna.com/v1/api/jobs/gb/search/${page}` +
      `?app_id=${appId}&app_key=${apiKey}&results_per_page=50`;
    const res = await fetch(url, { signal: abortIn(FETCH_TIMEOUT_MS), next: { revalidate: 1800 } });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.warn(
        `[UK Jobs] Adzuna GB page ${page} → HTTP ${res.status}\n` +
        `  URL pattern: app_id=${appId.slice(0, 4)}*** app_key=${apiKey.slice(0, 4)}***\n` +
        `  Body: ${body.substring(0, 400)}`
      );
      return [];
    }
    const data = await res.json();
    return (data.results || []).map((job: any): UKJob => {
      const rawUrl = job.redirect_url || '#';
      const salary = job.salary_min
        ? `£${Math.round(job.salary_min).toLocaleString()}${job.salary_max ? ` – £${Math.round(job.salary_max).toLocaleString()}` : ''}`
        : '';
      return {
        id: `adzuna-gb-${job.id}`,
        title: job.title || '',
        company: job.company?.display_name || 'Company',
        location: job.location?.display_name || 'United Kingdom',
        salary,
        url: rawUrl,
        source: 'Adzuna',
        description: (job.description || '').replace(/<[^>]*>/g, '').substring(0, 220) + '...',
        tags: [job.category?.label, job.contract_time].filter(Boolean) as string[],
        postedAt: job.created || '',
        applyType: applyType(rawUrl),
        applyUrl: rawUrl,
      };
    });
  } catch (err) {
    console.error(`[UK Jobs] Adzuna GB page ${page} error:`, err);
    return [];
  }
}

// ── JSearch ───────────────────────────────────────────────────────────────────
async function fetchJSearchUK(): Promise<UKJob[]> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    console.warn('[UK Jobs] JSearch: RAPIDAPI_KEY not set');
    return [];
  }
  try {
    const params = new URLSearchParams({
      query: 'jobs in United Kingdom',
      page: '1',
      num_pages: '3',
    });
    const res = await fetch(`https://jsearch.p.rapidapi.com/search?${params}`, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
      },
      signal: abortIn(FETCH_TIMEOUT_MS),
      next: { revalidate: 1800 },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.warn(
        `[UK Jobs] JSearch → HTTP ${res.status}\n` +
        `  Body: ${body.substring(0, 400)}`
      );
      return [];
    }
    const data = await res.json();
    if (data.message) console.warn('[UK Jobs] JSearch API message:', data.message);
    if (data.errors?.length) console.warn('[UK Jobs] JSearch API errors:', JSON.stringify(data.errors));
    return (data.data || []).map((job: any): UKJob => {
      const rawUrl = job.job_apply_link || job.job_google_link || '#';
      return {
        id: `jsearch-${job.job_id}`,
        title: job.job_title || '',
        company: job.employer_name || 'Company',
        location: [job.job_city, job.job_country].filter(Boolean).join(', ') || 'United Kingdom',
        salary: job.job_min_salary
          ? `£${Math.round(job.job_min_salary).toLocaleString()}${job.job_max_salary ? ` – £${Math.round(job.job_max_salary).toLocaleString()}` : ''}`
          : '',
        url: rawUrl,
        source: 'JSearch',
        description: (job.job_description || '').substring(0, 220) + '...',
        tags: [job.job_employment_type, job.job_required_experience?.required_experience_in_months ? 'Experienced' : null].filter(Boolean) as string[],
        postedAt: job.job_posted_at_datetime_utc || '',
        applyType: applyType(rawUrl),
        applyUrl: job.job_apply_link || rawUrl,
      };
    });
  } catch (err) {
    console.error('[UK Jobs] JSearch error:', err);
    return [];
  }
}

// ── Reed.co.uk ────────────────────────────────────────────────────────────────
async function fetchReed(keywords: string, location: string, skip = 0): Promise<UKJob[]> {
  const apiKey = process.env.REED_API_KEY;
  if (!apiKey) {
    if (skip === 0) console.warn('[UK Jobs] Reed: REED_API_KEY not set');
    return [];
  }
  try {
    const params = new URLSearchParams({
      keywords,
      locationName: location,
      distancefromlocation: '50',
      resultsToTake: '100',
      resultsToSkip: String(skip),
    });
    const credentials = Buffer.from(`${apiKey}:`).toString('base64');
    const res = await fetch(`https://www.reed.co.uk/api/1.0/search?${params}`, {
      headers: { Authorization: `Basic ${credentials}` },
      signal: abortIn(FETCH_TIMEOUT_MS),
      next: { revalidate: 1800 },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.warn(`[UK Jobs] Reed (${keywords}/${location} skip=${skip}) → HTTP ${res.status}: ${body.substring(0, 200)}`);
      return [];
    }
    const data = await res.json();
    return (data.results || []).map((job: any): UKJob => {
      const rawUrl = job.jobUrl || `https://www.reed.co.uk/jobs/${job.jobId}`;
      const salary = job.minimumSalary
        ? `£${Math.round(job.minimumSalary).toLocaleString()}${job.maximumSalary ? ` – £${Math.round(job.maximumSalary).toLocaleString()}` : ''}`
        : job.salary || '';
      return {
        id: `reed-${job.jobId}`,
        title: job.jobTitle || '',
        company: job.employerName || 'Company',
        location: job.locationName || 'United Kingdom',
        salary,
        url: rawUrl,
        source: 'Reed',
        description: (job.jobDescription || job.snippet || '').replace(/<[^>]*>/g, '').substring(0, 220) + '...',
        tags: [job.contractType, job.partTime ? 'Part-time' : job.fullTime ? 'Full-time' : null].filter(Boolean) as string[],
        postedAt: job.date || '',
        applyType: applyType(rawUrl),
        applyUrl: job.jobUrl || rawUrl,
      };
    });
  } catch (err) {
    console.error(`[UK Jobs] Reed (${keywords}/${location} skip=${skip}) error:`, err);
    return [];
  }
}

// ── Arbeitnow ─────────────────────────────────────────────────────────────────
async function fetchArbeitnow(page = 1): Promise<UKJob[]> {
  try {
    const res = await fetch(`https://www.arbeitnow.com/api/job-board-api?page=${page}`, {
      signal: abortIn(FETCH_TIMEOUT_MS),
      next: { revalidate: 1800 },
    });
    if (!res.ok) {
      console.warn(`[UK Jobs] Arbeitnow page ${page} → HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
    return (data.data || [])
      .filter((job: any) => {
        const loc = (job.location || '').toLowerCase();
        const tags = ((job.tags || []) as string[]).join(' ').toLowerCase();
        return (
          job.remote === true ||
          loc.includes('uk') ||
          loc.includes('united kingdom') ||
          loc.includes('london') ||
          loc.includes('remote') ||
          tags.includes('uk') ||
          tags.includes('remote')
        );
      })
      .map((job: any): UKJob => {
        const rawUrl = job.url || '#';
        return {
          id: `arbeitnow-${job.slug}`,
          title: job.title || '',
          company: job.company_name || 'Company',
          location: job.location || (job.remote ? 'Remote' : 'United Kingdom'),
          salary: '',
          url: rawUrl,
          source: 'Arbeitnow',
          description: (job.description || '').replace(/<[^>]*>/g, '').substring(0, 220) + '...',
          tags: [...(job.tags || []).slice(0, 2), job.remote ? 'Remote' : null].filter(Boolean) as string[],
          postedAt: job.created_at ? new Date(job.created_at * 1000).toISOString() : '',
          applyType: applyType(rawUrl),
          applyUrl: rawUrl,
        };
      });
  } catch (err) {
    console.error(`[UK Jobs] Arbeitnow page ${page} error:`, err);
    return [];
  }
}

// ── Remotive ──────────────────────────────────────────────────────────────────
async function fetchRemotive(): Promise<UKJob[]> {
  try {
    const res = await fetch('https://remotive.com/api/remote-jobs?limit=50', {
      signal: abortIn(FETCH_TIMEOUT_MS),
      next: { revalidate: 1800 },
    });
    if (!res.ok) {
      console.warn(`[UK Jobs] Remotive → HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
    return (data.jobs || []).map((job: any): UKJob => {
      const rawUrl = job.url || '#';
      return {
        id: `remotive-${job.id}`,
        title: job.title || '',
        company: job.company_name || 'Company',
        location: job.candidate_required_location || 'Remote / UK',
        salary: job.salary || '',
        url: rawUrl,
        source: 'Remotive',
        description: (job.description || '').replace(/<[^>]*>/g, '').substring(0, 220) + '...',
        tags: [job.job_type, job.category].filter(Boolean) as string[],
        postedAt: job.publication_date || '',
        applyType: applyType(rawUrl),
        applyUrl: rawUrl,
      };
    });
  } catch (err) {
    console.error('[UK Jobs] Remotive error:', err);
    return [];
  }
}

// ── Jooble ────────────────────────────────────────────────────────────────────
async function fetchJooble(page = 1): Promise<UKJob[]> {
  const apiKey = process.env.JOOBLE_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(`https://jooble.org/api/${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords: '', location: 'United Kingdom', page }),
      signal: abortIn(FETCH_TIMEOUT_MS),
      next: { revalidate: 1800 },
    });
    if (!res.ok) {
      console.warn(`[UK Jobs] Jooble page ${page} → HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
    return (data.jobs || []).map((job: any): UKJob => {
      const rawUrl = job.link || '#';
      return {
        id: `jooble-${Buffer.from(rawUrl).toString('base64').substring(0, 16)}`,
        title: job.title || '',
        company: job.company || 'Company',
        location: job.location || 'United Kingdom',
        salary: job.salary || '',
        url: rawUrl,
        source: 'Jooble',
        description: (job.snippet || '').replace(/<[^>]*>/g, '').substring(0, 220) + '...',
        tags: [job.type].filter(Boolean) as string[],
        postedAt: job.updated || '',
        applyType: applyType(rawUrl),
        applyUrl: rawUrl,
      };
    });
  } catch (err) {
    console.error(`[UK Jobs] Jooble page ${page} error:`, err);
    return [];
  }
}

// ── The Muse ──────────────────────────────────────────────────────────────────
async function fetchTheMuse(page = 0): Promise<UKJob[]> {
  try {
    const params = new URLSearchParams({
      location: 'London, England, United Kingdom',
      page: String(page),
      descending: 'true',
    });
    const res = await fetch(`https://www.themuse.com/api/public/jobs?${params}`, {
      signal: abortIn(FETCH_TIMEOUT_MS),
      next: { revalidate: 1800 },
    });
    if (!res.ok) {
      console.warn(`[UK Jobs] The Muse page ${page} → HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
    return (data.results || []).map((job: any): UKJob => {
      const rawUrl = job.refs?.landing_page || '#';
      const location = (job.locations || []).map((l: any) => l.name).join(', ') || 'United Kingdom';
      const level = (job.levels || []).map((l: any) => l.name).join(', ');
      const category = (job.categories || []).map((c: any) => c.name)[0] || '';
      return {
        id: `muse-${job.id}`,
        title: job.name || '',
        company: job.company?.name || 'Company',
        location,
        salary: '',
        url: rawUrl,
        source: 'The Muse',
        description: (job.contents || '').replace(/<[^>]*>/g, '').substring(0, 220) + '...',
        tags: [level, category].filter(Boolean) as string[],
        postedAt: job.publication_date || '',
        applyType: applyType(rawUrl),
        applyUrl: rawUrl,
      };
    });
  } catch (err) {
    console.error(`[UK Jobs] The Muse page ${page} error:`, err);
    return [];
  }
}

// ── Careerjet ─────────────────────────────────────────────────────────────────
async function fetchCareerjet(page = 1, ip = '0.0.0.0'): Promise<UKJob[]> {
  const affid = process.env.CAREERJET_AFFILIATE_ID;
  if (!affid) return [];
  try {
    const params = new URLSearchParams({
      affid,
      keywords: '',
      location: 'United Kingdom',
      locale_code: 'en_GB',
      user_ip: ip,
      user_agent: 'Jobsesame/1.0',
      url: 'https://www.jobsesame.co.za/uk/jobs',
      sort: 'date',
      pagesize: '99',
      page: String(page),
    });
    const res = await fetch(`https://public.api.careerjet.net/search?${params}`, {
      signal: abortIn(FETCH_TIMEOUT_MS),
      next: { revalidate: 1800 },
    });
    if (!res.ok) {
      console.warn(`[UK Jobs] Careerjet page ${page} → HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
    if (data.type === 'ERROR') {
      console.warn('[UK Jobs] Careerjet error:', data.error);
      return [];
    }
    return (data.jobs || []).map((job: any): UKJob => {
      const rawUrl = job.url || '#';
      return {
        id: `careerjet-${Buffer.from(rawUrl).toString('base64').substring(0, 16)}`,
        title: job.title || '',
        company: job.company || 'Company',
        location: job.locations || 'United Kingdom',
        salary: job.salary || '',
        url: rawUrl,
        source: 'Careerjet',
        description: (job.description || '').replace(/<[^>]*>/g, '').substring(0, 220) + '...',
        tags: [],
        postedAt: job.date || '',
        applyType: applyType(rawUrl),
        applyUrl: rawUrl,
      };
    });
  } catch (err) {
    console.error(`[UK Jobs] Careerjet page ${page} error:`, err);
    return [];
  }
}

// ── Deduplicate by title + company ────────────────────────────────────────────
function dedupe(jobs: UKJob[]): UKJob[] {
  const seen = new Set<string>();
  return jobs.filter(j => {
    const key = `${j.title.toLowerCase().trim()}|${j.company.toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || req.headers.get('x-real-ip')
    || '0.0.0.0';

  const safe = <T>(p: Promise<T>, label: string): Promise<T> =>
    withTimeout(p, FETCH_TIMEOUT_MS).catch(err => {
      console.warn(`[UK Jobs] ${label} failed:`, err instanceof Error ? err.message : err);
      return [] as unknown as T;
    });

  try {
    const [
      adzunaPage1, adzunaPage2, adzunaPage3, adzunaPage4, adzunaPage5,
      jsearchJobs,
      reedLondon, reedManchester, reedBirmingham, reedRemote,
      arbeitnowPage1, arbeitnowPage2,
      remotiveJobs,
      jooble1, jooble2, jooble3,
      muse1, muse2,
      careerjet1, careerjet2,
    ] = await Promise.all([
      safe(fetchAdzunaGB(1), 'Adzuna p1'),
      safe(fetchAdzunaGB(2), 'Adzuna p2'),
      safe(fetchAdzunaGB(3), 'Adzuna p3'),
      safe(fetchAdzunaGB(4), 'Adzuna p4'),
      safe(fetchAdzunaGB(5), 'Adzuna p5'),
      safe(fetchJSearchUK(),  'JSearch'),
      safe(fetchReed('', 'London', 0),       'Reed London'),
      safe(fetchReed('', 'Manchester', 0),   'Reed Manchester'),
      safe(fetchReed('', 'Birmingham', 0),   'Reed Birmingham'),
      safe(fetchReed('remote', 'United Kingdom', 0), 'Reed Remote'),
      safe(fetchArbeitnow(1), 'Arbeitnow p1'),
      safe(fetchArbeitnow(2), 'Arbeitnow p2'),
      safe(fetchRemotive(),   'Remotive'),
      safe(fetchJooble(1),    'Jooble p1'),
      safe(fetchJooble(2),    'Jooble p2'),
      safe(fetchJooble(3),    'Jooble p3'),
      safe(fetchTheMuse(0),   'Muse p1'),
      safe(fetchTheMuse(1),   'Muse p2'),
      safe(fetchCareerjet(1, ip), 'Careerjet p1'),
      safe(fetchCareerjet(2, ip), 'Careerjet p2'),
    ]);

    const adzunaGB  = adzunaPage1.length + adzunaPage2.length + adzunaPage3.length + adzunaPage4.length + adzunaPage5.length;
    const reed      = reedLondon.length + reedManchester.length + reedBirmingham.length + reedRemote.length;
    const arbeitnow = arbeitnowPage1.length + arbeitnowPage2.length;
    const jooble    = jooble1.length + jooble2.length + jooble3.length;
    const muse      = muse1.length + muse2.length;
    const careerjet = careerjet1.length + careerjet2.length;

    const all = [
      ...adzunaPage1, ...adzunaPage2, ...adzunaPage3, ...adzunaPage4, ...adzunaPage5,
      ...jsearchJobs,
      ...reedLondon, ...reedManchester, ...reedBirmingham, ...reedRemote,
      ...arbeitnowPage1, ...arbeitnowPage2,
      ...remotiveJobs,
      ...jooble1, ...jooble2, ...jooble3,
      ...muse1, ...muse2,
      ...careerjet1, ...careerjet2,
    ];
    const jobs = dedupe(all);

    console.log('[UK Jobs] Sources:', {
      adzunaGB,
      jsearch: jsearchJobs.length,
      reed,
      remotive: remotiveJobs.length,
      arbeitnow,
      jooble,
      muse,
      careerjet,
      raw: all.length,
      deduped: jobs.length,
    });

    return NextResponse.json({
      jobs,
      total: jobs.length,
      source: 'Adzuna + JSearch + Reed + Arbeitnow + Remotive + Jooble + The Muse + Careerjet',
    });
  } catch (err) {
    console.error('[UK Jobs] Fatal error:', err);
    return NextResponse.json({ jobs: [], total: 0, error: 'Failed to fetch UK jobs' });
  }
}
