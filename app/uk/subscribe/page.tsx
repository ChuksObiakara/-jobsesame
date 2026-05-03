'use client';
import { useState } from 'react';
import { useAuth, UserButton } from '@clerk/nextjs';
import MarketSwitcher from '../../components/MarketSwitcher';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '£0',
    period: '',
    highlight: false,
    tag: null,
    features: [
      { text: 'Browse all UK job listings', ok: true },
      { text: 'Save jobs', ok: true },
      { text: 'Job applications', ok: false },
      { text: 'AI CV rewriter', ok: false },
      { text: 'Quick Apply', ok: false },
    ],
    type: 'active' as const,
  },
  {
    id: 'credits',
    name: 'Credits',
    price: '£10',
    period: 'one-time',
    highlight: true,
    tag: 'Most Popular',
    features: [
      { text: '20 UK job applications', ok: true },
      { text: 'AI CV rewriter', ok: true },
      { text: 'Quick Apply on all jobs', ok: true },
      { text: 'Application tracker', ok: true },
      { text: 'Priority matching', ok: false },
    ],
    type: 'soon' as const,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '£21',
    period: '/ month',
    highlight: false,
    tag: null,
    features: [
      { text: 'Unlimited UK applications', ok: true },
      { text: 'Priority job matching', ok: true },
      { text: 'UK CV rewriter unlimited', ok: true },
      { text: 'Cover letter generator', ok: true },
      { text: 'UK salary intelligence', ok: true },
    ],
    type: 'soon' as const,
  },
] as const;

const FAQS = [
  {
    q: 'Can I apply from South Africa?',
    a: 'Yes — all applications are submitted on your behalf. You don\'t need to be in the UK. Our AI fills in your details and submits directly to UK employers through their application portals.',
  },
  {
    q: 'How does auto-apply work?',
    a: 'Our AI reads the job description, rewrites your CV to match the role in 30 seconds, then fills and submits the application form using your CV data. For Greenhouse-powered employers this is fully automated.',
  },
  {
    q: 'Is my data safe?',
    a: 'Yes. Jobsesame is GDPR compliant for UK users. Your CV and personal data are processed securely, never sold to third parties, and you can request deletion at any time via our data deletion page.',
  },
  {
    q: 'What jobs do you have in the UK?',
    a: 'We aggregate from Adzuna UK, JSearch, and Remotive — refreshed every 30 minutes. Roles across tech, finance, healthcare, marketing, and more, with new listings added continuously.',
  },
  {
    q: 'What does the AI change in my CV?',
    a: 'It adds the keywords from the job description, restructures bullet points to match what that employer is looking for, and rewrites your profile statement. Your facts — job titles, companies, dates — are never changed.',
  },
];

