export const revalidate = 3600;
import { NextResponse } from 'next/server';

// Only board tokens confirmed to return live jobs
const BOARDS = [
  { token: 'anthropic',   name: 'Anthropic' },
  { token: 'airbnb',      name: 'Airbnb' },
  { token: 'stripe',      name: 'Stripe' },
  { token: 'figma',       name: 'Figma' },
  { token: 'vercel',      name: 'Vercel' },
  { token: 'mongodb',     name: 'MongoDB' },
  { token: 'twilio',      name: 'Twilio' },
  { token: 'coinbase',    name: 'Coinbase' },
  { token: 'databricks',  name: 'Databricks' },
  { token: 'gitlab',      name: 'GitLab' },
  { token: 'datadog',     name: 'Datadog' },
  { token: 'cloudflare',  name: 'Cloudflare' },
  { token: 'okta',        name: 'Okta' },
  { token: 'asana',       name: 'Asana' },
  { token: 'dropbox',     name: 'Dropbox' },
  { token: 'robinhood',   name: 'Robinhood' },
  { token: 'squarespace', name: 'Squarespace' },
  { token: 'pinterest',   name: 'Pinterest' },
  { token: 'impact',      name: 'Impact' },
  { token: 'paystack',    name: 'Paystack' },
];

async function fetchBoard(token: string, companyName: string): Promise<any[]> {
  try {
    const res = await fetch(
      `https://api.greenhouse.io/v1/boards/${token}/jobs`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.jobs || []).map((job: any) => {
      const loc = job.location?.name || job.offices?.[0]?.name || 'Worldwide';
      return {
        id: `greenhouse-${token}-${job.id}`,
        title: job.title || '',
        company: companyName,
        location: loc,
        description: (job.content || '').replace(/<[^>]*>/g, '').substring(0, 200) + '...',
        url: job.absolute_url || `https://boards.greenhouse.io/${token}/jobs/${job.id}`,
        salary: '',
        category: job.departments?.[0]?.name || 'General',
        level: 'Full-time',
        type: 'greenhouse',
        boardToken: token,
        jobId: String(job.id),
      };
    });
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
  const results = await Promise.all(
    BOARDS.map(b => fetchBoard(b.token, b.name))
  );
  const jobs = dedupe(results.flat()).slice(0, 200);
  return NextResponse.json({ jobs, total: jobs.length, source: 'Greenhouse' });
}
