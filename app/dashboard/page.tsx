'use client';
import { useUser, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import QuickApply, { isAutoApply } from '../components/QuickApply';
import CoverLetter from '../components/CoverLetter';
import { jsPDF } from 'jspdf';

const SALARY_DATA: Record<string, { min: number; median: number; max: number }> = {
  'software engineer': { min: 480000, median: 720000, max: 1200000 },
  'software developer': { min: 420000, median: 660000, max: 1100000 },
  'senior software engineer': { min: 720000, median: 1050000, max: 1680000 },
  'full stack developer': { min: 450000, median: 690000, max: 1100000 },
  'frontend developer': { min: 380000, median: 600000, max: 960000 },
  'backend developer': { min: 420000, median: 660000, max: 1080000 },
  'data scientist': { min: 540000, median: 840000, max: 1440000 },
  'data analyst': { min: 320000, median: 540000, max: 900000 },
  'product manager': { min: 600000, median: 960000, max: 1560000 },
  'project manager': { min: 420000, median: 660000, max: 1080000 },
  'devops engineer': { min: 540000, median: 840000, max: 1440000 },
  'ux designer': { min: 360000, median: 600000, max: 1020000 },
  'marketing manager': { min: 360000, median: 600000, max: 960000 },
  'financial analyst': { min: 360000, median: 600000, max: 1020000 },
  'accountant': { min: 300000, median: 480000, max: 780000 },
  'human resources': { min: 300000, median: 480000, max: 780000 },
  'sales manager': { min: 360000, median: 600000, max: 1080000 },
  'business analyst': { min: 420000, median: 660000, max: 1080000 },
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
      // Defer referral link — non-critical, load after main content
      setTimeout(() => generateReferralLink(), 2000);
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
    }).catch(() => {});
    localStorage.setItem('jobsesame_jobmatches_email_sent', 'true');
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    }).catch(() => {});
    localStorage.setItem('jobsesame_nudge_email_sent', 'true');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applications.length, isSignedIn, user]);

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
        .catch(() => {})
        .finally(() => setLoadingJobs(false));
    }, 800);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      if (title.includes(key) || key.split(' ').some(w => w.length > 4 && title.includes(w))) {
        return { role: key, ...val };
      }
    }
    return null;
  }, [cvData]);

  const matchBadge = (pct: number) => {
    if (pct >= 80) return { bg: '#D4F5D4', color: '#1A5A2A' };
    if (pct >= 60) return { bg: 'rgba(200,230,0,0.15)', color: '#8AAA00' };
    if (pct >= 40) return { bg: 'rgba(255,165,0,0.12)', color: '#C87800' };
    return { bg: 'rgba(150,150,150,0.15)', color: '#888' };
  };

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
    const cv = rewrittenCV;
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageW = 210;
    const margin = 18;
    const contentW = pageW - margin * 2;
    let y = 0;

    // Dark green header bar
    doc.setFillColor(5, 42, 20);
    doc.rect(0, 0, pageW, 44, 'F');

    // Name — white
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text(cv.name || '', margin, 17);

    // Title — lemon yellow
    doc.setFontSize(12);
    doc.setTextColor(200, 230, 0);
    doc.text(cv.title || '', margin, 27);

    // Contact row — soft green
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(160, 210, 170);
    const contact = [cv.location, cv.email, cv.phone].filter(Boolean).join('   ·   ');
    doc.text(contact, margin, 37);

    y = 54;

    const sectionHeader = (title: string) => {
      if (y > 268) { doc.addPage(); y = 18; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(5, 42, 20);
      doc.text(title.toUpperCase(), margin, y);
      doc.setDrawColor(5, 42, 20);
      doc.line(margin, y + 1.5, pageW - margin, y + 1.5);
      y += 7;
    };

    // Summary
    if (cv.summary) {
      sectionHeader('Professional Summary');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      const lines = doc.splitTextToSize(cv.summary, contentW);
      doc.text(lines, margin, y);
      y += (lines as string[]).length * 5.2 + 8;
    }

    // Skills
    if (cv.skills?.length) {
      sectionHeader('Skills');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      const skillLines = doc.splitTextToSize((cv.skills as string[]).join('   ·   '), contentW);
      doc.text(skillLines, margin, y);
      y += (skillLines as string[]).length * 5.2 + 8;
    }

    // Experience
    if (cv.experience?.length) {
      sectionHeader('Experience');
      (cv.experience as any[]).forEach((exp) => {
        if (y > 268) { doc.addPage(); y = 18; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(5, 42, 20);
        doc.text(exp.title || '', margin, y);
        y += 5.5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(`${exp.company || ''}   ·   ${exp.duration || ''}`, margin, y);
        y += 5;
        (exp.bullets || []).forEach((b: string) => {
          if (y > 275) { doc.addPage(); y = 18; }
          doc.setFontSize(9);
          doc.setTextColor(50, 50, 50);
          const bLines = doc.splitTextToSize(`\u2022  ${b}`, contentW - 4);
          doc.text(bLines, margin + 2, y);
          y += (bLines as string[]).length * 4.6;
        });
        y += 6;
      });
    }

    // Education
    if (cv.education) {
      if (y > 262) { doc.addPage(); y = 18; }
      sectionHeader('Education');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      doc.text(cv.education, margin, y);
      y += 11;
    }

    // Languages
    if (cv.languages?.length) {
      if (y > 268) { doc.addPage(); y = 18; }
      sectionHeader('Languages');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);
      doc.text((cv.languages as string[]).join('   ·   '), margin, y);
    }

    const safeName = (cv.name || 'CV').replace(/\s+/g, '_');
    const safeJob = (jobTitle || 'rewritten').replace(/\s+/g, '_');
    doc.save(`${safeName}_${safeJob}.pdf`);
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

  // ── Loading skeleton — shows immediately, no layout shift ─────
  if (!isLoaded) {
    return (
      <div style={{fontFamily:"'Plus Jakarta Sans',sans-serif",background:"#052A14",minHeight:"100vh"}}>
        <style>{`@keyframes shimmer{0%{opacity:0.4}50%{opacity:0.8}100%{opacity:0.4}}`}</style>
        {/* Nav skeleton */}
        <div style={{background:"#052A14",borderBottom:"1px solid #0D4A20",height:64,display:"flex",alignItems:"center",padding:"0 20px",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:9,background:"#C8E600"}}/>
            <div style={{width:100,height:16,borderRadius:6,background:"#1A4A2A",animation:"shimmer 1.5s ease infinite"}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            {[80,90,100,36].map((w,i)=>(
              <div key={i} style={{width:w,height:32,borderRadius:99,background:"#1A4A2A",animation:"shimmer 1.5s ease infinite"}}/>
            ))}
          </div>
        </div>
        {/* Body skeleton */}
        <div style={{padding:"32px 28px",maxWidth:960,margin:"0 auto"}}>
          {/* Welcome + stats */}
          <div style={{width:220,height:28,borderRadius:8,background:"#1A4A2A",marginBottom:8,animation:"shimmer 1.5s ease infinite"}}/>
          <div style={{width:140,height:14,borderRadius:6,background:"#0D3A1A",marginBottom:20,animation:"shimmer 1.5s ease infinite"}}/>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:24}}>
            {[1,2,3,4].map(i=>(
              <div key={i} style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:12,padding:"14px 16px",height:72,animation:"shimmer 1.5s ease infinite"}}/>
            ))}
          </div>
          {/* CV panel */}
          <div style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:16,padding:24,marginBottom:20,height:160,animation:"shimmer 1.5s ease infinite"}}/>
          {/* AI actions */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
            {[1,2,3].map(i=>(
              <div key={i} style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:14,height:90,animation:"shimmer 1.5s ease infinite"}}/>
            ))}
          </div>
          {/* Job cards */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))",gap:10,width:"100%",overflow:"hidden"}}>
            {[1,2,3,4,5,6].map(i=>(
              <div key={i} style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:12,height:130,animation:"shimmer 1.5s ease infinite"}}/>
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
              cvData
                ? <CoverLetter
                    cvData={cvData}
                    userName={user?.firstName || ''}
                    onClose={() => setShowAiModal(null)}
                  />
                : <div style={{textAlign:"center",padding:"32px 20px"}}>
                    <div style={{fontSize:40,marginBottom:16}}>📄</div>
                    <h3 style={{fontSize:16,fontWeight:800,color:"#FFFFFF",marginBottom:8}}>Upload your CV first</h3>
                    <p style={{fontSize:13,color:"#5A9A6A",marginBottom:20,lineHeight:1.7}}>
                      To generate a cover letter, we need your CV so the AI can personalise it for you.
                    </p>
                    <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
                      <button onClick={()=>{ setShowAiModal(null); setActiveSection('cv'); }} style={{background:"#C8E600",color:"#052A14",fontSize:13,fontWeight:800,padding:"11px 24px",borderRadius:99,border:"none",cursor:"pointer"}}>
                        Upload CV →
                      </button>
                      <button onClick={()=>setShowAiModal(null)} style={{background:"transparent",color:"#5A9A6A",fontSize:13,fontWeight:600,padding:"11px 20px",borderRadius:99,border:"1px solid #1A5A2A",cursor:"pointer"}}>
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
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div style={{background:"#072E16",border:"1.5px solid #1A5A2A",borderRadius:20,padding:32,width:"100%",maxWidth:480,maxHeight:"90vh",overflowY:"auto",textAlign:"center"}}>
            <p style={{margin:"0 0 8px",fontSize:11,fontWeight:700,color:"#5A9A6A",letterSpacing:"2px",textTransform:"uppercase"}}>Your CV was just analysed</p>
            {/* Circular gauge */}
            <div style={{position:"relative",width:130,height:130,margin:"0 auto 16px"}}>
              <svg width="130" height="130" style={{transform:"rotate(-90deg)"}}>
                <circle cx="65" cy="65" r="55" fill="none" stroke="#1A4A2A" strokeWidth="11"/>
                <circle cx="65" cy="65" r="55" fill="none"
                  stroke={atsShockScore>=75?"#22C55E":atsShockScore>=60?"#F59E0B":"#EF4444"}
                  strokeWidth="11"
                  strokeDasharray={`${2*Math.PI*55}`}
                  strokeDashoffset={`${2*Math.PI*55*(1-atsShockScore/100)}`}
                  strokeLinecap="round"/>
              </svg>
              <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
                <span style={{fontSize:32,fontWeight:900,color:atsShockScore>=75?"#22C55E":atsShockScore>=60?"#F59E0B":"#EF4444",lineHeight:1}}>{atsShockScore}%</span>
                <span style={{fontSize:10,color:"#5A9A6A",marginTop:3}}>ATS score</span>
              </div>
            </div>
            <h2 style={{fontSize:20,fontWeight:900,color:"#FFFFFF",marginBottom:6,lineHeight:1.3}}>
              {atsShockScore>=75?"Your CV is performing well"
               :atsShockScore>=60?"Your CV needs improvement to compete"
               :"Your CV is failing automated screening"}
            </h2>
            <p style={{fontSize:13,color:"#5A9A6A",marginBottom:20,lineHeight:1.6}}>
              {atsShockScore>=75
                ?"Most ATS systems will pass your CV. Use AI tailoring to push it above 85% for every role."
                :atsShockScore>=60
                ?"Many ATS systems will filter your CV out before a human sees it. Fix the issues below now."
                :"Most job applications are never seen by a recruiter. Here is why your CV is being rejected:"}
            </p>
            {atsShockWeaknesses.length > 0 && (
              <div style={{marginBottom:20,textAlign:"left"}}>
                {atsShockWeaknesses.map((w,i)=>(
                  <div key={i} style={{background:"#0D3A1A",borderLeft:"3px solid #EF4444",borderRadius:"0 8px 8px 0",padding:"10px 14px",marginBottom:8,fontSize:13,color:"#F09595",lineHeight:1.5}}>
                    ⚠️ {w}
                  </div>
                ))}
              </div>
            )}
            {/* Before / After */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20,textAlign:"left"}}>
              <div style={{background:"#0D1A0D",border:"1px solid #A32D2D",borderRadius:10,padding:12}}>
                <div style={{fontSize:10,fontWeight:700,color:"#F09595",textTransform:"uppercase",letterSpacing:"1px",marginBottom:6}}>Before Jobsesame</div>
                {["Generic CV sent to every job","Filtered by ATS before human sees it","Ignored by recruiters","Weeks without a response"].map((t,i)=>(
                  <div key={i} style={{fontSize:12,color:"#8A5A5A",marginBottom:4}}>✗ {t}</div>
                ))}
              </div>
              <div style={{background:"#0D2A0D",border:"1px solid #1A6A2A",borderRadius:10,padding:12}}>
                <div style={{fontSize:10,fontWeight:700,color:"#C8E600",textTransform:"uppercase",letterSpacing:"1px",marginBottom:6}}>After Jobsesame</div>
                {["CV tailored for each job in 30s","Passes ATS with 80%+ score","Seen by real recruiters","Interviews within 2 weeks"].map((t,i)=>(
                  <div key={i} style={{fontSize:12,color:"#90C898",marginBottom:4}}>✓ {t}</div>
                ))}
              </div>
            </div>
            <a href="/optimise" style={{display:"block",background:"#C8E600",color:"#052A14",fontSize:15,fontWeight:900,padding:"14px 0",borderRadius:99,textDecoration:"none",marginBottom:12}}>
              Fix my CV with AI — free →
            </a>
            <button onClick={()=>setShowAtsShock(false)} style={{background:"transparent",color:"#3A7A4A",fontSize:12,fontWeight:600,border:"none",cursor:"pointer",padding:"8px"}}>
              View my dashboard
            </button>
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
          {!isMobile && <a href="/optimise" style={{fontSize:13,color:"#A8D8B0",fontWeight:500,textDecoration:"none",padding:"8px 12px",whiteSpace:"nowrap"}}>CV Optimiser</a>}
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
              {label:"Saved jobs",value:(() => { try { const s = localStorage.getItem('jobsesame_saved_jobs'); return s ? JSON.parse(s).length : 0; } catch { return 0; } })(),color:"#A8D8B0",icon:"🔖",href:"/saved-jobs"},
              {label:"CV score",value:cvData?`${displayAts}%`:"—",color:"#C8E600",icon:"📊"},
            ].map(s=>(
              (s as any).href
                ? <a key={s.label} href={(s as any).href} style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:12,padding:"14px 16px",textDecoration:"none",display:"block"}}>
                    <div style={{fontSize:10,color:"#3A7A4A",fontWeight:700,textTransform:"uppercase",letterSpacing:"1px",marginBottom:6}}>{s.icon} {s.label}</div>
                    <div style={{fontSize:24,fontWeight:800,color:s.color,lineHeight:1}}>{s.value}</div>
                  </a>
                : <div key={s.label} style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:12,padding:"14px 16px"}}>
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
                          strokeDashoffset={`${2*Math.PI*40*(1-displayAts/100)}`}
                          strokeLinecap="round"/>
                      </svg>
                      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
                        <span style={{fontSize:20,fontWeight:800,color:"#C8E600",lineHeight:1}}>{displayAts}%</span>
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
              <div style={{background:"linear-gradient(135deg,#072E16 0%,#0D3A1A 100%)",border:"2px dashed #C8E600",borderRadius:16,padding:"32px 28px",textAlign:"center"}}>
                <div style={{fontSize:48,marginBottom:16}}>📄</div>
                <h3 style={{fontSize:20,fontWeight:800,color:"#FFFFFF",marginBottom:8}}>Upload your CV to get started</h3>
                <p style={{fontSize:14,color:"#5A9A6A",marginBottom:8,maxWidth:400,margin:"0 auto 8px",lineHeight:1.7}}>
                  Upload your CV once. AI reads everything, builds your career profile, and matches you to the best jobs worldwide.
                </p>
                <p style={{fontSize:12,color:"#3A7A4A",marginBottom:24,fontStyle:"italic"}}>Takes about 15 seconds. Free.</p>
                <button
                  onClick={()=>setActiveSection('cv')}
                  style={{background:"#C8E600",color:"#052A14",fontSize:15,fontWeight:800,padding:"14px 36px",borderRadius:99,border:"none",cursor:"pointer",boxShadow:"0 4px 20px rgba(200,230,0,0.25)"}}>
                  Upload my CV →
                </button>
              </div>
            )}

            {/* C. Salary Intelligence */}
            {cvData && matchedSalary && (
              <div style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:16,padding:isMobile?20:24}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
                  <div>
                    <h2 style={{fontSize:15,fontWeight:800,color:"#FFFFFF",marginBottom:2}}>Salary Intelligence</h2>
                    <div style={{fontSize:12,color:"#5A9A6A",textTransform:"capitalize"}}>{matchedSalary.role} — South Africa market rates</div>
                  </div>
                  <span style={{fontSize:10,fontWeight:700,color:"#3A7A4A",background:"#0D3A1A",padding:"3px 10px",borderRadius:99,border:"1px solid #1A5A2A"}}>ZAR · Annual</span>
                </div>
                {/* Salary bar */}
                <div style={{marginBottom:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#5A9A6A",marginBottom:8}}>
                    <span>R{(matchedSalary.min/1000).toFixed(0)}k min</span>
                    <span style={{fontWeight:700,color:"#C8E600"}}>R{(matchedSalary.median/1000).toFixed(0)}k median</span>
                    <span>R{(matchedSalary.max/1000).toFixed(0)}k max</span>
                  </div>
                  <div style={{position:"relative",height:8,background:"#0D3A1A",borderRadius:99,overflow:"hidden"}}>
                    <div style={{position:"absolute",left:0,top:0,height:"100%",width:"100%",background:"linear-gradient(90deg,#1A4A2A,#C8E600,#1A4A2A)",borderRadius:99,opacity:0.6}}/>
                    <div style={{position:"absolute",top:-2,height:12,width:3,background:"#FFFFFF",borderRadius:99,left:"50%",transform:"translateX(-50%)"}}/>
                  </div>
                </div>
                {/* Experience-adjusted estimate */}
                {cvData.experience_years != null && (
                  <div style={{background:"#0D3A1A",borderRadius:10,padding:"12px 16px",marginBottom:14}}>
                    <div style={{fontSize:11,color:"#5A9A6A",fontWeight:600,marginBottom:4}}>Your estimated range based on {cvData.experience_years} years experience</div>
                    <div style={{fontSize:18,fontWeight:800,color:"#C8E600"}}>
                      R{Math.round((matchedSalary.min + (matchedSalary.max - matchedSalary.min) * Math.min(1, cvData.experience_years / 10) * 0.4) / 12000) * 12}k
                      {' — '}
                      R{Math.round((matchedSalary.median + (matchedSalary.max - matchedSalary.median) * Math.min(1, cvData.experience_years / 10) * 0.5) / 12000) * 12}k
                    </div>
                    <div style={{fontSize:11,color:"#3A7A4A",marginTop:2}}>per year · based on market data</div>
                  </div>
                )}
                <div style={{fontSize:12,color:"#3A7A4A"}}>
                  Pro members get real-time salary data for every job they apply to.{' '}
                  <button onClick={()=>handlePayment('pro')} style={{background:"none",border:"none",color:"#C8E600",fontSize:12,fontWeight:700,cursor:"pointer",padding:0}}>Upgrade →</button>
                </div>
              </div>
            )}

            {/* D. AI Actions Row */}
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
                  {cvData
                    ? `Recommended for you based on your CV${cvData.title ? ` — ${cvData.title} roles` : ''}`
                    : 'Recommended jobs'}
                </h2>
                <a href="/jobs" style={{fontSize:12,color:"#C8E600",fontWeight:700,textDecoration:"none"}}>View all jobs →</a>
              </div>
              {loadingJobs ? (
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))",gap:10,width:"100%",overflow:"hidden"}}>
                  {[1,2,3,4,5,6].map(i=>(
                    <div key={i} style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:12,padding:16,height:130}}/>
                  ))}
                </div>
              ) : (
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(260px, 1fr))",gap:10,width:"100%",overflow:"hidden"}}>
                  {recommendedJobs.map(job=>{
                    const matchPct = calcJobMatch(job);
                    return (
                      <div key={job.id} style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:12,padding:16,display:"flex",flexDirection:"column",minHeight:130}}>
                        <div style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:10}}>
                          <div style={{width:36,height:36,borderRadius:8,background:"#0D3A1A",color:"#C8E600",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,flexShrink:0}}>
                            {job.company.charAt(0).toUpperCase()}
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:"flex",alignItems:"center",gap:5,marginBottom:2}}>
                              <div style={{fontSize:13,fontWeight:700,color:"#FFFFFF",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,minWidth:0}}>{job.title}</div>
                              {matchPct !== null && (() => { const b = matchBadge(matchPct); return (
                                <span style={{fontSize:9,fontWeight:800,color:b.color,background:b.bg,padding:"1px 6px",borderRadius:99,whiteSpace:"nowrap",flexShrink:0}}>{matchPct}%</span>
                              ); })()}
                            </div>
                            <div style={{fontSize:11,color:"#5A9A6A",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{job.company} · {job.location}</div>
                          </div>
                        </div>
                        <div style={{display:"flex",gap:6,marginTop:"auto"}}>
                          {isAutoApply(job.url, job.type) ? (
                            <button onClick={()=>setSelectedJob(job)} style={{flex:1,background:"#C8E600",color:"#052A14",fontSize:11,fontWeight:800,padding:"7px 0",borderRadius:99,border:"none",cursor:"pointer"}}>
                              ⚡ Quick Apply
                            </button>
                          ) : (
                            <button onClick={()=>window.open(job.url,'_blank')} style={{flex:1,background:"#052A14",color:"#C8E600",fontSize:11,fontWeight:800,padding:"7px 0",borderRadius:99,border:"2px solid #C8E600",cursor:"pointer"}}>
                              Apply
                            </button>
                          )}
                          <button onClick={()=>window.open(job.url,'_blank')} style={{flex:1,background:"transparent",color:"#FFFFFF",fontSize:11,fontWeight:700,padding:"7px 0",borderRadius:99,border:"1.5px solid #1A5A2A",cursor:"pointer"}}>
                            View Job
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {recommendedJobs.length === 0 && !loadingJobs && (
                    <div style={{gridColumn:"1/-1",textAlign:"center",padding:"32px 0"}}>
                      {cvData ? (
                        <>
                          <div style={{fontSize:13,color:"#5A9A6A",marginBottom:12}}>No recommended jobs yet</div>
                          <a href="/jobs" style={{background:"#C8E600",color:"#052A14",fontSize:12,fontWeight:800,padding:"9px 22px",borderRadius:99,textDecoration:"none",display:"inline-block"}}>Browse all jobs</a>
                        </>
                      ) : (
                        <>
                          <div style={{fontSize:40,marginBottom:12}}>📄</div>
                          <div style={{fontSize:14,fontWeight:700,color:"#FFFFFF",marginBottom:6}}>Upload your CV to see personalised job recommendations</div>
                          <div style={{fontSize:12,color:"#5A9A6A",marginBottom:16}}>AI matches jobs to your exact skills and experience</div>
                          <button onClick={()=>setActiveSection('cv')} style={{background:"#C8E600",color:"#052A14",fontSize:12,fontWeight:800,padding:"9px 22px",borderRadius:99,border:"none",cursor:"pointer",display:"inline-block"}}>Upload CV →</button>
                        </>
                      )}
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
                  {label:"🔖 Saved Jobs",href:"/saved-jobs"},
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
                {uploading ? (
                  <div style={{border:"2px dashed #C8E600",borderRadius:14,padding:"48px 24px",marginBottom:16,background:"rgba(200,230,0,0.03)",textAlign:"center"}}>
                    <div style={{fontSize:36,marginBottom:16}}>🤖</div>
                    <div style={{fontSize:16,fontWeight:800,color:"#C8E600",marginBottom:8}}>AI is reading your CV...</div>
                    <div style={{fontSize:13,color:"#5A9A6A",marginBottom:20}}>Extracting skills, experience and achievements — about 15 seconds</div>
                    <div style={{width:200,height:4,background:"#1A4A2A",borderRadius:99,margin:"0 auto",overflow:"hidden"}}>
                      <div style={{height:4,background:"#C8E600",borderRadius:99,animation:"cvprogress 2s ease-in-out infinite"}}/>
                    </div>
                    <style>{`@keyframes cvprogress{0%{width:5%}50%{width:75%}100%{width:95%}}`}</style>
                  </div>
                ) : (
                  <div
                    onDrop={handleDrop}
                    onDragOver={e=>{e.preventDefault();setDragOver(true);}}
                    onDragLeave={()=>setDragOver(false)}
                    style={{border:`2px dashed ${dragOver?'#C8E600':'#1A5A2A'}`,borderRadius:14,padding:"40px 24px",marginBottom:16,background:dragOver?'rgba(200,230,0,0.05)':'transparent',transition:"all 0.2s",cursor:"pointer"}}>
                    <div style={{fontSize:32,marginBottom:12}}>📄</div>
                    <div style={{fontSize:14,fontWeight:700,color:"#FFFFFF",marginBottom:6}}>Drag your PDF CV here</div>
                    <div style={{fontSize:12,color:"#3A7A4A",marginBottom:16}}>or</div>
                    <label style={{cursor:"pointer",display:"inline-block"}}>
                      <input type="file" accept=".pdf" onChange={handleFileInput} style={{display:"none"}}/>
                      <span style={{background:"#C8E600",color:"#052A14",fontSize:13,fontWeight:800,padding:"10px 24px",borderRadius:99,cursor:"pointer",display:"inline-block"}}>
                        Choose PDF file
                      </span>
                    </label>
                  </div>
                )}
                {error && (
                  <div style={{background:"rgba(163,45,45,0.2)",border:"1.5px solid #A32D2D",borderRadius:10,padding:"12px 16px",fontSize:13,color:"#F09595",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                    <span>⚠️ {error}</span>
                    <button onClick={()=>setError('')} style={{background:"#A32D2D",color:"#fff",fontSize:11,fontWeight:700,padding:"5px 12px",borderRadius:99,border:"none",cursor:"pointer",whiteSpace:"nowrap"}}>
                      Retry
                    </button>
                  </div>
                )}
                <div style={{fontSize:11,color:"#3A7A4A"}}>PDF only · Maximum 10MB · Processed securely by AI</div>
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
                <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
                  <button onClick={downloadCV} style={{background:"#C8E600",color:"#052A14",fontSize:13,fontWeight:800,padding:"11px 28px",borderRadius:99,border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1v9M5 7l3 3 3-3M2 12v1a1 1 0 001 1h10a1 1 0 001-1v-1" stroke="#052A14" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Download PDF
                  </button>
                  <button onClick={()=>handlePayment('pro')} disabled={paying} style={{background:"transparent",color:"#5A9A6A",fontSize:13,fontWeight:600,padding:"11px 24px",borderRadius:99,border:"1px solid #1A5A2A",cursor:paying?"default":"pointer",opacity:paying?0.7:1}}>
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
                    <div style={{fontSize:12,color:"#5A9A6A"}}>Unlimited rewrites. Auto-apply. Cover letters. {currency==='ZAR'?'R249':'$14'}/month.</div>
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
                <div style={{fontSize:12,color:"#5A9A6A"}}>Upgrade to Pro for {currency==='ZAR'?'R249':'$14'}/month — unlimited everything.</div>
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
