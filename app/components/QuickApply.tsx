'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

interface Job {
  id: number;
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

export function isAutoApply(url: string): boolean {
  const complexPortals = [
    'linkedin', 'indeed', 'workday', 'greenhouse', 'lever',
    'smartrecruiters', 'taleo', 'icims', 'successfactors', 'jobvite'
  ];
  return !complexPortals.some(portal => url.toLowerCase().includes(portal));
}

export default function QuickApply({ job, onClose, currency = 'USD' }: QuickApplyProps) {
  const { user } = useUser();
  const [savedCvData, setSavedCvData] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jobsesame_cv_data');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  const [step, setStep] = useState<'profile' | 'rewrite' | 'apply' | 'done' | 'paywall'>('profile');
  const [uploading, setUploading] = useState(false);
  const [rewrittenCV, setRewrittenCV] = useState<any>(null);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(false);
  const [userPrompt, setUserPrompt] = useState('');
  const [applyCount] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('jobsesame_apply_count') || '0');
    }
    return 0;
  });

  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [autoEmailSending, setAutoEmailSending] = useState(false);
  const [autoEmailSent, setAutoEmailSent] = useState(false);
  const [autoEmailError, setAutoEmailError] = useState('');

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const employerEmail = job.description.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/)?.[0] || null;

  const FREE_LIMIT = 3;
  const autoApply = isAutoApply(job.url);

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
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        setPaymentError(data.error || 'Payment failed. Please try again.');
        setPaying(false);
      }
    } catch {
      setPaymentError('Something went wrong. Please try again.');
      setPaying(false);
    }
  };

  useEffect(() => {
    if (savedCvData) {
      handleRewrite(savedCvData);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
        handleRewrite(data.cvData);
      } else {
        setError(data.error || 'Failed to read CV');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleUseDifferentCV = () => {
    localStorage.removeItem('jobsesame_cv_data');
    setSavedCvData(null);
    setStep('profile');
  };

  const handleAutoEmail = async () => {
    if (!employerEmail) return;
    const currentCount = parseInt(localStorage.getItem('jobsesame_apply_count') || '0');
    if (currentCount >= FREE_LIMIT) { setStep('paywall'); return; }
    setAutoEmailSending(true);
    setAutoEmailError('');
    try {
      const email = user?.emailAddresses[0]?.emailAddress;
      const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Candidate';
      const res = await fetch('/api/auto-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employerEmail,
          jobTitle: job.title,
          jobCompany: job.company,
          candidateName: name,
          candidateEmail: email,
          cvData: rewrittenCV,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAutoEmailSent(true);
        const newCount = currentCount + 1;
        localStorage.setItem('jobsesame_apply_count', String(newCount));
        const applications = JSON.parse(localStorage.getItem('jobsesame_applications') || '[]');
        applications.push({
          id: Date.now().toString(),
          jobTitle: job.title,
          company: job.company,
          location: job.location,
          dateApplied: new Date().toISOString(),
          status: 'Auto-Applied',
          jobUrl: job.url,
        });
        localStorage.setItem('jobsesame_applications', JSON.stringify(applications));
      } else {
        setAutoEmailError(data.error || 'Failed to send application email');
      }
    } catch {
      setAutoEmailError('Something went wrong. Please try again.');
    }
    setAutoEmailSending(false);
  };

  const handleRewrite = async (cv: any) => {
    setStep('rewrite');
    try {
      const response = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvData: cv,
          jobTitle: job.title,
          jobCompany: job.company,
          jobDescription: job.description,
          userPrompt: userPrompt,
        }),
      });
      const data = await response.json();
      if (data.success) {
        setRewrittenCV(data.rewrittenCV);
        setStep('apply');
      } else {
        setError('Failed to rewrite CV');
        setStep('profile');
      }
    } catch (err) {
      setError('Something went wrong');
      setStep('profile');
    }
  };

  const downloadCVAsPDF = async (cv: any) => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pageWidth = 210;
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
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

      const fileName = `${(cv.name || 'CV').replace(/\s+/g, '_')}_CV_for_${(job.company || 'Job').replace(/\s+/g, '_')}.pdf`;
      doc.save(fileName);
    } catch {
    }
  };

  const handleApply = async () => {
    if (applyCount >= FREE_LIMIT) { setStep('paywall'); return; }
    setApplying(true);
    await downloadCVAsPDF(rewrittenCV);
    await new Promise(resolve => setTimeout(resolve, 800));
    window.open(job.url, '_blank');
    const newCount = applyCount + 1;
    localStorage.setItem('jobsesame_apply_count', String(newCount));
    const applications = JSON.parse(localStorage.getItem('jobsesame_applications') || '[]');
    applications.push({
      id: Date.now().toString(),
      jobTitle: job.title,
      company: job.company,
      location: job.location,
      dateApplied: new Date().toISOString(),
      status: 'Applied',
      jobUrl: job.url,
    });
    localStorage.setItem('jobsesame_applications', JSON.stringify(applications));
    setApplying(false);
    setStep('done');
  };

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0,
    background: isMobile ? '#072E16' : 'rgba(0,0,0,0.75)',
    zIndex: 1000, display: 'flex',
    alignItems: isMobile ? 'flex-start' : 'center',
    justifyContent: 'center',
    padding: isMobile ? 0 : 16,
  };

  const modal: React.CSSProperties = {
    background: '#072E16',
    borderRadius: isMobile ? 0 : 16,
    padding: isMobile ? '20px 16px' : 28,
    maxWidth: isMobile ? '100%' : 560,
    width: '100%',
    height: isMobile ? '100vh' : 'auto',
    maxHeight: isMobile ? '100vh' : '90vh',
    overflowY: 'auto',
    border: isMobile ? 'none' : '1.5px solid #C8E600',
    position: 'relative',
  };

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modal}>
        <button onClick={onClose} style={{position:'absolute',top:16,right:16,background:'transparent',border:'none',color:'#5A9A6A',fontSize:20,cursor:'pointer'}}>✕</button>

        <div style={{marginBottom:20,paddingRight:24}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:6,
            color: autoApply ? '#C8E600' : '#FFA500'}}>
            {autoApply ? '⚡ Auto-apply available' : '🎯 Assisted apply'}
          </div>
          <h2 style={{fontSize:18,fontWeight:800,color:"#FFFFFF",marginBottom:4}}>{job.title}</h2>
          <div style={{fontSize:13,color:"#5A9A6A"}}>{job.company} · {job.location}</div>
        </div>

        <div style={{display:"flex",gap:6,marginBottom:24}}>
          {['Upload CV','AI Rewrite','Apply'].map((s,i) => (
            <div key={s} style={{flex:1,textAlign:"center"}}>
              <div style={{height:3,borderRadius:99,marginBottom:4,background:
                (step==='profile'&&i===0)||(step==='rewrite'&&i<=1)||(step==='apply'&&i<=2)||(step==='done'&&i<=2)
                  ?'#C8E600':'#1A4A2A'}}></div>
              <div style={{fontSize:10,fontWeight:600,color:
                (step==='profile'&&i===0)||(step==='rewrite'&&i<=1)||(step==='apply'&&i<=2)||(step==='done'&&i<=2)
                  ?'#C8E600':'#3A7A4A'}}>{s}</div>
            </div>
          ))}
        </div>

        {step === 'profile' && (
          <div>
            {savedCvData ? (
              <div style={{background:"rgba(200,230,0,0.08)",border:"1.5px solid rgba(200,230,0,0.3)",borderRadius:12,padding:"14px 18px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                <div style={{fontSize:13,color:"#C8E600",fontWeight:700}}>✓ Using your saved CV</div>
                <button onClick={handleUseDifferentCV} style={{background:"transparent",border:"1px solid #3A7A4A",borderRadius:99,color:"#5A9A6A",fontSize:12,fontWeight:600,padding:"5px 14px",cursor:"pointer",whiteSpace:"nowrap"}}>
                  Use different CV
                </button>
              </div>
            ) : (
              <>
                <h3 style={{fontSize:16,fontWeight:800,color:"#FFFFFF",marginBottom:8}}>Upload your CV once</h3>
                <p style={{fontSize:13,color:"#5A9A6A",marginBottom:16,lineHeight:1.7}}>
                  AI reads your CV and rewrites it specifically for <strong style={{color:"#FFFFFF"}}>{job.title}</strong> at {job.company}.
                </p>
              </>
            )}

            <div style={{marginBottom:16}}>
              <label style={{fontSize:12,color:"#5A9A6A",fontWeight:600,display:"block",marginBottom:6}}>
                Any special instructions? <span style={{color:"#3A7A4A",fontWeight:400}}>(optional)</span>
              </label>
              <textarea
                value={userPrompt}
                onChange={e=>setUserPrompt(e.target.value)}
                placeholder="e.g. Make it more senior, emphasise leadership experience, keep it under one page, focus on my management skills..."
                rows={3}
                style={{width:"100%",padding:"10px 14px",border:"1.5px solid #1A5A2A",borderRadius:10,fontSize:12,color:"#FFFFFF",background:"#0D3A1A",outline:"none",fontFamily:"inherit",resize:"vertical",marginBottom:4}}
              />
              <div style={{fontSize:10,color:"#3A7A4A"}}>Tell the AI exactly how you want your CV to be rewritten</div>
            </div>

            {!savedCvData && (
              <div style={{background:"#0D3A1A",borderRadius:12,padding:24,textAlign:"center",marginBottom:16,border:"2px dashed #1A5A2A"}}>
                <div style={{fontSize:32,marginBottom:12}}>📄</div>
                {uploading ? (
                  <div>
                    <div style={{fontSize:14,color:"#C8E600",fontWeight:700,marginBottom:6}}>Reading your CV...</div>
                    <div style={{fontSize:12,color:"#5A9A6A"}}>AI is extracting your details</div>
                  </div>
                ) : (
                  <div>
                    <div style={{fontSize:13,color:"#5A9A6A",marginBottom:12}}>Upload your CV — PDF only</div>
                    <label style={{cursor:"pointer"}}>
                      <input type="file" accept=".pdf" onChange={handleFileUpload} style={{display:"none"}}/>
                      <span style={{background:"#C8E600",color:"#052A14",fontSize:13,fontWeight:800,padding:"10px 24px",borderRadius:99,cursor:"pointer"}}>
                        Choose PDF file
                      </span>
                    </label>
                  </div>
                )}
              </div>
            )}
            {error && <div style={{background:"rgba(163,45,45,0.2)",border:"1px solid #A32D2D",borderRadius:10,padding:"10px 16px",fontSize:13,color:"#F09595",marginBottom:16}}>{error}</div>}
            <div style={{fontSize:11,color:"#3A7A4A",textAlign:"center"}}>
              Free applications remaining: <strong style={{color:"#C8E600"}}>{FREE_LIMIT - applyCount}</strong> of {FREE_LIMIT}
            </div>
          </div>
        )}

        {step === 'rewrite' && (
          <div style={{textAlign:"center",padding:"32px 0"}}>
            {savedCvData && (
              <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:20}}>
                <span style={{fontSize:13,color:"#C8E600",fontWeight:700}}>✓ Using your saved CV</span>
                <button onClick={handleUseDifferentCV} style={{background:"transparent",border:"1px solid #3A7A4A",borderRadius:99,color:"#5A9A6A",fontSize:12,fontWeight:600,padding:"4px 12px",cursor:"pointer"}}>
                  Use different CV
                </button>
              </div>
            )}
            <div style={{fontSize:40,marginBottom:16}}>✨</div>
            <h3 style={{fontSize:18,fontWeight:800,color:"#FFFFFF",marginBottom:8}}>AI is rewriting your CV...</h3>
            <p style={{fontSize:13,color:"#5A9A6A",marginBottom:16}}>
              Tailoring for <strong style={{color:"#C8E600"}}>{job.title}</strong> at {job.company}
            </p>
            {userPrompt && (
              <div style={{background:"#0D3A1A",borderRadius:10,padding:"8px 14px",marginBottom:12,fontSize:12,color:"#C8E600",fontStyle:"italic"}}>
                Following your instructions: &ldquo;{userPrompt}&rdquo;
              </div>
            )}
            <div style={{fontSize:12,color:"#3A7A4A",fontStyle:"italic"}}>About 15 seconds</div>
          </div>
        )}

        {step === 'apply' && rewrittenCV && (
          <div>
            <div style={{background:"#0D3A1A",borderRadius:12,padding:16,marginBottom:16,border:"1px solid #1A5A2A"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:8}}>
                <div style={{fontSize:13,fontWeight:700,color:"#FFFFFF"}}>CV rewritten for this job</div>
                <div style={{display:"flex",gap:8}}>
                  <span style={{background:"#C8E600",color:"#052A14",fontSize:11,fontWeight:800,padding:"3px 10px",borderRadius:99}}>
                    {rewrittenCV.match_score}% match
                  </span>
                  <span style={{background:"#0D4A20",color:"#90C898",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:99,border:"1px solid #1A5A2A"}}>
                    ATS {rewrittenCV.ats_score}%
                  </span>
                </div>
              </div>
              <div style={{fontSize:13,color:"#C8E600",fontWeight:600,marginBottom:4}}>{rewrittenCV.title}</div>
              <p style={{fontSize:12,color:"#90C898",lineHeight:1.6,marginBottom:12,fontStyle:"italic"}}>
                &ldquo;{rewrittenCV.summary}&rdquo;
              </p>
              {rewrittenCV.keywords_added?.length > 0 && (
                <div>
                  <div style={{fontSize:11,color:"#3A7A4A",marginBottom:6,fontWeight:600}}>Keywords added for ATS:</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                    {rewrittenCV.keywords_added.slice(0,6).map((kw: string) => (
                      <span key={kw} style={{background:"rgba(200,230,0,0.1)",color:"#C8E600",fontSize:11,padding:"2px 8px",borderRadius:99,border:"1px solid rgba(200,230,0,0.3)"}}>{kw}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{background:"rgba(200,230,0,0.06)",border:"1px solid rgba(200,230,0,0.2)",borderRadius:10,padding:12,marginBottom:16,fontSize:12,color:"#90C898",lineHeight:1.7}}>
              📥 <strong style={{color:"#C8E600"}}>Your rewritten CV downloads automatically</strong> when you click Apply — ready to upload on the employer site.
            </div>

            {!autoApply && (
              <div style={{background:"rgba(255,165,0,0.08)",border:"1px solid rgba(255,165,0,0.3)",borderRadius:10,padding:12,marginBottom:16}}>
                <div style={{fontSize:12,fontWeight:700,color:"#FFA500",marginBottom:8}}>🎯 Assisted apply — 3 steps</div>
                {["CV downloads automatically to your device","Employer portal opens in a new tab","Upload your downloaded CV and submit"].map((s,i) => (
                  <div key={i} style={{display:"flex",gap:8,marginBottom:6,alignItems:"flex-start"}}>
                    <span style={{background:"#FFA500",color:"#052A14",fontSize:10,fontWeight:800,width:18,height:18,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>{i+1}</span>
                    <span style={{fontSize:12,color:"#90C898"}}>{s}</span>
                  </div>
                ))}
              </div>
            )}

            {employerEmail && !autoEmailSent && (
              <div style={{marginBottom:12}}>
                <div style={{background:"rgba(0,180,80,0.08)",border:"1.5px solid #00B850",borderRadius:12,padding:"14px 16px"}}>
                  <div style={{fontSize:10,fontWeight:700,color:"#00C864",letterSpacing:"1.2px",textTransform:"uppercase",marginBottom:6}}>✉️ AUTO-APPLY AVAILABLE</div>
                  <div style={{fontSize:13,color:"#FFFFFF",marginBottom:10,lineHeight:1.6}}>
                    We found the employer&apos;s email. We can send your application directly — no portal needed.
                  </div>
                  <button
                    onClick={handleAutoEmail}
                    disabled={autoEmailSending}
                    style={{background:"#00C864",color:"#052A14",fontSize:13,fontWeight:800,padding:"10px 20px",borderRadius:99,border:"none",cursor:autoEmailSending?"default":"pointer",width:"100%",opacity:autoEmailSending?0.7:1}}>
                    {autoEmailSending ? '📤 Sending your application...' : '✉️ Auto-apply — we email for you'}
                  </button>
                  {autoEmailError && <div style={{fontSize:12,color:"#F09595",marginTop:8}}>{autoEmailError}</div>}
                </div>
                <div style={{textAlign:"center",fontSize:11,color:"#3A7A4A",margin:"8px 0 4px"}}>— or apply manually below —</div>
              </div>
            )}
            {autoEmailSent && (
              <div style={{background:"rgba(0,180,80,0.1)",border:"1.5px solid #00C864",borderRadius:12,padding:"16px",marginBottom:12,textAlign:"center"}}>
                <div style={{fontSize:24,marginBottom:6}}>✅</div>
                <div style={{fontSize:14,fontWeight:700,color:"#00C864",marginBottom:4}}>Application sent automatically</div>
                <div style={{fontSize:12,color:"#90C898",lineHeight:1.6}}>Your email was sent directly to the employer at {employerEmail}. Check your inbox for confirmation.</div>
              </div>
            )}
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <button
                onClick={handleApply}
                disabled={applying}
                style={{flex:1,background:"#C8E600",color:"#052A14",fontSize:14,fontWeight:800,padding:"13px 20px",borderRadius:99,border:"none",cursor:applying?"default":"pointer",opacity:applying?0.8:1}}>
                {applying ? '📥 Downloading CV + Opening job...' : autoApply ? '⚡ Apply now — CV downloads automatically' : '🎯 Apply + Download CV'}
              </button>
            </div>
            <div style={{marginTop:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <button onClick={onClose} style={{background:"transparent",color:"#5A9A6A",fontSize:12,fontWeight:600,padding:"8px 0",border:"none",cursor:"pointer"}}>
                Save for later
              </button>
              <div style={{fontSize:11,color:"#3A7A4A"}}>
                Free applications after this: <strong style={{color:"#C8E600"}}>{Math.max(0, FREE_LIMIT - applyCount - 1)}</strong>
              </div>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div style={{textAlign:"center",padding:"24px 0"}}>
            <div style={{fontSize:48,marginBottom:16}}>🎉</div>
            <h3 style={{fontSize:20,fontWeight:800,color:"#FFFFFF",marginBottom:8}}>CV downloaded — Application opened</h3>
            <p style={{fontSize:14,color:"#5A9A6A",marginBottom:20,lineHeight:1.7}}>
              Your rewritten CV has been saved to your device. Upload it on the employer site to complete your application.
            </p>
            <button onClick={onClose} style={{background:"#C8E600",color:"#052A14",fontSize:14,fontWeight:800,padding:"12px 28px",borderRadius:99,border:"none",cursor:"pointer"}}>
              Back to jobs
            </button>
          </div>
        )}

        {step === 'paywall' && (
          <div style={{textAlign:"center",padding:"16px 0"}}>
            <div style={{fontSize:40,marginBottom:16}}>🔑</div>
            <h3 style={{fontSize:20,fontWeight:800,color:"#FFFFFF",marginBottom:8}}>You have used your 3 free applications</h3>
            <p style={{fontSize:14,color:"#5A9A6A",marginBottom:20,lineHeight:1.7}}>Unlock more to keep applying.</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
              <div style={{background:"#0D3A1A",border:"1.5px solid #1A5A2A",borderRadius:14,padding:16,textAlign:"center"}}>
                <div style={{fontSize:22,fontWeight:800,color:"#FFFFFF",marginBottom:4}}>
                  {currency === 'ZAR' ? 'R185' : '$10'}<span style={{fontSize:12,color:"#888"}}>/pack</span>
                </div>
                <div style={{fontSize:12,color:"#5A9A6A",marginBottom:12}}>10 applications. No expiry.</div>
                <button
                  onClick={() => handlePayment('credits')}
                  disabled={paying}
                  style={{display:"block",width:"100%",background:"#052A14",color:"#C8E600",fontSize:12,fontWeight:800,padding:"9px",borderRadius:99,border:"1px solid #C8E600",cursor:paying?"default":"pointer",opacity:paying?0.7:1}}>
                  {paying ? 'Loading...' : 'Get credits'}
                </button>
              </div>
              <div style={{background:"#0D3A1A",border:"1.5px solid #C8E600",borderRadius:14,padding:16,textAlign:"center"}}>
                <div style={{background:"#C8E600",color:"#052A14",fontSize:10,fontWeight:800,padding:"2px 10px",borderRadius:99,display:"inline-block",marginBottom:6}}>Best value</div>
                <div style={{fontSize:22,fontWeight:800,color:"#FFFFFF",marginBottom:4}}>
                  {currency === 'ZAR' ? 'R370' : '$20'}<span style={{fontSize:12,color:"#888"}}>/month</span>
                </div>
                <div style={{fontSize:12,color:"#5A9A6A",marginBottom:12}}>Unlimited. Everything.</div>
                <button
                  onClick={() => handlePayment('pro')}
                  disabled={paying}
                  style={{display:"block",width:"100%",background:"#C8E600",color:"#052A14",fontSize:12,fontWeight:800,padding:"9px",borderRadius:99,border:"none",cursor:paying?"default":"pointer",opacity:paying?0.7:1}}>
                  {paying ? 'Loading...' : 'Go Pro'}
                </button>
              </div>
            </div>
            {paymentError && (
              <div style={{background:"rgba(163,45,45,0.2)",border:"1px solid #A32D2D",borderRadius:10,padding:"10px 16px",fontSize:13,color:"#F09595",marginBottom:12}}>
                {paymentError}
              </div>
            )}
            <button onClick={onClose} style={{background:"transparent",color:"#5A9A6A",fontSize:13,cursor:"pointer",border:"none"}}>Maybe later</button>
          </div>
        )}

      </div>
    </div>
  );
}
