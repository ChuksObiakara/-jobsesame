export default function TermsPage() {
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
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <a href="/jobs" style={{ fontSize: 13, color: "#A8D8B0", fontWeight: 500, textDecoration: "none" }}>Find jobs</a>
        <a href="/dashboard" style={{ fontSize: 13, color: "#A8D8B0", fontWeight: 500, textDecoration: "none" }}>Dashboard</a>
      </div>
    </nav>
  );

  const section = (title: string, children: React.ReactNode) => (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, color: "#C8E600", marginBottom: 14, marginTop: 0 }}>{title}</h2>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.85 }}>{children}</div>
    </div>
  );

  const li = (text: React.ReactNode) => (
    <li style={{ marginBottom: 8, paddingLeft: 4 }}>{text}</li>
  );

  return (
    <main style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", background: "#052A14", minHeight: "100vh" }}>
      {nav}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 80px" }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(200,230,0,0.12)", border: "1.5px solid #C8E600", borderRadius: 99, padding: "5px 14px", fontSize: 11, color: "#C8E600", fontWeight: 700, marginBottom: 16, letterSpacing: "0.8px" }}>
            LEGAL
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: "#FFFFFF", marginBottom: 10, marginTop: 0, lineHeight: 1.15 }}>Terms of Service</h1>
          <p style={{ fontSize: 13, color: "#5A9A6A", marginBottom: 0 }}>Last updated: April 2026 &nbsp;·&nbsp; Jobsesame (Pty) Ltd</p>
        </div>

        <div style={{ background: "rgba(200,230,0,0.07)", border: "1px solid rgba(200,230,0,0.2)", borderRadius: 12, padding: "16px 20px", marginBottom: 40, fontSize: 13, color: "#C8E600", lineHeight: 1.7 }}>
          These Terms of Service are governed by South African law and comply with the <strong>Consumer Protection Act 68 of 2008 (CPA)</strong>, the Electronic Communications and Transactions Act (ECTA), and the Protection of Personal Information Act (POPIA).
        </div>

        {section("1. Acceptance of Terms", <>
          <p style={{ margin: "0 0 10px" }}>By creating an account or using the Jobsesame platform at jobsesame.co.za, you agree to be bound by these Terms of Service. If you do not agree, you may not use the platform.</p>
          <p style={{ margin: 0 }}>These terms constitute a binding agreement between you and <strong style={{ color: "#FFFFFF" }}>Jobsesame (Pty) Ltd</strong>. For questions, contact <a href="mailto:support@jobsesame.co.za" style={{ color: "#C8E600" }}>support@jobsesame.co.za</a>.</p>
        </>)}

        {section("2. Description of Service", <>
          <p style={{ margin: "0 0 10px" }}>Jobsesame is an AI-powered job application platform that helps job seekers:</p>
          <ul style={{ margin: "0 0 10px", paddingLeft: 20 }}>
            {li("Upload and analyse their CV for ATS compatibility")}
            {li("Generate AI-optimised CV versions tailored to specific job descriptions")}
            {li("Discover job opportunities aggregated from multiple sources")}
            {li("Submit Quick Apply applications to jobs with one click")}
            {li("Generate cover letters using AI")}
          </ul>
          <p style={{ margin: 0 }}>The service is provided on an &ldquo;as is&rdquo; basis. We continuously improve the platform and may change features with reasonable notice.</p>
        </>)}

        {section("3. User Accounts", <>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {li("You must provide accurate, current, and complete information when creating an account.")}
            {li("You are responsible for maintaining the confidentiality of your login credentials.")}
            {li("You must be 18 years or older to use this platform.")}
            {li("You may not create more than one account per person. Multiple accounts may be terminated without notice.")}
            {li("You are responsible for all activity that occurs under your account.")}
          </ul>
        </>)}

        {section("4. Subscription Terms & Pricing", <>
          <p style={{ margin: "0 0 12px" }}>We offer the following plans:</p>
          <ul style={{ margin: "0 0 14px", paddingLeft: 20 }}>
            {li(<><strong style={{ color: "#FFFFFF" }}>Free tier</strong> — 3 Quick Apply credits included at no charge on sign-up.</>)}
            {li(<><strong style={{ color: "#FFFFFF" }}>Credits pack</strong> — R99 for 10 Quick Apply credits. Credits do not expire. No recurring billing.</>)}
            {li(<><strong style={{ color: "#FFFFFF" }}>Pro plan</strong> — R249 per month, billed monthly. Cancel any time. Access continues until the end of the current billing period.</>)}
          </ul>
          <div style={{ background: "rgba(200,230,0,0.07)", border: "1px solid rgba(200,230,0,0.15)", borderRadius: 10, padding: "14px 18px", marginBottom: 14 }}>
            <strong style={{ color: "#C8E600", fontSize: 13 }}>Cooling-off period (Consumer Protection Act s. 44)</strong>
            <p style={{ margin: "8px 0 0", fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
              You have a <strong style={{ color: "#FFFFFF" }}>5 business day cooling-off period</strong> from the date of any purchase. If you cancel within 5 business days, you are entitled to a full refund. To cancel, email <a href="mailto:billing@jobsesame.co.za" style={{ color: "#C8E600" }}>billing@jobsesame.co.za</a> with your order details.
            </p>
          </div>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {li("All prices are in South African Rand (ZAR) and include VAT where applicable.")}
            {li("Pro plan subscriptions renew automatically each month until cancelled.")}
            {li("We will notify you by email at least 5 business days before any price changes take effect.")}
          </ul>
        </>)}

        {section("5. Refund Policy", <>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {li(<><strong style={{ color: "#FFFFFF" }}>30-day money-back guarantee</strong> — Pro subscribers may request a full refund within 30 days of their first subscription payment.</>)}
            {li(<><strong style={{ color: "#FFFFFF" }}>5-day cooling-off period</strong> — all purchases may be fully refunded within 5 business days as required by the Consumer Protection Act.</>)}
            {li("Credits packs are non-refundable once credits have been used.")}
            {li(<>To request a refund, email <a href="mailto:billing@jobsesame.co.za" style={{ color: "#C8E600" }}>billing@jobsesame.co.za</a>. Refunds are processed within 10 business days via your original payment method.</>)}
            {li(<>See our <a href="/refund" style={{ color: "#C8E600" }}>full Refund Policy</a> for details.</>)}
          </ul>
        </>)}

        {section("6. Acceptable Use", <>
          <p style={{ margin: "0 0 12px" }}>You agree not to:</p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {li("Submit false, misleading, or fraudulent information in your CV or applications.")}
            {li("Use the platform to send unsolicited communications or spam.")}
            {li("Scrape, crawl, or extract data from the platform using automated tools.")}
            {li("Attempt to gain unauthorised access to any part of the platform.")}
            {li("Use the platform for any unlawful purpose or in violation of any applicable law.")}
            {li("Impersonate any person or entity.")}
          </ul>
          <p style={{ margin: "12px 0 0" }}>Violations may result in immediate account termination without refund.</p>
        </>)}

        {section("7. Your CV Data", <>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {li("You own your CV data. By uploading it to Jobsesame, you grant us a limited licence to process it solely to provide the service.")}
            {li("We never share your CV with employers or recruiters without your explicit action.")}
            {li("You may delete your CV data at any time from your dashboard or by emailing privacy@jobsesame.co.za.")}
            {li("Upon account deletion, your CV data will be permanently deleted within 30 days.")}
          </ul>
        </>)}

        {section("8. AI Processing Disclosure", <>
          <p style={{ margin: "0 0 10px" }}>Jobsesame uses <strong style={{ color: "#FFFFFF" }}>Anthropic Claude AI</strong> to analyse your CV, generate optimised versions, and produce cover letters. By using the platform you acknowledge and consent to:</p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {li("Your CV content being sent to Anthropic's API for processing.")}
            {li("AI-generated content being suggestions only — you are responsible for reviewing and approving all content before submitting applications.")}
            {li("AI outputs may not always be accurate. We recommend reviewing AI-generated text before use.")}
          </ul>
        </>)}

        {section("9. No Guarantee of Employment", <>
          <p style={{ margin: 0 }}>Jobsesame provides tools to improve your job application process. We do not guarantee that using our platform will result in job interviews, offers, or employment. Success depends on many factors outside our control including employer requirements, market conditions, and individual qualifications.</p>
        </>)}

        {section("10. Intellectual Property", <>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {li("The Jobsesame platform, including its design, code, and branding, is owned by Jobsesame (Pty) Ltd.")}
            {li("You retain ownership of your CV content and any information you upload.")}
            {li("AI-generated content produced using your CV data is licensed to you for your personal use.")}
          </ul>
        </>)}

        {section("11. Limitation of Liability", <>
          <p style={{ margin: "0 0 10px" }}>To the maximum extent permitted by South African law:</p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {li("Jobsesame is not liable for any indirect, incidental, or consequential damages arising from your use of the platform.")}
            {li("Our total liability for any claim is limited to the amount you paid us in the 3 months prior to the claim.")}
            {li("We are not liable for the actions or decisions of employers or third parties.")}
          </ul>
          <p style={{ margin: "12px 0 0" }}>Nothing in these terms limits your statutory rights under the Consumer Protection Act or POPIA.</p>
        </>)}

        {section("12. Governing Law", <>
          <p style={{ margin: 0 }}>These Terms of Service are governed by the laws of the Republic of South Africa. Any disputes shall be subject to the exclusive jurisdiction of the South African courts. If you have a dispute with us, please first contact us at <a href="mailto:support@jobsesame.co.za" style={{ color: "#C8E600" }}>support@jobsesame.co.za</a> — we will make every reasonable effort to resolve it amicably.</p>
        </>)}

        {section("13. Changes to Terms", <>
          <p style={{ margin: 0 }}>We may update these terms from time to time. We will notify you by email and display a notice on the platform at least 5 business days before material changes take effect. Continued use of the platform after changes take effect constitutes acceptance of the updated terms.</p>
        </>)}

        {section("14. Contact", <>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {li(<>General support: <a href="mailto:support@jobsesame.co.za" style={{ color: "#C8E600" }}>support@jobsesame.co.za</a></>)}
            {li(<>Billing and refunds: <a href="mailto:billing@jobsesame.co.za" style={{ color: "#C8E600" }}>billing@jobsesame.co.za</a></>)}
            {li(<>Privacy: <a href="mailto:privacy@jobsesame.co.za" style={{ color: "#C8E600" }}>privacy@jobsesame.co.za</a></>)}
          </ul>
        </>)}

        <div style={{ borderTop: "1px solid #0D4A20", paddingTop: 24, marginTop: 40, display: "flex", gap: 20, flexWrap: "wrap" }}>
          <a href="/privacy" style={{ fontSize: 13, color: "#C8E600", textDecoration: "none" }}>Privacy Policy</a>
          <a href="/refund" style={{ fontSize: 13, color: "#C8E600", textDecoration: "none" }}>Refund Policy</a>
          <a href="/delete-data" style={{ fontSize: 13, color: "#C8E600", textDecoration: "none" }}>Delete My Data</a>
        </div>
      </div>
    </main>
  );
}
