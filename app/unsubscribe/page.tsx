'use client';
import { useState } from 'react';

export default function UnsubscribePage() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    const existing = JSON.parse(localStorage.getItem('jobsesame_unsubscribed') || '[]');
    if (!existing.includes(email)) {
      localStorage.setItem('jobsesame_unsubscribed', JSON.stringify([...existing, email]));
    }
    setDone(true);
  }

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
      </nav>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "72px 24px 80px", textAlign: "center" }}>
        {done ? (
          <>
            <div style={{ fontSize: 48, marginBottom: 20 }}>✓</div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: "#FFFFFF", marginBottom: 12, marginTop: 0 }}>You&apos;ve been unsubscribed</h1>
            <p style={{ fontSize: 14, color: "#5A9A6A", lineHeight: 1.7, marginBottom: 28 }}>
              You have been unsubscribed from Jobsesame marketing emails. You may still receive transactional emails about your account and applications.
            </p>
            <a href="/" style={{ fontSize: 13, color: "#C8E600", textDecoration: "none" }}>Back to Jobsesame →</a>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: "#FFFFFF", marginBottom: 12, marginTop: 0 }}>Unsubscribe from emails</h1>
            <p style={{ fontSize: 14, color: "#5A9A6A", lineHeight: 1.7, marginBottom: 32 }}>
              Enter your email address below to unsubscribe from Jobsesame marketing emails. Note: you will still receive important account and security emails.
            </p>
            <form onSubmit={handleSubmit}>
              <div style={{ background: "#031A0C", border: "1px solid #0D4A20", borderRadius: 14, padding: "28px", textAlign: "left" }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#A8D8B0", marginBottom: 8, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={{
                    width: "100%", background: "#072E16", border: "1.5px solid #1A5A2A",
                    borderRadius: 10, padding: "13px 16px", fontSize: 14, color: "#FFFFFF",
                    outline: "none", boxSizing: "border-box", marginBottom: 20,
                  }}
                />
                <button
                  type="submit"
                  disabled={!email}
                  style={{
                    width: "100%", background: "#C8E600", color: "#052A14",
                    fontWeight: 800, fontSize: 15, border: "none", borderRadius: 99,
                    padding: "15px 24px", cursor: email ? "pointer" : "not-allowed",
                    opacity: email ? 1 : 0.5,
                  }}
                >
                  Unsubscribe
                </button>
              </div>
            </form>
            <p style={{ fontSize: 12, color: "#3A7A4A", marginTop: 20, lineHeight: 1.7 }}>
              <a href="/privacy" style={{ color: "#C8E600" }}>Privacy Policy</a>
              {" · "}
              <a href="/delete-data" style={{ color: "#C8E600" }}>Delete all my data</a>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
