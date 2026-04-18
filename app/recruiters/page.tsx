'use client';
import { useState } from 'react';

const INDUSTRIES = [
  'Technology', 'Finance & Banking', 'Healthcare', 'Education', 'Engineering',
  'Marketing & Media', 'Legal', 'Retail & E-commerce', 'Construction',
  'Manufacturing', 'Logistics & Supply Chain', 'Hospitality & Tourism',
  'Consulting', 'Non-profit', 'Government', 'Other',
];

const COMPANY_SIZES = ['1–10', '11–50', '51–200', '201–1,000', '1,000+'];
const HOW_HEARD = ['Google search', 'LinkedIn', 'Word of mouth', 'Social media', 'Email', 'Other'];

export default function RecruitersPage() {
  const [form, setForm] = useState({
    companyName: '',
    contactName: '',
    workEmail: '',
    phone: '',
    companySize: '',
    industry: '',
    openPositions: '',
    howHeard: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.companyName.trim()) errs.companyName = 'Required';
    if (!form.contactName.trim()) errs.contactName = 'Required';
    if (!form.workEmail.includes('@')) errs.workEmail = 'Valid email required';
    if (!form.phone.trim()) errs.phone = 'Required';
    if (!form.companySize) errs.companySize = 'Required';
    if (!form.industry) errs.industry = 'Required';
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const submissions = JSON.parse(localStorage.getItem('jobsesame_recruiter_submissions') || '[]');
    submissions.push({ ...form, submittedAt: new Date().toISOString() });
    localStorage.setItem('jobsesame_recruiter_submissions', JSON.stringify(submissions));
    setSubmitted(true);
  };

  const inputStyle = (key: string): React.CSSProperties => ({
    width: '100%',
    padding: '12px 16px',
    border: `1.5px solid ${errors[key] ? '#A32D2D' : '#1A5A2A'}`,
    borderRadius: 10,
    fontSize: 14,
    color: '#FFFFFF',
    background: '#0D3A1A',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  });

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: '#5A9A6A',
    fontWeight: 600,
    display: 'block',
    marginBottom: 6,
  };

  return (
    <main style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#052A14', minHeight: '100vh', margin: 0 }}>

      {/* NAV */}
      <nav style={{ background: '#052A14', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #0D4A20', position: 'sticky', top: 0, zIndex: 100 }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 36, height: 36, background: '#C8E600', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
              <circle cx="9" cy="9" r="5.5" stroke="#052A14" strokeWidth="2.2"/>
              <circle cx="9" cy="9" r="2.5" fill="#052A14" opacity="0.4"/>
              <line x1="13.5" y1="13.5" x2="20" y2="20" stroke="#052A14" strokeWidth="2.8" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontSize: 18, fontWeight: 800 }}>
            <span style={{ color: '#FFFFFF' }}>job</span>
            <span style={{ color: '#C8E600' }}>sesame</span>
          </span>
        </a>
        <a href="/jobs" style={{ fontSize: 13, color: '#A8D8B0', fontWeight: 500, textDecoration: 'none' }}>Find Jobs</a>
      </nav>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontSize: 'clamp(26px, 5vw, 40px)', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.15, marginBottom: 14 }}>
            Post jobs. Find the<br /><span style={{ color: '#C8E600' }}>right talent.</span>
          </h1>
          <p style={{ fontSize: 15, color: '#90C898', lineHeight: 1.8, maxWidth: 480, margin: '0 auto' }}>
            Join thousands of companies hiring smarter with Jobsesame. Tell us about your hiring needs and our team will be in touch within 24 hours.
          </p>
        </div>

        {submitted ? (
          <div style={{ background: 'rgba(200,230,0,0.08)', border: '2px solid #C8E600', borderRadius: 20, padding: '48px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#FFFFFF', marginBottom: 12 }}>Request received!</h2>
            <p style={{ fontSize: 15, color: '#90C898', lineHeight: 1.8 }}>
              Thank you. Our team will be in touch within 24 hours.
            </p>
            <a href="/" style={{ display: 'inline-block', marginTop: 24, background: '#C8E600', color: '#052A14', fontSize: 14, fontWeight: 800, padding: '12px 28px', borderRadius: 99, textDecoration: 'none' }}>
              Back to home
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ background: '#072E16', border: '1.5px solid #1A4A2A', borderRadius: 20, padding: '36px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Company name *</label>
                <input value={form.companyName} onChange={set('companyName')} placeholder="Acme Corp" style={inputStyle('companyName')} />
                {errors.companyName && <div style={{ fontSize: 11, color: '#F09595', marginTop: 4 }}>{errors.companyName}</div>}
              </div>
              <div>
                <label style={labelStyle}>Contact person full name *</label>
                <input value={form.contactName} onChange={set('contactName')} placeholder="Jane Smith" style={inputStyle('contactName')} />
                {errors.contactName && <div style={{ fontSize: 11, color: '#F09595', marginTop: 4 }}>{errors.contactName}</div>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Work email *</label>
                <input type="email" value={form.workEmail} onChange={set('workEmail')} placeholder="jane@company.com" style={inputStyle('workEmail')} />
                {errors.workEmail && <div style={{ fontSize: 11, color: '#F09595', marginTop: 4 }}>{errors.workEmail}</div>}
              </div>
              <div>
                <label style={labelStyle}>Phone number *</label>
                <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+27 82 000 0000" style={inputStyle('phone')} />
                {errors.phone && <div style={{ fontSize: 11, color: '#F09595', marginTop: 4 }}>{errors.phone}</div>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Company size *</label>
                <select value={form.companySize} onChange={set('companySize')} style={{ ...inputStyle('companySize'), cursor: 'pointer' }}>
                  <option value="">Select size</option>
                  {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
                </select>
                {errors.companySize && <div style={{ fontSize: 11, color: '#F09595', marginTop: 4 }}>{errors.companySize}</div>}
              </div>
              <div>
                <label style={labelStyle}>Industry *</label>
                <select value={form.industry} onChange={set('industry')} style={{ ...inputStyle('industry'), cursor: 'pointer' }}>
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
                {errors.industry && <div style={{ fontSize: 11, color: '#F09595', marginTop: 4 }}>{errors.industry}</div>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Number of open positions</label>
                <input type="number" min="1" value={form.openPositions} onChange={set('openPositions')} placeholder="e.g. 5" style={inputStyle('openPositions')} />
              </div>
              <div>
                <label style={labelStyle}>How did you hear about us?</label>
                <select value={form.howHeard} onChange={set('howHeard')} style={{ ...inputStyle('howHeard'), cursor: 'pointer' }}>
                  <option value="">Select</option>
                  {HOW_HEARD.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Tell us about your hiring needs</label>
              <textarea
                value={form.message}
                onChange={set('message')}
                placeholder="What roles are you hiring for? What challenges are you facing with recruitment? Any specific requirements?"
                rows={5}
                style={{ ...inputStyle('message'), resize: 'vertical', lineHeight: 1.6 }}
              />
            </div>

            <button type="submit" style={{ background: '#C8E600', color: '#052A14', fontSize: 15, fontWeight: 800, padding: '14px 0', borderRadius: 12, border: 'none', cursor: 'pointer', width: '100%', marginTop: 4 }}>
              Request recruiter access →
            </button>

            <p style={{ textAlign: 'center', fontSize: 12, color: '#3A7A4A', margin: 0 }}>
              No commitment required. Our team will contact you within 24 hours.
            </p>
          </form>
        )}

        {/* TRUST SIGNALS */}
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', marginTop: 40 }}>
          {['495,000+ active candidates', 'AI-powered matching', 'Dedicated account manager', 'No placement fees'].map(t => (
            <div key={t} style={{ fontSize: 12, color: '#3A7A4A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#C8E600' }}>✓</span> {t}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
