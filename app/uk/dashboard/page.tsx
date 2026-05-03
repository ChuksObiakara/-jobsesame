'use client';
import { useEffect, useState } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import MarketSwitcher from '../../components/MarketSwitcher';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Sub {
  active: boolean;
  plan: string | null;
  credits: number;
  expiresAt?: string | null;
}

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  location?: string;
  jobUrl?: string;
  status: string;
  appliedAt: string;
  market?: string;
}

interface UKJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  url: string;
  source: string;
  description: string;
  tags: string[];
  postedAt: string;
  applyType: 'greenhouse' | 'direct';
}

// ── UK salary data ────────────────────────────────────────────────────────────
const UK_SALARIES: Record<string, { min: number; max: number }> = {
  'software engineer':  { min: 55000, max: 95000 },
  'data scientist':     { min: 50000, max: 85000 },
  'product manager':    { min: 60000, max: 100000 },
  'designer':           { min: 35000, max: 65000 },
  'marketing manager':  { min: 40000, max: 70000 },
  'accountant':         { min: 35000, max: 65000 },
  'project manager':    { min: 45000, max: 75000 },
  'sales manager':      { min: 40000, max: 75000 },
  'hr manager':         { min: 35000, max: 60000 },
  'developer':          { min: 50000, max: 90000 },
  'analyst':            { min: 35000, max: 65000 },
  'default':            { min: 30000, max: 55000 },
};

function getSalaryForTitle(title: string): { role: string; min: number; max: number } {
  const t = (title || '').toLowerCase();
  for (const [key, val] of Object.entries(UK_SALARIES)) {
    if (key !== 'default' && t.includes(key.split(' ')[0])) {
      return { role: key.replace(/\b\w/g, c => c.toUpperCase()), ...val };
    }
  }
  return { role: title || 'Your Role', ...UK_SALARIES.default };
}

// ── Match score ───────────────────────────────────────────────────────────────
function calcMatch(job: UKJob, cvData: any): number {
  if (!cvData) return 0;
  const skills: string[] = cvData.skills || [];
  const cvTitle: string = cvData.title || '';
  const text = (job.title + ' ' + job.description + ' ' + job.tags.join(' ')).toLowerCase();
  let hits = 0;
  skills.forEach(s => { if (s && text.includes(s.toLowerCase())) hits++; });
  const skillScore = Math.min(40, hits * 8);
  const firstWord = cvTitle.split(' ')[0].toLowerCase();
  const titleMatch = firstWord.length > 2 && job.title.toLowerCase().includes(firstWord);
  return Math.min(97, 35 + skillScore + (titleMatch ? 20 : 0));
}

// ── Status colours ────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  Applied:   { bg: 'rgba(200,230,0,0.12)',  color: '#C8E600' },
  Interview: { bg: 'rgba(80,180,255,0.12)', color: '#50B4FF' },
  Offer:     { bg: 'rgba(80,220,120,0.12)', color: '#50DC78' },
  Rejected:  { bg: 'rgba(255,80,80,0.1)',   color: '#FF8080' },
  Draft:     { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' },
};

