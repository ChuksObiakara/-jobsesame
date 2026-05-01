export default function RefundPage() {
  const nav = (
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
      <div style={{ display: "flex", gap: 16 }}>
        <a href="/terms" style={{ fontSize: 13, color: "#A8D8B0", fontWeight: 500, textDecoration: "none" }}>Terms</a>
        <a href="/privacy" style={{ fontSize: 13, color: "#A8D8B0", fontWeight: 500, textDecoration: "none" }}>Privacy</a>
      </div>
    </nav>
  );

  const card = (icon: string, title: string, body: React.ReactNode) => (
    <div style={{ background: "#031A0C", border: "1px solid #0D4A20", borderRadius: 14, padding: "24px 28px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: 24 }}>{icon}</span>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: "#FFFFFF", margin: 0 }}>{title}</h2>
      </div>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.8 }}>{body}</div>
    </div>
  );

  return (
    <main style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: "#052A14", minHeight: "100vh" }}>
      {nav}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "56px 24px 80px" }}>
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(200,230,0,0.12)", border: "1.5px solid #C8E600", borderRadius: 99, padding: "5px 14px", fontSize: 11, color: "#C8E600", fontWeight: 700, marginBottom: 16, letterSpacing: "0.8px" }}>
            LEGAL
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: "#FFFFFF", marginBottom: 10, marginTop: 0, lineHeight: 1.15 }}>Refund Policy</h1>
          <p style={{ fontSize: 13, color: "#5A9A6A", margin: 0 }}>Last updated: April 2026 &nbsp;·&nbsp; Jobsesame (Pty) Ltd</p>
        </div>

        <div style={{ background: "rgba(200,230,0,0.07)", border: "1px solid rgba(200,230,0,0.2)", borderRadius: 12, padding: "16px 20px", marginBottom: 32, fontSize: 13, color: "#C8E600", lineHeight: 1.7 }}>
          This policy complies with the <strong>Consumer Protection Act 68 of 2008</strong>, which gives you a 5 business day cooling-off period on all purchases made electronically.
        </div>

        {card("30", "30-Day Money-Back Guarantee (Pro Subscriptions)", <>
          <p style={{ margin: "0 0 10px" }}>If you subscribe to Jobsesame Pro and are not satisfied, you may request a full refund within <strong style={{ color: "#FFFFFF" }}>30 days of your first payment</strong>.</p>
          <p style={{ margin: 0 }}>This applies to your first subscription payment only. Subsequent monthly renewals are not covered by the 30-day guarantee but are covered by the 5-day cooling-off period.</p>
        </>)}

        {card("⏱", "5 Business Day Cooling-Off Period (All Purchases)", <>
          <p style={{ margin: "0 0 10px" }}>Under the Consumer Protection Act, you have the right to cancel any purchase made electronically within <strong style={{ color: "#FFFFFF" }}>5 business days</strong> of the transaction date and receive a full refund, no questions asked.</p>
          <p style={{ margin: 0 }}>This applies to Pro subscriptions and credits packs.</p>
        </>)}

        {card("🎯", "Credits Packs", <>
          <p style={{ margin: "0 0 10px" }}>Credits packs (R99 for 10 credits) are eligible for a full refund within the 5 business day cooling-off period.</p>
          <p style={{ margin: 0 }}><strong style={{ color: "#FFFFFF" }}>Credits packs are non-refundable once any credits have been used.</strong> Unused credits in a partially-used pack are also non-refundable outside the cooling-off period.</p>
        </>)}

        {card("✉️", "How to Request a Refund", <>
          <p style={{ margin: "0 0 10px" }}>Email us at <a href="mailto:billing@jobsesame.co.za" style={{ color: "#C8E600" }}>billing@jobsesame.co.za</a> with:</p>
          <ul style={{ margin: "0 0 10px", paddingLeft: 20 }}>
            <li style={{ marginBottom: 6 }}>Your account email address</li>
            <li style={{ marginBottom: 6 }}>The date of purchase</li>
            <li style={{ marginBottom: 6 }}>The reason for your refund request</li>
          </ul>
          <p style={{ margin: 0 }}>We aim to respond within 2 business days.</p>
        </>)}

        {card("💳", "Processing Time", <>
          <p style={{ margin: 0 }}>Approved refunds are processed within <strong style={{ color: "#FFFFFF" }}>10 business days</strong> via your original payment method (Paystack). The time for funds to appear in your account depends on your bank but is typically 3–5 business days after we process the refund.</p>
        </>)}

        <div style={{ background: "#031A0C", border: "1px solid #0D4A20", borderRadius: 14, padding: "24px 28px", textAlign: "center" }}>
          <p style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700, color: "#FFFFFF" }}>Questions about a refund?</p>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "#5A9A6A" }}>Our team is here to help.</p>
          <a href="mailto:billing@jobsesame.co.za" style={{ display: "inline-block", background: "#C8E600", color: "#052A14", fontWeight: 800, fontSize: 14, padding: "12px 28px", borderRadius: 99, textDecoration: "none" }}>
            Email billing@jobsesame.co.za
          </a>
        </div>

        <div style={{ borderTop: "1px solid #0D4A20", paddingTop: 24, marginTop: 32, display: "flex", gap: 20, flexWrap: "wrap" }}>
          <a href="/terms" style={{ fontSize: 13, color: "#C8E600", textDecoration: "none" }}>Terms of Service</a>
          <a href="/privacy" style={{ fontSize: 13, color: "#C8E600", textDecoration: "none" }}>Privacy Policy</a>
          <a href="/delete-data" style={{ fontSize: 13, color: "#C8E600", textDecoration: "none" }}>Delete My Data</a>
        </div>
      </div>
    </main>
  );
}
