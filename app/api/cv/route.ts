import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  console.log('CV API called');
  try {
    const formData = await request.formData();
    const file = formData.get('cv') as File;

    if (!file) {
      console.error('CV API error: no file in request');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    console.log('File received:', file.name, 'size:', file.size, 'type:', file.type);

    if (file.type !== 'application/pdf') {
      console.error('CV API error: wrong file type:', file.type);
      return NextResponse.json({ error: 'Please upload a PDF file' }, { status: 400 });
    }

    console.log('Converting to base64...');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    console.log('Base64 length:', base64.length);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('CV API error: ANTHROPIC_API_KEY not set');
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const client = new Anthropic({ apiKey });

    console.log('Calling Anthropic API with model claude-sonnet-4-6...');
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
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
            } as any,
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

    console.log('Anthropic response received, stop_reason:', response.stop_reason);

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error(`Unexpected response type: ${content.type}`);
    }

    console.log('Parsing CV JSON...');
    const cleanText = content.text.replace(/```json|```/g, '').trim();
    const cvData = JSON.parse(cleanText);

    console.log('CV API success — extracted name:', cvData.name);
    return NextResponse.json({
      success: true,
      cvData,
      message: 'CV uploaded and analysed successfully',
    });

  } catch (error: any) {
    console.error('CV upload error — full error object:', error);
    console.error('CV upload error — message:', error?.message);
    console.error('CV upload error — status:', error?.status);
    console.error('CV upload error — stringified:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return NextResponse.json(
      { error: 'Failed to process CV', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
