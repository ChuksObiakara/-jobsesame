export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

function dedupe(jobs: any[]): any[] {
  const seen = new Set<string>();
  return jobs.filter(job => {
    const key = job.id
      ? String(job.id)
      : `${(job.title || '').toLowerCase().trim()}|${(job.company || '').toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const QUERIES = ['english teacher', 'ESL', 'TEFL', 'teaching abroad'];

export async function GET(_request: NextRequest) {
  try {
    const results = await Promise.all(
      QUERIES.map(q =>
        fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(q)}&limit=20`)
          .then(r => r.json())
          .then(d => (d.jobs || []).map((job: any) => ({
            id: `remotive-${job.id}`,
            title: job.title || '',
            company: job.company_name || 'Company',
            location: job.candidate_required_location || 'Remote — Worldwide',
            url: job.url || '',
            source: 'Remotive',
          })))
          .catch(() => [])
      )
    );

    const jobs = dedupe(results.flat());
    return NextResponse.json({ jobs, total: jobs.length, source: 'Remotive' });
  } catch (error) {
    return NextResponse.json({ jobs: [], total: 0, error: 'Failed to fetch teaching jobs' });
  }
}
