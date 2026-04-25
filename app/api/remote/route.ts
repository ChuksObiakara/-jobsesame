export const revalidate = 3600;
import { NextRequest, NextResponse } from 'next/server';

function dedupe(jobs: any[]): any[] {
  const seen = new Set<string>();
  return jobs.filter(j => {
    const key = `${(j.title || '').toLowerCase().trim()}|${(j.company || '').toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchRemotive(query: string): Promise<any[]> {
  try {
    const res = await fetch(
      `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=30`,
      { next: { revalidate: 3600 } }
    );
    const data = await res.json();
    return (data.jobs || []).map((job: any) => ({
      id: `remotive-${job.id}`,
      title: job.title,
      company: job.company_name,
      location: 'Remote — Worldwide',
      description: (job.description || '').replace(/<[^>]*>/g, '').substring(0, 200) + '...',
      url: job.url,
      created: job.publication_date,
      category: job.category,
      level: 'All levels',
      salary: job.salary || '',
      type: 'remote',
    }));
  } catch {
    return [];
  }
}

async function fetchArbeitnow(): Promise<any[]> {
  try {
    const res = await fetch('https://www.arbeitnow.com/api/job-board-api', {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || [])
      .filter((job: any) => job.remote)
      .map((job: any) => ({
        id: `arbeitnow-${job.slug}`,
        title: job.title || '',
        company: job.company_name || 'Company',
        location: 'Remote — Worldwide',
        description: (job.description || '').replace(/<[^>]*>/g, '').substring(0, 200) + '...',
        url: job.url || '#',
        salary: '',
        category: job.tags?.[0] || 'General',
        level: job.job_types?.[0] || 'Full-time',
        type: 'remote',
      }));
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query') || 'developer';
  const [remotiveJobs, arbeitnowJobs] = await Promise.all([
    fetchRemotive(query),
    fetchArbeitnow(),
  ]);
  const jobs = dedupe([...remotiveJobs, ...arbeitnowJobs]).slice(0, 60);
  return NextResponse.json({ jobs, total: jobs.length, source: 'Remotive + Arbeitnow' });
}
