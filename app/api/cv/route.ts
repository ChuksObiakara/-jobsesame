import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  console.log('CV API called');
  try {
    const formData = await request.formData();
    const file = formData.get('cv') as File;

    if (!file) {
      console.log('No file received');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    console.log('File received:', file.name, file.size, file.type);

    // Accept PDFs by extension too — Windows often sends application/octet-stream
    const isPdf = file.type === 'application/pdf' ||
                  file.type === 'application/octet-stream' ||
                  file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      return NextResponse.json({ error: 'Please upload a PDF file' }, { status: 400 });
    }

    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum 15MB.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');

    console.log('Base64 conversion done, length:', base64.length);

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    console.log('Calling Anthropic API...');

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
              text: 'Extract information from this CV and return ONLY valid JSON with no markdown or extra text. Use this exact structure: {"name":"full name","email":"email","phone":"phone","location":"city country","title":"current job title","summary":"2 sentence summary","skills":["skill1","skill2"],"experience_years":5,"education":"qualification","languages":["English"],"experience":[{"title":"exact job title","company":"exact company name","duration":"years","bullets":["achievement"]}],"job_search_keywords":["keyword1"]}',
            },
          ],
        },
      ],
    });

    console.log('Anthropic response received');

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic');
    }

    const cleanText = content.text.replace(/```json|```/g, '').trim();
    console.log('Clean text preview:', cleanText.substring(0, 100));

    const cvData = JSON.parse(cleanText);
    console.log('CV parsed successfully:', cvData.name);

    return NextResponse.json({
      success: true,
      cvData,
    });

  } catch (error: any) {
    console.error('CV upload error:', error?.message, error?.status, error?.error);

    // Specific error messages for known failure modes
    if (error?.message?.includes('not valid') || error?.message?.includes('invalid')) {
      return NextResponse.json(
        { error: 'Could not read this PDF. Try re-saving it or converting to PDF again.' },
        { status: 400 }
      );
    }
    if (error?.status === 401) {
      return NextResponse.json({ error: 'API key error. Contact support.' }, { status: 500 });
    }

    return NextResponse.json(
      { error: 'Failed to process CV. Please try again.', details: error?.message },
      { status: 500 }
    );
  }
}
