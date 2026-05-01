'use client';
import { useState } from 'react';

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
      setError('Something went wrong. Please email privacy@jobsesame.co.za directly.');
    } finally {
      setLoading(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#072E16', border: '1.5px solid #1A5A2A',
    borderRadius: 10, padding: '13px 16px', fontSize: 14, color: '#FFFFFF',
    outline: 'none', boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 700, color: '#A8D8B0',
    marginBottom: 8, letterSpacing: '0.5px', textTransform: 'uppercase',
  };

  return (
    <main style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: "#052A14", minHeight: "100vh" }}>
      <nav style={{ background: "#052A14", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #0D4A20", position: "sticky", top: 0, zIndex: 100 }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none" }}>
          <div style={{ width: 38, height: 38, background: "#C8E600", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="9" cy="9" r="5.5" stroke="#052A14" strokeWidth="2.2" />
              <circle cx="9" cy="9" r="2.5" fill="#052A14" opacity="0.4" />
              <line x1="13.5" y1="13.5" x2="20" y2="20" stroke="#052A14" strokeWidth="2.8" strokeLinecap="round" />
            </svg>
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>
            <span style={{ color: "#FFFFFF" }}>job</span>
            <span style={{ color: "#C8E600" }}>sesame</span>
          </span>
        </a>
        <a href="/privacy" style={{ fontSize: 13, color: "#A8D8B0", fontWeight: 500, textDecoration: "none" }}>Privacy Policy</a>
      </nav>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "56px 24px 80px" }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(200,230,0,0.12)", border: "1.5px solid #C8E600", borderRadius: 99, padding: "5px 14px", fontSize: 11, color: "#C8E600", fontWeight: 700, marginBottom: 16, letterSpacing: "0.8px" }}>
            POPIA RIGHT TO ERASURE
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: "#FFFFFF", marginBottom: 10, marginTop: 0, lineHeight: 1.15 }}>Request data deletion</h1>
          <p style={{ fontSize: 14, color: "#5A9A6A", margin: 0, lineHeight: 1.7 }}>
            You have the right to request deletion of all your personal data under POPIA. We will process your request within 30 days and confirm by email.
          </p>
        </div>

        {submitted ? (
          <div style={{ background: "rgba(200,230,0,0.1)", border: "1.5px solid #C8E600", borderRadius: 14, padding: "32px 28px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: "#FFFFFF", marginBottom: 10, marginTop: 0 }}>Request received</h2>
            <p style={{ fontSize: 14, color: "#A8D8B0", lineHeight: 1.7, margin: 0 }}>
              Your data deletion request has been received. We will process it within 30 days and send a confirmation to <strong style={{ color: "#FFFFFF" }}>{email}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ background: "#031A0C", border: "1px solid #0D4A20", borderRadius: 14, padding: "28px" }}>
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
                <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#F09595" }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email || !reason}
                style={{
                  width: '100%', background: loading ? '#1A5A2A' : '#C8E600',
                  color: loading ? '#FFFFFF' : '#052A14',
                  fontWeight: 800, fontSize: 15, border: 'none', borderRadius: 99,
                  padding: '15px 24px', cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: (!email || !reason) ? 0.5 : 1,
                }}
              >
                {loading ? 'Submitting...' : 'Submit deletion request'}
              </button>
            </div>
          </form>
        )}

        <p style={{ fontSize: 12, color: "#3A7A4A", textAlign: "center", marginTop: 20, lineHeight: 1.7 }}>
          Or email us directly at{' '}
          <a href="mailto:privacy@jobsesame.co.za" style={{ color: "#C8E600" }}>privacy@jobsesame.co.za</a>
          {' '}· <a href="/privacy" style={{ color: "#C8E600" }}>Privacy Policy</a>
        </p>
      </div>
    </main>
  );
}
