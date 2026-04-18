'use client';
import { useState } from 'react';

export default function RecruitersPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  const plans = [
    {
      name: 'Starter',
      price: '$99',
      period: '/month',
      desc: 'Perfect for small agencies and in-house recruiters',
      features: [
        'Post up to 10 jobs/month',
        'AI candidate matching',
        'Access to 50,000+ active candidates',
        'Email support',
      ],
      highlight: false,
    },
    {
      name: 'Growth',
      price: '$299',
      period: '/month',
      desc: 'For growing teams that need volume and speed',
      features: [
        'Post up to 50 jobs/month',
        'Priority AI matching',
        'Access to 200,000+ active candidates',
        'CV screening & shortlisting',
        'Dedicated account manager',
        'Analytics dashboard',
      ],
      highlight: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      desc: 'For large organisations with complex hiring needs',
      features: [
        'Unlimited job postings',
        'Custom AI matching models',
        'Full candidate database access',
        'ATS integration',
        'SLA guarantee',
        'White-label option',
      ],
      highlight: false,
    },
  ];

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
        <div style={{ display: 'inline-block', background: 'rgba(200,230,0,0.12)', border: '1px solid rgba(200,230,0,0.3)', borderRadius: 99, padding: '6px 18px', fontSize: 12, color: '#C8E600', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 20 }}>
          Coming Soon
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, color: '#FFFFFF', marginBottom: 16, lineHeight: 1.2 }}>
          Hire faster with<br /><span style={{ color: '#C8E600' }}>AI-powered recruiting</span>
        </h1>
        <p style={{ fontSize: 16, color: '#90C898', maxWidth: 560, margin: '0 auto 32px', lineHeight: 1.8 }}>
          Jobsesame for Recruiters is launching soon. Get access to 500,000+ pre-screened candidates, AI matching, and one-click outreach — at a fraction of traditional agency fees.
        </p>

        {!submitted ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, maxWidth: 440, margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Your work email"
              required
              style={{ flex: 1, minWidth: 220, padding: '13px 18px', border: '2px solid #C8E600', borderRadius: 11, fontSize: 14, color: '#052A14', fontWeight: 600, outline: 'none', background: '#fff' }}
            />
            <button type="submit" style={{ background: '#C8E600', color: '#052A14', fontSize: 14, fontWeight: 800, padding: '13px 28px', borderRadius: 11, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Get early access
            </button>
          </form>
        ) : (
          <div style={{ background: 'rgba(200,230,0,0.1)', border: '1.5px solid #C8E600', borderRadius: 12, padding: '16px 28px', display: 'inline-block', fontSize: 15, color: '#C8E600', fontWeight: 700 }}>
            ✓ You're on the list — we'll be in touch soon!
          </div>
        )}
      </div>

      {/* PRICING */}
      <div style={{ padding: '60px 24px', maxWidth: 960, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#052A14', marginBottom: 12 }}>Simple, transparent pricing</h2>
          <p style={{ fontSize: 15, color: '#4A8A5A' }}>No placement fees. No surprises. Cancel any time.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
          {plans.map(plan => (
            <div key={plan.name} style={{
              background: plan.highlight ? '#052A14' : '#fff',
              border: `2px solid ${plan.highlight ? '#C8E600' : '#D8EED8'}`,
              borderRadius: 20,
              padding: '32px 28px',
              position: 'relative',
            }}>
              {plan.highlight && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#C8E600', color: '#052A14', fontSize: 11, fontWeight: 800, padding: '4px 16px', borderRadius: 99, whiteSpace: 'nowrap' }}>
                  MOST POPULAR
                </div>
              )}
              <div style={{ fontSize: 13, fontWeight: 700, color: plan.highlight ? '#90C898' : '#4A8A5A', marginBottom: 8 }}>{plan.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: plan.highlight ? '#C8E600' : '#052A14' }}>{plan.price}</span>
                {plan.period && <span style={{ fontSize: 14, color: plan.highlight ? '#5A9A6A' : '#4A8A5A' }}>{plan.period}</span>}
              </div>
              <p style={{ fontSize: 13, color: plan.highlight ? '#5A9A6A' : '#4A8A5A', marginBottom: 24, lineHeight: 1.6 }}>{plan.desc}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13, color: plan.highlight ? '#A8D8B0' : '#2A4A2A' }}>
                    <span style={{ color: '#C8E600', flexShrink: 0, fontWeight: 700 }}>✓</span>
                    {f}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setSubmitted(false)}
                style={{
                  width: '100%',
                  background: plan.highlight ? '#C8E600' : 'transparent',
                  color: plan.highlight ? '#052A14' : '#052A14',
                  fontSize: 13,
                  fontWeight: 800,
                  padding: '12px 0',
                  borderRadius: 10,
                  border: plan.highlight ? 'none' : '2px solid #052A14',
                  cursor: 'pointer',
                }}
              >
                {plan.price === 'Custom' ? 'Contact us' : 'Join waitlist'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* WHY */}
      <div style={{ background: '#052A14', padding: '60px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#FFFFFF', marginBottom: 40 }}>Why recruiters choose Jobsesame</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
            {[
              { icon: '🤖', title: 'AI shortlisting', desc: 'CV screening and candidate ranking done automatically — save 10+ hours per hire.' },
              { icon: '🌍', title: 'Global reach', desc: 'Access candidates from 50+ countries actively looking for work right now.' },
              { icon: '⚡', title: 'Speed to hire', desc: 'Average time-to-shortlist under 24 hours. Traditional agencies take weeks.' },
              { icon: '💰', title: 'No placement fees', desc: 'Flat monthly subscription. No percentage-of-salary surprises ever.' },
            ].map(item => (
              <div key={item.title} style={{ background: '#072E16', border: '1.5px solid #1A4A2A', borderRadius: 16, padding: 24, textAlign: 'left' }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{item.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#C8E600', marginBottom: 8 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: '#5A9A6A', lineHeight: 1.7 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
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
