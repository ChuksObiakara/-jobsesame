import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cvData, jobTitle, jobDescription, jobCompany, userPrompt } = body;

    if (!cvData || !jobTitle) {
      return NextResponse.json({ error: 'Missing CV data or job title' }, { status: 400 });
    }

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
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
Company: ${jobCompany || 'the company'}
Description: ${jobDescription || 'Not provided'}

${userPrompt ? `SPECIAL INSTRUCTIONS FROM CANDIDATE:
${userPrompt}` : ''}

CANDIDATE CV:
Name: ${cvData.name}
Current Title: ${cvData.title}
Location: ${cvData.location}
Email: ${cvData.email || ''}
Phone: ${cvData.phone || ''}
Summary: ${cvData.summary}
Skills: ${cvData.skills?.join(', ')}
Experience: ${cvData.experience_years} years
Education: ${cvData.education}
Languages: ${cvData.languages?.join(', ')}

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
    console.error('CV rewrite error:', error);
    return NextResponse.json(
      { error: 'Failed to rewrite CV', details: String(error) },
      { status: 500 }
    );
  }
}
