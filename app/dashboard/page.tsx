'use client';
import { useUser, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import QuickApply from '../components/QuickApply';

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  dateApplied: string;
  status: 'Applied' | 'Interview' | 'Offer' | 'Rejected';
  jobUrl?: string;
}

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

export default function Dashboard() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  // ── Section state ──────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState<'overview' | 'cv' | 'referral' | 'applications'>('overview');
  const [isMobile, setIsMobile] = useState(false);

  // ── CV state ───────────────────────────────────────────────────
  const [uploading, setUploading] = useState(false);
  const [cvData, setCvData] = useState<any>(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [showRewrite, setShowRewrite] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [jobCompany, setJobCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [rewriting, setRewriting] = useState(false);
  const [rewrittenCV, setRewrittenCV] = useState<any>(null);
  const [rewriteError, setRewriteError] = useState('');

  // ── Referral state ────────────────────────────────────────────
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [referralsCount] = useState(0);

  // ── Applications state ────────────────────────────────────────
  const [applications, setApplications] = useState<Application[]>([]);

  // ── Payment state ─────────────────────────────────────────────
  const [currency, setCurrency] = useState<'ZAR' | 'USD'>('USD');
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const freeRewrites = 3;

  // ── Recommended jobs ──────────────────────────────────────────
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // ── Profile from onboarding ───────────────────────────────────
  const [profile, setProfile] = useState<any>(null);

  // ── AI actions modal ──────────────────────────────────────────
  const [showAiModal, setShowAiModal] = useState<'tailor' | 'cover' | null>(null);
  const [coverJobTitle, setCoverJobTitle] = useState('');
  const [coverCompany, setCoverCompany] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [generatingCover, setGeneratingCover] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.push('/sign-in');
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (isSignedIn && user) {
      sendWelcomeEmailOnce();
      setTimeout(() => generateReferralLink(), 500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, user]);

  useEffect(() => {
    const stored = localStorage.getItem('jobsesame_applications');
    if (stored) setApplications(JSON.parse(stored));
    const storedCv = localStorage.getItem('jobsesame_cv_data');
    if (storedCv) setCvData(JSON.parse(storedCv));
    const storedProfile = localStorage.getItem('jobsesame_profile');
    if (storedProfile) setProfile(JSON.parse(storedProfile));
  }, []);

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(data => { if (data.country_code === 'ZA') setCurrency('ZAR'); })
      .catch(() => {});
  }, []);

  // Fetch recommended jobs based on profile preference
  useEffect(() => {
    const p = profile || {};
    const titleQuery = p.preferredJobTitle || p.jobTitle || cvData?.title || 'software engineer';
    setLoadingJobs(true);
    fetch(`/api/jobs?query=${encodeURIComponent(titleQuery)}&location=`)
      .then(r => r.json())
      .then(data => setRecommendedJobs((data.jobs || []).slice(0, 4)))
      .catch(() => {})
      .finally(() => setLoadingJobs(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const updateApplicationStatus = (id: string, status: Application['status']) => {
    const updated = applications.map(a => a.id === id ? { ...a, status } : a);
    setApplications(updated);
    localStorage.setItem('jobsesame_applications', JSON.stringify(updated));
  };

  const sendWelcomeEmailOnce = async () => {
    if (localStorage.getItem('jobsesame_welcome_sent')) return;
    const email = user?.emailAddresses[0]?.emailAddress;
    const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || '';
    const userId = user?.id;
    if (!email || !userId) return;
    try {
      await fetch('/api/welcome-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, userId }),
      });
    } catch { /* Non-critical */ }
    localStorage.setItem('jobsesame_welcome_sent', 'true');
  };

  const generateReferralLink = async () => {
    try {
      const res = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, action: 'get' }),
      });
      const data = await res.json();
      if (data.success) setReferralLink(data.referralLink);
    } catch { /* Non-critical */ }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (file.type !== 'application/pdf') { setError('Please upload a PDF file only'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('File too large. Maximum 10MB'); return; }
    setUploading(true); setError('');
    try {
      const formData = new FormData();
      formData.append('cv', file);
      const res = await fetch('/api/cv', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setCvData(data.cvData);
        localStorage.setItem('jobsesame_cv_data', JSON.stringify(data.cvData));
      } else {
        setError(data.error || 'Failed to process CV');
      }
    } catch { setError('Something went wrong. Please try again.'); }
    finally { setUploading(false); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleRewrite = async () => {
    if (!jobTitle) { setRewriteError('Please enter a job title'); return; }
    setRewriting(true); setRewriteError('');
    try {
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvData, jobTitle, jobCompany, jobDescription }),
      });
      const data = await res.json();
      if (data.success) { setRewrittenCV(data.rewrittenCV); setShowRewrite(false); }
      else { setRewriteError(data.error || 'Failed to rewrite CV'); }
    } catch { setRewriteError('Something went wrong. Please try again.'); }
    finally { setRewriting(false); }
  };

  const handleGenerateCoverLetter = async () => {
    if (!coverJobTitle) return;
    setGeneratingCover(true);
    try {
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvData, jobTitle: coverJobTitle, jobCompany: coverCompany, jobDescription: `Generate a cover letter for this position.` }),
      });
      const data = await res.json();
      if (data.success && data.rewrittenCV?.summary) {
        setCoverLetter(`Dear Hiring Manager,\n\nI am writing to express my strong interest in the ${coverJobTitle} role${coverCompany ? ` at ${coverCompany}` : ''}.\n\n${data.rewrittenCV.summary}\n\nI am excited about the opportunity to contribute my ${data.rewrittenCV.skills?.slice(0,3).join(', ')} skills to your team.\n\nThank you for your consideration.\n\nKind regards,\n${cvData?.name || user?.firstName || 'Applicant'}`);
      }
    } catch { /* Non-critical */ }
    finally { setGeneratingCover(false); }
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const msg = `I found this amazing AI job platform that rewrites your CV in 30 seconds! Get 3 free rewrites: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const shareEmail = () => {
    const subject = 'You need to try Jobsesame — free AI CV rewriter';
    const body = `Hi!\n\nI have been using Jobsesame to find jobs and it is incredible. AI rewrites your CV for any job in 30 seconds.\n\nSign up free: ${referralLink}\n\nYou get 3 free CV rewrites — no card needed.`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const handlePayment = async (plan: 'credits' | 'pro') => {
    const email = user?.emailAddresses[0]?.emailAddress;
    if (!email) { router.push('/sign-in'); return; }
    setPaying(true); setPaymentError('');
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

  // ── Loading state ─────────────────────────────────────────────
  if (!isLoaded) {
    return (
      <div style={{background:"#052A14",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:32}}>
        <div style={{fontSize:22,fontWeight:800}}>
          <span style={{color:"#FFFFFF"}}>job</span>
          <span style={{color:"#C8E600"}}>sesame</span>
        </div>
        <div style={{width:40,height:40,border:"3px solid #1A5A2A",borderTop:"3px solid #C8E600",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }
  if (!isSignedIn) return null;

  const firstName = user?.firstName || profile?.name?.split(' ')[0] || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'there';
  const atsScore = cvData?.ats_score || (cvData ? 72 : 0);
  const today = new Date().toLocaleDateString('en-ZA', {weekday:'long',day:'numeric',month:'long'});
  const navBtnStyle = (s: string) => ({
    padding: '8px 16px',
    borderRadius: 99,
    fontSize: isMobile ? 12 : 13,
    fontWeight: 700,
    cursor: 'pointer',
    border: 'none',
    background: activeSection === s ? '#C8E600' : 'transparent',
    color: activeSection === s ? '#052A14' : '#A8D8B0',
    whiteSpace: 'nowrap',
  } as React.CSSProperties);

  return (
    <main style={{fontFamily:"'Plus Jakarta Sans',sans-serif",background:"#052A14",minHeight:"100vh"}}>

      {/* QUICK APPLY MODAL */}
      {selectedJob && (
        <QuickApply job={selectedJob} onClose={() => setSelectedJob(null)} currency={currency} />
      )}

      {/* AI ACTIONS MODAL */}
      {showAiModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"#072E16",border:"1.5px solid #C8E600",borderRadius:18,padding:28,width:"100%",maxWidth:520,maxHeight:"90vh",overflowY:"auto"}}>
            {showAiModal === 'tailor' && (
              <div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                  <h3 style={{fontSize:18,fontWeight:800,color:"#FFFFFF"}}>Tailor CV for a job</h3>
                  <button onClick={()=>setShowAiModal(null)} style={{background:"transparent",border:"none",color:"#5A9A6A",fontSize:20,cursor:"pointer"}}>✕</button>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:20}}>
                  <div>
                    <label style={{fontSize:12,color:"#5A9A6A",fontWeight:600,display:"block",marginBottom:6}}>Job title *</label>
                    <input value={jobTitle} onChange={e=>setJobTitle(e.target.value)} placeholder="e.g. Senior Product Manager" style={{width:"100%",padding:"11px 14px",border:"1.5px solid #1A5A2A",borderRadius:10,fontSize:14,color:"#FFFFFF",background:"#0D3A1A",outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
                  </div>
                  <div>
                    <label style={{fontSize:12,color:"#5A9A6A",fontWeight:600,display:"block",marginBottom:6}}>Company</label>
                    <input value={jobCompany} onChange={e=>setJobCompany(e.target.value)} placeholder="e.g. Standard Bank" style={{width:"100%",padding:"11px 14px",border:"1.5px solid #1A5A2A",borderRadius:10,fontSize:14,color:"#FFFFFF",background:"#0D3A1A",outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
                  </div>
                  <div>
                    <label style={{fontSize:12,color:"#5A9A6A",fontWeight:600,display:"block",marginBottom:6}}>Job description</label>
                    <textarea value={jobDescription} onChange={e=>setJobDescription(e.target.value)} placeholder="Paste the job description..." rows={4} style={{width:"100%",padding:"11px 14px",border:"1.5px solid #1A5A2A",borderRadius:10,fontSize:13,color:"#FFFFFF",background:"#0D3A1A",outline:"none",fontFamily:"inherit",resize:"vertical",boxSizing:"border-box"}}/>
                  </div>
                </div>
                {rewriteError && <div style={{background:"rgba(163,45,45,0.2)",border:"1px solid #A32D2D",borderRadius:10,padding:"10px 16px",fontSize:13,color:"#F09595",marginBottom:16}}>{rewriteError}</div>}
                <div style={{display:"flex",gap:10}}>
                  <button onClick={handleRewrite} disabled={rewriting||!cvData} style={{flex:1,background:rewriting||!cvData?"#1A4A2A":"#C8E600",color:rewriting||!cvData?"#3A7A4A":"#052A14",fontSize:14,fontWeight:800,padding:"12px",borderRadius:99,border:"none",cursor:rewriting||!cvData?"default":"pointer"}}>
                    {rewriting ? 'Rewriting...' : !cvData ? 'Upload CV first' : 'Rewrite my CV'}
                  </button>
                  <button onClick={()=>setShowAiModal(null)} style={{background:"transparent",color:"#5A9A6A",fontSize:13,fontWeight:600,padding:"12px 20px",borderRadius:99,border:"1px solid #1A5A2A",cursor:"pointer"}}>Cancel</button>
                </div>
                {rewriting && <div style={{marginTop:12,fontSize:13,color:"#5A9A6A",fontStyle:"italic"}}>AI is rewriting your CV... ~15 seconds</div>}
              </div>
            )}
            {showAiModal === 'cover' && (
              <div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                  <h3 style={{fontSize:18,fontWeight:800,color:"#FFFFFF"}}>Generate cover letter</h3>
                  <button onClick={()=>{setShowAiModal(null);setCoverLetter('');}} style={{background:"transparent",border:"none",color:"#5A9A6A",fontSize:20,cursor:"pointer"}}>✕</button>
                </div>
                {!coverLetter ? (
                  <div>
                    <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:20}}>
                      <div>
                        <label style={{fontSize:12,color:"#5A9A6A",fontWeight:600,display:"block",marginBottom:6}}>Job title *</label>
                        <input value={coverJobTitle} onChange={e=>setCoverJobTitle(e.target.value)} placeholder="e.g. Marketing Manager" style={{width:"100%",padding:"11px 14px",border:"1.5px solid #1A5A2A",borderRadius:10,fontSize:14,color:"#FFFFFF",background:"#0D3A1A",outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
                      </div>
                      <div>
                        <label style={{fontSize:12,color:"#5A9A6A",fontWeight:600,display:"block",marginBottom:6}}>Company</label>
                        <input value={coverCompany} onChange={e=>setCoverCompany(e.target.value)} placeholder="e.g. Nedbank" style={{width:"100%",padding:"11px 14px",border:"1.5px solid #1A5A2A",borderRadius:10,fontSize:14,color:"#FFFFFF",background:"#0D3A1A",outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}/>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:10}}>
                      <button onClick={handleGenerateCoverLetter} disabled={generatingCover||!cvData||!coverJobTitle} style={{flex:1,background:generatingCover||!cvData||!coverJobTitle?"#1A4A2A":"#C8E600",color:generatingCover||!cvData||!coverJobTitle?"#3A7A4A":"#052A14",fontSize:14,fontWeight:800,padding:"12px",borderRadius:99,border:"none",cursor:generatingCover||!cvData||!coverJobTitle?"default":"pointer"}}>
                        {generatingCover ? 'Generating...' : !cvData ? 'Upload CV first' : 'Generate cover letter'}
                      </button>
                      <button onClick={()=>setShowAiModal(null)} style={{background:"transparent",color:"#5A9A6A",fontSize:13,fontWeight:600,padding:"12px 20px",borderRadius:99,border:"1px solid #1A5A2A",cursor:"pointer"}}>Cancel</button>
                    </div>
                    {generatingCover && <div style={{marginTop:12,fontSize:13,color:"#5A9A6A",fontStyle:"italic"}}>Writing your cover letter... ~10 seconds</div>}
                  </div>
                ) : (
                  <div>
                    <div style={{background:"#0D3A1A",borderRadius:12,padding:16,fontSize:13,color:"#A8D8B0",lineHeight:1.8,marginBottom:16,whiteSpace:"pre-wrap",maxHeight:300,overflowY:"auto"}}>
                      {coverLetter}
                    </div>
                    <div style={{display:"flex",gap:10}}>
                      <button onClick={()=>navigator.clipboard.writeText(coverLetter)} style={{flex:1,background:"#C8E600",color:"#052A14",fontSize:13,fontWeight:800,padding:"10px",borderRadius:99,border:"none",cursor:"pointer"}}>Copy letter</button>
                      <button onClick={()=>setCoverLetter('')} style={{background:"transparent",color:"#5A9A6A",fontSize:13,fontWeight:600,padding:"10px 18px",borderRadius:99,border:"1px solid #1A5A2A",cursor:"pointer"}}>New letter</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* NAV */}
      <nav style={{background:"#052A14",padding:"0 20px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #0D4A20",position:"sticky",top:0,zIndex:100}}>
        <a href="/" style={{display:"flex",alignItems:"center",gap:10,textDecoration:"none"}}>
          <div style={{width:36,height:36,background:"#C8E600",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
              <circle cx="9" cy="9" r="5.5" stroke="#052A14" strokeWidth="2.2"/>
              <circle cx="9" cy="9" r="2.5" fill="#052A14" opacity="0.4"/>
              <line x1="13.5" y1="13.5" x2="20" y2="20" stroke="#052A14" strokeWidth="2.8" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{fontSize:18,fontWeight:800}}>
            <span style={{color:"#FFFFFF"}}>job</span>
            <span style={{color:"#C8E600"}}>sesame</span>
          </span>
        </a>
        <div style={{display:"flex",alignItems:"center",gap:isMobile?6:10,overflowX:"auto"}}>
          <button style={navBtnStyle('overview')} onClick={()=>setActiveSection('overview')}>Dashboard</button>
          <button style={navBtnStyle('cv')} onClick={()=>setActiveSection('cv')}>My CV</button>
          {!isMobile && <button style={navBtnStyle('referral')} onClick={()=>setActiveSection('referral')}>Free rewrites</button>}
          <button style={navBtnStyle('applications')} onClick={()=>setActiveSection('applications')}>Applications</button>
          {!isMobile && <a href="/jobs" style={{fontSize:13,color:"#A8D8B0",fontWeight:500,textDecoration:"none",padding:"8px 12px",whiteSpace:"nowrap"}}>Find Jobs</a>}
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      <div style={{padding:isMobile?"16px 16px 32px":"32px 28px",maxWidth:960,margin:"0 auto"}}>

        {/* ── WELCOME HEADER (always visible) ─────────────────────── */}
        <div style={{marginBottom:24}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:16}}>
            <div>
              <h1 style={{fontSize:isMobile?20:26,fontWeight:800,color:"#FFFFFF",marginBottom:4}}>
                Welcome back, <span style={{color:"#C8E600"}}>{firstName}</span> 👋
              </h1>
              <p style={{fontSize:13,color:"#5A9A6A"}}>{today}</p>
            </div>
            <a href="/jobs" style={{background:"#C8E600",color:"#052A14",fontSize:13,fontWeight:800,padding:"10px 22px",borderRadius:99,textDecoration:"none",whiteSpace:"nowrap",flexShrink:0}}>
              Browse Jobs →
            </a>
          </div>

          {/* Quick stats row */}
          <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",gap:10}}>
            {[
              {label:"Applications sent",value:applications.length,color:"#90C898",icon:"📤"},
              {label:"Interviews",value:applications.filter(a=>a.status==='Interview').length,color:"#FFA500",icon:"📞"},
              {label:"Offers",value:applications.filter(a=>a.status==='Offer').length,color:"#C8E600",icon:"🎉"},
              {label:"CV score",value:atsScore?`${atsScore}%`:"—",color:"#C8E600",icon:"📊"},
            ].map(s=>(
              <div key={s.label} style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:12,padding:"14px 16px"}}>
                <div style={{fontSize:10,color:"#3A7A4A",fontWeight:700,textTransform:"uppercase",letterSpacing:"1px",marginBottom:6}}>{s.icon} {s.label}</div>
                <div style={{fontSize:24,fontWeight:800,color:s.color,lineHeight:1}}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ──────────────────────────────────────────────────────────── */}
        {/* OVERVIEW TAB */}
        {/* ──────────────────────────────────────────────────────────── */}
        {activeSection === 'overview' && (
          <div style={{display:"flex",flexDirection:"column",gap:20}}>

            {/* B. CV Analysis Panel */}
            {cvData ? (
              <div style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:16,padding:isMobile?20:24}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,flexWrap:"wrap",gap:10}}>
                  <h2 style={{fontSize:16,fontWeight:800,color:"#FFFFFF"}}>CV Analysis</h2>
                  <button onClick={()=>setActiveSection('cv')} style={{background:"#C8E600",color:"#052A14",fontSize:12,fontWeight:800,padding:"7px 16px",borderRadius:99,border:"none",cursor:"pointer"}}>Improve my CV</button>
                </div>
                <div style={{display:"flex",gap:20,alignItems:"flex-start",flexWrap:"wrap"}}>
                  {/* Circular ATS score */}
                  <div style={{textAlign:"center",flexShrink:0}}>
                    <div style={{position:"relative",width:100,height:100,margin:"0 auto 8px"}}>
                      <svg width="100" height="100" style={{transform:"rotate(-90deg)"}}>
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#1A4A2A" strokeWidth="9"/>
                        <circle cx="50" cy="50" r="40" fill="none" stroke={atsScore>=80?"#C8E600":atsScore>=60?"#FFA500":"#F09595"} strokeWidth="9"
                          strokeDasharray={`${2*Math.PI*40}`}
                          strokeDashoffset={`${2*Math.PI*40*(1-atsScore/100)}`}
                          strokeLinecap="round"/>
                      </svg>
                      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
                        <span style={{fontSize:20,fontWeight:800,color:"#C8E600",lineHeight:1}}>{atsScore}%</span>
                        <span style={{fontSize:9,color:"#5A9A6A",lineHeight:1.3,marginTop:2}}>ATS score</span>
                      </div>
                    </div>
                    <div style={{fontSize:11,color:atsScore>=80?"#C8E600":atsScore>=60?"#FFA500":"#F09595",fontWeight:700}}>
                      {atsScore>=80?"Excellent":atsScore>=60?"Good":"Needs work"}
                    </div>
                  </div>
                  <div style={{flex:1,minWidth:200}}>
                    <div style={{marginBottom:12}}>
                      <div style={{fontSize:14,fontWeight:800,color:"#FFFFFF",marginBottom:2}}>{cvData.name}</div>
                      <div style={{fontSize:13,color:"#C8E600",fontWeight:600}}>{cvData.title}</div>
                    </div>
                    <div style={{fontSize:12,color:"#5A9A6A",marginBottom:10}}>
                      <strong style={{color:"#A8D8B0"}}>Suggestions:</strong>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      {atsScore < 90 && (
                        <div style={{display:"flex",gap:8,alignItems:"flex-start",fontSize:12,color:"#90C898"}}>
                          <span style={{color:"#FFA500",flexShrink:0}}>•</span>
                          Add more measurable achievements (numbers, percentages)
                        </div>
                      )}
                      {(!cvData.skills || cvData.skills.length < 5) && (
                        <div style={{display:"flex",gap:8,alignItems:"flex-start",fontSize:12,color:"#90C898"}}>
                          <span style={{color:"#FFA500",flexShrink:0}}>•</span>
                          Expand your skills section with relevant keywords
                        </div>
                      )}
                      <div style={{display:"flex",gap:8,alignItems:"flex-start",fontSize:12,color:"#90C898"}}>
                        <span style={{color:"#C8E600",flexShrink:0}}>✓</span>
                        Use &ldquo;Tailor CV for a job&rdquo; to boost your score for each role
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{background:"#072E16",border:"2px dashed #1A5A2A",borderRadius:16,padding:"28px 24px",textAlign:"center"}}>
                <div style={{fontSize:36,marginBottom:12}}>📄</div>
                <h3 style={{fontSize:16,fontWeight:800,color:"#FFFFFF",marginBottom:6}}>Upload your CV to get started</h3>
                <p style={{fontSize:13,color:"#5A9A6A",marginBottom:16,maxWidth:360,margin:"0 auto 16px"}}>AI analyses your CV and builds your career profile in seconds — then matches you to the best jobs.</p>
                <button onClick={()=>setActiveSection('cv')} style={{background:"#C8E600",color:"#052A14",fontSize:13,fontWeight:800,padding:"11px 28px",borderRadius:99,border:"none",cursor:"pointer"}}>Upload my CV</button>
              </div>
            )}

            {/* C. AI Actions Row */}
            <div>
              <h2 style={{fontSize:15,fontWeight:800,color:"#FFFFFF",marginBottom:12}}>AI actions</h2>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:10}}>
                {[
                  {icon:"🧬",title:"Tailor CV for a job",desc:"AI rewrites your CV for any role in 30 seconds",action:()=>setShowAiModal('tailor'),color:"#C8E600"},
                  {icon:"✉️",title:"Generate cover letter",desc:"Personalised cover letter in seconds",action:()=>setShowAiModal('cover'),color:"#90C898"},
                  {icon:"⚡",title:"Optimise my CV",desc:"Full AI optimisation on the CV Optimiser tool",action:()=>window.location.href='/optimise',color:"#A8D8B0"},
                ].map(a=>(
                  <button key={a.title} onClick={a.action} style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:14,padding:18,textAlign:"left",cursor:"pointer",transition:"border-color 0.15s"}}
                    onMouseEnter={e=>(e.currentTarget.style.borderColor="#C8E600")}
                    onMouseLeave={e=>(e.currentTarget.style.borderColor="#1A4A2A")}>
                    <div style={{fontSize:24,marginBottom:8}}>{a.icon}</div>
                    <div style={{fontSize:13,fontWeight:800,color:a.color,marginBottom:4}}>{a.title}</div>
                    <div style={{fontSize:11,color:"#3A7A4A",lineHeight:1.5}}>{a.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* D. Recommended Jobs */}
            <div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <h2 style={{fontSize:15,fontWeight:800,color:"#FFFFFF"}}>
                  Recommended for you
                  {profile?.preferredJobTitle && <span style={{fontSize:12,color:"#5A9A6A",fontWeight:400,marginLeft:8}}>based on: {profile.preferredJobTitle}</span>}
                </h2>
                <a href="/jobs" style={{fontSize:12,color:"#C8E600",fontWeight:700,textDecoration:"none"}}>View all jobs →</a>
              </div>
              {loadingJobs ? (
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,1fr)",gap:10}}>
                  {[1,2,3,4].map(i=>(
                    <div key={i} style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:12,padding:16,height:100}}/>
                  ))}
                </div>
              ) : (
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,1fr)",gap:10}}>
                  {recommendedJobs.map(job=>(
                    <div key={job.id} style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:12,padding:16}}>
                      <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:10}}>
                        <div style={{width:36,height:36,borderRadius:8,background:"#0D3A1A",color:"#C8E600",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,flexShrink:0}}>
                          {job.company.charAt(0).toUpperCase()}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:13,fontWeight:700,color:"#FFFFFF",marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{job.title}</div>
                          <div style={{fontSize:11,color:"#5A9A6A",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{job.company} · {job.location}</div>
                        </div>
                      </div>
                      <div style={{display:"flex",gap:8}}>
                        <button onClick={()=>setSelectedJob(job)} style={{flex:1,background:"#C8E600",color:"#052A14",fontSize:11,fontWeight:800,padding:"7px 0",borderRadius:99,border:"none",cursor:"pointer"}}>
                          ⚡ Quick Apply
                        </button>
                        <button onClick={()=>window.open(job.url,'_blank')} style={{background:"transparent",color:"#5A9A6A",fontSize:11,fontWeight:600,padding:"7px 12px",borderRadius:99,border:"1px solid #1A5A2A",cursor:"pointer"}}>
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                  {recommendedJobs.length === 0 && !loadingJobs && (
                    <div style={{gridColumn:"1/-1",textAlign:"center",padding:"32px 0"}}>
                      <div style={{fontSize:13,color:"#5A9A6A",marginBottom:12}}>No recommended jobs yet</div>
                      <a href="/jobs" style={{background:"#C8E600",color:"#052A14",fontSize:12,fontWeight:800,padding:"9px 22px",borderRadius:99,textDecoration:"none",display:"inline-block"}}>Browse all jobs</a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* E. Quick Actions */}
            <div>
              <h2 style={{fontSize:15,fontWeight:800,color:"#FFFFFF",marginBottom:12}}>Quick actions</h2>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                {[
                  {label:"🌍 View all jobs",href:"/jobs"},
                  {label:"📋 My Applications",onClick:()=>setActiveSection('applications')},
                  {label:"🎁 Free rewrites",onClick:()=>setActiveSection('referral')},
                  {label:"📄 Edit CV",onClick:()=>setActiveSection('cv')},
                  {label:"⚡ CV Optimiser",href:"/optimise"},
                ].map(a=>(
                  a.href
                    ? <a key={a.label} href={a.href} style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:10,padding:"10px 18px",fontSize:13,color:"#A8D8B0",fontWeight:600,textDecoration:"none"}}>{a.label}</a>
                    : <button key={a.label} onClick={a.onClick} style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:10,padding:"10px 18px",fontSize:13,color:"#A8D8B0",fontWeight:600,cursor:"pointer",border:"1.5px solid #1A4A2A"} as React.CSSProperties}>{a.label}</button>
                ))}
              </div>
            </div>

            {/* F. Application Tracker (mini) */}
            {applications.length > 0 && (
              <div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                  <h2 style={{fontSize:15,fontWeight:800,color:"#FFFFFF"}}>Recent applications</h2>
                  <button onClick={()=>setActiveSection('applications')} style={{background:"transparent",border:"none",fontSize:12,color:"#C8E600",fontWeight:700,cursor:"pointer"}}>View all →</button>
                </div>
                <div style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:14,overflow:"hidden"}}>
                  {applications.slice(0,4).map((app,i)=>(
                    <div key={app.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",borderBottom:i<Math.min(3,applications.length-1)?"1px solid #0D3A1A":"none",flexWrap:"wrap"}}>
                      <div style={{flex:1,minWidth:140}}>
                        <div style={{fontSize:13,fontWeight:700,color:"#FFFFFF",marginBottom:1}}>{app.jobTitle}</div>
                        <div style={{fontSize:11,color:"#5A9A6A"}}>{app.company} · {new Date(app.dateApplied).toLocaleDateString('en-ZA',{day:'numeric',month:'short'})}</div>
                      </div>
                      <select
                        value={app.status}
                        onChange={e=>updateApplicationStatus(app.id,e.target.value as Application['status'])}
                        style={{padding:"4px 10px",borderRadius:99,border:"1.5px solid",fontSize:11,fontWeight:700,cursor:"pointer",outline:"none",background:"#0D3A1A",borderColor:app.status==='Offer'?'#C8E600':app.status==='Interview'?'#FFA500':app.status==='Rejected'?'#A32D2D':'#1A5A2A',color:app.status==='Offer'?'#C8E600':app.status==='Interview'?'#FFA500':app.status==='Rejected'?'#F09595':'#90C898'}}>
                        <option value="Applied">Applied</option>
                        <option value="Interview">Interview</option>
                        <option value="Offer">Offer</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ──────────────────────────────────────────────────────────── */}
        {/* MY CV TAB                                                    */}
        {/* ──────────────────────────────────────────────────────────── */}
        {activeSection === 'cv' && (
          <div>
            {!cvData ? (
              <div style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:16,padding:32,textAlign:"center"}}>
                <div style={{fontSize:40,marginBottom:16}}>📄</div>
                <h2 style={{fontSize:20,fontWeight:800,color:"#FFFFFF",marginBottom:8}}>Upload your CV</h2>
                <p style={{fontSize:14,color:"#5A9A6A",marginBottom:24,maxWidth:400,margin:"0 auto 24px"}}>
                  Upload your CV once. AI reads everything and builds your complete career profile in seconds.
                </p>
                <div
                  onDrop={handleDrop}
                  onDragOver={e=>{e.preventDefault();setDragOver(true);}}
                  onDragLeave={()=>setDragOver(false)}
                  style={{border:`2px dashed ${dragOver?'#C8E600':'#1A5A2A'}`,borderRadius:14,padding:"40px 24px",marginBottom:16,background:dragOver?'rgba(200,230,0,0.05)':'transparent',transition:"all 0.2s",cursor:"pointer"}}>
                  <div style={{fontSize:13,color:"#5A9A6A",marginBottom:12}}>
                    {uploading ? 'AI is reading your CV...' : 'Drag and drop your CV here'}
                  </div>
                  {!uploading && (
                    <div>
                      <div style={{fontSize:12,color:"#3A7A4A",marginBottom:16}}>or</div>
                      <label style={{cursor:"pointer"}}>
                        <input type="file" accept=".pdf" onChange={handleFileInput} style={{display:"none"}}/>
                        <span style={{background:"#C8E600",color:"#052A14",fontSize:13,fontWeight:800,padding:"10px 24px",borderRadius:99,cursor:"pointer"}}>
                          Choose PDF file
                        </span>
                      </label>
                    </div>
                  )}
                  {uploading && <div style={{marginTop:16,fontSize:14,color:"#C8E600",fontWeight:700}}>Reading your CV... ~10 seconds</div>}
                </div>
                {error && <div style={{background:"rgba(163,45,45,0.2)",border:"1px solid #A32D2D",borderRadius:10,padding:"10px 16px",fontSize:13,color:"#F09595",marginBottom:16}}>{error}</div>}
                <div style={{fontSize:11,color:"#3A7A4A"}}>PDF only · Maximum 10MB · Processed securely</div>
              </div>
            ) : rewrittenCV ? (
              <div>
                <div style={{background:"#C8E600",borderRadius:14,padding:16,marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
                  <div>
                    <div style={{fontSize:15,fontWeight:800,color:"#052A14"}}>CV rewritten for {jobTitle}</div>
                    <div style={{fontSize:12,color:"#2A5A14"}}>Match: {rewrittenCV.match_score}% · ATS: {rewrittenCV.ats_score}%</div>
                  </div>
                  <button onClick={()=>setRewrittenCV(null)} style={{background:"#052A14",color:"#C8E600",fontSize:12,fontWeight:700,padding:"7px 16px",borderRadius:99,border:"none",cursor:"pointer"}}>
                    Rewrite for another job
                  </button>
                </div>
                <div style={{background:"#072E16",border:"1.5px solid #C8E600",borderRadius:16,padding:28,marginBottom:20}}>
                  <h2 style={{fontSize:20,fontWeight:800,color:"#FFFFFF",marginBottom:4}}>{rewrittenCV.name}</h2>
                  <div style={{fontSize:14,color:"#C8E600",fontWeight:600,marginBottom:2}}>{rewrittenCV.title}</div>
                  <div style={{fontSize:12,color:"#5A9A6A",marginBottom:16}}>{rewrittenCV.location}</div>
                  <p style={{fontSize:13,color:"#A8D8B0",lineHeight:1.7,marginBottom:20,fontStyle:"italic"}}>&ldquo;{rewrittenCV.summary}&rdquo;</p>
                  <div style={{marginBottom:16}}>
                    <div style={{fontSize:11,color:"#3A7A4A",fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:8}}>Skills matched</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {rewrittenCV.skills?.map((s: string) => (
                        <span key={s} style={{background:"#0D4A20",color:"#90C898",fontSize:11,padding:"3px 10px",borderRadius:99,fontWeight:600}}>{s}</span>
                      ))}
                    </div>
                  </div>
                  {rewrittenCV.keywords_added?.length > 0 && (
                    <div style={{marginBottom:16}}>
                      <div style={{fontSize:11,color:"#3A7A4A",fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:8}}>Keywords added for ATS</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                        {rewrittenCV.keywords_added?.map((kw: string) => (
                          <span key={kw} style={{background:"rgba(200,230,0,0.1)",color:"#C8E600",fontSize:11,padding:"3px 10px",borderRadius:99,fontWeight:600,border:"1px solid rgba(200,230,0,0.3)"}}>{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {rewrittenCV.experience?.map((exp: any, i: number) => (
                    <div key={i} style={{marginBottom:12,padding:14,background:"#0D3A1A",borderRadius:10}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#FFFFFF",marginBottom:2}}>{exp.title}</div>
                      <div style={{fontSize:12,color:"#C8E600",marginBottom:8}}>{exp.company} · {exp.duration}</div>
                      {exp.bullets?.map((b: string, j: number) => (
                        <div key={j} style={{fontSize:12,color:"#90C898",lineHeight:1.7,paddingLeft:12,position:"relative"}}>
                          <span style={{position:"absolute",left:0,color:"#C8E600"}}>·</span>{b}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:14,padding:20,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:800,color:"#FFFFFF",marginBottom:4}}>Unlock Pro to download as PDF</div>
                    <div style={{fontSize:12,color:"#5A9A6A"}}>Unlimited rewrites. Auto-apply. {currency==='ZAR'?'R370':'$20'}/month.</div>
                  </div>
                  <button onClick={()=>handlePayment('pro')} disabled={paying} style={{background:"#C8E600",color:"#052A14",fontSize:13,fontWeight:800,padding:"10px 24px",borderRadius:99,border:"none",cursor:paying?"default":"pointer",opacity:paying?0.7:1}}>
                    {paying?'Loading...':'Upgrade to Pro'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{background:"#072E16",border:"1.5px solid #C8E600",borderRadius:16,padding:28,marginBottom:20}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12}}>
                    <div>
                      <h2 style={{fontSize:20,fontWeight:800,color:"#FFFFFF",marginBottom:4}}>{cvData.name}</h2>
                      <div style={{fontSize:13,color:"#C8E600",fontWeight:600}}>{cvData.title}</div>
                      <div style={{fontSize:12,color:"#5A9A6A",marginTop:2}}>{cvData.location}</div>
                    </div>
                    <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                      <button onClick={()=>{setCvData(null);localStorage.removeItem('jobsesame_cv_data');}} style={{background:"transparent",color:"#5A9A6A",fontSize:12,fontWeight:600,padding:"7px 16px",borderRadius:99,border:"1px solid #1A5A2A",cursor:"pointer"}}>Upload new CV</button>
                      <a href="/jobs" style={{background:"#C8E600",color:"#052A14",fontSize:12,fontWeight:800,padding:"7px 16px",borderRadius:99,textDecoration:"none",display:"inline-block"}}>Find matching jobs</a>
                    </div>
                  </div>
                  {cvData.summary && <p style={{fontSize:13,color:"#A8D8B0",lineHeight:1.7,marginBottom:20,fontStyle:"italic"}}>&ldquo;{cvData.summary}&rdquo;</p>}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16}}>
                    <div>
                      <div style={{fontSize:11,color:"#3A7A4A",fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:8}}>Skills</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                        {cvData.skills?.map((s: string) => (
                          <span key={s} style={{background:"#0D4A20",color:"#90C898",fontSize:11,padding:"3px 10px",borderRadius:99,fontWeight:600}}>{s}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{fontSize:11,color:"#3A7A4A",fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:8}}>Details</div>
                      <div style={{fontSize:12,color:"#90C898",lineHeight:1.8}}>
                        {cvData.experience_years && <div>Experience: {cvData.experience_years} years</div>}
                        {cvData.education && <div>Education: {cvData.education}</div>}
                        {cvData.languages?.length > 0 && <div>Languages: {cvData.languages.join(', ')}</div>}
                      </div>
                    </div>
                  </div>
                </div>

                {showRewrite ? (
                  <div style={{background:"#072E16",border:"1.5px solid #C8E600",borderRadius:16,padding:28,marginBottom:20}}>
                    <h3 style={{fontSize:16,fontWeight:800,color:"#FFFFFF",marginBottom:20}}>Rewrite CV for a specific job</h3>
                    <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:20}}>
                      <div>
                        <label style={{fontSize:12,color:"#5A9A6A",fontWeight:600,display:"block",marginBottom:6}}>Job title *</label>
                        <input value={jobTitle} onChange={e=>setJobTitle(e.target.value)} placeholder="e.g. Senior Project Manager" style={{width:"100%",padding:"11px 14px",border:"1.5px solid #1A5A2A",borderRadius:10,fontSize:14,color:"#FFFFFF",background:"#0D3A1A",outline:"none",fontFamily:"inherit",boxSizing:"border-box" as any}}/>
                      </div>
                      <div>
                        <label style={{fontSize:12,color:"#5A9A6A",fontWeight:600,display:"block",marginBottom:6}}>Company name</label>
                        <input value={jobCompany} onChange={e=>setJobCompany(e.target.value)} placeholder="e.g. Standard Bank" style={{width:"100%",padding:"11px 14px",border:"1.5px solid #1A5A2A",borderRadius:10,fontSize:14,color:"#FFFFFF",background:"#0D3A1A",outline:"none",fontFamily:"inherit",boxSizing:"border-box" as any}}/>
                      </div>
                      <div>
                        <label style={{fontSize:12,color:"#5A9A6A",fontWeight:600,display:"block",marginBottom:6}}>Job description (paste for best results)</label>
                        <textarea value={jobDescription} onChange={e=>setJobDescription(e.target.value)} placeholder="Paste the job description here..." rows={5} style={{width:"100%",padding:"11px 14px",border:"1.5px solid #1A5A2A",borderRadius:10,fontSize:13,color:"#FFFFFF",background:"#0D3A1A",outline:"none",fontFamily:"inherit",resize:"vertical",boxSizing:"border-box" as any}}/>
                      </div>
                    </div>
                    {rewriteError && <div style={{background:"rgba(163,45,45,0.2)",border:"1px solid #A32D2D",borderRadius:10,padding:"10px 16px",fontSize:13,color:"#F09595",marginBottom:16}}>{rewriteError}</div>}
                    <div style={{display:"flex",gap:10}}>
                      <button onClick={handleRewrite} disabled={rewriting} style={{background:"#C8E600",color:"#052A14",fontSize:14,fontWeight:800,padding:"12px 28px",borderRadius:99,border:"none",cursor:rewriting?"default":"pointer",opacity:rewriting?0.7:1}}>
                        {rewriting?'Rewriting...':'Rewrite my CV now'}
                      </button>
                      <button onClick={()=>setShowRewrite(false)} style={{background:"transparent",color:"#5A9A6A",fontSize:13,fontWeight:600,padding:"12px 20px",borderRadius:99,border:"1px solid #1A5A2A",cursor:"pointer"}}>Cancel</button>
                    </div>
                    {rewriting && <div style={{marginTop:16,fontSize:13,color:"#5A9A6A",fontStyle:"italic"}}>AI is rewriting your CV... about 15 seconds.</div>}
                  </div>
                ) : (
                  <div style={{background:"#C8E600",borderRadius:14,padding:20,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:16}}>
                    <div>
                      <div style={{fontSize:15,fontWeight:800,color:"#052A14",marginBottom:4}}>Ready to rewrite for any job</div>
                      <div style={{fontSize:12,color:"#2A5A14"}}>AI rewrites in 30 seconds. You have {freeRewrites} free rewrites.</div>
                    </div>
                    <button onClick={()=>setShowRewrite(true)} style={{background:"#052A14",color:"#C8E600",fontSize:13,fontWeight:800,padding:"10px 24px",borderRadius:99,border:"none",cursor:"pointer",whiteSpace:"nowrap"}}>
                      Rewrite my CV — free
                    </button>
                  </div>
                )}

                <div style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:14,padding:20,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:800,color:"#FFFFFF",marginBottom:4}}>Unlock Pro — all doors open</div>
                    <div style={{fontSize:12,color:"#5A9A6A"}}>Unlimited rewrites. Auto-apply. Cover letters. {currency==='ZAR'?'R370':'$20'}/month.</div>
                  </div>
                  <button onClick={()=>handlePayment('pro')} disabled={paying} style={{background:"#C8E600",color:"#052A14",fontSize:13,fontWeight:800,padding:"10px 24px",borderRadius:99,border:"none",cursor:paying?"default":"pointer",opacity:paying?0.7:1}}>
                    {paying?'Loading...':'Upgrade to Pro'}
                  </button>
                </div>
                {paymentError && <div style={{background:"rgba(163,45,45,0.2)",border:"1px solid #A32D2D",borderRadius:10,padding:"10px 16px",fontSize:13,color:"#F09595",marginTop:12}}>{paymentError}</div>}
              </div>
            )}
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────── */}
        {/* REFERRAL TAB                                                 */}
        {/* ──────────────────────────────────────────────────────────── */}
        {activeSection === 'referral' && (
          <div>
            <div style={{background:"#072E16",border:"1.5px solid #C8E600",borderRadius:16,padding:28,marginBottom:20}}>
              <h2 style={{fontSize:20,fontWeight:800,color:"#FFFFFF",marginBottom:6}}>Unlock 10 free CV rewrites</h2>
              <p style={{fontSize:14,color:"#5A9A6A",marginBottom:24,lineHeight:1.7}}>
                Share Jobsesame with 3 friends. When they sign up using your link you unlock 10 free AI CV rewrites — permanently.
              </p>
              <div style={{display:"flex",gap:0,marginBottom:24,border:"1px solid #1A5A2A",borderRadius:12,overflow:"hidden"}}>
                {[1,2,3].map(n=>(
                  <div key={n} style={{flex:1,padding:"16px 10px",textAlign:"center",borderRight:n<3?"1px solid #1A5A2A":"none",background:referralsCount>=n?"rgba(200,230,0,0.1)":"transparent"}}>
                    <div style={{fontSize:24,marginBottom:4}}>{referralsCount>=n?"✅":"👤"}</div>
                    <div style={{fontSize:11,color:referralsCount>=n?"#C8E600":"#3A7A4A",fontWeight:600}}>Friend {n}</div>
                  </div>
                ))}
              </div>
              <div style={{background:"#0D3A1A",borderRadius:12,padding:16,marginBottom:20}}>
                <div style={{fontSize:11,color:"#3A7A4A",fontWeight:700,marginBottom:8,letterSpacing:"1px",textTransform:"uppercase"}}>Your referral link</div>
                <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                  <div style={{flex:1,background:"#072E16",border:"1px solid #1A5A2A",borderRadius:8,padding:"10px 14px",fontSize:12,color:"#90C898",fontFamily:"monospace",minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {referralLink || 'Generating your link...'}
                  </div>
                  <button onClick={copyReferralLink} style={{background:copied?"#1A6A2A":"#C8E600",color:copied?"#C8E600":"#052A14",fontSize:12,fontWeight:800,padding:"10px 18px",borderRadius:8,border:"none",cursor:"pointer",whiteSpace:"nowrap"}}>
                    {copied?'Copied!':'Copy link'}
                  </button>
                </div>
              </div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <button onClick={shareWhatsApp} style={{background:"#25D366",color:"#fff",fontSize:13,fontWeight:700,padding:"11px 22px",borderRadius:99,border:"none",cursor:"pointer"}}>Share on WhatsApp</button>
                <button onClick={shareEmail} style={{background:"#072E16",color:"#C8E600",fontSize:13,fontWeight:700,padding:"11px 22px",borderRadius:99,border:"1px solid #1A5A2A",cursor:"pointer"}}>Share via Email</button>
              </div>
            </div>
            <div style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:14,padding:20,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:"#FFFFFF",marginBottom:4}}>Want unlimited rewrites now?</div>
                <div style={{fontSize:12,color:"#5A9A6A"}}>Upgrade to Pro for {currency==='ZAR'?'R370':'$20'}/month — unlimited everything.</div>
              </div>
              <button onClick={()=>handlePayment('pro')} disabled={paying} style={{background:"#C8E600",color:"#052A14",fontSize:13,fontWeight:800,padding:"10px 24px",borderRadius:99,border:"none",cursor:paying?"default":"pointer",opacity:paying?0.7:1}}>
                {paying?'Loading...':'Upgrade to Pro'}
              </button>
            </div>
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────── */}
        {/* APPLICATIONS TAB                                             */}
        {/* ──────────────────────────────────────────────────────────── */}
        {activeSection === 'applications' && (
          <div>
            <div style={{marginBottom:20}}>
              <h2 style={{fontSize:20,fontWeight:800,color:"#FFFFFF",marginBottom:4}}>My Applications</h2>
              <p style={{fontSize:13,color:"#5A9A6A"}}>Every job you applied to — tracked automatically.</p>
            </div>

            {/* Stats */}
            <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:20}}>
              {[
                {label:"Total applied",value:applications.length,color:"#90C898"},
                {label:"Interviews",value:applications.filter(a=>a.status==='Interview').length,color:"#FFA500"},
                {label:"Offers",value:applications.filter(a=>a.status==='Offer').length,color:"#C8E600"},
                {label:"Rejected",value:applications.filter(a=>a.status==='Rejected').length,color:"#F09595"},
              ].map(s=>(
                <div key={s.label} style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:12,padding:"14px 20px",flex:1,minWidth:100}}>
                  <div style={{fontSize:22,fontWeight:800,color:s.color,marginBottom:2}}>{s.value}</div>
                  <div style={{fontSize:11,color:"#5A9A6A",fontWeight:600}}>{s.label}</div>
                </div>
              ))}
            </div>

            {applications.length === 0 ? (
              <div style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:16,padding:48,textAlign:"center"}}>
                <div style={{fontSize:40,marginBottom:16}}>📋</div>
                <h3 style={{fontSize:18,fontWeight:800,color:"#FFFFFF",marginBottom:8}}>No applications yet</h3>
                <p style={{fontSize:13,color:"#5A9A6A",marginBottom:24}}>Use Quick Apply on any job and it will appear here automatically.</p>
                <a href="/jobs" style={{background:"#C8E600",color:"#052A14",fontSize:13,fontWeight:800,padding:"11px 28px",borderRadius:99,textDecoration:"none",display:"inline-block"}}>Browse jobs</a>
              </div>
            ) : (
              <div style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:16,overflow:"hidden"}}>
                {!isMobile && (
                  <div style={{display:"grid",gridTemplateColumns:"2fr 1.5fr 1fr 1fr 1.2fr",gap:0,padding:"12px 20px",borderBottom:"1px solid #1A4A2A",background:"#0D3A1A"}}>
                    {["Job","Company","Location","Date","Status"].map(h=>(
                      <div key={h} style={{fontSize:10,color:"#5A9A6A",fontWeight:700,letterSpacing:"1px",textTransform:"uppercase"}}>{h}</div>
                    ))}
                  </div>
                )}
                {applications.map((app,i)=>(
                  isMobile ? (
                    <div key={app.id} style={{padding:"14px 16px",borderBottom:i<applications.length-1?"1px solid #0D3A1A":"none"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                        <div style={{fontSize:13,fontWeight:700,color:"#FFFFFF"}}>{app.jobTitle}</div>
                        <select value={app.status} onChange={e=>updateApplicationStatus(app.id,e.target.value as Application['status'])} style={{padding:"4px 8px",borderRadius:99,border:"1.5px solid",fontSize:10,fontWeight:700,cursor:"pointer",outline:"none",background:"#0D3A1A",borderColor:app.status==='Offer'?'#C8E600':app.status==='Interview'?'#FFA500':app.status==='Rejected'?'#A32D2D':'#1A5A2A',color:app.status==='Offer'?'#C8E600':app.status==='Interview'?'#FFA500':app.status==='Rejected'?'#F09595':'#90C898'}}>
                          <option value="Applied">Applied</option>
                          <option value="Interview">Interview</option>
                          <option value="Offer">Offer</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                      <div style={{fontSize:11,color:"#5A9A6A"}}>{app.company} · {app.location} · {new Date(app.dateApplied).toLocaleDateString('en-ZA',{day:'numeric',month:'short'})}</div>
                    </div>
                  ) : (
                    <div key={app.id} style={{display:"grid",gridTemplateColumns:"2fr 1.5fr 1fr 1fr 1.2fr",gap:0,padding:"14px 20px",borderBottom:i<applications.length-1?"1px solid #0D3A1A":"none",alignItems:"center"}}>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:"#FFFFFF",marginBottom:2}}>{app.jobTitle}</div>
                        {app.jobUrl && <a href={app.jobUrl} target="_blank" rel="noreferrer" style={{fontSize:11,color:"#3A7A4A",textDecoration:"none"}}>View posting ↗</a>}
                      </div>
                      <div style={{fontSize:12,color:"#90C898"}}>{app.company}</div>
                      <div style={{fontSize:12,color:"#5A9A6A"}}>{app.location}</div>
                      <div style={{fontSize:11,color:"#3A7A4A"}}>{new Date(app.dateApplied).toLocaleDateString('en-ZA',{day:'numeric',month:'short'})}</div>
                      <div>
                        <select value={app.status} onChange={e=>updateApplicationStatus(app.id,e.target.value as Application['status'])} style={{padding:"5px 10px",borderRadius:99,border:"1.5px solid",fontSize:11,fontWeight:700,cursor:"pointer",outline:"none",background:"#0D3A1A",borderColor:app.status==='Offer'?'#C8E600':app.status==='Interview'?'#FFA500':app.status==='Rejected'?'#A32D2D':'#1A5A2A',color:app.status==='Offer'?'#C8E600':app.status==='Interview'?'#FFA500':app.status==='Rejected'?'#F09595':'#90C898'}}>
                          <option value="Applied">Applied</option>
                          <option value="Interview">Interview</option>
                          <option value="Offer">Offer</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
