'use client';
import { useEffect, useRef, useState } from 'react';
import { useAuth, UserButton } from '@clerk/nextjs';

const PHOTOS = [
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80&h=80&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop&crop=face',
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
        let s = 30;
        if (cv.summary) s += 10;
        if ((cv.skills?.length || 0) >= 5) s += 10;
        if (cv.experience_years || cv.experience?.length) s += 10;
        if (cv.education) s += 10;
        if ((cv.languages?.length || 0) > 0) s += 10;
        const text = [cv.summary, ...(cv.skills || []), cv.title].filter(Boolean).join(' ').toLowerCase();
        ['management','leadership','strategy','communication','analytics'].forEach(kw => { if (text.includes(kw)) s += 5; });
        const score = Math.min(95, s);
        const weaknesses: string[] = [];
        if (!cv.summary || cv.summary.length < 50) weaknesses.push('No professional summary — ATS filters remove CVs without one');
        if ((cv.skills?.length || 0) < 5) weaknesses.push('Too few skills listed — add at least 8 role-specific keywords');
        if (!cv.education) weaknesses.push('Education section missing — required by most ATS systems');
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

  return (
    <main style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: "#052A14", margin: 0, padding: 0, overflowX: "hidden" }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.6)} }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floatCard { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-12px)} }
        @keyframes notifIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes glowPulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes faqSlide { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ctaGlow { 0%,100%{box-shadow:0 8px 32px rgba(200,230,0,0.35)} 50%{box-shadow:0 8px 52px rgba(200,230,0,0.65)} }
        @keyframes spinAI { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes slideInRight { from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:translateX(0)} }
        @keyframes modalIn { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
        .hov-lift { transition: transform 0.22s ease, border-color 0.22s ease; }
        .hov-lift:hover { transform: translateY(-5px); }
        .feat-card { transition: border-color 0.2s, transform 0.2s; }
        .feat-card:hover { border-color: rgba(200,230,0,0.35) !important; transform: translateY(-4px); }
        .nav-link { transition: color 0.15s; }
        .nav-link:hover { color: #FFFFFF !important; }
        input::placeholder { color: rgba(255,255,255,0.25); }
        input:focus { border-color: rgba(200,230,0,0.35) !important; }
      `}</style>

      {/* EXIT INTENT */}
      {exitIntent && !exitDismissed && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#072E16", border: "1.5px solid rgba(200,230,0,0.4)", borderRadius: 20, padding: "36px 32px", maxWidth: 420, width: "100%", textAlign: "center", position: "relative", animation: "modalIn 0.25s ease-out" }}>
            <button onClick={() => { setExitIntent(false); setExitDismissed(true); }} style={{ position: "absolute", top: 14, right: 16, background: "transparent", border: "none", color: "rgba(255,255,255,0.3)", fontSize: 20, cursor: "pointer" }}>✕</button>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚡</div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: "#FFFFFF", lineHeight: 1.15, marginBottom: 10 }}>Wait — get 3 free CV rewrites before you go</h3>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, marginBottom: 24 }}>No credit card. No commitment. AI rewrites your CV in 30 seconds and gets you more interviews.</p>
            <a href="/sign-up" onClick={() => setExitDismissed(true)} style={{ display: "block", background: "#C8E600", color: "#052A14", fontSize: 15, fontWeight: 800, padding: "14px 32px", borderRadius: 99, textDecoration: "none", marginBottom: 10, animation: "ctaGlow 2s ease-in-out infinite" }}>
              Claim my 3 free rewrites →
            </a>
            <button onClick={() => { setExitIntent(false); setExitDismissed(true); }} style={{ background: "transparent", border: "none", fontSize: 12, color: "rgba(255,255,255,0.2)", cursor: "pointer" }}>
              No thanks, I&apos;ll keep struggling
            </button>
          </div>
        </div>
      )}

      {/* NAV */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 200, height: 64,
        padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrolled ? "rgba(3,15,7,0.88)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.05)" : "none",
        transition: "all 0.3s",
      }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, background: "#C8E600", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
              <circle cx="9" cy="9" r="5.5" stroke="#052A14" strokeWidth="2.2" />
              <circle cx="9" cy="9" r="2.5" fill="#052A14" opacity="0.4" />
              <line x1="13.5" y1="13.5" x2="20" y2="20" stroke="#052A14" strokeWidth="2.8" strokeLinecap="round" />
            </svg>
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>
            <span style={{ color: "#FFFFFF" }}>job</span><span style={{ color: "#C8E600" }}>sesame</span>
          </span>
        </a>

        {!isMobile && (
          <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
            {[{ label: "How it works", id: "how-it-works" }, { label: "Features", id: "features" }, { label: "Pricing", id: "pricing" }, { label: "FAQ", id: "faq" }].map(item => (
              <button key={item.id} onClick={() => scrollTo(item.id)} className="nav-link" style={{ background: "transparent", border: "none", fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500, padding: "8px 14px", borderRadius: 8, cursor: "pointer" }}>{item.label}</button>
            ))}
            <a href="/recruiters" className="nav-link" style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500, padding: "8px 14px", textDecoration: "none", borderRadius: 8 }}>Recruiters</a>
            <a href="/blog" className="nav-link" style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500, padding: "8px 14px", textDecoration: "none", borderRadius: 8 }}>Blog</a>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {!isMobile && !isSignedIn && (
            <a href="/sign-in" style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500, textDecoration: "none", padding: "8px 12px" }}>Sign in</a>
          )}
          {!isMobile && isSignedIn && (
            <a href="/dashboard" style={{ fontSize: 13, color: "#C8E600", fontWeight: 700, textDecoration: "none", padding: "8px 16px", background: "rgba(200,230,0,0.1)", borderRadius: 99, border: "1px solid rgba(200,230,0,0.3)" }}>Dashboard</a>
          )}
          {isSignedIn
            ? <UserButton afterSignOutUrl="/" />
            : <a href="/sign-up" style={{ background: "#C8E600", color: "#052A14", fontSize: 13, fontWeight: 800, padding: "9px 22px", borderRadius: 99, textDecoration: "none", whiteSpace: "nowrap", boxShadow: "0 2px 16px rgba(200,230,0,0.3)" }}>Get started free</a>
          }
          {isMobile && (
            <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "transparent", border: "none", color: "#C8E600", fontSize: 22, cursor: "pointer", padding: 4, lineHeight: 1 }}>
              {menuOpen ? '✕' : '☰'}
            </button>
          )}
        </div>
      </nav>

      {/* MOBILE MENU */}
      {isMobile && menuOpen && (
        <div style={{ position: "fixed", top: 64, left: 0, right: 0, background: "rgba(3,15,7,0.97)", backdropFilter: "blur(20px)", zIndex: 199, borderTop: "1px solid rgba(255,255,255,0.06)", padding: "24px 24px 32px", display: "flex", flexDirection: "column", gap: 16 }}>
          {[{ label: "How it works", id: "how-it-works" }, { label: "Features", id: "features" }, { label: "Pricing", id: "pricing" }, { label: "FAQ", id: "faq" }].map(item => (
            <button key={item.id} onClick={() => scrollTo(item.id)} style={{ background: "transparent", border: "none", fontSize: 16, color: "rgba(255,255,255,0.75)", fontWeight: 600, textAlign: "left", cursor: "pointer", padding: "4px 0" }}>{item.label}</button>
          ))}
          <a href="/recruiters" onClick={() => setMenuOpen(false)} style={{ fontSize: 16, color: "rgba(255,255,255,0.75)", fontWeight: 600, textDecoration: "none" }}>Recruiters</a>
          <a href="/blog" onClick={() => setMenuOpen(false)} style={{ fontSize: 16, color: "rgba(255,255,255,0.75)", fontWeight: 600, textDecoration: "none" }}>Blog</a>
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
          {isSignedIn
            ? <a href="/dashboard" onClick={() => setMenuOpen(false)} style={{ fontSize: 16, color: "#C8E600", fontWeight: 700, textDecoration: "none" }}>Dashboard →</a>
            : <>
              <a href="/sign-in" onClick={() => setMenuOpen(false)} style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", fontWeight: 500, textDecoration: "none" }}>Sign in</a>
              <a href="/sign-up" onClick={() => setMenuOpen(false)} style={{ background: "#C8E600", color: "#052A14", fontSize: 15, fontWeight: 800, padding: "14px 24px", borderRadius: 99, textDecoration: "none", textAlign: "center" }}>Get started — free</a>
            </>
          }
        </div>
      )}

      {/* HERO */}
      <section style={{ background: "#052A14", minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: isMobile ? "96px 20px 96px" : "120px 28px 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "15%", left: "5%", width: 700, height: 700, background: "radial-gradient(circle,rgba(200,230,0,0.07) 0%,transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "5%", right: "0%", width: 500, height: 500, background: "radial-gradient(circle,rgba(200,230,0,0.04) 0%,transparent 65%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1140, margin: "0 auto", width: "100%" }}>
          <div style={{ display: isMobile ? "flex" : "grid", gridTemplateColumns: isMobile ? undefined : "1fr 1fr", flexDirection: isMobile ? "column" : undefined, gap: isMobile ? 52 : 80, alignItems: "center" }}>

            {/* LEFT */}
            <div style={{ animation: "fadeInUp 0.65s ease-out" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 99, padding: "7px 16px", marginBottom: 28, backdropFilter: "blur(10px)" }}>
                <span style={{ width: 8, height: 8, background: "#FF4444", borderRadius: "50%", display: "inline-block", animation: "pulse 1.6s ease-in-out infinite", flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>LIVE — 47 people applying right now</span>
              </div>

              <h1 style={{ fontSize: isMobile ? 38 : 64, fontWeight: 800, color: "#FFFFFF", lineHeight: 1.05, letterSpacing: -2, marginBottom: 22 }}>
                Your CV is being<br />
                <span style={{ color: "rgba(255,100,100,0.8)", textDecoration: "line-through", textDecorationColor: "#FF6B6B", textDecorationThickness: 3 }}>ignored.</span><br />
                <span style={{ color: "#C8E600" }}>We fix that.</span>
              </h1>

              <p style={{ fontSize: isMobile ? 16 : 18, color: "rgba(255,255,255,0.55)", lineHeight: 1.75, marginBottom: 36, maxWidth: 480 }}>
                8 out of 10 CVs never reach a human. Our AI rewrites yours for every job in 30 seconds — so yours always gets through.
              </p>

              {/* Avatars */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32, justifyContent: isMobile ? "center" : "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  {PHOTOS.map((src, i) => (
                    <img key={i} src={src} crossOrigin="anonymous" loading="lazy" width={36} height={36} alt="Member"
                      style={{ borderRadius: "50%", border: "2.5px solid #052A14", marginLeft: i === 0 ? 0 : -10, zIndex: 5 - i, position: "relative", background: "#1A4A2A", objectFit: "cover" }} />
                  ))}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#FFFFFF" }}>+2,400</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>joined this week</div>
                </div>
              </div>

              {/* CTAs */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: isMobile ? "center" : "flex-start", marginBottom: 16 }}>
                <a href="/sign-up" style={{ background: "#C8E600", color: "#052A14", fontSize: 15, fontWeight: 800, padding: "18px 40px", borderRadius: 99, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, animation: "ctaGlow 2.5s ease-in-out infinite", whiteSpace: "nowrap" }}>
                  Start for free — no card needed →
                </a>
                <button onClick={() => scrollTo('demo')} style={{ background: "transparent", color: "rgba(255,255,255,0.7)", fontSize: 15, fontWeight: 600, padding: "18px 24px", borderRadius: 99, border: "1.5px solid rgba(255,255,255,0.12)", cursor: "pointer", whiteSpace: "nowrap" }}>
                  See a live demo →
                </button>
              </div>

              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 16, textAlign: isMobile ? "center" : "left" }}>
                <span style={{ color: "#C8E600", fontWeight: 700 }}>{signupCount}</span> people signed up today
              </div>

              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: isMobile ? "center" : "flex-start" }}>
                {["🔒 CV never shared", "⚡ 30 seconds", "🌍 50+ countries"].map(t => (
                  <span key={t} style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>{t}</span>
                ))}
              </div>
            </div>

            {/* RIGHT */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, animation: "fadeInUp 0.65s ease-out 0.15s both", position: "relative" }}>
              <div style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: 24, width: "100%", maxWidth: 380, boxShadow: "0 32px 80px rgba(0,0,0,0.5)", animation: "floatCard 5s ease-in-out infinite" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 18 }}>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(200,230,0,0.1)", border: "1px solid rgba(200,230,0,0.2)", borderRadius: 99, padding: "4px 12px" }}>
                    <span style={{ width: 6, height: 6, background: "#C8E600", borderRadius: "50%", animation: "pulse 1.5s infinite" }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#C8E600", letterSpacing: "1px" }}>AI TRANSFORMING</span>
                  </div>
                  <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 28px 1fr", gap: 8, alignItems: "start" }}>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#FF6B6B", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>Before</div>
                    {["Responsible for managing team", "Worked on various projects", "Helped with strategy"].map(t => (
                      <div key={t} style={{ background: "rgba(255,80,80,0.07)", border: "1px solid rgba(255,80,80,0.12)", borderRadius: 8, padding: "6px 8px", fontSize: 10, color: "rgba(255,255,255,0.35)", lineHeight: 1.4, marginBottom: 5, display: "flex", gap: 5 }}>
                        <span style={{ color: "#FF6B6B", flexShrink: 0 }}>✕</span><span>{t}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,80,80,0.08)", border: "1px solid rgba(255,80,80,0.15)", borderRadius: 8, padding: "5px 8px" }}>
                      <span style={{ fontSize: 9, color: "rgba(255,107,107,0.7)", fontWeight: 600 }}>ATS Score</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#FF6B6B" }}>42%</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 18, gap: 4 }}>
                    <div style={{ width: 24, height: 24, background: "linear-gradient(135deg,#C8E600,#88AA00)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, boxShadow: "0 0 12px rgba(200,230,0,0.4)" }}>🤖</div>
                    <div style={{ width: 1, height: 36, background: "linear-gradient(to bottom,rgba(200,230,0,0.3),transparent)" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#4ADE80", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>After</div>
                    {["Led 12-person team, +40% efficiency", "5 projects on time, 15% under budget", "Strategy driving $2.4M new revenue"].map(t => (
                      <div key={t} style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.12)", borderRadius: 8, padding: "6px 8px", fontSize: 10, color: "rgba(255,255,255,0.7)", lineHeight: 1.4, marginBottom: 5, display: "flex", gap: 5 }}>
                        <span style={{ color: "#4ADE80", flexShrink: 0 }}>✓</span><span>{t}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(200,230,0,0.06)", border: "1px solid rgba(200,230,0,0.15)", borderRadius: 8, padding: "5px 8px" }}>
                      <span style={{ fontSize: 9, color: "rgba(200,230,0,0.6)", fontWeight: 600 }}>ATS Score</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "#C8E600" }}>94%</span>
                    </div>
                  </div>
                </div>
                <a href="/sign-up" style={{ display: "block", marginTop: 16, background: "#C8E600", color: "#052A14", fontSize: 13, fontWeight: 800, padding: "12px", borderRadius: 12, textDecoration: "none", textAlign: "center" }}>
                  ⚡ Try it free now
                </a>
              </div>

              {notifVisible && (
                <div style={{ position: "absolute", bottom: -20, right: isMobile ? 0 : -16, background: "rgba(10,30,15,0.92)", backdropFilter: "blur(16px)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 14, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8, maxWidth: 248, animation: "notifIn 0.5s ease-out", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", zIndex: 2 }}>
                  <span style={{ width: 8, height: 8, background: "#4ADE80", borderRadius: "50%", flexShrink: 0, animation: "pulse 2s infinite" }} />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", fontWeight: 600, lineHeight: 1.4 }}>✓ New member just got 3 interview invites this week</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* TRUST BAR */}
      <div style={{ background: "#040F07", borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "18px 28px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", gap: isMobile ? 20 : 44, flexWrap: "wrap" }}>
          {["🔒 Bank-grade security", "⭐ 4.8/5 rating", "🌍 Used in 50+ countries", "✓ GDPR compliant", "💼 495,000+ live jobs"].map(item => (
            <span key={item} style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>{item}</span>
          ))}
        </div>
      </div>

      {/* PROBLEM */}
      <section style={{ background: "#020A04", padding: isMobile ? "72px 20px" : "96px 28px", textAlign: "center" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "inline-flex", alignItems: "center", background: "rgba(255,80,80,0.08)", border: "1px solid rgba(255,80,80,0.2)", borderRadius: 99, padding: "6px 18px", marginBottom: 28 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,120,120,0.9)", letterSpacing: "1.5px", textTransform: "uppercase" }}>The problem</span>
          </div>
          <h2 style={{ fontSize: isMobile ? 30 : 48, fontWeight: 800, color: "#FFFFFF", lineHeight: 1.08, letterSpacing: -1.5, marginBottom: 16 }}>
            The job market is broken.<br /><span style={{ color: "rgba(255,255,255,0.25)" }}>Here is proof.</span>
          </h2>
          <p style={{ fontSize: isMobile ? 14 : 16, color: "rgba(255,255,255,0.35)", lineHeight: 1.75, maxWidth: 500, margin: "0 auto 56px" }}>
            It is not your qualifications. It is not your experience. The system is filtering you out before any human sees your name.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 16, marginBottom: 40 }}>
            {[
              { stat: "80%", label: "of CVs rejected by ATS", desc: "Before a human ever sees them. One missing keyword and you disappear from the entire process.", color: "#FF6B6B" },
              { stat: "6 months", label: "average job hunt duration", desc: "Without the right tools. Every month you spend job hunting is money and opportunities lost.", color: "#FFAA44" },
              { stat: "2%", label: "average CV-to-interview rate", desc: "Without optimisation. Most people apply to 50 jobs and hear back from 1. Jobsesame makes you that 1.", color: "#C8E600" },
            ].map((s, i) => (
              <div key={i} className="hov-lift" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "32px 24px", textAlign: "left" }}>
                <div style={{ fontSize: isMobile ? 44 : 52, fontWeight: 800, color: s.color, letterSpacing: -2, lineHeight: 1, marginBottom: 8 }}>{s.stat}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF", marginBottom: 10 }}>{s.label}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", lineHeight: 1.7 }}>{s.desc}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>&ldquo;You are not the problem. Your CV is.&rdquo;</p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{ background: "#052A14", padding: isMobile ? "72px 20px" : "96px 28px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 48 : 64 }}>
            <div style={{ display: "inline-flex", alignItems: "center", background: "rgba(200,230,0,0.07)", border: "1px solid rgba(200,230,0,0.18)", borderRadius: 99, padding: "6px 18px", marginBottom: 24 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#C8E600", letterSpacing: "1.5px", textTransform: "uppercase" }}>The solution</span>
            </div>
            <h2 style={{ fontSize: isMobile ? 30 : 48, fontWeight: 800, color: "#FFFFFF", lineHeight: 1.08, letterSpacing: -1.5, marginBottom: 16 }}>
              One upload.<br /><span style={{ color: "#C8E600" }}>Infinite possibilities.</span>
            </h2>
            <p style={{ fontSize: isMobile ? 14 : 17, color: "rgba(255,255,255,0.4)", maxWidth: 460, margin: "0 auto" }}>Upload your CV once and let AI handle everything else.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4,1fr)", gap: isMobile ? 14 : 12, position: "relative" }}>
            {!isMobile && <div style={{ position: "absolute", top: 36, left: "12%", right: "12%", height: 2, background: "linear-gradient(to right,transparent,rgba(200,230,0,0.3),rgba(200,230,0,0.3),transparent)", zIndex: 0, borderTop: "2px dashed rgba(200,230,0,0.2)" }} />}
            {[
              { n: "01", icon: "📄", title: "Upload CV", desc: "Drop your PDF. AI reads everything in seconds." },
              { n: "02", icon: "🧠", title: "AI Analyses", desc: "Skills, experience and strengths extracted automatically." },
              { n: "03", icon: "⚡", title: "Apply Smarter", desc: "CV rewritten for each job. Every application perfectly tailored." },
              { n: "04", icon: "🏆", title: "Get Hired", desc: "Pass ATS filters. Reach human recruiters. Get interviews." },
            ].map(step => (
              <div key={step.n} className="hov-lift" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "28px 18px 24px", textAlign: "center", position: "relative", zIndex: 1 }}>
                <div style={{ position: "absolute", top: 14, right: 16, fontSize: 11, fontWeight: 800, color: "rgba(200,230,0,0.25)", letterSpacing: "1px" }}>{step.n}</div>
                <div style={{ width: 48, height: 48, background: "rgba(200,230,0,0.07)", border: "1px solid rgba(200,230,0,0.15)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, margin: "0 auto 16px" }}>{step.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#FFFFFF", marginBottom: 8 }}>{step.title}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.65 }}>{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ background: "#020A04", padding: isMobile ? "72px 20px" : "96px 28px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 48 : 64 }}>
            <div style={{ display: "inline-flex", alignItems: "center", background: "rgba(200,230,0,0.07)", border: "1px solid rgba(200,230,0,0.18)", borderRadius: 99, padding: "6px 18px", marginBottom: 24 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#C8E600", letterSpacing: "1.5px", textTransform: "uppercase" }}>Features</span>
            </div>
            <h2 style={{ fontSize: isMobile ? 30 : 48, fontWeight: 800, color: "#FFFFFF", lineHeight: 1.08, letterSpacing: -1.5, marginBottom: 16 }}>Everything you need<br />to get hired faster</h2>
            <p style={{ fontSize: isMobile ? 14 : 17, color: "rgba(255,255,255,0.35)", maxWidth: 400, margin: "0 auto" }}>One platform. Every tool an ambitious job seeker needs.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 14 }}>
            {[
              { icon: "🧬", title: "AI CV Tailoring", desc: "Rewrites your CV for each job in 30 seconds. Keywords, tone, structure — all matched to the role." },
              { icon: "🔍", title: "ATS Optimisation", desc: "Pass automated screening systems every time. Our AI knows exactly what filters look for." },
              { icon: "🌍", title: "495,000+ Live Jobs", desc: "All jobs in one place from 50+ sources. Remote, relocation, teaching and more." },
              { icon: "⚡", title: "Quick Apply", desc: "Apply to any job in under 10 seconds. AI handles the CV, cover letter and submission." },
              { icon: "🎯", title: "Match Scoring", desc: "See exactly how well your CV fits each role before you apply. Fix the gaps first." },
              { icon: "📊", title: "Application Tracker", desc: "Track every application in one dashboard. Know what stage you are at — always." },
            ].map(f => (
              <div key={f.title} className="feat-card" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "28px 22px" }}>
                <div style={{ width: 48, height: 48, background: "rgba(200,230,0,0.06)", border: "1px solid rgba(200,230,0,0.12)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 18 }}>{f.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#FFFFFF", marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.32)", lineHeight: 1.7 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LIVE DEMO */}
      <section id="demo" style={{ background: "#052A14", padding: isMobile ? "72px 20px" : "96px 28px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 40 : 56 }}>
            <div style={{ display: "inline-flex", alignItems: "center", background: "rgba(200,230,0,0.07)", border: "1px solid rgba(200,230,0,0.18)", borderRadius: 99, padding: "6px 18px", marginBottom: 24 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#C8E600", letterSpacing: "1.5px", textTransform: "uppercase" }}>Live demo</span>
            </div>
            <h2 style={{ fontSize: isMobile ? 30 : 48, fontWeight: 800, color: "#FFFFFF", lineHeight: 1.08, letterSpacing: -1.5, marginBottom: 16 }}>
              Watch AI rewrite a CV<br /><span style={{ color: "#C8E600" }}>in real time</span>
            </h2>
            <p style={{ fontSize: isMobile ? 14 : 17, color: "rgba(255,255,255,0.35)", maxWidth: 400, margin: "0 auto" }}>See the transformation from weak language to recruiter-ready copy.</p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 24, overflow: "hidden" }}>
            <div style={{ padding: "14px 22px", background: "rgba(0,0,0,0.25)", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 8 }}>
              {["#FF5F57", "#FFBD2E", "#28CA41"].map(c => <div key={c} style={{ width: 11, height: 11, background: c, borderRadius: "50%" }} />)}
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginLeft: 8 }}>CV Optimiser — AI Transform</span>
            </div>
            <div style={{ display: isMobile ? "flex" : "grid", gridTemplateColumns: isMobile ? undefined : "1fr 120px 1fr", flexDirection: isMobile ? "column" : undefined }}>
              {/* Before */}
              <div style={{ padding: "28px 24px", opacity: demoStage === 'loading' ? 0 : 1, transition: "opacity 0.3s" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "1.5px", textTransform: "uppercase" }}>Your original CV</span>
                  <div style={{ background: "rgba(255,100,100,0.1)", border: "1px solid rgba(255,100,100,0.2)", borderRadius: 99, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: "#FF6B6B" }}>ATS: 42%</div>
                </div>
                {["Responsible for managing team", "Worked on various projects", "Helped with strategy"].map((t, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,80,80,0.12)", borderRadius: 10, padding: "10px 12px", fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.5, marginBottom: 8 }}>
                    <span style={{ color: "#FF6B6B", marginRight: 8 }}>✕</span>{t}
                  </div>
                ))}
              </div>

              {/* Center */}
              <div style={{ display: "flex", flexDirection: isMobile ? "row" : "column", alignItems: "center", justifyContent: "center", padding: isMobile ? "16px 24px" : "28px 12px", borderLeft: isMobile ? "none" : "1px solid rgba(255,255,255,0.04)", borderRight: isMobile ? "none" : "1px solid rgba(255,255,255,0.04)", gap: 10 }}>
                {demoStage === 'loading' ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 32, height: 32, border: "3px solid rgba(200,230,0,0.2)", borderTop: "3px solid #C8E600", borderRadius: "50%", animation: "spinAI 0.8s linear infinite" }} />
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>AI working...</span>
                  </div>
                ) : (
                  <>
                    <button onClick={handleDemoTransform} style={{ background: demoStage === 'done' ? "rgba(74,222,128,0.1)" : "#C8E600", color: demoStage === 'done' ? "#4ADE80" : "#052A14", border: demoStage === 'done' ? "1.5px solid rgba(74,222,128,0.3)" : "none", fontSize: 12, fontWeight: 800, padding: "10px 16px", borderRadius: 12, cursor: "pointer", boxShadow: demoStage === 'idle' ? "0 4px 20px rgba(200,230,0,0.3)" : "none", whiteSpace: "nowrap" }}>
                      {demoStage === 'done' ? "Transformed ✓" : "Transform →"}
                    </button>
                    {demoStage === 'done' && <button onClick={() => { setDemoStage('idle'); setDemoAts(42); }} style={{ background: "transparent", border: "none", fontSize: 10, color: "rgba(255,255,255,0.2)", cursor: "pointer", textDecoration: "underline" }}>Reset</button>}
                    {demoStage === 'idle' && <span style={{ fontSize: 9, color: "rgba(255,255,255,0.15)", fontWeight: 600, letterSpacing: "1px", textTransform: "uppercase", textAlign: "center" }}>AI magic</span>}
                  </>
                )}
              </div>

              {/* After */}
              <div style={{ padding: "28px 24px", background: demoStage === 'done' ? "rgba(200,230,0,0.015)" : "transparent", opacity: demoStage === 'done' ? 1 : 0.25, animation: demoStage === 'done' ? "slideInRight 0.4s ease-out" : "none", transition: "background 0.5s, opacity 0.4s" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: demoStage === 'done' ? "rgba(200,230,0,0.7)" : "rgba(255,255,255,0.15)", letterSpacing: "1.5px", textTransform: "uppercase", transition: "color 0.4s" }}>AI-optimised version</span>
                  <div style={{ background: demoStage === 'done' ? "rgba(200,230,0,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${demoStage === 'done' ? "rgba(200,230,0,0.2)" : "rgba(255,255,255,0.06)"}`, borderRadius: 99, padding: "3px 10px", fontSize: 11, fontWeight: 700, color: demoStage === 'done' ? "#C8E600" : "rgba(255,255,255,0.15)", transition: "all 0.4s" }}>
                    ATS: {demoStage === 'done' ? `${demoAts}%` : "—"}
                  </div>
                </div>
                {["Led cross-functional team of 12 driving 40% efficiency gains", "Delivered 5 enterprise projects on time and 15% under budget", "Architected go-to-market strategy generating $2.4M in new revenue"].map((t, i) => (
                  <div key={i} style={{ background: demoStage === 'done' ? "rgba(200,230,0,0.04)" : "rgba(255,255,255,0.015)", border: `1px solid ${demoStage === 'done' ? "rgba(200,230,0,0.12)" : "rgba(255,255,255,0.04)"}`, borderRadius: 10, padding: "10px 12px", fontSize: 12, color: demoStage === 'done' ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.1)", lineHeight: 1.5, marginBottom: 8, transition: `all 0.4s ${i * 0.1}s` }}>
                    <span style={{ color: demoStage === 'done' ? "#C8E600" : "rgba(255,255,255,0.1)", marginRight: 8, transition: "color 0.3s" }}>✓</span>{t}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 28 }}>
            <a href="/sign-up" style={{ background: "#C8E600", color: "#052A14", fontSize: 14, fontWeight: 800, padding: "14px 36px", borderRadius: 99, textDecoration: "none", display: "inline-block", boxShadow: "0 4px 24px rgba(200,230,0,0.3)" }}>Transform my CV now →</a>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ background: "#020A04", padding: isMobile ? "72px 20px" : "96px 28px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 48 : 64 }}>
            <div style={{ display: "inline-flex", alignItems: "center", background: "rgba(200,230,0,0.07)", border: "1px solid rgba(200,230,0,0.18)", borderRadius: 99, padding: "6px 18px", marginBottom: 24 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#C8E600", letterSpacing: "1.5px", textTransform: "uppercase" }}>Success stories</span>
            </div>
            <h2 style={{ fontSize: isMobile ? 30 : 48, fontWeight: 800, color: "#FFFFFF", lineHeight: 1.08, letterSpacing: -1.5, marginBottom: 16 }}>Real people.<br /><span style={{ color: "#C8E600" }}>Real results.</span></h2>
            <p style={{ fontSize: isMobile ? 14 : 17, color: "rgba(255,255,255,0.35)", maxWidth: 360, margin: "0 auto" }}>From silence to offer letters.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 14, marginBottom: 14 }}>
            {[
              { photo: PHOTOS[5], name: "Thabo N.", result: "Got hired in 3 weeks", quote: "I applied to 30 jobs manually for 4 months. Zero responses. After Jobsesame I had 4 interviews in 10 days. The AI knew exactly what recruiters wanted to see." },
              { photo: PHOTOS[0], name: "Amara D.", result: "ATS score: 38% → 91%", quote: "My CV was good. Jobsesame made it exceptional. The ATS score went from 38 to 91 percent. I got a callback within 48 hours." },
              { photo: PHOTOS[1], name: "James K.", result: "Relocated internationally, hired", quote: "I was relocating and had no idea what employers there wanted. Jobsesame rewrote my CV perfectly for the market. I got the job." },
            ].map(t => (
              <div key={t.name} className="hov-lift" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "28px 22px" }}>
                <div style={{ display: "flex", gap: 2, marginBottom: 14 }}>
                  {[1, 2, 3, 4, 5].map(n => <span key={n} style={{ color: "#C8E600", fontSize: 13 }}>★</span>)}
                </div>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.75, fontStyle: "italic", marginBottom: 20 }}>&ldquo;{t.quote}&rdquo;</p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <img src={t.photo} crossOrigin="anonymous" loading="lazy" width={48} height={48} alt={t.name} style={{ borderRadius: "50%", border: "2px solid rgba(200,230,0,0.25)", background: "#1A4A2A", flexShrink: 0, objectFit: "cover" }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF" }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "#C8E600", fontWeight: 600 }}>{t.result}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: "rgba(200,230,0,0.04)", border: "1px solid rgba(200,230,0,0.12)", borderRadius: 20, padding: "28px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
            <div>
              <div style={{ fontSize: isMobile ? 38 : 52, fontWeight: 800, color: "#C8E600", lineHeight: 1, letterSpacing: -2 }}>11 days</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>Average time from signup to first interview</div>
            </div>
            <a href="/sign-up" style={{ background: "#C8E600", color: "#052A14", fontSize: 14, fontWeight: 800, padding: "14px 32px", borderRadius: 99, textDecoration: "none", whiteSpace: "nowrap" }}>Start your journey →</a>
          </div>
        </div>
      </section>

      {/* FREE CV ANALYSIS */}
      <section style={{ background: "#052A14", padding: isMobile ? "72px 20px" : "96px 28px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ display: "inline-flex", alignItems: "center", background: "rgba(200,230,0,0.07)", border: "1px solid rgba(200,230,0,0.18)", borderRadius: 99, padding: "6px 18px", marginBottom: 24 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#C8E600", letterSpacing: "1.5px", textTransform: "uppercase" }}>Free tool</span>
            </div>
            <h2 style={{ fontSize: isMobile ? 30 : 48, fontWeight: 800, color: "#FFFFFF", lineHeight: 1.08, letterSpacing: -1.5, marginBottom: 12 }}>
              See your ATS score<br /><span style={{ color: "#C8E600" }}>in 15 seconds — free</span>
            </h2>
            <p style={{ fontSize: isMobile ? 14 : 16, color: "rgba(255,255,255,0.35)", maxWidth: 420, margin: "0 auto" }}>
              No signup required. Drop your CV and get an instant ATS analysis with specific weaknesses.
            </p>
          </div>

          {cvAnalysisState === 'idle' && (
            <div
              onDrop={e => { e.preventDefault(); setCvAnalysisDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleCvAnalysis(f); }}
              onDragOver={e => { e.preventDefault(); setCvAnalysisDragOver(true); }}
              onDragLeave={() => setCvAnalysisDragOver(false)}
              style={{ border: `2px dashed ${cvAnalysisDragOver ? '#C8E600' : 'rgba(200,230,0,0.3)'}`, borderRadius: 20, padding: "52px 28px", textAlign: "center", background: cvAnalysisDragOver ? 'rgba(200,230,0,0.04)' : 'rgba(255,255,255,0.02)', transition: "all 0.2s", cursor: "pointer" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📄</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", marginBottom: 8 }}>Drop your CV here</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginBottom: 20 }}>PDF format · processed instantly · never stored</div>
              <label style={{ cursor: "pointer" }}>
                <input type="file" accept=".pdf" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) handleCvAnalysis(f); }} />
                <span style={{ background: "#C8E600", color: "#052A14", fontSize: 14, fontWeight: 800, padding: "13px 32px", borderRadius: 99, display: "inline-block" }}>Choose PDF</span>
              </label>
            </div>
          )}

          {cvAnalysisState === 'uploading' && (
            <div style={{ textAlign: "center", padding: "52px 28px", background: "rgba(255,255,255,0.02)", border: "2px solid rgba(200,230,0,0.2)", borderRadius: 20 }}>
              <div style={{ width: 48, height: 48, border: "4px solid rgba(200,230,0,0.2)", borderTop: "4px solid #C8E600", borderRadius: "50%", animation: "spinAI 0.8s linear infinite", margin: "0 auto 16px" }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: "#FFFFFF", marginBottom: 6 }}>AI is reading your CV...</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>Analysing skills, experience and ATS compatibility</div>
            </div>
          )}

          {cvAnalysisState === 'done' && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1.5px solid rgba(200,230,0,0.2)", borderRadius: 20, padding: isMobile ? "28px 20px" : "36px 40px" }}>
              {/* Score gauge */}
              <div style={{ display: "flex", gap: 28, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 28 }}>
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                  <div style={{ position: "relative", width: 110, height: 110, margin: "0 auto 10px" }}>
                    <svg width="110" height="110" style={{ transform: "rotate(-90deg)" }}>
                      <circle cx="55" cy="55" r="44" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                      <circle cx="55" cy="55" r="44" fill="none"
                        stroke={cvAnalysisScore >= 75 ? "#22C55E" : cvAnalysisScore >= 60 ? "#F59E0B" : "#EF4444"}
                        strokeWidth="10"
                        strokeDasharray={`${2 * Math.PI * 44}`}
                        strokeDashoffset={`${2 * Math.PI * 44 * (1 - cvAnalysisScore / 100)}`}
                        strokeLinecap="round" />
                    </svg>
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                      <span style={{ fontSize: 26, fontWeight: 900, color: cvAnalysisScore >= 75 ? "#22C55E" : cvAnalysisScore >= 60 ? "#F59E0B" : "#EF4444", lineHeight: 1 }}>{cvAnalysisScore}%</span>
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>ATS score</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: cvAnalysisScore >= 75 ? "#22C55E" : cvAnalysisScore >= 60 ? "#F59E0B" : "#EF4444" }}>
                    {cvAnalysisScore >= 75 ? "Performing well" : cvAnalysisScore >= 60 ? "Needs improvement" : "Failing screening"}
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#FFFFFF", marginBottom: 12 }}>
                    {cvAnalysisScore >= 75
                      ? "Your CV is in good shape. AI tailoring can push it above 90% per role."
                      : "Most employers will never see your CV. Here is why:"}
                  </div>
                  {cvAnalysisWeaknesses.map((w, i) => (
                    <div key={i} style={{ background: "rgba(239,68,68,0.08)", borderLeft: "3px solid #EF4444", borderRadius: "0 8px 8px 0", padding: "9px 14px", marginBottom: 8, fontSize: 13, color: "#F09595", lineHeight: 1.5 }}>
                      ⚠️ {w}
                    </div>
                  ))}
                </div>
              </div>
              {/* Before / After preview */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
                <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#F09595", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Your CV now</div>
                  {["Generic language, no metrics", "Missing key ATS keywords", "Recruiters skip past it"].map((t, i) => (
                    <div key={i} style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>✗ {t}</div>
                  ))}
                </div>
                <div style={{ background: "rgba(200,230,0,0.05)", border: "1px solid rgba(200,230,0,0.15)", borderRadius: 12, padding: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#C8E600", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>After Jobsesame</div>
                  {["Impact metrics for every bullet", "90%+ ATS pass rate", "Recruiters call you back"].map((t, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#90C898", marginBottom: 4 }}>✓ {t}</div>
                  ))}
                </div>
              </div>
              <a href="/sign-up" style={{ display: "block", background: "#C8E600", color: "#052A14", fontSize: 15, fontWeight: 900, padding: "16px 0", borderRadius: 99, textDecoration: "none", textAlign: "center", marginBottom: 10, animation: "ctaGlow 2.5s ease-in-out infinite" }}>
                Fix all issues with AI — free →
              </a>
              <div style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.2)" }}>No credit card · Takes 30 seconds</div>
            </div>
          )}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ background: "#052A14", padding: isMobile ? "72px 20px" : "96px 28px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 48 : 64 }}>
            <div style={{ display: "inline-flex", alignItems: "center", background: "rgba(200,230,0,0.07)", border: "1px solid rgba(200,230,0,0.18)", borderRadius: 99, padding: "6px 18px", marginBottom: 24 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#C8E600", letterSpacing: "1.5px", textTransform: "uppercase" }}>Pricing</span>
            </div>
            <h2 style={{ fontSize: isMobile ? 30 : 48, fontWeight: 800, color: "#FFFFFF", lineHeight: 1.08, letterSpacing: -1.5, marginBottom: 16 }}>Simple pricing.<br /><span style={{ color: "#C8E600" }}>Serious results.</span></h2>
            <p style={{ fontSize: isMobile ? 14 : 17, color: "rgba(255,255,255,0.35)", maxWidth: 340, margin: "0 auto" }}>Start free. Upgrade when you are ready.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: 14, alignItems: "start" }}>
            {[
              { name: "Free", price: "R0", usdPrice: "$0", per: " forever", desc: "Get started instantly", features: ["3 Quick Apply credits", "AI CV analysis", "ATS score included", "Browse 495,000+ jobs", "No card needed"], popular: false, btn: "Get started free" },
              { name: "Credits", price: "R99", usdPrice: "$5", per: " per pack", desc: "Pay as you go", features: ["10 Quick Apply credits", "Credits never expire", "AI CV rewrite per job", "Cover letter generation", "All job categories"], popular: false, btn: "Buy credits" },
              { name: "Pro", price: "R249", usdPrice: "$14", per: " per month", desc: "For serious job seekers", features: ["Unlimited Quick Apply", "Unlimited CV rewrites", "Priority support", "Cover letters included", "Application tracking"], popular: true, btn: "Go Pro" },
            ].map(p => (
              <div key={p.name} style={{ background: p.popular ? "rgba(200,230,0,0.05)" : "rgba(255,255,255,0.03)", border: `1.5px solid ${p.popular ? "rgba(200,230,0,0.35)" : "rgba(255,255,255,0.07)"}`, borderRadius: 20, padding: "28px 22px", position: "relative" }}>
                {p.popular && <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "#C8E600", color: "#052A14", fontSize: 10, fontWeight: 800, padding: "4px 16px", borderRadius: 99, whiteSpace: "nowrap" }}>MOST POPULAR</div>}
                <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>{p.name}</div>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ fontSize: 40, fontWeight: 800, color: p.popular ? "#C8E600" : "#FFFFFF", lineHeight: 1 }}>{currency === 'ZAR' ? p.price : p.usdPrice}</span>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.25)" }}>{p.per}</span>
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginBottom: 20 }}>{p.desc}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                  {p.features.map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
                        <circle cx="8" cy="8" r="7" fill={p.popular ? "rgba(200,230,0,0.12)" : "rgba(255,255,255,0.05)"} />
                        <path d="M5 8L7 10.5L11 5.5" stroke={p.popular ? "#C8E600" : "rgba(255,255,255,0.35)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {f}
                    </div>
                  ))}
                </div>
                <a href="/sign-up" style={{ display: "block", background: p.popular ? "#C8E600" : "rgba(255,255,255,0.06)", color: p.popular ? "#052A14" : "rgba(255,255,255,0.75)", border: `1px solid ${p.popular ? "transparent" : "rgba(255,255,255,0.1)"}`, fontSize: 14, fontWeight: 800, padding: "13px 0", borderRadius: 99, textDecoration: "none", textAlign: "center" }}>{p.btn}</a>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>🔒 30-day money back guarantee. No questions asked.</span>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ background: "#020A04", padding: isMobile ? "72px 20px" : "96px 28px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: isMobile ? 40 : 52 }}>
            <div style={{ display: "inline-flex", alignItems: "center", background: "rgba(200,230,0,0.07)", border: "1px solid rgba(200,230,0,0.18)", borderRadius: 99, padding: "6px 18px", marginBottom: 24 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#C8E600", letterSpacing: "1.5px", textTransform: "uppercase" }}>FAQ</span>
            </div>
            <h2 style={{ fontSize: isMobile ? 30 : 48, fontWeight: 800, color: "#FFFFFF", lineHeight: 1.08, letterSpacing: -1.5, marginBottom: 16 }}>Everything you need<br />to know</h2>
            <p style={{ fontSize: isMobile ? 14 : 17, color: "rgba(255,255,255,0.35)", maxWidth: 360, margin: "0 auto 24px" }}>Got questions? We have answers.</p>
            <div style={{ position: "relative", maxWidth: 440, margin: "0 auto" }}>
              <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, color: "rgba(255,255,255,0.25)", pointerEvents: "none" }}>🔍</span>
              <input value={faqSearch} onChange={e => setFaqSearch(e.target.value)} placeholder="Search questions..." style={{ width: "100%", padding: "13px 16px 13px 40px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 14, color: "#FFFFFF", outline: "none", fontFamily: "inherit" }} />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {filteredFaqs.length === 0
              ? <div style={{ textAlign: "center", padding: "32px", color: "rgba(255,255,255,0.25)", fontSize: 14 }}>No questions match &ldquo;{faqSearch}&rdquo;</div>
              : filteredFaqs.map((faq, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${openFaq === i ? "rgba(200,230,0,0.22)" : "rgba(255,255,255,0.06)"}`, borderRadius: 14, overflow: "hidden", transition: "border-color 0.2s" }}>
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", gap: 12 }}>
                    <span style={{ fontSize: isMobile ? 14 : 15, fontWeight: 600, color: "rgba(255,255,255,0.8)", lineHeight: 1.4, flex: 1 }}>{faq.q}</span>
                    <span style={{ width: 24, height: 24, border: "1px solid rgba(200,230,0,0.25)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#C8E600", flexShrink: 0, transform: openFaq === i ? "rotate(45deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>+</span>
                  </button>
                  {openFaq === i && (
                    <div style={{ padding: "0 22px 20px", animation: "faqSlide 0.2s ease-out" }}>
                      <div style={{ height: 1, background: "rgba(255,255,255,0.05)", marginBottom: 14 }} />
                      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", lineHeight: 1.8, margin: 0 }}>{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{ background: "#052A14", padding: isMobile ? "88px 20px" : "120px 28px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 55% at 50% 50%,rgba(200,230,0,0.08) 0%,transparent 70%)", pointerEvents: "none", animation: "glowPulse 4s ease-in-out infinite" }} />
        <div style={{ maxWidth: 600, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <h2 style={{ fontSize: isMobile ? 32 : 56, fontWeight: 800, color: "#FFFFFF", lineHeight: 1.05, letterSpacing: -2, marginBottom: 16 }}>Stop sending CVs<br />into the void.</h2>
          <p style={{ fontSize: isMobile ? 16 : 19, color: "rgba(255,255,255,0.45)", lineHeight: 1.7, maxWidth: 440, margin: "0 auto 36px" }}>
            Join 2,400+ job seekers who stopped applying manually and started getting interviews.
          </p>
          <a href="/sign-up" style={{ background: "#C8E600", color: "#052A14", fontSize: isMobile ? 15 : 17, fontWeight: 800, padding: "18px 44px", borderRadius: 99, textDecoration: "none", display: "inline-block", animation: "ctaGlow 2.5s ease-in-out infinite", marginBottom: 28 }}>
            Get your first 3 applications free
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              {PHOTOS.map((src, i) => (
                <img key={i} src={src} crossOrigin="anonymous" loading="lazy" width={30} height={30} alt="Member"
                  style={{ borderRadius: "50%", border: "2px solid rgba(5,42,20,0.8)", marginLeft: i === 0 ? 0 : -7, zIndex: 5 - i, position: "relative", background: "#1A4A2A", objectFit: "cover" }} />
              ))}
            </div>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>2,400+ new members this week</span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#020804", borderTop: "1px solid rgba(255,255,255,0.04)", padding: isMobile ? "48px 20px 96px" : "64px 28px 32px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "2fr 1fr 1fr 1fr", gap: isMobile ? "32px 24px" : 40, marginBottom: 48 }}>
            <div style={{ gridColumn: isMobile ? "1 / -1" : "auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 30, height: 30, background: "#C8E600", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="17" height="17" viewBox="0 0 22 22" fill="none"><circle cx="9" cy="9" r="5.5" stroke="#052A14" strokeWidth="2.2" /><circle cx="9" cy="9" r="2.5" fill="#052A14" opacity="0.4" /><line x1="13.5" y1="13.5" x2="20" y2="20" stroke="#052A14" strokeWidth="2.8" strokeLinecap="round" /></svg>
                </div>
                <span style={{ fontSize: 16, fontWeight: 800 }}><span style={{ color: "#FFFFFF" }}>job</span><span style={{ color: "#C8E600" }}>sesame</span></span>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.18)", lineHeight: 1.8, maxWidth: 220, marginBottom: 10 }}>AI-powered job applications for professionals who refuse to be ignored.</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.1)", fontStyle: "italic" }}>&ldquo;Open sesame — your future awaits.&rdquo;</p>
            </div>
            {[
              { heading: "Product", links: [{ label: "Find Jobs", href: "/jobs" }, { label: "CV Optimiser", href: "/optimise" }, { label: "Dashboard", href: "/dashboard" }] },
              { heading: "Company", links: [{ label: "About", href: "/about" }, { label: "Recruiters", href: "/recruiters" }, { label: "Blog", href: "/blog" }, { label: "Contact", href: "mailto:hello@jobsesame.co.za" }] },
              { heading: "Legal", links: [{ label: "Privacy Policy", href: "/privacy" }, { label: "Terms of Service", href: "/terms" }] },
            ].map(col => (
              <div key={col.heading}>
                <div style={{ fontSize: 10, color: "#C8E600", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 16 }}>{col.heading}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {col.links.map(l => (
                    <a key={l.label} href={l.href} className="nav-link" style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", textDecoration: "none" }}>{l.label}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.12)" }}>© 2025 Jobsesame. All rights reserved.</span>
            <div style={{ display: "flex", gap: 20 }}>
              {["Twitter", "LinkedIn", "Instagram"].map(s => <span key={s} style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", cursor: "pointer" }}>{s}</span>)}
            </div>
          </div>
        </div>
      </footer>

      {/* MOBILE STICKY BOTTOM BAR */}
      {isMobile && !isSignedIn && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 300, background: "rgba(3,15,7,0.96)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(200,230,0,0.2)", padding: "12px 20px", paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}>
          <a href="/sign-up" style={{ display: "block", background: "#C8E600", color: "#052A14", fontSize: 15, fontWeight: 800, padding: "16px 24px", borderRadius: 99, textDecoration: "none", textAlign: "center", boxShadow: "0 4px 24px rgba(200,230,0,0.35)" }}>
            Get started free — 3 free applications
          </a>
        </div>
      )}
    </main>
  );
}
