import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cvData, jobTitle, jobCompany } = body;

    if (!cvData) {
      return NextResponse.json({ error: 'No CV data provided' }, { status: 400 });
    }

    // Generate HTML for the CV
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a1a; padding: 32px; line-height: 1.5; }
  .header { border-bottom: 2px solid #052A14; padding-bottom: 16px; margin-bottom: 16px; }
  .name { font-size: 22px; font-weight: bold; color: #052A14; }
  .title { font-size: 13px; color: #2A6A3A; font-weight: 600; margin-top: 2px; }
  .contact { font-size: 10px; color: #555; margin-top: 6px; }
  .section { margin-bottom: 14px; }
  .section-title { font-size: 11px; font-weight: bold; color: #052A14; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #D0E8D0; padding-bottom: 3px; margin-bottom: 8px; }
  .summary { font-size: 11px; color: #333; line-height: 1.6; font-style: italic; }
  .skills { display: flex; flex-wrap: wrap; gap: 6px; }
  .skill { background: #EAF5EA; color: #1A5A2A; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 600; }
  .exp-item { margin-bottom: 10px; }
  .exp-title { font-weight: bold; font-size: 11px; color: #052A14; }
  .exp-company { font-size: 10px; color: #2A6A3A; font-weight: 600; }
  .exp-bullet { font-size: 10px; color: #444; padding-left: 12px; position: relative; margin-top: 2px; }
  .exp-bullet:before { content: "•"; position: absolute; left: 3px; color: #2A6A3A; }
  .keywords { background: #F4FCF4; border: 1px solid #C8E600; padding: 8px 12px; border-radius: 6px; margin-top: 10px; }
  .keywords-title { font-size: 9px; font-weight: bold; color: #5A7A00; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
  .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #D0E8D0; font-size: 9px; color: #888; text-align: center; }
</style>
</head>
<body>
<div class="header">
  <div class="name">${cvData.name || 'Your Name'}</div>
  <div class="title">${cvData.title || ''}</div>
  <div class="contact">${cvData.location || ''} ${cvData.email ? '| ' + cvData.email : ''} ${cvData.phone ? '| ' + cvData.phone : ''}</div>
</div>

${cvData.summary ? `
<div class="section">
  <div class="section-title">Professional Summary</div>
  <div class="summary">${cvData.summary}</div>
</div>` : ''}

${cvData.skills?.length ? `
<div class="section">
  <div class="section-title">Skills</div>
  <div class="skills">
    ${cvData.skills.map((s: string) => `<span class="skill">${s}</span>`).join('')}
  </div>
</div>` : ''}

${cvData.experience?.length ? `
<div class="section">
  <div class="section-title">Experience</div>
  ${cvData.experience.map((exp: any) => `
  <div class="exp-item">
    <div class="exp-title">${exp.title}</div>
    <div class="exp-company">${exp.company} | ${exp.duration}</div>
    ${exp.bullets?.map((b: string) => `<div class="exp-bullet">${b}</div>`).join('') || ''}
  </div>`).join('')}
</div>` : ''}

${cvData.education ? `
<div class="section">
  <div class="section-title">Education</div>
  <div style="font-size:11px;color:#333;">${cvData.education}</div>
</div>` : ''}

${cvData.languages?.length ? `
<div class="section">
  <div class="section-title">Languages</div>
  <div style="font-size:11px;color:#333;">${cvData.languages.join(' | ')}</div>
</div>` : ''}

${cvData.keywords_added?.length ? `
<div class="keywords">
  <div class="keywords-title">Optimised for: ${jobTitle} at ${jobCompany}</div>
  <div style="font-size:10px;color:#5A7A00;">${cvData.keywords_added.join(' · ')}</div>
</div>` : ''}

<div class="footer">CV optimised by Jobsesame AI · jobsesame.co.za · Match score: ${cvData.match_score || 0}% · ATS score: ${cvData.ats_score || 0}%</div>
</body>
</html>`;

    // Return HTML as a response that browser can print/save as PDF
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="CV_${(cvData.name || 'CV').replace(/\s+/g, '_')}_${(jobTitle || 'Job').replace(/\s+/g, '_')}.html"`,
      },
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate CV' }, { status: 500 });
  }
}
