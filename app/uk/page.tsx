'use client';
import { useEffect, useRef, useState } from 'react';
import { useAuth, UserButton } from '@clerk/nextjs';
import MarketSwitcher from '../components/MarketSwitcher';

interface UKJob {
  id: string; title: string; company: string; location: string;
  salary: string; source: string; tags: string[]; postedAt: string;
}

const TESTIMONIALS = [
  {
    name: 'Charlotte B.',
    role: 'Marketing Manager',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=64&h=64&fit=crop&crop=face',
    quote: 'I was sending out CVs for months and getting nothing back. Jobsesame rewrote my CV for each role and I had three interviews in the first week. The difference was night and day.',
    stat: '3 interviews', statSub: 'in week one',
  },
  {
    name: 'Kieran M.',
    role: 'Backend Developer',
    photo: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=64&h=64&fit=crop&crop=face',
    quote: 'My ATS score was 41%. After one rewrite it jumped to 94%. I had no idea how many keywords I was missing. Got a £72k offer within two weeks of signing up.',
    stat: '41% → 94%', statSub: 'ATS score',
  },
  {
    name: 'Fatima L.',
    role: 'Finance Analyst',
    photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=64&h=64&fit=crop&crop=face',
    quote: 'I used Reed and LinkedIn for months. Zero responses. Switched to Jobsesame — it applied to 25 roles automatically while I was at work. Two offers in three weeks.',
    stat: '2 job offers', statSub: 'in 3 weeks',
  },
];

const FEATURES = [
  { n: '01', title: 'AI rewrites your CV per job', body: 'Every application gets a version of your CV tailored to that exact role — keywords, structure, tone — in under 30 seconds.' },
  { n: '02', title: 'Auto-apply while you sleep', body: 'We fill and submit your application directly to UK employers, including Greenhouse-powered companies — no forms, no copy-paste.' },
  { n: '03', title: 'ATS score optimised to 90%+', body: 'UK employers filter 80% of CVs automatically. We ensure yours clears every keyword filter before a human reads a single line.' },
  { n: '04', title: 'British cover letter generator', body: 'AI writes a personalised, British-style cover letter for each role. Culturally accurate. Professionally worded. 15 seconds.' },
  { n: '05', title: 'Live UK salary intelligence', body: 'Know exactly what to ask for before your interview. Real salary benchmarks from live UK job postings — updated continuously.' },
  { n: '06', title: 'Full application tracker', body: 'Every application, every status update, every follow-up reminder — organised in one clean dashboard. Nothing slips through.' },
];

const COMPARISON = [
  { feature: 'AI CV rewrite per application', us: true, reed: false, linkedin: false, indeed: false },
  { feature: 'Auto-apply to employers', us: true, reed: false, linkedin: false, indeed: false },
  { feature: 'ATS score optimisation', us: true, reed: false, linkedin: '±', indeed: false },
  { feature: 'British cover letter AI', us: true, reed: false, linkedin: false, indeed: false },
  { feature: 'UK salary benchmarks', us: true, reed: '±', linkedin: '±', indeed: '±' },
  { feature: 'Application tracker', us: true, reed: false, linkedin: '±', indeed: false },
  { feature: 'Free to start', us: true, reed: true, linkedin: '±', indeed: true },
];

const SALARIES = [
  { role: 'Software Engineer', min: 55, max: 95, bar: 80 },
  { role: 'Data Scientist', min: 50, max: 85, bar: 73 },
  { role: 'Product Manager', min: 60, max: 100, bar: 85 },
  { role: 'UX Designer', min: 35, max: 65, bar: 55 },
  { role: 'Finance Analyst', min: 40, max: 75, bar: 63 },
  { role: 'Project Manager', min: 45, max: 75, bar: 65 },
  { role: 'Marketing Manager', min: 38, max: 70, bar: 58 },
  { role: 'NHS Nurse', min: 28, max: 48, bar: 42 },
];

