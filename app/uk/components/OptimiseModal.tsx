'use client';
import { useState, useEffect } from 'react';

export interface OptimiseJob {
  id?: string;
  title: string;
  company: string;
  description?: string;
  url?: string;
  applyUrl?: string;
  applyType?: 'greenhouse' | 'direct';
}

interface Props {
  job: OptimiseJob;
  cvData: any;
  sub: { active: boolean; plan: string | null; credits?: number } | null;
  onClose: () => void;
}

const LOADING_MSGS = [
  'Analysing job requirements...',
  'Matching your experience to this role...',
  'Rewriting your CV for {company}...',
  'Applying UK employer formatting...',
  'Almost done...',
];

const ACCENT = '#C8E600';

function storageKey(job: OptimiseJob) {
  return `jobsesame_uk_optimised_cv_${job.id || job.title.replace(/\s+/g, '_').toLowerCase()}`;
}

function saveToStorage(job: OptimiseJob, optimisedCV: any) {
  try {
    localStorage.setItem(storageKey(job), JSON.stringify({
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      optimisedCV,
    }));
  } catch {}
}

export default function OptimiseModal({ job, cvData, sub: subProp, onClose }: Props) {
  const [step, setStep] = useState<'confirm' | 'loading' | 'result'>('confirm');
  const [optimisedCV, setOptimisedCV] = useState<any>(null);
  const [changes, setChanges] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [msgIdx, setMsgIdx] = useState(0);
  const [msgVisible, setMsgVisible] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applyDone, setApplyDone] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (step !== 'loading') return;
    let i = 0;
    const tick = () => {
      setMsgVisible(false);
      setTimeout(() => {
        i = (i + 1) % LOADING_MSGS.length;
        setMsgIdx(i);
        setMsgVisible(true);
      }, 280);
    };
    const interval = setInterval(tick, 2200);
    return () => clearInterval(interval);
  }, [step]);

  const optimise = async () => {
    setStep('loading');
    setError('');
    try {
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvData,
          jobTitle: job.title,
          company: job.company,
          jobDescription: job.description || '',
          ukOptimise: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Optimisation failed');
      setOptimisedCV(data.optimisedCV);
      setChanges(data.changes || []);
      // Save immediately so the CV is not lost if the user navigates away to subscribe
      saveToStorage(job, data.optimisedCV);
      setStep('result');
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.');
      setStep('confirm');
    }
  };

  const downloadPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const margin = 18;
    const maxW = 210 - margin * 2;
    let y = margin;

    const line = (text: string, size: number, bold = false, rgb: [number, number, number] = [230, 230, 230]) => {
      doc.setFontSize(size);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setTextColor(...rgb);
      const lines = doc.splitTextToSize(String(text || ''), maxW);
      lines.forEach((l: string) => {
        if (y > 272) { doc.addPage(); doc.setFillColor(5, 42, 20); doc.rect(0, 0, 210, 297, 'F'); y = margin; }
        doc.text(l, margin, y);
        y += size * 0.44;
      });
      y += 2.5;
    };

    doc.setFillColor(5, 42, 20);
    doc.rect(0, 0, 210, 297, 'F');

    const cv = optimisedCV;
    line(cv.name || cvData?.name || '', 20, true, [200, 230, 0]);
    line(cv.title || '', 13, false, [190, 210, 160]);
    line(`Optimised for: ${job.title} at ${job.company}`, 9, false, [140, 170, 100]);
    y += 3;
    line('PROFESSIONAL SUMMARY', 8, true, [200, 230, 0]);
    line(cv.summary || '', 11, false, [215, 215, 215]);
    y += 2;
    line('KEY SKILLS', 8, true, [200, 230, 0]);
    line((cv.skills || []).join('  ·  '), 10, false, [215, 215, 215]);
    y += 2;
    if (cv.experience?.length) {
      line('EXPERIENCE', 8, true, [200, 230, 0]);
      cv.experience.forEach((exp: any) => {
        y += 1;
        line(`${exp.title} — ${exp.company}  (${exp.duration})`, 11, true, [255, 255, 255]);
        (exp.bullets || []).forEach((b: string) => line(`• ${b}`, 10, false, [200, 200, 200]));
      });
    }
    if (cv.education) { y += 2; line('EDUCATION', 8, true, [200, 230, 0]); line(cv.education, 11); }

    doc.save(`${(cvData?.name || 'CV').replace(/\s+/g, '_')}_${job.company.replace(/\s+/g, '_')}_optimised.pdf`);
  };

  const applyWithCV = async () => {
    setApplying(true);
    setError('');
    try {
      // Always fetch live subscription status — prop may be stale
      const subRes = await fetch('/api/uk/subscription');
      const subData = await subRes.json();

      if (!subData.active) {
        // CV already saved to localStorage in optimise(); ensure it's there
        saveToStorage(job, optimisedCV);
        setShowUpgrade(true);
        setApplying(false);
        return;
      }

      const res = await fetch('/api/auto-apply/uk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobUrl: job.applyUrl || job.url,
          jobTitle: job.title,
          company: job.company,
          applyType: job.applyType || 'direct',
          userCV: { ...cvData, ...optimisedCV },
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) { setApplyDone(true); }
      else setError(data.error || 'Application failed. Try again.');
    } catch { setError('Network error. Try again.'); }
    setApplying(false);
  };

  const msg = LOADING_MSGS[msgIdx].replace('{company}', job.company);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.86)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: "'Plus Jakarta Sans',sans-serif" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        @keyframes omFadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes omSpin{to{transform:rotate(360deg)}}
        @keyframes omMsgIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes omMsgOut{from{opacity:1}to{opacity:0}}
        @keyframes omBar{from{width:0%}to{width:100%}}
        @keyframes omUpgradeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      <div style={{ background: '#0A2E18', border: '1.5px solid rgba(200,230,0,0.22)', borderRadius: 22, padding: '32px 28px', maxWidth: 600, width: '100%', maxHeight: '92vh', overflowY: 'auto', position: 'relative', animation: 'omFadeUp 0.3s ease-out' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 16, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>

        {/* ── STEP 1: Confirm ─────────────────────────────────────── */}
        {step === 'confirm' && (
          <div>
            <div style={{ fontSize: 10, color: ACCENT, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 10 }}>✦ Optimise CV for this Role</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 3, lineHeight: 1.25 }}>{job.title}</h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 22 }}>{job.company}</p>
            <div style={{ background: 'rgba(200,230,0,0.05)', border: '1px solid rgba(200,230,0,0.14)', borderRadius: 14, padding: '16px 18px', marginBottom: 22 }}>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, margin: 0 }}>
                AI will rewrite your CV specifically for this role at <strong style={{ color: ACCENT }}>{job.company}</strong> — UK format, British spelling, quantified achievements, and keywords extracted from the job description.
              </p>
            </div>
            {!cvData && (
              <div style={{ background: 'rgba(255,100,100,0.06)', border: '1px solid rgba(255,100,100,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: 'rgba(255,160,160,0.9)', marginBottom: 16 }}>
                ⚠ No CV found — <a href="/uk/dashboard" style={{ color: ACCENT, textDecoration: 'none', fontWeight: 700 }}>upload your CV first</a>
              </div>
            )}
            {error && <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#FF8080', marginBottom: 16 }}>{error}</div>}
            <button
              onClick={optimise}
              disabled={!cvData}
              style={{ width: '100%', background: cvData ? ACCENT : 'rgba(200,230,0,0.2)', color: '#052A14', fontSize: 15, fontWeight: 800, padding: '14px', borderRadius: 99, border: 'none', cursor: cvData ? 'pointer' : 'not-allowed' }}
            >
              ✦ Optimise My CV
            </button>
          </div>
        )}

        {/* ── STEP 2: Loading ─────────────────────────────────────── */}
        {step === 'loading' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ width: 58, height: 58, border: '3px solid rgba(200,230,0,0.15)', borderTopColor: ACCENT, borderRadius: '50%', animation: 'omSpin 0.85s linear infinite', margin: '0 auto 26px' }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8, minHeight: 24, animation: msgVisible ? 'omMsgIn 0.28s ease-out' : 'omMsgOut 0.22s ease-in' }}>
              {msg}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', marginBottom: 30 }}>Usually takes 10–20 seconds</div>
            <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden', maxWidth: 300, margin: '0 auto' }}>
              <div style={{ height: '100%', background: ACCENT, borderRadius: 99, animation: 'omBar 18s linear forwards' }} />
            </div>
          </div>
        )}

        {/* ── STEP 3: Results ─────────────────────────────────────── */}
        {step === 'result' && optimisedCV && (
          <div>
            {applyDone ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Application sent!</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>Applied to <strong style={{ color: ACCENT }}>{job.title}</strong> at <strong style={{ color: ACCENT }}>{job.company}</strong> with your optimised CV.</p>
                <button onClick={onClose} style={{ marginTop: 24, background: 'rgba(200,230,0,0.1)', border: '1px solid rgba(200,230,0,0.25)', color: ACCENT, fontSize: 13, fontWeight: 700, padding: '10px 28px', borderRadius: 99, cursor: 'pointer' }}>Close</button>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 10, color: ACCENT, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 14 }}>✦ CV Optimised for {job.company}</div>

                {/* Before / After panels */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px' }}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Your current CV</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65 }}>{cvData?.summary || 'No summary on file.'}</div>
                    {cvData?.skills?.length > 0 && (
                      <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {(cvData.skills as string[]).slice(0, 6).map((s: string) => (
                          <span key={s} style={{ fontSize: 9, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)', borderRadius: 4, padding: '2px 6px' }}>{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ background: 'rgba(200,230,0,0.04)', border: '1.5px solid rgba(200,230,0,0.22)', borderRadius: 14, padding: '14px' }}>
                    <div style={{ fontSize: 9, color: ACCENT, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>Optimised for {job.company}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.72)', lineHeight: 1.65 }}>{optimisedCV.summary}</div>
                    {optimisedCV.skills?.length > 0 && (
                      <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {(optimisedCV.skills as string[]).slice(0, 6).map((s: string) => (
                          <span key={s} style={{ fontSize: 9, background: 'rgba(200,230,0,0.1)', color: ACCENT, borderRadius: 4, padding: '2px 6px' }}>{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* What changed */}
                {changes.length > 0 && (
                  <div style={{ background: 'rgba(200,230,0,0.04)', border: '1px solid rgba(200,230,0,0.12)', borderRadius: 12, padding: '12px 16px', marginBottom: 16 }}>
                    <div style={{ fontSize: 9, color: ACCENT, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>What changed</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {changes.map((c, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                          <span style={{ color: ACCENT, fontWeight: 800, flexShrink: 0, lineHeight: 1.5 }}>✓</span>{c}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {error && <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#FF8080', marginBottom: 14 }}>{error}</div>}

                {/* ── Inline upgrade prompt (replaces apply button when not subscribed) */}
                {showUpgrade ? (
                  <div style={{ background: 'rgba(200,230,0,0.05)', border: '1.5px solid rgba(200,230,0,0.22)', borderRadius: 16, padding: '22px 20px', animation: 'omUpgradeIn 0.3s ease-out' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 6, lineHeight: 1.3 }}>
                      Your optimised CV is ready — subscribe to send it to <span style={{ color: ACCENT }}>{job.company}</span>
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 18 }}>
                      Your optimised CV will be saved and ready to use after subscribing
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                      <a
                        href="/uk/subscribe?plan=credits"
                        style={{ display: 'block', background: ACCENT, color: '#052A14', fontSize: 13, fontWeight: 800, padding: '13px 10px', borderRadius: 99, textDecoration: 'none', textAlign: 'center' }}
                      >
                        Get 20 Credits — £10
                      </a>
                      <a
                        href="/uk/subscribe?plan=pro"
                        style={{ display: 'block', background: 'rgba(200,230,0,0.1)', border: '1.5px solid rgba(200,230,0,0.3)', color: ACCENT, fontSize: 13, fontWeight: 800, padding: '13px 10px', borderRadius: 99, textDecoration: 'none', textAlign: 'center' }}
                      >
                        Go Pro — £21/month
                      </a>
                    </div>
                    <button
                      onClick={() => setShowUpgrade(false)}
                      style={{ width: '100%', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 12, cursor: 'pointer', padding: '4px 0' }}
                    >
                      ← Back to CV preview
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button
                      onClick={downloadPDF}
                      style={{ width: '100%', background: ACCENT, color: '#052A14', fontSize: 14, fontWeight: 800, padding: '13px', borderRadius: 99, border: 'none', cursor: 'pointer' }}
                    >
                      ↓ Download Optimised CV
                    </button>
                    <button
                      onClick={applyWithCV}
                      disabled={applying}
                      style={{ width: '100%', background: 'rgba(200,230,0,0.1)', border: '1.5px solid rgba(200,230,0,0.28)', color: ACCENT, fontSize: 14, fontWeight: 800, padding: '13px', borderRadius: 99, cursor: applying ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}
                    >
                      {applying
                        ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(200,230,0,0.2)', borderTopColor: ACCENT, borderRadius: '50%', display: 'inline-block', animation: 'omSpin 0.7s linear infinite' }} /> Checking subscription...</>
                        : '⚡ Apply with this CV'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
