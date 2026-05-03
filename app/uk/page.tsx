'use client';
import { useEffect, useState } from 'react';
import { useAuth, UserButton } from '@clerk/nextjs';
import MarketSwitcher from '../components/MarketSwitcher';

interface UKJob {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  source: string;
  tags: string[];
  postedAt: string;
}

const STEPS = [
  { icon: '📄', title: 'Upload your CV once', desc: 'Paste or upload your existing CV. Takes 60 seconds.' },
  { icon: '🤖', title: 'AI matches UK jobs', desc: 'Our AI scans hundreds of live UK listings and ranks the best fits for your skills.' },
  { icon: '⚡', title: 'One-click apply', desc: 'AI rewrites your CV for each job in 30 seconds. We submit directly to employers.' },
];

const SALARIES = [
  { role: 'Software Engineer', range: '£55,000 – £95,000' },
  { role: 'Data Scientist', range: '£50,000 – £85,000' },
  { role: 'Product Manager', range: '£60,000 – £100,000' },
  { role: 'Designer', range: '£35,000 – £65,000' },
  { role: 'Marketing Manager', range: '£40,000 – £70,000' },
  { role: 'Accountant', range: '£35,000 – £65,000' },
  { role: 'Project Manager', range: '£45,000 – £75,000' },
];

const PLANS = [
  {
    name: 'Free',
    price: '£0',
    period: '',
    color: 'rgba(255,255,255,0.06)',
    border: 'rgba(255,255,255,0.08)',
    tag: null,
    features: ['Browse all UK jobs', 'Save jobs', 'Basic job search'],
    cta: 'Coming Soon — Notify Me',
  },
  {
    name: 'Credits',
    price: '£10',
    period: 'one-time',
    color: 'rgba(200,230,0,0.06)',
    border: 'rgba(200,230,0,0.3)',
    tag: 'Most Popular',
    features: ['20 AI applications', 'CV rewritten per job', 'Greenhouse direct apply', 'Application tracker'],
    cta: 'Coming Soon — Notify Me',
  },
  {
    name: 'Pro',
    price: '£21',
    period: '/ month',
    color: 'rgba(200,230,0,0.04)',
    border: 'rgba(200,230,0,0.15)',
    tag: null,
    features: ['Unlimited applications', 'Priority job matching', 'UK CV rewriter', 'Application tracker', 'Email follow-up sequences'],
    cta: 'Coming Soon — Notify Me',
  },
];

