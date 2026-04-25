export const revalidate = 3600;
import { NextResponse } from 'next/server';

// Confirmed working Lever board slugs
const COMPANIES = [
  { slug: 'plaid', name: 'Plaid' },
];

async function fetchCompany(slug: string, name: string): Promise<any[]> {
  try {
    const res = await fetch(
      `https://api.lever.co/v0/postings/${slug}?mode=json`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((job: any) => ({
      id: `lever-${slug}-${job.id}`,
      title: job.text || '',
      company: name,
      location: job.categories?.location || job.categories?.allLocations?.[0] || 'Worldwide',
      description: (job.descriptionBody || job.description || '').replace(/<[^>]*>/g, '').substring(0, 200) + '...',
      url: job.hostedUrl || job.applyUrl || '#',
      salary: '',
      category: job.categories?.team || 'General',
      level: job.categories?.commitment || 'Full-time',
      type: 'lever',
    }));
  } catch {
    return [];
  }
}

function dedupe(jobs: any[]): any[] {
  const seen = new Set<string>();
  return jobs.filter(j => {
    const key = `${(j.title || '').toLowerCase().trim()}|${(j.company || '').toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function GET() {
  const results = await Promise.all(COMPANIES.map(c => fetchCompany(c.slug, c.name)));
  const jobs = dedupe(results.flat());
  return NextResponse.json({ jobs, total: jobs.length, source: 'Lever' });
}
