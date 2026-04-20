export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

function mapJob(job: any, country: string): any {
  const salaryMin = job.salary_min;
  const salaryMax = job.salary_max;
  const salary = salaryMin
    ? `${Math.round(salaryMin)}${salaryMax ? `–${Math.round(salaryMax)}` : ''}`
    : '';
  return {
    id: `adzuna-${job.id}`,
    title: job.title || '',
    company: job.company?.display_name || 'Company',
    location: job.location?.display_name || country.toUpperCase(),
    description: (job.description || '').substring(0, 200) + '...',
    url: job.redirect_url || '#',
    salary,
    category: job.category?.label || 'General',
    level: job.contract_time || 'full_time',
    type: 'adzuna',
  };
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query') || 'software engineer';
  const country = (request.nextUrl.searchParams.get('country') || 'gb').toLowerCase();

  const appId = process.env.ADZUNA_APP_ID;
  const apiKey = process.env.ADZUNA_API_KEY;

  if (!appId || !apiKey) {
    return NextResponse.json({ jobs: [], total: 0, error: 'Adzuna keys not configured' });
  }

  try {
    const makeParams = (page: number) => new URLSearchParams({
      app_id: appId,
      app_key: apiKey,
      results_per_page: '50',
      what: query,
    }).toString();

    // Fetch page 1 and page 2 simultaneously for better coverage
    const [res1, res2] = await Promise.all([
      fetch(`https://api.adzuna.com/v1/api/jobs/${country}/search/1?${makeParams(1)}`),
      fetch(`https://api.adzuna.com/v1/api/jobs/${country}/search/2?${makeParams(2)}`),
    ]);

    const data1 = res1.ok ? await res1.json() : { results: [] };
    const data2 = res2.ok ? await res2.json() : { results: [] };

    const seen = new Set<string>();
    const jobs = [...(data1.results || []), ...(data2.results || [])]
      .filter(job => {
        if (seen.has(job.id)) return false;
        seen.add(job.id);
        return true;
      })
      .map((job: any) => mapJob(job, country));

    return NextResponse.json({ jobs, total: jobs.length, source: 'Adzuna' });
  } catch (error) {
    return NextResponse.json({ jobs: [], total: 0, error: 'Failed to fetch Adzuna jobs' });
  }
}
