import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('cv') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64,
              },
            },
            {
              type: 'text',
              text: `Extract information from this CV and return ONLY valid JSON with no other text or markdown.

CRITICAL: Copy company names, job titles, and dates EXACTLY as written in the CV — do not paraphrase, abbreviate, or improve them.

Return this exact shape:
{
  "name": "full name",
  "email": "email address",
  "phone": "phone number",
  "location": "city and country",
  "title": "most recent job title exactly as written",
  "summary": "2 sentence professional summary",
  "skills": ["skill1", "skill2"],
  "experience_years": 0,
  "experience": [
    {
      "title": "job title EXACTLY as written in CV",
      "company": "company name EXACTLY as written in CV",
      "duration": "dates/duration EXACTLY as written e.g. Jan 2020 – Mar 2023",
      "location": "city if mentioned",
      "bullets": ["responsibility or achievement as written"]
    }
  ],
  "education": "highest qualification",
  "languages": ["language1"],
  "job_search_keywords": ["keyword1", "keyword2", "keyword3"]
}`,
            },
          ],
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const cleanText = content.text.replace(/```json|```/g, '').trim();
    const cvData = JSON.parse(cleanText);

    return NextResponse.json({
      success: true,
      cvData,
      message: 'CV uploaded and analysed successfully',
    });

  } catch (error) {
    console.error('CV upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process CV', details: String(error) },
      { status: 500 }
    );
  }
}
