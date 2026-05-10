import { NextRequest, NextResponse } from 'next/server';
import { createMessage } from '@/app/lib/anthropic-retry';
import { auth } from '@clerk/nextjs/server';

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

    // Credit check via Prisma — also accepts active UK subscription
    const { prisma } = await import('@/app/lib/prisma');
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { ukSubscription: true },
    });
    const hasUKSub = dbUser?.ukSubscription?.active === true;
    if (dbUser && !dbUser.isPro && !hasUKSub && dbUser.credits <= 0) {
      return NextResponse.json({ error: 'No credits remaining', paywall: true }, { status: 402 });
    }

    const body = await request.json();
    const { cvData, jobTitle, jobDescription, jobCompany, company, userPrompt, coverLetter, ukOptimise } = body;
    const resolvedCompany = company || jobCompany || 'the company';

    if (!cvData || !jobTitle) {
      return NextResponse.json({ error: 'Missing CV data or job title' }, { status: 400 });
    }

    // ── UK Optimise mode ──────────────────────────────────────────────────────
    if (ukOptimise) {
      const cvJson = JSON.stringify({
        name: cvData.name, title: cvData.title, location: cvData.location,
        email: cvData.email || '', phone: cvData.phone || '',
        summary: cvData.summary, skills: cvData.skills,
        experience_years: cvData.experience_years, education: cvData.education,
        languages: cvData.languages,
        experience: cvData.experience,
      });

      const response = await createMessage({
        model: 'claude-sonnet-4-6',
        max_tokens: 2500,
        messages: [{
          role: 'user',
          content: `You are an expert UK CV writer. Rewrite this CV specifically for a ${jobTitle} role at ${resolvedCompany}.

UK EMPLOYER RULES — FOLLOW EXACTLY:
1. Maximum 2 pages worth of content
2. Personal statement / summary at top, 3 sentences, British English spelling (organisation not organization, etc.)
3. Quantify every achievement where possible — use numbers, percentages, time saved
4. Extract the key skills and keywords from the job description and weave them into summary, skills list, and bullet points
5. NEVER change company names, job titles held, or dates — only rewrite bullets and summary
6. List 8-10 skills that match the job description most closely

JOB DETAILS:
Title: ${jobTitle}
Company: ${resolvedCompany}
Description: ${(jobDescription || '').substring(0, 1500)}

CANDIDATE CV:
${cvJson}

Return ONLY valid JSON, no markdown:
{
  "name": "unchanged",
  "title": "role-targeted title",
  "location": "unchanged",
  "email": "unchanged",
  "phone": "unchanged",
  "summary": "UK-optimised 3 sentence summary using British spelling",
  "skills": ["8 to 10 skills matching this job"],
  "experience_years": unchanged_number,
  "education": "unchanged",
  "languages": ["unchanged"],
  "experience": [{"title": "EXACT original title","company": "EXACT original company","duration": "unchanged","bullets": ["rewritten achievement with metric","rewritten achievement"]}],
  "changes": ["Rewrote summary for ${resolvedCompany} role", "Added N UK-relevant keywords", "Strengthened X experience with quantified results", "Applied British spelling throughout"]
}`,
        }],
      });

      const raw = response.content[0].type === 'text' ? response.content[0].text : '';
      const clean = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      const { changes, ...optimisedCV } = parsed;
      return NextResponse.json({ success: true, optimisedCV, changes: changes || [] });
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
    const response = await createMessage({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
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
Description: ${jobDescription || 'Not provided'}

${userPrompt ? `SPECIAL INSTRUCTIONS FROM CANDIDATE:\n${userPrompt}` : ''}

CANDIDATE CV:
Name: ${cvData.name}
Current Title: ${cvData.title}
Location: ${cvData.location}
Email: ${cvData.email || ''}
Phone: ${cvData.phone || ''}
Summary: ${cvData.summary}
Skills: ${Array.isArray(cvData.skills) ? cvData.skills.join(', ') : cvData.skills}
Experience: ${cvData.experience_years} years
Education: ${cvData.education}
Languages: ${Array.isArray(cvData.languages) ? cvData.languages.join(', ') : cvData.languages}
${cvData.experience ? `Previous roles: ${cvData.experience.map((e: any) => `${e.title} at ${e.company} (${e.duration})`).join('; ')}` : ''}

Return ONLY a valid JSON object with no markdown or extra text:
{
  "name": "${cvData.name}",
  "title": "rewritten job title targeting this specific role",
  "location": "${cvData.location}",
  "email": "${cvData.email || ''}",
  "phone": "${cvData.phone || ''}",
  "summary": "powerful 3 sentence summary targeting this specific job using candidate real background",
  "skills": ["most relevant skills for this job — list 8 to 10 — use candidate real skills"],
  "experience": [
    {
      "title": "EXACT job title candidate held — do not change",
      "company": "EXACT company name candidate worked at — do not change",
      "duration": "exact duration as provided",
      "location": "city if known",
      "bullets": ["rewritten achievement with metrics", "rewritten achievement with metrics", "rewritten achievement"]
    }
  ],
  "education": "${cvData.education}",
  "languages": ${JSON.stringify(cvData.languages)},
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

    const cleanText = content.text.replace(/```json|```/g, '').trim();
    const rewrittenCV = JSON.parse(cleanText);

    return NextResponse.json({
      success: true,
      rewrittenCV,
      message: 'CV rewritten successfully',
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to rewrite CV', details: String(error) },
      { status: 500 }
    );
  }
}
