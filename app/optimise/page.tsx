'use client';
import { useState } from 'react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { INK, INK_SOFT, INK_FAINT, LINE, PAPER, CARD, ACCENT, CLAY, SERIF, SANS } from '../lib/theme';
import { captureClient } from '../lib/posthog-client';
import { ANALYTICS_EVENTS } from '../lib/analytics-events';
import { downloadPdf } from '../lib/download-pdf-client';

interface CVExperience {
  title?: string;
  company?: string;
  duration?: string;
  bullets?: string[];
}

interface RewrittenCV {
  name?: string;
  title?: string;
  location?: string;
  email?: string;
  phone?: string;
  summary?: string;
  skills?: string[];
  keywords_added?: string[];
  experience?: CVExperience[];
  education?: string;
  languages?: string[];
  match_score?: number;
  ats_score?: number;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', border: `1px solid ${LINE}`, borderRadius: 3,
  fontSize: 14, color: INK, background: CARD, outline: 'none', fontFamily: SANS, boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = { fontSize: 12, color: INK_SOFT, fontWeight: 600, display: 'block', marginBottom: 6 };

export default function OptimisePage() {
  const [step, setStep] = useState<'input' | 'uploading' | 'rewriting' | 'result'>('input');
  const [jobTitle, setJobTitle] = useState('');
  const [jobCompany, setJobCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [rewrittenCV, setRewrittenCV] = useState<RewrittenCV | null>(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.type === 'application/octet-stream' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) { setError('Please upload a PDF file only'); return; }
    if (!jobTitle) { setError('Please enter the job title first'); return; }
    if (!jobDescription) { setError('Please paste the job description first'); return; }

    setStep('uploading');
    setError('');

    try {
      const formData = new FormData();
      formData.append('cv', file);
      const cvResponse = await fetch('/api/cv', { method: 'POST', body: formData });
      const cvData = await cvResponse.json();

      if (!cvData.success) {
        setError(cvData.error || 'Failed to read CV');
        setStep('input');
        return;
      }

      setStep('rewriting');

      const rewriteResponse = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvData: cvData.cvData,
          jobTitle,
          jobCompany,
          jobDescription,
          userPrompt,
        }),
      });

      const rewriteData = await rewriteResponse.json();

      if (rewriteData.success) {
        setRewrittenCV(rewriteData.rewrittenCV);
        setStep('result');
      } else {
        setError(rewriteData.error || 'Failed to rewrite CV');
        setStep('input');
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setStep('input');
    }
  };

  const downloadPDF = () => {
    if (!rewrittenCV) return;
    setDownloading(true);
    try {
      const fileName = `${(rewrittenCV.name || 'CV').replace(/\s+/g, '_')}_CV_for_${(jobCompany || jobTitle).replace(/\s+/g, '_')}.pdf`;
      downloadPdf('cv', rewrittenCV, fileName);
      // Only the entry point is sent — never the filename (contains the name).
      captureClient(ANALYTICS_EVENTS.CV_DOWNLOADED, { source: 'optimise_page' });
    } catch {
      setError('PDF download failed. Please try again.');
    } finally {
      setTimeout(() => setDownloading(false), 600);
    }
  };

  return (
    <main style={{ fontFamily: SANS, background: PAPER, color: INK, minHeight: '100vh' }}>
      <Nav theme="light" />

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 64px' }}>

        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: INK_FAINT, marginBottom: 16 }}>AI CV Optimiser</p>
          <h1 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 32, lineHeight: 1.2, marginBottom: 12 }}>
            Found a job anywhere? Let AI tailor your CV to it.
          </h1>
          <p style={{ fontSize: 14.5, color: INK_SOFT, lineHeight: 1.7, maxWidth: 520, margin: '0 auto' }}>
            Found a job on LinkedIn, Indeed, a recruiter email, or anywhere else? Paste the job description, upload your CV, and AI rewrites it in about 30 seconds.
          </p>
        </div>

        {step === 'input' && (
          <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 4, padding: 28 }}>

            <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={labelStyle}>Job title *</label>
                <input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="e.g. Senior Project Manager" style={inputStyle} />
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={labelStyle}>Company name</label>
                <input value={jobCompany} onChange={e => setJobCompany(e.target.value)} placeholder="e.g. Standard Bank" style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Job description * <span style={{ color: INK_FAINT, fontWeight: 400 }}>— paste the full job description here</span></label>
              <textarea
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here. The more detail you provide the better AI can tailor your CV..."
                rows={8}
                style={{ ...inputStyle, fontSize: 13, resize: 'vertical', lineHeight: 1.6 }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Special instructions <span style={{ color: INK_FAINT, fontWeight: 400 }}>(optional)</span></label>
              <textarea
                value={userPrompt}
                onChange={e => setUserPrompt(e.target.value)}
                placeholder="e.g. Make it more senior, emphasise my leadership experience, keep it under one page..."
                rows={2}
                style={{ ...inputStyle, fontSize: 13, resize: 'vertical' }}
              />
            </div>

            <div style={{ background: PAPER, borderRadius: 4, padding: 28, textAlign: 'center', border: `1px dashed rgba(28,26,22,0.22)` }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={INK_FAINT} strokeWidth="1.4" style={{ margin: '0 auto 12px' }}><path d="M12 3v12" strokeLinecap="round" /><path d="M7 8l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" /></svg>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Upload your CV</div>
              <div style={{ fontSize: 12.5, color: INK_FAINT, marginBottom: 18 }}>PDF only — AI reads it and rewrites it for this job</div>
              <label
                style={{ cursor: 'pointer' }}
                onClick={e => {
                  if (!jobTitle || !jobDescription) {
                    e.preventDefault();
                    setError('Please fill in the job title and job description above before uploading your CV.');
                  } else {
                    setError('');
                  }
                }}
              >
                <input type="file" accept=".pdf" onChange={handleFileUpload} style={{ display: 'none' }} />
                <span style={{ background: ACCENT, color: PAPER, fontSize: 13.5, fontWeight: 600, padding: '12px 28px', borderRadius: 3, display: 'inline-block' }}>
                  Choose CV and optimise now
                </span>
              </label>
            </div>

            {error && (
              <div style={{ background: 'rgba(168,92,64,0.08)', border: `1px solid rgba(168,92,64,0.3)`, borderRadius: 3, padding: '10px 16px', fontSize: 13, color: CLAY, marginTop: 16 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 16, marginTop: 24, paddingTop: 24, borderTop: `1px solid ${LINE}`, flexWrap: 'wrap' }}>
              {[['Paste from anywhere', 'LinkedIn, Indeed, email, WhatsApp, anywhere'], ['AI rewrites in 30s', 'Tailored specifically for this role'], ['Downloads as PDF', 'Clean professional CV ready to send']].map(([title, desc]) => (
                <div key={title} style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 3 }}>{title}</div>
                  <div style={{ fontSize: 11.5, color: INK_FAINT, lineHeight: 1.5 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(step === 'uploading' || step === 'rewriting') && (
          <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 4, padding: 48, textAlign: 'center' }}>
            <div style={{ width: 32, height: 32, border: `2px solid ${LINE}`, borderTop: `2px solid ${ACCENT}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 20, marginBottom: 8 }}>
              {step === 'uploading' ? 'Reading your CV…' : 'AI is tailoring your CV…'}
            </h2>
            <p style={{ fontSize: 13.5, color: INK_SOFT, marginBottom: 8 }}>
              {step === 'uploading' ? 'Extracting your experience and skills' : `Tailoring specifically for ${jobTitle} at ${jobCompany || 'this company'}`}
            </p>
            {userPrompt && step === 'rewriting' && (
              <div style={{ background: PAPER, borderRadius: 3, padding: '8px 14px', marginTop: 12, fontSize: 12, color: ACCENT, fontStyle: 'italic', display: 'inline-block' }}>
                Following: &ldquo;{userPrompt}&rdquo;
              </div>
            )}
            <div style={{ fontSize: 12, color: INK_FAINT, marginTop: 16, fontStyle: 'italic' }}>About 15 to 30 seconds</div>
          </div>
        )}

        {step === 'result' && rewrittenCV && (
          <div>
            <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 4, padding: 20, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 600 }}>CV tailored for {jobTitle} {jobCompany ? `at ${jobCompany}` : ''}</div>
                <div style={{ fontSize: 12.5, color: INK_SOFT, marginTop: 2 }}>Match score: {rewrittenCV.match_score}% &middot; ATS score: {rewrittenCV.ats_score}%</div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={downloadPDF}
                  disabled={downloading}
                  style={{ background: ACCENT, color: PAPER, fontSize: 13, fontWeight: 600, padding: '10px 20px', borderRadius: 3, border: 'none', cursor: downloading ? 'default' : 'pointer', opacity: downloading ? 0.7 : 1 }}>
                  {downloading ? 'Preparing…' : 'Download PDF'}
                </button>
                <button
                  onClick={() => { setStep('input'); setRewrittenCV(null); setJobTitle(''); setJobCompany(''); setJobDescription(''); setUserPrompt(''); }}
                  style={{ background: 'transparent', color: INK, fontSize: 13, fontWeight: 600, padding: '10px 16px', borderRadius: 3, border: `1px solid ${INK}`, cursor: 'pointer' }}>
                  Optimise another CV
                </button>
              </div>
            </div>

            <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 4, padding: 28 }}>
              <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 22, marginBottom: 4 }}>{rewrittenCV.name}</h2>
              <div style={{ fontSize: 14, color: ACCENT, fontWeight: 600, marginBottom: 2 }}>{rewrittenCV.title}</div>
              <div style={{ fontSize: 12.5, color: INK_FAINT, marginBottom: 20 }}>{rewrittenCV.location}</div>

              {rewrittenCV.summary && (
                <div style={{ marginBottom: 22 }}>
                  <div style={{ fontSize: 11, color: INK_FAINT, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, paddingBottom: 6, borderBottom: `1px solid ${LINE}` }}>Professional Summary</div>
                  <p style={{ fontSize: 13.5, color: INK_SOFT, lineHeight: 1.7, fontStyle: 'italic' }}>{rewrittenCV.summary}</p>
                </div>
              )}

              {rewrittenCV.skills && rewrittenCV.skills.length > 0 && (
                <div style={{ marginBottom: 22 }}>
                  <div style={{ fontSize: 11, color: INK_FAINT, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, paddingBottom: 6, borderBottom: `1px solid ${LINE}` }}>Skills</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {rewrittenCV.skills.map((skill: string) => (
                      <span key={skill} style={{ background: PAPER, border: `1px solid ${LINE}`, color: INK_SOFT, fontSize: 11.5, padding: '4px 11px', borderRadius: 99, fontWeight: 500 }}>{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {rewrittenCV.keywords_added && rewrittenCV.keywords_added.length > 0 && (
                <div style={{ marginBottom: 22 }}>
                  <div style={{ fontSize: 11, color: INK_FAINT, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, paddingBottom: 6, borderBottom: `1px solid ${LINE}` }}>Keywords added for ATS</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {rewrittenCV.keywords_added.map((kw: string) => (
                      <span key={kw} style={{ background: 'rgba(63,93,82,0.07)', color: ACCENT, fontSize: 11.5, padding: '4px 11px', borderRadius: 99, fontWeight: 600, border: '1px solid rgba(63,93,82,0.2)' }}>{kw}</span>
                    ))}
                  </div>
                </div>
              )}

              {rewrittenCV.experience?.map((exp, i) => (
                <div key={i} style={{ marginBottom: 14, padding: 16, background: PAPER, borderRadius: 3 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 2 }}>{exp.title}</div>
                  <div style={{ fontSize: 12, color: ACCENT, marginBottom: 8 }}>{exp.company} &middot; {exp.duration}</div>
                  {exp.bullets?.map((bullet: string, j: number) => (
                    <div key={j} style={{ fontSize: 12.5, color: INK_SOFT, lineHeight: 1.7, paddingLeft: 14, position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 3, color: ACCENT }}>&middot;</span>{bullet}
                    </div>
                  ))}
                </div>
              ))}

              {rewrittenCV.education && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: INK_FAINT, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, paddingBottom: 6, borderBottom: `1px solid ${LINE}` }}>Education</div>
                  <div style={{ fontSize: 13.5, color: INK_SOFT }}>{rewrittenCV.education}</div>
                </div>
              )}

              {rewrittenCV.languages && rewrittenCV.languages.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: INK_FAINT, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6, paddingBottom: 6, borderBottom: `1px solid ${LINE}` }}>Languages</div>
                  <div style={{ fontSize: 13.5, color: INK_SOFT }}>{rewrittenCV.languages.join('  |  ')}</div>
                </div>
              )}
            </div>

            <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 4, padding: 20, marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Want unlimited CV optimisations?</div>
                <div style={{ fontSize: 12.5, color: INK_SOFT }}>Go Pro for R249/month — unlimited optimisations, cover letters, and priority support.</div>
              </div>
              <a href="/sign-up" style={{ background: ACCENT, color: PAPER, fontSize: 13, fontWeight: 600, padding: '10px 22px', borderRadius: 3, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                Unlock Pro
              </a>
            </div>
          </div>
        )}
      </div>
      <Footer theme="light" />
    </main>
  );
}
