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

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query') || 'software engineer';
  const page = request.nextUrl.searchParams.get('page') || '1';
  const apiKey = process.env.RAPIDAPI_KEY;

  if (!apiKey) {
    return NextResponse.json({ jobs: [], total: 0, error: 'API key not configured' });
  }

  try {
    const params = new URLSearchParams({ query, page, num_pages: '1' });
    const res = await fetch(`https://jsearch.p.rapidapi.com/search?${params}`, {
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'jsearch.p.rapidapi.com',
      },
    });
    if (!res.ok) throw new Error(`JSearch error: ${res.status}`);
    const data = await res.json();
    const jobs = (data.data || []).map(mapJob);
    return NextResponse.json({ jobs, total: jobs.length, source: 'JSearch' });
  } catch (error) {
    return NextResponse.json({ jobs: [], total: 0, error: 'Failed to fetch jobs' });
  }
}
