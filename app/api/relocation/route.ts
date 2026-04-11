import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query') || 'engineer';
  const page = searchParams.get('page') || '1';

  try {
    const res = await fetch(
      `https://www.themuse.com/api/public/jobs?page=${page}&descended=true`,
      { headers: { 'Accept': 'application/json' } }
    );
    const data = await res.json();

    // Filter for international/relocation jobs
    const jobs = data.results
      ?.filter((job: any) => {
        const loc = job.locations?.[0]?.name || '';
        const isInternational = 
          loc.includes('UK') ||
          loc.includes('London') ||
          loc.includes('Canada') ||
          loc.includes('Toronto') ||
          loc.includes('Australia') ||
          loc.includes('Sydney') ||
          loc.includes('Germany') ||
          loc.includes('Berlin') ||
          loc.includes('Netherlands') ||
          loc.includes('Amsterdam') ||
          loc.includes('Singapore') ||
          loc.includes('Dubai') ||
          loc.includes('Remote') ||
          loc.includes('Flexible') ||
          loc.includes('Worldwide') ||
          loc.includes('Europe') ||
          loc.includes('India');
        return isInternational;
      })
      ?.map((job: any) => ({
        id: job.id,
        title: job.name,
        company: job.company?.name || 'Company',
        location: job.locations?.[0]?.name || 'Worldwide',
        description: job.contents?.replace(/<[^>]*>/g, '').substring(0, 200) + '...' || '',
        url: job.refs?.landing_page || '#',
        created: job.publication_date,
        category: job.categories?.[0]?.name || 'General',
        level: job.levels?.[0]?.name || 'All levels',
        type: 'relocation',
      })) || [];

    return NextResponse.json({ 
      jobs, 
      total: data.total || 0, 
      source: 'Worldwide Opportunities' 
    });

  } catch (error) {
    console.error('Relocation jobs error:', error);
    return NextResponse.json({ jobs: [], total: 0, error: 'Failed to fetch relocation jobs' });
  }
}