const CV_TIPS = [
  { icon: '📄', tip: 'Keep CV to 2 pages maximum' },
  { icon: '🇬🇧', tip: 'Use British spelling throughout (e.g. "colour", "organised")' },
  { icon: '✍️', tip: 'Include a personal statement at the top (3–5 lines)' },
  { icon: '🎓', tip: 'List education with UK equivalent grades where relevant' },
  { icon: '📬', tip: 'Always include a tailored cover letter with every application' },
];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function UKDashboard() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  const [sub, setSub] = useState<Sub | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [jobs, setJobs] = useState<UKJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [cvData, setCvData] = useState<any>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Auth + subscription guard
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { router.replace('/sign-in'); return; }
    fetch('/api/uk/subscription')
      .then(r => r.json())
      .then(data => {
        setSub(data);
        setSubLoading(false);
        if (!data.active) router.replace('/uk/subscribe');
      })
      .catch(() => { setSub({ active: false, plan: null, credits: 0 }); setSubLoading(false); });
  }, [isLoaded, isSignedIn, router]);

  // Load CV from localStorage
  useEffect(() => {
    try {
      const s = localStorage.getItem('jobsesame_cv_data');
      if (s) setCvData(JSON.parse(s));
    } catch {}
  }, []);

  // Fetch GB applications
  useEffect(() => {
    if (!isSignedIn) return;
    fetch('/api/user/applications')
      .then(r => r.json())
      .then(data => {
        const gb = (data.applications || []).filter((a: Application) => a.market === 'GB');
        setApplications(gb);
        setAppsLoading(false);
      })
      .catch(() => setAppsLoading(false));
  }, [isSignedIn]);

  // Fetch recommended jobs
  useEffect(() => {
    fetch('/api/jobs/uk')
      .then(r => r.json())
      .then(data => { setJobs(data.jobs || []); setJobsLoading(false); })
      .catch(() => setJobsLoading(false));
  }, []);

  const updateStatus = async (appId: string, status: string) => {
    setUpdatingStatus(appId);
    await fetch('/api/user/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId: appId, status }),
    }).catch(() => {});
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
    setUpdatingStatus(null);
  };

  // Top 6 jobs sorted by match score
  const recommended = [...jobs]
    .map(j => ({ ...j, score: calcMatch(j, cvData) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const salary = getSalaryForTitle(cvData?.title || '');

  const firstName = user?.firstName || user?.fullName?.split(' ')[0] || 'there';
  const planLabel = sub?.plan === 'pro' ? 'Pro' : sub?.plan === 'credits' ? 'Credits' : sub?.plan || 'Active';

  const appStats = {
    total: applications.length,
    applied: applications.filter(a => a.status === 'Applied').length,
    interview: applications.filter(a => a.status === 'Interview').length,
    offer: applications.filter(a => a.status === 'Offer').length,
  };

  if (!isLoaded || subLoading) {
    return (
      <main style={{ background: '#052A14', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 36, height: 36, border: '3px solid rgba(200,230,0,0.2)', borderTopColor: '#C8E600', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Loading your UK dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: '#052A14', minHeight: '100vh', margin: 0, padding: 0 }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .card { transition: border-color 0.18s, transform 0.18s; }
        .card:hover { border-color: rgba(200,230,0,0.25) !important; }
        select { appearance: none; -webkit-appearance: none; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(200,230,0,0.15); border-radius: 3px; }
      `}</style>

      {/* NAV */}
      <nav style={{ background: '#041E0F', borderBottom: '1px solid rgba(255,255,255,0.06)', height: 64, padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 200 }}>
        <a href="/uk" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ fontSize: 17, fontWeight: 800 }}>
            <span style={{ color: '#FFFFFF' }}>job</span><span style={{ color: '#C8E600' }}>sesame</span>
          </span>
          <span style={{ fontSize: 10, background: 'rgba(200,230,0,0.12)', color: '#C8E600', border: '1px solid rgba(200,230,0,0.25)', borderRadius: 99, padding: '2px 7px', fontWeight: 700 }}>🇬🇧 UK</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 14 }}>
          {sub?.active && (
            <div style={{ background: 'rgba(200,230,0,0.1)', border: '1px solid rgba(200,230,0,0.22)', borderRadius: 99, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: '#C8E600', flexShrink: 0 }}>
              {sub.plan === 'credits' ? `${sub.credits} credits` : '∞ Pro'}
            </div>
          )}
          {!isMobile && (
            <a href="/uk/jobs" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontWeight: 500 }}>Browse Jobs</a>
          )}
          <MarketSwitcher compact={isMobile} />
          <UserButton afterSignOutUrl="/uk" />
        </div>
      </nav>

      {/* BODY */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: isMobile ? '20px 16px 48px' : '32px 24px 64px', animation: 'fadeIn 0.4s ease-out' }}>

        {/* WELCOME HEADER */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#FFFFFF', marginBottom: 6 }}>
            Your UK Job Search Dashboard 🇬🇧
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
            Welcome back, <span style={{ color: '#C8E600', fontWeight: 600 }}>{firstName}</span> · {appStats.total} UK application{appStats.total !== 1 ? 's' : ''} tracked
          </p>
        </div>

        {/* TOP ROW: Subscription card + stats */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr 1fr', gap: 14, marginBottom: 28 }}>
          {/* Subscription status */}
          <div className="card" style={{ gridColumn: isMobile ? 'auto' : 'span 2', background: 'rgba(200,230,0,0.06)', border: '1.5px solid rgba(200,230,0,0.2)', borderRadius: 16, padding: '20px 22px' }}>
            <div style={{ fontSize: 10, color: '#C8E600', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 10 }}>UK Subscription</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, background: '#C8E600', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                {sub?.plan === 'pro' ? '⚡' : '🎯'}
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#FFFFFF' }}>{planLabel} Plan</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                  {sub?.plan === 'credits'
                    ? `${sub.credits} application${sub.credits !== 1 ? 's' : ''} remaining`
                    : sub?.plan === 'pro'
                    ? 'Unlimited applications'
                    : 'Active'}
                </div>
              </div>
            </div>
            {sub?.expiresAt && (
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                Renews {new Date(sub.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            )}
            {sub?.plan === 'credits' && sub.credits <= 5 && (
              <div style={{ marginTop: 10, fontSize: 12, color: '#FF8080', background: 'rgba(255,80,80,0.08)', borderRadius: 8, padding: '6px 10px' }}>
                ⚠ Low credits — <a href="/uk/subscribe" style={{ color: '#C8E600', textDecoration: 'none', fontWeight: 700 }}>top up</a>
              </div>
            )}
          </div>

          {/* Stat cards */}
          {[
            { label: 'Applied', value: appStats.applied, color: '#C8E600', icon: '📤' },
            { label: 'Interviews', value: appStats.interview, color: '#50B4FF', icon: '🗓' },
            { label: 'Offers', value: appStats.offer, color: '#50DC78', icon: '🎉' },
          ].map(stat => (
            <div key={stat.label} className="card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '20px 22px' }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>{stat.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: stat.color, marginBottom: 2 }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* APPLICATIONS TRACKER */}
        <div className="card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: isMobile ? '20px 16px' : '24px', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: '#C8E600', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 4 }}>Application Tracker</div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>UK Applications</h2>
            </div>
            <a href="/uk/jobs" style={{ fontSize: 12, color: '#C8E600', fontWeight: 700, textDecoration: 'none', background: 'rgba(200,230,0,0.1)', border: '1px solid rgba(200,230,0,0.25)', borderRadius: 99, padding: '6px 14px', whiteSpace: 'nowrap' }}>
              + Apply to more
            </a>
          </div>

          {appsLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, height: 58 }} />
              ))}
            </div>
          ) : applications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📭</div>
              No UK applications yet. <a href="/uk/jobs" style={{ color: '#C8E600', textDecoration: 'none', fontWeight: 700 }}>Browse UK jobs →</a>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {applications.slice(0, 8).map(app => {
                const ss = STATUS_STYLES[app.status] || STATUS_STYLES.Applied;
                return (
                  <div key={app.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.jobTitle}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                        {app.company}{app.location ? ` · ${app.location}` : ''}
                        {' · '}{new Date(app.appliedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                    <select
                      value={app.status}
                      disabled={updatingStatus === app.id}
                      onChange={e => updateStatus(app.id, e.target.value)}
                      style={{ fontSize: 11, fontWeight: 700, color: ss.color, background: ss.bg, border: `1px solid ${ss.color}33`, borderRadius: 99, padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit', outline: 'none', flexShrink: 0 }}
                    >
                      {['Applied', 'Interview', 'Offer', 'Rejected'].map(s => (
                        <option key={s} value={s} style={{ background: '#052A14', color: '#fff' }}>{s}</option>
                      ))}
                    </select>
                    {app.jobUrl && (
                      <a href={app.jobUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', flexShrink: 0 }}>↗</a>
                    )}
                  </div>
                );
              })}
              {applications.length > 8 && (
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginTop: 4 }}>+{applications.length - 8} more · <a href="/uk/jobs" style={{ color: '#C8E600', textDecoration: 'none' }}>browse more jobs</a></p>
              )}
            </div>
          )}
        </div>

        {/* RECOMMENDED JOBS */}
        <div className="card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: isMobile ? '20px 16px' : '24px', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, color: '#C8E600', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 4 }}>AI-Matched</div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Recommended UK Jobs</h2>
            </div>
            <a href="/uk/jobs" style={{ fontSize: 12, color: '#C8E600', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>View all →</a>
          </div>

          {jobsLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 12 }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, height: 100 }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 12 }}>
              {recommended.map(job => (
                <div key={job.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.3 }}>{job.title}</div>
                    {job.score > 0 && (
                      <span style={{ fontSize: 10, color: '#C8E600', background: 'rgba(200,230,0,0.12)', borderRadius: 99, padding: '2px 7px', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>{job.score}%</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{job.company}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>📍 {job.location}</div>
                  {job.salary && <div style={{ fontSize: 11, color: '#C8E600', fontWeight: 700 }}>{job.salary}</div>}
                  <a href="/uk/jobs" style={{ marginTop: 4, fontSize: 11, color: '#C8E600', fontWeight: 700, textDecoration: 'none', background: 'rgba(200,230,0,0.08)', border: '1px solid rgba(200,230,0,0.2)', borderRadius: 99, padding: '5px 12px', textAlign: 'center', display: 'block' }}>
                    ⚡ Quick Apply
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BOTTOM ROW: salary + CV tips + quick links */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 16 }}>

          {/* UK Salary Intelligence */}
          <div className="card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '22px 20px' }}>
            <div style={{ fontSize: 10, color: '#C8E600', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 14 }}>UK Salary Guide</div>
            {cvData?.title ? (
              <>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>Your role match</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF' }}>{salary.role}</div>
                </div>
                <div style={{ background: 'rgba(200,230,0,0.06)', border: '1px solid rgba(200,230,0,0.15)', borderRadius: 12, padding: '14px 16px', marginBottom: 14 }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>UK market range 2025</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#C8E600' }}>
                    £{salary.min.toLocaleString()} – £{salary.max.toLocaleString()}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ marginBottom: 14, fontSize: 13, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>
                Upload your CV to see your personalised UK salary range.
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(UK_SALARIES).filter(([k]) => k !== 'default').slice(0, 4).map(([role, { min, max }]) => (
                <div key={role} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                  <span style={{ color: 'rgba(255,255,255,0.45)' }}>{role.replace(/\b\w/g, c => c.toUpperCase())}</span>
                  <span style={{ color: '#C8E600', fontWeight: 700 }}>£{(min / 1000).toFixed(0)}k–£{(max / 1000).toFixed(0)}k</span>
                </div>
              ))}
            </div>
          </div>

          {/* UK CV Tips */}
          <div className="card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '22px 20px' }}>
            <div style={{ fontSize: 10, color: '#C8E600', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 14 }}>UK CV Tips</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {CV_TIPS.map(({ icon, tip }) => (
                <div key={tip} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1.4 }}>{icon}</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55 }}>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '22px 20px' }}>
            <div style={{ fontSize: 10, color: '#C8E600', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 14 }}>Quick Links</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { href: '/uk/jobs', icon: '🔍', label: 'Browse UK Jobs', desc: 'Search live UK listings' },
                { href: '/dashboard', icon: '✏️', label: 'Rewrite CV for UK', desc: 'AI tailors your CV to UK roles' },
                { href: '/dashboard', icon: '📝', label: 'Generate Cover Letter', desc: 'AI writes it in 30 seconds' },
                { href: '/uk', icon: '🇬🇧', label: 'UK Home', desc: 'Back to UK landing page' },
              ].map(({ href, icon, label, desc }) => (
                <a key={label} href={href} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '11px 14px', textDecoration: 'none', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(200,230,0,0.25)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>{label}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{desc}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
