export const revalidate = 300;
import { NextRequest, NextResponse } from 'next/server';

async function fetchJSearch(query: string, page: string): Promise<any[]> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return [];
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
      console.warn(`JSearch error ${res.status}: ${res.statusText} — subscription may be inactive`);
      return [];
    }
    const data = await res.json();
    if (data.message) console.warn('JSearch API message:', data.message);
    return (data.data || []).map((job: any) => ({
      id: `jsearch-${job.job_id}`,
      title: job.job_title || '',
      company: job.employer_name || 'Company',
      location: [job.job_city, job.job_country].filter(Boolean).join(', ') || 'Worldwide',
      description: (job.job_description || '').substring(0, 200) + '...',
      url: job.job_apply_link || job.job_google_link || '#',
      created: '',
      salary: '',
      category: 'General',
      level: job.job_employment_type || 'FULLTIME',
    }));
  } catch {
    return [];
  }
}

async function fetchAdzuna(query: string, country: string): Promise<any[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const apiKey = process.env.ADZUNA_API_KEY;
  if (!appId || !apiKey) return [];
  try {
    const params = new URLSearchParams({
      app_id: appId, app_key: apiKey,
      results_per_page: '20', what: query,
    });
    const res = await fetch(
      `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((job: any) => ({
      id: `adzuna-${country}-${job.id}`,
      title: job.title || '',
      company: job.company?.display_name || 'Company',
      location: job.location?.display_name || country.toUpperCase(),
      description: (job.description || '').substring(0, 200) + '...',
      url: job.redirect_url || '#',
      created: '',
      salary: job.salary_min ? `${Math.round(job.salary_min)}${job.salary_max ? `–${Math.round(job.salary_max)}` : ''}` : '',
      category: job.category?.label || 'General',
      level: job.contract_time || 'full_time',
    }));
  } catch {
    return [];
  }
}

// Maps homepage dropdown values to Muse city/region strings.
// Multiple entries per country are fetched in parallel then merged.
const LOCATION_MAP: Record<string, string[]> = {
  'Australia':      ['Sydney, Australia', 'Melbourne, Australia', 'Brisbane, Australia'],
  'United Kingdom': ['London, United Kingdom', 'Manchester, United Kingdom', 'Edinburgh, United Kingdom'],
  'United States':  ['New York City, New York', 'San Francisco, CA', 'Austin, TX', 'Seattle, WA', 'Chicago, Illinois'],
  'Canada':         ['Toronto, Ontario', 'Vancouver, British Columbia', 'Montreal, Quebec'],
  'India':          ['Mumbai, India', 'Bengaluru, India', 'Hyderabad, India', 'Pune, India'],
  'Singapore':      ['Singapore'],
  'Dubai':          ['Dubai, United Arab Emirates'],
  'South Africa':   ['Johannesburg, South Africa', 'Cape Town, South Africa'],
  'Nigeria':        ['Lagos, Nigeria', 'Abuja, Nigeria'],
  'Kenya':          ['Nairobi, Kenya'],
};

async function fetchMusePage(location: string, page: number): Promise<any[]> {
  const params = new URLSearchParams({ location, page: String(page) });
  const res = await fetch(`https://www.themuse.com/api/public/jobs?${params}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 300 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
}

function mapJob(job: any): any {
  return {
    id: job.id,
    title: job.name,
    company: job.company?.name || 'Company',
    location: job.locations?.[0]?.name || 'Worldwide',
    description: (job.contents || '').replace(/<[^>]*>/g, '').substring(0, 200) + '...',
    url: job.refs?.landing_page || '#',
    created: job.publication_date,
    category: job.categories?.[0]?.name || 'General',
    level: job.levels?.[0]?.name || 'All levels',
    salary: '',
  };
}

function isOnTarget(jobLocation: string, targetCities: string[]): boolean {
  const loc = jobLocation.toLowerCase();
  return targetCities.some(city => loc.includes(city.toLowerCase().split(',')[0]));
}

const GH_BOARDS = [
  { token: 'anthropic',   name: 'Anthropic' },
  { token: 'airbnb',      name: 'Airbnb' },
  { token: 'stripe',      name: 'Stripe' },
  { token: 'figma',       name: 'Figma' },
  { token: 'vercel',      name: 'Vercel' },
  { token: 'mongodb',     name: 'MongoDB' },
  { token: 'twilio',      name: 'Twilio' },
  { token: 'coinbase',    name: 'Coinbase' },
  { token: 'databricks',  name: 'Databricks' },
  { token: 'gitlab',      name: 'GitLab' },
  { token: 'datadog',     name: 'Datadog' },
  { token: 'cloudflare',  name: 'Cloudflare' },
  { token: 'okta',        name: 'Okta' },
  { token: 'asana',       name: 'Asana' },
  { token: 'dropbox',     name: 'Dropbox' },
  { token: 'robinhood',   name: 'Robinhood' },
  { token: 'squarespace', name: 'Squarespace' },
  { token: 'pinterest',   name: 'Pinterest' },
  { token: 'impact',      name: 'Impact' },
];

async function fetchGreenhouse(): Promise<any[]> {
  try {
    const results = await Promise.all(
      GH_BOARDS.map(async ({ token, name }) => {
        try {
          const res = await fetch(
            `https://api.greenhouse.io/v1/boards/${token}/jobs`,
            { next: { revalidate: 3600 } }
          );
          if (!res.ok) return [];
          const data = await res.json();
          return (data.jobs || []).slice(0, 15).map((job: any) => ({
            id: `greenhouse-${token}-${job.id}`,
            title: job.title || '',
            company: name,
            location: job.location?.name || 'Worldwide',
            description: (job.content || '').replace(/<[^>]*>/g, '').substring(0, 200) + '...',
            url: job.absolute_url || `https://boards.greenhouse.io/${token}/jobs/${job.id}`,
            salary: '',
            category: job.departments?.[0]?.name || 'General',
            level: 'Full-time',
            type: 'greenhouse',
            boardToken: token,
            jobId: String(job.id),
          }));
        } catch { return []; }
      })
    );
    return results.flat();
  } catch { return []; }
}

const LEVER_COMPANIES = [
  { slug: 'plaid', name: 'Plaid' },
];

async function fetchLever(): Promise<any[]> {
  try {
    const results = await Promise.all(
      LEVER_COMPANIES.map(async ({ slug, name }) => {
        try {
          const res = await fetch(
            `https://api.lever.co/v0/postings/${slug}?mode=json`,
            { next: { revalidate: 3600 } }
          );
          if (!res.ok) return [];
          const data = await res.json();
          if (!Array.isArray(data)) return [];
          return data.map((job: any) => ({
            id: `lever-${slug}-${job.id}`,
            title: job.text || '',
            company: name,
            location: job.categories?.location || job.categories?.allLocations?.[0] || 'Worldwide',
            description: (job.descriptionBody || job.description || '').replace(/<[^>]*>/g, '').substring(0, 200) + '...',
            url: job.hostedUrl || job.applyUrl || '#',
            salary: '',
            category: job.categories?.team || 'General',
            level: job.categories?.commitment || 'Full-time',
            type: 'lever',
          }));
        } catch { return []; }
      })
    );
    return results.flat();
  } catch { return []; }
}

function dedupe(jobs: any[]): any[] {
  const seen = new Set<string>();
  return jobs.filter(j => {
    const key = `${j.title?.toLowerCase().trim()}|${j.company?.toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query') || 'Software Engineer';
  const location = searchParams.get('location') || '';
  const page = searchParams.get('page') || '1';

  // ── No location filter: return global results ────────────────────────────
  if (!location) {
    try {
      const [museRes, jsearchJobs, adzunaJobs, ghJobs, lvrJobs] = await Promise.all([
        fetch(
          `https://www.themuse.com/api/public/jobs?page=${page}&descended=true`,
          { headers: { Accept: 'application/json' }, next: { revalidate: 3600 } }
        ),
        fetchJSearch(query, page),
        fetchAdzuna(query, 'gb'),
        fetchGreenhouse(),
        fetchLever(),
      ]);
      const museData = museRes.ok ? await museRes.json() : { results: [] };
      const museJobs = (museData.results || []).map(mapJob);
      const jobs = dedupe([...ghJobs, ...lvrJobs, ...museJobs, ...jsearchJobs, ...adzunaJobs]).slice(0, 80);
      return NextResponse.json({ jobs, total: jobs.length, source: 'Multi-source' });
    } catch (error) {
      return NextResponse.json({ jobs: [], total: 0, error: 'Failed to fetch jobs' });
    }
  }

  // ── Location filter ──────────────────────────────────────────────────────
  const cities = LOCATION_MAP[location];

  if (!cities) {
    // Unknown location — fall back to global
    try {
      const res = await fetch(
        `https://www.themuse.com/api/public/jobs?page=${page}&descended=true`,
        { headers: { Accept: 'application/json' }, next: { revalidate: 300 } }
      );
      const data = await res.json();
      return NextResponse.json({ jobs: (data.results || []).map(mapJob), total: data.total || 0, source: 'The Muse' });
    } catch {
      return NextResponse.json({ jobs: [], total: 0, error: 'Failed to fetch jobs' });
    }
  }

  // Map location names to Adzuna country codes
  const ADZUNA_COUNTRY: Record<string, string> = {
    'South Africa': 'za', 'United Kingdom': 'gb', 'United States': 'us',
    'Australia': 'au', 'Canada': 'ca', 'India': 'in', 'Singapore': 'sg',
  };
  const adzunaCountry = ADZUNA_COUNTRY[location] || null;

  try {
    // Fetch Muse + JSearch + Adzuna in parallel
    const [pageResults, jsearchJobs, adzunaJobs] = await Promise.all([
      Promise.all(cities.map(city => fetchMusePage(city, 1))),
      fetchJSearch(`${query} in ${location}`, page),
      adzunaCountry ? fetchAdzuna(query, adzunaCountry) : Promise.resolve([]),
    ]);

    const allRaw = pageResults.flat().map(mapJob);

    // Split: on-target (actually in that country) vs remote/flexible
    const onTarget = allRaw.filter(j => isOnTarget(j.location, cities));
    const remote   = allRaw.filter(j => !isOnTarget(j.location, cities));

    // If we have enough on-target jobs, show them; otherwise supplement with remote
    let combined = onTarget.length >= 10
      ? onTarget
      : [...onTarget, ...remote];

    // If still thin, fetch page 2 for largest city and add more on-target
    if (onTarget.length < 10) {
      const page2 = await fetchMusePage(cities[0], 2);
      const page2Mapped = page2.map(mapJob);
      const page2OnTarget = page2Mapped.filter(j => isOnTarget(j.location, cities));
      const page2Remote   = page2Mapped.filter(j => !isOnTarget(j.location, cities));
      combined = [...onTarget, ...page2OnTarget, ...remote, ...page2Remote];
    }

    // Adzuna and JSearch are location-matched — add them
    const jobs = dedupe([...adzunaJobs, ...combined, ...jsearchJobs]).slice(0, 40);
    return NextResponse.json({ jobs, total: jobs.length, source: 'Multi-source' });
  } catch (error) {
    return NextResponse.json({ jobs: [], total: 0, error: 'Failed to fetch jobs' });
  }
}
