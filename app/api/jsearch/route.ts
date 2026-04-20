export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

function mapJob(job: any): any {
  const city = job.job_city || '';
  const country = job.job_country || '';
  const location = [city, country].filter(Boolean).join(', ') || 'Worldwide';
  const salaryMin = job.job_min_salary;
  const salaryMax = job.job_max_salary;
  const currency = job.job_salary_currency || '$';
  const salary = salaryMin
    ? `${currency}${Math.round(salaryMin)}${salaryMax ? `–${Math.round(salaryMax)}` : ''}`
    : '';
  return {
    id: `jsearch-${job.job_id}`,
    title: job.job_title || '',
    company: job.employer_name || 'Company',
    location,
    description: (job.job_description || '').substring(0, 200) + '...',
    url: job.job_apply_link || job.job_google_link || '#',
    salary,
    category: job.job_required_experience?.required_experience_in_months ? 'Experienced' : 'General',
    level: job.job_employment_type || 'FULLTIME',
    type: 'jsearch',
  };
}

async function fetchPage(query: string, page: string, apiKey: string): Promise<any[]> {
  try {
    const params = new URLSearchParams({ query, page, num_pages: '1' });
    const res = await fetch(`https://jsearch.p.rapidapi.com/search?${params}`, {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'jsearch.p.rapidapi.com',
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data || []).map(mapJob);
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const rawQuery = request.nextUrl.searchParams.get('query') || 'software engineer';
  const page = request.nextUrl.searchParams.get('page') || '1';
  const country = request.nextUrl.searchParams.get('country') || '';
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!apiKey) {
    return NextResponse.json({ jobs: [], total: 0, error: 'API key not configured' });
  }

  // For South Africa, append location and fetch 3 pages simultaneously
  const isSA = country === 'za' || country === 'south africa';
  const searchQuery = isSA ? `${rawQuery} South Africa` : rawQuery;

  try {
    let jobs: any[];
    if (isSA) {
      const [p1, p2, p3] = await Promise.all([
        fetchPage(searchQuery, '1', apiKey),
        fetchPage(searchQuery, '2', apiKey),
        fetchPage(searchQuery, '3', apiKey),
      ]);
      const seen = new Set<string>();
      jobs = [...p1, ...p2, ...p3].filter(j => {
        if (seen.has(j.id)) return false;
        seen.add(j.id);
        return true;
      });
    } else {
      const params = new URLSearchParams({ query: searchQuery, page, num_pages: '1' });
      const res = await fetch(`https://jsearch.p.rapidapi.com/search?${params}`, {
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'jsearch.p.rapidapi.com',
        },
      });
      if (!res.ok) throw new Error(`JSearch error: ${res.status}`);
      const data = await res.json();
      jobs = (data.data || []).map(mapJob);
    }

    return NextResponse.json({ jobs, total: jobs.length, source: 'JSearch' });
  } catch (error) {
    return NextResponse.json({ jobs: [], total: 0, error: 'Failed to fetch jobs' });
  }
}
