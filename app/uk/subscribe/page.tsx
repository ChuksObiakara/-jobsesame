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
    cta: null, // handled dynamically
    disabled: false,
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
    cta: 'Buy Credits — Coming Soon',
    disabled: true,
    tooltip: 'Stripe payment launching soon — join the waitlist below to be first',
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
    cta: 'Subscribe Pro — Coming Soon',
    disabled: true,
    tooltip: 'Stripe payment launching soon — join the waitlist below to be first',
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
    q: 'When will payments launch?',
    a: 'We are integrating Stripe for UK GBP payments and targeting launch very soon. Join the waitlist below and you\'ll be the first to know — and get an early-bird discount.',
  },
  {
    q: 'What jobs do you have in the UK?',
    a: 'We aggregate from Adzuna UK, JSearch, and Remotive — refreshed every 30 minutes. You\'ll find roles across tech, finance, healthcare, marketing, and more, with new listings added continuously.',
  },
];

export default function SubscribePage() {
  const { isSignedIn } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [waitlistMsg, setWaitlistMsg] = useState('');
  const [tooltip, setTooltip] = useState<string | null>(null);

  const submitWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setWaitlistStatus('loading');
    try {
      const res = await fetch('/api/uk/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), market: 'GB' }),
      });
      const data = await res.json();
      if (data.success) {
        setWaitlistStatus('done');
        setWaitlistMsg(data.alreadyJoined ? "You're already on the list — we'll notify you!" : "You're on the list! We'll email you the moment UK payments go live.");
        setEmail('');
      } else {
        setWaitlistStatus('error');
        setWaitlistMsg(data.error || 'Something went wrong. Please try again.');
      }
    } catch {
      setWaitlistStatus('error');
      setWaitlistMsg('Network error. Please try again.');
    }
  };

  return (
    <main style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: '#052A14', minHeight: '100vh', margin: 0, padding: 0, overflowX: 'hidden' }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ctaGlow { 0%,100%{box-shadow:0 6px 28px rgba(200,230,0,0.3)} 50%{box-shadow:0 6px 44px rgba(200,230,0,0.55)} }
        .faq-item { transition: background 0.15s; }
        .faq-item:hover { background: rgba(255,255,255,0.04) !important; }
        .plan-card { transition: transform 0.2s, border-color 0.2s; }
        .plan-card:hover { transform: translateY(-4px); }
        input::placeholder { color: rgba(255,255,255,0.25); }
        input:focus { border-color: rgba(200,230,0,0.45) !important; outline: none; }
      `}</style>

      {/* NAV */}
      <nav style={{ height: 64, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', position: 'sticky', top: 0, zIndex: 200, background: 'rgba(5,42,20,0.92)', backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)' }}>
        <a href="/uk" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <span style={{ fontSize: 17, fontWeight: 800 }}>
            <span style={{ color: '#FFFFFF' }}>job</span><span style={{ color: '#C8E600' }}>sesame</span>
          </span>
          <span style={{ fontSize: 10, background: 'rgba(200,230,0,0.12)', color: '#C8E600', border: '1px solid rgba(200,230,0,0.25)', borderRadius: 99, padding: '2px 7px', fontWeight: 700 }}>🇬🇧 UK</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <MarketSwitcher compact />
          {isSignedIn
            ? <UserButton afterSignOutUrl="/uk" />
            : <a href="/sign-up" style={{ background: '#C8E600', color: '#052A14', fontSize: 13, fontWeight: 800, padding: '8px 20px', borderRadius: 99, textDecoration: 'none' }}>Get started</a>
          }
        </div>
      </nav>

      {/* HERO */}
      <section style={{ textAlign: 'center', padding: '72px 24px 48px', maxWidth: 700, margin: '0 auto', animation: 'fadeInUp 0.5s ease-out' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(200,230,0,0.1)', border: '1px solid rgba(200,230,0,0.2)', borderRadius: 99, padding: '6px 16px', marginBottom: 24 }}>
          <span style={{ fontSize: 14 }}>🇬🇧</span>
          <span style={{ fontSize: 12, color: '#C8E600', fontWeight: 700, letterSpacing: 0.4 }}>UK Jobs · Coming Soon</span>
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.1, marginBottom: 18, letterSpacing: -0.8 }}>
          Unlock UK Jobs
        </h1>
        <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, marginBottom: 0 }}>
          Built for professionals serious about working in the UK.<br />
          AI rewrites your CV for every application in 30 seconds.
        </p>
      </section>

      {/* PLAN CARDS */}
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px 64px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, alignItems: 'start' }}>
          {PLANS.map(plan => (
            <div
              key={plan.id}
              className="plan-card"
              style={{
                background: plan.highlight ? 'rgba(200,230,0,0.05)' : 'rgba(255,255,255,0.03)',
                border: `1.5px solid ${plan.highlight ? 'rgba(200,230,0,0.35)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 20,
                padding: '28px 26px',
                position: 'relative',
              }}
            >
              {plan.tag && (
                <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: '#C8E600', color: '#052A14', fontSize: 10, fontWeight: 800, padding: '4px 14px', borderRadius: 99, whiteSpace: 'nowrap', letterSpacing: 0.5 }}>
                  {plan.tag}
                </div>
              )}

              {/* Plan header */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>{plan.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                  <span style={{ fontSize: 42, fontWeight: 800, color: '#FFFFFF', lineHeight: 1 }}>{plan.price}</span>
                  {plan.period && <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>{plan.period}</span>}
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 20 }} />

              {/* Features */}
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 11 }}>
                {plan.features.map(f => (
                  <li key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: f.ok ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.22)' }}>
                    <span style={{ fontSize: 13, flexShrink: 0, color: f.ok ? '#C8E600' : 'rgba(255,255,255,0.15)' }}>{f.ok ? '✓' : '✕'}</span>
                    {f.text}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {plan.id === 'free' ? (
                isSignedIn ? (
                  <div style={{ width: '100%', background: 'rgba(200,230,0,0.08)', border: '1px solid rgba(200,230,0,0.2)', color: '#C8E600', fontSize: 13, fontWeight: 700, padding: '13px 20px', borderRadius: 99, textAlign: 'center' }}>
                    ✓ Current Plan
                  </div>
                ) : (
                  <a href="/sign-up" style={{ display: 'block', width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 700, padding: '13px 20px', borderRadius: 99, textDecoration: 'none', textAlign: 'center' }}>
                    Get Started Free
                  </a>
                )
              ) : (
                <div style={{ position: 'relative' }}>
                  <button
                    disabled
                    onMouseEnter={() => setTooltip(plan.id)}
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 700, padding: '13px 20px',
                      borderRadius: 99, cursor: 'not-allowed',
                    }}
                  >
                    {plan.cta}
                  </button>
                  {tooltip === plan.id && (
                    <div style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)', background: '#0A2E18', border: '1px solid rgba(200,230,0,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, whiteSpace: 'normal', width: 220, textAlign: 'center', zIndex: 10, pointerEvents: 'none' }}>
                      {plan.tooltip}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* NOTIFY ME / WAITLIST */}
      <section style={{ maxWidth: 560, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ background: 'rgba(200,230,0,0.05)', border: '1.5px solid rgba(200,230,0,0.2)', borderRadius: 22, padding: '36px 32px', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 14 }}>🔔</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', marginBottom: 10 }}>Be first when we launch</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 24 }}>
            UK payments are launching very soon. Drop your email and we&apos;ll notify you the moment Credits and Pro are available — plus an early-bird discount.
          </p>

          {waitlistStatus === 'done' ? (
            <div style={{ background: 'rgba(200,230,0,0.1)', border: '1px solid rgba(200,230,0,0.3)', borderRadius: 12, padding: '16px 20px', color: '#C8E600', fontSize: 14, fontWeight: 700 }}>
              ✓ {waitlistMsg}
            </div>
          ) : (
            <form onSubmit={submitWaitlist} style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '13px 18px', fontSize: 15, color: '#FFFFFF', fontFamily: 'inherit', transition: 'border-color 0.15s' }}
              />
              {waitlistStatus === 'error' && (
                <p style={{ fontSize: 12, color: '#FF8080', margin: 0 }}>{waitlistMsg}</p>
              )}
              <button
                type="submit"
                disabled={waitlistStatus === 'loading'}
                style={{ background: waitlistStatus === 'loading' ? 'rgba(200,230,0,0.5)' : '#C8E600', color: '#052A14', fontSize: 14, fontWeight: 800, padding: '13px 24px', borderRadius: 99, border: 'none', cursor: waitlistStatus === 'loading' ? 'not-allowed' : 'pointer', animation: waitlistStatus !== 'loading' ? 'ctaGlow 2.5s ease-in-out infinite' : 'none' }}
              >
                {waitlistStatus === 'loading' ? 'Saving...' : 'Notify Me When Live →'}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px 96px' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 10, color: '#C8E600', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 12 }}>FAQ</div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#FFFFFF', letterSpacing: -0.4 }}>Common questions</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="faq-item"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: '100%', background: 'transparent', border: 'none', padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, cursor: 'pointer', textAlign: 'left' }}
              >
                <span style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.4 }}>{faq.q}</span>
                <span style={{ fontSize: 16, color: '#C8E600', flexShrink: 0, transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
              </button>
              {openFaq === i && (
                <div style={{ padding: '0 22px 18px', fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>
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
            <a key={l.label} href={l.href} style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textDecoration: 'none' }}>{l.label}</a>
          ))}
        </div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.1)', marginTop: 14 }}>© 2025 Jobsesame · UK</p>
      </div>
    </main>
  );
}
