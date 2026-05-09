import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface AISearchParams {
  keywords: string;
  location: string;
  minSalary: number | null;
  jobType: 'remote' | 'hybrid' | 'part-time' | 'full-time' | null;
  level: 'senior' | 'mid' | 'junior' | null;
  tab: 'all' | 'london' | 'manchester' | 'birmingham' | 'remote' | 'tech' | 'finance' | 'healthcare' | null;
  reply: string;
}

const SYSTEM = `You are a UK job search assistant for Jobsesame. Parse the user's natural language query into structured search parameters.

Respond ONLY with a valid JSON object — no prose, no markdown, no code fences. Schema:
{
  "keywords": "",        // job title, role, or skills — empty string if none
  "location": "",        // UK city or region — empty string if none
  "minSalary": null,     // annual salary minimum as integer (e.g. 60000), null if not mentioned
  "jobType": null,       // "remote" | "hybrid" | "part-time" | "full-time" | null
  "level": null,         // "senior" | "mid" | "junior" | null
  "tab": null,           // "london"|"manchester"|"birmingham"|"remote"|"tech"|"finance"|"healthcare"|"all"|null
  "reply": ""            // one friendly sentence summarising what you extracted and will show
}

Rules:
- tab should be "remote" if jobType is "remote", city name if location matches a tab, category if role matches tech/finance/healthcare
- minSalary: convert "£60k" → 60000, "£45,000" → 45000, "50k" → 50000, null if not mentioned
- keywords should be the core role/skill, not the full query
- reply must be warm and specific, e.g. "Showing you senior React developer roles in London paying £70k+ — sorted by best match."`;

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query?.trim()) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: SYSTEM,
      messages: [{ role: 'user', content: query.trim() }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text.trim();

    // Strip any accidental markdown fences
    const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    const params: AISearchParams = JSON.parse(cleaned);

    return NextResponse.json(params);
  } catch (err) {
    console.error('[AI Search] Error:', err);
    return NextResponse.json(
      {
        keywords: '',
        location: '',
        minSalary: null,
        jobType: null,
        level: null,
        tab: null,
        reply: "I couldn't parse that — try something like \"Remote React jobs paying £60k+\" or \"NHS nurse London\".",
      } satisfies AISearchParams,
      { status: 200 },
    );
  }
}
