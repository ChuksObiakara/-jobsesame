export const dynamic = 'force-dynamic';
// REMINDER: Add to Vercel environment variables:
//   ADZUNA_API_KEY=<your key>
//   RAPIDAPI_KEY=1cb2b63fbcmsh4c622757de46e24p1c4669jsnfcb9df96f3a8

import { NextRequest, NextResponse } from 'next/server';

const ADZUNA_APP_ID = '73658bdc';

// City → canonical search term for filtering
const CITY_KEYWORDS: Record<string, string[]> = {
  Johannesburg: ['johannesburg', 'joburg', 'johanesburg', 'sandton', 'soweto'],
  'Cape Town':  ['cape town', 'capetown'],
  Durban:       ['durban', 'ethekwini'],
  Pretoria:     ['pretoria', 'tshwane'],
  Lagos:        ['lagos'],
  Nairobi:      ['nairobi'],
};

function dedupe(jobs: any[]): any[] {
  const seen = new Set<string>();
  return jobs.filter(j => {
    const key = `${(j.title || '').toLowerCase().trim()}|${(j.company || '').toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function cityMatch(location: string, city: string): boolean {
  const loc = location.toLowerCase();
  return (CITY_KEYWORDS[city] || [city.toLowerCase()]).some(k => loc.includes(k));
}

// ── Adzuna ───────────────────────────────────────────────────────────────────

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

async function fetchAdzuna(country: string, page: number, what?: string): Promise<any[]> {
  const apiKey = process.env.ADZUNA_API_KEY;
  if (!apiKey) return [];
  const params = new URLSearchParams({
    app_id: ADZUNA_APP_ID,
    app_key: apiKey,
    results_per_page: '50',
  });
  if (what) params.set('what', what);
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

// ── JSearch ──────────────────────────────────────────────────────────────────

async function fetchJSearch(query: string, pages = 1): Promise<any[]> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(
      `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&page=1&num_pages=${pages}`,
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

// ── The Muse ─────────────────────────────────────────────────────────────────

async function fetchMuse(what?: string): Promise<any[]> {
  const locations = [
    'Johannesburg, South Africa',
    'Cape Town, South Africa',
    'Lagos, Nigeria',
    'Nairobi, Kenya',
  ];
  const results = await Promise.all(
    locations.map(loc => {
      const params = new URLSearchParams({ location: loc, page: '1' });
      if (what) params.set('category', what);
      return fetch(`https://www.themuse.com/api/public/jobs?${params}`, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 300 },
      })
        .then(r => r.json())
        .then(d =>
          (d.results || []).map((job: any) => ({
            id: `muse-${job.id}`,
            title: job.name || '',
            company: job.company?.name || 'Company',
            location: job.locations?.[0]?.name || loc,
            description: (job.contents || '').replace(/<[^>]*>/g, '').substring(0, 220) + '...',
            url: job.refs?.landing_page || '#',
            salary: '',
            category: job.categories?.[0]?.name || 'General',
            level: job.levels?.[0]?.name || 'All levels',
            created: job.publication_date || '',
            source: 'The Muse',
            type: 'south-africa',
          }))
        )
        .catch(() => []);
    })
  );
  return results.flat();
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const query    = request.nextUrl.searchParams.get('query') || undefined;
  const location = request.nextUrl.searchParams.get('location') || '';

  try {
    const [
      zaPage1, zaPage2, zaPage3,
      ngPage1,
      jsearchSA,
      museJobs,
    ] = await Promise.all([
      fetchAdzuna('za', 1, query),
      fetchAdzuna('za', 2, query),
      fetchAdzuna('za', 3, query),
      fetchAdzuna('ng', 1, query),
      fetchJSearch(query ? `${query} South Africa` : 'jobs in South Africa', 2),
      fetchMuse(query),
    ]);

    let combined = dedupe([
      ...zaPage1, ...zaPage2, ...zaPage3,
      ...ngPage1,
      ...jsearchSA,
      ...museJobs,
    ]);

    // Filter by city if provided
    if (location && CITY_KEYWORDS[location]) {
      combined = combined.filter(j => cityMatch(j.location, location));
    }

    // Sort newest first
    combined.sort((a, b) => {
      if (!a.created && !b.created) return 0;
      if (!a.created) return 1;
      if (!b.created) return -1;
      return new Date(b.created).getTime() - new Date(a.created).getTime();
    });

    const jobs = combined.slice(0, 270);
    console.log(`[Africa] Combined: ${jobs.length} jobs (location=${location || 'all'})`);
    return NextResponse.json({ jobs, total: jobs.length, source: 'Multi-source' });
  } catch (err) {
    console.error('[Africa] Error:', err);
    return NextResponse.json({ jobs: [], total: 0, error: 'Failed to fetch African jobs' });
  }
}
