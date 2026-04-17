export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

// Keywords that confirm a job is genuinely African
const AFRICAN_KEYWORDS = [
  'south africa', 'johannesburg', 'cape town', 'pretoria', 'durban', 'sandton', 'soweto',
  'nigeria', 'lagos', 'abuja', 'port harcourt', 'ibadan',
  'kenya', 'nairobi', 'mombasa', 'kisumu',
  'ghana', 'accra', 'kumasi',
  'ethiopia', 'addis ababa',
  'tanzania', 'dar es salaam',
  'uganda', 'kampala',
  'zimbabwe', 'harare',
  'zambia', 'lusaka',
  'rwanda', 'kigali',
  'senegal', 'dakar',
  'africa', 'african',
];

function isAfricanJob(job: any): boolean {
  const haystack = [job.title, job.company, job.location, job.description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return AFRICAN_KEYWORDS.some(kw => haystack.includes(kw));
}

function dedupe(jobs: any[]): any[] {
  const seen = new Set<string>();
  return jobs.filter(job => {
    const key = `${(job.title || '').toLowerCase().trim()}|${(job.company || '').toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Source 1: Remotive — search African keywords ─────────────────────────────

async function fetchRemotive(query: string): Promise<any[]> {
  // Run separate searches for each region so we get broad coverage
  const searches = [
    'south africa',
    'nigeria',
    'kenya africa',
    query !== 'software engineer' ? query : '', // user search query if custom
  ].filter(Boolean);

  const results = await Promise.all(
    searches.map(q =>
      fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(q)}&limit=20`)
        .then(r => r.json())
        .then(d => d.jobs || [])
        .catch(() => [])
    )
  );

  const jobs = results.flat().map((job: any) => ({
    id: `remotive-${job.id}`,
    title: job.title || '',
    company: job.company_name || 'Company',
    location: job.candidate_required_location
      ? `Remote — ${job.candidate_required_location}`
      : 'Remote — Open to Africa',
    description: (job.description || '').replace(/<[^>]*>/g, '').substring(0, 220) + '...',
    url: job.url || '',
    salary: job.salary || '',
    category: job.category || 'General',
    level: 'All levels',
    type: 'south-africa',
  }));

  return jobs;
}

// ── Source 2: The Muse — African city location strings ───────────────────────

async function fetchMuse(): Promise<any[]> {
  const locations = [
    'Johannesburg, South Africa',
    'Cape Town, South Africa',
    'Lagos, Nigeria',
    'Nairobi, Kenya',
  ];

  const results = await Promise.all(
    locations.map(loc =>
      fetch(
        `https://www.themuse.com/api/public/jobs?location=${encodeURIComponent(loc)}&page=1`,
        { headers: { Accept: 'application/json' } }
      )
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
            type: 'south-africa',
          }))
        )
        .catch(() => [])
    )
  );

  const jobs = results.flat();
  return jobs;
}

// ── Source 3: Adzuna ZA ───────────────────────────────────────────────────────

async function fetchAdzunaZA(query: string): Promise<any[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const apiKey = process.env.ADZUNA_API_KEY;
  if (!appId || !apiKey) return [];
  try {
    const params = new URLSearchParams({
      app_id: appId,
      app_key: apiKey,
      results_per_page: '20',
      what: query,
    });
    const res = await fetch(`https://api.adzuna.com/v1/api/jobs/za/search/1?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((job: any) => ({
      id: `adzuna-za-${job.id}`,
      title: job.title || '',
      company: job.company?.display_name || 'Company',
      location: job.location?.display_name || 'South Africa',
      description: (job.description || '').substring(0, 220) + '...',
      url: job.redirect_url || '#',
      salary: job.salary_min ? `R${Math.round(job.salary_min)}${job.salary_max ? `–R${Math.round(job.salary_max)}` : ''}` : '',
      category: job.category?.label || 'General',
      level: job.contract_time || 'full_time',
      type: 'south-africa',
    }));
  } catch {
    return [];
  }
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query') || 'software engineer';

  try {
    const [remotiveJobs, museJobs, adzunaJobs] = await Promise.all([
      fetchRemotive(query),
      fetchMuse(),
      fetchAdzunaZA(query),
    ]);

    // Combine, deduplicate, then filter strictly to African jobs only
    const combined = dedupe([...adzunaJobs, ...museJobs, ...remotiveJobs]);
    const africanJobs = combined.filter(isAfricanJob);

    return NextResponse.json({ jobs: africanJobs, total: africanJobs.length, source: 'Multi-source' });
  } catch (err) {
    return NextResponse.json({ jobs: [], total: 0, error: 'Failed to fetch African jobs' });
  }
}
