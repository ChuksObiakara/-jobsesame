'use client';
import { useEffect, useRef, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import NavUK from '../../components/NavUK';
import { useRouter } from 'next/navigation';
import OptimiseModal from '../components/OptimiseModal';

const BG = '#052A14';
const NAV_BG = '#041E0F';
const ACCENT = '#C8E600';
const CARD = 'rgba(255,255,255,0.03)';
const BORDER = '1px solid rgba(255,255,255,0.07)';

interface Sub {
  active: boolean;
  plan: string | null;
  credits: number;
  expiresAt?: string | null;
  trialDaysLeft?: number | null;
  hasSubscription?: boolean;
}

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  location?: string;
  jobUrl?: string;
  status: string;
  appliedAt: string;
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  Applied:   { bg: 'rgba(200,230,0,0.12)',  color: '#C8E600' },
  Interview: { bg: 'rgba(80,180,255,0.12)', color: '#50B4FF' },
  Offer:     { bg: 'rgba(80,220,120,0.12)', color: '#50DC78' },
  Rejected:  { bg: 'rgba(255,80,80,0.1)',   color: '#FF8080' },
};

type Tab = 'overview' | 'cv' | 'applications';

// ── Salary lookup ─────────────────────────────────────────────────────────────
function getSalaryRange(title: string): { min: string; max: string } {
  const t = (title || '').toLowerCase();
  if (t.includes('software engineer') || t.includes('software developer') || t.includes('full stack') || t.includes('fullstack')) return { min: '£55,000', max: '£95,000' };
  if (t.includes('data scientist') || t.includes('data science') || t.includes('machine learning') || t.includes('ml engineer')) return { min: '£50,000', max: '£85,000' };
  if (t.includes('product manager') || t.includes('product management')) return { min: '£60,000', max: '£100,000' };
  if (t.includes('designer') || t.includes('ux') || t.includes('ui design') || t.includes('graphic')) return { min: '£35,000', max: '£65,000' };
  if (t.includes('marketing')) return { min: '£40,000', max: '£70,000' };
  if (t.includes('accountant') || t.includes('accounting') || t.includes('finance') || t.includes('financial analyst')) return { min: '£35,000', max: '£65,000' };
  if (t.includes('project manager') || t.includes('programme manager')) return { min: '£45,000', max: '£75,000' };
  if (t.includes('devops') || t.includes('cloud') || t.includes('infrastructure') || t.includes('sre')) return { min: '£60,000', max: '£100,000' };
  if (t.includes('nurse') || t.includes('nursing') || t.includes('registered nurse')) return { min: '£28,000', max: '£45,000' };
  if (t.includes('teacher') || t.includes('teaching')) return { min: '£28,000', max: '£48,000' };
  return { min: '£30,000', max: '£55,000' };
}

// ── CV score ──────────────────────────────────────────────────────────────────
function calcCvScore(cv: any): number {
  if (!cv) return 0;
  let s = 0;
  if (cv.name)     s += 5;
  if (cv.email)    s += 5;
  if (cv.phone)    s += 5;
  if (cv.location) s += 5;
  if (cv.title)    s += 5;
  if (cv.summary)  s += 10;
  if (cv.education) s += 10;
  s += Math.min(20, (Number(cv.experience_years) || 0) * 4);
  s += Math.min(25, (cv.skills?.length || 0) * 3);
  s += Math.min(10, (cv.experience?.length || 0) * 3);
  return Math.min(100, s);
}

// ── Job matching ──────────────────────────────────────────────────────────────
function scoreJobMatch(cv: any, job: any): number {
  const skills: string[] = (cv.skills || []).map((s: string) => s.toLowerCase());
  const cvTitle = (cv.title || '').toLowerCase().split(' ')[0];
  const text = ((job.title || '') + ' ' + (job.description || '') + ' ' + (job.tags || []).join(' ')).toLowerCase();
  let skillScore = 0;
  skills.forEach(s => { if (s.length > 2 && text.includes(s)) skillScore += 8; });
  const titleBonus = cvTitle.length > 2 && (job.title || '').toLowerCase().includes(cvTitle) ? 20 : 0;
  return Math.min(97, 35 + Math.min(40, skillScore) + titleBonus);
}

function getTopMatchedJobs(cv: any, jobs: any[]): any[] {
  if (!cv || !jobs.length) return [];
  return [...jobs]
    .map(j => ({ ...j, _matchScore: scoreJobMatch(cv, j) }))
    .sort((a, b) => b._matchScore - a._matchScore)
    .slice(0, 3);
}

function getMatchCount(cv: any, jobs: any[]): number {
  if (!cv || !jobs.length) return 0;
  const skills: string[] = (cv.skills || []).map((s: string) => s.toLowerCase());
  const cvTitle = (cv.title || '').toLowerCase().split(' ')[0];
  return jobs.filter(j => {
    const text = ((j.title || '') + ' ' + (j.description || '') + ' ' + (j.tags || []).join(' ')).toLowerCase();
    return skills.some(s => s.length > 2 && text.includes(s)) ||
           (cvTitle.length > 2 && (j.title || '').toLowerCase().includes(cvTitle));
  }).length;
}

