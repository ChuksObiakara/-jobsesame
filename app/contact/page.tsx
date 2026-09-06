'use client';
import { useState } from 'react';
import { INK, INK_SOFT, LINE, PAPER, CARD, ACCENT, SERIF, SANS, SCRIPT } from '../lib/theme';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  const nav = (
    <nav style={{ background: CARD, padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${LINE}`, position: 'sticky', top: 0, zIndex: 100 }}>
      <a href="/" style={{ textDecoration: 'none', fontFamily: SCRIPT, fontSize: 28, fontWeight: 400, color: INK }}>jobsesame</a>
      <div style={{ display: 'flex', gap: 16 }}>
        <a href="/privacy" style={{ fontSize: 13, color: INK_SOFT, fontWeight: 500, textDecoration: 'none' }}>Privacy</a>
        <a href="/terms" style={{ fontSize: 13, color: INK_SOFT, fontWeight: 500, textDecoration: 'none' }}>Terms</a>
      </div>
    </nav>
  );

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    border: `1px solid ${LINE}`,
    borderRadius: '4px',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: SANS,
    color: INK,
    background: PAPER,
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: INK_SOFT,
    marginBottom: 6,
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || 'Something went wrong. Please try again.');
        setStatus('error');
        return;
      }
      setStatus('sent');
    } catch {
      setError('Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  return (
    <main style={{ fontFamily: SANS, background: PAPER, color: INK, minHeight: '100vh' }}>
      {nav}
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '56px 24px 80px' }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(63,93,82,0.1)', border: `1.5px solid ${ACCENT}`, borderRadius: 99, padding: '5px 14px', fontSize: 11, color: ACCENT, fontWeight: 700, marginBottom: 16, letterSpacing: '0.8px' }}>
            CONTACT
          </div>
          <h1 style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 500, color: INK, marginBottom: 10, marginTop: 0, lineHeight: 1.15 }}>Get in touch</h1>
          <p style={{ fontSize: 14, color: INK_SOFT, margin: 0, lineHeight: 1.7 }}>
            Questions about your account, a billing issue, or feedback on the product — send us a message and we'll get back to you. You can also email{' '}
            <a href="mailto:hello@jobsesame.co" style={{ color: ACCENT }}>hello@jobsesame.co</a> directly.
          </p>
        </div>

        <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 8, padding: '28px 28px' }}>
          {status === 'sent' ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: INK, marginBottom: 8 }}>Message sent</h2>
              <p style={{ fontSize: 14, color: INK_SOFT, margin: 0 }}>Thanks for reaching out — we'll reply to {email} as soon as we can.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  maxLength={200}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  maxLength={200}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Message</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="How can we help?"
                  required
                  rows={6}
                  maxLength={5000}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              {error && <p style={{ fontSize: 13, color: '#A85C40', margin: 0 }}>{error}</p>}

              <button
                type="submit"
                disabled={status === 'sending'}
                style={{
                  padding: '12px 24px',
                  background: status === 'sending' ? 'rgba(63,93,82,0.5)' : ACCENT,
                  color: PAPER,
                  border: 'none',
                  borderRadius: '3px',
                  fontSize: '14.5px',
                  fontWeight: 600,
                  cursor: status === 'sending' ? 'not-allowed' : 'pointer',
                }}
              >
                {status === 'sending' ? 'Sending…' : 'Send message'}
              </button>
            </form>
          )}
        </div>

        <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 24, marginTop: 32, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <a href="/terms" style={{ fontSize: 13, color: ACCENT, textDecoration: 'none' }}>Terms of Service</a>
          <a href="/privacy" style={{ fontSize: 13, color: ACCENT, textDecoration: 'none' }}>Privacy Policy</a>
          <a href="/refund" style={{ fontSize: 13, color: ACCENT, textDecoration: 'none' }}>Refund Policy</a>
        </div>
      </div>
    </main>
  );
}
