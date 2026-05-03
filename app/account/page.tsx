'use client';
import { useUser, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AccountPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  const [isMobile, setIsMobile] = useState(false);
  const [credits, setCredits] = useState<number>(3);
  const [isPro, setIsPro] = useState(false);
  const [proExpiresAt, setProExpiresAt] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [paying, setPaying] = useState(false);
  const [payingPlan, setPayingPlan] = useState<'credits' | 'pro' | null>(null);
  const [paymentError, setPaymentError] = useState('');
  const [currency, setCurrency] = useState<'ZAR' | 'USD'>('ZAR');
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelDone, setCancelDone] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.push('/sign-in');
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(d => { if (d.country_code !== 'ZA') setCurrency('USD'); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isSignedIn) return;
    fetch('/api/credits')
      .then(r => r.json())
      .then(d => {
        if (typeof d.credits === 'number') setCredits(d.credits);
        if (typeof d.isPro === 'boolean') setIsPro(d.isPro);
        if (d.proExpiresAt) setProExpiresAt(d.proExpiresAt);
      })
      .catch(() => {})
      .finally(() => setLoadingPlan(false));
  }, [isSignedIn]);

  const handlePayment = async (plan: 'credits' | 'pro') => {
    const email = user?.emailAddresses[0]?.emailAddress;
    if (!email) return;
    setPaying(true);
    setPayingPlan(plan);
    setPaymentError('');
    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, plan, currency }),
      });
      const data = await res.json();
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        setPaymentError(data.error || 'Payment failed. Please try again.');
        setPaying(false);
        setPayingPlan(null);
      }
    } catch {
      setPaymentError('Something went wrong. Please try again.');
      setPaying(false);
      setPayingPlan(null);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await fetch('/api/cancel', { method: 'POST' });
      setIsPro(false);
      setProExpiresAt(null);
      setCancelDone(true);
      setCancelConfirm(false);
    } catch {}
    setCancelling(false);
  };

  const planLabel = isPro ? 'Pro' : credits > 0 ? 'Credits' : 'Free';
  const planColor = isPro ? '#C8E600' : credits > 0 ? '#FFA500' : '#90C898';
  const planBg = isPro ? 'rgba(200,230,0,0.12)' : credits > 0 ? 'rgba(255,165,0,0.1)' : 'rgba(144,200,152,0.1)';
  const email = user?.emailAddresses[0]?.emailAddress || '';
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long' })
    : '';

  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    background: '#072E16',
    border: '1.5px solid #1A4A2A',
    borderRadius: 16,
    padding: isMobile ? 20 : 24,
    ...extra,
  });

  if (!isLoaded || !isSignedIn) return null;

  return (
    <main style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: '#052A14', minHeight: '100vh', overflowX: 'hidden' }}>

      {/* NAV */}
      <nav style={{ background: '#052A14', padding: '0 20px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #0D4A20', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 36, height: 36, background: '#C8E600', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
              <circle cx="9" cy="9" r="5.5" stroke="#052A14" strokeWidth="2.2" />
              <circle cx="9" cy="9" r="2.5" fill="#052A14" opacity="0.4" />
              <line x1="13.5" y1="13.5" x2="20" y2="20" stroke="#052A14" strokeWidth="2.8" strokeLinecap="round" />
            </svg>
          </div>
          <span style={{ fontSize: 18, fontWeight: 800 }}>
            <span style={{ color: '#FFFFFF' }}>job</span>
            <span style={{ color: '#C8E600' }}>sesame</span>
          </span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10 }}>
          <a href="/dashboard" style={{ fontSize: isMobile ? 12 : 13, color: '#A8D8B0', fontWeight: 600, textDecoration: 'none', padding: '8px 12px', whiteSpace: 'nowrap' }}>Dashboard</a>
          {!isMobile && <a href="/jobs" style={{ fontSize: 13, color: '#A8D8B0', fontWeight: 500, textDecoration: 'none', padding: '8px 12px', whiteSpace: 'nowrap' }}>Find Jobs</a>}
          <a href="/account" style={{ fontSize: isMobile ? 12 : 13, color: '#C8E600', fontWeight: 700, textDecoration: 'none', padding: '8px 12px', borderBottom: '2px solid #C8E600', whiteSpace: 'nowrap' }}>My Account</a>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: isMobile ? '24px 16px 48px' : '40px 24px 64px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* PAGE TITLE */}
        <div style={{ marginBottom: 4 }}>
          <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 800, color: '#FFFFFF', margin: '0 0 4px' }}>My Account</h1>
          <p style={{ fontSize: 13, color: '#5A9A6A', margin: 0 }}>Manage your plan, credits and account details.</p>
        </div>

        {/* ── CURRENT PLAN ───────────────────────────────────────── */}
        <div style={card()}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Current plan</h2>
            {loadingPlan ? (
              <div style={{ height: 28, width: 80, borderRadius: 99, background: '#1A4A2A' }} />
            ) : (
              <span style={{ fontSize: 13, fontWeight: 800, color: planColor, background: planBg, padding: '5px 14px', borderRadius: 99, border: `1px solid ${planColor}33` }}>
                {planLabel}
              </span>
            )}
          </div>

          {loadingPlan ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[180, 140].map((w, i) => (
                <div key={i} style={{ height: 14, width: w, borderRadius: 6, background: '#1A4A2A' }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {isPro ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, color: '#5A9A6A' }}>Status</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#C8E600' }}>✓ Pro — unlimited rewrites</span>
                  </div>
                  {proExpiresAt && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, color: '#5A9A6A' }}>Renews</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#90C898' }}>
                        {new Date(proExpiresAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, color: '#5A9A6A' }}>Credits remaining</span>
                    <span style={{ fontSize: 22, fontWeight: 900, color: credits > 0 ? '#FFA500' : '#F09595', lineHeight: 1 }}>{credits}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#3A7A4A' }}>
                    Each credit = 1 AI CV tailoring or cover letter. Free plan includes 3 credits.
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── UPGRADE PLANS ──────────────────────────────────────── */}
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF', margin: '0 0 12px' }}>Plans &amp; pricing</h2>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>

            {/* Credits card */}
            <div style={{ ...card({ border: '1.5px solid #1A4A2A' }), display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#FFA500', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 6 }}>Top-up credits</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#FFFFFF', lineHeight: 1, marginBottom: 4 }}>
                  {currency === 'ZAR' ? 'R99' : '$5'}
                </div>
                <div style={{ fontSize: 12, color: '#5A9A6A' }}>10 credits — pay as you go</div>
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {['10 AI CV rewrites', '10 cover letters', 'No subscription', 'Credits never expire'].map(f => (
                  <li key={f} style={{ fontSize: 12, color: '#90C898', display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                    <span style={{ color: '#C8E600', flexShrink: 0 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handlePayment('credits')}
                disabled={paying}
                style={{ marginTop: 'auto', width: '100%', background: paying && payingPlan === 'credits' ? '#1A4A2A' : 'transparent', color: paying && payingPlan === 'credits' ? '#3A7A4A' : '#C8E600', fontSize: 13, fontWeight: 800, padding: '11px 0', borderRadius: 99, border: '1.5px solid #C8E600', cursor: paying ? 'default' : 'pointer' }}
              >
                {paying && payingPlan === 'credits' ? 'Redirecting...' : 'Buy 10 credits →'}
              </button>
            </div>

            {/* Pro card */}
            <div style={{ ...card({ border: isPro ? '1.5px solid #1A4A2A' : '2px solid #C8E600', position: 'relative', overflow: 'hidden' }), display: 'flex', flexDirection: 'column', gap: 14 }}>
              {!isPro && (
                <div style={{ position: 'absolute', top: 14, right: 14, fontSize: 10, fontWeight: 800, color: '#052A14', background: '#C8E600', padding: '3px 10px', borderRadius: 99, letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Most popular
                </div>
              )}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#C8E600', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 6 }}>Pro</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#FFFFFF', lineHeight: 1, marginBottom: 4 }}>
                  {currency === 'ZAR' ? 'R249' : '$13'}<span style={{ fontSize: 13, fontWeight: 600, color: '#5A9A6A' }}>/month</span>
                </div>
                <div style={{ fontSize: 12, color: '#5A9A6A' }}>Unlimited rewrites and cover letters</div>
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {['Unlimited CV rewrites', 'Unlimited cover letters', 'Priority AI processing', 'Cancel anytime'].map(f => (
                  <li key={f} style={{ fontSize: 12, color: '#90C898', display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                    <span style={{ color: '#C8E600', flexShrink: 0 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              {isPro ? (
                <div style={{ marginTop: 'auto', width: '100%', background: 'rgba(200,230,0,0.1)', color: '#C8E600', fontSize: 13, fontWeight: 700, padding: '11px 0', borderRadius: 99, border: '1px solid rgba(200,230,0,0.3)', textAlign: 'center' }}>
                  ✓ Current plan
                </div>
              ) : (
                <button
                  onClick={() => handlePayment('pro')}
                  disabled={paying}
                  style={{ marginTop: 'auto', width: '100%', background: paying && payingPlan === 'pro' ? '#1A4A2A' : '#C8E600', color: paying && payingPlan === 'pro' ? '#3A7A4A' : '#052A14', fontSize: 13, fontWeight: 800, padding: '11px 0', borderRadius: 99, border: 'none', cursor: paying ? 'default' : 'pointer' }}
                >
                  {paying && payingPlan === 'pro' ? 'Redirecting...' : 'Upgrade to Pro →'}
                </button>
              )}
            </div>

          </div>
          {paymentError && (
            <div style={{ marginTop: 10, fontSize: 13, color: '#F09595', padding: '10px 14px', background: 'rgba(240,149,149,0.08)', border: '1px solid rgba(240,149,149,0.2)', borderRadius: 10 }}>
              {paymentError}
            </div>
          )}
        </div>

        {/* ── CANCEL SUBSCRIPTION ────────────────────────────────── */}
        {isPro && !cancelDone && (
          <div style={{ ...card({ border: '1.5px solid #3A1A1A' }), background: '#1A0A0A' }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: '#F09595', margin: '0 0 8px' }}>Cancel subscription</h2>
            <p style={{ fontSize: 13, color: '#8A5A5A', margin: '0 0 16px', lineHeight: 1.6 }}>
              Cancelling will remove Pro access at the end of your current billing period. Your credits and application history will be kept.
            </p>
            {!cancelConfirm ? (
              <button
                onClick={() => setCancelConfirm(true)}
                style={{ background: 'transparent', color: '#F09595', fontSize: 13, fontWeight: 700, padding: '10px 20px', borderRadius: 99, border: '1.5px solid #5A2A2A', cursor: 'pointer' }}
              >
                Cancel my subscription
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#F09595', padding: '12px 16px', background: 'rgba(240,149,149,0.08)', borderRadius: 10, border: '1px solid rgba(240,149,149,0.2)' }}>
                  Are you sure? You will lose Pro access and revert to the Free plan.
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    style={{ flex: 1, background: '#A32D2D', color: '#FFFFFF', fontSize: 13, fontWeight: 800, padding: '10px 0', borderRadius: 99, border: 'none', cursor: cancelling ? 'default' : 'pointer', opacity: cancelling ? 0.7 : 1 }}
                  >
                    {cancelling ? 'Cancelling...' : 'Yes, cancel Pro'}
                  </button>
                  <button
                    onClick={() => setCancelConfirm(false)}
                    style={{ flex: 1, background: 'transparent', color: '#8A5A5A', fontSize: 13, fontWeight: 600, padding: '10px 0', borderRadius: 99, border: '1px solid #3A1A1A', cursor: 'pointer' }}
                  >
                    Keep my Pro
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {cancelDone && (
          <div style={card({ border: '1.5px solid #1A4A2A' })}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#90C898' }}>✓ Subscription cancelled</div>
            <p style={{ fontSize: 13, color: '#5A9A6A', margin: '6px 0 0', lineHeight: 1.6 }}>
              Your Pro access has been removed. You can resubscribe at any time.
            </p>
          </div>
        )}

        {/* ── ACCOUNT DETAILS ────────────────────────────────────── */}
        <div style={card()}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: '#FFFFFF', margin: '0 0 18px' }}>Account details</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingBottom: 14, borderBottom: '1px solid #0D3A1A' }}>
              <div style={{ width: 36, height: 36, borderRadius: 99, background: '#C8E600', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#052A14', flexShrink: 0 }}>
                {(user?.firstName?.[0] || email[0] || '?').toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', marginBottom: 2 }}>
                  {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Jobsesame user'}
                </div>
                <div style={{ fontSize: 12, color: '#5A9A6A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#3A7A4A', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Email</div>
                <div style={{ fontSize: 13, color: '#90C898', wordBreak: 'break-all' }}>{email}</div>
              </div>
              {memberSince && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#3A7A4A', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Member since</div>
                  <div style={{ fontSize: 13, color: '#90C898' }}>{memberSince}</div>
                </div>
              )}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#3A7A4A', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Plan</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: planColor }}>{planLabel}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#3A7A4A', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Credits</div>
                <div style={{ fontSize: 13, color: '#90C898' }}>{isPro ? 'Unlimited' : credits}</div>
              </div>
            </div>

            <div style={{ paddingTop: 4, borderTop: '1px solid #0D3A1A', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <a href="/dashboard" style={{ fontSize: 12, color: '#A8D8B0', fontWeight: 600, textDecoration: 'none', padding: '8px 16px', borderRadius: 99, border: '1px solid #1A5A2A', whiteSpace: 'nowrap' }}>
                ← Back to Dashboard
              </a>
              <a href="/privacy" style={{ fontSize: 12, color: '#5A9A6A', textDecoration: 'none', padding: '8px 16px' }}>Privacy policy</a>
              <a href="/terms" style={{ fontSize: 12, color: '#5A9A6A', textDecoration: 'none', padding: '8px 16px' }}>Terms</a>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}
