export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

const TEACHING_KEYWORDS = [
  'teacher','tutor','esl','tefl','tesol','instructor','lecturer',
  'professor','curriculum','educator','academic','faculty','teaching',
  'e-learning','edtech','instructional','learning specialist',
  'training specialist','learning & development','course developer',
  'content developer','coach','facilitator','trainer',
];

function matchesTeaching(title: string, category: string = ''): boolean {
  const haystack = `${title} ${category}`.toLowerCase();
  return TEACHING_KEYWORDS.some(k => haystack.includes(k));
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

// ── Source 1: Jobicy (education + training tags) ─────────────────────────────
async function fetchJobicy(): Promise<any[]> {
  const results = await Promise.all(
    ['education', 'training'].map(tag =>
      fetch(`https://jobicy.com/api/v2/remote-jobs?tag=${tag}&count=20`)
        .then(r => r.json())
        .then(d => d.jobs || [])
        .catch(() => [])
    )
  );
  const jobs = results.flat().map((job: any) => ({
    id: `jobicy-${job.id}`,
    title: job.jobTitle || '',
    company: job.companyName || 'Company',
    location: job.jobGeo || 'Remote — Worldwide',
    description: (job.jobExcerpt || '').replace(/<[^>]*>/g, '').substring(0, 220) + '...',
    url: job.url || '',
    salary: '',
    category: 'Education & Training',
    level: job.jobLevel || 'All levels',
    type: 'teaching',
  }));
  console.log(`[Teaching] Jobicy: ${jobs.length} jobs`);
  return jobs;
}

// ── Source 2: Remotive (education / learning / training searches) ─────────────
async function fetchRemotive(): Promise<any[]> {
  const results = await Promise.all(
    ['education', 'learning', 'training', 'content'].map(q =>
      fetch(`https://remotive.com/api/remote-jobs?search=${q}&limit=20`)
        .then(r => r.json())
        .then(d => d.jobs || [])
        .catch(() => [])
    )
  );
  const jobs = results.flat()
    .filter((job: any) => matchesTeaching(job.title || '', job.category || ''))
    .map((job: any) => ({
      id: `remotive-${job.id}`,
      title: job.title || '',
      company: job.company_name || 'Company',
      location: 'Remote — Worldwide',
      description: (job.description || '').replace(/<[^>]*>/g, '').substring(0, 220) + '...',
      url: job.url || '',
      salary: job.salary || '',
      category: job.category || 'Education & Training',
      level: 'All levels',
      type: 'teaching',
    }));
  console.log(`[Teaching] Remotive: ${jobs.length} teaching matches`);
  return jobs;
}

// ── Source 3: The Muse — scan pages and keyword-filter titles ────────────────
async function fetchMuse(): Promise<any[]> {
  // Fetch 25 pages in parallel batches of 5 to find teaching-related titles
  const pageNumbers = Array.from({ length: 25 }, (_, i) => i + 1);
  const batches: number[][] = [];
  for (let i = 0; i < pageNumbers.length; i += 5) {
    batches.push(pageNumbers.slice(i, i + 5));
  }

  const matches: any[] = [];
  for (const batch of batches) {
    if (matches.length >= 20) break;
    const pages = await Promise.all(
      batch.map(p =>
        fetch(`https://www.themuse.com/api/public/jobs?page=${p}`, {
          headers: { Accept: 'application/json' },
        })
          .then(r => r.json())
          .then(d => d.results || [])
          .catch(() => [])
      )
    );
    const batchJobs = pages.flat().filter((job: any) =>
      matchesTeaching(job.name || '', job.categories?.[0]?.name || '')
    );
    matches.push(...batchJobs);
  }

  const jobs = matches.slice(0, 20).map((job: any) => ({
    id: `muse-${job.id}`,
    title: job.name,
    company: job.company?.name || 'Company',
    location: job.locations?.[0]?.name || 'Worldwide',
    description: (job.contents || '').replace(/<[^>]*>/g, '').substring(0, 220) + '...',
    url: job.refs?.landing_page || '#',
    salary: '',
    category: job.categories?.[0]?.name || 'Education & Training',
    level: job.levels?.[0]?.name || 'All levels',
    type: 'teaching',
  }));
  console.log(`[Teaching] Muse scan: ${jobs.length} teaching matches`);
  return jobs;
}

// ── Handler ──────────────────────────────────────────────────────────────────
export async function GET(_request: NextRequest) {
  try {
    const [jobicyJobs, remotiveJobs, museJobs] = await Promise.all([
      fetchJobicy(),
      fetchRemotive(),
      fetchMuse(),
    ]);

    const jobs = dedupe([...jobicyJobs, ...remotiveJobs, ...museJobs]);
    console.log(`[Teaching] Total unique jobs: ${jobs.length}`);
    return NextResponse.json({ jobs, total: jobs.length, source: 'Multi-source' });
  } catch (error) {
    console.error('[Teaching] Error:', error);
    return NextResponse.json({ jobs: [], total: 0, error: 'Failed to fetch teaching jobs' });
  }
}
