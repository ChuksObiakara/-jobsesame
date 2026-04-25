export const dynamic = 'force-dynamic';
// REMINDER: Add to Vercel environment variables:
//   RAPIDAPI_KEY=1cb2b63fbcmsh4c622757de46e24p1c4669jsnfcb9df96f3a8

import { NextRequest, NextResponse } from 'next/server';

function mapJob(job: any): any {
  const city    = job.job_city || '';
  const state   = job.job_state || '';
  const country = job.job_country || '';
  const location = [city, state, country].filter(Boolean).join(', ') || 'Worldwide';
  const salaryMin = job.job_min_salary;
  const salaryMax = job.job_max_salary;
  const currency  = job.job_salary_currency || '$';
  const salary    = salaryMin
    ? `${currency}${Math.round(salaryMin)}${salaryMax ? `–${Math.round(salaryMax)}` : ''}`
    : '';
  return {
    id: `jsearch-${job.job_id}`,
    title: job.job_title || '',
    company: job.employer_name || 'Company',
    location,
    description: (job.job_description || '').substring(0, 220) + '...',
    url: job.job_apply_link || job.job_google_link || '#',
    salary,
    category: job.job_required_experience?.required_experience_in_months ? 'Experienced' : 'General',
    level: job.job_employment_type || 'FULLTIME',
    created: job.job_posted_at_datetime_utc || '',
    source: 'JSearch',
    type: 'jsearch',
  };
}

async function fetchPage(query: string, page: string, apiKey: string): Promise<any[]> {
  try {
    const params = new URLSearchParams({ query, page, num_pages: '1' });
    const res = await fetch(`https://jsearch.p.rapidapi.com/search?${params}`, {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'jsearch.p.rapidapi.com',
      },
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      console.warn(`[JSearch] HTTP ${res.status}: ${res.statusText} — check subscription`);
      return [];
    }
    const data = await res.json();
    if (data.message) console.warn('[JSearch] API message:', data.message);
    return (data.data || []).map(mapJob);
  } catch {
    return [];
  }
}

function dedupe(jobs: any[]): any[] {
  const seen = new Set<string>();
  return jobs.filter(j => {
    if (seen.has(j.id)) return false;
    seen.add(j.id);
    return true;
  });
}

export async function GET(request: NextRequest) {
  const rawQuery = request.nextUrl.searchParams.get('query') || 'software engineer';
  const page     = request.nextUrl.searchParams.get('page') || '1';
  const country  = (request.nextUrl.searchParams.get('country') || '').toLowerCase();
  const apiKey   = process.env.RAPIDAPI_KEY;

  if (!apiKey) {
    return NextResponse.json({ jobs: [], total: 0, error: 'RAPIDAPI_KEY not configured' });
  }

  const isSA = country === 'za' || country === 'south africa';

  try {
    let jobs: any[];

    if (isSA) {
      // Fetch multiple SA city queries in parallel for maximum coverage
      const [saJobs, joburgJobs, capeJobs, durbanJobs] = await Promise.all([
        fetchPage(rawQuery ? `${rawQuery} South Africa` : 'jobs in South Africa', '1', apiKey),
        fetchPage(rawQuery ? `${rawQuery} Johannesburg`  : 'jobs in Johannesburg',  '1', apiKey),
        fetchPage(rawQuery ? `${rawQuery} Cape Town`     : 'jobs in Cape Town',     '1', apiKey),
        fetchPage('jobs in Durban South Africa', '1', apiKey),
      ]);
      // Also fetch pages 2 and 3 for SA
      const [sa2, sa3] = await Promise.all([
        fetchPage(rawQuery ? `${rawQuery} South Africa` : 'jobs in South Africa', '2', apiKey),
        fetchPage(rawQuery ? `${rawQuery} South Africa` : 'jobs in South Africa', '3', apiKey),
      ]);
      jobs = dedupe([...saJobs, ...joburgJobs, ...capeJobs, ...durbanJobs, ...sa2, ...sa3]).slice(0, 150);
    } else {
      const searchQuery = country ? `${rawQuery} ${country}` : rawQuery;
      jobs = await fetchPage(searchQuery, page, apiKey);
    }

    console.log(`[JSearch] country=${country || 'all'} → ${jobs.length} jobs`);
    return NextResponse.json({ jobs, total: jobs.length, source: 'JSearch' });
  } catch (err) {
    console.error('[JSearch] Error:', err);
    return NextResponse.json({ jobs: [], total: 0, error: 'Failed to fetch jobs' });
  }
}
