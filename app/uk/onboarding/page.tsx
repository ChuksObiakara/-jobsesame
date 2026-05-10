'use client';
import { useEffect, useRef, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

const BG = '#052A14';
const CARD = 'rgba(255,255,255,0.03)';
const BORDER = '1px solid rgba(255,255,255,0.08)';
const ACCENT = '#C8E600';
const ACCENT_DIM = 'rgba(200,230,0,0.12)';

const LOCATIONS = ['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Bristol', 'Remote', 'Anywhere in UK'];
const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Freelance'];
const SALARY_BANDS = ['<£30k', '£30–50k', '£50–70k', '£70–100k', '£100k+'];
const EXP_LEVELS = ['0–2 years', '3–5 years', '5–10 years', '10+ years'];

function PillBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 16px',
        borderRadius: 99,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        border: active ? `1.5px solid ${ACCENT}` : BORDER,
        background: active ? ACCENT_DIM : 'rgba(255,255,255,0.03)',
        color: active ? ACCENT : 'rgba(255,255,255,0.55)',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );
}

export const dynamic = 'force-dynamic';

export default function UKOnboarding() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  // Step 1 state
  const [name, setName] = useState('');
  const [currentRole, setCurrentRole] = useState('');
  const [expLevel, setExpLevel] = useState('');

  // Step 2 state
  const [targetRole, setTargetRole] = useState('');
  const [locations, setLocations] = useState<string[]>([]);
  const [jobType, setJobType] = useState('');
  const [salaryBand, setSalaryBand] = useState('');

  // Step 3 state
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cvData, setCvData] = useState<any>(null);
  const [cvError, setCvError] = useState('');
  const [activating, setActivating] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace('/sign-in?redirect_url=/uk/onboarding');
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (user) {
      setName([user.firstName, user.lastName].filter(Boolean).join(' ') || '');
    }
  }, [user]);

  const toggleLocation = (loc: string) => {
    setLocations(prev =>
      prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
    );
  };

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setCvError('Please upload a PDF file.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setCvError('File too large. Maximum 15MB.');
      return;
    }
    setCvError('');
    setCvFile(file);
    uploadCV(file);
  };

  const uploadCV = async (file: File) => {
    setUploading(true);
    setCvData(null);
    setCvError('');
    try {
      const form = new FormData();
      form.append('cv', file);
      const res = await fetch('/api/cv', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok || data.error) {
        setCvError(data.error || 'Failed to parse CV. Please try a different file.');
      } else {
        const parsed = data.cvData || data;
        setCvData(parsed);
        // Merge onboarding preferences into cvData
        const enriched = {
          ...parsed,
          ukPreferences: { targetRole, locations, jobType, salaryBand },
        };
        localStorage.setItem('jobsesame_cv_data', JSON.stringify(enriched));
      }
    } catch {
      setCvError('Something went wrong. Please try again.');
    }
    setUploading(false);
  };

  const activateTrial = async () => {
    setActivating(true);
    try {
      // Sync user to DB then activate trial
      await fetch('/api/user/sync', { method: 'POST' });
      const res = await fetch('/api/uk/trial', { method: 'POST' });
      const data = await res.json();
      if (!res.ok && data.error !== 'Trial already used') {
        setCvError(data.error || 'Could not activate trial. Please try again.');
        setActivating(false);
        return;
      }
      // Save preferences to localStorage even if trial already existed
      const prefs = { name, currentRole, expLevel, targetRole, locations, jobType, salaryBand };
      localStorage.setItem('jobsesame_uk_onboarding', JSON.stringify(prefs));
      router.replace('/uk/jobs');
    } catch {
      setCvError('Could not activate trial. Please try again.');
      setActivating(false);
    }
  };

  const skipCVAndActivate = async () => {
    setActivating(true);
    try {
      await fetch('/api/user/sync', { method: 'POST' });
      const res = await fetch('/api/uk/trial', { method: 'POST' });
      const data = await res.json();
      if (!res.ok && data.error !== 'Trial already used') {
        setCvError(data.error || 'Could not activate trial. Please try again.');
        setActivating(false);
        return;
      }
      router.replace('/uk/jobs');
    } catch {
      setCvError('Could not activate trial.');
      setActivating(false);
    }
  };

  const step1Valid = name.trim().length > 0;
  const step2Valid = targetRole.trim().length > 0;

  if (!isLoaded) return null;

  const progress = ((step - 1) / 3) * 100;

  return (
    <main style={{ background: BG, minHeight: '100vh', fontFamily: "'Plus Jakarta Sans',sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center', padding: isMobile ? '24px 16px' : '48px 24px', position: 'relative' }}>
      <a href="/uk" style={{ position: 'absolute', top: isMobile ? 16 : 20, left: isMobile ? 16 : 24, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.45)', textDecoration: 'none', letterSpacing: '0.2px' }}>
        ← Back
      </a>
      <style>{`
        *,*::before,*::after{box-sizing:border-box}
        input::placeholder{color:rgba(255,255,255,0.2)}
        input:focus{border-color:rgba(200,230,0,0.4)!important;outline:none}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* Logo */}
      <a href="/uk" style={{ textDecoration: 'none', marginBottom: 32 }}>
        <span style={{ fontSize: 20, fontWeight: 800 }}>
          <span style={{ color: '#fff' }}>job</span><span style={{ color: ACCENT }}>sesame</span>
        </span>
        <span style={{ marginLeft: 8, fontSize: 10, background: ACCENT_DIM, color: ACCENT, border: `1px solid rgba(200,230,0,0.25)`, borderRadius: 99, padding: '2px 7px', fontWeight: 700 }}>🇬🇧 UK</span>
      </a>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: 520, background: CARD, border: BORDER, borderRadius: 20, overflow: 'hidden', animation: 'fadeUp 0.4s ease-out' }}>

        {/* Progress bar */}
        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)' }}>
          <div style={{ height: '100%', background: ACCENT, width: `${progress}%`, transition: 'width 0.4s ease' }} />
        </div>

        <div style={{ padding: isMobile ? '28px 20px' : '36px 40px' }}>
          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{
                width: s === step ? 24 : 8,
                height: 8,
                borderRadius: 99,
                background: s < step ? ACCENT : s === step ? ACCENT : 'rgba(255,255,255,0.1)',
                transition: 'all 0.3s ease',
              }} />
            ))}
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginLeft: 8, fontWeight: 600 }}>
              Step {step} of 3
            </span>
          </div>

          {/* ── STEP 1: About you ──────────────────────────────────────────── */}
          {step === 1 && (
            <div style={{ animation: 'fadeUp 0.3s ease-out' }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 6, lineHeight: 1.2 }}>
                Welcome{name ? `, ${name.split(' ')[0]}` : ''}!
              </h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 28, lineHeight: 1.6 }}>
                Tell us a bit about yourself so we can find the right UK jobs for you.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 7 }}>Your name</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Full name"
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', fontSize: 15, color: '#fff', fontFamily: 'inherit', fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 7 }}>Current job title</label>
                  <input
                    value={currentRole}
                    onChange={e => setCurrentRole(e.target.value)}
                    placeholder="e.g. Software Engineer, Nurse, Accountant"
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', fontSize: 15, color: '#fff', fontFamily: 'inherit' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 10 }}>Years of experience</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {EXP_LEVELS.map(l => (
                      <PillBtn key={l} label={l} active={expLevel === l} onClick={() => setExpLevel(l)} />
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!step1Valid}
                style={{ width: '100%', marginTop: 28, background: step1Valid ? ACCENT : 'rgba(200,230,0,0.2)', color: step1Valid ? '#052A14' : 'rgba(200,230,0,0.4)', fontSize: 15, fontWeight: 800, padding: '14px', borderRadius: 12, border: 'none', cursor: step1Valid ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}
              >
                Continue →
              </button>
            </div>
          )}

          {/* ── STEP 2: Job preferences ────────────────────────────────────── */}
          {step === 2 && (
            <div style={{ animation: 'fadeUp 0.3s ease-out' }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 6, lineHeight: 1.2 }}>What are you looking for?</h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 28, lineHeight: 1.6 }}>
                We'll use this to surface the best UK jobs for you.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 7 }}>Target role in UK</label>
                  <input
                    value={targetRole}
                    onChange={e => setTargetRole(e.target.value)}
                    placeholder="e.g. React Developer, Registered Nurse, Data Analyst"
                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', fontSize: 15, color: '#fff', fontFamily: 'inherit' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 10 }}>Preferred location</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {LOCATIONS.map(l => (
                      <PillBtn key={l} label={l} active={locations.includes(l)} onClick={() => toggleLocation(l)} />
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 10 }}>Employment type</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {JOB_TYPES.map(t => (
                      <PillBtn key={t} label={t} active={jobType === t} onClick={() => setJobType(t)} />
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 10 }}>Expected salary</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {SALARY_BANDS.map(s => (
                      <PillBtn key={s} label={s} active={salaryBand === s} onClick={() => setSalaryBand(s)} />
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: BORDER, color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 600, padding: '13px', borderRadius: 12, cursor: 'pointer' }}>
                  ← Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!step2Valid}
                  style={{ flex: 2, background: step2Valid ? ACCENT : 'rgba(200,230,0,0.2)', color: step2Valid ? '#052A14' : 'rgba(200,230,0,0.4)', fontSize: 15, fontWeight: 800, padding: '13px', borderRadius: 12, border: 'none', cursor: step2Valid ? 'pointer' : 'not-allowed', transition: 'all 0.15s' }}
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: CV Upload ──────────────────────────────────────────── */}
          {step === 3 && (
            <div style={{ animation: 'fadeUp 0.3s ease-out' }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 6, lineHeight: 1.2 }}>Upload your CV</h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 24, lineHeight: 1.6 }}>
                Our AI will rewrite it to pass UK ATS systems in 30 seconds.
              </p>

              {/* Upload area */}
              {!cvData && (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => {
                    e.preventDefault();
                    setDragOver(false);
                    const f = e.dataTransfer.files[0];
                    if (f) handleFileChange(f);
                  }}
                  onClick={() => !uploading && fileRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragOver ? ACCENT : 'rgba(255,255,255,0.12)'}`,
                    borderRadius: 14,
                    padding: '36px 24px',
                    textAlign: 'center',
                    cursor: uploading ? 'wait' : 'pointer',
                    background: dragOver ? ACCENT_DIM : 'rgba(255,255,255,0.02)',
                    transition: 'all 0.2s',
                    marginBottom: 16,
                  }}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf"
                    style={{ display: 'none' }}
                    onChange={e => handleFileChange(e.target.files?.[0] || null)}
                  />
                  {uploading ? (
                    <>
                      <div style={{ width: 32, height: 32, border: `3px solid rgba(200,230,0,0.2)`, borderTopColor: ACCENT, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
                      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Analysing your CV with AI...</p>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 36, marginBottom: 10 }}>📄</div>
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>
                        {cvFile ? cvFile.name : 'Drop your CV here or click to upload'}
                      </p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>PDF only · max 15MB</p>
                    </>
                  )}
                </div>
              )}

              {/* CV parsed preview */}
              {cvData && !uploading && (
                <div style={{ background: 'rgba(200,230,0,0.06)', border: `1px solid rgba(200,230,0,0.2)`, borderRadius: 14, padding: '20px', marginBottom: 16, animation: 'fadeUp 0.3s ease-out' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                    <span style={{ fontSize: 20 }}>✅</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>CV analysed successfully</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Optimised for UK employers</div>
                    </div>
                    <button
                      onClick={() => { setCvData(null); setCvFile(null); }}
                      style={{ marginLeft: 'auto', fontSize: 11, color: 'rgba(255,255,255,0.35)', background: 'transparent', border: BORDER, borderRadius: 99, padding: '4px 10px', cursor: 'pointer' }}
                    >
                      Change
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', width: 70, flexShrink: 0 }}>Name</span>
                      <span style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>{cvData.name || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', width: 70, flexShrink: 0 }}>Title</span>
                      <span style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>{cvData.title || targetRole || '—'}</span>
                    </div>
                    {cvData.skills?.length > 0 && (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', width: 70, flexShrink: 0 }}>Skills</span>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          {cvData.skills.slice(0, 6).map((s: string) => (
                            <span key={s} style={{ fontSize: 10, background: 'rgba(200,230,0,0.1)', color: ACCENT, border: `1px solid rgba(200,230,0,0.2)`, borderRadius: 99, padding: '2px 8px', fontWeight: 700 }}>{s}</span>
                          ))}
                          {cvData.skills.length > 6 && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>+{cvData.skills.length - 6} more</span>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {cvError && (
                <div style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: 10, padding: '11px 14px', fontSize: 13, color: '#FF8080', marginBottom: 16 }}>
                  {cvError}
                </div>
              )}

              {/* Free trial highlight */}
              <div style={{ background: ACCENT_DIM, border: `1px solid rgba(200,230,0,0.2)`, borderRadius: 12, padding: '14px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 22 }}>🎁</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: ACCENT }}>7 days free — no card needed</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Full access to UK jobs, AI apply, and salary insights.</div>
                </div>
              </div>

              {cvError && (
                <div style={{ textAlign: 'center', marginBottom: 10 }}>
                  <button onClick={skipCVAndActivate} disabled={activating} style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                    Skip CV upload and start free trial →
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(2)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: BORDER, color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 600, padding: '13px', borderRadius: 12, cursor: 'pointer' }}>
                  ← Back
                </button>
                <button
                  onClick={cvData ? activateTrial : skipCVAndActivate}
                  disabled={uploading || activating}
                  style={{
                    flex: 2,
                    background: uploading || activating ? 'rgba(200,230,0,0.3)' : ACCENT,
                    color: '#052A14',
                    fontSize: 15,
                    fontWeight: 800,
                    padding: '13px',
                    borderRadius: 12,
                    border: 'none',
                    cursor: uploading || activating ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  {activating ? (
                    <>
                      <span style={{ width: 14, height: 14, border: '2px solid rgba(5,42,20,0.3)', borderTopColor: '#052A14', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                      Activating...
                    </>
                  ) : cvData ? 'Start my free week →' : 'Skip & start free week →'}
                </button>
              </div>

              {!cvData && !uploading && (
                <p style={{ textAlign: 'center', marginTop: 14, fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
                  You can upload your CV from the dashboard later
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer note */}
      <p style={{ marginTop: 24, fontSize: 12, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
        No credit card required · Cancel anytime · Powered by Claude AI
      </p>
    </main>
  );
}