// ── In-demand UK skills ───────────────────────────────────────────────────────
const UK_IN_DEMAND = new Set([
  'python','javascript','typescript','react','node.js','node','aws','azure','gcp','sql','excel',
  'agile','scrum','leadership','machine learning','data analysis','docker','kubernetes','devops',
  'java','c#','product management','figma','accounting','nursing','teaching','sales','salesforce',
  'power bi','tableau','finance','communication','git','terraform','risk management','compliance',
  'django','flask','spring','ci/cd','jira','ux design','ui design','digital marketing','seo',
]);

function getTopDemandSkills(cv: any): { skill: string; inDemand: boolean }[] {
  const skills: string[] = cv.skills || [];
  const tagged = skills.map(s => ({ skill: s, inDemand: UK_IN_DEMAND.has(s.toLowerCase()) }));
  return [...tagged.filter(s => s.inDemand), ...tagged.filter(s => !s.inDemand)].slice(0, 5);
}

// ── Circular score ring ───────────────────────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const R = 38;
  const C = 2 * Math.PI * R;
  const filled = (score / 100) * C;
  const color = score >= 80 ? '#50DC78' : score >= 60 ? '#FFA500' : '#FF8080';
  return (
    <svg width="96" height="96" viewBox="0 0 96 96" style={{ display: 'block' }}>
      <circle cx="48" cy="48" r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
      <circle cx="48" cy="48" r={R} fill="none" stroke={color} strokeWidth="7"
        strokeDasharray={`${filled.toFixed(1)} ${C.toFixed(1)}`}
        strokeLinecap="round" transform="rotate(-90 48 48)"
        style={{ transition: 'stroke-dasharray 1s ease-out' }} />
      <text x="48" y="45" textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize="22" fontWeight="800" fontFamily="Plus Jakarta Sans,sans-serif">{score}</text>
      <text x="48" y="62" textAnchor="middle" dominantBaseline="middle"
        fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="Plus Jakarta Sans,sans-serif">/100</text>
    </svg>
  );
}

const ANALYSIS_MSGS = [
  'Reading your CV...',
  'Extracting skills and experience...',
  'Matching to UK job market...',
  'Calculating your UK salary range...',
  'Finding your best UK employer matches...',
  'Optimising for UK employers...',
  'Almost ready...',
];

export const dynamic = 'force-dynamic';

