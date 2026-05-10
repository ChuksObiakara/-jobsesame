export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

const MAX_AGE_DAYS = 60;

function isRecent(dateStr: string | undefined): boolean {
  if (!dateStr) return true; // keep if date unknown — can't determine age
  try {
    const ms = new Date(dateStr).getTime();
    if (isNaN(ms)) return true;
    return Date.now() - ms < MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return true;
  }
}

function sortByDate(jobs: any[]): any[] {
  return [...jobs].sort((a, b) => {
    const da = a.postedAt ? new Date(a.postedAt).getTime() : 0;
    const db = b.postedAt ? new Date(b.postedAt).getTime() : 0;
    return db - da; // newest first; undated jobs fall to the end
  });
}

const AFRICAN_KEYWORDS = [
  'south africa', 'johannesburg', 'cape town', 'pretoria', 'durban', 'sandton',
  'soweto', 'stellenbosch', 'bloemfontein', 'port elizabeth', 'east london',
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
    .filter(Boolean).join(' ').toLowerCase();
  return AFRICAN_KEYWORDS.some(kw => haystack.includes(kw));
}

function dedupe(jobs: any[]): any[] {
  const seenKeys = new Set<string>();
  const seenUrls = new Set<string>();
  return jobs.filter(job => {
    const key = `${(job.title || '').toLowerCase().trim()}|${(job.company || '').toLowerCase().trim()}`;
    const url = job.url && job.url !== '#' ? job.url : null;
    if (seenKeys.has(key)) return false;
    if (url && seenUrls.has(url)) return false;
    seenKeys.add(key);
    if (url) seenUrls.add(url);
    return true;
  });
}

// ── Source 1: Remotive ────────────────────────────────────────────────────────
async function fetchRemotive(query: string): Promise<any[]> {
  const searches = [
    'south africa', 'nigeria', 'kenya africa',
    query !== 'software engineer' ? query : '',
  ].filter(Boolean);

  const results = await Promise.all(
    searches.map(q =>
      fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(q)}&limit=30`)
        .then(r => r.json())
        .then(d => d.jobs || [])
        .catch(() => [])
    )
  );

  return results.flat().map((job: any) => ({
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
    postedAt: job.publication_date || '',
    type: 'south-africa',
  }));
}

// ── Source 2: The Muse ────────────────────────────────────────────────────────
async function fetchMuse(): Promise<any[]> {
  const locations = [
    'Johannesburg, South Africa',
    'Cape Town, South Africa',
    'Lagos, Nigeria',
    'Nairobi, Kenya',
    'Accra, Ghana',
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
            postedAt: job.publication_date || '',
            type: 'south-africa',
          }))
        )
        .catch(() => [])
    )
  );

  return results.flat();
}

// ── Source 3: Adzuna ZA — pages 1–4 (up to 200 raw) ─────────────────────────
async function fetchAdzunaZA(query: string): Promise<any[]> {
  const appId  = process.env.ADZUNA_APP_ID;
  const apiKey = process.env.ADZUNA_API_KEY;
  if (!appId || !apiKey) return [];

  try {
    const makeUrl = (page: number) => {
      const p = new URLSearchParams({
        app_id: appId, app_key: apiKey,
        results_per_page: '50', what: query,
      });
      return `https://api.adzuna.com/v1/api/jobs/za/search/${page}?${p}`;
    };

    const responses = await Promise.all(
      [1, 2, 3, 4].map(page =>
        fetch(makeUrl(page)).then(r => r.ok ? r.json() : { results: [] }).catch(() => ({ results: [] }))
      )
    );

    return responses.flatMap(d =>
      (d.results || []).map((job: any) => ({
        id: `adzuna-za-${job.id}`,
        title: job.title || '',
        company: job.company?.display_name || 'Company',
        location: job.location?.display_name || 'South Africa',
        description: (job.description || '').replace(/<[^>]*>/g, '').substring(0, 220) + '...',
        url: job.redirect_url || '#',
        salary: job.salary_min
          ? `R${Math.round(job.salary_min)}${job.salary_max ? `–R${Math.round(job.salary_max)}` : ''}`
          : '',
        category: job.category?.label || 'General',
        level: job.contract_time || 'full_time',
        postedAt: job.created || '',
        type: 'south-africa',
      }))
    );
  } catch {
    return [];
  }
}

// ── Source 4: JSearch SA — 5 pages (up to 50 raw) ────────────────────────────
async function fetchJSearchSA(query: string): Promise<any[]> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) return [];

  const searchQuery = `${query} South Africa`;
  const fetchPage = async (page: number): Promise<any[]> => {
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
        postedAt: job.job_posted_at_datetime_utc || '',
        type: 'south-africa',
      }));
    } catch {
      return [];
    }
  };

  const pages = await Promise.all([1, 2, 3, 4, 5].map(fetchPage));
  return pages.flat();
}

