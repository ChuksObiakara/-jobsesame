'use client';
import { useEffect, useRef, useState } from 'react';
import { useAuth, UserButton } from '@clerk/nextjs';
import MarketSwitcher from './components/MarketSwitcher';

const PHOTOS = [
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=80&h=80&fit=crop&crop=face',
];

export default function Home() {
  const { isSignedIn } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currency, setCurrency] = useState<'ZAR' | 'USD'>('ZAR');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [faqSearch, setFaqSearch] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [demoStage, setDemoStage] = useState<'idle' | 'loading' | 'done'>('idle');
  const [demoAts, setDemoAts] = useState(42);
  const [notifVisible, setNotifVisible] = useState(false);
  const [exitIntent, setExitIntent] = useState(false);
  const [exitDismissed, setExitDismissed] = useState(false);
  const [signupCount, setSignupCount] = useState(0);
  const [cvAnalysisState, setCvAnalysisState] = useState<'idle' | 'uploading' | 'done'>('idle');
  const [cvAnalysisScore, setCvAnalysisScore] = useState(0);
  const [cvAnalysisWeaknesses, setCvAnalysisWeaknesses] = useState<string[]>([]);
  const [cvAnalysisDragOver, setCvAnalysisDragOver] = useState(false);
  const exitReadyRef = useRef(false);

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
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(data => { if (data.country_code !== 'ZA') setCurrency('USD'); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setNotifVisible(true), 2800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { exitReadyRef.current = true; }, 3000);
    const onMove = (e: MouseEvent) => {
      if (e.clientY < 5 && exitReadyRef.current && !exitDismissed) {
        setExitIntent(true);
        exitReadyRef.current = false;
      }
    };
    window.addEventListener('mousemove', onMove);
    return () => { clearTimeout(t); window.removeEventListener('mousemove', onMove); };
  }, [exitDismissed]);

  useEffect(() => {
    const start = Math.floor(Math.random() * 21) + 40;
    setSignupCount(start);
    const iv = setInterval(() => setSignupCount(c => c + 1), 30000);
    return () => clearInterval(iv);
  }, []);

  const handleDemoTransform = () => {
    if (demoStage !== 'idle') { setDemoStage('idle'); setDemoAts(42); return; }
    setDemoStage('loading');
    setTimeout(() => {
      setDemoStage('done');
      let n = 42;
      const iv = setInterval(() => {
        n += 2;
        if (n >= 94) { setDemoAts(94); clearInterval(iv); return; }
        setDemoAts(n);
      }, 25);
    }, 1500);
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  const handleCvAnalysis = async (file: File) => {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) return;
    setCvAnalysisState('uploading');
    try {
      const formData = new FormData();
      formData.append('cv', file);
      const res = await fetch('/api/cv', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        const cv = data.cvData;
        let s = 20;
        const actionVerbs = ['led','managed','delivered','achieved','increased','reduced','built','launched','drove','grew','saved','developed','implemented','improved','created','established'];
        const summaryText = (cv.summary || '').toLowerCase();
        if (cv.summary && cv.summary.length > 100 && actionVerbs.some(v => summaryText.includes(v))) s += 8;
        if ((cv.skills?.length || 0) > 8) s += 8;
        const bulletText = (cv.experience || []).flatMap((e: any) => e.bullets || []).join(' ');
        if (/\d+\s*%|\d+\s*(million|thousand|k\b|\$|£|€|R\d)|\d+\s*(people|users|clients|projects|teams)/i.test(bulletText)) s += 8;
        const jobTitles = (cv.experience || []).map((e: any) => (e.title || '').toLowerCase()).join(' ');
        if (/senior|lead|manager|director|head|principal|chief|vp|vice president/.test(jobTitles)) s += 8;
        const techIndustryKw = ['software','engineering','finance','marketing','sales','operations','product','data','cloud','agile','devops','react','python','java','node','aws','azure','crm','erp','saas'];
        if (techIndustryKw.some(kw => summaryText.includes(kw))) s += 8;
        if (cv.phone && cv.email) s += 5;
        const countryNames = ['south africa','nigeria','kenya','ghana','united kingdom','united states','canada','australia','india'];
        if (cv.location && !countryNames.some(c => cv.location.toLowerCase().includes(c)) && cv.location.length > 2) s += 5;
        if (cv.education && /bachelor|master|phd|diploma|degree|bsc|ba |msc|mba|honours|certificate/i.test(cv.education)) s += 5;
        const score = Math.min(75, s);
        const weaknesses: string[] = [];
        if (!cv.summary || cv.summary.length < 100 || !actionVerbs.some(v => summaryText.includes(v))) weaknesses.push('No impact-driven summary — ATS filters reject CVs without measurable action verbs');
        if ((cv.skills?.length || 0) <= 8) weaknesses.push('Too few skills listed — ATS needs 9+ role-specific keywords to pass filters');
        if (!bulletText || !/\d/.test(bulletText)) weaknesses.push('No measurable achievements — add numbers and percentages to every bullet point');
        if (!cv.education || !/bachelor|master|phd|diploma|degree|bsc|msc|mba|honours/i.test(cv.education)) weaknesses.push('Education section incomplete — ATS systems rank CVs with specific qualifications higher');
        setCvAnalysisScore(score);
        setCvAnalysisWeaknesses(weaknesses.slice(0, 3));
        setCvAnalysisState('done');
      } else {
        setCvAnalysisState('idle');
      }
    } catch {
      setCvAnalysisState('idle');
    }
  };

  const faqs = [
    { q: "Is Jobsesame really free?", a: "Yes — you get 3 free AI CV rewrites and Quick Apply credits with no credit card required. After your free credits you can buy a pack of 10 for R99 or go unlimited with Pro at R249 per month." },
    { q: "How does the AI rewrite my CV?", a: "You upload your CV once. When you click Quick Apply on any job our AI reads the full job description and rewrites your CV in 30 seconds to match exactly what that employer is looking for — adding the right keywords, restructuring your experience, and optimising for ATS systems." },
    { q: "What is an ATS system?", a: "ATS stands for Applicant Tracking System. It is software that most companies use to automatically screen CVs before a human ever sees them. 8 out of 10 CVs are rejected by ATS. Jobsesame rewrites your CV to pass these systems automatically." },
    { q: "Will my real experience and company names be changed?", a: "Never. We only rewrite how your experience is described — not the facts. Your real company names, job titles, dates and qualifications are always preserved. We just make them sound better and add the right keywords." },
    { q: "What jobs does Jobsesame have?", a: "We aggregate jobs from multiple sources worldwide including remote jobs, relocation opportunities to London, Dubai, Toronto and Singapore, teaching jobs in Asia, and local jobs worldwide. New jobs are added daily." },
    { q: "How is Jobsesame different from LinkedIn or Indeed?", a: "LinkedIn and Indeed are job boards — they just show you jobs. Jobsesame is an AI job application assistant. We help you actually get the job by rewriting your CV, applying automatically, and tracking everything. We also show jobs from multiple platforms in one place." },
    { q: "Is my CV data safe?", a: "Yes. Your CV is processed securely and never sold to third parties. We use it only to help you apply for jobs. You can delete your data at any time." },
    { q: "Does Quick Apply actually submit my application?", a: "For jobs that accept direct applications yes — we submit automatically. For jobs on platforms like LinkedIn that require a login we download your rewritten CV and open the employer portal so you can upload it in one click." },
  ];

  const filteredFaqs = faqSearch
    ? faqs.filter(f => f.q.toLowerCase().includes(faqSearch.toLowerCase()) || f.a.toLowerCase().includes(faqSearch.toLowerCase()))
    : faqs;

  const BG = '#061A0C';
  const DIVIDE = '1px solid rgba(255,255,255,0.05)';

  return (
    <main style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: BG, margin: 0, padding: 0, overflowX: 'hidden' }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse      { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.5)} }
        @keyframes fadeInUp   { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes notifIn    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ctaGlow    { 0%,100%{box-shadow:0 4px 24px rgba(200,230,0,0.32)} 50%{box-shadow:0 4px 44px rgba(200,230,0,0.58)} }
        @keyframes spinAI     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes slideRight { from{opacity:0;transform:translateX(12px)} to{opacity:1;transform:translateX(0)} }
        @keyframes modalIn    { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
        @keyframes shimmer    { 0%,100%{opacity:0.3} 50%{opacity:0.55} }
        .nav-link { transition: color 0.15s; }
        .nav-link:hover { color: #FFFFFF !important; }
        .row-feat { border-bottom: 1px solid rgba(255,255,255,0.05); transition: background 0.15s; }
        .row-feat:hover { background: rgba(200,230,0,0.025) !important; }
        .row-feat:last-child { border-bottom: none; }
        input::placeholder { color: rgba(255,255,255,0.22); }
        input:focus { border-color: rgba(200,230,0,0.38) !important; outline: none; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(200,230,0,0.12); border-radius: 2px; }
        @media(max-width:767px) {
          .hide-mobile { display:none !important; }
          .mob-col { flex-direction:column !important; }
        }
      `}</style>

      {/* EXIT INTENT */}
      {exitIntent && !exitDismissed && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.82)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#071E0E', border: '1.5px solid rgba(200,230,0,0.35)', borderRadius: 16, padding: isMobile ? '28px 22px' : '40px 36px', maxWidth: 420, width: '100%', textAlign: 'center', position: 'relative', animation: 'modalIn 0.22s ease-out' }}>
            <button onClick={() => { setExitIntent(false); setExitDismissed(true); }} style={{ position: 'absolute', top: 14, right: 16, background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.25)', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>✕</button>
            <div style={{ width: 44, height: 44, background: 'rgba(200,230,0,0.1)', border: '1px solid rgba(200,230,0,0.22)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, margin: '0 auto 18px' }}>⚡</div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.18, marginBottom: 10 }}>Get 3 free CV rewrites before you go</h3>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.42)', lineHeight: 1.7, marginBottom: 24 }}>No credit card. No commitment. AI rewrites your CV in 30 seconds and gets you more interviews.</p>
            <a href="/sign-up" onClick={() => setExitDismissed(true)} style={{ display: 'block', background: '#C8E600', color: BG, fontSize: 15, fontWeight: 800, padding: '14px 32px', borderRadius: 8, textDecoration: 'none', marginBottom: 10, animation: 'ctaGlow 2s ease-in-out infinite' }}>
              Claim my 3 free rewrites →
            </a>
            <button onClick={() => { setExitIntent(false); setExitDismissed(true); }} style={{ background: 'transparent', border: 'none', fontSize: 12, color: 'rgba(255,255,255,0.18)', cursor: 'pointer' }}>No thanks, I&apos;ll keep struggling</button>
          </div>
        </div>
      )}

      {/* NOTIFICATION */}
      {notifVisible && (
        <div style={{ position: 'fixed', bottom: isMobile ? 88 : 28, left: 16, zIndex: 400, animation: 'notifIn 0.4s ease-out', background: 'rgba(6,18,8,0.97)', backdropFilter: 'blur(18px)', border: '1px solid rgba(74,222,128,0.18)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, maxWidth: 260, boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
          <span style={{ width: 7, height: 7, background: '#4ADE80', borderRadius: '50%', flexShrink: 0, animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)', fontWeight: 600, lineHeight: 1.4 }}>Member just landed 3 interviews this week</span>
          <button onClick={() => setNotifVisible(false)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.18)', fontSize: 13, cursor: 'pointer', flexShrink: 0, padding: 0, lineHeight: 1 }}>✕</button>
        </div>
      )}

      {/* ── NAV ───────────────────────────────────────────────── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 200, height: 64,
        padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: scrolled ? 'rgba(4,12,6,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? DIVIDE : 'none',
        transition: 'all 0.3s', gap: 12,
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>
            <span style={{ color: '#fff' }}>job</span><span style={{ color: '#C8E600' }}>sesame</span>
          </span>
        </a>

        <div className="hide-mobile" style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {[{ label: 'How it works', id: 'how-it-works' }, { label: 'Features', id: 'features' }, { label: 'Pricing', id: 'pricing' }, { label: 'FAQ', id: 'faq' }].map(item => (
            <button key={item.id} onClick={() => scrollTo(item.id)} className="nav-link" style={{ background: 'transparent', border: 'none', fontSize: 13, color: 'rgba(255,255,255,0.52)', fontWeight: 500, padding: '8px 14px', borderRadius: 6, cursor: 'pointer' }}>{item.label}</button>
          ))}
          <a href="/recruiters" className="nav-link" style={{ fontSize: 13, color: 'rgba(255,255,255,0.52)', fontWeight: 500, padding: '8px 14px', textDecoration: 'none' }}>Recruiters</a>
          <a href="/blog" className="nav-link" style={{ fontSize: 13, color: 'rgba(255,255,255,0.52)', fontWeight: 500, padding: '8px 14px', textDecoration: 'none' }}>Blog</a>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <MarketSwitcher compact={isMobile} />
          {!isMobile && !isSignedIn && <a href="/sign-in" className="nav-link" style={{ fontSize: 13, color: 'rgba(255,255,255,0.48)', fontWeight: 500, textDecoration: 'none', padding: '8px 12px' }}>Sign in</a>}
          {!isMobile && isSignedIn && <a href="/dashboard" style={{ fontSize: 13, color: '#C8E600', fontWeight: 700, textDecoration: 'none', padding: '8px 16px', background: 'rgba(200,230,0,0.08)', borderRadius: 8, border: '1px solid rgba(200,230,0,0.22)' }}>Dashboard</a>}
          {isSignedIn
            ? <UserButton afterSignOutUrl="/" />
            : <a href="/sign-up" style={{ background: '#C8E600', color: BG, fontSize: 13, fontWeight: 800, padding: '9px 22px', borderRadius: 8, textDecoration: 'none', whiteSpace: 'nowrap' }}>Get started free</a>
          }
          {isMobile && (
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', fontSize: 22, cursor: 'pointer', padding: 4, lineHeight: 1 }}>
              {menuOpen ? '✕' : '☰'}
            </button>
          )}
        </div>
      </nav>

      {/* MOBILE MENU */}
      {isMobile && menuOpen && (
        <div style={{ position: 'fixed', top: 64, left: 0, right: 0, background: 'rgba(4,12,6,0.98)', backdropFilter: 'blur(20px)', zIndex: 199, borderTop: DIVIDE, padding: '24px 24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[{ label: 'How it works', id: 'how-it-works' }, { label: 'Features', id: 'features' }, { label: 'Pricing', id: 'pricing' }, { label: 'FAQ', id: 'faq' }].map(item => (
            <button key={item.id} onClick={() => scrollTo(item.id)} style={{ background: 'transparent', border: 'none', fontSize: 16, color: 'rgba(255,255,255,0.72)', fontWeight: 600, textAlign: 'left', cursor: 'pointer', padding: '4px 0' }}>{item.label}</button>
          ))}
          <a href="/recruiters" onClick={() => setMenuOpen(false)} style={{ fontSize: 16, color: 'rgba(255,255,255,0.72)', fontWeight: 600, textDecoration: 'none' }}>Recruiters</a>
          <a href="/blog" onClick={() => setMenuOpen(false)} style={{ fontSize: 16, color: 'rgba(255,255,255,0.72)', fontWeight: 600, textDecoration: 'none' }}>Blog</a>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
          {isSignedIn
            ? <a href="/dashboard" onClick={() => setMenuOpen(false)} style={{ fontSize: 16, color: '#C8E600', fontWeight: 700, textDecoration: 'none' }}>Dashboard →</a>
            : <>
              <a href="/sign-in" onClick={() => setMenuOpen(false)} style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', fontWeight: 500, textDecoration: 'none' }}>Sign in</a>
              <a href="/sign-up" onClick={() => setMenuOpen(false)} style={{ background: '#C8E600', color: BG, fontSize: 15, fontWeight: 800, padding: '14px 24px', borderRadius: 8, textDecoration: 'none', textAlign: 'center' }}>Get started — free</a>
            </>
          }
        </div>
      )}

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '80px 22px 72px' : '100px 40px 80px', maxWidth: 1240, margin: '0 auto', animation: 'fadeInUp 0.6s ease-out' }}>
        <div style={{ display: isMobile ? 'flex' : 'grid', gridTemplateColumns: isMobile ? undefined : '1fr 1fr', flexDirection: isMobile ? 'column' : undefined, gap: isMobile ? 52 : 80, alignItems: 'center' }}>

          {/* LEFT */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
              <span style={{ width: 7, height: 7, background: '#FF4444', borderRadius: '50%', animation: 'pulse 1.6s ease-in-out infinite', flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.2 }}>{signupCount} people signed up today</span>
            </div>

            <h1 style={{ fontSize: isMobile ? 'clamp(36px,9vw,44px)' : 'clamp(48px,5vw,68px)', fontWeight: 800, color: '#fff', lineHeight: 1.03, letterSpacing: -2.5, marginBottom: 22 }}>
              Your CV is being<br />
              <span style={{ color: 'rgba(255,100,100,0.75)', textDecoration: 'line-through', textDecorationColor: '#FF6B6B', textDecorationThickness: 3 }}>ignored.</span><br />
              <span style={{ color: '#C8E600' }}>We fix that.</span>
            </h1>

            <p style={{ fontSize: isMobile ? 16 : 18, color: 'rgba(255,255,255,0.48)', lineHeight: 1.75, marginBottom: 32, maxWidth: 480 }}>
              8 out of 10 CVs never reach a human. Our AI rewrites yours for every job in 30 seconds — so yours always gets through.
            </p>

            {/* Avatars + count */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
              <div style={{ display: 'flex' }}>
                {PHOTOS.map((src, i) => (
                  <img key={i} src={src} loading="lazy" width={34} height={34} alt=""
                    style={{ borderRadius: '50%', border: `2.5px solid ${BG}`, marginLeft: i === 0 ? 0 : -9, zIndex: 6 - i, position: 'relative', objectFit: 'cover', background: '#1A4A2A' }} />
                ))}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>+2,400</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.32)' }}>joined this week</div>
              </div>
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 32 }}>
              <a href="/sign-up" style={{ background: '#C8E600', color: BG, fontSize: isMobile ? 14 : 15, fontWeight: 800, padding: isMobile ? '15px 28px' : '16px 36px', borderRadius: 8, textDecoration: 'none', display: 'inline-block', animation: 'ctaGlow 2.5s ease-in-out infinite', whiteSpace: 'nowrap' }}>
                Start free — no card needed →
              </a>
              <button onClick={() => scrollTo('cv-check')} style={{ background: 'transparent', color: 'rgba(255,255,255,0.62)', fontSize: isMobile ? 14 : 15, fontWeight: 600, padding: isMobile ? '15px 20px' : '16px 24px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Check my CV score →
              </button>
            </div>

            {/* Stats inline */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 28px', paddingTop: 24, borderTop: DIVIDE }}>
              {[['30s', 'CV rewrite'], ['90%+', 'ATS pass rate'], ['3 free', 'applications'], ['495k+', 'live jobs']].map(([n, l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: isMobile ? 19 : 23, fontWeight: 800, color: '#C8E600', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{n}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — CV transform visual */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, position: 'relative' }}>
            <div style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: isMobile ? 20 : 24, width: '100%', maxWidth: 400, boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 18 }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(200,230,0,0.08)', border: '1px solid rgba(200,230,0,0.18)', borderRadius: 6, padding: '4px 12px' }}>
                  <span style={{ width: 5, height: 5, background: '#C8E600', borderRadius: '50%', animation: 'pulse 1.5s infinite' }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#C8E600', letterSpacing: '0.8px' }}>AI TRANSFORMING</span>
                </div>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 28px 1fr', gap: 8, alignItems: 'start' }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#FF6B6B', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>Before</div>
                  {['Responsible for managing team', 'Worked on various projects', 'Helped with strategy'].map(t => (
                    <div key={t} style={{ background: 'rgba(255,80,80,0.06)', border: '1px solid rgba(255,80,80,0.1)', borderRadius: 6, padding: '6px 8px', fontSize: 10, color: 'rgba(255,255,255,0.32)', lineHeight: 1.4, marginBottom: 5, display: 'flex', gap: 5 }}>
                      <span style={{ color: '#FF6B6B', flexShrink: 0 }}>✕</span><span>{t}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,80,80,0.07)', border: '1px solid rgba(255,80,80,0.14)', borderRadius: 6, padding: '5px 8px' }}>
                    <span style={{ fontSize: 9, color: 'rgba(255,107,107,0.65)', fontWeight: 600 }}>ATS Score</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#FF6B6B', fontVariantNumeric: 'tabular-nums' }}>42%</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 18, gap: 4 }}>
                  <div style={{ width: 22, height: 22, background: 'linear-gradient(135deg,#C8E600,#88AA00)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, boxShadow: '0 0 10px rgba(200,230,0,0.38)' }}>✦</div>
                  <div style={{ width: 1, height: 32, background: 'linear-gradient(to bottom,rgba(200,230,0,0.3),transparent)' }} />
                </div>

                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#4ADE80', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>After</div>
                  {['Led 12-person team, +40% efficiency', '5 projects on time, 15% under budget', 'Strategy driving $2.4M new revenue'].map(t => (
                    <div key={t} style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.1)', borderRadius: 6, padding: '6px 8px', fontSize: 10, color: 'rgba(255,255,255,0.68)', lineHeight: 1.4, marginBottom: 5, display: 'flex', gap: 5 }}>
                      <span style={{ color: '#4ADE80', flexShrink: 0 }}>✓</span><span>{t}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(200,230,0,0.06)', border: '1px solid rgba(200,230,0,0.14)', borderRadius: 6, padding: '5px 8px' }}>
                    <span style={{ fontSize: 9, color: 'rgba(200,230,0,0.55)', fontWeight: 600 }}>ATS Score</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#C8E600', fontVariantNumeric: 'tabular-nums' }}>94%</span>
                  </div>
                </div>
              </div>

              <a href="/sign-up" style={{ display: 'block', marginTop: 16, background: '#C8E600', color: BG, fontSize: 13, fontWeight: 800, padding: '12px', borderRadius: 8, textDecoration: 'none', textAlign: 'center' }}>
                Try it free now →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── NUMBERS BAR ─────────────────────────────────────── */}
      <div style={{ borderTop: DIVIDE, borderBottom: DIVIDE, padding: '28px 40px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: isMobile ? '20px 16px' : 0 }}>
          {[
            { n: '495k+', l: 'Live jobs worldwide' },
            { n: '50+',   l: 'Countries covered' },
            { n: '90%+',  l: 'ATS pass rate' },
            { n: '11 days', l: 'Avg. time to first interview' },
          ].map(({ n, l }, i) => (
            <div key={l} style={{ textAlign: 'center', padding: isMobile ? 0 : '0 32px', borderRight: !isMobile && i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <div style={{ fontSize: isMobile ? 28 : 36, fontWeight: 800, color: '#C8E600', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{n}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── THE PROBLEM ─────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '72px 22px' : '96px 40px', maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ display: isMobile ? 'block' : 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>
          <div style={{ marginBottom: isMobile ? 40 : 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,80,80,0.65)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 18 }}>Why you&apos;re not hearing back</p>
            <h2 style={{ fontSize: isMobile ? 30 : 46, fontWeight: 800, color: '#fff', lineHeight: 1.06, letterSpacing: -1.5, marginBottom: 22 }}>
              The job market<br />is <span style={{ color: '#FF6B6B' }}>filtering you out</span><br />before they even<br />read your name.
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', lineHeight: 1.78, maxWidth: 480 }}>
              It is not your qualifications. It is not your experience. ATS software is automatically rejecting 8 out of 10 CVs before any human sees them. One wrong keyword and you disappear from the entire process.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderTop: DIVIDE }}>
            {[
              { stat: '80%', label: 'CVs auto-rejected before a human reads them', color: '#FF6B6B' },
              { stat: '6 mo', label: 'Average job hunt without the right tools', color: '#FFAA44' },
              { stat: '2%',  label: 'Average CV-to-interview rate without AI', color: '#FFD700' },
              { stat: '11×', label: 'More interviews with an AI-optimised CV', color: '#C8E600' },
            ].map(({ stat, label, color }) => (
              <div key={stat} style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '24px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: isMobile ? 34 : 44, fontWeight: 800, color, lineHeight: 1, minWidth: isMobile ? 80 : 100, fontVariantNumeric: 'tabular-nums' }}>{stat}</span>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.55 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FREE CV ANALYSIS (moved up for conversion) ──────── */}
      <section id="cv-check" style={{ padding: isMobile ? '72px 22px' : '96px 40px', borderTop: DIVIDE, borderBottom: DIVIDE }}>
        <div style={{ maxWidth: 780, margin: '0 auto' }}>
          <div style={{ marginBottom: 44 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(200,230,0,0.6)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>Free — no signup required</p>
            <h2 style={{ fontSize: isMobile ? 28 : 44, fontWeight: 800, color: '#fff', lineHeight: 1.08, letterSpacing: -1.2, marginBottom: 14 }}>
              See your ATS score<br />in 15 seconds
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.38)', maxWidth: 460 }}>
              Drop your CV below. AI analyses it instantly and shows you exactly why recruiters aren&apos;t calling back.
            </p>
          </div>

          {cvAnalysisState === 'idle' && (
            <div
              onDrop={e => { e.preventDefault(); setCvAnalysisDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleCvAnalysis(f); }}
              onDragOver={e => { e.preventDefault(); setCvAnalysisDragOver(true); }}
              onDragLeave={() => setCvAnalysisDragOver(false)}
              style={{ border: `2px dashed ${cvAnalysisDragOver ? '#C8E600' : 'rgba(200,230,0,0.28)'}`, borderRadius: 12, padding: isMobile ? '44px 22px' : '52px 32px', textAlign: 'center', background: cvAnalysisDragOver ? 'rgba(200,230,0,0.03)' : 'transparent', transition: 'all 0.2s', cursor: 'pointer' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>Drop your CV here</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginBottom: 22 }}>PDF format · analysed instantly · never stored</div>
              <label style={{ cursor: 'pointer' }}>
                <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleCvAnalysis(f); }} />
                <span style={{ background: '#C8E600', color: BG, fontSize: 13, fontWeight: 800, padding: '12px 28px', borderRadius: 8, display: 'inline-block' }}>Choose PDF</span>
              </label>
            </div>
          )}

          {cvAnalysisState === 'uploading' && (
            <div style={{ textAlign: 'center', padding: '52px 28px', border: '1px solid rgba(200,230,0,0.18)', borderRadius: 12 }}>
              <div style={{ width: 44, height: 44, border: '3px solid rgba(200,230,0,0.18)', borderTop: '3px solid #C8E600', borderRadius: '50%', animation: 'spinAI 0.8s linear infinite', margin: '0 auto 16px' }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Reading your CV...</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Analysing skills, experience and ATS compatibility</div>
            </div>
          )}

          {cvAnalysisState === 'done' && (
            <div style={{ border: '1.5px solid rgba(200,230,0,0.18)', borderRadius: 12, padding: isMobile ? '26px 20px' : '36px 40px' }}>
              <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 28 }}>
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ position: 'relative', width: 108, height: 108, margin: '0 auto 10px' }}>
                    <svg width="108" height="108" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="54" cy="54" r="43" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
                      <circle cx="54" cy="54" r="43" fill="none"
                        stroke={cvAnalysisScore >= 75 ? '#22C55E' : cvAnalysisScore >= 60 ? '#F59E0B' : '#EF4444'}
                        strokeWidth="9" strokeDasharray={`${2 * Math.PI * 43}`}
                        strokeDashoffset={`${2 * Math.PI * 43 * (1 - cvAnalysisScore / 100)}`}
                        strokeLinecap="round" />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                      <span style={{ fontSize: 26, fontWeight: 900, color: cvAnalysisScore >= 75 ? '#22C55E' : cvAnalysisScore >= 60 ? '#F59E0B' : '#EF4444', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{cvAnalysisScore}%</span>
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', marginTop: 3 }}>ATS score</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: cvAnalysisScore >= 75 ? '#22C55E' : cvAnalysisScore >= 60 ? '#F59E0B' : '#EF4444' }}>
                    {cvAnalysisScore >= 75 ? 'Performing well' : cvAnalysisScore >= 60 ? 'Needs work' : 'Failing screening'}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 14, lineHeight: 1.4 }}>
                    {cvAnalysisScore >= 75 ? 'Solid CV — AI tailoring can push every application above 90%.' : 'Most employers will never see your CV. Here is exactly why:'}
                  </div>
                  {cvAnalysisWeaknesses.map((w, i) => (
                    <div key={i} style={{ borderLeft: '3px solid #EF4444', padding: '9px 0 9px 14px', marginBottom: 10, fontSize: 13, color: 'rgba(255,160,160,0.9)', lineHeight: 1.5 }}>
                      {w}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
                <div style={{ borderLeft: '3px solid #EF4444', padding: '14px 0 14px 16px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,100,100,0.7)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>Your CV now</div>
                  {['Generic language, no metrics', 'Missing key ATS keywords', 'Recruiters skip past it'].map((t, i) => (
                    <div key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.32)', marginBottom: 5 }}>— {t}</div>
                  ))}
                </div>
                <div style={{ borderLeft: '3px solid #C8E600', padding: '14px 0 14px 16px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(200,230,0,0.7)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 10 }}>After Jobsesame</div>
                  {['Impact metrics on every bullet', '90%+ ATS pass rate', 'Recruiters call you back'].map((t, i) => (
                    <div key={i} style={{ fontSize: 12, color: 'rgba(200,230,0,0.75)', marginBottom: 5 }}>+ {t}</div>
                  ))}
                </div>
              </div>
              <a href="/sign-up" style={{ display: 'block', background: '#C8E600', color: BG, fontSize: 15, fontWeight: 900, padding: '15px 0', borderRadius: 8, textDecoration: 'none', textAlign: 'center', animation: 'ctaGlow 2.5s ease-in-out infinite' }}>
                Fix all issues with AI — free →
              </a>
              <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.18)', marginTop: 10 }}>No credit card · 30 seconds</div>
            </div>
          )}
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: isMobile ? '72px 22px' : '96px 40px', maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ display: isMobile ? 'block' : 'grid', gridTemplateColumns: '380px 1fr', gap: 80, alignItems: 'start' }}>
          <div style={{ marginBottom: isMobile ? 40 : 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(200,230,0,0.6)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 18 }}>How it works</p>
            <h2 style={{ fontSize: isMobile ? 30 : 44, fontWeight: 800, color: '#fff', lineHeight: 1.08, letterSpacing: -1.2, marginBottom: 20 }}>
              One upload.<br />Infinite<br />opportunities.
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.38)', lineHeight: 1.75, marginBottom: 28 }}>Upload your CV once and let AI handle every application from that point forward.</p>
            <a href="/sign-up" style={{ display: 'inline-block', background: '#C8E600', color: BG, fontSize: 13, fontWeight: 800, padding: '12px 24px', borderRadius: 8, textDecoration: 'none' }}>Start free →</a>
          </div>

          <div style={{ borderTop: DIVIDE }}>
            {[
              { n: '01', title: 'Upload your CV once', body: 'Drop in your existing PDF. AI reads everything in seconds — your experience, skills, and achievements. You never have to do this again.' },
              { n: '02', title: 'AI analyses and matches', body: 'When you find a job you want, AI reads the full description and rewrites your CV in 30 seconds to match exactly what that employer needs.' },
              { n: '03', title: 'Apply in one click', body: 'Your tailored CV and a personalised cover letter go directly to the employer. No forms. No copy-paste. No wasted evenings.' },
              { n: '04', title: 'Track and follow up', body: 'Every application, status update, and follow-up reminder in one clean dashboard. Know exactly where you stand at all times.' },
            ].map(step => (
              <div key={step.n} style={{ display: 'grid', gridTemplateColumns: '56px 1fr', gap: 20, padding: '28px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', alignItems: 'start' }}>
                <span style={{ fontSize: isMobile ? 36 : 44, fontWeight: 800, color: 'rgba(200,230,0,0.15)', lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: -2 }}>{step.n}</span>
                <div>
                  <div style={{ fontSize: isMobile ? 15 : 17, fontWeight: 800, color: '#fff', marginBottom: 8, letterSpacing: -0.3 }}>{step.title}</div>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', lineHeight: 1.72 }}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section id="features" style={{ padding: isMobile ? '72px 22px' : '96px 40px', borderTop: DIVIDE, borderBottom: DIVIDE }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ display: isMobile ? 'block' : 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: isMobile ? 36 : 52, gap: 24 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(200,230,0,0.6)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>What you get</p>
              <h2 style={{ fontSize: isMobile ? 28 : 44, fontWeight: 800, color: '#fff', lineHeight: 1.06, letterSpacing: -1.2 }}>
                Everything you need<br />to get hired faster
              </h2>
            </div>
            <a href="/sign-up" style={{ display: 'inline-block', flexShrink: 0, background: 'rgba(200,230,0,0.1)', color: '#C8E600', fontSize: 13, fontWeight: 700, padding: '10px 20px', borderRadius: 8, textDecoration: 'none', border: '1px solid rgba(200,230,0,0.2)', marginTop: isMobile ? 20 : 0 }}>
              See all features →
            </a>
          </div>

          <div style={{ borderTop: DIVIDE }}>
            {[
              { n: '01', title: 'AI CV tailoring per job',       body: 'Your CV rewritten for every application in 30 seconds — keywords, tone, and structure matched to the exact role.' },
              { n: '02', title: 'ATS score optimisation',        body: 'Pass automated screening every time. Our AI knows exactly what filters look for and makes sure you clear them.' },
              { n: '03', title: '495,000+ live jobs',            body: 'Every job in one place from 50+ sources. Remote, relocation, teaching, tech, finance, healthcare and more.' },
              { n: '04', title: 'Quick Apply',                   body: 'Apply to any job in under 10 seconds. AI writes the CV, the cover letter, and submits — you just click once.' },
              { n: '05', title: 'Match scoring',                 body: 'See exactly how your CV fits each role before applying. Fix the gaps before the employer sees your name.' },
              { n: '06', title: 'Application tracker',           body: 'Track every application in one dashboard. Know what stage you are at, what to follow up, and what is next.' },
            ].map(f => (
              <div key={f.n} className="row-feat" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '56px 260px 1fr', gap: isMobile ? 6 : 40, padding: isMobile ? '22px 0' : '26px 0', alignItems: 'start' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(200,230,0,0.35)', fontVariantNumeric: 'tabular-nums', paddingTop: 3 }}>{f.n}</span>
                <span style={{ fontSize: isMobile ? 15 : 16, fontWeight: 800, color: '#fff', letterSpacing: -0.2 }}>{f.title}</span>
                <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.38)', lineHeight: 1.72 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE DEMO ─────────────────────────────────── */}
      <section id="demo" style={{ padding: isMobile ? '72px 22px' : '96px 40px', maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ display: isMobile ? 'block' : 'grid', gridTemplateColumns: '380px 1fr', gap: 72, alignItems: 'start' }}>
          <div style={{ marginBottom: isMobile ? 36 : 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(200,230,0,0.6)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 18 }}>Live demo</p>
            <h2 style={{ fontSize: isMobile ? 28 : 42, fontWeight: 800, color: '#fff', lineHeight: 1.08, letterSpacing: -1.2, marginBottom: 16 }}>
              Watch AI rewrite a CV in real time
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.38)', lineHeight: 1.75 }}>See the transformation from generic language to recruiter-ready copy that passes every ATS filter.</p>
          </div>

          <div>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ padding: '12px 20px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 8 }}>
                {['#FF5F57', '#FFBD2E', '#28CA41'].map(c => <div key={c} style={{ width: 10, height: 10, background: c, borderRadius: '50%' }} />)}
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginLeft: 8 }}>CV Optimiser — AI Transform</span>
              </div>

              <div style={{ display: isMobile ? 'flex' : 'grid', gridTemplateColumns: isMobile ? undefined : '1fr 100px 1fr', flexDirection: isMobile ? 'column' : undefined }}>
                <div style={{ padding: '24px 20px', opacity: demoStage === 'loading' ? 0 : 1, transition: 'opacity 0.3s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Original CV</span>
                    <div style={{ background: 'rgba(255,100,100,0.1)', border: '1px solid rgba(255,100,100,0.18)', borderRadius: 4, padding: '3px 9px', fontSize: 11, fontWeight: 700, color: '#FF6B6B' }}>ATS: 42%</div>
                  </div>
                  {['Responsible for managing team', 'Worked on various projects', 'Helped with strategy'].map((t, i) => (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,80,80,0.1)', borderRadius: 6, padding: '9px 12px', fontSize: 12, color: 'rgba(255,255,255,0.28)', lineHeight: 1.5, marginBottom: 7 }}>
                      <span style={{ color: '#FF6B6B', marginRight: 8 }}>✕</span>{t}
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', padding: isMobile ? '14px 20px' : '24px 10px', borderLeft: isMobile ? 'none' : '1px solid rgba(255,255,255,0.04)', borderRight: isMobile ? 'none' : '1px solid rgba(255,255,255,0.04)', gap: 8 }}>
                  {demoStage === 'loading' ? (
                    <div style={{ width: 30, height: 30, border: '3px solid rgba(200,230,0,0.18)', borderTop: '3px solid #C8E600', borderRadius: '50%', animation: 'spinAI 0.8s linear infinite' }} />
                  ) : (
                    <>
                      <button onClick={handleDemoTransform} style={{ background: demoStage === 'done' ? 'rgba(74,222,128,0.08)' : '#C8E600', color: demoStage === 'done' ? '#4ADE80' : BG, border: demoStage === 'done' ? '1px solid rgba(74,222,128,0.25)' : 'none', fontSize: 12, fontWeight: 800, padding: '10px 14px', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {demoStage === 'done' ? '✓ Done' : 'Transform →'}
                      </button>
                      {demoStage === 'done' && <button onClick={() => { setDemoStage('idle'); setDemoAts(42); }} style={{ background: 'transparent', border: 'none', fontSize: 10, color: 'rgba(255,255,255,0.18)', cursor: 'pointer' }}>Reset</button>}
                    </>
                  )}
                </div>

                <div style={{ padding: '24px 20px', opacity: demoStage === 'done' ? 1 : 0.2, animation: demoStage === 'done' ? 'slideRight 0.4s ease-out' : 'none', transition: 'opacity 0.4s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: demoStage === 'done' ? 'rgba(200,230,0,0.65)' : 'rgba(255,255,255,0.15)', letterSpacing: '1.5px', textTransform: 'uppercase', transition: 'color 0.4s' }}>AI-optimised</span>
                    <div style={{ background: demoStage === 'done' ? 'rgba(200,230,0,0.07)' : 'rgba(255,255,255,0.03)', border: `1px solid ${demoStage === 'done' ? 'rgba(200,230,0,0.18)' : 'rgba(255,255,255,0.05)'}`, borderRadius: 4, padding: '3px 9px', fontSize: 11, fontWeight: 700, color: demoStage === 'done' ? '#C8E600' : 'rgba(255,255,255,0.15)', transition: 'all 0.4s' }}>
                      ATS: {demoStage === 'done' ? `${demoAts}%` : '—'}
                    </div>
                  </div>
                  {['Led cross-functional team of 12 driving 40% efficiency gains', 'Delivered 5 enterprise projects on time and 15% under budget', 'Architected go-to-market strategy generating $2.4M revenue'].map((t, i) => (
                    <div key={i} style={{ background: demoStage === 'done' ? 'rgba(200,230,0,0.03)' : 'rgba(255,255,255,0.01)', border: `1px solid ${demoStage === 'done' ? 'rgba(200,230,0,0.1)' : 'rgba(255,255,255,0.04)'}`, borderRadius: 6, padding: '9px 12px', fontSize: 12, color: demoStage === 'done' ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.1)', lineHeight: 1.5, marginBottom: 7, transition: `all 0.4s ${i * 0.08}s` }}>
                      <span style={{ color: demoStage === 'done' ? '#C8E600' : 'rgba(255,255,255,0.1)', marginRight: 8, transition: 'color 0.3s' }}>✓</span>{t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 20, textAlign: 'center' }}>
              <a href="/sign-up" style={{ background: '#C8E600', color: BG, fontSize: 14, fontWeight: 800, padding: '13px 32px', borderRadius: 8, textDecoration: 'none', display: 'inline-block' }}>Transform my CV now →</a>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '72px 22px' : '96px 40px', borderTop: DIVIDE, maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ display: isMobile ? 'block' : 'grid', gridTemplateColumns: '380px 1fr', gap: 72, alignItems: 'start' }}>
          <div style={{ marginBottom: isMobile ? 40 : 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(200,230,0,0.6)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 18 }}>Results</p>
            <h2 style={{ fontSize: isMobile ? 30 : 44, fontWeight: 800, color: '#fff', lineHeight: 1.08, letterSpacing: -1.2, marginBottom: 20 }}>
              Real people.<br />Real results.
            </h2>
            <div style={{ padding: '20px 0', borderTop: DIVIDE }}>
              <div style={{ fontSize: isMobile ? 40 : 52, fontWeight: 800, color: '#C8E600', lineHeight: 1, letterSpacing: -2, fontVariantNumeric: 'tabular-nums' }}>11 days</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', marginTop: 6 }}>Average time from signup to first interview</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderTop: DIVIDE }}>
            {[
              { photo: PHOTOS[5], name: 'Thabo N.', result: 'Hired in 3 weeks', quote: 'I applied to 30 jobs manually for 4 months. Zero responses. After Jobsesame I had 4 interviews in 10 days. The AI knew exactly what recruiters wanted to see.' },
              { photo: PHOTOS[0], name: 'Amara D.', result: 'ATS: 38% → 91%', quote: 'My CV was good. Jobsesame made it exceptional. The ATS score went from 38 to 91 percent. I got a callback within 48 hours.' },
              { photo: PHOTOS[1], name: 'James K.', result: 'Relocated internationally', quote: 'I was relocating and had no idea what employers there wanted. Jobsesame rewrote my CV perfectly for the market. I got the job.' },
            ].map(t => (
              <div key={t.name} style={{ padding: isMobile ? '28px 0' : '36px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', gap: 2, marginBottom: 14 }}>
                  {[1,2,3,4,5].map(n => <span key={n} style={{ color: '#C8E600', fontSize: 12 }}>★</span>)}
                </div>
                <p style={{ fontSize: isMobile ? 16 : 19, color: 'rgba(255,255,255,0.78)', lineHeight: 1.58, fontStyle: 'italic', marginBottom: 18, fontWeight: 500, letterSpacing: -0.2 }}>&ldquo;{t.quote}&rdquo;</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={t.photo} loading="lazy" width={38} height={38} alt={t.name} style={{ borderRadius: '50%', border: '2px solid rgba(200,230,0,0.18)', background: '#1A4A2A', flexShrink: 0, objectFit: 'cover' }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: '#C8E600', fontWeight: 600 }}>{t.result}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: isMobile ? '72px 22px' : '96px 40px', borderTop: DIVIDE }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ marginBottom: isMobile ? 44 : 60 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(200,230,0,0.6)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 14 }}>Pricing</p>
            <h2 style={{ fontSize: isMobile ? 30 : 48, fontWeight: 800, color: '#fff', lineHeight: 1.06, letterSpacing: -1.5, marginBottom: 12 }}>
              Simple pricing.<br /><span style={{ color: '#C8E600' }}>Serious results.</span>
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.35)' }}>Start free. Upgrade when you are ready.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 14, alignItems: 'start' }}>
            {[
              { name: 'Free', price: 'R0', usdPrice: '$0', per: ' forever', features: ['3 Quick Apply credits', 'AI CV analysis', 'ATS score check', 'Browse 495,000+ jobs', 'No card needed'], popular: false, btn: 'Get started free' },
              { name: 'Credits', price: 'R99', usdPrice: '$5', per: ' per pack', features: ['10 Quick Apply credits', 'Credits never expire', 'AI CV rewrite per job', 'Cover letter generation', 'All job categories'], popular: false, btn: 'Buy credits' },
              { name: 'Pro', price: 'R249', usdPrice: '$14', per: ' /month', features: ['Unlimited Quick Apply', 'Unlimited CV rewrites', 'Priority support', 'Cover letters included', 'Application tracking'], popular: true, btn: 'Go Pro' },
            ].map(p => (
              <div key={p.name} style={{ background: p.popular ? 'rgba(200,230,0,0.04)' : 'rgba(255,255,255,0.02)', border: `1.5px solid ${p.popular ? 'rgba(200,230,0,0.3)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 12, padding: '26px 22px', position: 'relative' }}>
                {p.popular && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#C8E600', color: BG, fontSize: 10, fontWeight: 800, padding: '3px 14px', borderRadius: 4, whiteSpace: 'nowrap', letterSpacing: 0.5 }}>MOST POPULAR</div>}
                <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.32)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>{p.name}</div>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 42, fontWeight: 800, color: p.popular ? '#C8E600' : '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{currency === 'ZAR' ? p.price : p.usdPrice}</span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>{p.per}</span>
                </div>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '18px 0' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                      <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
                        <circle cx="7" cy="7" r="6" fill={p.popular ? 'rgba(200,230,0,0.1)' : 'rgba(255,255,255,0.05)'} />
                        <path d="M4.5 7L6.2 9L9.5 5" stroke={p.popular ? '#C8E600' : 'rgba(255,255,255,0.3)'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </div>
                  ))}
                </div>
                <a href="/sign-up" style={{ display: 'block', background: p.popular ? '#C8E600' : 'rgba(255,255,255,0.06)', color: p.popular ? BG : 'rgba(255,255,255,0.7)', border: `1px solid ${p.popular ? 'transparent' : 'rgba(255,255,255,0.1)'}`, fontSize: 13, fontWeight: 800, padding: '12px 0', borderRadius: 8, textDecoration: 'none', textAlign: 'center' }}>{p.btn}</a>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 18 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.18)' }}>30-day money-back guarantee · No questions asked</span>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section id="faq" style={{ padding: isMobile ? '72px 22px' : '96px 40px', borderTop: DIVIDE, maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: isMobile ? 'block' : 'grid', gridTemplateColumns: '320px 1fr', gap: 72, alignItems: 'start' }}>
          <div style={{ marginBottom: isMobile ? 36 : 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(200,230,0,0.6)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 18 }}>FAQ</p>
            <h2 style={{ fontSize: isMobile ? 28 : 40, fontWeight: 800, color: '#fff', lineHeight: 1.08, letterSpacing: -1.2, marginBottom: 16 }}>
              Everything<br />you need<br />to know
            </h2>
            <div style={{ position: 'relative', marginTop: 24 }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'rgba(255,255,255,0.22)', pointerEvents: 'none' }}>⌕</span>
              <input value={faqSearch} onChange={e => setFaqSearch(e.target.value)} placeholder="Search questions..." style={{ width: '100%', padding: '12px 14px 12px 36px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 13, color: '#fff', fontFamily: 'inherit' }} />
            </div>
          </div>

          <div>
            {filteredFaqs.length === 0
              ? <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', padding: '24px 0' }}>No questions match &ldquo;{faqSearch}&rdquo;</div>
              : filteredFaqs.map((faq, i) => (
                <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 0', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 16 }}>
                    <span style={{ fontSize: isMobile ? 14 : 15, fontWeight: 600, color: 'rgba(255,255,255,0.78)', lineHeight: 1.4, flex: 1 }}>{faq.q}</span>
                    <span style={{ fontSize: 18, color: '#C8E600', flexShrink: 0, transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.18s', lineHeight: 1 }}>+</span>
                  </button>
                  {openFaq === i && (
                    <div style={{ paddingBottom: 18 }}>
                      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.42)', lineHeight: 1.8, margin: 0 }}>{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '88px 22px' : '120px 40px', borderTop: DIVIDE }}>
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: isMobile ? 34 : 58, fontWeight: 800, color: '#fff', lineHeight: 1.03, letterSpacing: -2.5, marginBottom: 18 }}>
            Stop sending CVs<br />into the void.
          </h2>
          <p style={{ fontSize: isMobile ? 16 : 18, color: 'rgba(255,255,255,0.4)', lineHeight: 1.72, maxWidth: 460, margin: '0 auto 36px' }}>
            Join 2,400+ job seekers who stopped applying manually and started getting interviews.
          </p>
          <a href="/sign-up" style={{ background: '#C8E600', color: BG, fontSize: isMobile ? 15 : 17, fontWeight: 800, padding: isMobile ? '16px 32px' : '18px 48px', borderRadius: 8, textDecoration: 'none', display: 'inline-block', animation: 'ctaGlow 2.5s ease-in-out infinite', marginBottom: 24 }}>
            Get your first 3 applications free
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex' }}>
              {PHOTOS.map((src, i) => (
                <img key={i} src={src} loading="lazy" width={28} height={28} alt=""
                  style={{ borderRadius: '50%', border: `2px solid ${BG}`, marginLeft: i === 0 ? 0 : -7, zIndex: 6 - i, position: 'relative', objectFit: 'cover', background: '#1A4A2A' }} />
              ))}
            </div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>2,400+ new members this week</span>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{ background: '#040F07', borderTop: DIVIDE, padding: isMobile ? '48px 22px 96px' : '64px 40px 36px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr 1fr 1fr 1fr', gap: isMobile ? '32px 24px' : 40, marginBottom: 48 }}>
            <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 28, height: 28, background: '#C8E600', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="15" height="15" viewBox="0 0 22 22" fill="none"><circle cx="9" cy="9" r="5.5" stroke="#061A0C" strokeWidth="2.2" /><circle cx="9" cy="9" r="2.5" fill="#061A0C" opacity="0.4" /><line x1="13.5" y1="13.5" x2="20" y2="20" stroke="#061A0C" strokeWidth="2.8" strokeLinecap="round" /></svg>
                </div>
                <span style={{ fontSize: 16, fontWeight: 800 }}><span style={{ color: '#fff' }}>job</span><span style={{ color: '#C8E600' }}>sesame</span></span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.16)', lineHeight: 1.8, maxWidth: 220, marginBottom: 6 }}>AI-powered job applications for professionals who refuse to be ignored.</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.1)', marginBottom: 6 }}>Jobsesame (Pty) Ltd · South Africa</p>
              <a href="mailto:support@jobsesame.co.za" style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', textDecoration: 'none' }}>support@jobsesame.co.za</a>
            </div>
            {[
              { heading: 'Product', links: [['Find Jobs', '/jobs'], ['CV Optimiser', '/optimise'], ['UK Market', '/uk'], ['Dashboard', '/dashboard']] },
              { heading: 'Company', links: [['About', '/about'], ['Recruiters', '/recruiters'], ['Blog', '/blog'], ['Contact', 'mailto:hello@jobsesame.co.za']] },
              { heading: 'Legal',   links: [['Privacy Policy', '/privacy'], ['Terms of Service', '/terms'], ['Refund Policy', '/refund'], ['Delete My Data', '/delete-data']] },
            ].map(col => (
              <div key={col.heading}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 16 }}>{col.heading}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {col.links.map(([l, h]) => <a key={l} href={h} className="nav-link" style={{ fontSize: 13, color: 'rgba(255,255,255,0.24)', textDecoration: 'none' }}>{l}</a>)}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: DIVIDE, paddingTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.12)' }}>© 2025 Jobsesame (Pty) Ltd. All rights reserved.</span>
              <div style={{ display: 'flex', gap: 20 }}>
                {['Twitter', 'LinkedIn', 'Instagram'].map(s => <span key={s} style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', cursor: 'pointer' }}>{s}</span>)}
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.1)' }}>Registered with the South African Information Regulator under POPIA</span>
              <a href="/unsubscribe" style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', textDecoration: 'none' }}>Unsubscribe from emails</a>
            </div>
          </div>
        </div>
      </footer>

      {/* MOBILE STICKY BAR */}
      {isMobile && !isSignedIn && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 300, background: 'rgba(4,12,6,0.97)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(200,230,0,0.15)', padding: '12px 20px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
          <a href="/sign-up" style={{ display: 'block', background: '#C8E600', color: BG, fontSize: 15, fontWeight: 800, padding: '15px 24px', borderRadius: 8, textDecoration: 'none', textAlign: 'center' }}>
            Get started free — 3 free applications
          </a>
        </div>
      )}
    </main>
  );
}
