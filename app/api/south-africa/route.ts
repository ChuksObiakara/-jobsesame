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

// ── Source 3: Adzuna ZA (pages 1 + 2) ────────────────────────────────────────

async function fetchAdzunaZA(query: string): Promise<any[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const apiKey = process.env.ADZUNA_API_KEY;
  if (!appId || !apiKey) return [];
  try {
    const makeParams = () => new URLSearchParams({
      app_id: appId,
      app_key: apiKey,
      results_per_page: '50',
      what: query,
    }).toString();
    const [res1, res2] = await Promise.all([
      fetch(`https://api.adzuna.com/v1/api/jobs/za/search/1?${makeParams()}`),
      fetch(`https://api.adzuna.com/v1/api/jobs/za/search/2?${makeParams()}`),
    ]);
    const d1 = res1.ok ? await res1.json() : { results: [] };
    const d2 = res2.ok ? await res2.json() : { results: [] };
    return [...(d1.results || []), ...(d2.results || [])].map((job: any) => ({
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

// ── Source 4: JSearch — "query South Africa" (3 pages) ───────────────────────

async function fetchJSearchSA(query: string): Promise<any[]> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return [];
  const searchQuery = `${query} South Africa`;
  const fetchPage = async (page: number) => {
    try {
      const params = new URLSearchParams({ query: searchQuery, page: String(page), num_pages: '1' });
      const res = await fetch(`https://jsearch.p.rapidapi.com/search?${params}`, {
        headers: { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': 'jsearch.p.rapidapi.com' },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.data || []).map((job: any) => ({
        id: `jsearch-sa-${job.job_id}`,
        title: job.job_title || '',
        company: job.employer_name || 'Company',
        location: [job.job_city, job.job_country].filter(Boolean).join(', ') || 'South Africa',
        description: (job.job_description || '').substring(0, 220) + '...',
        url: job.job_apply_link || job.job_google_link || '#',
        salary: job.job_min_salary ? `R${Math.round(job.job_min_salary)}` : '',
        category: 'General',
        level: job.job_employment_type || 'FULLTIME',
        type: 'south-africa',
      }));
    } catch {
      return [];
    }
  };
  const [p1, p2, p3] = await Promise.all([fetchPage(1), fetchPage(2), fetchPage(3)]);
  return [...p1, ...p2, ...p3];
}

// ── Handler ──────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query') || 'software engineer';

  try {
    const [remotiveJobs, museJobs, adzunaJobs, jsearchJobs] = await Promise.all([
      fetchRemotive(query),
      fetchMuse(),
      fetchAdzunaZA(query),
      fetchJSearchSA(query),
    ]);

    // Adzuna and JSearch results are already SA-specific — no need to filter them
    const saJobs = dedupe([...adzunaJobs, ...jsearchJobs]);

    // Remotive/Muse still go through the African keyword filter
    const filtered = dedupe([...museJobs, ...remotiveJobs]).filter(isAfricanJob);

    const all = dedupe([...saJobs, ...filtered]).slice(0, 150);

    return NextResponse.json({ jobs: all, total: all.length, source: 'Multi-source' });
  } catch (err) {
    return NextResponse.json({ jobs: [], total: 0, error: 'Failed to fetch African jobs' });
  }
}
