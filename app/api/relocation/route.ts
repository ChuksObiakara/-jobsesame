export const revalidate = 300;
import { NextRequest, NextResponse } from 'next/server';

async function fetchAdzunaUK(query: string): Promise<any[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const apiKey = process.env.ADZUNA_API_KEY;
  if (!appId || !apiKey) return [];
  try {
    const params = new URLSearchParams({
      app_id: appId,
      app_key: apiKey,
      results_per_page: '20',
      what: query || 'software engineer',
    });
    const res = await fetch(`https://api.adzuna.com/v1/api/jobs/gb/search/1?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((job: any) => ({
      id: `adzuna-gb-${job.id}`,
      title: job.title || '',
      company: job.company?.display_name || 'Company',
      location: job.location?.display_name || 'United Kingdom',
      description: (job.description || '').substring(0, 200) + '...',
      url: job.redirect_url || '#',
      salary: job.salary_min ? `£${Math.round(job.salary_min)}${job.salary_max ? `–£${Math.round(job.salary_max)}` : ''}` : '',
      category: job.category?.label || 'General',
      level: job.contract_time || 'full_time',
      type: 'relocation',
    }));
  } catch {
    return [];
  }
}

const RELOCATION_LOCATIONS = [
  'London, United Kingdom',
  'Dubai, United Arab Emirates',
  'Toronto, Ontario',
  'Singapore',
  'Berlin, Germany',
  'Amsterdam, Netherlands',
  'Sydney, New South Wales',
];

async function fetchMuseByLocation(location: string, query: string): Promise<any[]> {
  const params = new URLSearchParams({ location, page: '1' });
  const res = await fetch(
    `https://www.themuse.com/api/public/jobs?${params.toString()}`,
    { headers: { Accept: 'application/json' }, next: { revalidate: 300 } }
  );
  const data = await res.json();
  const results = data.results || [];

  // Filter by query keywords if provided (beyond default)
  const filtered = query
    ? results.filter((job: any) =>
        job.name?.toLowerCase().includes(query.toLowerCase()) ||
        job.categories?.[0]?.name?.toLowerCase().includes(query.toLowerCase())
      )
    : results;

  return filtered.map((job: any) => ({
    id: job.id,
    title: job.name,
    company: job.company?.name || 'Company',
    location: job.locations?.[0]?.name || location,
    description: (job.contents || '').replace(/<[^>]*>/g, '').substring(0, 200) + '...',
    url: job.refs?.landing_page || '#',
    salary: '',
    category: job.categories?.[0]?.name || 'General',
    level: job.levels?.[0]?.name || 'All levels',
    type: 'relocation',
  }));
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query') || '';

  try {
    const [museResults, adzunaUKJobs] = await Promise.all([
      Promise.all(RELOCATION_LOCATIONS.map(loc => fetchMuseByLocation(loc, query))),
      fetchAdzunaUK(query),
    ]);

    const combined = [...museResults.flat(), ...adzunaUKJobs];

    // Deduplicate by title + company
    const seen = new Set<string>();
    const jobs = combined.filter(job => {
      const key = `${job.title?.toLowerCase().trim()}|${job.company?.toLowerCase().trim()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({ jobs, total: jobs.length, source: 'The Muse' });
  } catch (error) {
    return NextResponse.json({ jobs: [], total: 0, error: 'Failed to fetch relocation jobs' });
  }
}
