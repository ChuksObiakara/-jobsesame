import { NextResponse } from 'next/server';
import { createMessage } from '@/app/lib/anthropic-retry';

export interface SASearchParams {
  keywords: string;
  location: string;
  tab: 'all' | 'remote' | 'relocation' | 'teaching';
  reply: string;
}

const SYSTEM = `You are a job search assistant for Jobsesame, a South African job platform. Parse the user's natural language query into structured search parameters.

Respond ONLY with valid JSON — no prose, no markdown, no code fences. Schema:
{
  "keywords": "",     // job title, role, or skills — empty string if none
  "location": "",     // one of: "South Africa", "Nigeria", "Kenya", "United Kingdom", "United States", "Canada", "Australia", "India", "Singapore", "Dubai", "London", "Toronto", "Berlin", "Amsterdam", "Sydney" — empty string if worldwide
  "tab": "all",       // "all" | "remote" | "relocation" | "teaching"
  "reply": ""         // one warm, specific sentence summarising what you understood and will show
}

Tab rules:
- "remote" — user wants remote/work-from-home/WFH jobs
- "relocation" — user wants to move abroad, mentions a foreign country, visa, international
- "teaching" — user mentions teaching, teacher, English, ESL, TEFL, China, Korea, Japan, UAE teaching
- "all" — default for local/South African/unspecified jobs

Location rules:
- Only set location if clearly specified and matches one of the valid options
- "Cape Town", "Johannesburg", "Durban", "Pretoria" → "South Africa"
- "London", "UK", "Britain" → "United Kingdom" (or "London" for relocation tab)
- Remote jobs should have empty location

Examples:
User: "I want a React developer job in Cape Town"
→ {"keywords":"React developer","location":"South Africa","tab":"all","reply":"Showing you React developer roles in South Africa — sorted by best match."}

User: "Remote data scientist jobs"
→ {"keywords":"data scientist","location":"","tab":"remote","reply":"Showing remote data scientist roles worldwide you can work from anywhere."}

User: "I want to teach English in South Korea"
→ {"keywords":"English teacher","location":"","tab":"teaching","reply":"Showing you English teaching jobs in Asia — South Korea packages include free housing and $2,000–$2,800/month."}

User: "Software engineer jobs in London, I want to relocate"
→ {"keywords":"software engineer","location":"London","tab":"relocation","reply":"Showing software engineering relocation opportunities in London — visa sponsorship roles included."}`;

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query?.trim()) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    const message = await createMessage({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 250,
      system: SYSTEM,
      messages: [{ role: 'user', content: query.trim() }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text.trim();
    const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    const params: SASearchParams = JSON.parse(cleaned);

    return NextResponse.json(params);
  } catch (err) {
    console.error('[SA AI Search] Error:', err);
    return NextResponse.json(
      {
        keywords: '',
        location: '',
        tab: 'all',
        reply: "I couldn't parse that — try something like \"React developer Cape Town\" or \"remote data scientist\".",
      } satisfies SASearchParams,
      { status: 200 },
    );
  }
}
