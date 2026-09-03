'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import Nav from './components/Nav';
import Footer from './components/Footer';
import CvTransformShowcase from './components/CvTransformShowcase';
import { INK, INK_SOFT, INK_FAINT, LINE, PAPER, CARD, ACCENT, CLAY, AMBER, SERIF } from './lib/theme';
import { captureAttribution } from './lib/attribution';
import { captureClient } from './lib/posthog-client';
import { ANALYTICS_EVENTS } from './lib/analytics-events';

export default function Home() {
  const { isSignedIn } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [currency, setCurrency] = useState<'ZAR' | 'GBP' | 'USD'>('ZAR');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [faqSearch, setFaqSearch] = useState('');
  const [cvAnalysisState, setCvAnalysisState] = useState<'idle' | 'uploading' | 'done'>('idle');
  const [cvAnalysisScores, setCvAnalysisScores] = useState({ overall: 0, keywords: 0, impact: 0, structure: 0, completeness: 0 });
  const [cvAnalysisDragOver, setCvAnalysisDragOver] = useState(false);
  const [cvSample, setCvSample] = useState<{ status: 'idle' | 'loading' | 'done' | 'unavailable'; before: string; after: string }>({ status: 'idle', before: '', after: '' });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // First-touch attribution (no-op on later visits), then the funnel-top event.
  useEffect(() => {
    captureAttribution();
    captureClient(ANALYTICS_EVENTS.LANDING_PAGE_VIEWED);
  }, []);

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(data => {
        if (data.country_code === 'GB') setCurrency('GBP');
        else if (data.country_code !== 'ZA') setCurrency('USD');
      })
      .catch((err) => console.error('[home] geo-detect failed:', err));
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const actionVerbs = ['led','managed','delivered','achieved','increased','reduced','built','launched','drove','grew','saved','developed','implemented','improved','created','established'];
  const metricPattern = /\d+\s*%|\d+\s*(million|thousand|k\b|\$|£|€|R\d)|\d+\s*(people|users|clients|projects|teams)/i;
  const techIndustryKw = ['software','engineering','finance','marketing','sales','operations','product','data','cloud','agile','devops','react','python','java','node','aws','azure','crm','erp','saas'];

  const computeSubScores = (cv: any) => {
    const summaryText = (cv.summary || '').toLowerCase();
    const bullets: string[] = (cv.experience || []).flatMap((e: any) => e.bullets || []);
    const bulletText = bullets.join(' ');
    const jobTitles = (cv.experience || []).map((e: any) => (e.title || '').toLowerCase()).join(' ');

    let keywords = 35;
    if ((cv.skills?.length || 0) > 8) keywords += 35; else if ((cv.skills?.length || 0) > 4) keywords += 18;
    if (techIndustryKw.some(kw => summaryText.includes(kw))) keywords += 20;
    keywords = Math.min(96, keywords);

    let impact = 30;
    const metricMatches = (bulletText.match(new RegExp(metricPattern, 'gi')) || []).length;
    impact += Math.min(50, metricMatches * 18);
    if (actionVerbs.some(v => bulletText.toLowerCase().includes(v))) impact += 12;
    impact = Math.min(94, impact);

    let structure = 40;
    if (cv.summary && cv.summary.length > 100 && actionVerbs.some(v => summaryText.includes(v))) structure += 25;
    if (/senior|lead|manager|director|head|principal|chief|vp|vice president/.test(jobTitles)) structure += 15;
    if ((cv.experience?.length || 0) >= 2) structure += 10;
    structure = Math.min(95, structure);

    let completeness = 30;
    if (cv.phone && cv.email) completeness += 20;
    if (cv.education && /bachelor|master|phd|diploma|degree|bsc|ba |msc|mba|honours|certificate/i.test(cv.education)) completeness += 25;
    if (cv.location && cv.location.length > 2) completeness += 15;
    if ((cv.languages?.length || 0) > 0) completeness += 6;
    completeness = Math.min(96, completeness);

    const overall = Math.min(78, Math.round((keywords + impact + structure + completeness) / 4));
    return { overall, keywords, impact, structure, completeness };
  };

  const pickWeakBullet = (cv: any): { bullet: string; title: string } | null => {
    const bullets = (cv.experience || []).flatMap((e: any) => (e.bullets || []).map((b: string) => ({ bullet: b, title: e.title || '' })));
    if (!bullets.length) return null;
    return bullets.find((x: any) => !/\d/.test(x.bullet)) || bullets[0];
  };

  const fetchSampleRewrite = async (weak: { bullet: string; title: string }) => {
    setCvSample({ status: 'loading', before: weak.bullet, after: '' });
    try {
      const res = await fetch('/api/cv-check/rewrite-sample', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bullet: weak.bullet, title: weak.title }),
      });
      const data = await res.json();
      if (data.success && data.rewritten) {
        setCvSample({ status: 'done', before: weak.bullet, after: data.rewritten });
      } else {
        setCvSample({ status: 'unavailable', before: weak.bullet, after: '' });
      }
    } catch {
      setCvSample({ status: 'unavailable', before: weak.bullet, after: '' });
    }
  };

  const handleCvAnalysis = async (file: File) => {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) return;
    setCvAnalysisState('uploading');
    setCvSample({ status: 'idle', before: '', after: '' });
    try {
      const formData = new FormData();
      formData.append('cv', file);
      const res = await fetch('/api/cv', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        const cv = data.cvData;
        setCvAnalysisScores(computeSubScores(cv));
        setCvAnalysisState('done');
        const weak = pickWeakBullet(cv);
        if (weak) fetchSampleRewrite(weak);
      } else {
        setCvAnalysisState('idle');
      }
    } catch {
      setCvAnalysisState('idle');
    }
  };

  const stats = [
    { n: '8/10', l: 'CVs never reach a human — filtered by ATS before anyone reads them' },
    { n: '90%+', l: 'Average ATS pass rate after a rewrite' },
    { n: '30s', l: 'Time to tailor a CV to a new role' },
    { n: '11×', l: 'More interviews than a generic CV' },
  ];

  const steps = [
    { n: '01', title: 'Upload your CV once', body: 'Drop in your existing PDF. The AI reads your experience, skills and achievements in seconds — you never have to retype it.' },
    { n: '02', title: 'Paste the job description', body: 'Found a role on LinkedIn, Indeed, or a company site? Paste the description in. Jobsesame doesn’t list jobs — it tailors your CV to whatever you’re applying for.' },
    { n: '03', title: 'Get a tailored CV and cover letter', body: 'The AI rewrites your CV to match the role in about 30 seconds, with a personalised cover letter to match.' },
    { n: '04', title: 'Download and track', body: 'Get an ATS-ready PDF and follow every application, status and follow-up from one dashboard.' },
  ];

  const features = [
    { n: '01', title: 'AI CV tailoring per job', body: 'Your CV rewritten for every application — keywords, tone and structure matched to the exact role.' },
    { n: '02', title: 'ATS score optimisation', body: 'Built to pass automated screening, not just to look good to a person reading it after the fact.' },
    { n: '03', title: 'Matching cover letters', body: 'Every rewrite comes with a personalised cover letter for the same role, ready in seconds.' },
    { n: '04', title: 'ATS-ready PDF', body: 'A polished, correctly formatted PDF ready to attach to any application, anywhere.' },
    { n: '05', title: 'Role match scoring', body: 'See how well your CV fits a role before you apply, so you can fix the gaps first.' },
    { n: '06', title: 'Application tracker', body: 'Every version and every application in one place, so you always know where you stand.' },
  ];

  const testimonials = [
    { quote: 'I’d sent out forty CVs with no replies. After rewriting with Jobsesame I had four interviews in ten days.', name: 'Thabo N.', role: 'Software developer, Johannesburg', initials: 'TN' },
    { quote: 'My ATS score went from 38% to 91%. I had a callback within two days of applying.', name: 'Amara D.', role: 'Financial analyst, Cape Town', initials: 'AD' },
    { quote: 'I was relocating abroad and needed my CV rewritten for a different market. It worked.', name: 'James K.', role: 'Project manager, London', initials: 'JK' },
  ];

  const pricing = [
    { name: 'Free', price: { ZAR: 'R0', GBP: '£0', USD: '$0' }, per: '', desc: '3 free AI CV rewrites, no card required.', items: ['3 AI CV rewrites', 'ATS score on every rewrite', 'Matching cover letter'], highlight: false, cta: 'Start free' },
    { name: 'Credit pack', price: { ZAR: 'R99', GBP: '£10', USD: '$5' }, per: 'one-time', desc: '10 credits, use anytime.', items: ['10 AI CV rewrites', 'ATS score on every rewrite', 'Matching cover letters', 'Priority processing'], highlight: true, cta: 'Buy credits' },
    { name: 'Pro', price: { ZAR: 'R249', GBP: '£21', USD: '$14' }, per: '/ month', desc: 'Unlimited rewrites while you’re job hunting.', items: ['Unlimited AI CV rewrites', 'ATS score on every rewrite', 'Matching cover letters', 'Application tracker'], highlight: false, cta: 'Go Pro' },
  ];

  const faqs = [
    { q: 'Is it really free to start?', a: 'Yes — you get 3 AI CV rewrites with no credit card required. After that you can buy a 10-credit pack or go unlimited with Pro.' },
    { q: 'How does the rewrite work?', a: 'Upload your CV once, then paste the job description for any role you’re applying to. The AI rewrites your CV to match it in about 30 seconds.' },
    { q: 'Where do I find the job description?', a: 'Anywhere — LinkedIn, Indeed, a company careers page, a recruiter email. Jobsesame doesn’t list jobs itself; it tailors your CV to whatever role you’re applying for.' },
    { q: 'Will my real experience be changed?', a: 'No. We only rewrite how your experience is described, never the facts — your real companies, titles, dates and qualifications always stay as they are.' },
    { q: 'Is my CV data safe?', a: 'Yes. It’s processed securely and never sold to third parties. You can delete your data at any time.' },
  ];

  const filteredFaqs = faqSearch
    ? faqs.filter(f => f.q.toLowerCase().includes(faqSearch.toLowerCase()) || f.a.toLowerCase().includes(faqSearch.toLowerCase()))
    : faqs;

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <main style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif", background: PAPER, color: INK, margin: 0, padding: 0, overflowX: 'hidden' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        a { color: inherit; }
        .cta-primary:hover { opacity: 0.9; }
        .cta-secondary { border-bottom: 1px solid rgba(28,26,22,0.12); }
        .cta-secondary:hover { color: ${INK}; border-color: rgba(28,26,22,0.4); }
        .faq-row { border-bottom: 1px solid ${LINE}; }
        .faq-row:last-child { border-bottom: none; }
        input::placeholder { color: ${INK_FAINT}; }
        input:focus { border-color: rgba(63,93,82,0.4) !important; outline: none; }
        @media (max-width: 767px) {
          .hide-mobile { display: none !important; }
          .stack-mobile { flex-direction: column !important; align-items: flex-start !important; }
          .grid-2 { grid-template-columns: 1fr !important; }
          .grid-3 { grid-template-columns: 1fr !important; }
          .grid-4 { grid-template-columns: 1fr 1fr !important; }
          .hero-grid { grid-template-columns: 1fr !important; }
          .feature-row { grid-template-columns: 1fr !important; gap: 6px !important; }
        }
      `}</style>

      <Nav home theme="light" />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '64px 22px 56px' : '96px 40px 80px', maxWidth: 1120, margin: '0 auto' }}>
        <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: isMobile ? 48 : 72, alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: INK_FAINT, marginBottom: 24 }}>AI CV rewriting &amp; ATS optimisation</p>
            <h1 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: isMobile ? 38 : 56, lineHeight: 1.1, letterSpacing: '-0.01em', marginBottom: 24 }}>
              Your CV is being filtered out before anyone reads it.
            </h1>
            <p style={{ fontSize: isMobile ? 15.5 : 17, color: INK_SOFT, lineHeight: 1.7, maxWidth: 460, marginBottom: 32 }}>
              Most applications never reach a human — automated screening rejects them first. Jobsesame rewrites your CV for every role in about 30 seconds, so it gets through.
            </p>
            <div className="stack-mobile" style={{ display: 'flex', alignItems: 'center', gap: 28, marginBottom: 40 }}>
              <a href="/sign-up" className="cta-primary" style={{ background: ACCENT, color: PAPER, fontSize: 14.5, fontWeight: 600, padding: '14px 28px', borderRadius: 3, textDecoration: 'none' }}>Start free — 3 rewrites</a>
              <button onClick={() => scrollTo('how')} className="cta-secondary" style={{ background: 'transparent', border: 'none', padding: '13px 0', fontSize: 14.5, fontWeight: 500, color: INK_SOFT, cursor: 'pointer' }}>See how it works</button>
            </div>
            <div className="stack-mobile" style={{ display: 'flex', alignItems: 'center', gap: 28, paddingTop: 28, borderTop: `1px solid ${LINE}` }}>
              {[['90%+', 'ATS pass rate'], ['30s', 'per rewrite'], ['11×', 'more interviews']].map(([n, l], i) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
                  {i > 0 && <div className="hide-mobile" style={{ width: 1, height: 32, background: LINE }} />}
                  <div>
                    <div style={{ fontFamily: SERIF, fontSize: 22 }}>{n}</div>
                    <div style={{ fontSize: 12, color: INK_FAINT, marginTop: 2 }}>{l}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div id="cv-check" style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 4, padding: isMobile ? 22 : 28 }}>
            {cvAnalysisState === 'idle' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: INK_FAINT }}>Free CV check</span>
                  <span className="hide-mobile" style={{ fontSize: 11, color: INK_FAINT }}>No signup required</span>
                </div>
                <div
                  onDrop={e => { e.preventDefault(); setCvAnalysisDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleCvAnalysis(f); }}
                  onDragOver={e => { e.preventDefault(); setCvAnalysisDragOver(true); }}
                  onDragLeave={() => setCvAnalysisDragOver(false)}
                  style={{ border: `1px dashed ${cvAnalysisDragOver ? ACCENT : 'rgba(28,26,22,0.22)'}`, borderRadius: 4, padding: isMobile ? '36px 20px' : '48px 24px', textAlign: 'center', background: cvAnalysisDragOver ? 'rgba(63,93,82,0.04)' : PAPER, transition: 'all 0.2s' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={INK_FAINT} strokeWidth="1.4" style={{ marginBottom: 14 }}><path d="M12 3v12" strokeLinecap="round" /><path d="M7 8l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" /></svg>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Drop your CV here to see your ATS score</div>
                  <div style={{ fontSize: 12.5, color: INK_FAINT, marginBottom: 20 }}>PDF format &middot; analysed instantly &middot; never stored</div>
                  <label style={{ cursor: 'pointer' }}>
                    <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleCvAnalysis(f); }} />
                    <span style={{ display: 'inline-block', padding: '11px 24px', border: `1px solid ${INK}`, borderRadius: 3, fontSize: 13.5, fontWeight: 600 }}>Choose PDF</span>
                  </label>
                </div>
              </>
            )}

            {cvAnalysisState === 'uploading' && (
              <div style={{ textAlign: 'center', padding: '56px 20px' }}>
                <div style={{ width: 32, height: 32, border: `2px solid ${LINE}`, borderTop: `2px solid ${ACCENT}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Reading your CV…</div>
                <div style={{ fontSize: 13, color: INK_FAINT }}>Analysing skills, experience and ATS compatibility</div>
              </div>
            )}

            {cvAnalysisState === 'done' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: INK_FAINT }}>Your ATS score</span>
                  <span style={{ fontFamily: SERIF, fontSize: 30, color: cvAnalysisScores.overall >= 75 ? ACCENT : cvAnalysisScores.overall >= 60 ? AMBER : CLAY }}>{cvAnalysisScores.overall}%</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
                  {([
                    ['Keywords', cvAnalysisScores.keywords],
                    ['Impact & metrics', cvAnalysisScores.impact],
                    ['Structure', cvAnalysisScores.structure],
                    ['Completeness', cvAnalysisScores.completeness],
                  ] as [string, number][]).map(([label, val]) => (
                    <div key={label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: INK_SOFT, marginBottom: 4 }}>
                        <span>{label}</span>
                        <span style={{ fontWeight: 600, color: val >= 75 ? ACCENT : val >= 55 ? AMBER : CLAY }}>{val}%</span>
                      </div>
                      <div style={{ height: 5, background: LINE, borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${val}%`, background: val >= 75 ? ACCENT : val >= 55 ? AMBER : CLAY, borderRadius: 99 }} />
                      </div>
                    </div>
                  ))}
                </div>

                {(cvSample.status === 'loading' || cvSample.status === 'done') && (
                  <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 18, marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: INK_FAINT, marginBottom: 10 }}>We rewrote one of your lines</div>
                    {cvSample.status === 'loading' && (
                      <div style={{ fontSize: 13, color: INK_FAINT, fontStyle: 'italic' }}>Rewriting a sample line…</div>
                    )}
                    {cvSample.status === 'done' && (
                      <>
                        <div style={{ fontSize: 13, color: INK_FAINT, lineHeight: 1.6, marginBottom: 8, paddingLeft: 10, borderLeft: `2px solid ${CLAY}` }}>{cvSample.before}</div>
                        <div style={{ fontSize: 13, color: INK, lineHeight: 1.6, paddingLeft: 10, borderLeft: `2px solid ${ACCENT}` }}>{cvSample.after}</div>
                      </>
                    )}
                  </div>
                )}

                <a href="/sign-up" style={{ display: 'block', background: ACCENT, color: PAPER, fontSize: 14, fontWeight: 600, padding: '14px 0', borderRadius: 3, textDecoration: 'none', textAlign: 'center' }}>
                  Fix everything with AI — free
                </a>
                <div style={{ textAlign: 'center', fontSize: 12, color: INK_FAINT, marginTop: 10 }}>No credit card &middot; 30 seconds</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── PROBLEM / STATS ─────────────────────────────────── */}
      <section style={{ borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}`, background: CARD }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: isMobile ? '56px 22px' : '88px 40px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '0.85fr 1.15fr', gap: isMobile ? 40 : 72, alignItems: 'start' }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: INK_FAINT, marginBottom: 18 }}>Why good candidates get skipped</p>
            <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: isMobile ? 28 : 34, lineHeight: 1.2, marginBottom: 18 }}>It isn’t your experience. It’s the filter standing in front of it.</h2>
            <p style={{ fontSize: 15, color: INK_SOFT, lineHeight: 1.75, maxWidth: 420 }}>
              Applicant Tracking Systems scan for keywords and structure before any person opens your CV. One mismatch and a qualified candidate disappears from the process entirely.
            </p>
          </div>
          <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: isMobile ? '24px 16px' : 0, borderTop: `1px solid ${LINE}` }}>
            {stats.map((s, i) => (
              <div key={s.n} style={{ padding: '24px 20px 0 0', borderRight: !isMobile && i < 3 ? `1px solid ${LINE}` : 'none' }}>
                <div style={{ fontFamily: SERIF, fontSize: isMobile ? 26 : 32, marginBottom: 10 }}>{s.n}</div>
                <div style={{ fontSize: 13, color: INK_SOFT, lineHeight: 1.55 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CV TRANSFORMATION SHOWCASE ───────────────────────── */}
      <CvTransformShowcase isMobile={isMobile} />

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section id="how" style={{ padding: isMobile ? '56px 22px' : '96px 40px', maxWidth: 1120, margin: '0 auto' }}>
        <div style={{ display: isMobile ? 'block' : 'grid', gridTemplateColumns: '340px 1fr', gap: 80, alignItems: 'start' }}>
          <div style={{ marginBottom: isMobile ? 36 : 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: INK_FAINT, marginBottom: 18 }}>How it works</p>
            <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: isMobile ? 28 : 34, lineHeight: 1.2, marginBottom: 18 }}>One CV. Rewritten for every role you apply to.</h2>
            <p style={{ fontSize: 15, color: INK_SOFT, lineHeight: 1.75, marginBottom: 26 }}>Upload once. Let the AI handle every application from there.</p>
            <a href="/sign-up" style={{ display: 'inline-block', background: ACCENT, color: PAPER, fontSize: 13.5, fontWeight: 600, padding: '12px 24px', borderRadius: 3, textDecoration: 'none' }}>Start free</a>
          </div>
          <div style={{ borderTop: `1px solid ${LINE}` }}>
            {steps.map(step => (
              <div key={step.n} className="feature-row" style={{ display: 'grid', gridTemplateColumns: '48px 1fr', gap: 24, padding: '28px 0', borderBottom: `1px solid ${LINE}` }}>
                <span style={{ fontFamily: SERIF, fontSize: 15, color: INK_FAINT }}>{step.n}</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{step.title}</div>
                  <p style={{ fontSize: 14, color: INK_SOFT, lineHeight: 1.7, maxWidth: 520 }}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section id="features" style={{ padding: isMobile ? '56px 22px' : '96px 40px', maxWidth: 1120, margin: '0 auto' }}>
        <div style={{ maxWidth: 560, marginBottom: isMobile ? 36 : 56 }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: INK_FAINT, marginBottom: 18 }}>What you get</p>
          <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: isMobile ? 28 : 34, lineHeight: 1.2 }}>Everything built around one job: getting you the interview.</h2>
        </div>
        <div style={{ borderTop: `1px solid ${LINE}` }}>
          {features.map(f => (
            <div key={f.n} className="feature-row" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '56px 260px 1fr', gap: isMobile ? 6 : 32, padding: isMobile ? '20px 0' : '26px 0', borderBottom: `1px solid ${LINE}`, alignItems: 'start' }}>
              <span style={{ fontFamily: SERIF, fontSize: 13, color: INK_FAINT, paddingTop: 3 }}>{f.n}</span>
              <span style={{ fontSize: 15.5, fontWeight: 600 }}>{f.title}</span>
              <p style={{ fontSize: 14, color: INK_SOFT, lineHeight: 1.7 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────── */}
      <section style={{ borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}`, background: CARD }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: isMobile ? '56px 22px' : '88px 40px' }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: INK_FAINT, textAlign: 'center', marginBottom: 44 }}>What people say after rewriting</p>
          <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28 }}>
            {testimonials.map(t => (
              <div key={t.name}>
                <div style={{ display: 'flex', gap: 2, marginBottom: 14 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill={AMBER}><path d="M12 2l2.9 6.9 7.1.6-5.4 4.8 1.7 7-6.3-4-6.3 4 1.7-7-5.4-4.8 7.1-.6z" /></svg>
                  ))}
                </div>
                <p style={{ fontSize: 15, color: INK, lineHeight: 1.75, fontStyle: 'italic', marginBottom: 20 }}>&ldquo;{t.quote}&rdquo;</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(63,93,82,0.1)', color: ACCENT, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{t.initials}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</div>
                    <div style={{ fontSize: 12.5, color: INK_FAINT, marginTop: 1 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: isMobile ? '56px 22px' : '96px 40px', maxWidth: 1120, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto 48px' }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: INK_FAINT, marginBottom: 18 }}>Pricing</p>
          <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: isMobile ? 28 : 34, lineHeight: 1.2 }}>Start free. Pay only if it’s working.</h2>
        </div>
        <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {pricing.map(p => (
            <div key={p.name} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 4, padding: '32px 28px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: INK_SOFT, marginBottom: 14 }}>{p.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
                <span style={{ fontFamily: SERIF, fontSize: 30 }}>{p.price[currency]}</span>
                <span style={{ fontSize: 13, color: INK_FAINT }}>{p.per}</span>
              </div>
              <div style={{ fontSize: 13, color: INK_FAINT, marginBottom: 24 }}>{p.desc}</div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 20, borderTop: `1px solid ${LINE}`, marginBottom: 24 }}>
                {p.items.map(it => (
                  <div key={it} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13.5, color: INK_SOFT }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.4" style={{ flexShrink: 0, marginTop: 3 }}><path d="M4 12l5 5 11-11" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span>{it}</span>
                  </div>
                ))}
              </div>
              {p.highlight
                ? <a href="/sign-up" style={{ background: ACCENT, color: PAPER, fontSize: 14, fontWeight: 600, padding: '13px 0', borderRadius: 3, textDecoration: 'none', textAlign: 'center' }}>{p.cta}</a>
                : <a href="/sign-up" style={{ background: 'transparent', color: INK, border: `1px solid ${INK}`, fontSize: 14, fontWeight: 600, padding: '13px 0', borderRadius: 3, textDecoration: 'none', textAlign: 'center' }}>{p.cta}</a>
              }
            </div>
          ))}
        </div>
        <div className="stack-mobile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 12 : 32, flexWrap: 'wrap', marginTop: 36, paddingTop: 28, borderTop: `1px solid ${LINE}` }}>
          {[
            ['M9 12l2 2 4-4', 'Secure payment via Paystack'],
            ['M12 2l8 4v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6z', '30-day money-back guarantee on Pro'],
            ['M6 6l12 12M6 18L18 6', 'Cancel anytime, no lock-in'],
          ].map(([path, label]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: INK_SOFT }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={path} /></svg>
              {label}
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section id="faq" style={{ borderTop: `1px solid ${LINE}`, background: CARD }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: isMobile ? '56px 22px' : '96px 40px' }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: INK_FAINT, marginBottom: 18 }}>FAQ</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap', marginBottom: 32 }}>
            <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: isMobile ? 26 : 32, lineHeight: 1.2 }}>Questions people ask before starting.</h2>
            <input value={faqSearch} onChange={e => setFaqSearch(e.target.value)} placeholder="Search questions..." style={{ width: isMobile ? '100%' : 220, padding: '10px 14px', background: PAPER, border: `1px solid ${LINE}`, borderRadius: 3, fontSize: 13, color: INK, fontFamily: 'inherit' }} />
          </div>
          <div style={{ borderTop: `1px solid ${LINE}` }}>
            {filteredFaqs.length === 0
              ? <div style={{ fontSize: 13, color: INK_FAINT, padding: '24px 0' }}>No questions match &ldquo;{faqSearch}&rdquo;</div>
              : filteredFaqs.map((faq, i) => (
                <div key={faq.q} className="faq-row">
                  <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 16, fontFamily: 'inherit' }}>
                    <span style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.4, flex: 1 }}>{faq.q}</span>
                    <span style={{ fontSize: 18, color: INK_FAINT, flexShrink: 0, lineHeight: 1 }}>{openFaq === i ? '−' : '+'}</span>
                  </button>
                  {openFaq === i && (
                    <p style={{ fontSize: 14, color: INK_SOFT, lineHeight: 1.75, paddingBottom: 22, maxWidth: 620 }}>{faq.a}</p>
                  )}
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '64px 22px' : '110px 40px' }}>
        <div style={{ maxWidth: 620, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: isMobile ? 30 : 42, lineHeight: 1.15, marginBottom: 18 }}>Stop sending CVs into the void.</h2>
          <p style={{ fontSize: isMobile ? 15 : 16, color: INK_SOFT, lineHeight: 1.72, maxWidth: 440, margin: '0 auto 32px' }}>
            Rewrite your CV for the next role you apply to — free, in about 30 seconds.
          </p>
          <a href="/sign-up" style={{ display: 'inline-block', background: ACCENT, color: PAPER, fontSize: isMobile ? 14.5 : 15.5, fontWeight: 600, padding: isMobile ? '15px 30px' : '16px 40px', borderRadius: 3, textDecoration: 'none' }}>
            Get your first 3 rewrites free
          </a>
        </div>
      </section>

      <Footer theme="light" />

      {/* MOBILE STICKY CTA */}
      {isMobile && !isSignedIn && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 300, background: 'rgba(250,248,243,0.97)', backdropFilter: 'blur(10px)', borderTop: `1px solid ${LINE}`, padding: '12px 20px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
          <a href="/sign-up" style={{ display: 'block', background: ACCENT, color: PAPER, fontSize: 15, fontWeight: 600, padding: '14px 24px', borderRadius: 3, textDecoration: 'none', textAlign: 'center' }}>
            Start free — 3 CV rewrites
          </a>
        </div>
      )}
    </main>
  );
}