export default function UKPage() {
  const { isSignedIn } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [jobs, setJobs] = useState<UKJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [notified, setNotified] = useState<string | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    fetch('/api/jobs/uk')
      .then(r => r.json())
      .then(data => {
        setJobs((data.jobs || []).slice(0, 6));
        setJobsLoading(false);
      })
      .catch(() => setJobsLoading(false));
  }, []);

  const handleNotify = (plan: string) => {
    setNotified(plan);
    setTimeout(() => setNotified(null), 3000);
  };

  return (
    <main style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: '#052A14', margin: 0, padding: 0, overflowX: 'hidden' }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ctaGlow { 0%,100%{box-shadow:0 8px 32px rgba(200,230,0,0.35)} 50%{box-shadow:0 8px 52px rgba(200,230,0,0.65)} }
        @keyframes toastIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .nav-link { transition: color 0.15s; }
        .nav-link:hover { color: #FFFFFF !important; }
        .hov-lift { transition: transform 0.2s, border-color 0.2s; }
        .hov-lift:hover { transform: translateY(-4px); border-color: rgba(200,230,0,0.3) !important; }
        .plan-card { transition: transform 0.2s, border-color 0.2s; }
        .plan-card:hover { transform: translateY(-4px); }
      `}</style>

      {/* TOAST */}
      {notified && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#C8E600', color: '#052A14', fontWeight: 700, fontSize: 14, padding: '12px 28px', borderRadius: 99, zIndex: 999, animation: 'toastIn 0.25s ease-out', whiteSpace: 'nowrap' }}>
          ✓ We&apos;ll notify you when {notified} launches!
        </div>
      )}

      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 200, height: 64,
        padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(3,15,7,0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : 'none',
        transition: 'all 0.3s',
      }}>
        <a href="/uk" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>
            <span style={{ color: '#FFFFFF' }}>job</span><span style={{ color: '#C8E600' }}>sesame</span>
          </span>
          <span style={{ fontSize: 11, background: 'rgba(200,230,0,0.15)', color: '#C8E600', border: '1px solid rgba(200,230,0,0.3)', borderRadius: 99, padding: '2px 8px', fontWeight: 700, letterSpacing: 0.5 }}>🇬🇧 UK</span>
        </a>

        {!isMobile && (
          <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <a href="#how-it-works" className="nav-link" style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500, padding: '8px 14px', textDecoration: 'none', borderRadius: 8 }}>How it works</a>
            <a href="#jobs" className="nav-link" style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500, padding: '8px 14px', textDecoration: 'none', borderRadius: 8 }}>Jobs</a>
            <a href="#pricing" className="nav-link" style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500, padding: '8px 14px', textDecoration: 'none', borderRadius: 8 }}>Pricing</a>
            <a href="#salaries" className="nav-link" style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500, padding: '8px 14px', textDecoration: 'none', borderRadius: 8 }}>Salaries</a>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <MarketSwitcher compact={isMobile} />
          {!isMobile && !isSignedIn && (
            <a href="/sign-in" className="nav-link" style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500, textDecoration: 'none', padding: '8px 12px' }}>Sign in</a>
          )}
          {!isMobile && isSignedIn && (
            <a href="/dashboard" style={{ fontSize: 13, color: '#C8E600', fontWeight: 700, textDecoration: 'none', padding: '8px 16px', background: 'rgba(200,230,0,0.1)', borderRadius: 99, border: '1px solid rgba(200,230,0,0.3)' }}>Dashboard</a>
          )}
          {isSignedIn
            ? <UserButton afterSignOutUrl="/uk" />
            : <a href="/sign-up" style={{ background: '#C8E600', color: '#052A14', fontSize: 13, fontWeight: 800, padding: '9px 22px', borderRadius: 99, textDecoration: 'none', whiteSpace: 'nowrap', boxShadow: '0 2px 16px rgba(200,230,0,0.3)' }}>Get started free</a>
          }
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: isMobile ? '72px 24px 64px' : '96px 28px 80px', textAlign: 'center', maxWidth: 780, margin: '0 auto', animation: 'fadeInUp 0.6s ease-out' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(200,230,0,0.1)', border: '1px solid rgba(200,230,0,0.25)', borderRadius: 99, padding: '6px 16px', marginBottom: 28 }}>
          <span style={{ fontSize: 13 }}>🇬🇧</span>
          <span style={{ fontSize: 12, color: '#C8E600', fontWeight: 600, letterSpacing: 0.4 }}>Now live in the United Kingdom</span>
        </div>
        <h1 style={{ fontSize: isMobile ? 34 : 56, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1, marginBottom: 20, letterSpacing: -1 }}>
          Find Your UK Job —<br />
          <span style={{ color: '#C8E600' }}>AI Does the Hard Work</span>
        </h1>
        <p style={{ fontSize: isMobile ? 16 : 19, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, marginBottom: 36, maxWidth: 560, margin: '0 auto 36px' }}>
          Auto-apply to hundreds of UK employers. AI rewrites your CV for every application in 30 seconds.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/sign-up" style={{ background: '#C8E600', color: '#052A14', fontSize: 15, fontWeight: 800, padding: '14px 32px', borderRadius: 99, textDecoration: 'none', animation: 'ctaGlow 2.5s ease-in-out infinite', whiteSpace: 'nowrap' }}>
            Get Started Free →
          </a>
          <a href="#jobs" style={{ background: 'rgba(255,255,255,0.06)', color: '#FFFFFF', fontSize: 15, fontWeight: 600, padding: '14px 32px', borderRadius: 99, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.1)', whiteSpace: 'nowrap' }}>
            View UK Jobs
          </a>
        </div>

        {/* Social proof */}
        <div style={{ display: 'flex', gap: isMobile ? 20 : 40, justifyContent: 'center', marginTop: 48, flexWrap: 'wrap' }}>
          {[['500+', 'UK jobs live'], ['30s', 'CV rewrite time'], ['8/10', 'CVs pass ATS']].map(([stat, label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#C8E600' }}>{stat}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ padding: isMobile ? '56px 24px' : '80px 28px', maxWidth: 960, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 10, color: '#C8E600', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>How it works</div>
          <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 800, color: '#FFFFFF', letterSpacing: -0.5 }}>Three steps to your next UK role</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 20 }}>
          {STEPS.map((step, i) => (
            <div key={i} className="hov-lift" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '28px 24px' }}>
              <div style={{ fontSize: 32, marginBottom: 14 }}>{step.icon}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(200,230,0,0.15)', border: '1px solid rgba(200,230,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#C8E600', fontWeight: 800, flexShrink: 0 }}>{i + 1}</span>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>{step.title}</h3>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, margin: 0 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* LIVE JOBS PREVIEW */}
      <section id="jobs" style={{ padding: isMobile ? '56px 24px' : '80px 28px', maxWidth: 960, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 10, color: '#C8E600', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>Live jobs</div>
          <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 800, color: '#FFFFFF', letterSpacing: -0.5 }}>Latest UK opportunities</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 10 }}>Updated every 30 minutes from top UK employers</p>
        </div>

        {jobsLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '20px 22px', minHeight: 120 }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 6, height: 16, width: '60%', marginBottom: 10 }} />
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 6, height: 12, width: '40%', marginBottom: 8 }} />
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 6, height: 12, width: '50%' }} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            {jobs.map(job => (
              <div key={job.id} style={{ position: 'relative', overflow: 'hidden', borderRadius: 14 }}>
                {/* Job card */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px 22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 3 }}>{job.title}</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{job.company}</div>
                    </div>
                    {job.salary && (
                      <div style={{ fontSize: 12, color: '#C8E600', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>{job.salary}</div>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>📍 {job.location}</div>
                  {job.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {job.tags.slice(0, 2).map(tag => (
                        <span key={tag} style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', borderRadius: 99, padding: '3px 8px', fontWeight: 600 }}>{tag}</span>
                      ))}
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.03)', borderRadius: 99, padding: '3px 8px' }}>{job.source}</span>
                    </div>
                  )}
                </div>
                {/* Lock overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(5,42,20,0.1) 0%, rgba(5,42,20,0.85) 60%, rgba(5,42,20,0.97) 100%)', borderRadius: 14, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 16 }}>
                  <a href="/sign-up" style={{ background: '#C8E600', color: '#052A14', fontSize: 12, fontWeight: 800, padding: '8px 20px', borderRadius: 99, textDecoration: 'none', boxShadow: '0 4px 16px rgba(200,230,0,0.3)' }}>
                    🔒 Subscribe to Apply
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 28 }}>
          <a href="#pricing" style={{ fontSize: 14, color: '#C8E600', fontWeight: 600, textDecoration: 'none' }}>
            Unlock all jobs + auto-apply →
          </a>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: isMobile ? '56px 24px' : '80px 28px', maxWidth: 960, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 10, color: '#C8E600', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>Pricing</div>
          <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 800, color: '#FFFFFF', letterSpacing: -0.5 }}>Simple, affordable pricing</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 10 }}>Pay only for what you use. No hidden fees.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 20, alignItems: 'start' }}>
          {PLANS.map(plan => (
            <div key={plan.name} className="plan-card" style={{ background: plan.color, border: `1.5px solid ${plan.border}`, borderRadius: 20, padding: '28px 24px', position: 'relative' }}>
              {plan.tag && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#C8E600', color: '#052A14', fontSize: 10, fontWeight: 800, padding: '4px 12px', borderRadius: 99, whiteSpace: 'nowrap' }}>
                  {plan.tag}
                </div>
              )}
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '1px' }}>{plan.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                <span style={{ fontSize: 38, fontWeight: 800, color: '#FFFFFF' }}>{plan.price}</span>
                {plan.period && <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{plan.period}</span>}
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '18px 0' }} />
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
                    <span style={{ color: '#C8E600', flexShrink: 0 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleNotify(plan.name)}
                style={{ width: '100%', background: plan.tag ? '#C8E600' : 'rgba(255,255,255,0.07)', color: plan.tag ? '#052A14' : 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 700, padding: '12px 20px', borderRadius: 99, border: plan.tag ? 'none' : '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* SALARY INTELLIGENCE */}
      <section id="salaries" style={{ padding: isMobile ? '56px 24px' : '80px 28px', maxWidth: 960, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 10, color: '#C8E600', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>UK Salary Guide 2025</div>
          <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight: 800, color: '#FFFFFF', letterSpacing: -0.5 }}>Know your worth in the UK market</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 10 }}>London & remote roles · Based on live job postings</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
          {SALARIES.map(({ role, range }) => (
            <div key={role} className="hov-lift" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px 20px', gap: 16 }}>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{role}</span>
              <span style={{ fontSize: 14, color: '#C8E600', fontWeight: 800, flexShrink: 0 }}>{range}</span>
            </div>
          ))}
        </div>
        <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 20 }}>Salary data is indicative and based on UK job market aggregation. Actual pay varies by experience and employer.</p>
      </section>

      {/* CTA BAND */}
      <section style={{ padding: isMobile ? '56px 24px' : '80px 28px', textAlign: 'center' }}>
        <div style={{ maxWidth: 580, margin: '0 auto', background: 'rgba(200,230,0,0.05)', border: '1px solid rgba(200,230,0,0.2)', borderRadius: 24, padding: isMobile ? '40px 28px' : '56px 48px' }}>
          <div style={{ fontSize: isMobile ? 26 : 34, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.15, marginBottom: 16, letterSpacing: -0.5 }}>
            Ready to land a UK job?
          </div>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 28, lineHeight: 1.65 }}>
            Start free. Upload your CV once. Let AI do the applying.
          </p>
          <a href="/sign-up" style={{ display: 'inline-block', background: '#C8E600', color: '#052A14', fontSize: 15, fontWeight: 800, padding: '14px 36px', borderRadius: 99, textDecoration: 'none', animation: 'ctaGlow 2.5s ease-in-out infinite' }}>
            Get 3 free applications →
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#020804', borderTop: '1px solid rgba(255,255,255,0.04)', padding: isMobile ? '48px 20px 64px' : '64px 28px 32px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr 1fr 1fr 1fr', gap: isMobile ? '32px 24px' : 40, marginBottom: 48 }}>
            <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 16, fontWeight: 800 }}><span style={{ color: '#FFFFFF' }}>job</span><span style={{ color: '#C8E600' }}>sesame</span></span>
                <span style={{ fontSize: 10, background: 'rgba(200,230,0,0.1)', color: '#C8E600', border: '1px solid rgba(200,230,0,0.25)', borderRadius: 99, padding: '2px 7px', fontWeight: 700 }}>🇬🇧 UK</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.18)', lineHeight: 1.8, maxWidth: 220, marginBottom: 6 }}>AI-powered job applications for professionals who refuse to be ignored.</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.1)', marginBottom: 6 }}>Jobsesame · United Kingdom</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.1)' }}>
                <a href="mailto:uk@jobsesame.co.za" style={{ color: 'rgba(255,255,255,0.15)', textDecoration: 'none' }}>uk@jobsesame.co.za</a>
              </p>
            </div>
            {[
              { heading: 'Product', links: [{ label: 'UK Jobs', href: '#jobs' }, { label: 'Pricing', href: '#pricing' }, { label: 'Dashboard', href: '/dashboard' }, { label: 'CV Optimiser', href: '/optimise' }] },
              { heading: 'Company', links: [{ label: 'About', href: '/about' }, { label: 'Blog', href: '/blog' }, { label: 'Recruiters', href: '/recruiters' }, { label: 'Contact', href: 'mailto:uk@jobsesame.co.za' }] },
              { heading: 'Legal', links: [{ label: 'Privacy Policy', href: '/privacy' }, { label: 'Terms of Service', href: '/terms' }, { label: 'Refund Policy', href: '/refund' }, { label: 'Delete My Data', href: '/delete-data' }] },
            ].map(col => (
              <div key={col.heading}>
                <div style={{ fontSize: 10, color: '#C8E600', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 16 }}>{col.heading}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {col.links.map(l => (
                    <a key={l.label} href={l.href} className="nav-link" style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', textDecoration: 'none' }}>{l.label}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 20, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.12)' }}>© 2025 Jobsesame. All rights reserved.</span>
            <div style={{ display: 'flex', gap: 20 }}>
              {['Twitter', 'LinkedIn'].map(s => <span key={s} style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', cursor: 'pointer' }}>{s}</span>)}
            </div>
          </div>
        </div>
      </footer>

      {/* MOBILE STICKY CTA */}
      {isMobile && !isSignedIn && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 300, background: 'rgba(3,15,7,0.96)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(200,230,0,0.2)', padding: '12px 20px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
          <a href="/sign-up" style={{ display: 'block', background: '#C8E600', color: '#052A14', fontSize: 15, fontWeight: 800, padding: '16px 24px', borderRadius: 99, textDecoration: 'none', textAlign: 'center', boxShadow: '0 4px 24px rgba(200,230,0,0.35)' }}>
            Get started free — 3 applications on us
          </a>
        </div>
      )}
    </main>
  );
}
