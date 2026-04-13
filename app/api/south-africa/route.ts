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

// ── The Muse fallback ────────────────────────────────────────────────────────

async function fetchMuseAfrica(location: string): Promise<any[]> {
  const params = new URLSearchParams({ location, page: '1' });
  const res = await fetch(
    `https://www.themuse.com/api/public/jobs?${params.toString()}`,
    { headers: { Accept: 'application/json' } }
  );

  if (!res.ok) return [];

  const data = await res.json();
  const results: any[] = data.results || [];
  console.log(`[Muse fallback] ${location}: ${results.length} results`);

  return results.map((job: any) => ({
    id: job.id,
    title: job.name,
    company: job.company?.name || 'Company',
    location: job.locations?.[0]?.name || location,
    description: (job.contents || '').replace(/<[^>]*>/g, '').substring(0, 220) + '...',
    url: job.refs?.landing_page || '#',
    salary: '',
    category: job.categories?.[0]?.name || 'General',
    level: job.levels?.[0]?.name || 'All levels',
    type: 'south-africa',
  }));
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

  // ── 2. Fallback: The Muse with African location filters ───────────────────
  try {
    const [saJobs, ngJobs, keJobs] = await Promise.all([
      fetchMuseAfrica('South Africa'),
      fetchMuseAfrica('Nigeria'),
      fetchMuseAfrica('Kenya'),
    ]);

    const museJobs = dedupe([...saJobs, ...ngJobs, ...keJobs]);
    console.log(`[Africa jobs] Muse fallback total unique: ${museJobs.length}`);

    return NextResponse.json({ jobs: museJobs, total: museJobs.length, source: 'The Muse' });
  } catch (err) {
    console.error('[Africa jobs] Muse fallback error:', err);
    return NextResponse.json({ jobs: [], total: 0, error: 'Failed to fetch Africa jobs' });
  }
}
