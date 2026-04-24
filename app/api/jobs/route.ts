export const revalidate = 300;
import { NextRequest, NextResponse } from 'next/server';

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
        { next: { revalidate: 300 } }
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
    next: { revalidate: 300 },
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

  // ── No location filter: merge Adzuna ZA + The Muse global ────────────────
  if (!location) {
    try {
      const [adzunaZA, museRes] = await Promise.all([
        fetchAdzunaPages('za', [1], query),
        fetch(
          `https://www.themuse.com/api/public/jobs?page=${page}&descended=true`,
          { headers: { Accept: 'application/json' }, next: { revalidate: 300 } }
        ).then(r => r.ok ? r.json() : { results: [] }),
      ]);

      const museJobs = (museRes.results || []).map(mapMuseJob);
      const jobs = dedupe([...adzunaZA, ...museJobs]);
      const total = (museRes.total || 0) + adzunaZA.length;
      console.log(`[Jobs] Global: adzuna=${adzunaZA.length} muse=${museJobs.length}`);
      return NextResponse.json({ jobs, total, source: 'Multi-source' });
    } catch (error) {
      console.error('[Jobs] Error:', error);
      return NextResponse.json({ jobs: [], total: 0, error: 'Failed to fetch jobs' });
    }
  }

  // ── Other location filter (The Muse) ─────────────────────────────────────
  const cities = LOCATION_MAP[location];

  if (!cities) {
    try {
      const res = await fetch(
        `https://www.themuse.com/api/public/jobs?page=${page}&descended=true`,
        { headers: { Accept: 'application/json' }, next: { revalidate: 300 } }
      );
      const data = await res.json();
      return NextResponse.json({ jobs: (data.results || []).map(mapMuseJob), total: data.total || 0, source: 'The Muse' });
    } catch {
      return NextResponse.json({ jobs: [], total: 0, error: 'Failed to fetch jobs' });
    }
  }

  try {
    const pageResults = await Promise.all(cities.map(city => fetchMusePage(city, 1)));
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

    const jobs = dedupe(combined).slice(0, 20);
    console.log(`[Jobs] Location=${location}: on-target=${onTarget.length} total=${jobs.length}`);
    return NextResponse.json({ jobs, total: jobs.length, source: 'The Muse' });
  } catch (error) {
    console.error('[Jobs] Location filter error:', error);
    return NextResponse.json({ jobs: [], total: 0, error: 'Failed to fetch jobs' });
  }
}