export default function UKDashboard() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');

  const [sub, setSub] = useState<Sub | null>(null);
  const [subLoading, setSubLoading] = useState(true);

  const [applications, setApplications] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const [cvData, setCvData] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [cvError, setCvError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [msgVisible, setMsgVisible] = useState(true);

  const [ukJobs, setUkJobs] = useState<any[]>([]);

  const [rewriteJob, setRewriteJob] = useState('');
  const [rewriting, setRewriting] = useState(false);
  const [rewriteResult, setRewriteResult] = useState<any>(null);
  const [rewriteError, setRewriteError] = useState('');

  const [optimiseJob, setOptimiseJob] = useState<any>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { router.replace('/sign-in'); return; }
    fetch('/api/uk/subscription')
      .then(r => r.json())
      .then(data => {
        setSub(data);
        setSubLoading(false);
        if (!data.active) {
          router.replace(data.hasSubscription ? '/uk/subscribe' : '/uk/onboarding');
        }
      })
      .catch(() => { setSub({ active: false, plan: null, credits: 0 }); setSubLoading(false); });
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (!isSignedIn) return;
    fetch('/api/user/applications?market=GB')
      .then(r => r.json())
      .then(data => {
        setApplications(data.applications || []);
        setAppsLoading(false);
      })
      .catch(() => setAppsLoading(false));
  }, [isSignedIn]);

  useEffect(() => {
    try {
      const s = localStorage.getItem('jobsesame_cv_data');
      if (s) setCvData(JSON.parse(s));
    } catch (err) { console.error('[uk/dashboard] cv parse failed:', err); }
  }, []);

  // Fetch UK jobs for matching whenever we have CV data
  useEffect(() => {
    if (!cvData) { setUkJobs([]); return; }
    if (ukJobs.length > 0) return; // already loaded
    fetch('/api/jobs/uk')
      .then(r => r.json())
      .then(data => {
        const jobs: any[] = data.jobs || [];
        const sorted = cvData
          ? [...jobs].sort((a, b) => scoreJobMatch(cvData, b) - scoreJobMatch(cvData, a))
          : jobs;
        setUkJobs(sorted);
      })
      .catch((err) => console.error('[uk/dashboard] jobs fetch failed:', err));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cvData]);

  // Rotate analysis messages while uploading
  useEffect(() => {
    if (!uploading) { setAnalysisStep(0); setMsgVisible(true); return; }
    let step = 0;
    const tick = () => {
      setMsgVisible(false);
      setTimeout(() => {
        step = Math.min(step + 1, ANALYSIS_MSGS.length - 1);
        setAnalysisStep(step);
        setMsgVisible(true);
      }, 350);
    };
    const interval = setInterval(tick, 1500);
    return () => clearInterval(interval);
  }, [uploading]);

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) { setCvError('Please upload a PDF file.'); return; }
    if (file.size > 15 * 1024 * 1024) { setCvError('File too large. Maximum 15MB.'); return; }
    setCvError('');
    setPendingFile(file);
  };

  const uploadCV = async (file: File) => {
    setUploading(true);
    setPendingFile(null);
    setCvData(null);
    setRewriteResult(null);
    setCvError('');

    let apiData: any = null;
    let apiError = '';

    // Enforce minimum 8-second display so the animation always completes
    await Promise.all([
      new Promise<void>(resolve => setTimeout(resolve, 8000)),
      (async () => {
        try {
          const form = new FormData();
          form.append('cv', file);
          const res = await fetch('/api/cv', { method: 'POST', body: form });
          apiData = await res.json();
          if (!res.ok || apiData.error) apiError = apiData.error || 'Could not read CV.';
        } catch { apiError = 'Upload failed. Please try again.'; }
      })(),
    ]);

    setUploading(false);
    if (apiError) { setCvError(apiError); return; }
    const parsed = apiData?.cvData || apiData;
    setCvData(parsed);
    localStorage.setItem('jobsesame_cv_data', JSON.stringify(parsed));
  };

  const rewriteCV = async () => {
    if (!rewriteJob.trim() || !cvData) return;
    setRewriting(true);
    setRewriteResult(null);
    setRewriteError('');
    try {
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvData, jobTitle: rewriteJob, jobDescription: '', jobCompany: '' }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setRewriteError(data.error || 'Rewrite failed.'); }
      else {
        setRewriteResult(data.rewrittenCV || data);
        const merged = { ...cvData, ...(data.rewrittenCV || data) };
        localStorage.setItem('jobsesame_cv_data', JSON.stringify(merged));
      }
    } catch { setRewriteError('Something went wrong. Please try again.'); }
    setRewriting(false);
  };

  const updateStatus = async (appId: string, status: string) => {
    setUpdatingStatus(appId);
    await fetch(`/api/user/applications/${appId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch((err) => console.error('[uk/dashboard] status update failed:', err));
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
    setUpdatingStatus(null);
  };

  const firstName = user?.firstName || 'there';
  const appStats = {
    applied: applications.filter(a => a.status === 'Applied').length,
    interview: applications.filter(a => a.status === 'Interview').length,
    offer: applications.filter(a => a.status === 'Offer').length,
  };

  if (!isLoaded || subLoading) {
    return (
      <main style={{ background: BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid rgba(200,230,0,0.15)', borderTopColor: ACCENT, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Loading...</p>
        </div>
      </main>
    );
  }

  const planBadge = sub?.plan === 'trial'
    ? `🎁 ${sub.trialDaysLeft ?? 7} days free`
    : sub?.plan === 'pro' ? '∞ Pro'
    : sub?.plan === 'credits' ? `${sub.credits} credits`
    : '';

  return (
    <main style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: BG, minHeight: '100vh', margin: 0, padding: 0 }}>
      <style>{`
        *,*::before,*::after{box-sizing:border-box}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.08);opacity:0.85}}
        @keyframes glow{0%,100%{box-shadow:0 0 0 0 rgba(200,230,0,0.35)}50%{box-shadow:0 0 0 22px rgba(200,230,0,0)}}
        @keyframes scan{0%{top:4%}100%{top:88%}}
        @keyframes progress8s{from{width:0%}to{width:100%}}
        @keyframes msgIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes msgOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-8px)}}
        @keyframes overlayIn{from{opacity:0}to{opacity:1}}
        @keyframes cardReveal{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.2)}
        input:focus,textarea:focus{border-color:rgba(200,230,0,0.35)!important;outline:none}
        select{appearance:none;-webkit-appearance:none}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(200,230,0,0.15);border-radius:3px}
      `}</style>

      {/* ── OPTIMISE MODAL ─────────────────────────────────────────────────── */}
      {optimiseJob && (
        <OptimiseModal
          job={optimiseJob}
          cvData={cvData}
          sub={sub}
          onClose={() => setOptimiseJob(null)}
        />
      )}

      {/* ── ANALYSIS OVERLAY ───────────────────────────────────────────────── */}
      {uploading && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 600,
          background: 'rgba(5,18,10,0.97)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '24px',
          animation: 'overlayIn 0.35s ease-out',
        }}>
          {/* Pulsing document icon */}
          <div style={{ position: 'relative', marginBottom: 40 }}>
            {/* Outer glow ring */}
            <div style={{
              position: 'absolute', inset: -18,
              borderRadius: '50%',
              border: '2px solid rgba(200,230,0,0.25)',
              animation: 'glow 2s ease-in-out infinite',
            }} />
            {/* Icon container */}
            <div style={{
              width: 96, height: 96,
              background: 'rgba(200,230,0,0.08)',
              border: '2px solid rgba(200,230,0,0.3)',
              borderRadius: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              animation: 'pulse 2s ease-in-out infinite',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Document SVG */}
              <svg width="46" height="56" viewBox="0 0 46 56" fill="none">
                <rect x="2" y="2" width="42" height="52" rx="5" fill="rgba(200,230,0,0.1)" stroke="#C8E600" strokeWidth="2"/>
                <line x1="10" y1="16" x2="36" y2="16" stroke="#C8E600" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
                <line x1="10" y1="24" x2="36" y2="24" stroke="#C8E600" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
                <line x1="10" y1="32" x2="28" y2="32" stroke="#C8E600" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
                <line x1="10" y1="40" x2="22" y2="40" stroke="#C8E600" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
              </svg>
              {/* Scanning line */}
              <div style={{
                position: 'absolute', left: 0, right: 0, height: 2,
                background: 'linear-gradient(90deg, transparent, #C8E600, transparent)',
                animation: 'scan 1.6s ease-in-out infinite alternate',
              }} />
            </div>
          </div>

          {/* Status message */}
          <div style={{ height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32 }}>
            <p style={{
              fontSize: 16, fontWeight: 700, color: '#fff',
              margin: 0, textAlign: 'center',
              animation: msgVisible ? 'msgIn 0.35s ease-out forwards' : 'msgOut 0.3s ease-in forwards',
            }}>
              {ANALYSIS_MSGS[analysisStep]}
            </p>
          </div>

          {/* Progress bar */}
          <div style={{ width: '100%', maxWidth: 360, marginBottom: 16 }}>
            <div style={{
              height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                background: 'linear-gradient(90deg, rgba(200,230,0,0.6), #C8E600)',
                borderRadius: 99,
                animation: 'progress8s 8s linear forwards',
              }} />
            </div>
          </div>

          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.22)', margin: 0 }}>
            Powered by Claude AI · takes about 8 seconds
          </p>
        </div>
      )}

      <NavUK planBadge={planBadge} />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: isMobile ? '24px 16px 60px' : '36px 24px 72px', animation: 'fadeIn 0.35s ease-out' }}>

        {/* WELCOME */}
        <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
              Hi, {firstName} 👋
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
              {applications.length > 0
                ? `${applications.length} UK application${applications.length !== 1 ? 's' : ''} tracked`
                : 'Your UK job search hub'}
            </p>
          </div>
          {sub?.plan === 'credits' && (
            sub.credits === 0 ? (
              <a href="/uk/subscribe" style={{ display: 'inline-block', padding: '7px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: 'rgba(239,68,68,0.15)', color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                No credits — Subscribe to continue
              </a>
            ) : sub.credits < 3 ? (
              <div style={{ padding: '7px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)', whiteSpace: 'nowrap' }}>
                Credits: {sub.credits} remaining —{' '}
                <a href="/uk/subscribe" style={{ color: '#F59E0B', textDecoration: 'underline' }}>Top up</a>
              </div>
            ) : (
              <div style={{ padding: '7px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700, background: 'rgba(34,197,94,0.12)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.25)', whiteSpace: 'nowrap' }}>
                Credits: {sub.credits} remaining
              </div>
            )
          )}
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(255,255,255,0.03)', border: BORDER, borderRadius: 12, padding: 4, overflowX: 'auto', WebkitOverflowScrolling: 'touch' as any }}>
          {([
            { id: 'overview', label: 'Overview' },
            { id: 'cv',       label: 'My CV' },
            { id: 'applications', label: `Applications${applications.length ? ` (${applications.length})` : ''}` },
          ] as { id: Tab; label: string }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: tab === t.id ? ACCENT : 'transparent',
                color: tab === t.id ? '#052A14' : 'rgba(255,255,255,0.4)',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ───────────────────────────────────────────────────── */}
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.25s ease-out' }}>

            {/* Plan card */}
            <div style={{ background: 'rgba(200,230,0,0.05)', border: '1.5px solid rgba(200,230,0,0.18)', borderRadius: 16, padding: '20px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 42, height: 42, background: ACCENT, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {sub?.plan === 'trial' ? '🎁' : sub?.plan === 'pro' ? '⚡' : '🎯'}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>
                      {sub?.plan === 'trial' ? '7-Day Free Trial' : sub?.plan === 'pro' ? 'Pro Plan' : 'Credits Plan'}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                      {sub?.plan === 'trial' && sub.trialDaysLeft != null
                        ? `${sub.trialDaysLeft} day${sub.trialDaysLeft !== 1 ? 's' : ''} remaining — no card needed`
                        : sub?.plan === 'credits'
                        ? `${sub.credits} application${sub.credits !== 1 ? 's' : ''} remaining`
                        : 'Unlimited applications'}
                    </div>
                  </div>
                </div>
                {sub?.plan === 'trial' && (
                  <a href="/uk/subscribe" style={{ fontSize: 12, color: '#052A14', background: ACCENT, fontWeight: 800, padding: '8px 16px', borderRadius: 99, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    Upgrade →
                  </a>
                )}
                {sub?.plan === 'credits' && sub.credits <= 5 && (
                  <a href="/uk/subscribe" style={{ fontSize: 12, color: '#052A14', background: ACCENT, fontWeight: 800, padding: '8px 16px', borderRadius: 99, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    Top up →
                  </a>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 12 }}>
              {[
                { label: 'Applied', value: appStats.applied, color: ACCENT },
                { label: 'Interviews', value: appStats.interview, color: '#50B4FF' },
                { label: 'Offers', value: appStats.offer, color: '#50DC78' },
              ].map(s => (
                <div key={s.label} style={{ background: CARD, border: BORDER, borderRadius: 14, padding: '18px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color, marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
              <a href="/uk/jobs" style={{ display: 'flex', alignItems: 'center', gap: 12, background: ACCENT, borderRadius: 12, padding: '14px 18px', textDecoration: 'none' }}>
                <span style={{ fontSize: 20 }}>🔍</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#052A14' }}>Browse UK Jobs</div>
                  <div style={{ fontSize: 11, color: 'rgba(5,42,20,0.6)' }}>500+ live roles updated daily</div>
                </div>
              </a>
              <button
                onClick={() => setTab('cv')}
                style={{ display: 'flex', alignItems: 'center', gap: 12, background: CARD, border: BORDER, borderRadius: 12, padding: '14px 18px', cursor: 'pointer', width: '100%', textAlign: 'left' }}
              >
                <span style={{ fontSize: 20 }}>📄</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{cvData ? 'Update your CV' : 'Upload your CV'}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>AI rewrites it for every UK role</div>
                </div>
              </button>
            </div>

            {/* CV status */}
            {cvData && (
              <div style={{ background: 'rgba(200,230,0,0.05)', border: '1px solid rgba(200,230,0,0.15)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 18 }}>✅</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{cvData.name || 'CV uploaded'}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                    {cvData.title || ''}{cvData.skills?.length ? ` · ${cvData.skills.length} skills` : ''}
                  </div>
                </div>
                <button onClick={() => setTab('cv')} style={{ fontSize: 12, color: ACCENT, background: 'rgba(200,230,0,0.1)', border: '1px solid rgba(200,230,0,0.2)', borderRadius: 99, padding: '5px 12px', cursor: 'pointer', fontWeight: 700, flexShrink: 0 }}>
                  Manage
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── MY CV TAB ──────────────────────────────────────────────────────── */}
        {tab === 'cv' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.25s ease-out' }}>

            {/* Upload area */}
            <div style={{ background: CARD, border: BORDER, borderRadius: 16, padding: '22px' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
                {cvData ? 'Your CV' : 'Upload CV'}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>
                {cvData ? 'AI has parsed your CV — you can replace it anytime.' : 'Upload a PDF and AI will analyse and optimise it for UK employers.'}
              </div>

              {/* Hidden file input — always present */}
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                style={{ display: 'none' }}
                onChange={e => { handleFile(e.target.files?.[0] || null); e.target.value = ''; }}
              />

              {/* ── STATE 1: empty drop zone ── */}
              {!cvData && !pendingFile && (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragOver ? ACCENT : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 12,
                    padding: '40px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: dragOver ? 'rgba(200,230,0,0.04)' : 'transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 10 }}>📄</div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 5px' }}>
                    Drop your CV here or click to browse
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: 0 }}>PDF · max 15MB</p>
                </div>
              )}

              {/* ── STATE 2: file selected, awaiting start ── */}
              {!cvData && pendingFile && (
                <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    background: 'rgba(200,230,0,0.06)',
                    border: '1.5px solid rgba(200,230,0,0.2)',
                    borderRadius: 12, padding: '14px 16px', marginBottom: 14,
                  }}>
                    <div style={{
                      width: 40, height: 40, background: 'rgba(200,230,0,0.1)', borderRadius: 10,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
                        <rect x="1" y="1" width="18" height="22" rx="3" fill="none" stroke="#C8E600" strokeWidth="1.8"/>
                        <line x1="5" y1="7" x2="15" y2="7" stroke="#C8E600" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
                        <line x1="5" y1="11" x2="15" y2="11" stroke="#C8E600" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
                        <line x1="5" y1="15" x2="11" y2="15" stroke="#C8E600" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {pendingFile.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                        {(pendingFile.size / 1024 / 1024).toFixed(2)} MB · PDF
                      </div>
                    </div>
                    <button
                      onClick={() => setPendingFile(null)}
                      style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.25)', fontSize: 16, cursor: 'pointer', flexShrink: 0, padding: 4 }}
                    >
                      ✕
                    </button>
                  </div>

                  <button
                    onClick={() => uploadCV(pendingFile)}
                    style={{
                      width: '100%', background: ACCENT, color: '#052A14',
                      fontSize: 15, fontWeight: 800, padding: '14px',
                      borderRadius: 12, border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      transition: 'opacity 0.15s',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <circle cx="9" cy="9" r="8" fill="none" stroke="#052A14" strokeWidth="1.5"/>
                      <path d="M6 9l2 2 4-4" stroke="#052A14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Start AI Analysis
                  </button>
                  <button
                    onClick={() => fileRef.current?.click()}
                    style={{ width: '100%', marginTop: 8, background: 'transparent', border: 'none', fontSize: 12, color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '6px 0' }}
                  >
                    Choose a different file
                  </button>
                </div>
              )}

              {/* ── STATE 3: CV loaded — results ── */}
              {cvData && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, animation: 'fadeIn 0.4s ease-out' }}>
                  {/* Results reveal header */}
                  <div style={{
                    background: 'rgba(200,230,0,0.06)', border: '1px solid rgba(200,230,0,0.18)',
                    borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4,
                  }}>
                    <span style={{ fontSize: 18 }}>✅</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: ACCENT }}>Analysis complete</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Your CV has been optimised for UK employers</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', width: 60, flexShrink: 0, paddingTop: 2 }}>Name</span>
                    <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{cvData.name || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', width: 60, flexShrink: 0, paddingTop: 2 }}>Title</span>
                    <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{cvData.title || '—'}</span>
                  </div>
                  {cvData.experience_years > 0 && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', width: 60, flexShrink: 0, paddingTop: 2 }}>Exp</span>
                      <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{cvData.experience_years} years</span>
                    </div>
                  )}
                  {cvData.skills?.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', width: 60, flexShrink: 0, paddingTop: 4 }}>Skills</span>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {cvData.skills.slice(0, 8).map((s: string) => (
                          <span key={s} style={{ fontSize: 11, background: 'rgba(200,230,0,0.1)', color: ACCENT, border: '1px solid rgba(200,230,0,0.2)', borderRadius: 99, padding: '2px 8px', fontWeight: 700 }}>{s}</span>
                        ))}
                        {cvData.skills.length > 8 && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>+{cvData.skills.length - 8}</span>}
                      </div>
                    </div>
                  )}
                  <button
                    onClick={() => { setCvData(null); setRewriteResult(null); setUkJobs([]); }}
                    style={{ alignSelf: 'flex-start', marginTop: 4, fontSize: 12, color: 'rgba(255,255,255,0.35)', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 99, padding: '5px 12px', cursor: 'pointer' }}
                  >
                    Replace CV
                  </button>
                </div>
              )}

              {cvError && (
                <div style={{ marginTop: 12, background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#FF8080' }}>
                  {cvError}
                  <button onClick={() => { setCvError(''); setPendingFile(null); }} style={{ marginLeft: 10, fontSize: 11, color: '#FF8080', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Dismiss</button>
                </div>
              )}
            </div>

            {/* ── RESULTS REVEAL ──────────────────────────────────────────── */}
            {cvData && ukJobs.length > 0 && (() => {
              const score = calcCvScore(cvData);
              const scoreColor = score >= 80 ? '#50DC78' : score >= 60 ? '#FFA500' : '#FF8080';
              const matchCount = getMatchCount(cvData, ukJobs);
              const topJobs = getTopMatchedJobs(cvData, ukJobs);
              const top6Jobs = ukJobs.slice(0, 6).map((j: any) => ({ ...j, _matchScore: scoreJobMatch(cvData, j) }));
              const salary = getSalaryRange(cvData.title || '');
              const topSkills = getTopDemandSkills(cvData);
              const cardStyle = (delay: number): React.CSSProperties => ({
                background: CARD, border: BORDER, borderRadius: 16,
                animation: `cardReveal 0.45s ease-out ${delay}ms both`,
              });
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                  {/* Card 1: CV Score */}
                  <div style={{ ...cardStyle(0), padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 20 }}>
                    <ScoreRing score={score} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>CV Score</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: scoreColor, marginBottom: 4 }}>{score >= 80 ? 'Strong' : score >= 60 ? 'Good' : 'Needs Work'}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
                        {score >= 80 ? 'Your CV is well-structured and ATS-ready for UK employers.'
                          : score >= 60 ? 'Good foundation — add more skills and experience details to improve.'
                          : 'Fill in more profile details and add experience bullets to boost your score.'}
                      </div>
                    </div>
                  </div>

                  {/* Card 2: UK Job Matches */}
                  <div style={{ ...cardStyle(300), padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 52, height: 52, background: 'rgba(80,180,255,0.1)', border: '1.5px solid rgba(80,180,255,0.25)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
                        <circle cx="11" cy="11" r="7" stroke="#50B4FF" strokeWidth="2"/>
                        <line x1="16.5" y1="16.5" x2="23" y2="23" stroke="#50B4FF" strokeWidth="2.2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>UK Job Matches</div>
                      <div style={{ fontSize: 26, fontWeight: 800, color: '#50B4FF', lineHeight: 1 }}>{matchCount.toLocaleString()}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>live roles match your profile right now</div>
                    </div>
                  </div>

                  {/* Card 3: Top 3 Matched Jobs */}
                  <div style={{ ...cardStyle(600), padding: '20px 22px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14 }}>Top Matched Roles</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {topJobs.map((job, i) => (
                        <div key={job.id || i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: `hsl(${(job.company?.charCodeAt(0) || 65) * 7 % 360},50%,25%)`, border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                              {(job.company?.[0] || '?').toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.title}</div>
                              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{job.company} · {job.location}</div>
                              {job.salary && <div style={{ fontSize: 11, color: ACCENT, fontWeight: 700, marginTop: 2 }}>{job.salary}</div>}
                            </div>
                            <div style={{ flexShrink: 0 }}>
                              <div style={{ fontSize: 11, fontWeight: 800, color: ACCENT, background: 'rgba(200,230,0,0.1)', border: '1px solid rgba(200,230,0,0.2)', borderRadius: 99, padding: '3px 9px', whiteSpace: 'nowrap' }}>
                                {job._matchScore}% match
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => setOptimiseJob(job)}
                            style={{ width: '100%', background: 'rgba(200,230,0,0.07)', border: '1px solid rgba(200,230,0,0.18)', color: ACCENT, fontSize: 11, fontWeight: 700, padding: '7px', borderRadius: 8, cursor: 'pointer' }}
                          >
                            ✦ Optimise CV for this job
                          </button>
                        </div>
                      ))}
                    </div>
                    <a href="/uk/jobs" style={{ display: 'block', marginTop: 12, textAlign: 'center', fontSize: 12, color: ACCENT, fontWeight: 700, textDecoration: 'none', opacity: 0.7 }}>
                      View all {matchCount} matching roles →
                    </a>
                  </div>

                  {/* Card 4: UK Salary Range */}
                  <div style={{ ...cardStyle(900), padding: '20px 22px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14 }}>UK Salary Range for Your Role</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>Minimum</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{salary.min}</div>
                      </div>
                      <div style={{ fontSize: 20, color: 'rgba(255,255,255,0.2)', padding: '0 8px' }}>→</div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>Maximum</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: ACCENT }}>{salary.max}</div>
                      </div>
                    </div>
                    {/* Range bar */}
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '100%', background: `linear-gradient(90deg, rgba(200,230,0,0.4), #C8E600)`, borderRadius: 99 }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 8 }}>
                      Based on your role: <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{cvData.title || 'General'}</span> · UK market 2025
                    </div>
                  </div>

                  {/* Card 5: Top Skills */}
                  <div style={{ ...cardStyle(1200), padding: '20px 22px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14 }}>Your Top Skills in the UK Market</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {topSkills.map(({ skill, inDemand }, i) => (
                        <div key={skill} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 22, height: 22, borderRadius: 6, background: inDemand ? 'rgba(200,230,0,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${inDemand ? 'rgba(200,230,0,0.3)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: 11, color: inDemand ? ACCENT : 'rgba(255,255,255,0.3)' }}>{i + 1}</span>
                          </div>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{skill}</span>
                          </div>
                          {inDemand && (
                            <span style={{ fontSize: 10, fontWeight: 700, color: '#50DC78', background: 'rgba(80,220,120,0.1)', border: '1px solid rgba(80,220,120,0.2)', borderRadius: 99, padding: '2px 8px', flexShrink: 0 }}>
                              In demand
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card 6: Top 6 Matched Jobs Grid */}
                  <div style={{ animation: `cardReveal 0.45s ease-out 1500ms both`, background: CARD, border: BORDER, borderRadius: 16, padding: '20px 22px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14 }}>
                      Your Top Matched Jobs
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                      {top6Jobs.map((job: any, i: number) => (
                        <div key={job.id || i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {/* Job header */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: 9, background: `hsl(${(job.company?.charCodeAt(0) || 65) * 7 % 360},45%,22%)`, border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                              {(job.company?.[0] || '?').toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{job.title}</div>
                              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.company}</div>
                            </div>
                            <div style={{ fontSize: 10, fontWeight: 800, color: ACCENT, background: 'rgba(200,230,0,0.1)', border: '1px solid rgba(200,230,0,0.2)', borderRadius: 99, padding: '2px 7px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                              {job._matchScore}%
                            </div>
                          </div>

                          {/* Location + salary visible */}
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {job.location && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>📍 {job.location}</span>}
                            {job.salary && <span style={{ fontSize: 11, color: ACCENT, fontWeight: 700 }}>{job.salary}</span>}
                          </div>

                          {/* Tags blurred */}
                          {job.tags?.length > 0 && (
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', filter: 'blur(4px)', userSelect: 'none', pointerEvents: 'none' }}>
                              {job.tags.slice(0, 3).map((t: string) => (
                                <span key={t} style={{ fontSize: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 99, padding: '2px 7px', color: 'rgba(255,255,255,0.5)' }}>{t}</span>
                              ))}
                            </div>
                          )}

                          {/* Action buttons */}
                          {sub?.active ? (
                            <div style={{ display: 'flex', gap: 6 }}>
                              <a
                                href={job.url || job.jobUrl || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ flex: 1, background: ACCENT, color: '#052A14', fontSize: 11, fontWeight: 800, padding: '7px 0', borderRadius: 8, textDecoration: 'none', textAlign: 'center' }}
                              >
                                ⚡ Apply Now
                              </a>
                              <button
                                onClick={() => setOptimiseJob(job)}
                                style={{ flex: 1, background: 'rgba(200,230,0,0.07)', border: '1px solid rgba(200,230,0,0.18)', color: ACCENT, fontSize: 11, fontWeight: 700, padding: '7px 0', borderRadius: 8, cursor: 'pointer' }}
                              >
                                ✦ Optimise
                              </button>
                            </div>
                          ) : (
                            <a
                              href="/uk/subscribe"
                              style={{ display: 'block', width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(200,230,0,0.2)', color: 'rgba(200,230,0,0.7)', fontSize: 11, fontWeight: 700, padding: '7px 0', borderRadius: 8, textDecoration: 'none', textAlign: 'center' }}
                            >
                              🔒 Subscribe to Apply
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA Banner */}
                  <div style={{ animation: `cardReveal 0.45s ease-out 1800ms both` }}>
                    {sub?.active ? (
                      <div style={{ background: 'rgba(200,230,0,0.06)', border: '1.5px solid rgba(200,230,0,0.22)', borderRadius: 16, padding: '22px', textAlign: 'center' }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Your CV is ready — start applying</div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 18 }}>
                          You have {sub.plan === 'credits' ? `${sub.credits} credit${sub.credits === 1 ? '' : 's'}` : 'unlimited'} applications available
                        </div>
                        <a href="/uk/jobs" style={{ display: 'inline-block', background: ACCENT, color: '#052A14', fontSize: 14, fontWeight: 800, padding: '13px 32px', borderRadius: 99, textDecoration: 'none' }}>
                          Browse all {matchCount} matched jobs →
                        </a>
                      </div>
                    ) : (
                      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1.5px solid rgba(200,230,0,0.22)', borderRadius: 16, padding: '26px 22px', textAlign: 'center' }}>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 8, lineHeight: 1.25 }}>
                          You matched <span style={{ color: ACCENT }}>{matchCount}</span> UK jobs — subscribe to apply to all of them
                        </div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 22 }}>
                          Your AI-optimised CV is ready. One click to apply.
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxWidth: 400, margin: '0 auto 16px' }}>
                          <a href="/uk/subscribe?plan=credits" style={{ display: 'block', background: ACCENT, color: '#052A14', fontSize: 13, fontWeight: 800, padding: '13px 0', borderRadius: 99, textDecoration: 'none', textAlign: 'center' }}>
                            Get 20 Credits — £10
                          </a>
                          <a href="/uk/subscribe?plan=pro" style={{ display: 'block', background: 'rgba(200,230,0,0.1)', border: '1.5px solid rgba(200,230,0,0.3)', color: ACCENT, fontSize: 13, fontWeight: 800, padding: '13px 0', borderRadius: 99, textDecoration: 'none', textAlign: 'center' }}>
                            Go Pro — £21/month
                          </a>
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(255,80,80,0.6)', fontWeight: 600 }}>
                          ⚡ Your top matched jobs are filling fast
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              );
            })()}

            {/* Rewrite for UK role */}
            {cvData && (
              <div style={{ background: CARD, border: BORDER, borderRadius: 16, padding: '22px' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Tailor for a UK role</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 14 }}>
                  AI rewrites your CV to pass UK ATS systems for a specific job title.
                </div>
                <div style={{ display: 'flex', gap: 8, flexDirection: isMobile ? 'column' : 'row' }}>
                  <input
                    value={rewriteJob}
                    onChange={e => setRewriteJob(e.target.value)}
                    placeholder="e.g. Senior React Developer, NHS Nurse, Finance Analyst"
                    style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#fff', fontFamily: 'inherit' }}
                  />
                  <button
                    onClick={rewriteCV}
                    disabled={!rewriteJob.trim() || rewriting}
                    style={{ background: rewriteJob.trim() && !rewriting ? ACCENT : 'rgba(200,230,0,0.2)', color: '#052A14', fontSize: 13, fontWeight: 800, padding: '11px 20px', borderRadius: 10, border: 'none', cursor: rewriteJob.trim() && !rewriting ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    {rewriting ? (
                      <><span style={{ width: 12, height: 12, border: '2px solid rgba(5,42,20,0.2)', borderTopColor: '#052A14', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} /> Rewriting...</>
                    ) : '✦ Rewrite'}
                  </button>
                </div>

                {rewriteError && (
                  <div style={{ marginTop: 10, fontSize: 13, color: '#FF8080' }}>{rewriteError}</div>
                )}

                {rewriteResult && (
                  <div style={{ marginTop: 14, background: 'rgba(200,230,0,0.05)', border: '1px solid rgba(200,230,0,0.15)', borderRadius: 12, padding: '14px 16px', animation: 'fadeIn 0.3s ease-out' }}>
                    <div style={{ fontSize: 12, color: ACCENT, fontWeight: 700, marginBottom: 8 }}>✅ CV rewritten for {rewriteJob}</div>
                    {rewriteResult.summary && (
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, margin: '0 0 10px' }}>{rewriteResult.summary}</p>
                    )}
                    {rewriteResult.skills?.length > 0 && (
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {rewriteResult.skills.slice(0, 8).map((s: string) => (
                          <span key={s} style={{ fontSize: 11, background: 'rgba(200,230,0,0.1)', color: ACCENT, border: '1px solid rgba(200,230,0,0.2)', borderRadius: 99, padding: '2px 8px', fontWeight: 700 }}>{s}</span>
                        ))}
                      </div>
                    )}
                    {rewriteResult.ats_score && (
                      <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                        ATS score: <span style={{ color: ACCENT, fontWeight: 700 }}>{rewriteResult.ats_score}%</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── APPLICATIONS TAB ────────────────────────────────────────────────── */}
        {tab === 'applications' && (
          <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
                {applications.length} UK application{applications.length !== 1 ? 's' : ''}
              </div>
              <a href="/uk/jobs" style={{ fontSize: 12, color: ACCENT, fontWeight: 700, textDecoration: 'none', background: 'rgba(200,230,0,0.1)', border: '1px solid rgba(200,230,0,0.2)', borderRadius: 99, padding: '6px 14px' }}>
                + Apply to more
              </a>
            </div>

            {appsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ background: CARD, border: BORDER, borderRadius: 12, height: 62 }} />
                ))}
              </div>
            ) : applications.length === 0 ? (
              <div style={{ background: CARD, border: BORDER, borderRadius: 16, padding: '48px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>No UK applications yet.</p>
                <a href="/uk/jobs" style={{ display: 'inline-block', background: ACCENT, color: '#052A14', fontSize: 14, fontWeight: 800, padding: '12px 28px', borderRadius: 99, textDecoration: 'none' }}>
                  Browse UK jobs →
                </a>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {applications.map(app => {
                  const ss = STATUS_STYLES[app.status] || STATUS_STYLES.Applied;
                  return (
                    <div key={app.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: CARD, border: BORDER, borderRadius: 12, padding: '12px 14px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.jobTitle}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                          {app.company}{app.location ? ` · ${app.location}` : ''} · {new Date(app.appliedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                      <select
                        value={app.status}
                        disabled={updatingStatus === app.id}
                        onChange={e => updateStatus(app.id, e.target.value)}
                        style={{ fontSize: 11, fontWeight: 700, color: ss.color, background: ss.bg, border: `1px solid ${ss.color}44`, borderRadius: 99, padding: '5px 10px', cursor: 'pointer', fontFamily: 'inherit', outline: 'none', flexShrink: 0 }}
                      >
                        {['Applied', 'Interview', 'Offer', 'Rejected'].map(s => (
                          <option key={s} value={s} style={{ background: '#052A14', color: '#fff' }}>{s}</option>
                        ))}
                      </select>
                      {app.jobUrl && (
                        <a href={app.jobUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textDecoration: 'none', flexShrink: 0 }}>↗</a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}
