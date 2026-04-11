import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cvData, jobTitle, jobDescription, jobCompany } = body;

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
          content: `You are an expert CV writer. Rewrite this CV to be perfectly tailored for the following job.

JOB DETAILS:
Title: ${jobTitle}
Company: ${jobCompany || 'the company'}
Description: ${jobDescription || 'Not provided'}

CANDIDATE CV DATA:
Name: ${cvData.name}
Current Title: ${cvData.title}
Location: ${cvData.location}
Summary: ${cvData.summary}
Skills: ${cvData.skills?.join(', ')}
Experience: ${cvData.experience_years} years
Education: ${cvData.education}
Languages: ${cvData.languages?.join(', ')}

Return ONLY a JSON object with no markdown or extra text:
{
  "name": "${cvData.name}",
  "title": "rewritten job title targeting this role",
  "location": "${cvData.location}",
  "summary": "powerful 3 sentence summary targeting this specific job",
  "skills": ["most relevant skills for this job - list 8-10"],
  "experience": [
    {
      "title": "job title",
      "company": "company name",
      "duration": "years",
      "bullets": ["achievement 1 with metrics", "achievement 2 with metrics", "achievement 3"]
    }
  ],
  "education": "${cvData.education}",
  "languages": ${JSON.stringify(cvData.languages)},
  "match_score": 85,
  "keywords_added": ["keyword1", "keyword2", "keyword3"],
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