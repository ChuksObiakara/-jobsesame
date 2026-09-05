import type { Metadata } from 'next';
import { INK, INK_SOFT, LINE, PAPER, CARD, ACCENT, SERIF, SANS } from '../lib/theme';

export const metadata: Metadata = {
  title: 'Refund Policy | Jobsesame',
  description: 'Jobsesame’s refund policy for Pro subscriptions.',
  alternates: { canonical: 'https://www.jobsesame.co.za/refund' },
  openGraph: {
    title: 'Refund Policy | Jobsesame',
    description: 'Jobsesame’s refund policy for Pro subscriptions.',
    url: 'https://www.jobsesame.co.za/refund',
    siteName: 'Jobsesame',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Refund Policy | Jobsesame',
    description: 'Jobsesame’s refund policy for Pro subscriptions.',
  },
};

export default function RefundPage() {
  const nav = (
    <nav style={{ background: CARD, padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${LINE}`, position: 'sticky', top: 0, zIndex: 100 }}>
      <a href="/" style={{ textDecoration: 'none', fontFamily: SERIF, fontSize: 18, fontWeight: 500, color: INK }}>jobsesame</a>
      <div style={{ display: 'flex', gap: 16 }}>
        <a href="/terms" style={{ fontSize: 13, color: INK_SOFT, fontWeight: 500, textDecoration: 'none' }}>Terms</a>
        <a href="/privacy" style={{ fontSize: 13, color: INK_SOFT, fontWeight: 500, textDecoration: 'none' }}>Privacy</a>
      </div>
    </nav>
  );

  const card = (icon: string, title: string, body: React.ReactNode) => (
    <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 8, padding: '24px 28px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: 24 }}>{icon}</span>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: INK, margin: 0 }}>{title}</h2>
      </div>
      <div style={{ fontSize: 14, color: INK_SOFT, lineHeight: 1.8 }}>{body}</div>
    </div>
  );

  return (
    <main style={{ fontFamily: SANS, background: PAPER, color: INK, minHeight: '100vh' }}>
      {nav}
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '56px 24px 80px' }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(63,93,82,0.1)', border: `1.5px solid ${ACCENT}`, borderRadius: 99, padding: '5px 14px', fontSize: 11, color: ACCENT, fontWeight: 700, marginBottom: 16, letterSpacing: '0.8px' }}>
            LEGAL
          </div>
          <h1 style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 500, color: INK, marginBottom: 10, marginTop: 0, lineHeight: 1.15 }}>Refund Policy</h1>
          <p style={{ fontSize: 13, color: INK_SOFT, margin: 0 }}>Last updated: September 2026 &nbsp;·&nbsp; Jobsesame (Pty) Ltd</p>
        </div>

        <div style={{ background: 'rgba(63,93,82,0.07)', border: `1px solid rgba(63,93,82,0.2)`, borderRadius: 12, padding: '16px 20px', marginBottom: 32, fontSize: 13, color: ACCENT, lineHeight: 1.7 }}>
          This policy complies with the <strong>Consumer Protection Act 68 of 2008</strong>, which gives you a 5 business day cooling-off period on all purchases made electronically.
        </div>

        {card('🎉', '30-Day Money-Back Guarantee (Pro Subscriptions)', <>
          <p style={{ margin: '0 0 10px' }}>If you subscribe to Jobsesame Pro and are not satisfied, you may request a full refund within <strong style={{ color: INK }}>30 days of your first payment</strong>.</p>
          <p style={{ margin: 0 }}>This applies to your first subscription payment only. Subsequent monthly renewals are not covered by the 30-day guarantee but are covered by the 5-day cooling-off period.</p>
        </>)}

        {card('⏱', '5 Business Day Cooling-Off Period', <>
          <p style={{ margin: '0 0 10px' }}>Under the Consumer Protection Act, you have the right to cancel any purchase made electronically within <strong style={{ color: INK }}>5 business days</strong> of the transaction date and receive a full refund, no questions asked.</p>
          <p style={{ margin: 0 }}>This applies to Pro subscription payments.</p>
        </>)}

        {card('✉️', 'How to Request a Refund', <>
          <p style={{ margin: '0 0 10px' }}>Email us at <a href="mailto:billing@jobsesame.co.za" style={{ color: ACCENT }}>billing@jobsesame.co.za</a> with:</p>
          <ul style={{ margin: '0 0 10px', paddingLeft: 20 }}>
            <li style={{ marginBottom: 6 }}>Your account email address</li>
            <li style={{ marginBottom: 6 }}>The date of purchase</li>
            <li style={{ marginBottom: 6 }}>The reason for your refund request</li>
          </ul>
          <p style={{ margin: 0 }}>We aim to respond within 2 business days.</p>
        </>)}

        {card('💳', 'Processing Time', <>
          <p style={{ margin: 0 }}>Approved refunds are processed within <strong style={{ color: INK }}>10 business days</strong> via your original payment method (Paystack). The time for funds to appear in your account depends on your bank but is typically 3–5 business days after we process the refund.</p>
        </>)}

        <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 8, padding: '24px 28px', textAlign: 'center' }}>
          <p style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: INK }}>Questions about a refund?</p>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: INK_SOFT }}>Our team is here to help.</p>
          <a href="mailto:billing@jobsesame.co.za" style={{ display: 'inline-block', background: ACCENT, color: PAPER, fontWeight: 700, fontSize: 14, padding: '12px 28px', borderRadius: 3, textDecoration: 'none' }}>
            Email billing@jobsesame.co.za
          </a>
        </div>

        <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 24, marginTop: 32, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <a href="/terms" style={{ fontSize: 13, color: ACCENT, textDecoration: 'none' }}>Terms of Service</a>
          <a href="/privacy" style={{ fontSize: 13, color: ACCENT, textDecoration: 'none' }}>Privacy Policy</a>
          <a href="/delete-data" style={{ fontSize: 13, color: ACCENT, textDecoration: 'none' }}>Delete My Data</a>
        </div>
      </div>
    </main>
  );
}
