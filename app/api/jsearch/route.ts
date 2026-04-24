export const dynamic = 'force-dynamic';
// REMINDER: Add to Vercel environment variables:
//   RAPIDAPI_KEY=1cb2b63fbcmsh4c622757de46e24p1c4669jsnfcb9df96f3a8

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

async function fetchJSearch(query: string, numPages: number): Promise<any[]> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    console.warn('[JSearch] RAPIDAPI_KEY not set');
    return [];
  }

  const pages = Array.from({ length: numPages }, (_, i) => i + 1);
  const results = await Promise.all(
    pages.map(page =>
      fetch(
        `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(query)}&page=${page}&num_pages=1`,
        {
          headers: {
            'x-rapidapi-host': 'jsearch.p.rapidapi.com',
            'x-rapidapi-key': apiKey,
          },
        }
      )
        .then(r => r.json())
        .then(d =>
          (d.data || []).map((job: any) => ({
            id: `jsearch-${job.job_id}`,
            title: job.job_title || '',
            company: job.employer_name || 'Company',
            location: [job.job_city, job.job_state, job.job_country]
              .filter(Boolean)
              .join(', '),
            description: (job.job_description || '').substring(0, 220) + '...',
            url: job.job_apply_link || job.job_google_link || '#',
            salary: job.job_min_salary
              ? `${job.job_min_salary.toLocaleString()} – ${(job.job_max_salary || job.job_min_salary).toLocaleString()}`
              : '',
            category: job.job_required_experience?.required_experience_in_months
              ? 'Experienced'
              : 'General',
            level: job.job_employment_type || 'All levels',
            created: job.job_posted_at_datetime_utc || '',
            source: 'JSearch',
            type: 'south-africa',
          }))
        )
        .catch(() => [])
    )
  );

  return results.flat();
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('query') || '';

  try {
    const [saJobs, joburgJobs, capeJobs, durbanJobs] = await Promise.all([
      fetchJSearch(query ? `${query} South Africa` : 'jobs in South Africa', 3),
      fetchJSearch(query ? `${query} Johannesburg` : 'jobs in Johannesburg', 2),
      fetchJSearch(query ? `${query} Cape Town` : 'jobs in Cape Town', 2),
      fetchJSearch('jobs in Durban South Africa', 1),
    ]);

    const allJobs = dedupe([...saJobs, ...joburgJobs, ...capeJobs, ...durbanJobs]).slice(0, 150);
    console.log(`[JSearch] SA total: ${allJobs.length} jobs`);
    return NextResponse.json({ jobs: allJobs, total: allJobs.length, source: 'JSearch' });
  } catch (err) {
    console.error('[JSearch] Error:', err);
    return NextResponse.json({ jobs: [], total: 0, error: 'Failed to fetch JSearch jobs' });
  }
}
