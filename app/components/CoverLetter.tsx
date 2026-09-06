'use client';
import { useState, useEffect } from 'react';
import { INK, INK_SOFT, INK_FAINT, LINE, PAPER, ACCENT, CLAY, SERIF } from '../lib/theme';
import { downloadPdf } from '../lib/download-pdf-client';

interface Props {
  cvData: any;
  userName: string;
  onClose: () => void;
}

export default function CoverLetter({ cvData, userName, onClose }: Props) {
  const [isMobile, setIsMobile] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [generating, setGenerating] = useState(false);
  const [coverLetterText, setCoverLetterText] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  async function generate() {
    if (!jobTitle.trim()) { setError('Please enter the job title'); return; }
    setError('');
    setGenerating(true);
    setCoverLetterText('');
    try {
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvData,
          jobTitle,
          jobCompany: company,
          jobDescription,
          coverLetter: true,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Generation failed');
      setCoverLetterText(data.coverLetterText);
    } catch (err) {
      setError('Failed to generate cover letter. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  function downloadPDF() {
    downloadPdf(
      'cover-letter',
      {
        name: cvData.name || userName,
        email: cvData.email,
        phone: cvData.phone,
        location: cvData.location,
        bodyText: coverLetterText,
      },
      `cover-letter-${jobTitle.replace(/\s+/g, '-').toLowerCase()}.pdf`,
    );
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(coverLetterText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'center',
      zIndex: 1000, padding: isMobile ? 0 : '16px',
    }}>
      <div style={{
        background: '#fff', borderRadius: isMobile ? 0 : '4px', width: '100%', maxWidth: isMobile ? '100%' : '640px',
        maxHeight: '90vh', overflowY: 'auto', padding: isMobile ? '24px 18px' : '32px',
        height: isMobile ? '100dvh' : 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontFamily: SERIF, fontWeight: 500, fontSize: '20px', color: INK }}>AI Cover Letter</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer',
            color: INK_FAINT, lineHeight: 1,
          }}>×</button>
        </div>

        {!coverLetterText ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: INK_SOFT, marginBottom: '6px' }}>
                Job Title *
              </label>
              <input
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Software Engineer"
                style={{
                  width: '100%', padding: '10px 14px', border: `1px solid ${LINE}`,
                  borderRadius: '3px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: INK_SOFT, marginBottom: '6px' }}>
                Company Name
              </label>
              <input
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="e.g. Google"
                style={{
                  width: '100%', padding: '10px 14px', border: `1px solid ${LINE}`,
                  borderRadius: '3px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: INK_SOFT, marginBottom: '6px' }}>
                Job Description <span style={{ fontWeight: 400, color: INK_FAINT }}>(paste for best results)</span>
              </label>
              <textarea
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                rows={5}
                style={{
                  width: '100%', padding: '10px 14px', border: `1px solid ${LINE}`,
                  borderRadius: '3px', fontSize: '14px', outline: 'none', resize: 'vertical',
                  boxSizing: 'border-box', fontFamily: 'inherit',
                }}
              />
            </div>

            {error && <p style={{ color: CLAY, fontSize: '13px', margin: 0 }}>{error}</p>}

            <button
              onClick={generate}
              disabled={generating}
              style={{
                padding: '12px 24px', background: generating ? INK_FAINT : ACCENT,
                color: PAPER, border: 'none', borderRadius: '3px', fontSize: '14.5px',
                fontWeight: 600, cursor: generating ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              {generating ? (
                <>
                  <span style={{
                    width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite', display: 'inline-block',
                  }} />
                  Generating…
                </>
              ) : 'Generate Cover Letter'}
            </button>
          </div>
        ) : (
          <div>
            <div style={{
              background: PAPER, border: `1px solid ${LINE}`, borderRadius: '4px',
              padding: '24px', marginBottom: '20px',
            }}>
              <p style={{
                fontSize: '14px', lineHeight: '1.8', color: INK,
                whiteSpace: 'pre-wrap', margin: 0,
              }}>{coverLetterText}</p>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={downloadPDF}
                style={{
                  padding: '10px 20px', background: ACCENT, color: PAPER,
                  border: 'none', borderRadius: '3px', fontSize: '14px', fontWeight: 600,
                  cursor: 'pointer', flex: 1, minWidth: '140px',
                }}
              >
                Download PDF
              </button>
              <button
                onClick={copyToClipboard}
                style={{
                  padding: '10px 20px',
                  background: copied ? ACCENT : '#fff',
                  color: copied ? PAPER : INK,
                  border: `1px solid ${LINE}`,
                  borderRadius: '3px', fontSize: '14px', fontWeight: 600,
                  cursor: 'pointer', flex: 1, minWidth: '140px',
                  transition: 'all 0.2s',
                }}
              >
                {copied ? 'Copied!' : 'Copy Text'}
              </button>
              <button
                onClick={() => { setCoverLetterText(''); setJobTitle(''); setCompany(''); setJobDescription(''); }}
                style={{
                  padding: '10px 20px', background: '#fff', color: INK_SOFT,
                  border: `1px solid ${LINE}`, borderRadius: '3px', fontSize: '14px',
                  fontWeight: 600, cursor: 'pointer', flex: 1, minWidth: '140px',
                }}
              >
                Start Over
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
