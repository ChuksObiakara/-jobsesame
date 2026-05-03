export const revalidate = 1800;
import { NextResponse } from 'next/server';

const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID || '73658bdc';

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

// ── Adzuna GB ─────────────────────────────────────────────────────────────────
async function fetchAdzunaGB(page: number): Promise<UKJob[]> {
  const apiKey = process.env.ADZUNA_API_KEY;
  if (!apiKey) return [];
  try {
    const url =
      `https://api.adzuna.com/v1/api/jobs/gb/search/${page}` +
      `?app_id=${ADZUNA_APP_ID}&app_key=${apiKey}` +
      `&results_per_page=50&content-type=application/json`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) {
      console.warn(`[UK Jobs] Adzuna GB page ${page} → HTTP ${res.status}`);
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
  if (!apiKey) return [];
  try {
    const params = new URLSearchParams({
      query: 'jobs in United Kingdom',
      page: '1',
      num_pages: '2',
    });
    const res = await fetch(`https://jsearch.p.rapidapi.com/search?${params}`, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
      },
      next: { revalidate: 1800 },
    });
    if (!res.ok) {
      console.warn(`[UK Jobs] JSearch → HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
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

// ── Remotive ──────────────────────────────────────────────────────────────────
async function fetchRemotive(): Promise<UKJob[]> {
  try {
    const res = await fetch('https://remotive.com/api/remote-jobs?limit=50', {
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
export async function GET() {
  try {
    const [adzunaPage1, adzunaPage2, jsearchJobs, remotiveJobs] = await Promise.all([
      fetchAdzunaGB(1),
      fetchAdzunaGB(2),
      fetchJSearchUK(),
      fetchRemotive(),
    ]);

    const all = [...adzunaPage1, ...adzunaPage2, ...jsearchJobs, ...remotiveJobs];
    const jobs = dedupe(all);

    console.log(
      `[UK Jobs] Adzuna=${adzunaPage1.length + adzunaPage2.length}` +
      ` JSearch=${jsearchJobs.length}` +
      ` Remotive=${remotiveJobs.length}` +
      ` → deduped=${jobs.length}`
    );

    return NextResponse.json({ jobs, total: jobs.length, source: 'Adzuna GB + JSearch + Remotive' });
  } catch (err) {
    console.error('[UK Jobs] Fatal error:', err);
    return NextResponse.json({ jobs: [], total: 0, error: 'Failed to fetch UK jobs' });
  }
}
