import { NextRequest, NextResponse } from 'next/server';
import { createMessage } from '@/app/lib/anthropic-retry';
import { auth } from '@clerk/nextjs/server';

function extractJSON(text: string): string {
  const stripped = text.replace(/```json|```/g, '').trim();
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start !== -1 && end > start) return stripped.slice(start, end + 1);
  return stripped;
}

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
function checkRateLimit(userId: string, maxRequests: number): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + 3600000 });
    return true;
  }
  if (userLimit.count >= maxRequests) return false;
  userLimit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!checkRateLimit(userId, 20)) {
      return NextResponse.json({ error: 'Rate limit exceeded. Try again in an hour.' }, { status: 429 });
    }

    // Credit check
    const { prisma } = await import('@/app/lib/prisma');
    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (dbUser && !dbUser.isPro && dbUser.credits <= 0) {
      return NextResponse.json({ error: 'No credits remaining', paywall: true }, { status: 402 });
    }

    const body = await request.json();
    const { cvData, jobTitle, jobDescription, jobCompany, company, userPrompt, coverLetter } = body;
    const resolvedCompany = company || jobCompany || 'the company';

    if (!cvData || !jobTitle) {
      return NextResponse.json({ error: 'Missing CV data or job title' }, { status: 400 });
    }

    // ── Cover letter mode ─────────────────────────────────────────────────────
    if (coverLetter) {
      const candidateSection = cvData
        ? `CANDIDATE:
Name: ${cvData.name || ''}
Current Title: ${cvData.title || ''}
Summary: ${cvData.summary || ''}
Skills: ${Array.isArray(cvData.skills) ? cvData.skills.join(', ') : (cvData.skills || '')}
Experience: ${cvData.experience_years ?? ''} years
${cvData.experience ? `Recent roles: ${cvData.experience.map((e: any) => `${e.title} at ${e.company} (${e.duration})`).join('; ')}` : ''}
Education: ${cvData.education || ''}`
        : '';

      const response = await createMessage({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: `Write a professional cover letter for a candidate applying to the role below.

RULES:
1. Exactly 3 paragraphs — no more, no less
2. Paragraph 1: Express genuine enthusiasm for the ${jobTitle} role at ${resolvedCompany} and briefly state why this candidate is a strong fit
3. Paragraph 2: Draw on the candidate's experience and skills to show how they meet the job requirements${cvData ? ' — use actual company names and achievements from the candidate section' : ''}
4. Paragraph 3: Confident call to action inviting the employer to schedule an interview
5. Do NOT invent experience or qualifications the candidate does not have
6. Do NOT use generic phrases like "I am writing to apply" — start paragraph 1 with impact
7. Return ONLY the cover letter text — no subject line, no "Dear Hiring Manager", no JSON, no markdown
${candidateSection ? `\n${candidateSection}` : ''}
JOB:
Title: ${jobTitle}
Company: ${resolvedCompany}
Description: ${jobDescription || 'Not provided'}`,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') throw new Error('Unexpected response type');

      return NextResponse.json({ success: true, coverLetterText: content.text.trim() });
    }

    // ── CV rewrite mode ───────────────────────────────────────────────────────
    const cvJson = JSON.stringify({
      name: cvData.name || '',
      title: cvData.title || '',
      location: cvData.location || '',
      email: cvData.email || '',
      phone: cvData.phone || '',
      summary: cvData.summary || '',
      skills: cvData.skills || [],
      experience_years: cvData.experience_years || 0,
      education: cvData.education || '',
      languages: cvData.languages || [],
      experience: cvData.experience || [],
    });

    const response = await createMessage({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `You are an expert CV writer. Rewrite this CV to be perfectly tailored for the job below.

CRITICAL RULES — YOU MUST FOLLOW THESE EXACTLY:
1. NEVER change, remove or replace real company names — keep every company name exactly as provided
2. NEVER change job titles from what the candidate actually held
3. NEVER change dates or durations
4. NEVER invent experience or qualifications the candidate does not have
5. ONLY rewrite bullet points, summary and skills to better match the job
6. Keep all real information — name, email, phone, location, education, languages exactly as provided
7. Make achievements more specific with metrics where possible but only based on what is already there

JOB DETAILS:
Title: ${jobTitle}
Company: ${resolvedCompany}
Description: ${(jobDescription || 'Not provided').substring(0, 1000)}
${userPrompt ? `\nSPECIAL INSTRUCTIONS FROM CANDIDATE:\n${userPrompt}` : ''}

CANDIDATE CV (JSON):
${cvJson}

Return ONLY a valid JSON object — no markdown, no code fences, no extra text:
{
  "name": "exact candidate name unchanged",
  "title": "rewritten job title targeting this specific role",
  "location": "exact candidate location unchanged",
  "email": "exact candidate email unchanged",
  "phone": "exact candidate phone unchanged",
  "summary": "powerful 3-sentence summary targeting this specific job using candidate real background",
  "skills": ["8 to 10 most relevant skills for this job drawn from candidate skills"],
  "experience": [
    {
      "title": "EXACT job title candidate held — do not change",
      "company": "EXACT company name — do not change",
      "duration": "exact duration unchanged",
      "location": "city if known",
      "bullets": ["rewritten achievement with metric", "rewritten achievement with metric", "rewritten achievement"]
    }
  ],
  "education": "exact education unchanged",
  "languages": ["exact languages unchanged"],
  "match_score": 85,
  "keywords_added": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "ats_score": 90
}`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    let rewrittenCV: any;
    try {
      rewrittenCV = JSON.parse(extractJSON(content.text));
    } catch (parseErr) {
      console.error('[rewrite] JSON parse failed. Raw length:', content.text.length, 'First 300 chars:', content.text.substring(0, 300));
      throw new Error(`CV rewrite returned invalid data. Claude responded: "${content.text.substring(0, 120).replace(/\n/g, ' ')}"`);
    }

    return NextResponse.json({
      success: true,
      rewrittenCV,
      message: 'CV rewritten successfully',
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[rewrite] outer catch:', msg, error);
    return NextResponse.json(
      { error: msg || 'Failed to rewrite CV', details: String(error) },
      { status: 500 }
    );
  }
}
