'use client';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import Image from 'next/image';
import NavUK from '../components/NavUK';
import FooterUK from '../components/FooterUK';

interface UKJob {
  id: string; title: string; company: string; location: string;
  salary: string; source: string; tags: string[]; postedAt: string;
}

const TESTIMONIALS = [
  {
    name: 'Charlotte B.',
    role: 'Marketing Manager · London',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=64&h=64&fit=crop&crop=face',
    quote: 'I was sending out CVs for months and getting nothing back. Jobsesame rewrote my CV for each role and I had three interviews in the first week. The difference was night and day.',
    stat: '3 interviews', statSub: 'in week one',
  },
  {
    name: 'Kieran M.',
    role: 'Backend Developer · Manchester',
    photo: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=64&h=64&fit=crop&crop=face',
    quote: 'My ATS score was 41%. After one AI rewrite it jumped to 94%. I had no idea how many keywords I was missing. Got a £72k offer within two weeks of signing up.',
    stat: '41% → 94%', statSub: 'ATS score jump',
  },
  {
    name: 'Fatima L.',
    role: 'Finance Analyst · Birmingham',
    photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=64&h=64&fit=crop&crop=face',
    quote: 'I used Reed and LinkedIn for months. Zero responses. Switched to Jobsesame — had 25 tailored CVs out within days while I was at work. Two offers in three weeks.',
    stat: '2 job offers', statSub: 'in 3 weeks',
  },
];

const FEATURES = [
  { n: '01', title: 'AI rewrites your CV per job', body: 'Every application gets a version of your CV tailored to that exact role — the right keywords, restructured bullet points, and a rewritten summary — in under 30 seconds.' },
  { n: '02', title: 'AI-assisted fast-track apply', body: 'For Greenhouse-powered UK employers, your application is submitted automatically. For all other roles, we open the employer portal with your tailored CV pre-loaded — you apply in under 30 seconds.' },
  { n: '03', title: 'ATS score optimised to 90%+', body: 'UK employers filter 80% of CVs automatically. We make sure yours contains the exact keywords ATS systems look for before a human reads a single line.' },
  { n: '04', title: 'British cover letter generator', body: 'AI writes a personalised, British-style cover letter for each role. Culturally accurate, professionally worded, and tailored to the specific employer in 15 seconds.' },
  { n: '05', title: 'Live UK salary intelligence', body: 'Know exactly what to negotiate before your interview. Real salary benchmarks pulled from live UK job postings — updated continuously so you never undersell yourself.' },
  { n: '06', title: 'Full application tracker', body: 'Every application, every status, every follow-up reminder — in one clean dashboard. Nothing slips through the cracks.' },
];

const COMPARISON = [
  { feature: 'AI CV rewrite per application', us: true, reed: false, linkedin: false, indeed: false },
  { feature: 'AI-assisted fast apply', us: true, reed: false, linkedin: false, indeed: false },
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
  { role: 'DevOps Engineer', min: 55, max: 90, bar: 76 },
  { role: 'Business Analyst', min: 40, max: 72, bar: 60 },
];

const FAQS = [
  { q: 'Does this work for people already living in the UK?', a: 'Absolutely. The majority of our UK users are already in the UK and struggling to get callbacks. The problem is rarely your experience — it\'s that your CV isn\'t passing ATS filters. We fix that in 30 seconds.' },
  { q: 'Does auto-apply work for all UK employers?', a: 'For companies using Greenhouse-powered portals, applications are submitted automatically. For all other roles, we open the employer\'s application page with your AI-rewritten CV ready — you complete the submission in under 30 seconds. No blank forms, no copy-paste.' },
  { q: 'How is Jobsesame different from Reed, Indeed, or LinkedIn?', a: 'Reed and Indeed are job boards — they show you listings. LinkedIn charges £30/month just for basic features. None of them rewrite your CV per role or help you apply faster. Jobsesame rewrites your CV for every role in 30 seconds and helps you apply in under a minute.' },
  { q: 'What exactly does the AI change in my CV?', a: 'It adds the keywords from the job description, restructures your bullet points to match what that employer is looking for, and rewrites your profile statement. Your facts — job titles, company names, dates, qualifications — are never changed or fabricated.' },
  { q: 'How many applications can I send?', a: 'Free plan: browse and save jobs, no applications. Credits (£10 one-time): 20 AI-tailored applications. Pro (£21/month): unlimited applications with priority job matching and full dashboard.' },
  { q: 'Is my CV data safe?', a: 'Yes. We are fully GDPR compliant for UK users. Your CV and personal data are processed securely, never sold to third parties, and you can request full data deletion at any time from your account.' },
  { q: 'Will employers know the CV was AI-written?', a: 'No. The AI rewrites your real experience in your own voice — it never fabricates anything. It ensures the right keywords are present and your achievements are framed for maximum impact. Thousands of UK professionals use AI tools to polish their CVs.' },
  { q: 'Can I apply from outside the UK?', a: 'Yes. You do not need to be in the UK to apply. We handle the application on your behalf. Just make sure your CV mentions your visa status or right-to-work eligibility where relevant.' },
];

const PHOTOS = [
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=48&h=48&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=48&h=48&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=48&h=48&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=48&h=48&fit=crop&crop=face',
];

export const dynamic = 'force-dynamic';

