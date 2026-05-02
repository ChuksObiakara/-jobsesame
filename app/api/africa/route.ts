export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

function dedupe(jobs: any[]): any[] {
  const seen = new Set<string>();
  return jobs.filter(j => {
    const key = `${(j.title || '').toLowerCase().trim()}|${(j.company || '').toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mapAdzunaJob(job: any, country: string): any {
  const location =
    job.location?.display_name ||
    (job.location?.area?.join(', ') ?? '') ||
    (country === 'za' ? 'South Africa' : 'Nigeria');
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

async function fetchAdzuna(country: string, page: number): Promise<any[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const apiKey = process.env.ADZUNA_API_KEY;
  if (!appId || !apiKey) return [];
  const params = new URLSearchParams({
    app_id: appId,
    app_key: apiKey,
    results_per_page: '50',
  });
  try {
    const res = await fetch(
      `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?${params}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((j: any) => mapAdzunaJob(j, country));
  } catch { return []; }
}

async function fetchJSearch(query: string): Promise<any[]> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(
      `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&page=1&num_pages=3`,
      {
        headers: {
          'x-rapidapi-host': 'jsearch.p.rapidapi.com',
          'x-rapidapi-key': apiKey,
        },
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).map((job: any) => ({
      id: `jsearch-${job.job_id}`,
      title: job.job_title || '',
      company: job.employer_name || 'Company',
      location: [job.job_city, job.job_state, job.job_country].filter(Boolean).join(', '),
      description: (job.job_description || '').substring(0, 220) + '...',
      url: job.job_apply_link || job.job_google_link || '#',
      salary: job.job_min_salary
        ? `${job.job_min_salary.toLocaleString()} – ${(job.job_max_salary || job.job_min_salary).toLocaleString()}`
        : '',
      category: 'General',
      level: job.job_employment_type || 'All levels',
      created: job.job_posted_at_datetime_utc || '',
      source: 'JSearch',
      type: 'south-africa',
    }));
  } catch { return []; }
}

export async function GET(_request: NextRequest) {
  try {
    const [zaPage1, zaPage2, ngPage1, jsearchJobs] = await Promise.all([
      fetchAdzuna('za', 1),
      fetchAdzuna('za', 2),
      fetchAdzuna('ng', 1),
      fetchJSearch('jobs in South Africa'),
    ]);

    const combined = dedupe([...zaPage1, ...zaPage2, ...ngPage1, ...jsearchJobs]);

    combined.sort((a, b) => {
      if (!a.created && !b.created) return 0;
      if (!a.created) return 1;
      if (!b.created) return -1;
      return new Date(b.created).getTime() - new Date(a.created).getTime();
    });

    const jobs = combined.slice(0, 200);
    return NextResponse.json({ jobs, total: jobs.length, source: 'Multi-source' });
  } catch (err) {
    console.error('[Africa] Error:', err);
    return NextResponse.json({ jobs: [], total: 0, error: 'Failed to fetch African jobs' });
  }
}
