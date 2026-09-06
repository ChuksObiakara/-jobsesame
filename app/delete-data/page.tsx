'use client';
import { useState } from 'react';
import { INK, INK_SOFT, INK_FAINT, LINE, PAPER, CARD, ACCENT, CLAY, SERIF, SANS, SCRIPT } from '../lib/theme';

export default function DeleteDataPage() {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !reason) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/data-deletion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, reason, message }),
      });
      if (!res.ok) throw new Error('Request failed');
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please email hello@jobsesame.co directly.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: CARD, border: `1.5px solid ${LINE}`,
    borderRadius: 6, padding: '13px 16px', fontSize: 14, color: INK,
    outline: 'none', boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 700, color: INK_SOFT,
    marginBottom: 8, letterSpacing: '0.5px', textTransform: 'uppercase',
  };

  return (
    <main style={{ fontFamily: SANS, background: PAPER, color: INK, minHeight: '100vh' }}>
      <nav style={{ background: CARD, padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${LINE}`, position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/" style={{ textDecoration: 'none', fontFamily: SCRIPT, fontSize: 28, fontWeight: 400, color: INK }}>jobsesame</a>
        <a href="/privacy" style={{ fontSize: 13, color: INK_SOFT, fontWeight: 500, textDecoration: 'none' }}>Privacy Policy</a>
      </nav>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '56px 24px 80px' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(63,93,82,0.1)', border: `1.5px solid ${ACCENT}`, borderRadius: 99, padding: '5px 14px', fontSize: 11, color: ACCENT, fontWeight: 700, marginBottom: 16, letterSpacing: '0.8px' }}>
            POPIA RIGHT TO ERASURE
          </div>
          <h1 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 500, color: INK, marginBottom: 10, marginTop: 0, lineHeight: 1.15 }}>Request data deletion</h1>
          <p style={{ fontSize: 14, color: INK_SOFT, margin: 0, lineHeight: 1.7 }}>
            You have the right to request deletion of all your personal data under POPIA. We will process your request within 30 days and confirm by email.
          </p>
        </div>

        {submitted ? (
          <div style={{ background: 'rgba(63,93,82,0.08)', border: `1.5px solid ${ACCENT}`, borderRadius: 8, padding: '32px 28px', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: INK, marginBottom: 10, marginTop: 0 }}>Request received</h2>
            <p style={{ fontSize: 14, color: INK_SOFT, lineHeight: 1.7, margin: 0 }}>
              Your data deletion request has been received. We will process it within 30 days and send a confirmation to <strong style={{ color: INK }}>{email}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 8, padding: '28px' }}>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Email address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Reason for deletion *</label>
                <select
                  required
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  <option value="" disabled>Select a reason</option>
                  <option value="Closing my account">Closing my account</option>
                  <option value="Privacy concerns">Privacy concerns</option>
                  <option value="No longer using the service">No longer using the service</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>Additional details (optional)</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Any additional information about your request..."
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                />
              </div>

              {error && (
                <div style={{ background: 'rgba(168,92,64,0.08)', border: `1px solid rgba(168,92,64,0.3)`, borderRadius: 6, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: CLAY }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email || !reason}
                style={{
                  width: '100%', background: loading ? INK_FAINT : ACCENT,
                  color: PAPER,
                  fontWeight: 700, fontSize: 15, border: 'none', borderRadius: 3,
                  padding: '15px 24px', cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: (!email || !reason) ? 0.5 : 1,
                }}
              >
                {loading ? 'Submitting...' : 'Submit deletion request'}
              </button>
            </div>
          </form>
        )}

        <p style={{ fontSize: 12, color: INK_FAINT, textAlign: 'center', marginTop: 20, lineHeight: 1.7 }}>
          Or email us directly at{' '}
          <a href="mailto:hello@jobsesame.co" style={{ color: ACCENT }}>hello@jobsesame.co</a>
          {' '}· <a href="/privacy" style={{ color: ACCENT }}>Privacy Policy</a>
        </p>
      </div>
    </main>
  );
}
