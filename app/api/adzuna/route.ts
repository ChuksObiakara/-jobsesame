export const dynamic = 'force-dynamic';
// REMINDER: Add to Vercel environment variables:
//   ADZUNA_API_KEY=<your key>
//   RAPIDAPI_KEY=1cb2b63fbcmsh4c622757de46e24p1c4669jsnfcb9df96f3a8

import { NextRequest, NextResponse } from 'next/server';

const APP_ID = '73658bdc';

function mapAdzunaJob(job: any, countryCode: string): any {
  const location =
    job.location?.display_name ||
    (job.location?.area?.join(', ') ?? '') ||
    (countryCode === 'za' ? 'South Africa' : countryCode === 'ng' ? 'Nigeria' : 'Africa');

  return {
    id: `adzuna-${job.id}`,
    title: job.title || '',
    company: job.company?.display_name || 'Company',
    location,
    description: (job.description || '').replace(/<[^>]*>/g, '').substring(0, 220) + '...',
    url: job.redirect_url || '#',
    salary: job.salary_min
      ? `${job.salary_min.toLocaleString()} – ${(job.salary_max || job.salary_min).toLocaleString()}`
      : '',
    category: job.category?.label || 'General',
    level: 'All levels',
    created: job.created || '',
    source: 'Adzuna',
    type: 'south-africa',
  };
}

function dedupe(jobs: any[]): any[] {
  const seen = new Set<string>();
  return jobs.filter(j => {
    const key = `${(j.title || '').toLowerCase().trim()}|${(j.company || '').toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchAdzuna(country: string, page: number, what?: string): Promise<any[]> {
  const apiKey = process.env.ADZUNA_API_KEY;
  if (!apiKey) {
    console.warn('[Adzuna] ADZUNA_API_KEY not set');
    return [];
  }
  const params = new URLSearchParams({
    app_id: APP_ID,
    app_key: apiKey,
    results_per_page: '50',
  });
  if (what) params.set('what', what);

  const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?${params}`;
  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) {
      console.warn(`[Adzuna] ${country} page ${page} → HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
    return (data.results || []).map((j: any) => mapAdzunaJob(j, country));
  } catch (err) {
    console.error(`[Adzuna] ${country} page ${page} error:`, err);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const what = request.nextUrl.searchParams.get('what') || undefined;
  const countryParam = request.nextUrl.searchParams.get('country') || 'all';

  try {
    let results: any[][];

    if (countryParam === 'ng') {
      results = await Promise.all([fetchAdzuna('ng', 1, what)]);
    } else if (countryParam === 'za') {
      results = await Promise.all([
        fetchAdzuna('za', 1, what),
        fetchAdzuna('za', 2, what),
        fetchAdzuna('za', 3, what),
      ]);
    } else {
      // Default: ZA pages 1-3 + NG page 1
      results = await Promise.all([
        fetchAdzuna('za', 1, what),
        fetchAdzuna('za', 2, what),
        fetchAdzuna('za', 3, what),
        fetchAdzuna('ng', 1, what),
      ]);
    }

    const allJobs = dedupe(results.flat()).slice(0, 200);
    console.log(`[Adzuna] country=${countryParam} → ${allJobs.length} jobs`);
    return NextResponse.json({ jobs: allJobs, total: allJobs.length, source: 'Adzuna' });
  } catch (err) {
    console.error('[Adzuna] Error:', err);
    return NextResponse.json({ jobs: [], total: 0, error: 'Failed to fetch Adzuna jobs' });
  }
}
