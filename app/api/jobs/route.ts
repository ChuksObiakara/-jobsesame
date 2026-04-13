export const revalidate = 300;
import { NextRequest, NextResponse } from 'next/server';

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
      const res = await fetch(
        `https://www.themuse.com/api/public/jobs?page=${page}&descended=true`,
        { headers: { Accept: 'application/json' }, next: { revalidate: 300 } }
      );
      if (!res.ok) throw new Error(`Muse API error: ${res.status}`);
      const data = await res.json();
      const jobs = (data.results || []).map(mapJob);
      console.log(`[Jobs] Global (no location): ${jobs.length}`);
      return NextResponse.json({ jobs, total: data.total || 0, source: 'The Muse' });
    } catch (error) {
      console.error('[Jobs] Error:', error);
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

  try {
    // Fetch page 1 for each city in parallel
    const pageResults = await Promise.all(
      cities.map(city => fetchMusePage(city, 1))
    );

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

    const jobs = dedupe(combined).slice(0, 20);
    console.log(`[Jobs] Location=${location}: on-target=${onTarget.length} total returned=${jobs.length}`);
    return NextResponse.json({ jobs, total: jobs.length, source: 'The Muse' });
  } catch (error) {
    console.error('[Jobs] Location filter error:', error);
    return NextResponse.json({ jobs: [], total: 0, error: 'Failed to fetch jobs' });
  }
}
