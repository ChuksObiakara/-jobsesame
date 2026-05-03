'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

interface Job {
  id: string | number;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  category: string;
  level: string;
  salary?: string;
  type?: string;
}

interface QuickApplyProps {
  job: Job;
  onClose: () => void;
  currency?: 'ZAR' | 'USD';
}

export function isGreenhouseJob(job: { type?: string; url: string }): boolean {
  return job.type === 'greenhouse' || job.url.toLowerCase().includes('greenhouse.io');
}

export function isAutoApply(url: string, type?: string): boolean {
  const u = url.toLowerCase();
  return type === 'greenhouse' || u.includes('greenhouse.io') || u.includes('arbeitnow.com');
}

type Step = 'signin' | 'cv' | 'rewrite' | 'profile' | 'result' | 'apply' | 'done' | 'paywall';

const REWRITE_PHASES = [
  'Reading your CV...',
  'Analysing job requirements...',
  'Matching your skills...',
  'Tailoring your experience...',
  'Calculating match score...',
];

const PROGRESS_STEPS = ['CV Check', 'AI Rewrite', 'Results', 'Apply'];

function stepIndex(step: Step): number {
  if (step === 'signin' || step === 'cv') return 0;
  if (step === 'rewrite') return 1;
  if (step === 'result' || step === 'profile') return 2;
  return 3;
}

