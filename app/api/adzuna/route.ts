export const dynamic = 'force-dynamic';
// REMINDER: Add to Vercel environment variables:
//   ADZUNA_APP_ID=73658bdc  (or set as env var)
//   ADZUNA_API_KEY=<your key>
//   RAPIDAPI_KEY=1cb2b63fbcmsh4c622757de46e24p1c4669jsnfcb9df96f3a8

import { NextRequest, NextResponse } from 'next/server';

const HARDCODED_APP_ID = '73658bdc';

function mapJob(job: any, country: string): any {
  const location =
    job.location?.display_name ||
    (job.location?.area?.join(', ') ?? '') ||
    country.toUpperCase();
  const salaryMin = job.salary_min;
  const salaryMax = job.salary_max;
  const salary = salaryMin
    ? `${salaryMin.toLocaleString()} – ${(salaryMax || salaryMin).toLocaleString()}`
    : '';
  return {
    id: `adzuna-${job.id}`,
    title: job.title || '',
    company: job.company?.display_name || 'Company',
    location,
    description: (job.description || '').replace(/<[^>]*>/g, '').substring(0, 220) + '...',
    url: job.redirect_url || '#',
    salary,
    category: job.category?.label || 'General',
    level: job.contract_time || 'All levels',
    created: job.created || '',
    source: 'Adzuna',
    type: 'adzuna',
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

async function fetchPage(country: string, page: number, query: string, appId: string, apiKey: string): Promise<any[]> {
  try {
    const params = new URLSearchParams({
      app_id: appId,
      app_key: apiKey,
      results_per_page: '50',
      what: query,
    });
    const res = await fetch(
      `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?${params}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) {
      console.warn(`[Adzuna] ${country} page ${page} → HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
    return (data.results || []).map((j: any) => mapJob(j, country));
  } catch (err) {
    console.error(`[Adzuna] ${country} page ${page} error:`, err);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const query   = request.nextUrl.searchParams.get('query') || request.nextUrl.searchParams.get('what') || 'software engineer';
  const country = (request.nextUrl.searchParams.get('country') || 'all').toLowerCase();

  const appId  = process.env.ADZUNA_APP_ID || HARDCODED_APP_ID;
  const apiKey = process.env.ADZUNA_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ jobs: [], total: 0, error: 'ADZUNA_API_KEY not configured' });
  }

  try {
    let fetches: Promise<any[]>[];

    if (country === 'ng') {
      fetches = [fetchPage('ng', 1, query, appId, apiKey)];
    } else if (country === 'za') {
      // ZA pages 1-3 for 150 jobs
      fetches = [
        fetchPage('za', 1, query, appId, apiKey),
        fetchPage('za', 2, query, appId, apiKey),
        fetchPage('za', 3, query, appId, apiKey),
      ];
    } else if (country === 'all') {
      // Default: ZA pages 1-3 + NG page 1 = up to 200 jobs
      fetches = [
        fetchPage('za', 1, query, appId, apiKey),
        fetchPage('za', 2, query, appId, apiKey),
        fetchPage('za', 3, query, appId, apiKey),
        fetchPage('ng', 1, query, appId, apiKey),
      ];
    } else {
      // Generic country: fetch pages 1 and 2
      fetches = [
        fetchPage(country, 1, query, appId, apiKey),
        fetchPage(country, 2, query, appId, apiKey),
      ];
    }

    const results = await Promise.all(fetches);
    const jobs = dedupe(results.flat()).slice(0, 200);
    console.log(`[Adzuna] country=${country} → ${jobs.length} jobs`);
    return NextResponse.json({ jobs, total: jobs.length, source: 'Adzuna' });
  } catch (err) {
    console.error('[Adzuna] Error:', err);
    return NextResponse.json({ jobs: [], total: 0, error: 'Failed to fetch Adzuna jobs' });
  }
}
