export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

const CAREERJET_API_KEY = process.env.CAREERJET_API_KEY || '';

// ── Careerjet v4 ────────────────────────────────────────────────────────────

async function fetchCareerjet(query: string, location: string): Promise<any[]> {
  const auth = Buffer.from(`${CAREERJET_API_KEY}:`).toString('base64');
  const params = new URLSearchParams({
    keywords: query,
    location,
    pagesize: '20',
    affid: 'jobsesame',
  });

  const res = await fetch(
    `https://search.api.careerjet.net/v4/query?${params.toString()}`,
    { headers: { Authorization: `Basic ${auth}` } }
  );

  const data = await res.json();
  console.log(`[Careerjet] ${location}: type=${data.type} total=${data.total_results} jobs=${data.jobs?.length ?? 0}${data.error ? ' error=' + data.error : ''}`);

  if (data.type === 'ERROR' || !data.jobs?.length) return [];

  return data.jobs.map((job: any) => ({
    id: job.id || `cj-${location}-${Math.random()}`,
    title: job.title || '',
    company: job.company || 'Company',
    location: job.locations || location,
    description: (job.description || '').replace(/<[^>]*>/g, '').substring(0, 220) + '...',
    url: job.url || '',
    salary: job.salary || '',
    category: 'Africa',
    level: 'All levels',
    type: 'south-africa',
  }));
}

// ── Remotive fallback (remote jobs — open to African applicants) ─────────────

async function fetchRemotiveFallback(): Promise<any[]> {
  const searches = ['developer', 'engineer', 'manager', 'analyst', 'designer'];
  const results = await Promise.all(
    searches.map(q =>
      fetch(`https://remotive.com/api/remote-jobs?search=${q}&limit=20`)
        .then(r => r.json())
        .then(d => d.jobs || [])
        .catch(() => [])
    )
  );
  const jobs = results.flat().map((job: any) => ({
    id: `remotive-${job.id}`,
    title: job.title || '',
    company: job.company_name || 'Company',
    location: 'Remote — Open worldwide',
    description: (job.description || '').replace(/<[^>]*>/g, '').substring(0, 220) + '...',
    url: job.url || '',
    salary: job.salary || '',
    category: job.category || 'General',
    level: 'All levels',
    type: 'south-africa',
  }));
  console.log(`[Africa fallback] Remotive: ${jobs.length} remote jobs`);
  return jobs;
}

// ── Jobicy fallback (global remote) ─────────────────────────────────────────

async function fetchJobicyFallback(): Promise<any[]> {
  const res = await fetch('https://jobicy.com/api/v2/remote-jobs?count=30')
    .then(r => r.json())
    .catch(() => ({ jobs: [] }));
  const jobs = (res.jobs || []).map((job: any) => ({
    id: `jobicy-${job.id}`,
    title: job.jobTitle || '',
    company: job.companyName || 'Company',
    location: job.jobGeo ? `${job.jobGeo} (Remote)` : 'Remote — Worldwide',
    description: (job.jobExcerpt || '').replace(/<[^>]*>/g, '').substring(0, 220) + '...',
    url: job.url || '',
    salary: '',
    category: 'General',
    level: job.jobLevel || 'All levels',
    type: 'south-africa',
  }));
  console.log(`[Africa fallback] Jobicy: ${jobs.length} remote jobs`);
  return jobs;
}

// ── Deduplicate by title + company ───────────────────────────────────────────

function dedupe(jobs: any[]): any[] {
  const seen = new Set<string>();
  return jobs.filter(job => {
    const key = `${job.title.toLowerCase().trim()}|${job.company.toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query') || 'software engineer';

  // ── 1. Try Careerjet v4 (primary) ─────────────────────────────────────────
  try {
    const [saJobs, ngJobs, keJobs] = await Promise.all([
      fetchCareerjet(query, 'South Africa'),
      fetchCareerjet(query, 'Nigeria'),
      fetchCareerjet(query, 'Kenya'),
    ]);

    const careerjetJobs = dedupe([...saJobs, ...ngJobs, ...keJobs]);
    console.log(`[Africa jobs] Careerjet total unique: ${careerjetJobs.length}`);

    if (careerjetJobs.length > 0) {
      return NextResponse.json({ jobs: careerjetJobs, total: careerjetJobs.length, source: 'Careerjet' });
    }

    console.log('[Africa jobs] Careerjet returned 0 results — falling back to The Muse');
  } catch (err) {
    console.error('[Africa jobs] Careerjet error — falling back to The Muse:', err);
  }

  // ── 2. Fallback: Remotive + Jobicy remote jobs (open to African applicants) ─
  try {
    const [remotiveJobs, jobicyJobs] = await Promise.all([
      fetchRemotiveFallback(),
      fetchJobicyFallback(),
    ]);

    const fallbackJobs = dedupe([...remotiveJobs, ...jobicyJobs]);
    console.log(`[Africa jobs] Fallback total unique: ${fallbackJobs.length}`);

    return NextResponse.json({ jobs: fallbackJobs, total: fallbackJobs.length, source: 'Remote (Worldwide)' });
  } catch (err) {
    console.error('[Africa jobs] Fallback error:', err);
    return NextResponse.json({ jobs: [], total: 0, error: 'Failed to fetch Africa jobs' });
  }
}
