'use client';
import { useUser, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import QuickApply, { isAutoApply } from '../components/QuickApply';
import CoverLetter from '../components/CoverLetter';
import { JOB_BOARD_ENABLED } from '../lib/flags';
import { INK, INK_SOFT, INK_FAINT, LINE, PAPER, CARD, ACCENT, CLAY, AMBER, SERIF, SANS } from '../lib/theme';
import { captureClient } from '../lib/posthog-client';
import { ANALYTICS_EVENTS } from '../lib/analytics-events';
import { downloadPdf } from '../lib/download-pdf-client';

const SALARY_DATA: Record<string, { min: number; max: number }> = {
  'software engineer': { min: 480000, max: 720000 },
  'data scientist':    { min: 420000, max: 660000 },
  'product manager':   { min: 540000, max: 780000 },
  'designer':          { min: 300000, max: 480000 },
  'marketing manager': { min: 360000, max: 540000 },
  'accountant':        { min: 300000, max: 480000 },
  'project manager':   { min: 420000, max: 600000 },
  'sales manager':     { min: 360000, max: 600000 },
  'hr manager':        { min: 300000, max: 480000 },
  'default':           { min: 240000, max: 480000 },
};

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

export default function Dashboard() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  // ── Section state ──────────────────────────────────────────────
  const [activeSection, setActiveSection] = useState<'overview' | 'cv' | 'referral'>('overview');
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

  // ── Applications state (tracked silently in the background for the
  // upgrade-nudge email trigger below; there's no user-facing tracker UI —
  // logging applications by hand didn't earn its keep, this is a CV/ATS
  // optimiser, not a pipeline tracker) ────────────────────────────
  const [applications, setApplications] = useState<Application[]>([]);

  // ── Payment state ─────────────────────────────────────────────
  const [currency, setCurrency] = useState<'ZAR' | 'GBP' | 'USD'>('USD');
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [credits, setCredits] = useState(3);
  const [isPro, setIsPro] = useState(false);
  const freeRewrites = credits;

  // ── ATS score display (animated) ──────────────────────────────────
  const [displayAts, setDisplayAts] = useState(0);

  // ── Recommended jobs ──────────────────────────────────────────
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobQueryTitle, setJobQueryTitle] = useState('');

  // ── Profile from onboarding ───────────────────────────────────
  const [profile, setProfile] = useState<any>(null);

  // ── AI actions modal ──────────────────────────────────────────
  const [showAiModal, setShowAiModal] = useState<'tailor' | 'cover' | null>(null);

  // ── ATS shock modal ────────────────────────────────────────────
  const [showAtsShock, setShowAtsShock] = useState(false);
  const [atsShockScore, setAtsShockScore] = useState(0);
  const [atsShockWeaknesses, setAtsShockWeaknesses] = useState<string[]>([]);

  // ── CV optimize modal ──────────────────────────────────────────
  const [cvOptimizeJob, setCvOptimizeJob] = useState<Job | null>(null);
  const [cvOptimizing, setCvOptimizing] = useState(false);
  const [cvOptimizedResult, setCvOptimizedResult] = useState<any>(null);
  const [cvOptimizeError, setCvOptimizeError] = useState('');

  // ── Cover letter — handled by CoverLetter component via showAiModal='cover'

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
    // Clerk's `user` object reference can change across re-renders for the same
    // logical user (e.g. as Clerk hydrates/refreshes its internal cache), which
    // re-runs this effect and kicks off duplicate fetches. If those overlapping
    // requests resolve out of order, the *last one to finish* used to win via
    // setCvData/setApplications — not the last one to start — so the dashboard
    // could show stale data that flip-flopped on every reload. `cancelled` below
    // ensures only the most recent effect run is allowed to commit its results.
    let cancelled = false;
    if (isSignedIn && user) {
      // Defer referral link — non-critical, load after main content
      setTimeout(() => generateReferralLink(), 2000);
      // Sync user to database
      fetch('/api/user/sync', { method: 'POST' }).catch((err) => console.error('[dashboard] sync failed:', err));
      // Fetch credits from database
      fetch('/api/credits').then(r => r.json()).then(d => {
        if (cancelled) return;
        if (typeof d.credits === 'number') setCredits(d.credits);
        if (typeof d.isPro === 'boolean') setIsPro(d.isPro);
      }).catch((err) => console.error('[dashboard] credits fetch failed:', err));
      // Fetch applications from database
      fetch('/api/user/applications')
        .then(r => r.json())
        .then(d => {
          if (cancelled) return;
          const mapped = (d.applications || []).map((a: any) => ({
            id: a.id, jobTitle: a.jobTitle, company: a.company,
            location: a.location || '', dateApplied: a.appliedAt, status: a.status, jobUrl: a.jobUrl,
          }));
          setApplications(mapped);
          localStorage.setItem('jobsesame_applications', JSON.stringify(mapped));
        })
        .catch(() => {
          if (cancelled) return;
          const stored = localStorage.getItem('jobsesame_applications');
          if (stored) try { setApplications(JSON.parse(stored)); } catch (err) { console.error('[dashboard] applications parse failed:', err); }
        });
      // Fetch CV from database — DB is the single source of truth; localStorage
      // is only ever a placeholder to avoid a blank flash before this resolves.
      fetch('/api/user/cv').then(r => r.json()).then(d => {
        if (cancelled) return;
        if (d.cv) {
          const cv = { ...d.cv, experience_years: d.cv.experienceYears };
          setCvData(cv);
          localStorage.setItem('jobsesame_cv_data', JSON.stringify(cv));
        }
      }).catch((err) => console.error('[dashboard] cv fetch failed:', err));
    }
    return () => { cancelled = true; };
  // generateReferralLink is defined in component scope; adding it to deps causes re-runs on every render.
  // user?.id (not `user`) keeps this from re-firing when Clerk hands back a new
  // object reference for the same logical user.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, user?.id]);

  useEffect(() => {
    // Placeholder only, so the dashboard isn't blank while the DB fetch above is
    // in flight — the effect above always overwrites this with the DB's value
    // once it resolves, since the DB is the single source of truth for cvData.
    const storedCv = localStorage.getItem('jobsesame_cv_data');
    if (storedCv) try { setCvData(JSON.parse(storedCv)); } catch (err) { console.error('[dashboard] cached CV parse failed:', err); }
    const storedProfile = localStorage.getItem('jobsesame_profile');
    if (storedProfile) try { setProfile(JSON.parse(storedProfile)); } catch (err) { console.error('[dashboard] cached profile parse failed:', err); }
  }, []);

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(data => {
        if (data.country_code === 'ZA') setCurrency('ZAR');
        else if (data.country_code === 'GB') setCurrency('GBP');
      })
      .catch((err) => console.error('[dashboard] geo-detect failed:', err));
  }, []);

  // Trigger job-matches email 24h after signup
  useEffect(() => {
    if (!isSignedIn || !user) return;
    const email = user.emailAddresses[0]?.emailAddress;
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || '';
    const cvTitle = cvData?.title || '';
    if (!email || localStorage.getItem('jobsesame_jobmatches_email_sent')) return;
    const signupTs = localStorage.getItem('jobsesame_signup_ts');
    if (!signupTs) { localStorage.setItem('jobsesame_signup_ts', String(Date.now())); return; }
    if (Date.now() - Number(signupTs) < 24 * 60 * 60 * 1000) return;
    fetch('/api/emails/job-matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, cvTitle }),
    }).catch((err) => console.error('[dashboard] job-matches email failed:', err));
    localStorage.setItem('jobsesame_jobmatches_email_sent', 'true');
  }, [isSignedIn, user, cvData]);

  // Trigger upgrade-nudge email when user hits 2 applications
  useEffect(() => {
    if (!isSignedIn || !user || applications.length < 2) return;
    if (localStorage.getItem('jobsesame_nudge_email_sent')) return;
    const email = user.emailAddresses[0]?.emailAddress;
    const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || '';
    if (!email) return;
    fetch('/api/emails/upgrade-nudge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, currency }),
    }).catch((err) => console.error('[dashboard] upgrade-nudge email failed:', err));
    localStorage.setItem('jobsesame_nudge_email_sent', 'true');
  }, [applications.length, isSignedIn, user, currency]);

  // Fetch recommended jobs — re-runs when profile or cvData changes
  useEffect(() => {
    const t = setTimeout(() => {
      const p = profile || {};
      const titleQuery = p.preferredJobTitle || p.jobTitle || cvData?.title || 'software engineer';
      setJobQueryTitle(titleQuery);
      const topSkills = (cvData?.skills || []).slice(0, 3).join(' ');
      const fullQuery = topSkills ? `${titleQuery} ${topSkills}` : titleQuery;
      setLoadingJobs(true);
      fetch(`/api/jobs?query=${encodeURIComponent(fullQuery)}&location=`)
        .then(r => r.json())
        .then(data => setRecommendedJobs((data.jobs || []).slice(0, 6)))
        .catch((err) => console.error('[dashboard] recommended jobs failed:', err))
        .finally(() => setLoadingJobs(false));
    }, 800);
    return () => clearTimeout(t);
  }, [profile, cvData]);

  const atsScore = useMemo(() => {
    if (!cvData) return 0;
    let score = 30;
    if (cvData.summary) score += 10;
    if ((cvData.skills?.length || 0) >= 5) score += 10;
    if (cvData.experience_years || cvData.experience?.length) score += 10;
    if (cvData.education) score += 10;
    if ((cvData.languages?.length || 0) > 0) score += 10;
    const text = [cvData.summary, ...(cvData.skills || []), cvData.title].filter(Boolean).join(' ').toLowerCase();
    ['management', 'leadership', 'strategy', 'communication', 'analytics'].forEach(kw => {
      if (text.includes(kw)) score += 5;
    });
    return Math.min(95, score);
  }, [cvData]);

  useEffect(() => {
    if (!atsScore) { setDisplayAts(0); return; }
    let current = 0;
    const inc = atsScore / 30;
    const interval = setInterval(() => {
      current += inc;
      if (current >= atsScore) { setDisplayAts(atsScore); clearInterval(interval); }
      else setDisplayAts(Math.round(current));
    }, 50);
    return () => clearInterval(interval);
  }, [atsScore]);

  const calcJobMatch = (job: Job): number | null => {
    if (!cvData) return null;
    const skills: string[] = cvData.skills || [];
    const cvTitle: string = cvData.title || '';
    if (!skills.length && !cvTitle) return null;
    const text = (job.title + ' ' + (job.description || '')).toLowerCase();
    let score = 40;
    skills.forEach(s => { if (s && text.includes(s.toLowerCase())) score += 5; });
    if (cvTitle && job.title.toLowerCase().includes(cvTitle.toLowerCase())) score += 15;
    return Math.min(98, score);
  };

  const computeWeaknesses = (cv: any): string[] => {
    const issues: string[] = [];
    if (!cv.summary || cv.summary.length < 50) issues.push('No professional summary — ATS filters remove CVs without one');
    if ((cv.skills?.length || 0) < 5) issues.push('Too few skills listed — add at least 8 role-specific keywords');
    if (!cv.experience?.some((e: any) => /\d/.test(e.bullets?.join('') || ''))) issues.push('No measurable achievements — add numbers, percentages, and impact metrics');
    if (!cv.education) issues.push('Education section missing — required by most ATS systems');
    if ((cv.languages?.length || 0) === 0) issues.push('No languages listed — multilingual candidates rank higher');
    return issues.slice(0, 3);
  };

  const matchedSalary = useMemo(() => {
    if (!cvData?.title) return null;
    const title = cvData.title.toLowerCase();
    for (const [key, val] of Object.entries(SALARY_DATA)) {
      if (key === 'default') continue;
      if (title.includes(key) || key.split(' ').some(w => w.length > 3 && title.includes(w))) {
        return { role: key, ...val };
      }
    }
    return { role: cvData.title.toLowerCase(), ...SALARY_DATA['default'] };
  }, [cvData]);

  const matchBadge = (pct: number) => {
    if (pct >= 80) return { bg: 'rgba(63,93,82,0.1)', color: ACCENT };
    if (pct >= 60) return { bg: 'rgba(176,138,62,0.12)', color: AMBER };
    if (pct >= 40) return { bg: 'rgba(168,92,64,0.1)', color: CLAY };
    return { bg: LINE, color: INK_SOFT };
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

  const sendAtsWelcomeEmail = async (cv: any, score: number, weaknesses: string[]) => {
    if (localStorage.getItem('jobsesame_ats_email_sent')) return;
    const email = user?.emailAddresses[0]?.emailAddress;
    const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || '';
    const userId = user?.id;
    if (!email) return;
    try {
      await fetch('/api/emails/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, atsScore: score, weaknesses, cvTitle: cv.title, userId }),
      });
    } catch { /* Non-critical */ }
    localStorage.setItem('jobsesame_ats_email_sent', 'true');
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
    const isPdf = file.type === 'application/pdf' || file.type === 'application/octet-stream' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) { setError('Please upload a PDF file only'); return; }
    if (file.size > 15 * 1024 * 1024) { setError('File too large. Maximum 15MB'); return; }
    setUploading(true); setError('');
    try {
      const formData = new FormData();
      formData.append('cv', file);
      const res = await fetch('/api/cv', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setCvData(data.cvData);
        localStorage.setItem('jobsesame_cv_data', JSON.stringify(data.cvData));
        fetch('/api/user/cv', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cvData: data.cvData }) }).catch((err) => console.error('[dashboard] cv save failed:', err));
        const shockScore = (() => {
          let s = 30;
          if (data.cvData.summary) s += 10;
          if ((data.cvData.skills?.length || 0) >= 5) s += 10;
          if (data.cvData.experience_years || data.cvData.experience?.length) s += 10;
          if (data.cvData.education) s += 10;
          if ((data.cvData.languages?.length || 0) > 0) s += 10;
          const text = [data.cvData.summary, ...(data.cvData.skills || []), data.cvData.title].filter(Boolean).join(' ').toLowerCase();
          ['management','leadership','strategy','communication','analytics'].forEach(kw => { if (text.includes(kw)) s += 5; });
          return Math.min(95, s);
        })();
        const shockWeaknesses = computeWeaknesses(data.cvData);
        setAtsShockScore(shockScore);
        setAtsShockWeaknesses(shockWeaknesses);
        setShowAtsShock(true);
        sendAtsWelcomeEmail(data.cvData, shockScore, shockWeaknesses);
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

  const optimizeCVForJob = async (job: Job) => {
    if (!cvData) return;
    setCvOptimizing(true);
    setCvOptimizedResult(null);
    setCvOptimizeError('');
    try {
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvData, jobTitle: job.title, jobCompany: job.company, jobDescription: job.description }),
      });
      const data = await res.json();
      if (data.success) setCvOptimizedResult(data.rewrittenCV);
      else setCvOptimizeError(data.error || 'Failed to optimise CV');
    } catch (err: any) {
      setCvOptimizeError(err?.message || 'Something went wrong. Please try again.');
    }
    setCvOptimizing(false);
  };

  const downloadOptimizedCV = () => {
    if (!cvOptimizedResult || !cvOptimizeJob) return;
    const cv = cvOptimizedResult;
    const fileName = `${(cv.name||'CV').replace(/\s+/g,'_')}_${(cvOptimizeJob.title||'job').replace(/\s+/g,'_')}_optimised.pdf`;
    downloadPdf('cv', cv, fileName);
    captureClient(ANALYTICS_EVENTS.CV_DOWNLOADED, { source: 'dashboard_job' });
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

  const downloadCV = () => {
    if (!rewrittenCV) return;
    const cv = rewrittenCV;
    const safeName = (cv.name || 'CV').replace(/\s+/g, '_');
    const safeJob = (jobTitle || 'rewritten').replace(/\s+/g, '_');
    downloadPdf('cv', cv, `${safeName}_${safeJob}.pdf`);
    captureClient(ANALYTICS_EVENTS.CV_DOWNLOADED, { source: 'dashboard_tailor' });
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
        body: JSON.stringify({ email, plan, currency: 'USD' }),
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

  // ── Loading skeleton — shows immediately, no layout shift ─────
  if (!isLoaded) {
    return (
      <div style={{fontFamily:SANS,background:PAPER,minHeight:"100vh"}}>
        <style>{`@keyframes shimmer{0%{opacity:0.5}50%{opacity:0.9}100%{opacity:0.5}}`}</style>
        {/* Nav skeleton */}
        <div style={{background:CARD,borderBottom:`1px solid ${LINE}`,height:64,display:"flex",alignItems:"center",padding:"0 20px",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:100,height:16,borderRadius:3,background:LINE,animation:"shimmer 1.5s ease infinite"}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            {[80,90,100,36].map((w,i)=>(
              <div key={i} style={{width:w,height:32,borderRadius:3,background:LINE,animation:"shimmer 1.5s ease infinite"}}/>
            ))}
          </div>
        </div>
        {/* Body skeleton */}
        <div style={{padding:isMobile?"16px 16px 32px":"32px 28px",maxWidth:960,margin:"0 auto"}}>
          <div style={{width:220,height:28,borderRadius:3,background:LINE,marginBottom:8,animation:"shimmer 1.5s ease infinite"}}/>
          <div style={{width:140,height:14,borderRadius:3,background:LINE,marginBottom:20,animation:"shimmer 1.5s ease infinite"}}/>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(4,1fr)",gap:10,marginBottom:24}}>
            {[1,2,3,4].map(i=>(
              <div key={i} style={{background:CARD,border:`1px solid ${LINE}`,borderRadius:4,padding:"14px 16px",height:72,animation:"shimmer 1.5s ease infinite"}}/>
            ))}
          </div>
          <div style={{background:CARD,border:`1px solid ${LINE}`,borderRadius:4,padding:24,marginBottom:20,height:160,animation:"shimmer 1.5s ease infinite"}}/>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(3,1fr)",gap:10,marginBottom:20}}>
            {[1,2,3].map(i=>(
              <div key={i} style={{background:CARD,border:`1px solid ${LINE}`,borderRadius:4,height:90,animation:"shimmer 1.5s ease infinite"}}/>
            ))}
          </div>
        </div>
      </div>
    );
  }
  if (!isSignedIn) return null;

  const firstName = profile?.name?.split(' ')[0] || user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'there';
  const today = new Date().toLocaleDateString('en-ZA', {weekday:'long',day:'numeric',month:'long'});
  const navBtnStyle = (s: string) => ({
    padding: '8px 16px',
    borderRadius: 3,
    fontSize: isMobile ? 12 : 13,
    fontWeight: 600,
    cursor: 'pointer',
    border: 'none',
    background: activeSection === s ? INK : 'transparent',
    color: activeSection === s ? PAPER : INK_SOFT,
    whiteSpace: 'nowrap',
  } as React.CSSProperties);

  const inputStyle: React.CSSProperties = { width: '100%', padding: '11px 14px', border: `1px solid ${LINE}`, borderRadius: 3, fontSize: 14, color: INK, background: PAPER, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
  const labelStyle: React.CSSProperties = { fontSize: 12, color: INK_SOFT, fontWeight: 600, display: 'block', marginBottom: 6 };
  const errorBoxStyle: React.CSSProperties = { background: 'rgba(168,92,64,0.08)', border: `1px solid rgba(168,92,64,0.3)`, borderRadius: 3, padding: '10px 16px', fontSize: 13, color: CLAY };
  const pillTag = (bg: string, color: string): React.CSSProperties => ({ background: bg, color, fontSize: 11, padding: '3px 10px', borderRadius: 99, fontWeight: 600 });

  return (
    <main style={{fontFamily:SANS,background:PAPER,color:INK,minHeight:"100vh",overflowX:"hidden"}}>

      {/* QUICK APPLY MODAL */}
      {selectedJob && (
        <QuickApply job={selectedJob} onClose={() => setSelectedJob(null)} currency={currency === 'ZAR' ? 'ZAR' : 'USD'} />
      )}

      {/* AI ACTIONS MODAL */}
      {showAiModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(20,18,15,0.55)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:CARD,border:`1px solid ${LINE}`,borderRadius:4,padding:28,width:"100%",maxWidth:520,maxHeight:"90vh",overflowY:"auto"}}>
            {showAiModal === 'tailor' && (
              <div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                  <h3 style={{fontFamily:SERIF,fontWeight:500,fontSize:19,color:INK}}>Tailor CV for a job</h3>
                  <button onClick={()=>setShowAiModal(null)} style={{background:"transparent",border:"none",color:INK_FAINT,fontSize:20,cursor:"pointer"}}>✕</button>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:20}}>
                  <div>
                    <label style={labelStyle}>Job title *</label>
                    <input value={jobTitle} onChange={e=>setJobTitle(e.target.value)} placeholder="e.g. Senior Product Manager" style={inputStyle}/>
                  </div>
                  <div>
                    <label style={labelStyle}>Company</label>
                    <input value={jobCompany} onChange={e=>setJobCompany(e.target.value)} placeholder="e.g. Standard Bank" style={inputStyle}/>
                  </div>
                  <div>
                    <label style={labelStyle}>Job description</label>
                    <textarea value={jobDescription} onChange={e=>setJobDescription(e.target.value)} placeholder="Paste the job description..." rows={4} style={{...inputStyle,resize:"vertical"}}/>
                  </div>
                </div>
                {rewriteError && <div style={{...errorBoxStyle,marginBottom:16}}>{rewriteError}</div>}
                <div style={{display:"flex",gap:10}}>
                  <button onClick={handleRewrite} disabled={rewriting||!cvData} style={{flex:1,background:rewriting||!cvData?LINE:ACCENT,color:rewriting||!cvData?INK_FAINT:PAPER,fontSize:14,fontWeight:600,padding:"12px",borderRadius:3,border:"none",cursor:rewriting||!cvData?"default":"pointer"}}>
                    {rewriting ? 'Rewriting…' : !cvData ? 'Upload CV first' : 'Rewrite my CV'}
                  </button>
                  <button onClick={()=>setShowAiModal(null)} style={{background:"transparent",color:INK_SOFT,fontSize:13,fontWeight:600,padding:"12px 20px",borderRadius:3,border:`1px solid ${LINE}`,cursor:"pointer"}}>Cancel</button>
                </div>
                {rewriting && <div style={{marginTop:12,fontSize:13,color:INK_SOFT,fontStyle:"italic"}}>AI is rewriting your CV… ~15 seconds</div>}
              </div>
            )}
            {showAiModal === 'cover' && (
              cvData
                ? <CoverLetter
                    cvData={cvData}
                    userName={user?.firstName || ''}
                    onClose={() => setShowAiModal(null)}
                  />
                : <div style={{textAlign:"center",padding:"32px 20px"}}>
                    <h3 style={{fontFamily:SERIF,fontWeight:500,fontSize:18,marginBottom:8}}>Upload your CV first</h3>
                    <p style={{fontSize:13,color:INK_SOFT,marginBottom:20,lineHeight:1.7}}>
                      To generate a cover letter, we need your CV so the AI can personalise it for you.
                    </p>
                    <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
                      <button onClick={()=>{ setShowAiModal(null); setActiveSection('cv'); }} style={{background:ACCENT,color:PAPER,fontSize:13,fontWeight:600,padding:"11px 24px",borderRadius:3,border:"none",cursor:"pointer"}}>
                        Upload CV →
                      </button>
                      <button onClick={()=>setShowAiModal(null)} style={{background:"transparent",color:INK_SOFT,fontSize:13,fontWeight:600,padding:"11px 20px",borderRadius:3,border:`1px solid ${LINE}`,cursor:"pointer"}}>
                        Cancel
                      </button>
                    </div>
                  </div>
            )}
          </div>
        </div>
      )}

      {/* ATS SHOCK MODAL */}
      {showAtsShock && (
        <div style={{position:"fixed",inset:0,background:"rgba(20,18,15,0.7)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:CARD,border:`1px solid ${LINE}`,borderRadius:4,padding:32,width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto",textAlign:"center"}}>
            <p style={{margin:"0 0 8px",fontSize:11,fontWeight:600,color:INK_FAINT,letterSpacing:"0.1em",textTransform:"uppercase"}}>Your CV was just analysed</p>
            {/* Circular gauge */}
            <div style={{position:"relative",width:120,height:120,margin:"0 auto 16px"}}>
              <svg width="120" height="120" style={{transform:"rotate(-90deg)"}}>
                <circle cx="60" cy="60" r="50" fill="none" stroke={LINE} strokeWidth="9"/>
                <circle cx="60" cy="60" r="50" fill="none"
                  stroke={atsShockScore>=75?ACCENT:atsShockScore>=60?AMBER:CLAY}
                  strokeWidth="9"
                  strokeDasharray={`${2*Math.PI*50}`}
                  strokeDashoffset={`${2*Math.PI*50*(1-atsShockScore/100)}`}
                  strokeLinecap="round"/>
              </svg>
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
                <span style={{fontFamily:SERIF,fontSize:28,color:atsShockScore>=75?ACCENT:atsShockScore>=60?AMBER:CLAY,lineHeight:1}}>{atsShockScore}%</span>
                <span style={{fontSize:10,color:INK_FAINT,marginTop:4}}>ATS score</span>
              </div>
            </div>
            <h2 style={{fontFamily:SERIF,fontWeight:500,fontSize:21,marginBottom:8,lineHeight:1.3}}>
              {atsShockScore>=75?"Your CV is performing well"
               :atsShockScore>=60?"Your CV needs improvement to compete"
               :"Your CV is failing automated screening"}
            </h2>
            <p style={{fontSize:13,color:INK_SOFT,marginBottom:20,lineHeight:1.6}}>
              {atsShockScore>=75
                ?"Most ATS systems will pass your CV. Use AI tailoring to push it above 85% for every role."
                :atsShockScore>=60
                ?"Many ATS systems will filter your CV out before a human sees it. Fix the issues below now."
                :"Most job applications are never seen by a recruiter. Here is why your CV is being rejected:"}
            </p>
            {atsShockWeaknesses.length > 0 && (
              <div style={{marginBottom:20,textAlign:"left"}}>
                {atsShockWeaknesses.map((w,i)=>(
                  <div key={i} style={{background:PAPER,borderLeft:`2px solid ${CLAY}`,borderRadius:"0 3px 3px 0",padding:"10px 14px",marginBottom:8,fontSize:13,color:INK_SOFT,lineHeight:1.5}}>
                    {w}
                  </div>
                ))}
              </div>
            )}
            {/* Before / After */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20,textAlign:"left"}}>
              <div style={{background:PAPER,border:`1px solid ${LINE}`,borderRadius:3,padding:12}}>
                <div style={{fontSize:10,fontWeight:700,color:CLAY,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>Before Jobsesame</div>
                {["Generic CV sent to every job","Filtered by ATS before human sees it","Ignored by recruiters","Weeks without a response"].map((t,i)=>(
                  <div key={i} style={{fontSize:12,color:INK_FAINT,marginBottom:4}}>{t}</div>
                ))}
              </div>
              <div style={{background:PAPER,border:`1px solid ${LINE}`,borderRadius:3,padding:12}}>
                <div style={{fontSize:10,fontWeight:700,color:ACCENT,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>After Jobsesame</div>
                {["CV tailored for each job in 30s","Passes ATS with 80%+ score","Seen by real recruiters","Interviews within 2 weeks"].map((t,i)=>(
                  <div key={i} style={{fontSize:12,color:INK_SOFT,marginBottom:4}}>{t}</div>
                ))}
              </div>
            </div>
            <a href="/optimise" style={{display:"block",background:ACCENT,color:PAPER,fontSize:14.5,fontWeight:600,padding:"14px 0",borderRadius:3,textDecoration:"none",marginBottom:12}}>
              Fix my CV with AI — free
            </a>
            <button onClick={()=>setShowAtsShock(false)} style={{background:"transparent",color:INK_FAINT,fontSize:12,fontWeight:600,border:"none",cursor:"pointer",padding:"8px"}}>
              View my dashboard
            </button>
          </div>
        </div>
      )}


      {/* CV OPTIMIZE MODAL */}
      {cvOptimizeJob && (
        <div style={{position:"fixed",inset:0,background:"rgba(20,18,15,0.7)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:SANS}}>
          <div style={{background:CARD,border:`1px solid ${LINE}`,borderRadius:4,padding:isMobile?20:28,width:"100%",maxWidth:540,maxHeight:"90vh",overflowY:"auto"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
              <div>
                <h3 style={{fontFamily:SERIF,fontWeight:500,fontSize:18,margin:"0 0 4px"}}>Optimise CV for this job</h3>
                <div style={{fontSize:12,color:INK_SOFT}}>{cvOptimizeJob.title} · {cvOptimizeJob.company}</div>
              </div>
              <button onClick={()=>{setCvOptimizeJob(null);setCvOptimizedResult(null);setCvOptimizeError('');}} style={{background:"transparent",border:"none",color:INK_FAINT,fontSize:22,cursor:"pointer",lineHeight:1}}>✕</button>
            </div>

            {!cvOptimizedResult && !cvOptimizing && (
              <div>
                <div style={{background:PAPER,border:`1px solid ${LINE}`,borderRadius:3,padding:16,marginBottom:18}}>
                  <div style={{fontSize:12,color:INK_SOFT,marginBottom:8,fontWeight:600}}>AI will rewrite your CV for:</div>
                  <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>{cvOptimizeJob.title}</div>
                  <div style={{fontSize:12,color:ACCENT}}>{cvOptimizeJob.company}</div>
                  {cvOptimizeJob.description && (
                    <p style={{fontSize:12,color:INK_SOFT,marginTop:8,lineHeight:1.6}}>{cvOptimizeJob.description.substring(0,200)}...</p>
                  )}
                </div>
                {cvOptimizeError && <div style={{...errorBoxStyle,marginBottom:14}}>{cvOptimizeError}</div>}
                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>optimizeCVForJob(cvOptimizeJob)} style={{flex:1,background:ACCENT,color:PAPER,fontSize:14,fontWeight:600,padding:"12px",borderRadius:3,border:"none",cursor:"pointer"}}>
                    Rewrite my CV for this job
                  </button>
                  <button onClick={()=>{setCvOptimizeJob(null);setCvOptimizeError('');}} style={{background:"transparent",color:INK_SOFT,fontSize:13,fontWeight:600,padding:"12px 16px",borderRadius:3,border:`1px solid ${LINE}`,cursor:"pointer"}}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {cvOptimizing && (
              <div style={{textAlign:"center",padding:"32px 0"}}>
                <div style={{width:32,height:32,border:`2px solid ${LINE}`,borderTopColor:ACCENT,borderRadius:"50%",animation:"dashSpin 0.8s linear infinite",margin:"0 auto 16px"}}/>
                <div style={{fontSize:14,color:INK_SOFT,fontStyle:"italic"}}>AI is rewriting your CV… ~15 seconds</div>
                <style>{`@keyframes dashSpin{to{transform:rotate(360deg)}}`}</style>
              </div>
            )}

            {cvOptimizedResult && (
              <div>
                <div style={{background:PAPER,border:`1px solid ${LINE}`,borderRadius:3,padding:14,marginBottom:18}}>
                  <div style={{fontSize:14,fontWeight:600,color:ACCENT}}>CV optimised successfully</div>
                  <div style={{fontSize:12,color:INK_SOFT,marginTop:2}}>Match score: {cvOptimizedResult.match_score}% · ATS: {cvOptimizedResult.ats_score}%</div>
                </div>
                <div style={{background:PAPER,border:`1px solid ${LINE}`,borderRadius:3,padding:16,marginBottom:16}}>
                  <div style={{fontSize:11,color:INK_FAINT,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Optimised Summary</div>
                  <p style={{fontSize:13,color:INK_SOFT,lineHeight:1.7,fontStyle:"italic",margin:0}}>&ldquo;{cvOptimizedResult.summary}&rdquo;</p>
                </div>
                {cvOptimizedResult.skills?.length > 0 && (
                  <div style={{marginBottom:16}}>
                    <div style={{fontSize:11,color:INK_FAINT,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Matched skills</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {cvOptimizedResult.skills.map((s: string) => (
                        <span key={s} style={pillTag(LINE,INK_SOFT)}>{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {cvOptimizedResult.keywords_added?.length > 0 && (
                  <div style={{marginBottom:16}}>
                    <div style={{fontSize:11,color:INK_FAINT,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Keywords added for ATS</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {cvOptimizedResult.keywords_added.map((kw: string) => (
                        <span key={kw} style={{...pillTag('rgba(63,93,82,0.07)',ACCENT),border:'1px solid rgba(63,93,82,0.2)'}}>{kw}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:4}}>
                  {isPro ? (
                    <button onClick={downloadOptimizedCV} style={{flex:1,background:ACCENT,color:PAPER,fontSize:13,fontWeight:600,padding:"11px 0",borderRadius:3,border:"none",cursor:"pointer"}}>
                      Download PDF
                    </button>
                  ) : (
                    <button onClick={()=>handlePayment('pro')} style={{flex:1,background:ACCENT,color:PAPER,fontSize:13,fontWeight:600,padding:"11px 0",borderRadius:3,border:"none",cursor:"pointer"}}>
                      Subscribe to download
                    </button>
                  )}
                  <button onClick={()=>window.open(cvOptimizeJob.url,'_blank')} style={{flex:1,background:"transparent",color:INK,fontSize:13,fontWeight:600,padding:"11px 0",borderRadius:3,border:`1px solid ${INK}`,cursor:"pointer"}}>
                    Apply now →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NAV */}
      <nav style={{background:CARD,padding:"0 20px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${LINE}`,position:"sticky",top:0,zIndex:100}}>
        <a href="/" style={{textDecoration:"none",fontFamily:SERIF,fontSize:18,fontWeight:500,color:INK}}>jobsesame</a>
        <div style={{display:"flex",alignItems:"center",gap:isMobile?6:10,overflowX:"auto"}}>
          <button style={navBtnStyle('overview')} onClick={()=>setActiveSection('overview')}>Dashboard</button>
          <button style={navBtnStyle('cv')} onClick={()=>setActiveSection('cv')}>My CV</button>
          <button style={navBtnStyle('referral')} onClick={()=>setActiveSection('referral')}>{isMobile ? 'Rewrites' : 'Free rewrites'}</button>
          {JOB_BOARD_ENABLED && <a href="/jobs" style={{fontSize:isMobile?12:13,color:INK_SOFT,fontWeight:500,textDecoration:"none",padding:"8px 12px",whiteSpace:"nowrap"}}>{isMobile ? 'Jobs' : 'Find Jobs'}</a>}
          {JOB_BOARD_ENABLED && <a href="/saved-jobs" style={{fontSize:isMobile?12:13,color:INK_SOFT,fontWeight:500,textDecoration:"none",padding:"8px 12px",whiteSpace:"nowrap"}}>{isMobile ? 'Saved' : 'Saved Jobs'}</a>}
          <a href="/optimise" style={{fontSize:isMobile?12:13,color:INK_SOFT,fontWeight:500,textDecoration:"none",padding:"8px 12px",whiteSpace:"nowrap"}}>{isMobile ? 'Optimiser' : 'CV Optimiser'}</a>
          <a href="/account" style={{fontSize:isMobile?12:13,color:INK_SOFT,fontWeight:500,textDecoration:"none",padding:"8px 12px",whiteSpace:"nowrap"}} title="My Account">
            {isMobile ? '⚙' : 'My Account'}
          </a>
          <UserButton />
        </div>
      </nav>

      <div style={{padding:isMobile?"16px 16px 32px":"32px 28px",maxWidth:960,margin:"0 auto"}}>

        {/* ── WELCOME HEADER (always visible) ─────────────────────── */}
        <div style={{marginBottom:24}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:16}}>
            <div>
              <h1 style={{fontFamily:SERIF,fontWeight:500,fontSize:isMobile?22:28,marginBottom:4}}>
                Welcome back, <span style={{color:ACCENT}}>{firstName}</span>
              </h1>
              <p style={{fontSize:13,color:INK_FAINT}}>{today}</p>
            </div>
            {JOB_BOARD_ENABLED && cvData && <a href="/jobs" style={{background:ACCENT,color:PAPER,fontSize:13,fontWeight:600,padding:"10px 22px",borderRadius:3,textDecoration:"none",whiteSpace:"nowrap",flexShrink:0}}>
              Browse Jobs →
            </a>}
          </div>

          {/* Quick stats row */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,maxWidth:isMobile?"100%":360}}>
            {[
              {label:"CV score",value:cvData?`${displayAts}%`:"—"},
              {label:"Free rewrites left",value:freeRewrites},
            ].map(s=>(
              <div key={s.label} style={{background:CARD,border:`1px solid ${LINE}`,borderRadius:4,padding:"14px 16px"}}>
                <div style={{fontSize:10,color:INK_FAINT,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>{s.label}</div>
                <div style={{fontFamily:SERIF,fontSize:22,lineHeight:1}}>{s.value}</div>
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
              <div style={{background:CARD,border:`1px solid ${LINE}`,borderRadius:4,padding:isMobile?20:24}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18,flexWrap:"wrap",gap:10}}>
                  <h2 style={{fontSize:15.5,fontWeight:600}}>CV Analysis</h2>
                  <button onClick={()=>setActiveSection('cv')} style={{background:ACCENT,color:PAPER,fontSize:12,fontWeight:600,padding:"7px 16px",borderRadius:3,border:"none",cursor:"pointer"}}>Improve my CV</button>
                </div>
                <div style={{display:"flex",gap:20,alignItems:"flex-start",flexWrap:"wrap"}}>
                  {/* Circular ATS score */}
                  <div style={{textAlign:"center",flexShrink:0}}>
                    <div style={{position:"relative",width:92,height:92,margin:"0 auto 8px"}}>
                      <svg width="92" height="92" style={{transform:"rotate(-90deg)"}}>
                        <circle cx="46" cy="46" r="38" fill="none" stroke={LINE} strokeWidth="7"/>
                        <circle cx="46" cy="46" r="38" fill="none" stroke={atsScore>=80?ACCENT:atsScore>=60?AMBER:CLAY} strokeWidth="7"
                          strokeDasharray={`${2*Math.PI*38}`}
                          strokeDashoffset={`${2*Math.PI*38*(1-displayAts/100)}`}
                          strokeLinecap="round"/>
                      </svg>
                      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
                        <span style={{fontFamily:SERIF,fontSize:19,lineHeight:1}}>{displayAts}%</span>
                        <span style={{fontSize:9,color:INK_FAINT,lineHeight:1.3,marginTop:2}}>ATS score</span>
                      </div>
                    </div>
                    <div style={{fontSize:11,color:atsScore>=80?ACCENT:atsScore>=60?AMBER:CLAY,fontWeight:700}}>
                      {atsScore>=80?"Excellent":atsScore>=60?"Good":"Needs work"}
                    </div>
                  </div>
                  <div style={{flex:1,minWidth:200}}>
                    <div style={{marginBottom:12}}>
                      <div style={{fontSize:14,fontWeight:600,marginBottom:2}}>{cvData.name}</div>
                      <div style={{fontSize:13,color:ACCENT,fontWeight:600}}>{cvData.title}</div>
                    </div>
                    <div style={{fontSize:12,color:INK_FAINT,marginBottom:10}}>
                      <strong style={{color:INK_SOFT}}>Suggestions:</strong>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      {atsScore < 90 && (
                        <div style={{fontSize:12,color:INK_SOFT}}>
                          Add more measurable achievements (numbers, percentages)
                        </div>
                      )}
                      {(!cvData.skills || cvData.skills.length < 5) && (
                        <div style={{fontSize:12,color:INK_SOFT}}>
                          Expand your skills section with relevant keywords
                        </div>
                      )}
                      <div style={{fontSize:12,color:INK_SOFT}}>
                        Use &ldquo;Tailor CV for a job&rdquo; to boost your score for each role
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{background:CARD,border:`1px dashed rgba(28,26,22,0.22)`,borderRadius:4,padding:"32px 28px",textAlign:"center"}}>
                <h3 style={{fontFamily:SERIF,fontWeight:500,fontSize:20,marginBottom:8}}>Upload your CV to get started</h3>
                <p style={{fontSize:14,color:INK_SOFT,marginBottom:8,maxWidth:400,margin:"0 auto 8px",lineHeight:1.7}}>
                  Upload your CV once. AI reads everything and builds your career profile.
                </p>
                <p style={{fontSize:12,color:INK_FAINT,marginBottom:24,fontStyle:"italic"}}>Takes about 15 seconds. Free.</p>
                <button
                  onClick={()=>setActiveSection('cv')}
                  style={{background:ACCENT,color:PAPER,fontSize:14.5,fontWeight:600,padding:"14px 32px",borderRadius:3,border:"none",cursor:"pointer"}}>
                  Upload my CV →
                </button>
              </div>
            )}

            {/* C. Salary Intelligence — ZAR salary bands only, not meaningful for other currencies */}
            {cvData && matchedSalary && currency === 'ZAR' && (
              <div style={{background:CARD,border:`1px solid ${LINE}`,borderRadius:4,padding:isMobile?20:24}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
                  <h2 style={{fontSize:15,fontWeight:600,margin:0}}>Salary Intelligence</h2>
                  <span style={{fontSize:10,fontWeight:700,color:INK_FAINT,background:PAPER,padding:"3px 10px",borderRadius:99,border:`1px solid ${LINE}`}}>ZAR · Annual</span>
                </div>
                <div style={{fontSize:12,color:INK_SOFT,textTransform:"capitalize",marginBottom:12}}>{matchedSalary.role}</div>
                <div style={{fontFamily:SERIF,fontSize:24,marginBottom:8}}>
                  R{(matchedSalary.min/1000).toFixed(0)}k – R{(matchedSalary.max/1000).toFixed(0)}k per year
                </div>
                <div style={{fontSize:11,color:INK_FAINT}}>Based on South African market data</div>
              </div>
            )}

            {/* D. AI Actions Row — only meaningful once there's a CV to act on */}
            {cvData && (
              <div>
                <h2 style={{fontSize:15,fontWeight:600,marginBottom:12}}>AI actions</h2>
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:10}}>
                  {[
                    {title:"Tailor CV for a job",desc:"AI rewrites your CV for any role in 30 seconds",action:()=>setShowAiModal('tailor')},
                    {title:"Generate cover letter",desc:"Personalised cover letter in seconds",action:()=>setShowAiModal('cover')},
                    {title:"Optimise my CV",desc:"Full AI optimisation on the CV Optimiser tool",action:()=>window.location.href='/optimise'},
                  ].map(a=>(
                    <button key={a.title} onClick={a.action} style={{background:CARD,border:`1px solid ${LINE}`,borderRadius:4,padding:18,textAlign:"left",cursor:"pointer",transition:"border-color 0.15s"}}
                      onMouseEnter={e=>(e.currentTarget.style.borderColor=ACCENT)}
                      onMouseLeave={e=>(e.currentTarget.style.borderColor=LINE)}>
                      <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>{a.title}</div>
                      <div style={{fontSize:11.5,color:INK_FAINT,lineHeight:1.5}}>{a.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* D. Recommended Jobs */}
            {JOB_BOARD_ENABLED && <div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                <h2 style={{fontSize:15,fontWeight:600}}>
                  {cvData
                    ? `Recommended for you based on your CV${cvData.title ? ` — ${cvData.title} roles` : ''}`
                    : 'Recommended jobs'}
                </h2>
                <a href="/jobs" style={{fontSize:12,color:ACCENT,fontWeight:600,textDecoration:"none"}}>View all jobs →</a>
              </div>
              {loadingJobs ? (
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))",gap:10,width:"100%",overflow:"hidden"}}>
                  {[1,2,3,4,5,6].map(i=>(
                    <div key={i} style={{background:CARD,border:`1px solid ${LINE}`,borderRadius:4,padding:16,height:130}}/>
                  ))}
                </div>
              ) : (
                <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(auto-fit, minmax(260px, 1fr))",gap:10,width:"100%",overflow:"hidden"}}>
                  {recommendedJobs.map(job=>{
                    const matchPct = calcJobMatch(job);
                    return (
                      <div key={job.id} style={{background:CARD,border:`1px solid ${LINE}`,borderRadius:4,padding:16,display:"flex",flexDirection:"column",minHeight:130}}>
                        <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:10}}>
                          <div style={{width:36,height:36,borderRadius:3,background:PAPER,color:ACCENT,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,flexShrink:0}}>
                            {job.company.charAt(0).toUpperCase()}
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2}}>
                              <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,minWidth:0}}>{job.title}</div>
                              {matchPct !== null && (() => { const b = matchBadge(matchPct); return (
                                <span style={{fontSize:9,fontWeight:700,color:b.color,background:b.bg,padding:"1px 6px",borderRadius:99,whiteSpace:"nowrap",flexShrink:0}}>{matchPct}%</span>
                              ); })()}
                            </div>
                            <div style={{fontSize:11,color:INK_FAINT,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{job.company} · {job.location}</div>
                          </div>
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:"auto"}}>
                          <div style={{display:"flex",gap:6}}>
                            {isAutoApply(job.url, job.type) ? (
                              <button onClick={()=>setSelectedJob(job)} style={{flex:1,background:ACCENT,color:PAPER,fontSize:11,fontWeight:600,padding:"7px 0",borderRadius:3,border:"none",cursor:"pointer"}}>
                                Quick Apply
                              </button>
                            ) : (
                              <button onClick={()=>setSelectedJob(job)} style={{flex:1,background:ACCENT,color:PAPER,fontSize:11,fontWeight:600,padding:"7px 0",borderRadius:3,border:"none",cursor:"pointer"}}>
                                Apply
                              </button>
                            )}
                            <button onClick={()=>window.open(job.url,'_blank')} style={{flex:1,background:"transparent",color:INK,fontSize:11,fontWeight:600,padding:"7px 0",borderRadius:3,border:`1px solid ${LINE}`,cursor:"pointer"}}>
                              View
                            </button>
                          </div>
                          {cvData && (
                            <button onClick={()=>{setCvOptimizeJob(job);setCvOptimizedResult(null);setCvOptimizeError('');}} style={{width:"100%",background:'rgba(63,93,82,0.07)',color:ACCENT,fontSize:11,fontWeight:600,padding:"7px 0",borderRadius:3,border:'1px solid rgba(63,93,82,0.2)',cursor:"pointer"}}>
                              Optimise CV for this job
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {recommendedJobs.length === 0 && !loadingJobs && (
                    <div style={{gridColumn:"1/-1",textAlign:"center",padding:"32px 0"}}>
                      {cvData ? (
                        <>
                          <div style={{fontSize:13,color:INK_SOFT,marginBottom:12}}>No recommended jobs yet</div>
                          <a href="/jobs" style={{background:ACCENT,color:PAPER,fontSize:12,fontWeight:600,padding:"9px 22px",borderRadius:3,textDecoration:"none",display:"inline-block"}}>Browse all jobs</a>
                        </>
                      ) : (
                        <>
                          <div style={{fontSize:14,fontWeight:600,marginBottom:6}}>Upload your CV to see personalised job recommendations</div>
                          <div style={{fontSize:12,color:INK_SOFT,marginBottom:16}}>AI matches jobs to your exact skills and experience</div>
                          <button onClick={()=>setActiveSection('cv')} style={{background:ACCENT,color:PAPER,fontSize:12,fontWeight:600,padding:"9px 22px",borderRadius:3,border:"none",cursor:"pointer",display:"inline-block"}}>Upload CV →</button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>}

          </div>
        )}

        {/* ──────────────────────────────────────────────────────────── */}
        {/* MY CV TAB                                                    */}
        {/* ──────────────────────────────────────────────────────────── */}
        {activeSection === 'cv' && (
          <div>
            {!cvData ? (
              <div style={{background:CARD,border:`1px solid ${LINE}`,borderRadius:4,padding:32,textAlign:"center"}}>
                <h2 style={{fontFamily:SERIF,fontWeight:500,fontSize:22,marginBottom:8}}>Upload your CV</h2>
                <p style={{fontSize:14,color:INK_SOFT,marginBottom:24,maxWidth:400,margin:"0 auto 24px"}}>
                  Upload your CV once. AI reads everything and builds your complete career profile in seconds.
                </p>
                {uploading ? (
                  <div style={{border:`1px dashed rgba(28,26,22,0.22)`,borderRadius:4,padding:"48px 24px",marginBottom:16,background:PAPER,textAlign:"center"}}>
                    <div style={{fontSize:15,fontWeight:600,marginBottom:8}}>AI is reading your CV…</div>
                    <div style={{fontSize:13,color:INK_SOFT,marginBottom:20}}>Extracting skills, experience and achievements — about 15 seconds</div>
                    <div style={{width:200,height:3,background:LINE,borderRadius:99,margin:"0 auto",overflow:"hidden"}}>
                      <div style={{height:3,background:ACCENT,borderRadius:99,animation:"cvprogress 2s ease-in-out infinite"}}/>
                    </div>
                    <style>{`@keyframes cvprogress{0%{width:5%}50%{width:75%}100%{width:95%}}`}</style>
                  </div>
                ) : (
                  <div
                    onDrop={handleDrop}
                    onDragOver={e=>{e.preventDefault();setDragOver(true);}}
                    onDragLeave={()=>setDragOver(false)}
                    style={{border:`1px dashed ${dragOver?ACCENT:'rgba(28,26,22,0.22)'}`,borderRadius:4,padding:"40px 24px",marginBottom:16,background:dragOver?'rgba(63,93,82,0.04)':PAPER,transition:"all 0.2s",cursor:"pointer"}}>
                    <div style={{fontSize:14,fontWeight:600,marginBottom:6}}>Drag your PDF CV here</div>
                    <div style={{fontSize:12,color:INK_FAINT,marginBottom:16}}>or</div>
                    <label style={{cursor:"pointer",display:"inline-block"}}>
                      <input type="file" accept=".pdf" onChange={handleFileInput} style={{display:"none"}}/>
                      <span style={{background:ACCENT,color:PAPER,fontSize:13,fontWeight:600,padding:"10px 24px",borderRadius:3,cursor:"pointer",display:"inline-block"}}>
                        Choose PDF file
                      </span>
                    </label>
                  </div>
                )}
                {error && (
                  <div style={{...errorBoxStyle,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                    <span>{error}</span>
                    <button onClick={()=>setError('')} style={{background:CLAY,color:PAPER,fontSize:11,fontWeight:700,padding:"5px 12px",borderRadius:99,border:"none",cursor:"pointer",whiteSpace:"nowrap"}}>
                      Retry
                    </button>
                  </div>
                )}
                <div style={{fontSize:11,color:INK_FAINT}}>PDF only · Maximum 10MB · Processed securely by AI</div>
              </div>
            ) : rewrittenCV ? (
              <div>
                <div style={{background:CARD,border:`1px solid ${LINE}`,borderRadius:4,padding:16,marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
                  <div>
                    <div style={{fontSize:14.5,fontWeight:600}}>CV rewritten for {jobTitle}</div>
                    <div style={{fontSize:12,color:INK_SOFT,marginTop:2}}>Match: {rewrittenCV.match_score}% · ATS: {rewrittenCV.ats_score}%</div>
                  </div>
                  <button onClick={()=>setRewrittenCV(null)} style={{background:"transparent",color:INK,fontSize:12,fontWeight:600,padding:"7px 16px",borderRadius:3,border:`1px solid ${INK}`,cursor:"pointer"}}>
                    Rewrite for another job
                  </button>
                </div>
                <div style={{background:CARD,border:`1px solid ${LINE}`,borderRadius:4,padding:28,marginBottom:20}}>
                  <h2 style={{fontFamily:SERIF,fontWeight:500,fontSize:21,marginBottom:4}}>{rewrittenCV.name}</h2>
                  <div style={{fontSize:14,color:ACCENT,fontWeight:600,marginBottom:2}}>{rewrittenCV.title}</div>
                  <div style={{fontSize:12,color:INK_FAINT,marginBottom:16}}>{rewrittenCV.location}</div>
                  <p style={{fontSize:13,color:INK_SOFT,lineHeight:1.7,marginBottom:20,fontStyle:"italic"}}>&ldquo;{rewrittenCV.summary}&rdquo;</p>
                  <div style={{marginBottom:16}}>
                    <div style={{fontSize:11,color:INK_FAINT,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:8}}>Skills matched</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {rewrittenCV.skills?.map((s: string) => (
                        <span key={s} style={pillTag(LINE,INK_SOFT)}>{s}</span>
                      ))}
                    </div>
                  </div>
                  {rewrittenCV.keywords_added?.length > 0 && (
                    <div style={{marginBottom:16}}>
                      <div style={{fontSize:11,color:INK_FAINT,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:8}}>Keywords added for ATS</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                        {rewrittenCV.keywords_added?.map((kw: string) => (
                          <span key={kw} style={{...pillTag('rgba(63,93,82,0.07)',ACCENT),border:'1px solid rgba(63,93,82,0.2)'}}>{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {rewrittenCV.experience?.map((exp: any, i: number) => (
                    <div key={i} style={{marginBottom:12,padding:14,background:PAPER,borderRadius:3}}>
                      <div style={{fontSize:13,fontWeight:600,marginBottom:2}}>{exp.title}</div>
                      <div style={{fontSize:12,color:ACCENT,marginBottom:8}}>{exp.company} · {exp.duration}</div>
                      {exp.bullets?.map((b: string, j: number) => (
                        <div key={j} style={{fontSize:12,color:INK_SOFT,lineHeight:1.7,paddingLeft:12,position:"relative"}}>
                          <span style={{position:"absolute",left:0,color:ACCENT}}>·</span>{b}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                  {isPro ? (
                    <button onClick={downloadCV} style={{background:ACCENT,color:PAPER,fontSize:13,fontWeight:600,padding:"11px 28px",borderRadius:3,border:"none",cursor:"pointer"}}>
                      Download PDF
                    </button>
                  ) : (
                    <button onClick={()=>handlePayment('pro')} disabled={paying} style={{background:ACCENT,color:PAPER,fontSize:13,fontWeight:600,padding:"11px 28px",borderRadius:3,border:"none",cursor:paying?"default":"pointer",opacity:paying?0.7:1}}>
                      Subscribe to download PDF
                    </button>
                  )}
                  {!isPro && (
                    <button onClick={()=>handlePayment('pro')} disabled={paying} style={{background:"transparent",color:INK_SOFT,fontSize:13,fontWeight:600,padding:"11px 24px",borderRadius:3,border:`1px solid ${LINE}`,cursor:paying?"default":"pointer",opacity:paying?0.7:1}}>
                      {paying?'Loading…':'Upgrade to Pro'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <div style={{background:CARD,border:`1px solid ${LINE}`,borderRadius:4,padding:28,marginBottom:20}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12}}>
                    <div>
                      <h2 style={{fontFamily:SERIF,fontWeight:500,fontSize:21,marginBottom:4}}>{cvData.name}</h2>
                      <div style={{fontSize:13,color:ACCENT,fontWeight:600}}>{cvData.title}</div>
                      <div style={{fontSize:12,color:INK_FAINT,marginTop:2}}>{cvData.location}</div>
                    </div>
                    <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                      <button onClick={()=>{setCvData(null);localStorage.removeItem('jobsesame_cv_data');}} style={{background:"transparent",color:INK_SOFT,fontSize:12,fontWeight:600,padding:"7px 16px",borderRadius:3,border:`1px solid ${LINE}`,cursor:"pointer"}}>Upload new CV</button>
                      {JOB_BOARD_ENABLED && <a href="/jobs" style={{background:ACCENT,color:PAPER,fontSize:12,fontWeight:600,padding:"7px 16px",borderRadius:3,textDecoration:"none",display:"inline-block"}}>Find matching jobs</a>}
                    </div>
                  </div>
                  {cvData.summary && <p style={{fontSize:13,color:INK_SOFT,lineHeight:1.7,marginBottom:20,fontStyle:"italic"}}>&ldquo;{cvData.summary}&rdquo;</p>}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16}}>
                    <div>
                      <div style={{fontSize:11,color:INK_FAINT,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:8}}>Skills</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                        {cvData.skills?.map((s: string) => (
                          <span key={s} style={pillTag(LINE,INK_SOFT)}>{s}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{fontSize:11,color:INK_FAINT,fontWeight:700,letterSpacing:"0.06em",textTransform:"uppercase",marginBottom:8}}>Details</div>
                      <div style={{fontSize:12,color:INK_SOFT,lineHeight:1.8}}>
                        {cvData.experience_years && <div>Experience: {cvData.experience_years} years</div>}
                        {cvData.education && <div>Education: {cvData.education}</div>}
                        {cvData.languages?.length > 0 && <div>Languages: {cvData.languages.join(', ')}</div>}
                      </div>
                    </div>
                  </div>
                </div>

                {showRewrite ? (
                  <div style={{background:CARD,border:`1px solid ${LINE}`,borderRadius:4,padding:28,marginBottom:20}}>
                    <h3 style={{fontFamily:SERIF,fontWeight:500,fontSize:17,marginBottom:20}}>Rewrite CV for a specific job</h3>
                    <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:20}}>
                      <div>
                        <label style={labelStyle}>Job title *</label>
                        <input value={jobTitle} onChange={e=>setJobTitle(e.target.value)} placeholder="e.g. Senior Project Manager" style={inputStyle}/>
                      </div>
                      <div>
                        <label style={labelStyle}>Company name</label>
                        <input value={jobCompany} onChange={e=>setJobCompany(e.target.value)} placeholder="e.g. Standard Bank" style={inputStyle}/>
                      </div>
                      <div>
                        <label style={labelStyle}>Job description (paste for best results)</label>
                        <textarea value={jobDescription} onChange={e=>setJobDescription(e.target.value)} placeholder="Paste the job description here..." rows={5} style={{...inputStyle,resize:"vertical"}}/>
                      </div>
                    </div>
                    {rewriteError && <div style={{...errorBoxStyle,marginBottom:16}}>{rewriteError}</div>}
                    <div style={{display:"flex",gap:10}}>
                      <button onClick={handleRewrite} disabled={rewriting} style={{background:ACCENT,color:PAPER,fontSize:14,fontWeight:600,padding:"12px 28px",borderRadius:3,border:"none",cursor:rewriting?"default":"pointer",opacity:rewriting?0.7:1}}>
                        {rewriting?'Rewriting…':'Rewrite my CV now'}
                      </button>
                      <button onClick={()=>setShowRewrite(false)} style={{background:"transparent",color:INK_SOFT,fontSize:13,fontWeight:600,padding:"12px 20px",borderRadius:3,border:`1px solid ${LINE}`,cursor:"pointer"}}>Cancel</button>
                    </div>
                    {rewriting && <div style={{marginTop:16,fontSize:13,color:INK_SOFT,fontStyle:"italic"}}>AI is rewriting your CV… about 15 seconds.</div>}
                  </div>
                ) : (
                  <div style={{background:CARD,border:`1px solid ${LINE}`,borderRadius:4,padding:20,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:16}}>
                    <div>
                      <div style={{fontSize:14.5,fontWeight:600,marginBottom:4}}>Ready to rewrite for any job</div>
                      <div style={{fontSize:12,color:INK_SOFT}}>AI rewrites in 30 seconds. You have {freeRewrites} free rewrites.</div>
                    </div>
                    <button onClick={()=>setShowRewrite(true)} style={{background:ACCENT,color:PAPER,fontSize:13,fontWeight:600,padding:"10px 24px",borderRadius:3,border:"none",cursor:"pointer",whiteSpace:"nowrap"}}>
                      Rewrite my CV — free
                    </button>
                  </div>
                )}

                <div style={{background:CARD,border:`1px solid ${LINE}`,borderRadius:4,padding:20,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>Unlock Pro — all doors open</div>
                    <div style={{fontSize:12,color:INK_SOFT}}>Unlimited rewrites. Cover letters. $25/month.</div>
                  </div>
                  <button onClick={()=>handlePayment('pro')} disabled={paying} style={{background:ACCENT,color:PAPER,fontSize:13,fontWeight:600,padding:"10px 24px",borderRadius:3,border:"none",cursor:paying?"default":"pointer",opacity:paying?0.7:1}}>
                    {paying?'Loading…':'Upgrade to Pro'}
                  </button>
                </div>
                {paymentError && <div style={{...errorBoxStyle,marginTop:12}}>{paymentError}</div>}
              </div>
            )}
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────── */}
        {/* REFERRAL TAB                                                 */}
        {/* ──────────────────────────────────────────────────────────── */}
        {activeSection === 'referral' && (
          <div>
            <div style={{background:CARD,border:`1px solid ${LINE}`,borderRadius:4,padding:28,marginBottom:20}}>
              <h2 style={{fontFamily:SERIF,fontWeight:500,fontSize:22,marginBottom:6}}>Unlock 10 free CV rewrites</h2>
              <p style={{fontSize:14,color:INK_SOFT,marginBottom:24,lineHeight:1.7}}>
                Share Jobsesame with 3 friends. When they sign up using your link you unlock 10 free AI CV rewrites — permanently.
              </p>
              <div style={{display:"flex",gap:0,marginBottom:24,border:`1px solid ${LINE}`,borderRadius:3,overflow:"hidden"}}>
                {[1,2,3].map(n=>(
                  <div key={n} style={{flex:1,padding:"16px 10px",textAlign:"center",borderRight:n<3?`1px solid ${LINE}`:"none",background:referralsCount>=n?"rgba(63,93,82,0.06)":"transparent"}}>
                    <div style={{fontSize:11,color:referralsCount>=n?ACCENT:INK_FAINT,fontWeight:600}}>Friend {n}</div>
                  </div>
                ))}
              </div>
              <div style={{background:PAPER,borderRadius:3,padding:16,marginBottom:20}}>
                <div style={{fontSize:11,color:INK_FAINT,fontWeight:700,marginBottom:8,letterSpacing:"0.06em",textTransform:"uppercase"}}>Your referral link</div>
                <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                  <div style={{flex:1,background:CARD,border:`1px solid ${LINE}`,borderRadius:3,padding:"10px 14px",fontSize:12,color:INK_SOFT,fontFamily:"monospace",minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {referralLink || 'Generating your link...'}
                  </div>
                  <button onClick={copyReferralLink} style={{background:copied?INK:ACCENT,color:PAPER,fontSize:12,fontWeight:600,padding:"10px 18px",borderRadius:3,border:"none",cursor:"pointer",whiteSpace:"nowrap"}}>
                    {copied?'Copied!':'Copy link'}
                  </button>
                </div>
              </div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <button onClick={shareWhatsApp} style={{background:"#25D366",color:"#fff",fontSize:13,fontWeight:600,padding:"11px 22px",borderRadius:3,border:"none",cursor:"pointer"}}>Share on WhatsApp</button>
                <button onClick={shareEmail} style={{background:CARD,color:INK,fontSize:13,fontWeight:600,padding:"11px 22px",borderRadius:3,border:`1px solid ${LINE}`,cursor:"pointer"}}>Share via Email</button>
              </div>
            </div>
            <div style={{background:CARD,border:`1px solid ${LINE}`,borderRadius:4,padding:20,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>Want unlimited rewrites now?</div>
                <div style={{fontSize:12,color:INK_SOFT}}>Upgrade to Pro for $25/month — unlimited everything.</div>
              </div>
              <button onClick={()=>handlePayment('pro')} disabled={paying} style={{background:ACCENT,color:PAPER,fontSize:13,fontWeight:600,padding:"10px 24px",borderRadius:3,border:"none",cursor:paying?"default":"pointer",opacity:paying?0.7:1}}>
                {paying?'Loading…':'Upgrade to Pro'}
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
