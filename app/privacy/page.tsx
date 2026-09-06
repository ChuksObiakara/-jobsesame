import type { Metadata } from 'next';
import { JOB_BOARD_ENABLED } from '../lib/flags';
import { INK, INK_SOFT, LINE, PAPER, CARD, ACCENT, SERIF, SANS } from '../lib/theme';

export const metadata: Metadata = {
  title: 'Privacy Policy | Jobsesame',
  description: 'How Jobsesame collects, uses, and protects your CV data and personal information.',
  alternates: { canonical: 'https://www.jobsesame.co/privacy' },
  openGraph: {
    title: 'Privacy Policy | Jobsesame',
    description: 'How Jobsesame collects, uses, and protects your CV data and personal information.',
    url: 'https://www.jobsesame.co/privacy',
    siteName: 'Jobsesame',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Privacy Policy | Jobsesame',
    description: 'How Jobsesame collects, uses, and protects your CV data and personal information.',
  },
};

export default function PrivacyPage() {
  const nav = (
    <nav style={{ background: CARD, padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${LINE}`, position: 'sticky', top: 0, zIndex: 100 }}>
      <a href="/" style={{ textDecoration: 'none', fontFamily: SERIF, fontSize: 18, fontWeight: 500, color: INK }}>jobsesame</a>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        {JOB_BOARD_ENABLED && <a href="/jobs" style={{ fontSize: 13, color: INK_SOFT, fontWeight: 500, textDecoration: 'none' }}>Find jobs</a>}
        <a href="/dashboard" style={{ fontSize: 13, color: INK_SOFT, fontWeight: 500, textDecoration: 'none' }}>Dashboard</a>
      </div>
    </nav>
  );

  const section = (title: string, children: React.ReactNode) => (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 500, color: ACCENT, marginBottom: 14, marginTop: 0 }}>{title}</h2>
      <div style={{ fontSize: 14, color: INK_SOFT, lineHeight: 1.85 }}>{children}</div>
    </div>
  );

  const li = (text: React.ReactNode) => (
    <li style={{ marginBottom: 8, paddingLeft: 4 }}>{text}</li>
  );

  return (
    <main style={{ fontFamily: SANS, background: PAPER, color: INK, minHeight: '100vh' }}>
      {nav}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(63,93,82,0.1)', border: `1.5px solid ${ACCENT}`, borderRadius: 99, padding: '5px 14px', fontSize: 11, color: ACCENT, fontWeight: 700, marginBottom: 16, letterSpacing: '0.8px' }}>
            LEGAL
          </div>
          <h1 style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 500, color: INK, marginBottom: 10, marginTop: 0, lineHeight: 1.15 }}>Privacy Policy</h1>
          <p style={{ fontSize: 13, color: INK_SOFT, marginBottom: 0 }}>Last updated: September 2026 &nbsp;·&nbsp; Jobsesame (Pty) Ltd</p>
        </div>

        <div style={{ background: 'rgba(63,93,82,0.07)', border: `1px solid rgba(63,93,82,0.2)`, borderRadius: 12, padding: '16px 20px', marginBottom: 40, fontSize: 13, color: ACCENT, lineHeight: 1.7 }}>
          Jobsesame is committed to protecting your personal information in compliance with the <strong>Protection of Personal Information Act 4 of 2013 (POPIA)</strong>, the Electronic Communications and Transactions Act (ECTA), the Consumer Protection Act (CPA), and the General Data Protection Regulation (GDPR) for EU residents.
        </div>

        {section('1. Who We Are', <>
          <p style={{ margin: '0 0 10px' }}><strong style={{ color: INK }}>Jobsesame (Pty) Ltd</strong> (&ldquo;Jobsesame&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates the platform at <strong style={{ color: ACCENT }}>jobsesame.co</strong>. We are the responsible party (as defined under POPIA) for personal information collected through our platform.</p>
          <p style={{ margin: 0 }}>For all privacy-related enquiries, contact us at: <a href="mailto:hello@jobsesame.co" style={{ color: ACCENT }}>hello@jobsesame.co</a></p>
        </>)}

        {section('2. Personal Data We Collect', <>
          <p style={{ margin: '0 0 12px' }}>We collect the following categories of personal information:</p>
          <ul style={{ margin: '0 0 12px', paddingLeft: 20 }}>
            {li(<><strong style={{ color: INK }}>CV Data</strong> — name, email address, phone number, work history, education, skills, and any other information you include in your CV.</>)}
            {li(<><strong style={{ color: INK }}>Account Information</strong> — email address, authentication credentials, and profile details collected via Clerk authentication.</>)}
            {li(<><strong style={{ color: INK }}>Payment Information</strong> — billing details processed by Lemon Squeezy. We never store your card details on our servers.</>)}
            {li(<><strong style={{ color: INK }}>Usage Data</strong> — pages visited, features used, click behaviour, and session information collected via cookies and analytics tools.</>)}
            {li(<><strong style={{ color: INK }}>Job Application History</strong> — jobs you have applied to, application status, and outcomes you share with us.</>)}
            {li(<><strong style={{ color: INK }}>Communications</strong> — messages you send to our support team.</>)}
          </ul>
        </>)}

        {section('3. Why We Collect It — Lawful Basis Under POPIA', <>
          <p style={{ margin: '0 0 12px' }}>We process your personal information on the following lawful bases:</p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {li(<><strong style={{ color: INK }}>Contract performance</strong> — to provide the CV optimisation service you have signed up for.</>)}
            {li(<><strong style={{ color: INK }}>Legitimate interest</strong> — to process payments for Pro subscriptions via Lemon Squeezy.</>)}
            {li(<><strong style={{ color: INK }}>Consent</strong> — to send you product updates, marketing emails, and personalised recommendations. You may withdraw consent at any time by <a href="/unsubscribe" style={{ color: ACCENT }}>unsubscribing</a>.</>)}
            {li(<><strong style={{ color: INK }}>Legitimate interest</strong> — to improve our AI matching algorithms using <em>anonymised and aggregated</em> data only. We never use identifiable CV data to train AI models without explicit consent.</>)}
            {li(<><strong style={{ color: INK }}>Legal obligation</strong> — to retain financial records as required by South African tax law.</>)}
          </ul>
        </>)}

        {section('4. How We Protect Your Data', <>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {li('CV data is encrypted in transit (TLS 1.2+) and at rest using AES-256 encryption.')}
            {li('We implement industry-standard security measures including access controls, audit logs, and regular security reviews.')}
            {li(<><strong style={{ color: INK }}>We never sell your personal data</strong> to third parties, advertisers, or data brokers.</>)}
            {li(<><strong style={{ color: INK }}>We never share your CV with employers</strong> without your explicit action. Recruiters do not have access to your CV unless you send it to them.</>)}
            {li('Access to personal data is restricted to authorised staff on a need-to-know basis.')}
            {li('We conduct regular security assessments and respond to security incidents within 72 hours in line with POPIA requirements.')}
          </ul>
        </>)}

        {section('5. Your Rights Under POPIA', <>
          <p style={{ margin: '0 0 12px' }}>As a data subject under POPIA, you have the following rights:</p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {li(<><strong style={{ color: INK }}>Right of access</strong> — request a copy of your personal data we hold. Email <a href="mailto:hello@jobsesame.co" style={{ color: ACCENT }}>hello@jobsesame.co</a>.</>)}
            {li(<><strong style={{ color: INK }}>Right to correction</strong> — request correction of inaccurate or incomplete data.</>)}
            {li(<><strong style={{ color: INK }}>Right to deletion</strong> — request deletion of your personal data. Use our <a href="/delete-data" style={{ color: ACCENT }}>data deletion request form</a> or email <a href="mailto:hello@jobsesame.co" style={{ color: ACCENT }}>hello@jobsesame.co</a>. We will process requests within 30 days.</>)}
            {li(<><strong style={{ color: INK }}>Right to object</strong> — object to processing of your personal data for marketing or profiling purposes.</>)}
            {li(<><strong style={{ color: INK }}>Right to lodge a complaint</strong> — you may lodge a complaint with the Information Regulator of South Africa at <a href="https://inforegulator.org.za" target="_blank" rel="noopener noreferrer" style={{ color: ACCENT }}>inforegulator.org.za</a>.</>)}
          </ul>
        </>)}

        {section('6. Third-Party Services We Use', <>
          <p style={{ margin: '0 0 12px' }}>We share data with the following trusted third-party processors solely to provide our service:</p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {li(<><strong style={{ color: INK }}>Clerk</strong> — authentication and user account management. Privacy policy: <a href="https://clerk.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: ACCENT }}>clerk.com/privacy</a></>)}
            {li(<><strong style={{ color: INK }}>Anthropic</strong> — AI-powered CV processing and rewriting. Your CV content is sent to Anthropic to provide this service. Privacy policy: <a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: ACCENT }}>anthropic.com/privacy</a></>)}
            {li(<><strong style={{ color: INK }}>Lemon Squeezy</strong> — secure payment processing. We do not store card details. Privacy policy: <a href="https://www.lemonsqueezy.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: ACCENT }}>lemonsqueezy.com/privacy</a></>)}
            {li(<><strong style={{ color: INK }}>Resend</strong> — transactional email delivery. Privacy policy: <a href="https://resend.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: ACCENT }}>resend.com/privacy</a></>)}
            {li(<><strong style={{ color: INK }}>Vercel</strong> — cloud hosting and infrastructure. Privacy policy: <a href="https://vercel.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: ACCENT }}>vercel.com/privacy</a></>)}
          </ul>
          <p style={{ margin: '14px 0 0' }}>All processors are required by contract to process your data only on our instructions and in compliance with applicable data protection laws.</p>
        </>)}

        {section('7. Data Retention', <>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {li('Account data is retained for as long as your account is active.')}
            {li('CV data is deleted within 30 days of account deletion.')}
            {li('Payment records are retained for 5 years to comply with South African tax and financial reporting obligations.')}
            {li('Marketing email consent records are retained for 3 years after unsubscribing.')}
            {li('Upon account deletion, we will send you a confirmation email within 30 days confirming what data has been deleted.')}
          </ul>
        </>)}

        {section('8. Cookie Policy', <>
          <p style={{ margin: '0 0 12px' }}>We use the following types of cookies:</p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {li(<><strong style={{ color: INK }}>Necessary cookies</strong> — required for authentication, security, and core platform functionality. These cannot be disabled.</>)}
            {li(<><strong style={{ color: INK }}>Analytics cookies</strong> — help us understand how users interact with the platform so we can improve it. Only set with your consent.</>)}
            {li(<><strong style={{ color: INK }}>Preference cookies</strong> — remember your settings and preferences.</>)}
          </ul>
          <p style={{ margin: '12px 0 0' }}>You can manage your cookie preferences via the banner shown on first visit, or by adjusting your browser settings. Note that disabling necessary cookies may affect platform functionality.</p>
        </>)}

        {section('9. GDPR Rights for EU/EEA Residents', <>
          <p style={{ margin: '0 0 12px' }}>If you are located in the European Union or European Economic Area, you have all POPIA rights listed above, plus the following additional rights under GDPR:</p>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {li(<><strong style={{ color: INK }}>Right to data portability</strong> — receive your personal data in a structured, machine-readable format and transfer it to another controller.</>)}
            {li(<><strong style={{ color: INK }}>Right to restrict processing</strong> — request that we restrict processing of your data in certain circumstances.</>)}
            {li(<><strong style={{ color: INK }}>Right not to be subject to automated decision-making</strong> — although our AI matching is automated, significant decisions about your employment are always made by employers, not by us.</>)}
          </ul>
          <p style={{ margin: '12px 0 0' }}>To exercise any GDPR rights, contact us at <a href="mailto:hello@jobsesame.co" style={{ color: ACCENT }}>hello@jobsesame.co</a>.</p>
        </>)}

        {section('10. Contact & Complaints', <>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {li(<>Privacy enquiries: <a href="mailto:hello@jobsesame.co" style={{ color: ACCENT }}>hello@jobsesame.co</a></>)}
            {li(<>Data deletion requests: <a href="/delete-data" style={{ color: ACCENT }}>jobsesame.co/delete-data</a></>)}
            {li(<>Information Regulator South Africa: <a href="https://inforegulator.org.za" target="_blank" rel="noopener noreferrer" style={{ color: ACCENT }}>inforegulator.org.za</a></>)}
            {li('Complaints to the Information Regulator can be submitted via their website or by post to: The Information Regulator, JD House, 27 Stiemens Street, Braamfontein, Johannesburg, 2001')}
          </ul>
        </>)}

        <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 24, marginTop: 40, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <a href="/terms" style={{ fontSize: 13, color: ACCENT, textDecoration: 'none' }}>Terms of Service</a>
          <a href="/refund" style={{ fontSize: 13, color: ACCENT, textDecoration: 'none' }}>Refund Policy</a>
          <a href="/delete-data" style={{ fontSize: 13, color: ACCENT, textDecoration: 'none' }}>Delete My Data</a>
          <a href="/unsubscribe" style={{ fontSize: 13, color: ACCENT, textDecoration: 'none' }}>Unsubscribe from emails</a>
        </div>
      </div>
    </main>
  );
}
