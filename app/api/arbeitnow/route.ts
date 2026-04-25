export const revalidate = 3600;
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch('https://www.arbeitnow.com/api/job-board-api', {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`Arbeitnow error: ${res.status}`);
    const data = await res.json();
    const jobs = (data.data || []).map((job: any) => ({
      id: `arbeitnow-${job.slug}`,
      title: job.title || '',
      company: job.company_name || 'Company',
      location: job.remote ? 'Remote — Worldwide' : (job.location || 'Europe'),
      description: (job.description || '').replace(/<[^>]*>/g, '').substring(0, 200) + '...',
      url: job.url || '#',
      salary: '',
      category: job.tags?.[0] || 'General',
      level: job.job_types?.[0] || 'Full-time',
      type: 'remote',
      remote: job.remote,
    }));
    return NextResponse.json({ jobs, total: jobs.length, source: 'Arbeitnow' });
  } catch {
    return NextResponse.json({ jobs: [], total: 0, error: 'Failed to fetch Arbeitnow jobs' });
  }
}
