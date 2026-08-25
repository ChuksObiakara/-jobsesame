'use client';
import { useState } from 'react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { INK, INK_SOFT, INK_FAINT, LINE, PAPER, CARD, ACCENT, CLAY, SERIF, SANS } from '../lib/theme';

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
    padding: '11px 14px',
    border: `1px solid ${errors[key] ? CLAY : LINE}`,
    borderRadius: 3,
    fontSize: 14,
    color: INK,
    background: CARD,
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  });

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: INK_SOFT,
    fontWeight: 600,
    display: 'block',
    marginBottom: 6,
  };

  return (
    <main style={{ fontFamily: SANS, background: PAPER, color: INK, minHeight: '100vh', margin: 0 }}>
      <Nav theme="light" />

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '56px 24px 80px' }}>

        {/* HEADER */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 'clamp(26px, 5vw, 36px)', lineHeight: 1.2, marginBottom: 14 }}>
            Post jobs. Find the right talent.
          </h1>
          <p style={{ fontSize: 15, color: INK_SOFT, lineHeight: 1.75, maxWidth: 460, margin: '0 auto' }}>
            Join companies hiring smarter with Jobsesame. Tell us about your hiring needs and our team will be in touch within 24 hours.
          </p>
        </div>

        {submitted ? (
          <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 4, padding: '48px 32px', textAlign: 'center' }}>
            <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 22, marginBottom: 12 }}>Request received</h2>
            <p style={{ fontSize: 15, color: INK_SOFT, lineHeight: 1.75 }}>
              Thank you. Our team will be in touch within 24 hours.
            </p>
            <a href="/" style={{ display: 'inline-block', marginTop: 24, background: ACCENT, color: PAPER, fontSize: 14, fontWeight: 600, padding: '12px 28px', borderRadius: 3, textDecoration: 'none' }}>
              Back to home
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 4, padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Company name *</label>
                <input value={form.companyName} onChange={set('companyName')} placeholder="Acme Corp" style={inputStyle('companyName')} />
                {errors.companyName && <div style={{ fontSize: 11, color: CLAY, marginTop: 4 }}>{errors.companyName}</div>}
              </div>
              <div>
                <label style={labelStyle}>Contact person full name *</label>
                <input value={form.contactName} onChange={set('contactName')} placeholder="Jane Smith" style={inputStyle('contactName')} />
                {errors.contactName && <div style={{ fontSize: 11, color: CLAY, marginTop: 4 }}>{errors.contactName}</div>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Work email *</label>
                <input type="email" value={form.workEmail} onChange={set('workEmail')} placeholder="jane@company.com" style={inputStyle('workEmail')} />
                {errors.workEmail && <div style={{ fontSize: 11, color: CLAY, marginTop: 4 }}>{errors.workEmail}</div>}
              </div>
              <div>
                <label style={labelStyle}>Phone number *</label>
                <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+27 82 000 0000" style={inputStyle('phone')} />
                {errors.phone && <div style={{ fontSize: 11, color: CLAY, marginTop: 4 }}>{errors.phone}</div>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Company size *</label>
                <select value={form.companySize} onChange={set('companySize')} style={{ ...inputStyle('companySize'), cursor: 'pointer' }}>
                  <option value="">Select size</option>
                  {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} employees</option>)}
                </select>
                {errors.companySize && <div style={{ fontSize: 11, color: CLAY, marginTop: 4 }}>{errors.companySize}</div>}
              </div>
              <div>
                <label style={labelStyle}>Industry *</label>
                <select value={form.industry} onChange={set('industry')} style={{ ...inputStyle('industry'), cursor: 'pointer' }}>
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
                {errors.industry && <div style={{ fontSize: 11, color: CLAY, marginTop: 4 }}>{errors.industry}</div>}
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

            <button type="submit" style={{ background: ACCENT, color: PAPER, fontSize: 14.5, fontWeight: 600, padding: '14px 0', borderRadius: 3, border: 'none', cursor: 'pointer', width: '100%', marginTop: 4 }}>
              Request recruiter access
            </button>

            <p style={{ textAlign: 'center', fontSize: 12, color: INK_FAINT, margin: 0 }}>
              No commitment required. Our team will contact you within 24 hours.
            </p>
          </form>
        )}

        {/* TRUST SIGNALS */}
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', marginTop: 40, paddingTop: 32, borderTop: `1px solid ${LINE}` }}>
          {['AI-powered matching', 'Pre-screened candidates', 'Dedicated account manager', 'No placement fees'].map(t => (
            <div key={t} style={{ fontSize: 12, color: INK_FAINT, fontWeight: 500 }}>{t}</div>
          ))}
        </div>
      </div>
      <Footer theme="light" />
    </main>
  );
}
