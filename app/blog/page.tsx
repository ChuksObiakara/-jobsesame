'use client';
import { useState } from 'react';

const PREVIEW_POSTS = [
  {
    tag: 'CV Tips',
    title: '7 things ATS systems reject in the first 10 seconds',
    desc: 'Most CVs are filtered out before a human ever reads them. Here is exactly what to fix.',
    date: 'Coming soon',
  },
  {
    tag: 'Job Search',
    title: 'How to get 3x more callbacks with the same experience',
    desc: 'Tailoring your CV for each role sounds tedious — but AI can do it in 30 seconds. We show you how.',
    date: 'Coming soon',
  },
  {
    tag: 'Interview Prep',
    title: 'The STAR method: how to answer any behavioural question',
    desc: 'Every interview includes behavioural questions. Learn the one framework that works every time.',
    date: 'Coming soon',
  },
  {
    tag: 'Remote Work',
    title: 'Best countries to relocate for tech jobs in 2025',
    desc: 'From Singapore to Germany — where tech salaries are high, visas are accessible, and quality of life is excellent.',
    date: 'Coming soon',
  },
  {
    tag: 'Salary',
    title: 'How to negotiate your salary — and actually win',
    desc: 'Most candidates leave money on the table. These evidence-backed tactics change that.',
    date: 'Coming soon',
  },
  {
    tag: 'Cover Letters',
    title: 'Why your cover letter is getting ignored (and how to fix it)',
    desc: 'A cover letter should not summarise your CV. Here is what it should do instead.',
    date: 'Coming soon',
  },
];

export default function BlogPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  const tagColors: Record<string, { bg: string; color: string }> = {
    'CV Tips':       { bg: 'rgba(200,230,0,0.12)', color: '#C8E600' },
    'Job Search':    { bg: 'rgba(168,216,176,0.15)', color: '#90C898' },
    'Interview Prep':{ bg: 'rgba(255,165,0,0.12)', color: '#FFA500' },
    'Remote Work':   { bg: 'rgba(100,180,255,0.12)', color: '#7EC8F0' },
    'Salary':        { bg: 'rgba(200,230,0,0.12)', color: '#C8E600' },
    'Cover Letters': { bg: 'rgba(168,216,176,0.15)', color: '#90C898' },
  };

  return (
    <main style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#F4FCF4', minHeight: '100vh', margin: 0 }}>

      {/* NAV */}
      <nav style={{ background: '#052A14', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 36, height: 36, background: '#C8E600', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
              <circle cx="9" cy="9" r="5.5" stroke="#052A14" strokeWidth="2.2"/>
              <circle cx="9" cy="9" r="2.5" fill="#052A14" opacity="0.4"/>
              <line x1="13.5" y1="13.5" x2="20" y2="20" stroke="#052A14" strokeWidth="2.8" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontSize: 18, fontWeight: 800 }}>
            <span style={{ color: '#FFFFFF' }}>job</span>
            <span style={{ color: '#C8E600' }}>sesame</span>
          </span>
        </a>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <a href="/jobs" style={{ fontSize: 13, color: '#A8D8B0', fontWeight: 500, textDecoration: 'none' }}>Find Jobs</a>
          <a href="/" style={{ background: '#C8E600', color: '#052A14', fontSize: 13, fontWeight: 800, padding: '9px 22px', borderRadius: 99, textDecoration: 'none' }}>Get Started</a>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ background: '#052A14', padding: '60px 24px 48px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: 'rgba(200,230,0,0.12)', border: '1px solid rgba(200,230,0,0.3)', borderRadius: 99, padding: '6px 18px', fontSize: 12, color: '#C8E600', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' as const, marginBottom: 20 }}>
          Coming Soon
        </div>
        <h1 style={{ fontSize: 'clamp(26px, 5vw, 44px)', fontWeight: 800, color: '#FFFFFF', marginBottom: 16, lineHeight: 1.2 }}>
          Career advice that<br /><span style={{ color: '#C8E600' }}>actually works</span>
        </h1>
        <p style={{ fontSize: 16, color: '#90C898', maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.8 }}>
          Practical guides on CV writing, job searching, salary negotiation, and landing interviews — written by people who have done it, not just people who write about it.
        </p>

        {!submitted ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, maxWidth: 440, margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Your email — get notified when we launch"
              required
              style={{ flex: 1, minWidth: 220, padding: '13px 18px', border: '2px solid #C8E600', borderRadius: 11, fontSize: 14, color: '#052A14', fontWeight: 600, outline: 'none', background: '#fff' }}
            />
            <button type="submit" style={{ background: '#C8E600', color: '#052A14', fontSize: 14, fontWeight: 800, padding: '13px 28px', borderRadius: 11, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Notify me
            </button>
          </form>
        ) : (
          <div style={{ background: 'rgba(200,230,0,0.1)', border: '1.5px solid #C8E600', borderRadius: 12, padding: '16px 28px', display: 'inline-block', fontSize: 15, color: '#C8E600', fontWeight: 700 }}>
            ✓ Done — you will be first to know when we go live!
          </div>
        )}
      </div>

      {/* PREVIEW POSTS */}
      <div style={{ padding: '60px 24px', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#052A14', marginBottom: 32, textAlign: 'center' }}>
          Topics launching first
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {PREVIEW_POSTS.map(post => {
            const tc = tagColors[post.tag] || { bg: 'rgba(200,230,0,0.12)', color: '#C8E600' };
            return (
              <div key={post.title} style={{
                background: '#fff',
                border: '1.5px solid #D8EED8',
                borderRadius: 16,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}>
                <span style={{ display: 'inline-block', background: tc.bg, color: tc.color, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99, alignSelf: 'flex-start' }}>{post.tag}</span>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#052A14', lineHeight: 1.4, margin: 0 }}>{post.title}</h3>
                <p style={{ fontSize: 13, color: '#4A8A5A', lineHeight: 1.7, margin: 0 }}>{post.desc}</p>
                <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid #EAF5EA' }}>
                  <span style={{ fontSize: 11, color: '#90A890', fontWeight: 600 }}>{post.date}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: '#052A14', padding: '48px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', marginBottom: 12 }}>Start landing interviews today</h2>
        <p style={{ fontSize: 14, color: '#5A9A6A', marginBottom: 28 }}>The blog is coming — but the AI CV rewriter is live right now.</p>
        <a href="/" style={{ background: '#C8E600', color: '#052A14', fontSize: 15, fontWeight: 800, padding: '14px 36px', borderRadius: 99, textDecoration: 'none', display: 'inline-block' }}>
          Try Jobsesame free →
        </a>
      </div>

      {/* FOOTER */}
      <footer style={{ background: '#052A14', borderTop: '1px solid #0D4A20', padding: '24px', textAlign: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 800 }}>
          <span style={{ color: '#FFFFFF' }}>job</span>
          <span style={{ color: '#C8E600' }}>sesame</span>
        </span>
        <div style={{ fontSize: 11, color: '#1A4A2A', marginTop: 8 }}>© 2025 Jobsesame</div>
      </footer>
    </main>
  );
}