// ── Source 5: Jooble SA — pages 1–3 ──────────────────────────────────────────
async function fetchJoobleZA(query: string, page = 1): Promise<any[]> {
  const apiKey = process.env.JOOBLE_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch(`https://jooble.org/api/${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords: query, location: 'South Africa', page }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.warn(`[SA Jobs] Jooble page ${page} → HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
    return (data.jobs || []).map((job: any) => ({
      id: `jooble-za-${Buffer.from(job.link || job.title || String(Math.random())).toString('base64').substring(0, 16)}`,
      title: job.title || '',
      company: job.company || 'Company',
      location: job.location || 'South Africa',
      description: (job.snippet || '').replace(/<[^>]*>/g, '').substring(0, 220) + '...',
      url: job.link || '#',
      salary: job.salary || '',
      category: job.type || 'General',
      level: 'All levels',
      postedAt: job.updated || '',
      type: 'south-africa',
    }));
  } catch (err) {
    console.error(`[SA Jobs] Jooble page ${page} error:`, err);
    return [];
  }
}

// ── Source 6: Greenhouse SA companies ────────────────────────────────────────
const GH_SA_BOARDS = [
  { token: 'paystack',    name: 'Paystack' },
  { token: 'andela',      name: 'Andela' },
  { token: 'flutterwave', name: 'Flutterwave' },
];

async function fetchGreenhouseSA(): Promise<any[]> {
  const results = await Promise.all(
    GH_SA_BOARDS.map(async ({ token, name }) => {
      try {
        const res = await fetch(`https://api.greenhouse.io/v1/boards/${token}/jobs`, {
          next: { revalidate: 3600 },
        });
        if (!res.ok) return [];
        const data = await res.json();
        return (data.jobs || []).map((job: any) => ({
          id: `greenhouse-${token}-${job.id}`,
          title: job.title || '',
          company: name,
          location: job.location?.name || 'Africa',
          description: (job.content || '').replace(/<[^>]*>/g, '').substring(0, 220) + '...',
          url: job.absolute_url || `https://boards.greenhouse.io/${token}/jobs/${job.id}`,
          salary: '',
          category: job.departments?.[0]?.name || 'General',
          level: 'Full-time',
          postedAt: job.updated_at || '',
          type: 'greenhouse',
          boardToken: token,
          jobId: String(job.id),
        }));
      } catch {
        return [];
      }
    })
  );
  return results.flat();
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query') || 'software engineer';

  try {
    const [remotiveJobs, museJobs, adzunaJobs, jsearchJobs, ghSAJobs, jooble1, jooble2, jooble3] = await Promise.all([
      fetchRemotive(query),
      fetchMuse(),
      fetchAdzunaZA(query),
      fetchJSearchSA(query),
      fetchGreenhouseSA(),
      fetchJoobleZA(query, 1),
      fetchJoobleZA(query, 2),
      fetchJoobleZA(query, 3),
    ]);

    const joobleJobs = [...jooble1, ...jooble2, ...jooble3];

    // Filter stale jobs from sources that provide dates
    const freshAdzuna   = adzunaJobs.filter(j => isRecent(j.postedAt));
    const freshJSearch  = jsearchJobs.filter(j => isRecent(j.postedAt));
    const freshJooble   = joobleJobs.filter(j => isRecent(j.postedAt));
    const freshRemotive = remotiveJobs.filter(j => isRecent(j.postedAt));
    const freshMuse     = museJobs.filter(j => isRecent(j.postedAt));

    // Adzuna, JSearch, Jooble, Greenhouse are already SA-specific
    const saSpecific = dedupe([...freshAdzuna, ...freshJSearch, ...freshJooble, ...ghSAJobs]);

    // Remotive + Muse need the African keyword filter
    const africanFiltered = dedupe([...freshMuse, ...freshRemotive]).filter(isAfricanJob);

    // Merge, final dedupe, sort newest-first, cap at 300
    const all = sortByDate(dedupe([...saSpecific, ...africanFiltered])).slice(0, 300);

    console.log(`[SA Jobs] adzuna=${freshAdzuna.length} jsearch=${freshJSearch.length} jooble=${freshJooble.length} greenhouse=${ghSAJobs.length} remotive=${freshRemotive.length} muse=${freshMuse.length} → total=${all.length}`);

    return NextResponse.json({ jobs: all, total: all.length, source: 'Multi-source' });
  } catch (err) {
    console.error('[SA Jobs] Error:', err);
    return NextResponse.json({ jobs: [], total: 0, error: 'Failed to fetch African jobs' });
  }
}
