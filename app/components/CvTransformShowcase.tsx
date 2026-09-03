'use client';
import { useEffect, useState } from 'react';
import { INK, INK_SOFT, INK_FAINT, LINE, PAPER, CARD, ACCENT, CLAY, SERIF } from '../lib/theme';

type Example = {
  key: string;
  role: string;
  before: string;
  after: string;
  keywords: string[];
  score: number;
};

const EXAMPLES: Example[] = [
  {
    key: 'engineer',
    role: 'Software Engineer',
    before: 'Worked on the backend team and fixed bugs.',
    after: 'Resolved 40+ backend defects across a Node.js microservices platform, cutting production incidents by 25% and improving average API response time by 30%.',
    keywords: ['Node.js', 'Microservices', 'API performance', 'Incident reduction'],
    score: 93,
  },
  {
    key: 'marketing',
    role: 'Marketing Manager',
    before: 'Responsible for social media and marketing campaigns.',
    after: 'Led social media strategy across 4 platforms, growing engaged audience 65% and driving a 3× increase in qualified leads from campaign content.',
    keywords: ['Social strategy', 'Campaign management', 'Lead generation', 'Audience growth'],
    score: 90,
  },
  {
    key: 'sales',
    role: 'Sales Executive',
    before: 'Sold products to clients and managed accounts.',
    after: 'Managed a portfolio of 50+ enterprise accounts, exceeding quarterly sales targets by an average of 22% and closing R1.2M in new business over 12 months.',
    keywords: ['Enterprise accounts', 'Sales targets', 'Account growth', 'New business'],
    score: 88,
  },
];

const ATS_STEPS = [
  { label: 'Parses your CV', body: 'Extracts text from your PDF — headings, dates, bullet points, skills.' },
  { label: 'Matches keywords', body: 'Compares your wording against the exact terms in the job description.' },
  { label: 'Checks formatting', body: 'Flags tables, columns and graphics that scramble when imported.' },
  { label: 'Scores the match', body: 'Ranks you against other applicants before a human ever sees your CV.' },
];

const GOOD_CV_TIPS = [
  { title: 'Use strong action verbs', body: '“Led”, “built”, “delivered” — not “responsible for” or “helped with”.' },
  { title: 'Quantify your impact', body: 'Numbers, percentages and timeframes make achievements concrete and easy to scan.' },
  { title: 'Match the job description', body: 'Mirror the exact keywords and phrasing the role uses — ATS rewards precision.' },
  { title: 'Keep formatting simple', body: 'Avoid tables, text boxes and columns — many ATS parsers scramble them on import.' },
  { title: 'Use standard section headings', body: '“Experience”, “Education”, “Skills” — parsers look for these exact labels.' },
  { title: 'Tailor it per application', body: 'A CV tuned to one role beats a generic one sent to fifty.' },
];

// Owns its own chip-reveal animation, keyed by role so switching tabs
// remounts (and so replays) it cleanly instead of resetting state in an effect.
function KeywordMatchPanel({ example }: { example: Example }) {
  const [chipStep, setChipStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setChipStep(s => (s >= example.keywords.length ? s : s + 1));
    }, 420);
    return () => clearInterval(id);
  }, [example.keywords.length]);

  const liveScore = Math.round((chipStep / example.keywords.length) * example.score);

  return (
    <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 4, padding: 28 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: INK_FAINT }}>How the ATS scores this rewrite</span>
        <span style={{ fontFamily: SERIF, fontSize: 26, color: liveScore >= 75 ? ACCENT : CLAY }}>{liveScore}%</span>
      </div>
      <div style={{ height: 6, background: LINE, borderRadius: 99, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ height: '100%', width: `${liveScore}%`, background: ACCENT, borderRadius: 99, transition: 'width 0.4s ease' }} />
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {example.keywords.map((kw, i) => (
          i < chipStep ? (
            <span key={kw} className="cvshow-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 99, background: 'rgba(63,93,82,0.1)', color: ACCENT, fontSize: 12.5, fontWeight: 600 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="3"><path d="M4 12l5 5 11-11" strokeLinecap="round" strokeLinejoin="round" /></svg>
              {kw}
            </span>
          ) : (
            <span key={kw} style={{ display: 'inline-flex', padding: '7px 14px', borderRadius: 99, border: `1px dashed ${LINE}`, color: INK_FAINT, fontSize: 12.5, fontWeight: 600 }}>
              {kw}
            </span>
          )
        ))}
      </div>
    </div>
  );
}

