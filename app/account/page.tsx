'use client';
import { useUser, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { JOB_BOARD_ENABLED } from '../lib/flags';
import { INK, INK_SOFT, INK_FAINT, LINE, PAPER, CARD, ACCENT, CLAY, AMBER, SERIF, SANS } from '../lib/theme';

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
    if (!isSignedIn) return;
    fetch('/api/credits')
      .then(r => r.json())
      .then(d => {
        if (typeof d.credits === 'number') setCredits(d.credits);
        if (typeof d.isPro === 'boolean') setIsPro(d.isPro);
        if (d.proExpiresAt) setProExpiresAt(d.proExpiresAt);
      })
      .catch((err) => console.error('[account] credits fetch failed:', err))
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
        body: JSON.stringify({ email, plan, currency: 'USD' }),
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
    } catch (err) { console.error('[account] cancel failed:', err); }
    setCancelling(false);
  };

  const planLabel = isPro ? 'Pro' : credits > 0 ? 'Credits' : 'Free';
  const planColor = isPro ? ACCENT : credits > 0 ? AMBER : INK_FAINT;
  const planBg = isPro ? 'rgba(63,93,82,0.1)' : credits > 0 ? 'rgba(176,138,62,0.1)' : LINE;
  const email = user?.emailAddresses[0]?.emailAddress || '';
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long' })
    : '';

  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    background: CARD,
    border: `1px solid ${LINE}`,
    borderRadius: 4,
    padding: isMobile ? 20 : 24,
    ...extra,
  });

  if (!isLoaded || !isSignedIn) return null;

  return (
    <main style={{ fontFamily: SANS, background: PAPER, color: INK, minHeight: '100vh', overflowX: 'hidden' }}>

      {/* NAV */}
      <nav style={{ background: CARD, padding: '0 20px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${LINE}`, position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/" style={{ textDecoration: 'none', fontFamily: SERIF, fontSize: 18, fontWeight: 500, color: INK }}>jobsesame</a>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10 }}>
          <a href="/dashboard" style={{ fontSize: isMobile ? 12 : 13, color: INK_SOFT, fontWeight: 500, textDecoration: 'none', padding: '8px 12px', whiteSpace: 'nowrap' }}>Dashboard</a>
          {!isMobile && JOB_BOARD_ENABLED && <a href="/jobs" style={{ fontSize: 13, color: INK_SOFT, fontWeight: 500, textDecoration: 'none', padding: '8px 12px', whiteSpace: 'nowrap' }}>Find Jobs</a>}
          <a href="/account" style={{ fontSize: isMobile ? 12 : 13, color: INK, fontWeight: 600, textDecoration: 'none', padding: '8px 12px', borderBottom: `2px solid ${ACCENT}`, whiteSpace: 'nowrap' }}>My Account</a>
          <UserButton />
        </div>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: isMobile ? '24px 16px 48px' : '40px 24px 64px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* PAGE TITLE */}
        <div style={{ marginBottom: 4 }}>
          <h1 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: isMobile ? 24 : 30, color: INK, margin: '0 0 4px' }}>My Account</h1>
          <p style={{ fontSize: 13, color: INK_SOFT, margin: 0 }}>Manage your plan, credits and account details.</p>
        </div>

        {/* ── CURRENT PLAN ───────────────────────────────────────── */}
        <div style={card()}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: INK, margin: 0 }}>Current plan</h2>
            {loadingPlan ? (
              <div style={{ height: 28, width: 80, borderRadius: 99, background: LINE }} />
            ) : (
              <span style={{ fontSize: 13, fontWeight: 700, color: planColor, background: planBg, padding: '5px 14px', borderRadius: 99 }}>
                {planLabel}
              </span>
            )}
          </div>

          {loadingPlan ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[180, 140].map((w, i) => (
                <div key={i} style={{ height: 14, width: w, borderRadius: 6, background: LINE }} />
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {isPro ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, color: INK_SOFT }}>Status</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: ACCENT }}>✓ Pro — unlimited rewrites</span>
                  </div>
                  {proExpiresAt && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 13, color: INK_SOFT }}>Renews</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: INK }}>
                        {new Date(proExpiresAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, color: INK_SOFT }}>Credits remaining</span>
                    <span style={{ fontSize: 22, fontWeight: 700, fontFamily: SERIF, color: credits > 0 ? AMBER : CLAY, lineHeight: 1 }}>{credits}</span>
                  </div>
                  <div style={{ fontSize: 12, color: INK_FAINT }}>
                    Each credit = 1 AI CV tailoring or cover letter. Free plan includes 3 credits.
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── UPGRADE PLANS ──────────────────────────────────────── */}
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: INK, margin: '0 0 12px' }}>Plans &amp; pricing</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', maxWidth: 340 }}>

            {/* Pro card */}
            <div style={{ ...card({ border: isPro ? `1px solid ${LINE}` : `1.5px solid ${ACCENT}`, position: 'relative', overflow: 'hidden' }), display: 'flex', flexDirection: 'column', gap: 14 }}>
              {!isPro && (
                <div style={{ position: 'absolute', top: 14, right: 14, fontSize: 10, fontWeight: 700, color: PAPER, background: ACCENT, padding: '3px 10px', borderRadius: 99, letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Most popular
                </div>
              )}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 6 }}>Pro</div>
                <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 500, color: INK, lineHeight: 1, marginBottom: 4 }}>
                  $25<span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 500, color: INK_SOFT }}>/month</span>
                </div>
                <div style={{ fontSize: 12, color: INK_SOFT }}>Unlimited rewrites and cover letters</div>
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {['Unlimited CV rewrites', 'Unlimited cover letters', 'Priority AI processing', 'Cancel anytime'].map(f => (
                  <li key={f} style={{ fontSize: 12, color: INK_SOFT, display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                    <span style={{ color: ACCENT, flexShrink: 0 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
              {isPro ? (
                <div style={{ marginTop: 'auto', width: '100%', background: 'rgba(63,93,82,0.1)', color: ACCENT, fontSize: 13, fontWeight: 700, padding: '11px 0', borderRadius: 3, border: `1px solid rgba(63,93,82,0.25)`, textAlign: 'center' }}>
                  ✓ Current plan
                </div>
              ) : (
                <button
                  onClick={() => handlePayment('pro')}
                  disabled={paying}
                  style={{ marginTop: 'auto', width: '100%', background: paying && payingPlan === 'pro' ? LINE : ACCENT, color: paying && payingPlan === 'pro' ? INK_FAINT : PAPER, fontSize: 13, fontWeight: 600, padding: '11px 0', borderRadius: 3, border: 'none', cursor: paying ? 'default' : 'pointer' }}
                >
                  {paying && payingPlan === 'pro' ? 'Redirecting...' : 'Upgrade to Pro →'}
                </button>
              )}
            </div>

          </div>
          {paymentError && (
            <div style={{ marginTop: 10, fontSize: 13, color: CLAY, padding: '10px 14px', background: 'rgba(168,92,64,0.08)', border: `1px solid rgba(168,92,64,0.3)`, borderRadius: 3 }}>
              {paymentError}
            </div>
          )}
        </div>

        {/* ── CANCEL SUBSCRIPTION ────────────────────────────────── */}
        {isPro && !cancelDone && (
          <div style={{ ...card({ border: `1px solid rgba(168,92,64,0.3)` }), background: 'rgba(168,92,64,0.04)' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: CLAY, margin: '0 0 8px' }}>Cancel subscription</h2>
            <p style={{ fontSize: 13, color: INK_SOFT, margin: '0 0 16px', lineHeight: 1.6 }}>
              Cancelling will remove Pro access at the end of your current billing period. Your credits and application history will be kept.
            </p>
            {!cancelConfirm ? (
              <button
                onClick={() => setCancelConfirm(true)}
                style={{ background: 'transparent', color: CLAY, fontSize: 13, fontWeight: 600, padding: '10px 20px', borderRadius: 3, border: `1.5px solid rgba(168,92,64,0.4)`, cursor: 'pointer' }}
              >
                Cancel my subscription
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: CLAY, padding: '12px 16px', background: 'rgba(168,92,64,0.08)', borderRadius: 3, border: `1px solid rgba(168,92,64,0.3)` }}>
                  Are you sure? You will lose Pro access and revert to the Free plan.
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={handleCancel}
                    disabled={cancelling}
                    style={{ flex: 1, background: CLAY, color: PAPER, fontSize: 13, fontWeight: 700, padding: '10px 0', borderRadius: 3, border: 'none', cursor: cancelling ? 'default' : 'pointer', opacity: cancelling ? 0.7 : 1 }}
                  >
                    {cancelling ? 'Cancelling...' : 'Yes, cancel Pro'}
                  </button>
                  <button
                    onClick={() => setCancelConfirm(false)}
                    style={{ flex: 1, background: 'transparent', color: INK_SOFT, fontSize: 13, fontWeight: 500, padding: '10px 0', borderRadius: 3, border: `1px solid ${LINE}`, cursor: 'pointer' }}
                  >
                    Keep my Pro
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {cancelDone && (
          <div style={card()}>
            <div style={{ fontSize: 14, fontWeight: 700, color: ACCENT }}>✓ Subscription cancelled</div>
            <p style={{ fontSize: 13, color: INK_SOFT, margin: '6px 0 0', lineHeight: 1.6 }}>
              Your Pro access has been removed. You can resubscribe at any time.
            </p>
          </div>
        )}

        {/* ── ACCOUNT DETAILS ────────────────────────────────────── */}
        <div style={card()}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: INK, margin: '0 0 18px' }}>Account details</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, paddingBottom: 14, borderBottom: `1px solid ${LINE}` }}>
              <div style={{ width: 36, height: 36, borderRadius: 99, background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: PAPER, flexShrink: 0 }}>
                {(user?.firstName?.[0] || email[0] || '?').toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: INK, marginBottom: 2 }}>
                  {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Jobsesame user'}
                </div>
                <div style={{ fontSize: 12, color: INK_SOFT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: INK_FAINT, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Email</div>
                <div style={{ fontSize: 13, color: INK_SOFT, wordBreak: 'break-all' }}>{email}</div>
              </div>
              {memberSince && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: INK_FAINT, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Member since</div>
                  <div style={{ fontSize: 13, color: INK_SOFT }}>{memberSince}</div>
                </div>
              )}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: INK_FAINT, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Plan</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: planColor }}>{planLabel}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: INK_FAINT, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Credits</div>
                <div style={{ fontSize: 13, color: INK_SOFT }}>{isPro ? 'Unlimited' : credits}</div>
              </div>
            </div>

            <div style={{ paddingTop: 4, borderTop: `1px solid ${LINE}`, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <a href="/dashboard" style={{ fontSize: 12, color: INK_SOFT, fontWeight: 600, textDecoration: 'none', padding: '8px 16px', borderRadius: 99, border: `1px solid ${LINE}`, whiteSpace: 'nowrap' }}>
                ← Back to Dashboard
              </a>
              <a href="/privacy" style={{ fontSize: 12, color: INK_FAINT, textDecoration: 'none', padding: '8px 16px' }}>Privacy policy</a>
              <a href="/terms" style={{ fontSize: 12, color: INK_FAINT, textDecoration: 'none', padding: '8px 16px' }}>Terms</a>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}
