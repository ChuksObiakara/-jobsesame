export const revalidate = 300;
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query') || 'developer';

  try {
    const res = await fetch(
      `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=20`,
      { next: { revalidate: 300 } }
    );
    const data = await res.json();
    const jobs = data.jobs?.map((job: any) => ({
      id: job.id,
      title: job.title,
      company: job.company_name,
      location: 'Remote — Worldwide',
      description: job.description?.replace(/<[^>]*>/g, '').substring(0, 200) + '...' || '',
      url: job.url,
      created: job.publication_date,
      category: job.category,
      level: 'All levels',
      salary: job.salary || '',
      type: 'remote',
    })) || [];
    console.log(`[Remote jobs] Returned: ${jobs.length}`);
    return NextResponse.json({ jobs, total: jobs.length, source: 'Remotive' });
  } catch (error) {
    console.error('Remote jobs error:', error);
    return NextResponse.json({ jobs: [], total: 0, error: 'Failed to fetch remote jobs' });
  }
}