export default function CvTransformShowcase({ isMobile }: { isMobile: boolean }) {
  const [activeKey, setActiveKey] = useState(EXAMPLES[0].key);
  const [atsStep, setAtsStep] = useState(0);

  const example = EXAMPLES.find(e => e.key === activeKey) || EXAMPLES[0];

  // Continuously cycle the ATS pipeline tracker so the section feels alive.
  useEffect(() => {
    const id = setInterval(() => {
      setAtsStep(s => (s + 1) % ATS_STEPS.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="transform" style={{ borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}`, background: CARD }}>
      <style>{`
        @keyframes cvshow-pop { 0% { transform: scale(0.85); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes cvshow-scan { 0% { top: 0%; } 100% { top: 100%; } }
        .cvshow-tab { transition: all 0.18s ease; cursor: pointer; }
        .cvshow-chip { animation: cvshow-pop 0.28s ease both; }
        .cvshow-ats-step { transition: opacity 0.3s ease, transform 0.3s ease; }
        @media (max-width: 767px) {
          .cvshow-grid { grid-template-columns: 1fr !important; }
          .cvshow-steps { grid-template-columns: 1fr 1fr !important; }
          .cvshow-tips { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1120, margin: '0 auto', padding: isMobile ? '56px 22px' : '96px 40px' }}>
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 48px' }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: INK_FAINT, marginBottom: 18 }}>See it in action</p>
          <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: isMobile ? 28 : 34, lineHeight: 1.2, marginBottom: 14 }}>Watch a CV go from ignored to interviewed.</h2>
          <p style={{ fontSize: 15, color: INK_SOFT, lineHeight: 1.7 }}>Pick a role to see a real transformation, then watch how an ATS actually reads it.</p>
        </div>

        {/* Role tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 32 }}>
          {EXAMPLES.map(e => (
            <button
              key={e.key}
              onClick={() => setActiveKey(e.key)}
              className="cvshow-tab"
              style={{
                padding: '10px 20px',
                borderRadius: 99,
                fontSize: 13.5,
                fontWeight: 600,
                fontFamily: 'inherit',
                border: `1px solid ${activeKey === e.key ? ACCENT : LINE}`,
                background: activeKey === e.key ? ACCENT : 'transparent',
                color: activeKey === e.key ? PAPER : INK_SOFT,
              }}
            >
              {e.role}
            </button>
          ))}
        </div>

        {/* Before / After */}
        <div className="cvshow-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 40 }}>
          <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 4, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: CLAY }} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: INK_FAINT }}>Before</span>
            </div>
            <p key={`before-${activeKey}`} style={{ fontSize: 15, color: INK_SOFT, lineHeight: 1.7, fontStyle: 'italic' }}>{example.before}</p>
          </div>
          <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 4, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: ACCENT }} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: INK_FAINT }}>After — rewritten by Jobsesame</span>
            </div>
            <p key={`after-${activeKey}`} style={{ fontSize: 15, color: INK, lineHeight: 1.7 }}>{example.after}</p>
          </div>
        </div>

        {/* ATS keyword-match visualisation */}
        <div style={{ marginBottom: 40 }}>
          <KeywordMatchPanel key={activeKey} example={example} />
        </div>

        {/* ATS pipeline tracker */}
        <div className="cvshow-steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 56 }}>
          {ATS_STEPS.map((s, i) => (
            <div key={s.label} className="cvshow-ats-step" style={{
              padding: '18px 16px',
              borderRadius: 4,
              border: `1px solid ${i === atsStep ? ACCENT : LINE}`,
              background: i === atsStep ? 'rgba(63,93,82,0.06)' : PAPER,
              opacity: i === atsStep ? 1 : 0.7,
              transform: i === atsStep ? 'translateY(-2px)' : 'none',
            }}>
              <div style={{ fontFamily: SERIF, fontSize: 13, color: i === atsStep ? ACCENT : INK_FAINT, marginBottom: 8 }}>{String(i + 1).padStart(2, '0')}</div>
              <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 12, color: INK_SOFT, lineHeight: 1.55 }}>{s.body}</div>
            </div>
          ))}
        </div>

        {/* What makes a good CV */}
        <div style={{ maxWidth: 640, margin: '0 auto 28px', textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: INK_FAINT, marginBottom: 14 }}>What actually makes a CV good</p>
          <h3 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: isMobile ? 22 : 26, lineHeight: 1.25 }}>The same principles behind every rewrite.</h3>
        </div>
        <div className="cvshow-tips" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 44 }}>
          {GOOD_CV_TIPS.map(tip => (
            <div key={tip.title} style={{ padding: 20, background: PAPER, border: `1px solid ${LINE}`, borderRadius: 4 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{tip.title}</div>
              <div style={{ fontSize: 13, color: INK_SOFT, lineHeight: 1.6 }}>{tip.body}</div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <a href="/sign-up" style={{ display: 'inline-block', background: ACCENT, color: PAPER, fontSize: 14, fontWeight: 600, padding: '13px 28px', borderRadius: 3, textDecoration: 'none' }}>Try it on your own CV — free</a>
        </div>
      </div>
    </section>
  );
}