const FAQS = [
  { q: 'Does this work for people already living in the UK?', a: 'Absolutely. Most of our UK users are already in the UK and struggling to get callbacks. The problem isn\'t your experience — it\'s that your CV isn\'t passing ATS filters. We fix that.' },
  { q: 'How is Jobsesame different from Reed, Indeed, or LinkedIn?', a: 'Reed and Indeed show you job listings. LinkedIn charges £30/month for basic features. None of them apply for you or rewrite your CV. Jobsesame does both — automatically — for a fraction of the cost.' },
  { q: 'What exactly does the AI change in my CV?', a: 'It adds the keywords from the job description, restructures your bullet points to match what that specific employer is looking for, and rewrites your profile statement. Your facts — job titles, companies, dates — are never changed.' },
  { q: 'How many applications can I send?', a: 'Free: browse jobs and save roles. Credits plan (£10 one-time): 20 tailored applications. Pro (£21/month): unlimited applications with priority matching.' },
  { q: 'Is my CV data safe?', a: 'Yes. We are GDPR compliant. Your CV and personal data are processed securely and are never sold to third parties. You can request full data deletion at any time from your account.' },
  { q: 'Will employers know the CV was AI-written?', a: 'No. The AI rewrites your real experience in your voice — it doesn\'t fabricate anything. It makes sure the right keywords are present and your achievements are framed for impact. Thousands of professionals use AI tools to polish their CVs.' },
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
  const [demoAts, setDemoAts] = useState(37);
  const [demoState, setDemoState] = useState<'idle' | 'running' | 'done'>('idle');
  const exitReadyRef = useRef(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    fetch('/api/jobs/uk').then(r => r.json())
      .then(d => { setJobs((d.jobs || []).slice(0, 6)); setJobsLoading(false); })
      .catch(() => setJobsLoading(false));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setNotifVisible(true), 3200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setSignupCount(Math.floor(Math.random() * 20) + 28);
    const iv = setInterval(() => setSignupCount(c => c + 1), 26000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { exitReadyRef.current = true; }, 5000);
    const fn = (e: MouseEvent) => {
      if (e.clientY < 5 && exitReadyRef.current && !exitDismissed) {
        setExitIntent(true); exitReadyRef.current = false;
      }
    };
    window.addEventListener('mousemove', fn);
    return () => { clearTimeout(t); window.removeEventListener('mousemove', fn); };
  }, [exitDismissed]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  const runDemo = () => {
    if (demoState === 'running') return;
    setDemoAts(37); setDemoState('running');
    let n = 37;
    const iv = setInterval(() => {
      n += 3;
      if (n >= 93) { setDemoAts(93); setDemoState('done'); clearInterval(iv); return; }
      setDemoAts(n);
    }, 40);
  };

  const atsColor = demoAts >= 80 ? '#C8E600' : demoAts >= 55 ? '#FFB800' : '#FF6B6B';

  return (
    <main style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: '#061A0C', margin: 0, padding: 0, overflowX: 'hidden' }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ctaGlow  { 0%,100%{box-shadow:0 4px 24px rgba(200,230,0,0.3)} 50%{box-shadow:0 4px 40px rgba(200,230,0,0.55)} }
        @keyframes notifIn  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes modalIn  { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
        @keyframes shimmer  { 0%,100%{opacity:.35} 50%{opacity:.6} }
        @keyframes pulse2   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }
        .nav-link:hover { color:#fff !important; }
        input::placeholder { color:rgba(255,255,255,.2); }
        input:focus { border-color:rgba(200,230,0,.4) !important; outline:none; }
        ::-webkit-scrollbar { width:3px; } ::-webkit-scrollbar-thumb { background:rgba(200,230,0,.12); border-radius:2px; }
        .feat-row { border-bottom: 1px solid rgba(255,255,255,.06); transition: background .15s; }
        .feat-row:hover { background: rgba(200,230,0,.03) !important; }
        .feat-row:last-child { border-bottom: none; }
        .job-card:hover .job-overlay { opacity: 1 !important; }
        .job-card .job-overlay { opacity: 0; transition: opacity .2s; }
        @media(max-width:767px){
          .hide-mobile { display:none !important; }
          .stack { flex-direction:column !important; }
          .full-mobile { width:100% !important; }
        }
      `}</style>

      {/* NOTIFICATION */}
      {notifVisible && (
        <div style={{ position:'fixed', bottom: isMobile ? 88 : 28, left:16, zIndex:400, animation:'notifIn .4s ease-out', background:'rgba(6,18,8,.97)', backdropFilter:'blur(16px)', border:'1px solid rgba(200,230,0,.15)', borderRadius:12, padding:'10px 14px', display:'flex', alignItems:'center', gap:10, maxWidth:268, boxShadow:'0 8px 40px rgba(0,0,0,.5)' }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:'#C8E600', flexShrink:0, animation:'pulse2 1.8s ease-in-out infinite' }} />
          <span style={{ fontSize:12, color:'rgba(255,255,255,.6)', lineHeight:1.4 }}>
            <strong style={{ color:'#fff' }}>{signupCount} people</strong> applied to UK jobs today
          </span>
          <button onClick={() => setNotifVisible(false)} style={{ background:'transparent', border:'none', color:'rgba(255,255,255,.18)', fontSize:13, cursor:'pointer', flexShrink:0, padding:0, lineHeight:1 }}>✕</button>
        </div>
      )}

      {/* EXIT INTENT */}
      {exitIntent && !exitDismissed && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.85)', zIndex:600, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#071E0E', border:'1.5px solid rgba(200,230,0,.32)', borderRadius:20, padding: isMobile ? '28px 22px' : '40px 36px', maxWidth:420, width:'100%', textAlign:'center', position:'relative', animation:'modalIn .22s ease-out' }}>
            <button onClick={() => { setExitIntent(false); setExitDismissed(true); }} style={{ position:'absolute', top:14, right:16, background:'transparent', border:'none', color:'rgba(255,255,255,.25)', fontSize:18, cursor:'pointer', lineHeight:1 }}>✕</button>
            <div style={{ width:44, height:44, background:'rgba(200,230,0,.12)', border:'1px solid rgba(200,230,0,.25)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, margin:'0 auto 18px' }}>↗</div>
            <h3 style={{ fontSize:22, fontWeight:800, color:'#fff', lineHeight:1.2, marginBottom:12 }}>Don&apos;t let another employer ghost you</h3>
            <p style={{ fontSize:14, color:'rgba(255,255,255,.42)', lineHeight:1.7, marginBottom:24 }}>Your next UK job is one AI-rewritten CV away. Start free — no credit card, no commitment.</p>
            <a href="/sign-up" onClick={() => setExitDismissed(true)} style={{ display:'block', background:'#C8E600', color:'#061A0C', fontSize:15, fontWeight:800, padding:'14px 32px', borderRadius:10, textDecoration:'none', marginBottom:10 }}>
              Start applying free →
            </a>
            <button onClick={() => { setExitIntent(false); setExitDismissed(true); }} style={{ background:'transparent', border:'none', fontSize:12, color:'rgba(255,255,255,.16)', cursor:'pointer' }}>No thanks, I enjoy being ignored</button>
          </div>
        </div>
      )}

      {/* NAV */}
      <nav style={{ position:'sticky', top:0, zIndex:200, height:64, padding:'0 24px', display:'flex', alignItems:'center', justifyContent:'space-between', background: scrolled ? 'rgba(6,18,8,.94)' : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none', WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none', borderBottom: scrolled ? '1px solid rgba(255,255,255,.05)' : 'none', transition:'all .3s', gap:12 }}>
        <a href="/uk" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none', flexShrink:0 }}>
          <span style={{ fontSize:18, fontWeight:800, letterSpacing:-.5 }}><span style={{ color:'#fff' }}>job</span><span style={{ color:'#C8E600' }}>sesame</span></span>
          <span style={{ fontSize:10, background:'rgba(200,230,0,.12)', color:'#C8E600', border:'1px solid rgba(200,230,0,.24)', borderRadius:4, padding:'2px 7px', fontWeight:700, letterSpacing:.3 }}>🇬🇧 UK</span>
        </a>

        <div className="hide-mobile" style={{ display:'flex', gap:2, alignItems:'center' }}>
          {[['Features','features'],['Jobs','jobs'],['Pricing','pricing'],['FAQ','faq']].map(([l,id]) => (
            <button key={id} onClick={() => scrollTo(id)} className="nav-link" style={{ background:'transparent', border:'none', fontSize:13, color:'rgba(255,255,255,.5)', fontWeight:500, padding:'8px 12px', borderRadius:6, cursor:'pointer', transition:'color .15s' }}>{l}</button>
          ))}
        </div>

        <div style={{ display:'flex', gap:8, alignItems:'center', flexShrink:0 }}>
          <MarketSwitcher compact={isMobile} />
          {!isMobile && !isSignedIn && <a href="/sign-in" className="nav-link" style={{ fontSize:13, color:'rgba(255,255,255,.45)', fontWeight:500, textDecoration:'none', padding:'8px 10px', transition:'color .15s' }}>Sign in</a>}
          {!isMobile && isSignedIn && <a href="/uk/dashboard" style={{ fontSize:13, color:'#C8E600', fontWeight:700, textDecoration:'none', padding:'8px 14px', background:'rgba(200,230,0,.08)', borderRadius:8, border:'1px solid rgba(200,230,0,.22)' }}>Dashboard</a>}
          {isSignedIn ? <UserButton afterSignOutUrl="/uk" /> : <a href="/sign-up" style={{ background:'#C8E600', color:'#061A0C', fontSize:13, fontWeight:800, padding:'9px 20px', borderRadius:8, textDecoration:'none', whiteSpace:'nowrap' }}>Get started free</a>}
          {isMobile && <button onClick={() => setMenuOpen(!menuOpen)} style={{ background:'transparent', border:'none', color:'rgba(255,255,255,.7)', fontSize:20, cursor:'pointer', padding:4, lineHeight:1 }}>{menuOpen ? '✕' : '☰'}</button>}
        </div>
      </nav>

      {/* MOBILE MENU */}
      {isMobile && menuOpen && (
        <div style={{ position:'fixed', top:64, left:0, right:0, background:'rgba(6,18,8,.99)', backdropFilter:'blur(20px)', zIndex:199, borderTop:'1px solid rgba(255,255,255,.05)', padding:'24px 24px 32px', display:'flex', flexDirection:'column', gap:14 }}>
          {[['Features','features'],['Jobs','jobs'],['Pricing','pricing'],['FAQ','faq']].map(([l,id]) => (
            <button key={id} onClick={() => scrollTo(id)} style={{ background:'transparent', border:'none', fontSize:16, color:'rgba(255,255,255,.7)', fontWeight:600, textAlign:'left', cursor:'pointer', padding:'4px 0' }}>{l}</button>
          ))}
          <div style={{ height:1, background:'rgba(255,255,255,.06)' }} />
          {isSignedIn
            ? <a href="/uk/dashboard" onClick={() => setMenuOpen(false)} style={{ fontSize:16, color:'#C8E600', fontWeight:700, textDecoration:'none' }}>UK Dashboard →</a>
            : <a href="/sign-up" onClick={() => setMenuOpen(false)} style={{ background:'#C8E600', color:'#061A0C', fontSize:15, fontWeight:800, padding:'14px 24px', borderRadius:8, textDecoration:'none', textAlign:'center' }}>Get started free</a>}
        </div>
      )}

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '56px 22px 48px' : '80px 40px 64px', maxWidth:1200, margin:'0 auto', animation:'fadeUp .55s ease-out' }}>
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 420px', gap: isMobile ? 40 : 64, alignItems:'center' }}>

          {/* Left: headline */}
          <div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:7, marginBottom:24, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.08)', borderRadius:6, padding:'5px 12px' }}>
              <span style={{ width:5, height:5, borderRadius:'50%', background:'#C8E600', display:'inline-block', flexShrink:0 }} />
              <span style={{ fontSize:12, color:'rgba(255,255,255,.5)', fontWeight:500, letterSpacing:.2 }}>UK job market · AI-powered applications</span>
            </div>

            <h1 style={{ fontSize: isMobile ? 'clamp(36px,10vw,46px)' : 'clamp(46px,4.5vw,64px)', fontWeight:800, color:'#fff', lineHeight:1.04, marginBottom:22, letterSpacing:-2 }}>
              Get every UK<br />job application<br /><span style={{ color:'#C8E600' }}>actually seen.</span>
            </h1>
            <p style={{ fontSize: isMobile ? 15 : 17, color:'rgba(255,255,255,.45)', lineHeight:1.72, maxWidth:480, marginBottom:32 }}>
              Upload your CV once. AI rewrites it for every UK role in 30 seconds and submits directly to employers — while you get on with your life.
            </p>

            <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:36 }}>
              <a href="/sign-up" style={{ background:'#C8E600', color:'#061A0C', fontSize: isMobile ? 14 : 15, fontWeight:800, padding: isMobile ? '13px 26px' : '14px 32px', borderRadius:8, textDecoration:'none', animation:'ctaGlow 2.5s ease-in-out infinite', whiteSpace:'nowrap', display:'inline-block' }}>
                Start applying free →
              </a>
              <button onClick={() => scrollTo('how-it-works')} style={{ background:'transparent', color:'rgba(255,255,255,.65)', fontSize: isMobile ? 14 : 15, fontWeight:600, padding: isMobile ? '13px 22px' : '14px 26px', borderRadius:8, border:'1px solid rgba(255,255,255,.1)', cursor:'pointer', whiteSpace:'nowrap' }}>
                How it works
              </button>
            </div>

            {/* Inline stats */}
            <div style={{ display:'flex', flexWrap:'wrap', gap: isMobile ? '8px 20px' : '6px 28px', paddingTop:24, borderTop:'1px solid rgba(255,255,255,.06)' }}>
              {[['30s','CV rewrite'],['90%+','ATS pass rate'],['£0','to start'],['2.5×','more interviews']].map(([n,l]) => (
                <div key={l} style={{ display:'flex', alignItems:'baseline', gap:6 }}>
                  <span style={{ fontSize: isMobile ? 18 : 22, fontWeight:800, color:'#C8E600', fontVariantNumeric:'tabular-nums', lineHeight:1 }}>{n}</span>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,.3)', fontWeight:500 }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: ATS demo */}
          <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.08)', borderRadius:16, padding: isMobile ? '22px 18px' : '28px 24px', flexShrink:0 }}>
            <div style={{ fontSize:12, color:'rgba(255,255,255,.32)', marginBottom:20, lineHeight:1.5 }}>See what happens to your ATS score</div>

            <div style={{ marginBottom:18 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:13, color:'rgba(255,255,255,.5)', fontWeight:600 }}>Without Jobsesame</span>
                <span style={{ fontSize:15, fontWeight:800, color:'#FF6B6B', fontVariantNumeric:'tabular-nums' }}>37%</span>
              </div>
              <div style={{ background:'rgba(255,255,255,.06)', borderRadius:3, height:8, overflow:'hidden' }}>
                <div style={{ width:'37%', height:'100%', background:'#FF6B6B', borderRadius:3 }} />
              </div>
              <div style={{ fontSize:11, color:'rgba(255,100,100,.7)', marginTop:6 }}>Rejected by ATS — never seen by a recruiter</div>
            </div>

            <div style={{ marginBottom:24 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:13, color:'rgba(255,255,255,.5)', fontWeight:600 }}>With Jobsesame</span>
                <span style={{ fontSize:15, fontWeight:800, color:atsColor, transition:'color .3s', fontVariantNumeric:'tabular-nums' }}>{demoAts}%</span>
              </div>
              <div style={{ background:'rgba(255,255,255,.06)', borderRadius:3, height:8, overflow:'hidden' }}>
                <div style={{ width:`${demoAts}%`, height:'100%', background:atsColor, borderRadius:3, transition:'width .08s linear' }} />
              </div>
              {demoState === 'done'
                ? <div style={{ fontSize:11, color:'#C8E600', marginTop:6 }}>Shortlisted — recruiter reads your CV</div>
                : <div style={{ fontSize:11, color:'rgba(255,255,255,.2)', marginTop:6 }}>Press the button to see what happens</div>}
            </div>

            <button onClick={runDemo} disabled={demoState === 'running'} style={{ width:'100%', background: demoState === 'done' ? 'transparent' : '#C8E600', color: demoState === 'done' ? '#C8E600' : '#061A0C', fontSize:13, fontWeight:800, padding:'12px 18px', borderRadius:8, border: demoState === 'done' ? '1px solid rgba(200,230,0,.3)' : 'none', cursor: demoState === 'running' ? 'not-allowed' : 'pointer', transition:'all .2s' }}>
              {demoState === 'idle' ? 'Optimise with AI →' : demoState === 'running' ? 'Rewriting...' : '✓ Start free — 2.5× more interviews'}
            </button>
          </div>
        </div>
      </section>

      {/* ── THE PROBLEM ──────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '52px 22px' : '72px 40px', borderTop:'1px solid rgba(255,255,255,.05)', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', display:'grid', gridTemplateColumns: isMobile ? '1fr' : '5fr 4fr', gap: isMobile ? 32 : 80, alignItems:'start' }}>
          <div>
            <p style={{ fontSize:12, color:'rgba(255,80,80,.7)', fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:16 }}>The UK hiring crisis</p>
            <h2 style={{ fontSize: isMobile ? 28 : 42, fontWeight:800, color:'#fff', lineHeight:1.1, marginBottom:20, letterSpacing:-1 }}>
              <span style={{ color:'#FF6B6B' }}>250 candidates</span><br />
              compete for every<br />UK job posting.
            </h2>
            <p style={{ fontSize:15, color:'rgba(255,255,255,.4)', lineHeight:1.75, marginBottom:28, maxWidth:520 }}>
              UK employers use ATS software to reject 80% of CVs before a human reads a single line. If your CV doesn&apos;t contain the exact keywords from the job description, you&apos;re invisible — regardless of your experience.
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:0, borderTop:'1px solid rgba(255,255,255,.06)' }}>
              {[
                { ok: false, text: 'You send a generic CV to 20 jobs' },
                { ok: false, text: 'ATS filters it out — no human ever sees it' },
                { ok: false, text: 'You get ghosted. Again.' },
                { ok: true,  text: 'Jobsesame rewrites your CV for each job' },
                { ok: true,  text: 'ATS score reaches 90%+ — you get shortlisted' },
                { ok: true,  text: 'Employers call you. Interviews happen.' },
              ].map(({ ok, text }, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, fontSize:14, color: ok ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.28)', textDecoration: !ok ? 'line-through' : 'none', padding:'13px 0', borderBottom:'1px solid rgba(255,255,255,.04)' }}>
                  <span style={{ fontSize:12, color: ok ? '#C8E600' : 'rgba(255,80,80,.5)', flexShrink:0, fontWeight:700 }}>{ok ? '✓' : '✕'}</span>
                  {text}
                </div>
              ))}
            </div>
          </div>

          <div style={{ paddingTop: isMobile ? 0 : 8 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {[
                { label: '80%', sub: 'of CVs auto-rejected', accent: '#FF6B6B' },
                { label: '250×', sub: 'avg UK applicants per role', accent: '#FF6B6B' },
                { label: '6 sec', sub: 'average CV scan time', accent: '#FFB800' },
                { label: '93%', sub: 'improvement with AI rewrite', accent: '#C8E600' },
              ].map(({ label, sub, accent }) => (
                <div key={sub} style={{ padding:'18px 20px', borderRadius:10, border:'1px solid rgba(255,255,255,.06)', background:'rgba(255,255,255,.02)', display:'flex', alignItems:'center', gap:18 }}>
                  <span style={{ fontSize: isMobile ? 30 : 36, fontWeight:800, color:accent, lineHeight:1, fontVariantNumeric:'tabular-nums', flexShrink:0 }}>{label}</span>
                  <span style={{ fontSize:13, color:'rgba(255,255,255,.45)', lineHeight:1.4 }}>{sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ padding: isMobile ? '60px 22px' : '88px 40px', maxWidth:1200, margin:'0 auto' }}>
        <h2 style={{ fontSize: isMobile ? 28 : 40, fontWeight:800, color:'#fff', letterSpacing:-1, marginBottom: isMobile ? 36 : 52 }}>From CV to UK job offer</h2>
        <div style={{ display:'flex', flexDirection:'column', gap:0, borderTop:'1px solid rgba(255,255,255,.06)' }}>
          {[
            { n:'01', title:'Upload your CV once', body:'Paste in or upload your existing CV. Took you years to write — you should only have to do it once. We handle everything from here.' },
            { n:'02', title:'AI rewrites it per job', body:'For every UK role you want, our AI rewrites your CV to match exactly what that employer needs — keywords, structure, bullet points — in 30 seconds.' },
            { n:'03', title:'We submit for you', body:'One click. Your tailored CV and cover letter go directly to the employer. No application forms. No copy-paste. No wasted evenings.' },
          ].map(s => (
            <div key={s.n} style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '120px 1fr', gap: isMobile ? 12 : 48, padding: isMobile ? '28px 0' : '36px 0', borderBottom:'1px solid rgba(255,255,255,.05)', alignItems:'start' }}>
              <div style={{ fontSize: isMobile ? 38 : 52, fontWeight:800, color:'rgba(200,230,0,.18)', lineHeight:1, letterSpacing:-2, fontVariantNumeric:'tabular-nums' }}>{s.n}</div>
              <div>
                <h3 style={{ fontSize: isMobile ? 18 : 22, fontWeight:800, color:'#fff', marginBottom:10, letterSpacing:-.4 }}>{s.title}</h3>
                <p style={{ fontSize:14, color:'rgba(255,255,255,.4)', lineHeight:1.75 }}>{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section id="features" style={{ padding: isMobile ? '56px 22px' : '80px 40px', borderTop:'1px solid rgba(255,255,255,.05)', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap:16, marginBottom: isMobile ? 36 : 52 }}>
            <h2 style={{ fontSize: isMobile ? 28 : 40, fontWeight:800, color:'#fff', letterSpacing:-1, lineHeight:1.1 }}>Built for the UK<br />job market</h2>
            <a href="/sign-up" style={{ background:'rgba(200,230,0,.1)', color:'#C8E600', fontSize:13, fontWeight:700, padding:'10px 20px', borderRadius:8, textDecoration:'none', border:'1px solid rgba(200,230,0,.2)', whiteSpace:'nowrap', flexShrink:0 }}>
              Start free →
            </a>
          </div>
          <div style={{ borderTop:'1px solid rgba(255,255,255,.06)' }}>
            {FEATURES.map(f => (
              <div key={f.n} className="feat-row" style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '200px 1fr', gap: isMobile ? 8 : 48, padding: isMobile ? '22px 0' : '26px 0', alignItems:'start' }}>
                <div>
                  <span style={{ fontSize:11, fontWeight:700, color:'rgba(200,230,0,.4)', letterSpacing:'1px', marginRight:12, fontVariantNumeric:'tabular-nums' }}>{f.n}</span>
                  <span style={{ fontSize: isMobile ? 15 : 16, fontWeight:800, color:'#fff', letterSpacing:-.2 }}>{f.title}</span>
                </div>
                <p style={{ fontSize:14, color:'rgba(255,255,255,.38)', lineHeight:1.72, paddingTop: isMobile ? 0 : 2 }}>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '60px 22px' : '88px 40px', maxWidth:1200, margin:'0 auto' }}>
        <h2 style={{ fontSize: isMobile ? 28 : 40, fontWeight:800, color:'#fff', letterSpacing:-1, marginBottom: isMobile ? 40 : 60 }}>UK professionals<br />getting hired</h2>
        <div style={{ display:'flex', flexDirection:'column', gap:0, borderTop:'1px solid rgba(255,255,255,.06)' }}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 220px', gap: isMobile ? 20 : 48, padding: isMobile ? '32px 0' : '44px 0', borderBottom:'1px solid rgba(255,255,255,.05)', alignItems:'center' }}>
              <div>
                <div style={{ display:'flex', gap:2, marginBottom:16 }}>{Array.from({length:5}).map((_,i) => <span key={i} style={{ color:'#C8E600', fontSize:14 }}>★</span>)}</div>
                <p style={{ fontSize: isMobile ? 17 : 21, fontWeight:600, color:'rgba(255,255,255,.82)', lineHeight:1.55, fontStyle:'italic', marginBottom:20, letterSpacing:-.2 }}>&ldquo;{t.quote}&rdquo;</p>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <img src={t.photo} alt={t.name} width={38} height={38} style={{ borderRadius:'50%', objectFit:'cover', flexShrink:0 }} />
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{t.name}</div>
                    <div style={{ fontSize:12, color:'rgba(255,255,255,.3)', marginTop:1 }}>{t.role}</div>
                  </div>
                </div>
              </div>
              <div style={{ background:'rgba(200,230,0,.07)', border:'1px solid rgba(200,230,0,.14)', borderRadius:12, padding:'20px 22px' }}>
                <div style={{ fontSize: isMobile ? 28 : 34, fontWeight:800, color:'#C8E600', lineHeight:1, marginBottom:6, fontVariantNumeric:'tabular-nums' }}>{t.stat}</div>
                <div style={{ fontSize:12, color:'rgba(255,255,255,.38)' }}>{t.statSub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── vs COMPETITORS ────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '52px 22px' : '76px 40px', borderTop:'1px solid rgba(255,255,255,.05)', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
        <div style={{ maxWidth:860, margin:'0 auto' }}>
          <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight:800, color:'#fff', letterSpacing:-.8, marginBottom: isMobile ? 28 : 40 }}>Why professionals<br />choose Jobsesame</h2>
          <div style={{ borderRadius:14, overflow:'hidden', border:'1px solid rgba(255,255,255,.07)' }}>
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', background:'rgba(255,255,255,.04)', borderBottom:'1px solid rgba(255,255,255,.07)', padding: isMobile ? '12px 14px' : '14px 22px', gap:8 }}>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.3)', fontWeight:600 }}>Feature</div>
              {['Jobsesame','Reed','LinkedIn','Indeed'].map(h => (
                <div key={h} style={{ fontSize:10, fontWeight:700, color: h === 'Jobsesame' ? '#C8E600' : 'rgba(255,255,255,.3)', textAlign:'center', letterSpacing:.3 }}>{h}</div>
              ))}
            </div>
            {COMPARISON.map((row, i) => (
              <div key={row.feature} style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr 1fr', padding: isMobile ? '11px 14px' : '13px 22px', gap:8, borderBottom: i < COMPARISON.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none', alignItems:'center' }}>
                <div style={{ fontSize: isMobile ? 12 : 13, color:'rgba(255,255,255,.55)', fontWeight:500 }}>{row.feature}</div>
                {[row.us, row.reed, row.linkedin, row.indeed].map((val, j) => (
                  <div key={j} style={{ textAlign:'center', fontSize:14 }}>
                    {val === true ? <span style={{ color:'#C8E600', fontWeight:700 }}>✓</span> : val === '±' ? <span style={{ color:'rgba(255,180,0,.65)', fontSize:12 }}>±</span> : <span style={{ color:'rgba(255,80,80,.4)' }}>✕</span>}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p style={{ fontSize:11, color:'rgba(255,255,255,.15)', marginTop:12 }}>± = partial / paid tier only</p>
        </div>
      </section>

      {/* ── LIVE JOBS ─────────────────────────────────────────────────── */}
      <section id="jobs" style={{ padding: isMobile ? '60px 22px' : '88px 40px', maxWidth:1200, margin:'0 auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap:16, marginBottom: isMobile ? 28 : 40 }}>
          <div>
            <h2 style={{ fontSize: isMobile ? 26 : 38, fontWeight:800, color:'#fff', letterSpacing:-.8, marginBottom:8 }}>UK jobs available right now</h2>
            <p style={{ fontSize:13, color:'rgba(255,255,255,.3)' }}>Refreshed every 30 minutes · Adzuna · JSearch · Remotive</p>
          </div>
          <a href="/sign-up" style={{ background:'rgba(200,230,0,.1)', color:'#C8E600', fontSize:13, fontWeight:700, padding:'10px 20px', borderRadius:8, textDecoration:'none', border:'1px solid rgba(200,230,0,.2)', whiteSpace:'nowrap', flexShrink:0 }}>
            Unlock all jobs →
          </a>
        </div>
        {jobsLoading ? (
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:12 }}>
            {Array.from({length:6}).map((_,i) => <div key={i} style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.05)', borderRadius:12, height:100, animation:'shimmer 1.5s ease-in-out infinite' }} />)}
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:12 }}>
            {jobs.map(job => (
              <div key={job.id} className="job-card" style={{ position:'relative', borderRadius:12, overflow:'hidden', cursor:'pointer' }}>
                <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.07)', borderRadius:12, padding:'18px 20px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10, marginBottom:6 }}>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{job.title}</div>
                      <div style={{ fontSize:12, color:'rgba(255,255,255,.4)' }}>{job.company}</div>
                    </div>
                    {job.salary && <div style={{ fontSize:12, color:'#C8E600', fontWeight:800, whiteSpace:'nowrap', flexShrink:0 }}>{job.salary}</div>}
                  </div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,.28)', marginBottom:10 }}>📍 {job.location}</div>
                  <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                    {job.tags.slice(0,2).map(t => <span key={t} style={{ fontSize:10, color:'rgba(255,255,255,.35)', background:'rgba(255,255,255,.05)', borderRadius:4, padding:'3px 8px', fontWeight:600 }}>{t}</span>)}
                    <span style={{ fontSize:10, color:'rgba(255,255,255,.2)', borderRadius:4, padding:'3px 8px' }}>{job.source}</span>
                  </div>
                </div>
                <div className="job-overlay" style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,transparent 15%,rgba(6,26,12,.97) 100%)', borderRadius:12, display:'flex', alignItems:'flex-end', justifyContent:'center', paddingBottom:14 }}>
                  <a href="/sign-up" style={{ background:'#C8E600', color:'#061A0C', fontSize:12, fontWeight:800, padding:'8px 20px', borderRadius:8, textDecoration:'none' }}>Apply with AI →</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── SALARY INTELLIGENCE ──────────────────────────────────────── */}
      <section id="salaries" style={{ padding: isMobile ? '56px 22px' : '80px 40px', borderTop:'1px solid rgba(255,255,255,.05)', borderBottom:'1px solid rgba(255,255,255,.05)' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap:16, marginBottom: isMobile ? 28 : 44 }}>
            <div>
              <h2 style={{ fontSize: isMobile ? 26 : 38, fontWeight:800, color:'#fff', letterSpacing:-.8, marginBottom:8 }}>Know your worth before<br />you negotiate</h2>
              <p style={{ fontSize:13, color:'rgba(255,255,255,.3)' }}>Live Adzuna UK data · London &amp; nationwide · 2025</p>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:0, borderTop:'1px solid rgba(255,255,255,.06)' }}>
            {SALARIES.map(({ role, min, max, bar }) => (
              <div key={role} style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '200px 1fr 100px', gap: isMobile ? 8 : 24, padding: isMobile ? '16px 0' : '18px 0', borderBottom:'1px solid rgba(255,255,255,.04)', alignItems:'center' }}>
                <span style={{ fontSize:14, color:'rgba(255,255,255,.65)', fontWeight:600 }}>{role}</span>
                <div style={{ background:'rgba(255,255,255,.06)', borderRadius:3, height:5, overflow:'hidden', flex:1 }}>
                  <div style={{ width:`${bar}%`, height:'100%', background:'linear-gradient(to right,rgba(200,230,0,.4),#C8E600)', borderRadius:3 }} />
                </div>
                <span style={{ fontSize:13, color:'#C8E600', fontWeight:800, textAlign: isMobile ? 'left' : 'right', fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap' }}>£{min}k–£{max}k</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: isMobile ? '60px 22px' : '88px 40px', maxWidth:1200, margin:'0 auto' }}>
        <div style={{ marginBottom: isMobile ? 36 : 52 }}>
          <h2 style={{ fontSize: isMobile ? 28 : 42, fontWeight:800, color:'#fff', letterSpacing:-1.2, marginBottom:12 }}>Less than a day&apos;s pay<br />to land your next job</h2>
          <p style={{ fontSize:15, color:'rgba(255,255,255,.35)' }}>One UK salary negotiation pays for years of Pro.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap:16, alignItems:'start' }}>
          {[
            {
              name:'Free', price:'£0', period:'', tag:null, hi:false,
              features:[{t:'Browse all UK jobs',ok:true},{t:'Save jobs',ok:true},{t:'Basic job search',ok:true},{t:'AI CV rewriter',ok:false},{t:'Auto-apply',ok:false}],
              cta:'Start browsing free', href:'/sign-up', type:'link' as const,
            },
            {
              name:'Credits', price:'£10', period:'one-time', tag:'Best value', hi:true,
              features:[{t:'20 UK applications',ok:true},{t:'AI CV rewriter',ok:true},{t:'Auto-apply to employers',ok:true},{t:'British cover letter',ok:true},{t:'Application tracker',ok:true}],
              cta:'Buy Credits', href:'/uk/subscribe', type:'soon' as const,
            },
            {
              name:'Pro', price:'£21', period:'/month', tag:null, hi:false,
              features:[{t:'Unlimited applications',ok:true},{t:'Priority job matching',ok:true},{t:'UK CV rewriter ∞',ok:true},{t:'Cover letter generator',ok:true},{t:'UK salary intelligence',ok:true}],
              cta:'Subscribe Pro', href:'/uk/subscribe', type:'soon' as const,
            },
          ].map(plan => (
            <div key={plan.name} style={{ background: plan.hi ? 'rgba(200,230,0,.05)' : 'rgba(255,255,255,.02)', border:`1.5px solid ${plan.hi ? 'rgba(200,230,0,.28)' : 'rgba(255,255,255,.07)'}`, borderRadius:16, padding:'26px 22px', position:'relative' }}>
              {plan.tag && <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:'#C8E600', color:'#061A0C', fontSize:10, fontWeight:800, padding:'3px 12px', borderRadius:4, whiteSpace:'nowrap', letterSpacing:.3 }}>{plan.tag}</div>}
              <div style={{ fontSize:11, color:'rgba(255,255,255,.35)', fontWeight:700, textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:8 }}>{plan.name}</div>
              <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:20 }}>
                <span style={{ fontSize:42, fontWeight:800, color:'#fff', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>{plan.price}</span>
                {plan.period && <span style={{ fontSize:13, color:'rgba(255,255,255,.3)' }}>{plan.period}</span>}
              </div>
              <div style={{ height:1, background:'rgba(255,255,255,.06)', marginBottom:18 }} />
              <ul style={{ listStyle:'none', padding:0, margin:'0 0 22px', display:'flex', flexDirection:'column', gap:10 }}>
                {plan.features.map(f => (
                  <li key={f.t} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color: f.ok ? 'rgba(255,255,255,.68)' : 'rgba(255,255,255,.2)' }}>
                    <span style={{ color: f.ok ? '#C8E600' : 'rgba(255,255,255,.12)', flexShrink:0, fontSize:12, fontWeight:700 }}>{f.ok ? '✓' : '✕'}</span>{f.t}
                  </li>
                ))}
              </ul>
              {plan.type === 'link' ? (
                <a href={plan.href} style={{ display:'block', textAlign:'center', background: plan.hi ? '#C8E600' : 'rgba(255,255,255,.07)', color: plan.hi ? '#061A0C' : 'rgba(255,255,255,.6)', fontSize:13, fontWeight:800, padding:'12px 18px', borderRadius:8, textDecoration:'none' }}>{plan.cta}</a>
              ) : (
                <a href={plan.href} style={{ display:'block', textAlign:'center', background:'rgba(255,255,255,.05)', color:'rgba(255,255,255,.45)', fontSize:13, fontWeight:700, padding:'12px 18px', borderRadius:8, textDecoration:'none', border:'1px solid rgba(255,255,255,.08)' }}>
                  {plan.cta} <span style={{ fontSize:10, color:'rgba(200,230,0,.5)', marginLeft:4 }}>· soon</span>
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section id="faq" style={{ padding: isMobile ? '52px 22px' : '76px 40px', borderTop:'1px solid rgba(255,255,255,.05)', maxWidth:860, margin:'0 auto' }}>
        <h2 style={{ fontSize: isMobile ? 26 : 38, fontWeight:800, color:'#fff', letterSpacing:-.8, marginBottom: isMobile ? 32 : 48 }}>Questions answered</h2>
        <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ borderBottom:'1px solid rgba(255,255,255,.05)' }}>
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width:'100%', background:'transparent', border:'none', padding:'18px 0', display:'flex', justifyContent:'space-between', alignItems:'center', gap:16, cursor:'pointer', textAlign:'left' }}>
                <span style={{ fontSize:15, fontWeight:700, color:'#fff', lineHeight:1.4 }}>{faq.q}</span>
                <span style={{ fontSize:18, color:'#C8E600', flexShrink:0, transform: openFaq === i ? 'rotate(45deg)' : 'none', transition:'transform .18s', lineHeight:1 }}>+</span>
              </button>
              {openFaq === i && <div style={{ paddingBottom:18, fontSize:14, color:'rgba(255,255,255,.45)', lineHeight:1.78 }}>{faq.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '60px 22px 80px' : '88px 40px 112px', maxWidth:860, margin:'0 auto', textAlign: isMobile ? 'center' : 'left' }}>
        <h2 style={{ fontSize: isMobile ? 32 : 52, fontWeight:800, color:'#fff', lineHeight:1.06, marginBottom:18, letterSpacing:-1.5 }}>
          Your next UK job.<br /><span style={{ color:'#C8E600' }}>Starts today.</span>
        </h2>
        <p style={{ fontSize:16, color:'rgba(255,255,255,.38)', marginBottom:28, lineHeight:1.65 }}>No credit card. No commitment. Start free and see the difference.</p>
        <a href="/sign-up" style={{ display:'inline-block', background:'#C8E600', color:'#061A0C', fontSize: isMobile ? 15 : 17, fontWeight:800, padding: isMobile ? '15px 32px' : '16px 44px', borderRadius:8, textDecoration:'none', animation:'ctaGlow 2.5s ease-in-out infinite' }}>
          Start applying free →
        </a>
        <p style={{ fontSize:12, color:'rgba(255,255,255,.15)', marginTop:14 }}>Free forever · GDPR compliant · Cancel anytime</p>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer style={{ background:'#040F07', borderTop:'1px solid rgba(255,255,255,.04)', padding: isMobile ? '44px 22px 80px' : '56px 40px 32px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '2fr 1fr 1fr 1fr', gap: isMobile ? '28px 20px' : 40, marginBottom:44 }}>
            <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                <span style={{ fontSize:15, fontWeight:800 }}><span style={{ color:'#fff' }}>job</span><span style={{ color:'#C8E600' }}>sesame</span></span>
                <span style={{ fontSize:10, background:'rgba(200,230,0,.1)', color:'#C8E600', border:'1px solid rgba(200,230,0,.2)', borderRadius:4, padding:'2px 7px', fontWeight:700 }}>🇬🇧 UK</span>
              </div>
              <p style={{ fontSize:13, color:'rgba(255,255,255,.15)', lineHeight:1.75, maxWidth:200, marginBottom:8 }}>AI-powered job applications. Built for the UK market.</p>
              <p style={{ fontSize:11, color:'rgba(255,255,255,.1)', marginBottom:4 }}>GDPR compliant · United Kingdom</p>
              <a href="mailto:uk@jobsesame.co.za" style={{ fontSize:11, color:'rgba(255,255,255,.15)', textDecoration:'none' }}>uk@jobsesame.co.za</a>
            </div>
            {[
              { h:'Product', links:[['UK Jobs','#jobs'],['Pricing','#pricing'],['Dashboard','/uk/dashboard'],['CV Optimiser','/optimise']] },
              { h:'Company', links:[['About','/about'],['Blog','/blog'],['Recruiters','/recruiters'],['Contact','mailto:uk@jobsesame.co.za']] },
              { h:'Legal',   links:[['Privacy Policy','/privacy'],['Terms','/terms'],['Refund Policy','/refund'],['Delete Data','/delete-data']] },
            ].map(col => (
              <div key={col.h}>
                <div style={{ fontSize:11, color:'rgba(255,255,255,.2)', fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:14 }}>{col.h}</div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {col.links.map(([l,h]) => <a key={l} href={h} className="nav-link" style={{ fontSize:13, color:'rgba(255,255,255,.2)', textDecoration:'none', transition:'color .15s' }}>{l}</a>)}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop:'1px solid rgba(255,255,255,.04)', paddingTop:18, display:'flex', flexWrap:'wrap', gap:12, alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:11, color:'rgba(255,255,255,.1)' }}>© 2025 Jobsesame. All rights reserved. GDPR compliant.</span>
            <div style={{ display:'flex', gap:18 }}>
              {['Twitter','LinkedIn'].map(s => <span key={s} style={{ fontSize:11, color:'rgba(255,255,255,.12)', cursor:'pointer' }}>{s}</span>)}
            </div>
          </div>
        </div>
      </footer>

      {/* MOBILE STICKY CTA */}
      {isMobile && !isSignedIn && (
        <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:300, background:'rgba(4,12,6,.97)', backdropFilter:'blur(20px)', borderTop:'1px solid rgba(200,230,0,.14)', padding:'10px 16px', paddingBottom:'calc(10px + env(safe-area-inset-bottom))' }}>
          <a href="/sign-up" style={{ display:'block', background:'#C8E600', color:'#061A0C', fontSize:15, fontWeight:800, padding:'14px 20px', borderRadius:8, textDecoration:'none', textAlign:'center' }}>
            Start applying free — 3 on us
          </a>
        </div>
      )}
    </main>
  );
}
