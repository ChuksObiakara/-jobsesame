import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query') || 'Software Engineer';
  const page = searchParams.get('page') || '1';

  try {
    const response = await fetch(
      `https://www.themuse.com/api/public/jobs?page=${page}&descended=true`,
      { headers: { 'Accept': 'application/json' } }
    );

    if (!response.ok) {
      throw new Error(`Muse API error: ${response.status}`);
    }

    const data = await response.json();

    const jobs = data.results?.map((job: any) => ({
      id: job.id,
      title: job.name,
      company: job.company?.name || 'Company',
      location: job.locations?.[0]?.name || 'Remote / Worldwide',
      description: job.contents?.replace(/<[^>]*>/g, '').substring(0, 200) + '...' || '',
      url: job.refs?.landing_page || '#',
      created: job.publication_date,
      category: job.categories?.[0]?.name || 'General',
      level: job.levels?.[0]?.name || 'All levels',
    })) || [];

    return NextResponse.json({
      jobs,
      total: data.total || 0,
      source: 'The Muse'
    });

  } catch (error) {
    console.error('Jobs API error:', error);
    return NextResponse.json({ 
      jobs: [], 
      total: 0, 
      error: 'Failed to fetch jobs' 
    });
  }
}