export default function UKPage() {
  const { isSignedIn } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [jobs, setJobs] = useState<UKJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [exitIntent, setExitIntent] = useState(false);
  const [exitDismissed, setExitDismissed] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);
  const [signupCount, setSignupCount] = useState(0);
  const [demoAts, setDemoAts] = useState(37);
  const [demoState, setDemoState] = useState<'idle' | 'running' | 'done'>('idle');
  const [scrollPct, setScrollPct] = useState(0);
  const exitReadyRef = useRef(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
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

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      setScrollPct((window.scrollY / (doc.scrollHeight - doc.clientHeight)) * 100);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
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
  const BG = '#061A0C';
  const DIVIDE = '1px solid rgba(255,255,255,0.05)';

  return (
    <main style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: BG, margin: 0, padding: 0, overflowX: 'hidden' }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeInUp  { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ctaGlow   { 0%,100%{box-shadow:0 4px 24px rgba(200,230,0,0.3)} 50%{box-shadow:0 4px 40px rgba(200,230,0,0.55)} }
        @keyframes notifIn   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes modalIn   { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
        @keyframes shimmer   { 0%,100%{opacity:.35} 50%{opacity:.6} }
        @keyframes pulse2    { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }
        @keyframes spinUK    { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        input::placeholder { color:rgba(255,255,255,.2); }
        input:focus { border-color:rgba(200,230,0,.4) !important; outline:none; }
        ::-webkit-scrollbar { width:8px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(200,230,0,.35); border-radius:4px; }
        ::-webkit-scrollbar-thumb:hover { background:rgba(200,230,0,.55); }
        .feat-row { border-bottom:1px solid rgba(255,255,255,.06); transition:background .15s; }
        .feat-row:hover { background:rgba(200,230,0,.025) !important; }
        .feat-row:last-child { border-bottom:none; }
        .job-card:hover .job-overlay { opacity:1 !important; }
        .job-card .job-overlay { opacity:0; transition:opacity .2s; }
        .faq-btn:hover { background:rgba(255,255,255,.02) !important; }
        @media(max-width:767px){
          .hide-mobile { display:none !important; }
          .stack { flex-direction:column !important; }
          .full-mobile { width:100% !important; }
        }
      `}</style>

      {/* NOTIFICATION */}
      {notifVisible && (
        <div style={{ position:'fixed', bottom: isMobile ? 88 : 28, left:16, zIndex:400, animation:'notifIn .4s ease-out', background:'rgba(6,18,8,.97)', backdropFilter:'blur(16px)', border:'1px solid rgba(200,230,0,.15)', borderRadius:12, padding:'10px 14px', display:'flex', alignItems:'center', gap:10, maxWidth:272, boxShadow:'0 8px 40px rgba(0,0,0,.5)' }}>
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
            <a href="/sign-up" onClick={() => setExitDismissed(true)} style={{ display:'block', background:'#C8E600', color:'#061A0C', fontSize:15, fontWeight:800, padding:'14px 32px', borderRadius:10, textDecoration:'none', marginBottom:10, animation:'ctaGlow 2s ease-in-out infinite' }}>
              Start applying free →
            </a>
            <button onClick={() => { setExitIntent(false); setExitDismissed(true); }} style={{ background:'transparent', border:'none', fontSize:12, color:'rgba(255,255,255,.16)', cursor:'pointer' }}>No thanks, I enjoy being ignored</button>
          </div>
        </div>
      )}

      {/* DESKTOP STICKY SCROLL CTA */}
      {!isMobile && !isSignedIn && scrollPct > 18 && (
        <div style={{ position:'fixed', top:64, left:0, right:0, zIndex:150, background:'rgba(4,12,6,.96)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(200,230,0,.1)', padding:'10px 40px', display:'flex', alignItems:'center', justifyContent:'space-between', animation:'fadeInUp .25s ease-out' }}>
          <span style={{ fontSize:13, color:'rgba(255,255,255,.5)', fontWeight:500 }}>80% of UK CVs are auto-rejected — AI rewrites yours in 30 seconds</span>
          <a href="/sign-up" style={{ background:'#C8E600', color:BG, fontSize:13, fontWeight:800, padding:'9px 24px', borderRadius:8, textDecoration:'none', whiteSpace:'nowrap', flexShrink:0 }}>Start free →</a>
        </div>
      )}

      <NavUK home />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '56px 22px 48px' : '88px 40px 64px', maxWidth:1200, margin:'0 auto', animation:'fadeUp .55s ease-out' }}>
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 420px', gap: isMobile ? 40 : 64, alignItems:'center' }}>

          {/* Left: headline */}
          <div>
            {/* Social proof badge */}
            <div style={{ display:'inline-flex', alignItems:'center', gap:10, marginBottom:24 }}>
              <div style={{ display:'flex' }}>
                {PHOTOS.map((src, i) => (
                  <Image key={i} src={src} width={26} height={26} alt="" loading="eager"
                    style={{ borderRadius:'50%', border:`2px solid ${BG}`, marginLeft: i === 0 ? 0 : -7, position:'relative', zIndex:5-i, objectFit:'cover' }} />
                ))}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontSize:11, color:'rgba(255,255,255,.45)', fontWeight:600 }}>2,400+ hired this month</span>
                <span style={{ display:'flex', gap:1 }}>{Array.from({length:5}).map((_,i) => <span key={i} style={{ color:'#C8E600', fontSize:9 }}>★</span>)}</span>
              </div>
            </div>

            <h1 style={{ fontSize: isMobile ? 'clamp(36px,10vw,46px)' : 'clamp(46px,4.5vw,64px)', fontWeight:800, color:'#fff', lineHeight:1.04, marginBottom:22, letterSpacing:-2 }}>
              Get every UK<br />job application<br /><span style={{ color:'#C8E600' }}>actually seen.</span>
            </h1>
            <p style={{ fontSize: isMobile ? 15 : 17, color:'rgba(255,255,255,.45)', lineHeight:1.72, maxWidth:480, marginBottom:32 }}>
              Upload your CV once. AI rewrites it for every UK role in 30 seconds — then helps you apply in under a minute.
            </p>

            <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:16 }}>
              <a href="/sign-up" style={{ background:'#C8E600', color:'#061A0C', fontSize: isMobile ? 14 : 15, fontWeight:800, padding: isMobile ? '13px 26px' : '15px 34px', borderRadius:8, textDecoration:'none', animation:'ctaGlow 2.5s ease-in-out infinite', whiteSpace:'nowrap', display:'inline-block' }}>
                Start applying free →
              </a>
              <button onClick={() => scrollTo('how-it-works')} style={{ background:'transparent', color:'rgba(255,255,255,.65)', fontSize: isMobile ? 14 : 15, fontWeight:600, padding: isMobile ? '13px 22px' : '15px 26px', borderRadius:8, border:'1px solid rgba(255,255,255,.1)', cursor:'pointer', whiteSpace:'nowrap' }}>
                How it works
              </button>
            </div>

            {/* Trust signals */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:'4px 18px', marginBottom:28 }}>
              {['No credit card', 'GDPR compliant', '90%+ ATS pass rate', 'Cancel anytime'].map(t => (
                <span key={t} style={{ fontSize:12, color:'rgba(255,255,255,.28)', display:'flex', alignItems:'center', gap:5 }}>
                  <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4.5" fill="none" stroke="rgba(200,230,0,.35)" strokeWidth="1"/><path d="M3 5l1.4 1.5L7 3.5" stroke="#C8E600" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {t}
                </span>
              ))}
            </div>

            {/* Inline stats */}
            <div style={{ display:'flex', flexWrap:'wrap', gap: isMobile ? '8px 20px' : '6px 28px', paddingTop:24, borderTop:DIVIDE }}>
              {[['30s','CV rewrite'],['90%+','ATS pass rate'],['£0','to start'],['11 days','avg. to first interview']].map(([n,l]) => (
                <div key={l} style={{ display:'flex', alignItems:'baseline', gap:6 }}>
                  <span style={{ fontSize: isMobile ? 18 : 22, fontWeight:800, color:'#C8E600', fontVariantNumeric:'tabular-nums', lineHeight:1 }}>{n}</span>
                  <span style={{ fontSize:12, color:'rgba(255,255,255,.3)', fontWeight:500 }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: ATS demo widget */}
          <div style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.08)', borderRadius:16, padding: isMobile ? '22px 18px' : '28px 24px', flexShrink:0 }}>
            <div style={{ fontSize:11, color:'rgba(200,230,0,.55)', fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:4 }}>Live ATS score demo</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,.3)', marginBottom:20, lineHeight:1.5 }}>See what AI does to your score in real time</div>

            <div style={{ marginBottom:18 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:13, color:'rgba(255,255,255,.5)', fontWeight:600 }}>Your CV — before</span>
                <span style={{ fontSize:15, fontWeight:800, color:'#FF6B6B', fontVariantNumeric:'tabular-nums' }}>37%</span>
              </div>
              <div style={{ background:'rgba(255,255,255,.06)', borderRadius:3, height:8, overflow:'hidden' }}>
                <div style={{ width:'37%', height:'100%', background:'#FF6B6B', borderRadius:3 }} />
              </div>
              <div style={{ fontSize:11, color:'rgba(255,100,100,.7)', marginTop:6 }}>Auto-rejected by ATS — recruiters never see it</div>
            </div>

            <div style={{ marginBottom:24 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:13, color:'rgba(255,255,255,.5)', fontWeight:600 }}>Your CV — after AI rewrite</span>
                <span style={{ fontSize:15, fontWeight:800, color:atsColor, transition:'color .3s', fontVariantNumeric:'tabular-nums' }}>{demoAts}%</span>
              </div>
              <div style={{ background:'rgba(255,255,255,.06)', borderRadius:3, height:8, overflow:'hidden' }}>
                <div style={{ width:`${demoAts}%`, height:'100%', background:atsColor, borderRadius:3, transition:'width .08s linear' }} />
              </div>
              {demoState === 'done'
                ? <div style={{ fontSize:11, color:'#C8E600', marginTop:6 }}>✓ Shortlisted — recruiter reads your CV</div>
                : <div style={{ fontSize:11, color:'rgba(255,255,255,.2)', marginTop:6 }}>Press the button to see what happens</div>}
            </div>

            <button onClick={runDemo} disabled={demoState === 'running'} style={{ width:'100%', background: demoState === 'done' ? 'transparent' : '#C8E600', color: demoState === 'done' ? '#C8E600' : '#061A0C', fontSize:13, fontWeight:800, padding:'12px 18px', borderRadius:8, border: demoState === 'done' ? '1px solid rgba(200,230,0,.3)' : 'none', cursor: demoState === 'running' ? 'not-allowed' : 'pointer', transition:'all .2s', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {demoState === 'idle' && 'Optimise with AI →'}
              {demoState === 'running' && <><div style={{ width:14, height:14, border:'2px solid rgba(0,0,0,.2)', borderTop:'2px solid #061A0C', borderRadius:'50%', animation:'spinUK .6s linear infinite' }} /> Rewriting...</>}
              {demoState === 'done' && '✓ Start free — try it on your own CV'}
            </button>
          </div>
        </div>
      </section>

      {/* ── THE PROBLEM ──────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '52px 22px' : '72px 40px', borderTop:DIVIDE, borderBottom:DIVIDE }}>
        <div style={{ maxWidth:1200, margin:'0 auto', display:'grid', gridTemplateColumns: isMobile ? '1fr' : '5fr 4fr', gap: isMobile ? 32 : 80, alignItems:'start' }}>
          <div>
            <p style={{ fontSize:12, color:'rgba(255,80,80,.7)', fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:16 }}>The UK hiring problem</p>
            <h2 style={{ fontSize: isMobile ? 28 : 42, fontWeight:800, color:'#fff', lineHeight:1.1, marginBottom:20, letterSpacing:-1 }}>
              <span style={{ color:'#FF6B6B' }}>250 candidates</span><br />
              compete for every<br />UK job posting.
            </h2>
            <p style={{ fontSize:15, color:'rgba(255,255,255,.4)', lineHeight:1.75, marginBottom:28, maxWidth:520 }}>
              UK employers use ATS software to filter 80% of CVs before a human reads a single line. If your CV doesn&apos;t contain the exact keywords from the job description, you&apos;re invisible — no matter how qualified you are.
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:0, borderTop:DIVIDE }}>
              {[
                { ok: false, text: 'You send the same generic CV to 20 jobs' },
                { ok: false, text: 'ATS filters it out — no human ever sees it' },
                { ok: false, text: 'You get ghosted. Again.' },
                { ok: true,  text: 'Jobsesame rewrites your CV for each job' },
                { ok: true,  text: 'ATS score reaches 90%+ — you get shortlisted' },
                { ok: true,  text: 'Employers call. Interviews happen.' },
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
                { label: '80%', sub: 'of CVs auto-rejected before human review', accent: '#FF6B6B' },
                { label: '250×', sub: 'avg UK applicants competing per role', accent: '#FF6B6B' },
                { label: '6 sec', sub: 'average CV scan time by a recruiter', accent: '#FFB800' },
                { label: '90%+', sub: 'ATS pass rate with Jobsesame', accent: '#C8E600' },
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
        <div style={{ marginBottom: isMobile ? 36 : 52 }}>
          <p style={{ fontSize:11, fontWeight:700, color:'rgba(200,230,0,.6)', letterSpacing:'2px', textTransform:'uppercase', marginBottom:14 }}>How it works</p>
          <h2 style={{ fontSize: isMobile ? 28 : 40, fontWeight:800, color:'#fff', letterSpacing:-1, lineHeight:1.08 }}>From CV to UK job offer</h2>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:0, borderTop:DIVIDE }}>
          {[
            {
              n:'01', title:'Upload your CV once',
              body:'Drop in your existing CV — any format, any experience level. AI reads everything in seconds. You do this once. We handle everything after.',
              icon:'📄',
            },
            {
              n:'02', title:'AI rewrites it for every role',
              body:'Found a job you want? Click Optimise CV. In 30 seconds, AI reads the full job description and rewrites your CV with the exact keywords, restructured bullets, and a targeted summary that matches what that employer is looking for.',
              icon:'✨',
            },
            {
              n:'03', title:'Apply in under a minute',
              body:'For Greenhouse-powered UK employers, your tailored CV and cover letter are submitted automatically. For all other roles, we open the employer\'s application page with your rewritten CV ready to go — you click submit. No blank forms, no copy-paste, no wasted evenings.',
              icon:'⚡',
            },
            {
              n:'04', title:'Track everything in one dashboard',
              body:'Every application, every status update, every follow-up reminder in one place. Know exactly where you stand across every role you\'ve applied to.',
              icon:'📊',
            },
          ].map(s => (
            <div key={s.n} style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '120px 1fr', gap: isMobile ? 12 : 48, padding: isMobile ? '28px 0' : '36px 0', borderBottom:'1px solid rgba(255,255,255,.05)', alignItems:'start' }}>
              <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ fontSize: isMobile ? 38 : 52, fontWeight:800, color:'rgba(200,230,0,.15)', lineHeight:1, letterSpacing:-2, fontVariantNumeric:'tabular-nums' }}>{s.n}</div>
                {isMobile && <span style={{ fontSize:24 }}>{s.icon}</span>}
              </div>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  {!isMobile && <span style={{ fontSize:22 }}>{s.icon}</span>}
                  <h3 style={{ fontSize: isMobile ? 18 : 22, fontWeight:800, color:'#fff', letterSpacing:-.4 }}>{s.title}</h3>
                </div>
                <p style={{ fontSize:14, color:'rgba(255,255,255,.4)', lineHeight:1.75 }}>{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHAT AI ACTUALLY CHANGES ─────────────────────────────────── */}
      <section style={{ padding: isMobile ? '52px 22px' : '76px 40px', borderTop:DIVIDE, borderBottom:DIVIDE }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ marginBottom: isMobile ? 28 : 44 }}>
            <p style={{ fontSize:11, fontWeight:700, color:'rgba(200,230,0,.6)', letterSpacing:'2px', textTransform:'uppercase', marginBottom:14 }}>AI transparency</p>
            <h2 style={{ fontSize: isMobile ? 26 : 38, fontWeight:800, color:'#fff', letterSpacing:-.8, lineHeight:1.1 }}>Exactly what the AI changes<br /><span style={{ color:'rgba(255,255,255,.4)', fontSize: isMobile ? 20 : 28, fontWeight:600 }}>— and what it never touches</span></h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 16 : 24 }}>
            <div style={{ background:'rgba(200,230,0,.03)', border:'1px solid rgba(200,230,0,.12)', borderRadius:14, padding: isMobile ? '20px 18px' : '28px 24px' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'rgba(200,230,0,.65)', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:18 }}>✓ What AI rewrites</div>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {[
                  'Profile summary — tailored to the specific role and company',
                  'Bullet points — rewritten with metrics and the job\'s keywords',
                  'Skills list — prioritised to match what the employer is looking for',
                  'ATS keywords — keywords from the job description woven in naturally',
                  'Tone — adjusted for UK employers (professional British English)',
                ].map((t, i) => (
                  <div key={i} style={{ display:'flex', gap:10, fontSize:13, color:'rgba(255,255,255,.65)', lineHeight:1.55 }}>
                    <span style={{ color:'#C8E600', flexShrink:0, fontWeight:700 }}>✓</span>{t}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background:'rgba(255,80,80,.03)', border:'1px solid rgba(255,80,80,.1)', borderRadius:14, padding: isMobile ? '20px 18px' : '28px 24px' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'rgba(255,100,100,.65)', letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:18 }}>✕ What AI never changes</div>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {[
                  'Your real employer names — never altered or replaced',
                  'Your actual job titles — exactly as you held them',
                  'Employment dates and durations — unchanged',
                  'Qualifications and education — never fabricated or inflated',
                  'Your contact details — name, email, phone, location as provided',
                ].map((t, i) => (
                  <div key={i} style={{ display:'flex', gap:10, fontSize:13, color:'rgba(255,255,255,.55)', lineHeight:1.55 }}>
                    <span style={{ color:'rgba(255,100,100,.55)', flexShrink:0, fontWeight:700 }}>✕</span>{t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section id="features" style={{ padding: isMobile ? '56px 22px' : '80px 40px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap:16, marginBottom: isMobile ? 36 : 52 }}>
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:'rgba(200,230,0,.6)', letterSpacing:'2px', textTransform:'uppercase', marginBottom:14 }}>What you get</p>
              <h2 style={{ fontSize: isMobile ? 28 : 40, fontWeight:800, color:'#fff', letterSpacing:-1, lineHeight:1.1 }}>Built for the UK<br />job market</h2>
            </div>
            <a href="/sign-up" style={{ background:'rgba(200,230,0,.1)', color:'#C8E600', fontSize:13, fontWeight:700, padding:'10px 20px', borderRadius:8, textDecoration:'none', border:'1px solid rgba(200,230,0,.2)', whiteSpace:'nowrap', flexShrink:0 }}>
              Start free →
            </a>
          </div>
          <div style={{ borderTop:'1px solid rgba(255,255,255,.06)' }}>
            {FEATURES.map(f => (
              <div key={f.n} className="feat-row" style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '220px 1fr', gap: isMobile ? 8 : 48, padding: isMobile ? '22px 0' : '26px 0', alignItems:'start' }}>
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
      <section style={{ padding: isMobile ? '60px 22px' : '88px 40px', borderTop:DIVIDE, maxWidth:1200, margin:'0 auto' }}>
        <div style={{ marginBottom: isMobile ? 40 : 60 }}>
          <p style={{ fontSize:11, fontWeight:700, color:'rgba(200,230,0,.6)', letterSpacing:'2px', textTransform:'uppercase', marginBottom:14 }}>Results</p>
          <h2 style={{ fontSize: isMobile ? 28 : 40, fontWeight:800, color:'#fff', letterSpacing:-1, lineHeight:1.08 }}>UK professionals<br />getting hired</h2>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:0, borderTop:DIVIDE }}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 220px', gap: isMobile ? 20 : 48, padding: isMobile ? '32px 0' : '44px 0', borderBottom:'1px solid rgba(255,255,255,.05)', alignItems:'center' }}>
              <div>
                <div style={{ display:'flex', gap:2, marginBottom:16 }}>{Array.from({length:5}).map((_,i) => <span key={i} style={{ color:'#C8E600', fontSize:14 }}>★</span>)}</div>
                <p style={{ fontSize: isMobile ? 17 : 21, fontWeight:600, color:'rgba(255,255,255,.82)', lineHeight:1.55, fontStyle:'italic', marginBottom:20, letterSpacing:-.2 }}>&ldquo;{t.quote}&rdquo;</p>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <Image src={t.photo} alt={t.name} width={38} height={38} style={{ borderRadius:'50%', objectFit:'cover', flexShrink:0, border:'2px solid rgba(200,230,0,.15)' }} />
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
        <div style={{ textAlign:'center', marginTop:36 }}>
          <a href="/sign-up" style={{ display:'inline-block', background:'#C8E600', color:BG, fontSize:14, fontWeight:800, padding:'13px 32px', borderRadius:8, textDecoration:'none', animation:'ctaGlow 2.5s ease-in-out infinite' }}>
            Join them — start free →
          </a>
        </div>
      </section>

      {/* ── vs COMPETITORS ────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '52px 22px' : '76px 40px', borderTop:DIVIDE, borderBottom:DIVIDE }}>
        <div style={{ maxWidth:860, margin:'0 auto' }}>
          <p style={{ fontSize:11, fontWeight:700, color:'rgba(200,230,0,.6)', letterSpacing:'2px', textTransform:'uppercase', marginBottom:14 }}>Why Jobsesame</p>
          <h2 style={{ fontSize: isMobile ? 26 : 36, fontWeight:800, color:'#fff', letterSpacing:-.8, marginBottom: isMobile ? 28 : 40 }}>No other platform does this</h2>
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
            <p style={{ fontSize:11, fontWeight:700, color:'rgba(200,230,0,.6)', letterSpacing:'2px', textTransform:'uppercase', marginBottom:10 }}>Live jobs</p>
            <h2 style={{ fontSize: isMobile ? 26 : 38, fontWeight:800, color:'#fff', letterSpacing:-.8, marginBottom:8 }}>UK jobs available right now</h2>
            <p style={{ fontSize:13, color:'rgba(255,255,255,.3)' }}>Refreshed every 30 minutes · Adzuna · JSearch · Remotive</p>
          </div>
          <a href="/uk/jobs" style={{ background:'rgba(200,230,0,.1)', color:'#C8E600', fontSize:13, fontWeight:700, padding:'10px 20px', borderRadius:8, textDecoration:'none', border:'1px solid rgba(200,230,0,.2)', whiteSpace:'nowrap', flexShrink:0 }}>
            Browse all UK jobs →
          </a>
        </div>
        {jobsLoading ? (
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:12 }}>
            {Array.from({length:6}).map((_,i) => <div key={i} style={{ background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.05)', borderRadius:12, height:110, animation:'shimmer 1.5s ease-in-out infinite' }} />)}
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
                  <a href="/sign-up" style={{ background:'#C8E600', color:'#061A0C', fontSize:12, fontWeight:800, padding:'9px 22px', borderRadius:8, textDecoration:'none' }}>Apply with AI →</a>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ textAlign:'center', marginTop:28 }}>
          <a href="/uk/jobs" style={{ display:'inline-block', background:'transparent', color:'rgba(255,255,255,.45)', fontSize:13, fontWeight:600, padding:'11px 28px', borderRadius:8, textDecoration:'none', border:'1px solid rgba(255,255,255,.1)' }}>
            See all UK jobs →
          </a>
        </div>
      </section>

      {/* ── SALARY INTELLIGENCE ──────────────────────────────────────── */}
      <section id="salaries" style={{ padding: isMobile ? '56px 22px' : '80px 40px', borderTop:DIVIDE, borderBottom:DIVIDE }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap:16, marginBottom: isMobile ? 28 : 44 }}>
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:'rgba(200,230,0,.6)', letterSpacing:'2px', textTransform:'uppercase', marginBottom:12 }}>Salary intelligence</p>
              <h2 style={{ fontSize: isMobile ? 26 : 38, fontWeight:800, color:'#fff', letterSpacing:-.8, marginBottom:8 }}>Know your worth before<br />you negotiate</h2>
              <p style={{ fontSize:13, color:'rgba(255,255,255,.3)' }}>Live Adzuna UK data · London &amp; nationwide · updated continuously</p>
            </div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:0, borderTop:DIVIDE }}>
            {SALARIES.map(({ role, min, max, bar }) => (
              <div key={role} style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '200px 1fr 110px', gap: isMobile ? 8 : 24, padding: isMobile ? '16px 0' : '18px 0', borderBottom:'1px solid rgba(255,255,255,.04)', alignItems:'center' }}>
                <span style={{ fontSize:14, color:'rgba(255,255,255,.65)', fontWeight:600 }}>{role}</span>
                <div style={{ background:'rgba(255,255,255,.06)', borderRadius:3, height:5, overflow:'hidden', flex:1 }}>
                  <div style={{ width:`${bar}%`, height:'100%', background:'linear-gradient(to right,rgba(200,230,0,.4),#C8E600)', borderRadius:3 }} />
                </div>
                <span style={{ fontSize:13, color:'#C8E600', fontWeight:800, textAlign: isMobile ? 'left' : 'right', fontVariantNumeric:'tabular-nums', whiteSpace:'nowrap' }}>£{min}k – £{max}k</span>
              </div>
            ))}
          </div>
          <p style={{ fontSize:12, color:'rgba(255,255,255,.2)', marginTop:16 }}>Ranges represent typical base salaries for mid-level roles. Senior and London-based positions typically sit at the upper end.</p>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: isMobile ? '60px 22px' : '88px 40px', maxWidth:1200, margin:'0 auto' }}>
        <div style={{ marginBottom: isMobile ? 36 : 52 }}>
          <p style={{ fontSize:11, fontWeight:700, color:'rgba(200,230,0,.6)', letterSpacing:'2px', textTransform:'uppercase', marginBottom:14 }}>Pricing</p>
          <h2 style={{ fontSize: isMobile ? 28 : 42, fontWeight:800, color:'#fff', letterSpacing:-1.2, marginBottom:12 }}>Less than a day&apos;s pay<br />to land your next role</h2>
          <p style={{ fontSize:15, color:'rgba(255,255,255,.35)' }}>One UK salary negotiation pays for years of Pro.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap:16, alignItems:'stretch' }}>
          {[
            {
              name:'Free', price:'£0', period:'', tag:null, hi:false,
              features:[{t:'Browse all UK jobs',ok:true},{t:'Save jobs to your list',ok:true},{t:'Basic job search',ok:true},{t:'AI CV rewriter',ok:false},{t:'Fast-track apply',ok:false}],
              cta:'Start browsing free', href:'/sign-up', type:'link' as const,
            },
            {
              name:'Credits', price:'£10', period:'one-time', tag:'Best value', hi:true,
              features:[{t:'20 UK applications',ok:true},{t:'AI CV rewriter',ok:true},{t:'Fast-track apply',ok:true},{t:'British cover letter AI',ok:true},{t:'Application tracker',ok:true}],
              cta:'Buy Credits', href:'/uk/subscribe', type:'soon' as const,
            },
            {
              name:'Pro', price:'£21', period:'/month', tag:null, hi:false,
              features:[{t:'Unlimited applications',ok:true},{t:'Priority job matching',ok:true},{t:'UK CV rewriter — unlimited',ok:true},{t:'Cover letter generator',ok:true},{t:'UK salary intelligence',ok:true}],
              cta:'Subscribe Pro', href:'/uk/subscribe', type:'soon' as const,
            },
          ].map(plan => (
            <div key={plan.name} style={{ background: plan.hi ? 'rgba(200,230,0,.05)' : 'rgba(255,255,255,.02)', border:`1.5px solid ${plan.hi ? 'rgba(200,230,0,.28)' : 'rgba(255,255,255,.07)'}`, borderRadius:16, padding:'26px 22px', position:'relative', display:'flex', flexDirection:'column' }}>
              {plan.tag && <div style={{ position:'absolute', top:-12, left:'50%', transform:'translateX(-50%)', background:'#C8E600', color:'#061A0C', fontSize:10, fontWeight:800, padding:'3px 12px', borderRadius:4, whiteSpace:'nowrap', letterSpacing:.3 }}>{plan.tag}</div>}
              <div style={{ fontSize:11, color:'rgba(255,255,255,.35)', fontWeight:700, textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:8 }}>{plan.name}</div>
              <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:20 }}>
                <span style={{ fontSize:42, fontWeight:800, color: plan.hi ? '#C8E600' : '#fff', lineHeight:1, fontVariantNumeric:'tabular-nums' }}>{plan.price}</span>
                {plan.period && <span style={{ fontSize:13, color:'rgba(255,255,255,.3)' }}>{plan.period}</span>}
              </div>
              <div style={{ height:1, background:'rgba(255,255,255,.06)', marginBottom:18 }} />
              <ul style={{ listStyle:'none', padding:0, margin:'0 0 22px', display:'flex', flexDirection:'column', gap:10, flex:1 }}>
                {plan.features.map(f => (
                  <li key={f.t} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color: f.ok ? 'rgba(255,255,255,.68)' : 'rgba(255,255,255,.2)' }}>
                    <span style={{ color: f.ok ? '#C8E600' : 'rgba(255,255,255,.12)', flexShrink:0, fontSize:12, fontWeight:700 }}>{f.ok ? '✓' : '✕'}</span>{f.t}
                  </li>
                ))}
              </ul>
              {plan.type === 'link' ? (
                <a href={plan.href} style={{ display:'block', textAlign:'center', background: plan.hi ? '#C8E600' : 'rgba(255,255,255,.07)', color: plan.hi ? '#061A0C' : 'rgba(255,255,255,.6)', fontSize:13, fontWeight:800, padding:'13px 18px', borderRadius:8, textDecoration:'none', marginTop:'auto' }}>{plan.cta}</a>
              ) : (
                <a href={plan.href} style={{ display:'block', textAlign:'center', background: plan.hi ? 'rgba(200,230,0,.08)' : 'rgba(255,255,255,.05)', color: plan.hi ? '#C8E600' : 'rgba(255,255,255,.45)', fontSize:13, fontWeight:700, padding:'13px 18px', borderRadius:8, textDecoration:'none', border:`1px solid ${plan.hi ? 'rgba(200,230,0,.25)' : 'rgba(255,255,255,.08)'}`, marginTop:'auto' }}>
                  {plan.cta} <span style={{ fontSize:10, color:'rgba(200,230,0,.5)', marginLeft:4 }}>· coming soon</span>
                </a>
              )}
            </div>
          ))}
        </div>
        <div style={{ textAlign:'center', marginTop:20 }}>
          <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
            {['🔒 SSL encrypted', '🇬🇧 GDPR compliant', '✓ 30-day refund guarantee', '⚡ Instant activation'].map(t => (
              <span key={t} style={{ fontSize:11, color:'rgba(255,255,255,.22)', background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.06)', borderRadius:99, padding:'4px 10px' }}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section id="faq" style={{ padding: isMobile ? '52px 22px' : '76px 40px', borderTop:DIVIDE, maxWidth:860, margin:'0 auto' }}>
        <p style={{ fontSize:11, fontWeight:700, color:'rgba(200,230,0,.6)', letterSpacing:'2px', textTransform:'uppercase', marginBottom:14 }}>FAQ</p>
        <h2 style={{ fontSize: isMobile ? 26 : 38, fontWeight:800, color:'#fff', letterSpacing:-.8, marginBottom: isMobile ? 32 : 48 }}>Questions answered</h2>
        <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ borderBottom:'1px solid rgba(255,255,255,.05)' }}>
              <button className="faq-btn" onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width:'100%', background:'transparent', border:'none', padding:'18px 0', display:'flex', justifyContent:'space-between', alignItems:'center', gap:16, cursor:'pointer', textAlign:'left', borderRadius:4 }}>
                <span style={{ fontSize: isMobile ? 14 : 15, fontWeight:700, color:'rgba(255,255,255,.88)', lineHeight:1.4 }}>{faq.q}</span>
                <span style={{ fontSize:18, color:'#C8E600', flexShrink:0, transform: openFaq === i ? 'rotate(45deg)' : 'none', transition:'transform .18s', lineHeight:1 }}>+</span>
              </button>
              {openFaq === i && <div style={{ paddingBottom:18, fontSize:14, color:'rgba(255,255,255,.48)', lineHeight:1.78 }}>{faq.a}</div>}
            </div>
          ))}
        </div>
        {/* FAQ bottom CTA */}
        <div style={{ marginTop:40, background:'rgba(200,230,0,.04)', border:'1px solid rgba(200,230,0,.14)', borderRadius:14, padding: isMobile ? '20px 18px' : '24px 28px', display:'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent:'space-between', gap:16 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:'#fff', marginBottom:4 }}>Still have questions?</div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,.38)' }}>Start free — no card needed. You can explore everything before committing.</div>
          </div>
          <div style={{ display:'flex', gap:10, flexShrink:0 }}>
            <a href="/sign-up" style={{ background:'#C8E600', color:BG, fontSize:13, fontWeight:800, padding:'11px 24px', borderRadius:8, textDecoration:'none', whiteSpace:'nowrap' }}>Start free →</a>
            <a href="mailto:uk@jobsesame.co.za" style={{ background:'transparent', color:'rgba(255,255,255,.45)', fontSize:13, fontWeight:600, padding:'11px 20px', borderRadius:8, textDecoration:'none', border:'1px solid rgba(255,255,255,.1)', whiteSpace:'nowrap' }}>Contact us</a>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '60px 22px 80px' : '88px 40px 112px', borderTop:DIVIDE, maxWidth:860, margin:'0 auto', textAlign:'center' }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:20 }}>
          <div style={{ display:'flex' }}>
            {PHOTOS.map((src, i) => (
              <Image key={i} src={src} width={32} height={32} alt="" loading="lazy"
                style={{ borderRadius:'50%', border:`2.5px solid ${BG}`, marginLeft: i === 0 ? 0 : -9, position:'relative', zIndex:5-i, objectFit:'cover' }} />
            ))}
          </div>
        </div>
        <h2 style={{ fontSize: isMobile ? 32 : 52, fontWeight:800, color:'#fff', lineHeight:1.06, marginBottom:18, letterSpacing:-1.5 }}>
          Your next UK job.<br /><span style={{ color:'#C8E600' }}>Starts today.</span>
        </h2>
        <p style={{ fontSize:16, color:'rgba(255,255,255,.38)', marginBottom:32, lineHeight:1.65, maxWidth:460, margin:'0 auto 32px' }}>Join 2,400+ professionals already applying smarter. No credit card. No commitment. Start free and see the difference in 30 seconds.</p>
        <a href="/sign-up" style={{ display:'inline-block', background:'#C8E600', color:'#061A0C', fontSize: isMobile ? 15 : 17, fontWeight:800, padding: isMobile ? '15px 32px' : '17px 48px', borderRadius:8, textDecoration:'none', animation:'ctaGlow 2.5s ease-in-out infinite', marginBottom:16 }}>
          Start applying free →
        </a>
        <div style={{ display:'flex', gap:'6px 20px', justifyContent:'center', flexWrap:'wrap' }}>
          {['Free forever plan', 'GDPR compliant', 'Cancel anytime', 'No credit card'].map(t => (
            <span key={t} style={{ fontSize:12, color:'rgba(255,255,255,.22)', display:'flex', alignItems:'center', gap:5 }}>
              <svg width="9" height="9" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4.5" fill="none" stroke="rgba(200,230,0,.3)" strokeWidth="1"/><path d="M3 5l1.4 1.5L7 3.5" stroke="#C8E600" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {t}
            </span>
          ))}
        </div>
      </section>

      <FooterUK />

      {/* MOBILE STICKY CTA */}
      {isMobile && !isSignedIn && (
        <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:300, background:'rgba(4,12,6,.97)', backdropFilter:'blur(20px)', borderTop:'1px solid rgba(200,230,0,.14)', padding:'10px 16px', paddingBottom:'calc(10px + env(safe-area-inset-bottom))' }}>
          <a href="/sign-up" style={{ display:'block', background:'#C8E600', color:'#061A0C', fontSize:15, fontWeight:800, padding:'14px 20px', borderRadius:8, textDecoration:'none', textAlign:'center' }}>
            Start applying free — no card needed
          </a>
        </div>
      )}
    </main>
  );
}
