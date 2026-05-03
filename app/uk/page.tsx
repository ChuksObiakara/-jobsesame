'use client';
import { useEffect, useRef, useState } from 'react';
import { useAuth, UserButton } from '@clerk/nextjs';
import MarketSwitcher from '../components/MarketSwitcher';

interface UKJob {
  id: string; title: string; company: string; location: string;
  salary: string; source: string; tags: string[]; postedAt: string;
}

const TESTIMONIALS = [
  { name: 'Priya S.', role: 'Software Engineer', location: 'Lagos → London', photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=64&h=64&fit=crop&crop=face', quote: 'I applied to 40 UK jobs in one afternoon. Jobsesame rewrote my CV for every single one. Got 3 interviews in the first week.', stat: '3 interviews', statLabel: 'first week' },
  { name: 'Tariq M.', role: 'Data Analyst', location: 'Johannesburg → Manchester', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face', quote: 'My ATS score went from 38% to 91% after the AI rewrote my CV. I had no idea how many keywords I was missing.', stat: '38% → 91%', statLabel: 'ATS score' },
  { name: 'Amara O.', role: 'Product Manager', location: 'Nairobi → Birmingham', photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=64&h=64&fit=crop&crop=face', quote: 'The salary intelligence tool alone was worth it. I negotiated £12k more than my original offer because I knew the market rate.', stat: '+£12,000', statLabel: 'salary negotiated' },
];

const FEATURES = [
  { icon: '🤖', title: 'AI CV rewriter', desc: 'Rewrites your CV for each specific UK job in 30 seconds — right keywords, right structure, right tone for British employers.', tag: 'Core feature' },
  { icon: '⚡', title: 'One-click apply', desc: 'We submit your application directly to UK employers — including Greenhouse-powered companies — with zero form-filling.', tag: 'Saves hours' },
  { icon: '🎯', title: 'ATS optimisation', desc: 'British companies use ATS software to filter 80% of CVs automatically. We make sure yours gets through every filter.', tag: 'Critical' },
  { icon: '💷', title: 'UK salary intelligence', desc: 'Live salary benchmarks for every UK role so you know exactly what to ask for in your offer conversation.', tag: 'New' },
  { icon: '📊', title: 'Application tracker', desc: 'Every application, every status, every follow-up — all tracked in one clean dashboard.', tag: 'Organised' },
  { icon: '📝', title: 'Cover letter generator', desc: 'AI generates a personalised British-style cover letter for each role. Never write the same letter twice.', tag: 'Included' },
];

const FAQS = [
  { q: 'Do I need a UK visa to use Jobsesame?', a: 'No — you can apply from anywhere. Many UK employers actively recruit internationally and sponsor visas for skilled workers. We surface those roles and handle the application for you.' },
  { q: 'Will UK employers actually respond to international applicants?', a: 'Yes. The UK has a skills shortage in tech, healthcare, finance and engineering. Employers are actively looking for skilled international candidates. The key is having a CV that passes ATS — that\'s exactly what we do.' },
  { q: 'How is this different from LinkedIn or Glassdoor?', a: 'LinkedIn shows you jobs. Jobsesame applies to them for you — with a CV rewritten specifically for each role. We also aggregate from Adzuna, JSearch, and Remotive so you see more jobs in one place.' },
  { q: 'What does the AI actually change in my CV?', a: 'It adds the keywords the employer is looking for, restructures your experience bullets to use British corporate language, and adjusts the profile statement for the specific role. Your facts — companies, dates, titles — are never changed.' },
  { q: 'Is my data GDPR compliant?', a: 'Yes. Jobsesame is GDPR compliant for UK and EU users. Your CV data is processed securely, never sold to third parties, and you can request full deletion at any time.' },
  { q: 'How much does it cost?', a: 'Browsing is free. UK applications are £10 for 20 (pay once) or £21/month for unlimited Pro. Payments are launching very soon — join the waitlist to get an early-bird discount.' },
];

const SALARIES = [
  { role: 'Software Engineer', min: 55, max: 95, icon: '💻' },
  { role: 'Data Scientist', min: 50, max: 85, icon: '📊' },
  { role: 'Product Manager', min: 60, max: 100, icon: '🗺' },
  { role: 'UX Designer', min: 35, max: 65, icon: '🎨' },
  { role: 'Marketing Manager', min: 40, max: 70, icon: '📣' },
  { role: 'Finance Analyst', min: 40, max: 75, icon: '💷' },
  { role: 'Project Manager', min: 45, max: 75, icon: '📋' },
  { role: 'Nurse (NHS)', min: 28, max: 48, icon: '🏥' },
];

export default function UKPage() {
  const { isSignedIn } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [jobs, setJobs] = useState<UKJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [exitIntent, setExitIntent] = useState(false);
  const [exitDismissed, setExitDismissed] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);
  const [signupCount, setSignupCount] = useState(0);
  const [waitEmail, setWaitEmail] = useState('');
  const [waitStatus, setWaitStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const exitReadyRef = useRef(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    fetch('/api/jobs/uk').then(r => r.json())
      .then(d => { setJobs((d.jobs || []).slice(0, 6)); setJobsLoading(false); })
      .catch(() => setJobsLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setNotifVisible(true), 3500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const start = Math.floor(Math.random() * 18) + 22;
    setSignupCount(start);
    const iv = setInterval(() => setSignupCount(c => c + 1), 28000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { exitReadyRef.current = true; }, 4000);
    const onMove = (e: MouseEvent) => {
      if (e.clientY < 5 && exitReadyRef.current && !exitDismissed) {
        setExitIntent(true); exitReadyRef.current = false;
      }
    };
    window.addEventListener('mousemove', onMove);
    return () => { clearTimeout(t); window.removeEventListener('mousemove', onMove); };
  }, [exitDismissed]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  const submitWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitEmail.trim()) return;
    setWaitStatus('loading');
    try {
      await fetch('/api/uk/waitlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: waitEmail.trim(), market: 'GB' }) });
      setWaitStatus('done');
    } catch { setWaitStatus('done'); }
  };

  return (
    <main style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: '#052A14', margin: 0, padding: 0, overflowX: 'hidden' }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floatUp { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes ctaGlow { 0%,100%{box-shadow:0 8px 32px rgba(200,230,0,0.35)} 50%{box-shadow:0 8px 52px rgba(200,230,0,0.65)} }
        @keyframes notifIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes modalIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
        @keyframes shimmer { 0%{opacity:0.4} 50%{opacity:0.7} 100%{opacity:0.4} }
        @keyframes barFill { from{width:0} to{width:var(--w)} }
        .nav-link { transition: color 0.15s; }
        .nav-link:hover { color: #FFFFFF !important; }
        .hov-lift { transition: transform 0.2s, border-color 0.2s; }
        .hov-lift:hover { transform: translateY(-5px); border-color: rgba(200,230,0,0.3) !important; }
        .feat-card { transition: border-color 0.2s, transform 0.2s, background 0.2s; }
        .feat-card:hover { border-color: rgba(200,230,0,0.35) !important; transform: translateY(-4px); background: rgba(200,230,0,0.04) !important; }
        input::placeholder { color: rgba(255,255,255,0.25); }
        input:focus { border-color: rgba(200,230,0,0.4) !important; outline: none; }
      `}</style>

      {/* LIVE SIGNUP NOTIFICATION */}
      {notifVisible && (
        <div style={{ position: 'fixed', bottom: isMobile ? 80 : 28, left: 20, zIndex: 400, animation: 'notifIn 0.4s ease-out', background: 'rgba(5,28,12,0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(200,230,0,0.2)', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, maxWidth: 280, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#C8E600', flexShrink: 0, animation: 'ctaGlow 1.5s ease-in-out infinite' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>
            <strong style={{ color: '#FFFFFF' }}>{signupCount} professionals</strong> joined the UK waitlist today
          </span>
          <button onClick={() => setNotifVisible(false)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.2)', fontSize: 14, cursor: 'pointer', flexShrink: 0, padding: 0, lineHeight: 1 }}>✕</button>
        </div>
      )}

      {/* EXIT INTENT */}
      {exitIntent && !exitDismissed && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#072E16', border: '1.5px solid rgba(200,230,0,0.4)', borderRadius: 22, padding: isMobile ? '32px 24px' : '40px 36px', maxWidth: 440, width: '100%', textAlign: 'center', position: 'relative', animation: 'modalIn 0.25s ease-out' }}>
            <button onClick={() => { setExitIntent(false); setExitDismissed(true); }} style={{ position: 'absolute', top: 14, right: 18, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: 20, cursor: 'pointer' }}>✕</button>
            <div style={{ fontSize: 40, marginBottom: 14 }}>🇬🇧</div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.2, marginBottom: 12 }}>Before you go — your UK job is waiting</h3>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 24 }}>Thousands of UK employers are hiring internationally right now. Sign up free and let AI do the applying while you sleep.</p>
            <a href="/sign-up" onClick={() => setExitDismissed(true)} style={{ display: 'block', background: '#C8E600', color: '#052A14', fontSize: 15, fontWeight: 800, padding: '14px 32px', borderRadius: 99, textDecoration: 'none', marginBottom: 12, animation: 'ctaGlow 2s ease-in-out infinite' }}>
              Start applying free →
            </a>
            <button onClick={() => { setExitIntent(false); setExitDismissed(true); }} style={{ background: 'transparent', border: 'none', fontSize: 12, color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}>
              No thanks, I&apos;ll keep applying manually
            </button>
          </div>
        </div>
      )}

      {/* NAV */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 200, height: 64, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: scrolled ? 'rgba(3,15,7,0.9)' : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none', WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none', borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : 'none', transition: 'all 0.3s' }}>
        <a href="/uk" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}><span style={{ color: '#FFFFFF' }}>job</span><span style={{ color: '#C8E600' }}>sesame</span></span>
          <span style={{ fontSize: 10, background: 'rgba(200,230,0,0.15)', color: '#C8E600', border: '1px solid rgba(200,230,0,0.3)', borderRadius: 99, padding: '2px 8px', fontWeight: 700 }}>🇬🇧 UK</span>
        </a>
        {!isMobile && (
          <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {[['How it works', 'how-it-works'], ['Features', 'features'], ['Jobs', 'jobs'], ['Pricing', 'pricing'], ['FAQ', 'faq']].map(([label, id]) => (
              <button key={id} onClick={() => scrollTo(id)} className="nav-link" style={{ background: 'transparent', border: 'none', fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500, padding: '8px 14px', borderRadius: 8, cursor: 'pointer' }}>{label}</button>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <MarketSwitcher compact={isMobile} />
          {!isMobile && !isSignedIn && <a href="/sign-in" className="nav-link" style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 500, textDecoration: 'none', padding: '8px 12px' }}>Sign in</a>}
          {!isMobile && isSignedIn && <a href="/uk/dashboard" style={{ fontSize: 13, color: '#C8E600', fontWeight: 700, textDecoration: 'none', padding: '8px 16px', background: 'rgba(200,230,0,0.1)', borderRadius: 99, border: '1px solid rgba(200,230,0,0.3)' }}>UK Dashboard</a>}
          {isSignedIn ? <UserButton afterSignOutUrl="/uk" /> : <a href="/sign-up" style={{ background: '#C8E600', color: '#052A14', fontSize: 13, fontWeight: 800, padding: '9px 22px', borderRadius: 99, textDecoration: 'none', whiteSpace: 'nowrap', boxShadow: '0 2px 16px rgba(200,230,0,0.3)' }}>Get started free</a>}
          {isMobile && <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'transparent', border: 'none', color: '#C8E600', fontSize: 22, cursor: 'pointer', padding: 4, lineHeight: 1 }}>{menuOpen ? '✕' : '☰'}</button>}
        </div>
      </nav>

      {/* MOBILE MENU */}
      {isMobile && menuOpen && (
        <div style={{ position: 'fixed', top: 64, left: 0, right: 0, background: 'rgba(3,15,7,0.97)', backdropFilter: 'blur(20px)', zIndex: 199, borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px 24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[['How it works', 'how-it-works'], ['Features', 'features'], ['Jobs', 'jobs'], ['Pricing', 'pricing'], ['FAQ', 'faq']].map(([label, id]) => (
            <button key={id} onClick={() => scrollTo(id)} style={{ background: 'transparent', border: 'none', fontSize: 16, color: 'rgba(255,255,255,0.75)', fontWeight: 600, textAlign: 'left', cursor: 'pointer', padding: '4px 0' }}>{label}</button>
          ))}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
          {isSignedIn
            ? <a href="/uk/dashboard" onClick={() => setMenuOpen(false)} style={{ fontSize: 16, color: '#C8E600', fontWeight: 700, textDecoration: 'none' }}>UK Dashboard →</a>
            : <a href="/sign-up" onClick={() => setMenuOpen(false)} style={{ background: '#C8E600', color: '#052A14', fontSize: 15, fontWeight: 800, padding: '14px 24px', borderRadius: 99, textDecoration: 'none', textAlign: 'center' }}>Get started free</a>}
        </div>
      )}

      {/* HERO */}
      <section style={{ padding: isMobile ? '64px 24px 56px' : '96px 28px 80px', textAlign: 'center', maxWidth: 860, margin: '0 auto', animation: 'fadeInUp 0.6s ease-out' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(200,230,0,0.1)', border: '1px solid rgba(200,230,0,0.25)', borderRadius: 99, padding: '6px 18px', marginBottom: 32 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C8E600', display: 'inline-block', animation: 'ctaGlow 1.5s ease-in-out infinite' }} />
          <span style={{ fontSize: 12, color: '#C8E600', fontWeight: 700, letterSpacing: 0.5 }}>500+ UK jobs updated every 30 minutes</span>
        </div>

        <h1 style={{ fontSize: isMobile ? 36 : 60, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.05, marginBottom: 22, letterSpacing: -1.5 }}>
          Get Hired in the UK —<br />
          <span style={{ color: '#C8E600' }}>AI Applies For You</span>
        </h1>
        <p style={{ fontSize: isMobile ? 16 : 20, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, maxWidth: 600, margin: '0 auto 40px' }}>
          Upload your CV once. Our AI rewrites it for every UK job in 30 seconds and submits your application automatically — while you sleep.
        </p>

        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 52 }}>
          <a href="/sign-up" style={{ background: '#C8E600', color: '#052A14', fontSize: 16, fontWeight: 800, padding: '16px 36px', borderRadius: 99, textDecoration: 'none', animation: 'ctaGlow 2.5s ease-in-out infinite', whiteSpace: 'nowrap' }}>
            Start applying free →
          </a>
          <button onClick={() => scrollTo('how-it-works')} style={{ background: 'rgba(255,255,255,0.06)', color: '#FFFFFF', fontSize: 16, fontWeight: 600, padding: '16px 32px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            See how it works
          </button>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'flex', gap: isMobile ? 24 : 52, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[['500+', 'Live UK jobs'], ['30s', 'CV rewrite time'], ['8 / 10', 'ATS pass rate'], ['£0', 'to get started']].map(([n, l]) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: isMobile ? 24 : 32, fontWeight: 800, color: '#C8E600', lineHeight: 1 }}>{n}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 5 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ATS PROBLEM SECTION */}
      <section style={{ padding: isMobile ? '48px 24px' : '72px 28px', background: 'rgba(0,0,0,0.25)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 60, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, color: '#FF6B6B', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>The UK hiring reality</div>
            <h2 style={{ fontSize: isMobile ? 26 : 38, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.15, marginBottom: 18, letterSpacing: -0.5 }}>
              <span style={{ color: '#FF6B6B' }}>8 out of 10 CVs</span> are rejected before a human reads them
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 24 }}>
              UK employers use ATS (Applicant Tracking Systems) to automatically filter CVs by keywords. If your CV doesn&apos;t match the exact terms the employer is looking for, you&apos;re invisible — even if you&apos;re the perfect candidate.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[['❌', 'You apply with a generic CV'], ['❌', 'ATS rejects it — no human ever sees it'], ['❌', 'You never hear back'], ['✅', 'Jobsesame rewrites your CV for each job'], ['✅', 'ATS score jumps to 90%+'], ['✅', 'Humans read it. Interviews happen.']].map(([icon, text], i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: i < 3 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.75)', textDecoration: i < 3 ? 'line-through' : 'none' }}>
                  <span style={{ flexShrink: 0 }}>{icon}</span>{text}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '28px 24px' }}>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>ATS score comparison — same candidate, same job</div>
              {[['Without Jobsesame', 34, '#FF6B6B'], ['With Jobsesame', 91, '#C8E600']].map(([label, pct, color]) => (
                <div key={label as string} style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{label}</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: color as string }}>{pct}%</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 99, height: 10, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color as string, borderRadius: 99, transition: 'width 1.5s ease-out' }} />
                  </div>
                </div>
              ))}
              <div style={{ background: 'rgba(200,230,0,0.08)', border: '1px solid rgba(200,230,0,0.2)', borderRadius: 12, padding: '12px 16px', marginTop: 8 }}>
                <span style={{ fontSize: 13, color: '#C8E600', fontWeight: 700 }}>Result: 2.7× more interviews</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ padding: isMobile ? '64px 24px' : '88px 28px', maxWidth: 960, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{ fontSize: 10, color: '#C8E600', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>Simple process</div>
          <h2 style={{ fontSize: isMobile ? 28 : 40, fontWeight: 800, color: '#FFFFFF', letterSpacing: -0.5 }}>Land a UK job in 3 steps</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 20 }}>
          {[
            { n: '1', icon: '📄', title: 'Upload your CV once', body: 'Paste or upload your existing CV. Our AI reads your experience, skills and title to understand you.' },
            { n: '2', icon: '🤖', title: 'AI matches and rewrites', body: 'We scan hundreds of live UK jobs, find your best matches, and rewrite your CV for each one in 30 seconds.' },
            { n: '3', icon: '⚡', title: 'We submit for you', body: 'One click and your tailored CV and cover letter are submitted directly to the employer — no form-filling.' },
          ].map(step => (
            <div key={step.n} className="hov-lift" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '30px 26px', position: 'relative' }}>
              <div style={{ width: 32, height: 32, background: '#C8E600', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#052A14', marginBottom: 16 }}>{step.n}</div>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{step.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', marginBottom: 10 }}>{step.title}</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, margin: 0 }}>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: isMobile ? '56px 24px' : '80px 28px', maxWidth: 960, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 10, color: '#C8E600', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>Everything included</div>
          <h2 style={{ fontSize: isMobile ? 28 : 40, fontWeight: 800, color: '#FFFFFF', letterSpacing: -0.5 }}>Built for the UK job market</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 16 }}>
          {FEATURES.map(f => (
            <div key={f.title} className="feat-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '24px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ fontSize: 28 }}>{f.icon}</span>
                <span style={{ fontSize: 10, color: '#C8E600', background: 'rgba(200,230,0,0.1)', border: '1px solid rgba(200,230,0,0.2)', borderRadius: 99, padding: '3px 8px', fontWeight: 700 }}>{f.tag}</span>
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF', marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: isMobile ? '56px 24px' : '80px 28px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 10, color: '#C8E600', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>Real results</div>
            <h2 style={{ fontSize: isMobile ? 28 : 40, fontWeight: 800, color: '#FFFFFF', letterSpacing: -0.5 }}>They got UK jobs. You can too.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 20 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="hov-lift" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '26px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <img src={t.photo} alt={t.name} width={48} height={48} style={{ borderRadius: '50%', flexShrink: 0, objectFit: 'cover' }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{t.role}</div>
                    <div style={{ fontSize: 11, color: '#C8E600', fontWeight: 600, marginTop: 2 }}>📍 {t.location}</div>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>&ldquo;{t.quote}&rdquo;</p>
                <div style={{ background: 'rgba(200,230,0,0.08)', border: '1px solid rgba(200,230,0,0.18)', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#C8E600' }}>{t.stat}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{t.statLabel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LIVE JOBS PREVIEW */}
      <section id="jobs" style={{ padding: isMobile ? '64px 24px' : '88px 28px', maxWidth: 960, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 10, color: '#C8E600', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>Live now</div>
          <h2 style={{ fontSize: isMobile ? 28 : 40, fontWeight: 800, color: '#FFFFFF', letterSpacing: -0.5 }}>UK jobs available right now</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 10 }}>Refreshed every 30 minutes · Adzuna · JSearch · Remotive</p>
        </div>
        {jobsLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: '22px', minHeight: 120, animation: 'shimmer 1.5s ease-in-out infinite' }}>
                <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 6, height: 15, width: '55%', marginBottom: 10 }} />
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 6, height: 12, width: '35%', marginBottom: 8 }} />
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 6, height: 12, width: '45%' }} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
            {jobs.map(job => (
              <div key={job.id} style={{ position: 'relative', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '20px 22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF', marginBottom: 3 }}>{job.title}</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{job.company}</div>
                    </div>
                    {job.salary && <div style={{ fontSize: 12, color: '#C8E600', fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0 }}>{job.salary}</div>}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 10 }}>📍 {job.location}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {job.tags.slice(0, 2).map(tag => <span key={tag} style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', borderRadius: 99, padding: '3px 8px', fontWeight: 600 }}>{tag}</span>)}
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.03)', borderRadius: 99, padding: '3px 8px' }}>{job.source}</span>
                  </div>
                </div>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(5,42,20,0.92) 100%)', borderRadius: 14, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 16 }}>
                  <a href="/sign-up" style={{ background: '#C8E600', color: '#052A14', fontSize: 12, fontWeight: 800, padding: '8px 22px', borderRadius: 99, textDecoration: 'none', boxShadow: '0 4px 16px rgba(200,230,0,0.3)' }}>⚡ Apply with AI</a>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <a href="/sign-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#C8E600', fontWeight: 700, textDecoration: 'none', background: 'rgba(200,230,0,0.08)', border: '1px solid rgba(200,230,0,0.2)', borderRadius: 99, padding: '10px 24px' }}>
            See all UK jobs + auto-apply →
          </a>
        </div>
      </section>

      {/* SALARY INTELLIGENCE */}
      <section id="salaries" style={{ padding: isMobile ? '56px 24px' : '80px 28px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 44 }}>
            <div style={{ fontSize: 10, color: '#C8E600', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>UK Salary Guide 2025</div>
            <h2 style={{ fontSize: isMobile ? 28 : 40, fontWeight: 800, color: '#FFFFFF', letterSpacing: -0.5 }}>Know your worth before you negotiate</h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', marginTop: 12 }}>London & UK-wide · Based on live Adzuna job postings</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            {SALARIES.map(({ role, min, max, icon }) => (
              <div key={role} className="hov-lift" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20 }}>{icon}</span>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>{role}</span>
                </div>
                <span style={{ fontSize: 14, color: '#C8E600', fontWeight: 800, flexShrink: 0 }}>£{min}k – £{max}k</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: isMobile ? '64px 24px' : '88px 28px', maxWidth: 960, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 10, color: '#C8E600', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>Pricing</div>
          <h2 style={{ fontSize: isMobile ? 28 : 40, fontWeight: 800, color: '#FFFFFF', letterSpacing: -0.5 }}>Affordable. No surprises.</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', marginTop: 12 }}>One UK salary negotiation pays for years of Pro.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 20, alignItems: 'start' }}>
          {[
            { name: 'Free', price: '£0', period: '', tag: null, highlight: false, features: ['Browse all UK jobs', 'Save jobs', 'Basic search', '—', '—'], cta: 'Start browsing free', href: '/sign-up', disabled: false },
            { name: 'Credits', price: '£10', period: 'one-time', tag: 'Best value', highlight: true, features: ['20 UK applications', 'AI CV rewriter', 'Quick Apply', 'Application tracker', 'Cover letter'], cta: 'Coming soon — notify me', href: '#notify', disabled: true },
            { name: 'Pro', price: '£21', period: '/month', tag: null, highlight: false, features: ['Unlimited applications', 'Priority matching', 'UK CV rewriter ∞', 'Cover letter generator', 'Salary intelligence'], cta: 'Coming soon — notify me', href: '#notify', disabled: true },
          ].map(plan => (
            <div key={plan.name} style={{ background: plan.highlight ? 'rgba(200,230,0,0.06)' : 'rgba(255,255,255,0.03)', border: `1.5px solid ${plan.highlight ? 'rgba(200,230,0,0.35)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 20, padding: '28px 24px', position: 'relative' }}>
              {plan.tag && <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: '#C8E600', color: '#052A14', fontSize: 10, fontWeight: 800, padding: '4px 14px', borderRadius: 99, whiteSpace: 'nowrap' }}>{plan.tag}</div>}
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 8 }}>{plan.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
                <span style={{ fontSize: 42, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>{plan.price}</span>
                {plan.period && <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>{plan.period}</span>}
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 20 }} />
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: f === '—' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)' }}>
                    <span style={{ color: f === '—' ? 'rgba(255,255,255,0.15)' : '#C8E600', flexShrink: 0 }}>{f === '—' ? '✕' : '✓'}</span>{f}
                  </li>
                ))}
              </ul>
              {plan.disabled
                ? <button onClick={() => scrollTo('notify')} style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 700, padding: '13px 20px', borderRadius: 99, cursor: 'pointer' }}>{plan.cta}</button>
                : <a href={plan.href} style={{ display: 'block', textAlign: 'center', background: plan.highlight ? '#C8E600' : 'rgba(255,255,255,0.08)', color: plan.highlight ? '#052A14' : 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 800, padding: '13px 20px', borderRadius: 99, textDecoration: 'none' }}>{plan.cta}</a>
              }
            </div>
          ))}
        </div>
      </section>

      {/* NOTIFY ME / WAITLIST */}
      <section id="notify" style={{ padding: isMobile ? '56px 24px' : '80px 28px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', background: 'rgba(200,230,0,0.05)', border: '1.5px solid rgba(200,230,0,0.2)', borderRadius: 24, padding: isMobile ? '36px 24px' : '48px 44px', textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>🔔</div>
          <h2 style={{ fontSize: isMobile ? 24 : 30, fontWeight: 800, color: '#FFFFFF', marginBottom: 12, letterSpacing: -0.5 }}>Get early access + 20% off</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 28 }}>
            UK payments launch very soon. Be first in line and get an exclusive early-bird discount — just drop your email.
          </p>
          {waitStatus === 'done' ? (
            <div style={{ background: 'rgba(200,230,0,0.1)', border: '1px solid rgba(200,230,0,0.3)', borderRadius: 14, padding: '18px 24px', color: '#C8E600', fontSize: 15, fontWeight: 700 }}>
              ✓ You&apos;re on the list! We&apos;ll email you when we launch.
            </div>
          ) : (
            <form onSubmit={submitWaitlist} style={{ display: 'flex', gap: 10, flexDirection: isMobile ? 'column' : 'row' }}>
              <input type="email" value={waitEmail} onChange={e => setWaitEmail(e.target.value)} placeholder="your@email.com" required style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '14px 18px', fontSize: 15, color: '#FFFFFF', fontFamily: 'inherit' }} />
              <button type="submit" disabled={waitStatus === 'loading'} style={{ background: '#C8E600', color: '#052A14', fontSize: 14, fontWeight: 800, padding: '14px 28px', borderRadius: 12, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', opacity: waitStatus === 'loading' ? 0.6 : 1 }}>
                {waitStatus === 'loading' ? 'Saving...' : 'Notify me →'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding: isMobile ? '56px 24px' : '80px 28px', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <div style={{ fontSize: 10, color: '#C8E600', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>FAQ</div>
          <h2 style={{ fontSize: isMobile ? 28 : 40, fontWeight: 800, color: '#FFFFFF', letterSpacing: -0.5 }}>Questions answered</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', background: 'transparent', border: 'none', padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, cursor: 'pointer', textAlign: 'left' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.4 }}>{faq.q}</span>
                <span style={{ fontSize: 18, color: '#C8E600', flexShrink: 0, transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s', lineHeight: 1 }}>+</span>
              </button>
              {openFaq === i && (
                <div style={{ padding: '0 22px 18px', fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75 }}>{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ padding: isMobile ? '56px 24px 72px' : '80px 28px 96px', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: isMobile ? 28 : 44, fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1, marginBottom: 18, letterSpacing: -1 }}>
            Your UK career starts<br /><span style={{ color: '#C8E600' }}>today</span>
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', marginBottom: 32, lineHeight: 1.65 }}>
            No credit card. No commitment. 3 free AI applications to prove it works.
          </p>
          <a href="/sign-up" style={{ display: 'inline-block', background: '#C8E600', color: '#052A14', fontSize: 17, fontWeight: 800, padding: '18px 44px', borderRadius: 99, textDecoration: 'none', animation: 'ctaGlow 2.5s ease-in-out infinite' }}>
            Start applying free →
          </a>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', marginTop: 16 }}>Free forever · No card required · Cancel anytime</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#020804', borderTop: '1px solid rgba(255,255,255,0.04)', padding: isMobile ? '48px 20px 80px' : '64px 28px 32px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr 1fr 1fr 1fr', gap: isMobile ? '32px 24px' : 40, marginBottom: 48 }}>
            <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 16, fontWeight: 800 }}><span style={{ color: '#FFFFFF' }}>job</span><span style={{ color: '#C8E600' }}>sesame</span></span>
                <span style={{ fontSize: 10, background: 'rgba(200,230,0,0.1)', color: '#C8E600', border: '1px solid rgba(200,230,0,0.25)', borderRadius: 99, padding: '2px 7px', fontWeight: 700 }}>🇬🇧 UK</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.18)', lineHeight: 1.8, maxWidth: 220, marginBottom: 6 }}>AI-powered job applications for professionals who refuse to be ignored.</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.1)', marginBottom: 4 }}>Jobsesame · United Kingdom</p>
              <a href="mailto:uk@jobsesame.co.za" style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', textDecoration: 'none' }}>uk@jobsesame.co.za</a>
            </div>
            {[
              { heading: 'Product', links: [{ label: 'UK Jobs', href: '#jobs' }, { label: 'Pricing', href: '#pricing' }, { label: 'Dashboard', href: '/uk/dashboard' }, { label: 'CV Optimiser', href: '/optimise' }] },
              { heading: 'Company', links: [{ label: 'About', href: '/about' }, { label: 'Blog', href: '/blog' }, { label: 'Recruiters', href: '/recruiters' }, { label: 'Contact', href: 'mailto:uk@jobsesame.co.za' }] },
              { heading: 'Legal', links: [{ label: 'Privacy Policy', href: '/privacy' }, { label: 'Terms of Service', href: '/terms' }, { label: 'Refund Policy', href: '/refund' }, { label: 'Delete My Data', href: '/delete-data' }] },
            ].map(col => (
              <div key={col.heading}>
                <div style={{ fontSize: 10, color: '#C8E600', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 16 }}>{col.heading}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {col.links.map(l => <a key={l.label} href={l.href} className="nav-link" style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', textDecoration: 'none' }}>{l.label}</a>)}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 20, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.12)' }}>© 2025 Jobsesame. All rights reserved. GDPR compliant.</span>
            <div style={{ display: 'flex', gap: 20 }}>{['Twitter', 'LinkedIn'].map(s => <span key={s} style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', cursor: 'pointer' }}>{s}</span>)}</div>
          </div>
        </div>
      </footer>

      {/* MOBILE STICKY CTA */}
      {isMobile && !isSignedIn && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 300, background: 'rgba(3,15,7,0.97)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(200,230,0,0.2)', padding: '12px 20px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
          <a href="/sign-up" style={{ display: 'block', background: '#C8E600', color: '#052A14', fontSize: 15, fontWeight: 800, padding: '16px 24px', borderRadius: 99, textDecoration: 'none', textAlign: 'center', boxShadow: '0 4px 24px rgba(200,230,0,0.35)' }}>
            Start applying free — 3 on us
          </a>
        </div>
      )}
    </main>
  );
}