export default function SubscribePage() {
  const { isSignedIn } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <main style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: '#061A0C', minHeight: '100vh', margin: 0, padding: 0, overflowX: 'hidden' }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ctaGlow { 0%,100%{box-shadow:0 4px 24px rgba(200,230,0,0.28)} 50%{box-shadow:0 4px 40px rgba(200,230,0,0.52)} }
        input::placeholder { color: rgba(255,255,255,0.22); }
        input:focus { border-color: rgba(200,230,0,0.4) !important; outline: none; }
      `}</style>

      {/* NAV */}
      <nav style={{ height: 64, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: 0, zIndex: 200, background: 'rgba(6,26,12,0.94)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }}>
        <a href="/uk" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ fontSize: 17, fontWeight: 800 }}>
            <span style={{ color: '#FFFFFF' }}>job</span><span style={{ color: '#C8E600' }}>sesame</span>
          </span>
          <span style={{ fontSize: 10, background: 'rgba(200,230,0,0.12)', color: '#C8E600', border: '1px solid rgba(200,230,0,0.24)', borderRadius: 4, padding: '2px 7px', fontWeight: 700 }}>🇬🇧 UK</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <MarketSwitcher compact />
          {isSignedIn
            ? <UserButton afterSignOutUrl="/uk" />
            : <a href="/sign-up" style={{ background: '#C8E600', color: '#061A0C', fontSize: 13, fontWeight: 800, padding: '8px 20px', borderRadius: 8, textDecoration: 'none' }}>Get started</a>
          }
        </div>
      </nav>

      {/* HERO */}
      <section style={{ textAlign: 'center', padding: '72px 24px 48px', maxWidth: 640, margin: '0 auto', animation: 'fadeInUp 0.5s ease-out' }}>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1, marginBottom: 18, letterSpacing: -1 }}>
          Unlock UK Jobs
        </h1>
        <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65 }}>
          Built for professionals serious about working in the UK.<br />
          AI rewrites your CV for every application in 30 seconds.
        </p>
      </section>

      {/* PLAN CARDS */}
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px 72px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18, alignItems: 'start' }}>
          {PLANS.map(plan => (
            <div
              key={plan.id}
              style={{
                background: plan.highlight ? 'rgba(200,230,0,0.05)' : 'rgba(255,255,255,0.02)',
                border: `1.5px solid ${plan.highlight ? 'rgba(200,230,0,0.3)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 16,
                padding: '26px 22px',
                position: 'relative',
                transition: 'transform 0.2s',
              }}
            >
              {plan.tag && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#C8E600', color: '#061A0C', fontSize: 10, fontWeight: 800, padding: '3px 12px', borderRadius: 4, whiteSpace: 'nowrap', letterSpacing: 0.4 }}>
                  {plan.tag}
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>{plan.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                  <span style={{ fontSize: 42, fontWeight: 800, color: '#FFFFFF', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{plan.price}</span>
                  {plan.period && <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>{plan.period}</span>}
                </div>
              </div>

              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 20 }} />

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 11 }}>
                {plan.features.map(f => (
                  <li key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: f.ok ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)' }}>
                    <span style={{ fontSize: 12, flexShrink: 0, color: f.ok ? '#C8E600' : 'rgba(255,255,255,0.12)', fontWeight: 700 }}>{f.ok ? '✓' : '✕'}</span>
                    {f.text}
                  </li>
                ))}
              </ul>

              {plan.id === 'free' ? (
                isSignedIn ? (
                  <div style={{ width: '100%', background: 'rgba(200,230,0,0.07)', border: '1px solid rgba(200,230,0,0.18)', color: '#C8E600', fontSize: 13, fontWeight: 700, padding: '12px 20px', borderRadius: 8, textAlign: 'center' }}>
                    ✓ Current Plan
                  </div>
                ) : (
                  <a href="/sign-up" style={{ display: 'block', width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: 700, padding: '12px 20px', borderRadius: 8, textDecoration: 'none', textAlign: 'center' }}>
                    Get Started Free
                  </a>
                )
              ) : (
                <div style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 700, padding: '12px 20px', borderRadius: 8, textAlign: 'center' }}>
                  {plan.name === 'Credits' ? 'Buy Credits' : 'Subscribe Pro'} <span style={{ fontSize: 10, color: 'rgba(200,230,0,0.45)', marginLeft: 4 }}>· launching soon</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.25)', marginTop: 24 }}>
          Stripe GBP payments launching soon. <a href="/sign-up" style={{ color: 'rgba(200,230,0,0.6)', textDecoration: 'none' }}>Sign up free</a> to be notified first.
        </p>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px 96px' }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: '#FFFFFF', letterSpacing: -0.5, marginBottom: 36 }}>Common questions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {FAQS.map((faq, i) => (
            <div key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: '100%', background: 'transparent', border: 'none', padding: '18px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, cursor: 'pointer', textAlign: 'left' }}
              >
                <span style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.4 }}>{faq.q}</span>
                <span style={{ fontSize: 18, color: '#C8E600', flexShrink: 0, transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.18s', lineHeight: 1 }}>+</span>
              </button>
              {openFaq === i && (
                <div style={{ paddingBottom: 18, fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.75 }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { label: 'Back to UK Home', href: '/uk' },
            { label: 'Browse UK Jobs', href: '/uk/jobs' },
            { label: 'Privacy Policy', href: '/privacy' },
            { label: 'Contact', href: 'mailto:uk@jobsesame.co.za' },
          ].map(l => (
            <a key={l.label} href={l.href} style={{ fontSize: 12, color: 'rgba(255,255,255,0.22)', textDecoration: 'none' }}>{l.label}</a>
          ))}
        </div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.1)', marginTop: 14 }}>© 2025 Jobsesame · UK · GDPR compliant</p>
      </div>
    </main>
  );
}
