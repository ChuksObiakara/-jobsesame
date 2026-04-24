'use client';
import { useState } from 'react';

interface Props {
  cvData: any;
  userName: string;
  onClose: () => void;
}

export default function CoverLetter({ cvData, userName, onClose }: Props) {
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [generating, setGenerating] = useState(false);
  const [coverLetterText, setCoverLetterText] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

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

  async function downloadPDF() {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;

    // Header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(cvData.name || userName, margin, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const contactParts = [cvData.email, cvData.phone, cvData.location].filter(Boolean);
    doc.text(contactParts.join('  |  '), margin, 27);

    // Divider
    doc.setDrawColor(180, 180, 180);
    doc.line(margin, 31, pageWidth - margin, 31);

    // Body
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(coverLetterText, maxWidth);
    doc.text(lines, margin, 40);

    doc.save(`cover-letter-${jobTitle.replace(/\s+/g, '-').toLowerCase()}.pdf`);
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
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: '16px',
    }}>
      <div style={{
        background: '#fff', borderRadius: '16px', width: '100%', maxWidth: '640px',
        maxHeight: '90vh', overflowY: 'auto', padding: '32px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1a1a2e' }}>AI Cover Letter</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer',
            color: '#666', lineHeight: 1,
          }}>×</button>
        </div>

        {!coverLetterText ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#444', marginBottom: '6px' }}>
                Job Title *
              </label>
              <input
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Software Engineer"
                style={{
                  width: '100%', padding: '10px 14px', border: '1.5px solid #e0e0e0',
                  borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#444', marginBottom: '6px' }}>
                Company Name
              </label>
              <input
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="e.g. Google"
                style={{
                  width: '100%', padding: '10px 14px', border: '1.5px solid #e0e0e0',
                  borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#444', marginBottom: '6px' }}>
                Job Description <span style={{ fontWeight: 400, color: '#999' }}>(paste for best results)</span>
              </label>
              <textarea
                value={jobDescription}
                onChange={e => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                rows={5}
                style={{
                  width: '100%', padding: '10px 14px', border: '1.5px solid #e0e0e0',
                  borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'vertical',
                  boxSizing: 'border-box', fontFamily: 'inherit',
                }}
              />
            </div>

            {error && <p style={{ color: '#e53e3e', fontSize: '13px', margin: 0 }}>{error}</p>}

            <button
              onClick={generate}
              disabled={generating}
              style={{
                padding: '12px 24px', background: generating ? '#a0a0a0' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px',
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
              background: '#f8f9ff', border: '1px solid #e0e4ff', borderRadius: '12px',
              padding: '24px', marginBottom: '20px',
            }}>
              <p style={{
                fontSize: '14px', lineHeight: '1.8', color: '#2d3748',
                whiteSpace: 'pre-wrap', margin: 0,
              }}>{coverLetterText}</p>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={downloadPDF}
                style={{
                  padding: '10px 20px', background: '#1a1a2e', color: '#fff',
                  border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                  cursor: 'pointer', flex: 1, minWidth: '140px',
                }}
              >
                Download PDF
              </button>
              <button
                onClick={copyToClipboard}
                style={{
                  padding: '10px 20px',
                  background: copied ? '#38a169' : '#fff',
                  color: copied ? '#fff' : '#1a1a2e',
                  border: '1.5px solid #e0e0e0',
                  borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                  cursor: 'pointer', flex: 1, minWidth: '140px',
                  transition: 'all 0.2s',
                }}
              >
                {copied ? 'Copied!' : 'Copy Text'}
              </button>
              <button
                onClick={() => { setCoverLetterText(''); setJobTitle(''); setCompany(''); setJobDescription(''); }}
                style={{
                  padding: '10px 20px', background: '#fff', color: '#666',
                  border: '1.5px solid #e0e0e0', borderRadius: '8px', fontSize: '14px',
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
