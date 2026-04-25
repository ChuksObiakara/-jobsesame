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
      next: { revalidate: 3600 },
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
      { next: { revalidate: 3600 } }
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

const ADZUNA_APP_ID = '73658bdc';

// ── Adzuna helpers ────────────────────────────────────────────────────────────

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
    description: (job.description || '').replace(/<[^>]*>/g, '').substring(0, 200) + '...',
    url: job.redirect_url || '#',
    salary: job.salary_min
      ? `${job.salary_min.toLocaleString()} – ${(job.salary_max || job.salary_min).toLocaleString()}`
      : '',
    category: job.category?.label || 'General',
    level: 'All levels',
    created: job.created || '',
    source: 'Adzuna',
  };
}

async function fetchAdzunaPages(country: string, pages: number[], query?: string): Promise<any[]> {
  const apiKey = process.env.ADZUNA_API_KEY;
  if (!apiKey) return [];
  const results = await Promise.all(
    pages.map(page => {
      const params = new URLSearchParams({
        app_id: ADZUNA_APP_ID,
        app_key: apiKey,
        results_per_page: '50',
      });
      if (query) params.set('what', query);
      return fetch(
        `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?${params}`,
        { next: { revalidate: 3600 } }
      )
        .then(r => r.ok ? r.json() : { results: [] })
        .then(d => (d.results || []).map((j: any) => mapAdzunaJob(j, country)))
        .catch(() => []);
    })
  );
  return results.flat();
}

// ── The Muse helpers ──────────────────────────────────────────────────────────

async function fetchMusePage(location: string, page: number): Promise<any[]> {
  const params = new URLSearchParams({ location, page: String(page) });
  const res = await fetch(`https://www.themuse.com/api/public/jobs?${params}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.results || [];
}

function mapMuseJob(job: any): any {
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
    source: 'The Muse',
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
  { token: 'paystack',    name: 'Paystack' },
];

async function fetchGreenhouse(): Promise<any[]> {
  const results = await Promise.all(
    GH_BOARDS.map(async ({ token, name }) => {
      try {
        const res = await fetch(
          `https://api.greenhouse.io/v1/boards/${token}/jobs`,
          { next: { revalidate: 3600 } }
        );
        if (!res.ok) return [];
        const data = await res.json();
        return (data.jobs || []).slice(0, 12).map((job: any) => ({
          id: `greenhouse-${token}-${job.id}`,
          title: job.title || '',
          company: name,
          location: job.location?.name || 'Worldwide',
          description: '',
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
}

async function fetchLever(): Promise<any[]> {
  try {
    const res = await fetch('https://api.lever.co/v0/postings/plaid?mode=json', { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((job: any) => ({
      id: `lever-plaid-${job.id}`,
      title: job.text || '',
      company: 'Plaid',
      location: job.categories?.location || 'Worldwide',
      description: (job.descriptionBody || '').replace(/<[^>]*>/g, '').substring(0, 200) + '...',
      url: job.hostedUrl || '#',
      salary: '',
      category: job.categories?.team || 'General',
      level: job.categories?.commitment || 'Full-time',
      type: 'lever',
    }));
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
  const query    = searchParams.get('query') || 'Software Engineer';
  const location = searchParams.get('location') || '';
  const page     = searchParams.get('page') || '1';

  // ── South Africa → Adzuna ZA only ────────────────────────────────────────
  if (location === 'South Africa') {
    const jobs = await fetchAdzunaPages('za', [1, 2, 3], query);
    const deduped = dedupe(jobs).slice(0, 100);
    console.log(`[Jobs] South Africa (Adzuna): ${deduped.length}`);
    return NextResponse.json({ jobs: deduped, total: deduped.length, source: 'Adzuna' });
  }

  // ── Nigeria → Adzuna NG only ──────────────────────────────────────────────
  if (location === 'Nigeria') {
    const jobs = await fetchAdzunaPages('ng', [1], query);
    const deduped = dedupe(jobs).slice(0, 50);
    console.log(`[Jobs] Nigeria (Adzuna): ${deduped.length}`);
    return NextResponse.json({ jobs: deduped, total: deduped.length, source: 'Adzuna' });
  }

  // ── No location filter: Greenhouse + Lever + Adzuna + Muse + JSearch ─────
  if (!location) {
    try {
      const [adzunaZA, museData, jsearchJobs, ghJobs, lvrJobs] = await Promise.all([
        fetchAdzunaPages('za', [1], query),
        fetch(
          `https://www.themuse.com/api/public/jobs?page=${page}&descended=true`,
          { headers: { Accept: 'application/json' }, next: { revalidate: 3600 } }
        ).then(r => r.ok ? r.json() : { results: [] }),
        fetchJSearch(query, page),
        fetchGreenhouse(),
        fetchLever(),
      ]);
      const museJobs = (museData.results || []).map(mapMuseJob);
      const jobs = dedupe([...ghJobs, ...lvrJobs, ...adzunaZA, ...museJobs, ...jsearchJobs]).slice(0, 80);
      return NextResponse.json({ jobs, total: jobs.length, source: 'Multi-source' });
    } catch (error) {
      return NextResponse.json({ jobs: [], total: 0, error: 'Failed to fetch jobs' });
    }
  }

  // ── Other location filter (The Muse) ─────────────────────────────────────
  const cities = LOCATION_MAP[location];

  if (!cities) {
    try {
      const res = await fetch(
        `https://www.themuse.com/api/public/jobs?page=${page}&descended=true`,
        { headers: { Accept: 'application/json' }, next: { revalidate: 3600 } }
      );
      const data = await res.json();
      return NextResponse.json({ jobs: (data.results || []).map(mapMuseJob), total: data.total || 0, source: 'The Muse' });
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
      adzunaCountry ? fetchAdzunaPages(adzunaCountry, [1, 2], query) : Promise.resolve([]),
    ]);

    const allRaw = pageResults.flat().map(mapMuseJob);
    const onTarget = allRaw.filter(j => isOnTarget(j.location, cities));
    const remote   = allRaw.filter(j => !isOnTarget(j.location, cities));

    let combined = onTarget.length >= 10 ? onTarget : [...onTarget, ...remote];

    if (onTarget.length < 10) {
      const page2 = await fetchMusePage(cities[0], 2);
      const page2Mapped = page2.map(mapMuseJob);
      const page2OnTarget = page2Mapped.filter(j => isOnTarget(j.location, cities));
      const page2Remote   = page2Mapped.filter(j => !isOnTarget(j.location, cities));
      combined = [...onTarget, ...page2OnTarget, ...remote, ...page2Remote];
    }

    // Adzuna and JSearch are location-matched — prepend them
    const jobs = dedupe([...adzunaJobs, ...combined, ...jsearchJobs]).slice(0, 40);
    console.log(`[Jobs] Location=${location}: on-target=${onTarget.length} adzuna=${adzunaJobs.length} total=${jobs.length}`);
    return NextResponse.json({ jobs, total: jobs.length, source: 'Multi-source' });
  } catch (error) {
    return NextResponse.json({ jobs: [], total: 0, error: 'Failed to fetch jobs' });
  }
}
