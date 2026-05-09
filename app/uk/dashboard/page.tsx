'use client';
import { useEffect, useRef, useState } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import MarketSwitcher from '../../components/MarketSwitcher';

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

  const [rewriteJob, setRewriteJob] = useState('');
  const [rewriting, setRewriting] = useState(false);
  const [rewriteResult, setRewriteResult] = useState<any>(null);
  const [rewriteError, setRewriteError] = useState('');

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
    fetch('/api/user/applications')
      .then(r => r.json())
      .then(data => {
        setApplications((data.applications || []).filter((a: any) => a.market === 'GB'));
        setAppsLoading(false);
      })
      .catch(() => setAppsLoading(false));
  }, [isSignedIn]);

  useEffect(() => {
    try {
      const s = localStorage.getItem('jobsesame_cv_data');
      if (s) setCvData(JSON.parse(s));
    } catch {}
  }, []);

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) { setCvError('Please upload a PDF file.'); return; }
    if (file.size > 15 * 1024 * 1024) { setCvError('File too large. Maximum 15MB.'); return; }
    setCvError('');
    uploadCV(file);
  };

  const uploadCV = async (file: File) => {
    setUploading(true);
    setCvData(null);
    setRewriteResult(null);
    try {
      const form = new FormData();
      form.append('cv', file);
      const res = await fetch('/api/cv', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok || data.error) { setCvError(data.error || 'Could not read CV.'); }
      else {
        setCvData(data.cvData || data);
        localStorage.setItem('jobsesame_cv_data', JSON.stringify(data.cvData || data));
      }
    } catch { setCvError('Upload failed. Please try again.'); }
    setUploading(false);
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
    await fetch('/api/user/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId: appId, status }),
    }).catch(() => {});
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
        input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.2)}
        input:focus,textarea:focus{border-color:rgba(200,230,0,0.35)!important;outline:none}
        select{appearance:none;-webkit-appearance:none}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(200,230,0,0.15);border-radius:3px}
      `}</style>

      {/* NAV */}
      <nav style={{ background: NAV_BG, borderBottom: BORDER, height: 64, padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/uk" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ fontSize: 17, fontWeight: 800 }}>
            <span style={{ color: '#fff' }}>job</span><span style={{ color: ACCENT }}>sesame</span>
          </span>
          <span style={{ fontSize: 10, background: 'rgba(200,230,0,0.12)', color: ACCENT, border: '1px solid rgba(200,230,0,0.25)', borderRadius: 99, padding: '2px 7px', fontWeight: 700 }}>🇬🇧</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 14 }}>
          {planBadge && (
            <div style={{ background: 'rgba(200,230,0,0.1)', border: '1px solid rgba(200,230,0,0.22)', borderRadius: 99, padding: '5px 12px', fontSize: 12, fontWeight: 700, color: ACCENT, flexShrink: 0 }}>
              {planBadge}
            </div>
          )}
          {!isMobile && (
            <a href="/uk/jobs" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontWeight: 500 }}>Browse Jobs</a>
          )}
          <MarketSwitcher compact={isMobile} />
          <UserButton afterSignOutUrl="/uk" />
        </div>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: isMobile ? '24px 16px 60px' : '36px 24px 72px', animation: 'fadeIn 0.35s ease-out' }}>

        {/* WELCOME */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
            Hi, {firstName} 👋
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
            {applications.length > 0
              ? `${applications.length} UK application${applications.length !== 1 ? 's' : ''} tracked`
              : 'Your UK job search hub'}
          </p>
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(255,255,255,0.03)', border: BORDER, borderRadius: 12, padding: 4 }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
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
                {cvData ? 'AI has parsed your CV — you can replace it anytime.' : 'Upload a PDF and AI will parse and optimise it for UK employers.'}
              </div>

              {!cvData && (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                  onClick={() => !uploading && fileRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragOver ? ACCENT : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 12,
                    padding: '32px 20px',
                    textAlign: 'center',
                    cursor: uploading ? 'wait' : 'pointer',
                    background: dragOver ? 'rgba(200,230,0,0.04)' : 'transparent',
                    transition: 'all 0.2s',
                  }}
                >
                  <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files?.[0] || null)} />
                  {uploading ? (
                    <>
                      <div style={{ width: 28, height: 28, border: '3px solid rgba(200,230,0,0.15)', borderTopColor: ACCENT, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Analysing with AI...</p>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: '0 0 4px' }}>Drop your CV or click to upload</p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', margin: 0 }}>PDF · max 15MB</p>
                    </>
                  )}
                </div>
              )}

              {cvData && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', width: 60, flexShrink: 0, paddingTop: 2 }}>Name</span>
                    <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{cvData.name || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', width: 60, flexShrink: 0, paddingTop: 2 }}>Title</span>
                    <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{cvData.title || '—'}</span>
                  </div>
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
                    onClick={() => { setCvData(null); setRewriteResult(null); fileRef.current?.click(); }}
                    style={{ alignSelf: 'flex-start', marginTop: 4, fontSize: 12, color: 'rgba(255,255,255,0.35)', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 99, padding: '5px 12px', cursor: 'pointer' }}
                  >
                    Replace CV
                  </button>
                  <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => handleFile(e.target.files?.[0] || null)} />
                </div>
              )}

              {cvError && (
                <div style={{ marginTop: 12, background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#FF8080' }}>
                  {cvError}
                </div>
              )}
            </div>

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