export default function QuickApply({ job, onClose, currency = 'USD' }: QuickApplyProps) {
  const { user, isSignedIn, isLoaded } = useUser();

  const [step, setStep] = useState<Step>('cv');
  const [savedCvData, setSavedCvData] = useState<any>(null);
  const [rewrittenCV, setRewrittenCV] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(false);
  const [rewritePhase, setRewritePhase] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [originalMatchPct, setOriginalMatchPct] = useState<number | null>(null);
  const [rewrittenMatchPct, setRewrittenMatchPct] = useState<number | null>(null);
  const [autoApplyStatus, setAutoApplyStatus] = useState<'idle' | 'trying' | 'success' | 'manual'>('idle');
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [savedProfile, setSavedProfile] = useState<any>(null);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '', location: '', title: '' });

  const applyCount = typeof window !== 'undefined' ? parseInt(localStorage.getItem('jobsesame_apply_count') || '0') : 0;
  const FREE_LIMIT = 3;
  const isGreenhouse = isGreenhouseJob(job);
  const autoApply = isAutoApply(job.url, job.type);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { setStep('signin'); return; }
    const cv = localStorage.getItem('jobsesame_cv_data');
    const profile = localStorage.getItem('jobsesame_profile');
    if (profile) setSavedProfile(JSON.parse(profile));
    if (cv) {
      const parsed = JSON.parse(cv);
      setSavedCvData(parsed);
      startRewrite(parsed);
    } else {
      setStep('cv');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  const calcScore = (cvD: any): number => {
    const skills: string[] = cvD?.skills || [];
    const title: string = cvD?.title || '';
    const text = (job.title + ' ' + (job.description || '')).toLowerCase();
    let score = 40;
    skills.forEach((s: string) => { if (s && text.includes(s.toLowerCase())) score += 5; });
    if (title && job.title.toLowerCase().includes(title.toLowerCase())) score += 15;
    return Math.min(98, score);
  };

  const startRewrite = async (cv: any) => {
    // Credit check only — deduction happens after successful rewrite so users
    // are not charged if the AI call fails
    try {
      const creditsRes = await fetch('/api/credits');
      const creditsData = await creditsRes.json();
      if (!creditsData.isPro && creditsData.credits <= 0) { setStep('paywall'); return; }
    } catch { /* Non-critical — proceed */ }

    setStep('rewrite');
    setRewritePhase(0);
    let phaseIdx = 0;
    const interval = setInterval(() => {
      phaseIdx++;
      if (phaseIdx < REWRITE_PHASES.length) setRewritePhase(phaseIdx);
      else clearInterval(interval);
    }, 2800);
    try {
      const origScore = calcScore(cv);
      setOriginalMatchPct(origScore);
      const response = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvData: cv, jobTitle: job.title, jobCompany: job.company, jobDescription: job.description }),
      });
      const data = await response.json();
      clearInterval(interval);
      if (data.success) {
        // Deduct credit only after successful rewrite
        fetch('/api/credits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'deduct' }) }).catch(() => {});
        setRewritePhase(REWRITE_PHASES.length);
        const newScore = calcScore(data.rewrittenCV);
        setRewrittenMatchPct(newScore);
        localStorage.setItem('jobsesame_cv_data', JSON.stringify(data.rewrittenCV));
        setRewrittenCV(data.rewrittenCV);
        await new Promise(r => setTimeout(r, 700));
        const profile = localStorage.getItem('jobsesame_profile');
        if (!profile) {
          setProfileForm({
            name: data.rewrittenCV.name || cv.name || '',
            email: data.rewrittenCV.email || cv.email || user?.emailAddresses[0]?.emailAddress || '',
            phone: data.rewrittenCV.phone || cv.phone || '',
            location: data.rewrittenCV.location || cv.location || '',
            title: data.rewrittenCV.title || cv.title || '',
          });
          setStep('profile');
        } else {
          setStep('result');
        }
      } else {
        clearInterval(interval);
        setError('Failed to rewrite CV. Please try again.');
        setStep('cv');
      }
    } catch {
      clearInterval(interval);
      setError('Something went wrong. Please try again.');
      setStep('cv');
    }
  };

  const handleFileUpload = async (file: File) => {
    if (file.type !== 'application/pdf') { setError('Please upload a PDF file only'); return; }
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('cv', file);
      const response = await fetch('/api/cv', { method: 'POST', body: formData });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('jobsesame_cv_data', JSON.stringify(data.cvData));
        setSavedCvData(data.cvData);
        setUploading(false);
        startRewrite(data.cvData);
      } else {
        setError(data.error || 'Failed to read CV');
        setUploading(false);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setUploading(false);
    }
  };

  const handleSaveProfile = () => {
    localStorage.setItem('jobsesame_profile', JSON.stringify(profileForm));
    setSavedProfile(profileForm);
    setStep('result');
  };

  const downloadCVAsPDF = async (cv: any) => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = 210;
      const margin = 20;
      const contentWidth = pageWidth - margin * 2;
      let y = 20;

      doc.setFillColor(5, 42, 20);
      doc.rect(0, 0, 210, 28, 'F');
      doc.setTextColor(200, 230, 0);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(cv.name || '', margin, 13);
      doc.setTextColor(144, 200, 152);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(cv.title || '', margin, 21);
      y = 36;
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(9);
      const contactParts = [cv.location, cv.email, cv.phone].filter(Boolean);
      if (contactParts.length) doc.text(contactParts.join('  |  '), margin, y);
      y += 8;
      doc.setDrawColor(5, 42, 20);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;

      const addSection = (title: string, content: () => void) => {
        if (y > 265) { doc.addPage(); y = 20; }
        doc.setFillColor(234, 245, 234);
        doc.rect(margin, y - 4, contentWidth, 7, 'F');
        doc.setTextColor(5, 42, 20);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(title.toUpperCase(), margin + 2, y + 1);
        y += 7;
        doc.setTextColor(51, 51, 51);
        doc.setFont('helvetica', 'normal');
        content();
        y += 4;
      };

      if (cv.summary) {
        addSection('Professional Summary', () => {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'italic');
          const lines = doc.splitTextToSize(cv.summary, contentWidth);
          doc.text(lines, margin, y);
          y += lines.length * 5;
        });
      }
      if (cv.skills?.length) {
        addSection('Skills', () => {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          const lines = doc.splitTextToSize(cv.skills.join('  ·  '), contentWidth);
          doc.text(lines, margin, y);
          y += lines.length * 5;
        });
      }
      if (cv.experience?.length) {
        addSection('Experience', () => {
          cv.experience.forEach((exp: any) => {
            if (y > 265) { doc.addPage(); y = 20; }
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(5, 42, 20);
            doc.text(exp.title || '', margin, y);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(42, 106, 58);
            doc.setFontSize(9);
            doc.text(`${exp.company || ''}  |  ${exp.duration || ''}`, margin, y + 5);
            y += 10;
            doc.setTextColor(68, 68, 68);
            exp.bullets?.forEach((bullet: string) => {
              if (y > 265) { doc.addPage(); y = 20; }
              const lines = doc.splitTextToSize(`• ${bullet}`, contentWidth - 4);
              doc.text(lines, margin + 2, y);
              y += lines.length * 4.5;
            });
            y += 3;
          });
        });
      }
      if (cv.education) {
        addSection('Education', () => {
          doc.setFontSize(10);
          doc.text(cv.education, margin, y);
          y += 6;
        });
      }
      if (cv.languages?.length) {
        addSection('Languages', () => {
          doc.setFontSize(10);
          doc.text(cv.languages.join('  |  '), margin, y);
          y += 6;
        });
      }
      const fileName = `${(cv.name || 'CV').replace(/\s+/g, '_')}_tailored_for_${(job.company || 'Job').replace(/\s+/g, '_')}.pdf`;
      doc.save(fileName);
    } catch {}
  };

  const logApplication = (status: string) => {
    const currentCount = parseInt(localStorage.getItem('jobsesame_apply_count') || '0');
    localStorage.setItem('jobsesame_apply_count', String(currentCount + 1));
    const applications = JSON.parse(localStorage.getItem('jobsesame_applications') || '[]');
    applications.push({
      id: Date.now().toString(),
      jobTitle: job.title,
      company: job.company,
      location: job.location,
      dateApplied: new Date().toISOString(),
      status,
      jobUrl: job.url,
    });
    localStorage.setItem('jobsesame_applications', JSON.stringify(applications));
    // Save to database
    fetch('/api/user/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobTitle: job.title, company: job.company, location: job.location,
        jobUrl: job.url, jobSource: job.type || 'web', matchScore: rewrittenMatchPct,
      }),
    }).catch(() => {});
  };

  const handleApply = async () => {
    if (applyCount >= FREE_LIMIT) { setStep('paywall'); return; }
    setApplying(true);
    if (autoApply && autoApplyStatus === 'idle') {
      setAutoApplyStatus('trying');
      try {
        const candidateName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || rewrittenCV?.name || '';
        const candidateEmail = user?.emailAddresses[0]?.emailAddress || rewrittenCV?.email || '';
        const res = await fetch('/api/auto-apply-form', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobUrl: job.url,
            candidateName,
            candidateEmail,
            candidatePhone: rewrittenCV?.phone || '',
            cvData: rewrittenCV,
            jobType: job.type,
            boardToken: (job as any).boardToken,
            jobId: (job as any).jobId,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setAutoApplyStatus('success');
          logApplication('Auto-Applied');
          setApplying(false);
          setStep('done');
          return;
        } else {
          setAutoApplyStatus('manual');
        }
      } catch {
        setAutoApplyStatus('manual');
      }
      setApplying(false);
      return;
    }
    await downloadCVAsPDF(rewrittenCV);
    await new Promise(r => setTimeout(r, 800));
    window.open(job.url, '_blank');
    logApplication('Applied');
    setApplying(false);
    setStep('done');
  };

  const handlePayment = async (plan: 'credits' | 'pro') => {
    const email = user?.emailAddresses[0]?.emailAddress;
    if (!email) { window.location.href = '/sign-in'; return; }
    setPaying(true);
    setPaymentError('');
    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, plan, currency }),
      });
      const data = await res.json();
      if (data.authorizationUrl) window.location.href = data.authorizationUrl;
      else { setPaymentError(data.error || 'Payment failed. Please try again.'); setPaying(false); }
    } catch {
      setPaymentError('Something went wrong. Please try again.');
      setPaying(false);
    }
  };

  const companyColor = (() => {
    const colors = ['#C8E600', '#00C864', '#FFA500', '#00B8FF', '#FF6B6B', '#B44FFF'];
    return colors[job.company.charCodeAt(0) % colors.length];
  })();

  const curStep = stepIndex(step);

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.85)',
    zIndex: 1000,
    display: 'flex',
    alignItems: isMobile ? 'flex-start' : 'center',
    justifyContent: 'center',
    padding: isMobile ? 0 : 16,
  };

  const modal: React.CSSProperties = {
    background: '#052A14',
    borderRadius: isMobile ? 0 : 20,
    padding: isMobile ? '24px 18px' : '32px 28px',
    maxWidth: isMobile ? '100%' : 580,
    width: '100%',
    height: isMobile ? '100vh' : 'auto',
    maxHeight: isMobile ? '100vh' : '92vh',
    overflowY: 'auto',
    border: isMobile ? 'none' : '1.5px solid #1A5A2A',
    position: 'relative',
    boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
  };

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modal}>

        {/* Close button */}
        <button onClick={onClose} style={{position:'absolute',top:14,right:14,background:'rgba(255,255,255,0.07)',border:'none',color:'#A8D8B0',fontSize:16,cursor:'pointer',width:30,height:30,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',zIndex:10}}>
          ✕
        </button>

        {/* Company + job header */}
        <div style={{display:'flex',gap:14,alignItems:'center',marginBottom:24,paddingRight:40}}>
          <div style={{width:50,height:50,borderRadius:14,background:companyColor,color:'#052A14',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:900,flexShrink:0}}>
            {job.company.charAt(0).toUpperCase()}
          </div>
          <div style={{minWidth:0}}>
            <h2 style={{fontSize:17,fontWeight:800,color:'#FFFFFF',margin:0,marginBottom:3,lineHeight:1.2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{job.title}</h2>
            <div style={{fontSize:13,color:'#5A9A6A'}}>{job.company} · {job.location}</div>
          </div>
        </div>

        {/* Progress bar — shown in main flow only */}
        {step !== 'signin' && step !== 'done' && step !== 'paywall' && (
          <div style={{marginBottom:28}}>
            <div style={{display:'flex',gap:5,marginBottom:6}}>
              {PROGRESS_STEPS.map((s, i) => (
                <div key={s} style={{flex:1,textAlign:'center'}}>
                  <div style={{height:3,borderRadius:99,background:i <= curStep ? '#C8E600' : '#1A4A2A',marginBottom:5,transition:'background 0.4s'}}></div>
                  <div style={{fontSize:10,fontWeight:700,color:i <= curStep ? '#C8E600' : '#3A7A4A'}}>{s}</div>
                </div>
              ))}
            </div>
            <div style={{fontSize:11,color:'#3A7A4A',textAlign:'right'}}>Step {curStep + 1} of {PROGRESS_STEPS.length}</div>
          </div>
        )}

        {/* ── SIGN IN GATE ──────────────────────────────────────────── */}
        {step === 'signin' && (
          <div style={{textAlign:'center',padding:'16px 0 8px'}}>
            <div style={{fontSize:52,marginBottom:16}}>🔑</div>
            <h3 style={{fontSize:20,fontWeight:800,color:'#FFFFFF',marginBottom:10}}>Create a free account to apply</h3>
            <p style={{fontSize:14,color:'#5A9A6A',marginBottom:28,lineHeight:1.7}}>
              Get an AI-tailored CV for <strong style={{color:'#FFFFFF'}}>{job.title}</strong> at {job.company} — completely free.
            </p>
            <a href="/sign-up" style={{display:'block',background:'#C8E600',color:'#052A14',fontSize:15,fontWeight:800,padding:'15px 28px',borderRadius:99,textDecoration:'none',marginBottom:14}}>
              Get started free →
            </a>
            <a href="/sign-in" style={{display:'block',fontSize:13,color:'#5A9A6A',textDecoration:'none'}}>
              Already have an account? Sign in
            </a>
          </div>
        )}

        {/* ── CV UPLOAD ─────────────────────────────────────────────── */}
        {step === 'cv' && (
          <div>
            {savedCvData ? (
              <div style={{background:'rgba(200,230,0,0.06)',border:'1.5px solid rgba(200,230,0,0.25)',borderRadius:14,padding:'16px 20px',marginBottom:20,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:'#C8E600',marginBottom:2}}>✓ Using your saved CV</div>
                  <div style={{fontSize:12,color:'#5A9A6A'}}>{savedCvData.name}{savedCvData.title ? ` · ${savedCvData.title}` : ''}</div>
                </div>
                <button onClick={() => { localStorage.removeItem('jobsesame_cv_data'); setSavedCvData(null); }} style={{background:'transparent',border:'1px solid #1A5A2A',borderRadius:99,color:'#5A9A6A',fontSize:12,padding:'6px 14px',cursor:'pointer',whiteSpace:'nowrap'}}>
                  Use different CV
                </button>
              </div>
            ) : (
              <>
                <h3 style={{fontSize:17,fontWeight:800,color:'#FFFFFF',marginBottom:8}}>Upload your CV</h3>
                <p style={{fontSize:13,color:'#5A9A6A',marginBottom:20,lineHeight:1.7}}>
                  AI reads your CV and rewrites it specifically for <strong style={{color:'#FFFFFF'}}>{job.title}</strong> at {job.company}.
                </p>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFileUpload(f); }}
                  style={{background:dragOver?'rgba(200,230,0,0.08)':'#0A3518',border:`2px dashed ${dragOver?'#C8E600':'#1A5A2A'}`,borderRadius:14,padding:'36px 24px',textAlign:'center',marginBottom:16,transition:'all 0.2s',cursor:'pointer'}}
                >
                  {uploading ? (
                    <div>
                      <div style={{fontSize:34,marginBottom:10}}>⚙️</div>
                      <div style={{fontSize:14,color:'#C8E600',fontWeight:700,marginBottom:4}}>Reading your CV...</div>
                      <div style={{fontSize:12,color:'#5A9A6A'}}>AI is extracting your details</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{fontSize:38,marginBottom:10}}>📄</div>
                      <div style={{fontSize:13,color:'#A8D8B0',marginBottom:4}}>Drag and drop your CV here</div>
                      <div style={{fontSize:12,color:'#3A7A4A',marginBottom:18}}>PDF files only</div>
                      <label style={{cursor:'pointer'}}>
                        <input type="file" accept=".pdf" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} style={{display:'none'}} />
                        <span style={{background:'#C8E600',color:'#052A14',fontSize:13,fontWeight:800,padding:'11px 26px',borderRadius:99}}>
                          Choose PDF file
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </>
            )}

            {error && (
              <div style={{background:'rgba(163,45,45,0.2)',border:'1px solid #A32D2D',borderRadius:10,padding:'10px 16px',fontSize:13,color:'#F09595',marginBottom:16}}>{error}</div>
            )}
            {savedCvData && (
              <button onClick={() => startRewrite(savedCvData)} style={{width:'100%',background:'#C8E600',color:'#052A14',fontSize:14,fontWeight:800,padding:'14px',borderRadius:99,border:'none',cursor:'pointer'}}>
                Rewrite CV for this job →
              </button>
            )}
            <div style={{fontSize:11,color:'#3A7A4A',textAlign:'center',marginTop:14}}>
              Free applications remaining: <strong style={{color:'#C8E600'}}>{Math.max(0, FREE_LIMIT - applyCount)}</strong> of {FREE_LIMIT}
            </div>
          </div>
        )}

        {/* ── AI REWRITE IN PROGRESS ────────────────────────────────── */}
        {step === 'rewrite' && (
          <div style={{textAlign:'center',padding:'16px 0 28px'}}>
            <div style={{fontSize:52,marginBottom:18}}>✨</div>
            <h3 style={{fontSize:18,fontWeight:800,color:'#FFFFFF',marginBottom:6}}>AI is tailoring your CV...</h3>
            <p style={{fontSize:13,color:'#5A9A6A',marginBottom:28}}>
              Rewriting for <strong style={{color:'#C8E600'}}>{job.title}</strong> at {job.company}
            </p>
            <div style={{maxWidth:300,margin:'0 auto',textAlign:'left'}}>
              {REWRITE_PHASES.map((phase, i) => (
                <div key={phase} style={{display:'flex',alignItems:'center',gap:12,marginBottom:14,opacity:i <= rewritePhase ? 1 : 0.3,transition:'opacity 0.6s'}}>
                  <div style={{width:22,height:22,borderRadius:'50%',background:i < rewritePhase?'#C8E600':i===rewritePhase?'rgba(200,230,0,0.25)':'#1A4A2A',border:`2px solid ${i<=rewritePhase?'#C8E600':'#1A4A2A'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'all 0.4s'}}>
                    {i < rewritePhase && <span style={{fontSize:11,color:'#052A14',fontWeight:900}}>✓</span>}
                    {i === rewritePhase && <span style={{display:'block',width:8,height:8,borderRadius:'50%',background:'#C8E600'}}></span>}
                  </div>
                  <div style={{fontSize:13,color:i<=rewritePhase?'#FFFFFF':'#3A7A4A',fontWeight:i===rewritePhase?700:400,transition:'color 0.4s'}}>
                    {phase}
                  </div>
                </div>
              ))}
            </div>
            <div style={{fontSize:12,color:'#3A7A4A',fontStyle:'italic',marginTop:8}}>About 15–20 seconds</div>
          </div>
        )}

        {/* ── PROFILE SAVE ──────────────────────────────────────────── */}
        {step === 'profile' && (
          <div>
            <div style={{background:'rgba(200,230,0,0.06)',border:'1.5px solid rgba(200,230,0,0.2)',borderRadius:12,padding:'12px 16px',marginBottom:20,display:'flex',gap:10,alignItems:'center'}}>
              <span style={{fontSize:20}}>⚡</span>
              <span style={{fontSize:13,color:'#C8E600',fontWeight:600}}>Save your profile — future applications will be instant</span>
            </div>
            <h3 style={{fontSize:16,fontWeight:800,color:'#FFFFFF',marginBottom:4}}>Confirm your details</h3>
            <p style={{fontSize:12,color:'#5A9A6A',marginBottom:18}}>Pre-filled from your CV — edit anything that needs updating.</p>
            <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:22}}>
              {[
                { key: 'name', label: 'Full name' },
                { key: 'email', label: 'Email address' },
                { key: 'phone', label: 'Phone number' },
                { key: 'location', label: 'Location' },
                { key: 'title', label: 'Current job title' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label style={{fontSize:11,color:'#5A9A6A',fontWeight:600,display:'block',marginBottom:5,textTransform:'uppercase',letterSpacing:'0.5px'}}>{label}</label>
                  <input
                    value={profileForm[key as keyof typeof profileForm]}
                    onChange={e => setProfileForm(p => ({ ...p, [key]: e.target.value }))}
                    style={{width:'100%',padding:'10px 14px',border:'1.5px solid #1A5A2A',borderRadius:10,fontSize:13,color:'#FFFFFF',background:'#0A3518',outline:'none',fontFamily:'inherit',boxSizing:'border-box'}}
                  />
                </div>
              ))}
            </div>
            <button onClick={handleSaveProfile} style={{width:'100%',background:'#C8E600',color:'#052A14',fontSize:14,fontWeight:800,padding:'14px',borderRadius:99,border:'none',cursor:'pointer',marginBottom:10}}>
              Save profile & see my rewritten CV →
            </button>
            <button onClick={() => setStep('result')} style={{width:'100%',background:'transparent',color:'#5A9A6A',fontSize:13,padding:'8px',border:'none',cursor:'pointer'}}>
              Skip for now
            </button>
          </div>
        )}

        {/* ── RESULT ───────────────────────────────────────────────── */}
        {step === 'result' && rewrittenCV && (
          <div>
            {savedProfile && (
              <div style={{background:'rgba(0,200,100,0.08)',border:'1px solid rgba(0,200,100,0.3)',borderRadius:10,padding:'8px 14px',marginBottom:16,fontSize:12,color:'#00C864',fontWeight:600,display:'flex',gap:8,alignItems:'center'}}>
                <span>✓</span>
                <span>Profile saved — applications are faster now</span>
              </div>
            )}

            {/* Match score banner */}
            {originalMatchPct !== null && rewrittenMatchPct !== null && (
              <div style={{background:'rgba(200,230,0,0.08)',border:'1.5px solid rgba(200,230,0,0.3)',borderRadius:14,padding:'16px 20px',marginBottom:20,display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:14}}>
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:'#5A9A6A',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8}}>Match score improved</div>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <span style={{fontSize:22,fontWeight:800,color:'#FFA500'}}>{originalMatchPct}%</span>
                    <span style={{fontSize:18,color:'#3A7A4A'}}>→</span>
                    <span style={{fontSize:30,fontWeight:900,color:'#C8E600'}}>{rewrittenMatchPct}%</span>
                    {rewrittenMatchPct > originalMatchPct && (
                      <span style={{background:'rgba(0,200,100,0.15)',color:'#00C864',fontSize:13,fontWeight:800,padding:'3px 10px',borderRadius:99}}>
                        +{rewrittenMatchPct - originalMatchPct}%
                      </span>
                    )}
                  </div>
                </div>
                <div style={{textAlign:'center'}}>
                  <div style={{fontSize:11,color:'#5A9A6A',marginBottom:4}}>ATS score</div>
                  <div style={{fontSize:22,fontWeight:800,color:'#C8E600'}}>{rewrittenCV.ats_score}%</div>
                </div>
              </div>
            )}

            {/* Rewritten CV white card */}
            <div style={{background:'#FFFFFF',borderRadius:14,padding:'20px',marginBottom:16}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12,flexWrap:'wrap',gap:8}}>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:15,fontWeight:800,color:'#052A14',marginBottom:3}}>{rewrittenCV.name}</div>
                  <div style={{fontSize:13,fontWeight:600,color:'#1A5A2A'}}>{rewrittenCV.title}</div>
                </div>
                <span style={{background:'#C8E600',color:'#052A14',fontSize:12,fontWeight:800,padding:'4px 12px',borderRadius:99,flexShrink:0}}>
                  {rewrittenCV.match_score}% match
                </span>
              </div>
              <p style={{fontSize:12,color:'#444',lineHeight:1.65,marginBottom:14,fontStyle:'italic',borderLeft:'3px solid #C8E600',paddingLeft:12,margin:'0 0 14px'}}>
                {rewrittenCV.summary}
              </p>
              {rewrittenCV.keywords_added?.length > 0 && (
                <div>
                  <div style={{fontSize:11,color:'#1A5A2A',fontWeight:700,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.5px'}}>Keywords added for ATS:</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                    {rewrittenCV.keywords_added.slice(0, 8).map((kw: string) => (
                      <span key={kw} style={{background:'#EAF5EA',color:'#1A5A2A',fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:99,border:'1px solid #C8E600'}}>{kw}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{background:'rgba(200,230,0,0.06)',border:'1px solid rgba(200,230,0,0.2)',borderRadius:10,padding:'12px 14px',marginBottom:20,fontSize:12,color:'#90C898',lineHeight:1.7}}>
              📥 <strong style={{color:'#C8E600'}}>Your rewritten CV downloads automatically</strong> when you proceed — ready to upload on the employer site.
            </div>

            <button onClick={() => setStep('apply')} style={{width:'100%',background:'#C8E600',color:'#052A14',fontSize:15,fontWeight:800,padding:'15px',borderRadius:99,border:'none',cursor:'pointer',marginBottom:10}}>
              Proceed to Apply →
            </button>
            <button onClick={onClose} style={{width:'100%',background:'transparent',color:'#5A9A6A',fontSize:13,padding:'8px',border:'none',cursor:'pointer'}}>
              Save for later
            </button>
          </div>
        )}

        {/* ── APPLY ────────────────────────────────────────────────── */}
        {step === 'apply' && rewrittenCV && (
          <div>
            <h3 style={{fontSize:17,fontWeight:800,color:'#FFFFFF',marginBottom:6}}>Ready to apply</h3>
            <p style={{fontSize:13,color:'#5A9A6A',marginBottom:20}}>Your AI-tailored CV is ready. Click below to complete your application.</p>

            {autoApplyStatus === 'trying' && (
              <div style={{background:'rgba(200,230,0,0.08)',border:'1.5px solid rgba(200,230,0,0.4)',borderRadius:12,padding:16,marginBottom:16,textAlign:'center'}}>
                <div style={{fontSize:28,marginBottom:8}}>⚙️</div>
                <div style={{fontSize:14,fontWeight:700,color:'#C8E600',marginBottom:4}}>
                  {isGreenhouse ? 'Submitting directly to employer...' : 'Attempting auto-apply...'}
                </div>
              </div>
            )}

            {autoApplyStatus === 'manual' && (
              <div style={{background:'rgba(255,165,0,0.08)',border:'1px solid rgba(255,165,0,0.3)',borderRadius:10,padding:14,marginBottom:16}}>
                <div style={{fontSize:12,fontWeight:700,color:'#FFA500',marginBottom:8}}>⚠️ Auto-apply unavailable — assisted apply ready</div>
                {['CV downloads automatically to your device', 'Employer portal opens in new tab', 'Upload your CV and submit'].map((s, i) => (
                  <div key={i} style={{display:'flex',gap:8,marginBottom:6,alignItems:'flex-start'}}>
                    <span style={{background:'#FFA500',color:'#052A14',fontSize:10,fontWeight:800,width:18,height:18,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>{i + 1}</span>
                    <span style={{fontSize:12,color:'#90C898'}}>{s}</span>
                  </div>
                ))}
              </div>
            )}

            {!autoApply && autoApplyStatus === 'idle' && (
              <div style={{background:'rgba(255,165,0,0.06)',border:'1px solid rgba(255,165,0,0.25)',borderRadius:10,padding:14,marginBottom:16}}>
                <div style={{fontSize:12,fontWeight:700,color:'#FFA500',marginBottom:8}}>🎯 Assisted apply — 3 steps</div>
                {['CV downloads automatically to your device', 'Employer portal opens in a new tab', 'Upload your CV and complete the form'].map((s, i) => (
                  <div key={i} style={{display:'flex',gap:8,marginBottom:6,alignItems:'flex-start'}}>
                    <span style={{background:'#FFA500',color:'#052A14',fontSize:10,fontWeight:800,width:18,height:18,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>{i + 1}</span>
                    <span style={{fontSize:12,color:'#90C898'}}>{s}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleApply}
              disabled={applying || autoApplyStatus === 'trying'}
              style={{width:'100%',background:'#C8E600',color:'#052A14',fontSize:15,fontWeight:800,padding:'15px',borderRadius:99,border:'none',cursor:(applying||autoApplyStatus==='trying')?'default':'pointer',opacity:(applying||autoApplyStatus==='trying')?0.7:1,marginBottom:12}}
            >
              {autoApplyStatus === 'trying'
                ? (isGreenhouse ? '⚙️ Submitting to employer...' : '⚙️ Auto-applying...')
                : applying
                  ? '📥 Downloading CV + Opening job...'
                  : isGreenhouse
                    ? '🟢 Submit application directly'
                    : autoApply
                      ? '⚡ Auto-apply now'
                      : '📥 Download CV + Apply →'}
            </button>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <button onClick={onClose} style={{background:'transparent',color:'#5A9A6A',fontSize:12,padding:'8px 0',border:'none',cursor:'pointer'}}>
                Save for later
              </button>
              <div style={{fontSize:11,color:'#3A7A4A'}}>
                Free uses left: <strong style={{color:'#C8E600'}}>{Math.max(0, FREE_LIMIT - applyCount - 1)}</strong>
              </div>
            </div>
          </div>
        )}

        {/* ── DONE ────────────────────────────────────────────────── */}
        {step === 'done' && (
          <div style={{textAlign:'center',padding:'24px 0'}}>
            {autoApplyStatus === 'success' ? (
              <>
                <div style={{fontSize:52,marginBottom:16}}>✅</div>
                <h3 style={{fontSize:20,fontWeight:800,color:'#FFFFFF',marginBottom:8}}>
                  {isGreenhouse ? 'Application submitted!' : 'Applied automatically!'}
                </h3>
                <p style={{fontSize:14,color:'#5A9A6A',marginBottom:20,lineHeight:1.7}}>
                  Your application was sent directly to <strong style={{color:'#FFFFFF'}}>{job.company}</strong>. Check your email for any confirmation.
                </p>
              </>
            ) : (
              <>
                <div style={{fontSize:52,marginBottom:16}}>🎉</div>
                <h3 style={{fontSize:20,fontWeight:800,color:'#FFFFFF',marginBottom:8}}>Your tailored CV is downloading...</h3>
                <p style={{fontSize:14,color:'#5A9A6A',marginBottom:8,lineHeight:1.7}}>
                  Opening the application portal now. Upload your downloaded CV to complete your application at {job.company}.
                </p>
              </>
            )}
            <button onClick={onClose} style={{background:'#C8E600',color:'#052A14',fontSize:14,fontWeight:800,padding:'13px 28px',borderRadius:99,border:'none',cursor:'pointer'}}>
              Back to jobs
            </button>
          </div>
        )}

        {/* ── PAYWALL ─────────────────────────────────────────────── */}
        {step === 'paywall' && (
          <div style={{textAlign:'center',padding:'16px 0'}}>
            <div style={{fontSize:44,marginBottom:16}}>🔑</div>
            <h3 style={{fontSize:20,fontWeight:800,color:'#FFFFFF',marginBottom:8}}>3 free applications used</h3>
            <p style={{fontSize:14,color:'#5A9A6A',marginBottom:24,lineHeight:1.7}}>Unlock more to keep applying with AI-tailored CVs.</p>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
              <div style={{background:'#0D3A1A',border:'1.5px solid #1A5A2A',borderRadius:14,padding:16,textAlign:'center'}}>
                <div style={{fontSize:22,fontWeight:800,color:'#FFFFFF',marginBottom:4}}>
                  {currency === 'ZAR' ? 'R99' : '$5'}<span style={{fontSize:12,color:'#888'}}>/pack</span>
                </div>
                <div style={{fontSize:12,color:'#5A9A6A',marginBottom:12}}>10 applications. No expiry.</div>
                <button onClick={() => handlePayment('credits')} disabled={paying} style={{display:'block',width:'100%',background:'#052A14',color:'#C8E600',fontSize:12,fontWeight:800,padding:'9px',borderRadius:99,border:'1px solid #C8E600',cursor:paying?'default':'pointer',opacity:paying?0.7:1}}>
                  {paying ? 'Loading...' : 'Get credits'}
                </button>
              </div>
              <div style={{background:'#0D3A1A',border:'1.5px solid #C8E600',borderRadius:14,padding:16,textAlign:'center'}}>
                <div style={{background:'#C8E600',color:'#052A14',fontSize:10,fontWeight:800,padding:'2px 10px',borderRadius:99,display:'inline-block',marginBottom:6}}>Best value</div>
                <div style={{fontSize:22,fontWeight:800,color:'#FFFFFF',marginBottom:4}}>
                  {currency === 'ZAR' ? 'R249' : '$14'}<span style={{fontSize:12,color:'#888'}}>/mo</span>
                </div>
                <div style={{fontSize:12,color:'#5A9A6A',marginBottom:12}}>Unlimited. Everything.</div>
                <button onClick={() => handlePayment('pro')} disabled={paying} style={{display:'block',width:'100%',background:'#C8E600',color:'#052A14',fontSize:12,fontWeight:800,padding:'9px',borderRadius:99,border:'none',cursor:paying?'default':'pointer',opacity:paying?0.7:1}}>
                  {paying ? 'Loading...' : 'Go Pro'}
                </button>
              </div>
            </div>
            {paymentError && (
              <div style={{background:'rgba(163,45,45,0.2)',border:'1px solid #A32D2D',borderRadius:10,padding:'10px 16px',fontSize:13,color:'#F09595',marginBottom:12}}>{paymentError}</div>
            )}
            <button onClick={onClose} style={{background:'transparent',color:'#5A9A6A',fontSize:13,cursor:'pointer',border:'none'}}>Maybe later</button>
          </div>
        )}

      </div>
    </div>
  );
}
