'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { INK, INK_SOFT, INK_FAINT, LINE, PAPER, CARD, ACCENT, CLAY, SERIF, SANS, SCRIPT } from '../lib/theme';
import { cvCacheKey, profileCacheKey } from '../lib/user-cache-keys';

interface CvData {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  title?: string;
  experience_years?: number;
  education?: string;
  skills?: string[];
  summary?: string;
  ats_score?: number;
}

interface Profile {
  name: string;
  email: string;
  phone: string;
  location: string;
  jobTitle: string;
  experienceYears: string;
  qualification: string;
  keySkills: string;
  preferredJobTitle: string;
  industry: string;
  jobType: string;
  workPreference: string;
  desiredLocation: string;
  salaryExpectation: string;
}

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [cvData, setCvData] = useState<CvData | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  const [profile, setProfile] = useState<Profile>({
    name: '', email: '', phone: '', location: '',
    jobTitle: '', experienceYears: '', qualification: '', keySkills: '',
    preferredJobTitle: '', industry: '', jobType: 'full-time',
    workPreference: 'hybrid', desiredLocation: '', salaryExpectation: '',
  });

  // Skip onboarding if already completed
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('jobsesame_onboarding_complete') === 'true') {
        router.replace('/dashboard');
      }
    }
  }, [router]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Pre-fill profile from user + CV data
  useEffect(() => {
    if (user) {
      setProfile(p => ({
        ...p,
        name: [user.firstName, user.lastName].filter(Boolean).join(' ') || p.name,
        email: user.emailAddresses[0]?.emailAddress || p.email,
      }));
    }
  }, [user]);

  useEffect(() => {
    if (cvData) {
      setProfile(p => ({
        ...p,
        name: cvData.name || p.name,
        email: cvData.email || p.email,
        phone: cvData.phone || p.phone,
        location: cvData.location || p.location,
        jobTitle: cvData.title || p.jobTitle,
        experienceYears: cvData.experience_years?.toString() || p.experienceYears,
        qualification: cvData.education || p.qualification,
        keySkills: cvData.skills?.join(', ') || p.keySkills,
        preferredJobTitle: cvData.title || p.preferredJobTitle,
      }));
    }
  }, [cvData]);

  const handleFileUpload = async (file: File) => {
    if (file.type !== 'application/pdf') { setUploadError('Please upload a PDF file only'); return; }
    if (file.size > 10 * 1024 * 1024) { setUploadError('File too large. Maximum 10MB'); return; }
    setUploading(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('cv', file);
      const res = await fetch('/api/cv', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        setCvData(data.cvData);
        if (user?.id) localStorage.setItem(cvCacheKey(user.id), JSON.stringify(data.cvData));
        setTimeout(() => setStep(2), 600);
      } else {
        setUploadError(data.error || 'Failed to process CV. Please try again.');
      }
    } catch {
      setUploadError('Something went wrong. Please try again.');
    }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleComplete = async () => {
    const fullProfile = { ...profile, cvData, completedAt: new Date().toISOString() };
    if (user?.id) localStorage.setItem(profileCacheKey(user.id), JSON.stringify(fullProfile));
    localStorage.setItem('jobsesame_onboarding_complete', 'true');
    // Persist user and CV to DB (fire-and-forget — don't block navigation)
    fetch('/api/user/sync', { method: 'POST' }).catch((err) => console.error('[onboarding] sync failed:', err));
    if (cvData) {
      fetch('/api/user/cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvData }),
      }).catch((err) => console.error('[onboarding] cv save failed:', err));
    }
    router.push('/dashboard');
  };

  const progressPercent = step * 25;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    border: `1.5px solid ${LINE}`,
    borderRadius: 6,
    fontSize: 14,
    color: INK,
    background: CARD,
    outline: 'none',
    fontFamily: SANS,
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    color: INK_SOFT,
    fontWeight: 700,
    display: 'block',
    marginBottom: 6,
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
  };

  if (!isLoaded) return null;

  const atsScore = cvData?.ats_score || 72;

  return (
    <main style={{fontFamily:SANS,background:PAPER,color:INK,minHeight:"100vh",padding:isMobile?"0 0 40px":"0 0 60px"}}>

      {/* NAV */}
      <nav style={{background:CARD,padding:"0 24px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${LINE}`}}>
        <a href="/" style={{textDecoration:"none",fontFamily:SCRIPT,fontSize:28,fontWeight:400,color:INK}}>jobsesame</a>
        <div style={{fontSize:12,color:INK_SOFT,fontWeight:600}}>
          Step {step} of 4
        </div>
      </nav>

      {/* PROGRESS BAR */}
      <div style={{background:LINE,height:4}}>
        <div style={{
          height:4,
          background:ACCENT,
          width:`${progressPercent}%`,
          transition:"width 0.4s ease",
          borderRadius:"0 2px 2px 0",
        }}/>
      </div>

      <div style={{maxWidth:560,margin:"0 auto",padding:isMobile?"24px 20px":"40px 24px"}}>

        {/* Step labels */}
        <div style={{display:"flex",gap:0,marginBottom:32}}>
          {["Upload CV","Your profile","Job preferences","Complete"].map((label,i)=>(
            <div key={label} style={{flex:1,textAlign:"center"}}>
              <div style={{
                width:28,height:28,
                borderRadius:"50%",
                background:step>=i+1?ACCENT:LINE,
                color:step>=i+1?PAPER:INK_FAINT,
                fontSize:12,fontWeight:800,
                display:"flex",alignItems:"center",justifyContent:"center",
                margin:"0 auto 4px",
                border:step===i+1?"3px solid rgba(63,93,82,0.25)":"3px solid transparent",
              }}>
                {step>i+1?"✓":i+1}
              </div>
              {!isMobile && <div style={{fontSize:10,color:step===i+1?ACCENT:step>i+1?INK_SOFT:INK_FAINT,fontWeight:step===i+1?700:500}}>{label}</div>}
            </div>
          ))}
        </div>

        {/* ─── STEP 1: CV Upload ─── */}
        {step === 1 && (
          <div>
            <h1 style={{fontFamily:SERIF,fontSize:isMobile?22:26,fontWeight:500,color:INK,marginBottom:8}}>
              Upload your CV
            </h1>
            <p style={{fontSize:14,color:INK_SOFT,marginBottom:28,lineHeight:1.7}}>
              AI reads your CV in seconds and builds your career profile — so you never fill another form.
            </p>

            <div
              onDrop={handleDrop}
              onDragOver={e=>{e.preventDefault();setDragOver(true);}}
              onDragLeave={()=>setDragOver(false)}
              style={{
                border:`2px dashed ${dragOver?ACCENT:LINE}`,
                borderRadius:8,
                padding:"48px 24px",
                textAlign:"center",
                background:dragOver?'rgba(63,93,82,0.05)':uploading?'rgba(63,93,82,0.03)':CARD,
                transition:"all 0.2s",
                cursor:uploading?'default':'pointer',
              }}>
              {uploading ? (
                <div>
                  <div style={{fontSize:36,marginBottom:16}}>🤖</div>
                  <div style={{fontSize:16,fontWeight:700,color:ACCENT,marginBottom:8}}>AI is reading your CV...</div>
                  <div style={{fontSize:13,color:INK_SOFT,marginBottom:20}}>Extracting skills, experience and achievements</div>
                  <div style={{width:200,height:4,background:LINE,borderRadius:99,margin:"0 auto",overflow:"hidden"}}>
                    <div style={{height:4,background:ACCENT,borderRadius:99,animation:"loading 1.5s ease-in-out infinite"}}/>
                  </div>
                  <style>{`@keyframes loading { 0%{width:0%} 50%{width:80%} 100%{width:100%} }`}</style>
                </div>
              ) : (
                <div>
                  <div style={{fontSize:48,marginBottom:16}}>📄</div>
                  <div style={{fontSize:16,fontWeight:700,color:INK,marginBottom:8}}>Drag your CV here</div>
                  <div style={{fontSize:13,color:INK_FAINT,marginBottom:20}}>or click to browse</div>
                  <label style={{cursor:"pointer",display:"inline-block"}}>
                    <input type="file" accept=".pdf" onChange={handleFileInput} style={{display:"none"}}/>
                    <span style={{background:ACCENT,color:PAPER,fontSize:14,fontWeight:700,padding:"12px 28px",borderRadius:3,cursor:"pointer",display:"inline-block"}}>
                      Choose PDF file
                    </span>
                  </label>
                  <div style={{fontSize:11,color:INK_FAINT,marginTop:16}}>PDF only · Max 10MB · Processed securely</div>
                </div>
              )}
            </div>

            {uploadError && (
              <div style={{background:"rgba(168,92,64,0.08)",border:`1px solid rgba(168,92,64,0.3)`,borderRadius:6,padding:"10px 16px",fontSize:13,color:CLAY,marginTop:16}}>
                {uploadError}
              </div>
            )}

            <div style={{marginTop:24,textAlign:"center"}}>
              <button
                onClick={()=>setStep(2)}
                style={{background:"transparent",border:"none",fontSize:13,color:INK_FAINT,cursor:"pointer",textDecoration:"underline"}}>
                Skip for now — fill in manually
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 2: Profile ─── */}
        {step === 2 && (
          <div>
            <h1 style={{fontFamily:SERIF,fontSize:isMobile?22:26,fontWeight:500,color:INK,marginBottom:8}}>
              Your profile
            </h1>
            <p style={{fontSize:14,color:INK_SOFT,marginBottom:28,lineHeight:1.7}}>
              {cvData ? 'We pre-filled this from your CV — check and edit anything.' : 'Tell us about yourself so we can tailor your CV rewrites to you.'}
            </p>

            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16}}>
                <div>
                  <label style={labelStyle}>Full name *</label>
                  <input style={inputStyle} value={profile.name} onChange={e=>setProfile(p=>({...p,name:e.target.value}))} placeholder="Your full name"/>
                </div>
                <div>
                  <label style={labelStyle}>Email *</label>
                  <input style={inputStyle} value={profile.email} onChange={e=>setProfile(p=>({...p,email:e.target.value}))} placeholder="your@email.com" type="email"/>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16}}>
                <div>
                  <label style={labelStyle}>Phone number</label>
                  <input style={inputStyle} value={profile.phone} onChange={e=>setProfile(p=>({...p,phone:e.target.value}))} placeholder="+27 or +1..."/>
                </div>
                <div>
                  <label style={labelStyle}>Current location *</label>
                  <input style={inputStyle} value={profile.location} onChange={e=>setProfile(p=>({...p,location:e.target.value}))} placeholder="City, Country"/>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Current or most recent job title *</label>
                <input style={inputStyle} value={profile.jobTitle} onChange={e=>setProfile(p=>({...p,jobTitle:e.target.value}))} placeholder="e.g. Senior Software Engineer"/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16}}>
                <div>
                  <label style={labelStyle}>Years of experience *</label>
                  <select style={selectStyle} value={profile.experienceYears} onChange={e=>setProfile(p=>({...p,experienceYears:e.target.value}))}>
                    <option value="">Select...</option>
                    <option value="0">Less than 1 year</option>
                    <option value="1">1–2 years</option>
                    <option value="3">3–5 years</option>
                    <option value="6">6–10 years</option>
                    <option value="11">10+ years</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Highest qualification *</label>
                  <select style={selectStyle} value={profile.qualification} onChange={e=>setProfile(p=>({...p,qualification:e.target.value}))}>
                    <option value="">Select...</option>
                    <option value="High school">High school / Matric</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Bachelor's degree">Bachelor&apos;s degree</option>
                    <option value="Postgraduate">Postgraduate / Honours</option>
                    <option value="Master's degree">Master&apos;s degree</option>
                    <option value="PhD">PhD / Doctorate</option>
                    <option value="Professional certification">Professional certification</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Key skills (comma-separated)</label>
                <input style={inputStyle} value={profile.keySkills} onChange={e=>setProfile(p=>({...p,keySkills:e.target.value}))} placeholder="e.g. Python, Project Management, SQL, Leadership"/>
              </div>
            </div>

            <div style={{display:"flex",gap:12,marginTop:28}}>
              <button onClick={()=>setStep(1)} style={{background:"transparent",color:INK_SOFT,fontSize:14,fontWeight:600,padding:"12px 24px",borderRadius:3,border:`1px solid ${LINE}`,cursor:"pointer"}}>
                Back
              </button>
              <button
                onClick={()=>setStep(3)}
                disabled={!profile.name || !profile.email || !profile.jobTitle}
                style={{flex:1,background:!profile.name||!profile.email||!profile.jobTitle?LINE:ACCENT,color:!profile.name||!profile.email||!profile.jobTitle?INK_FAINT:PAPER,fontSize:14,fontWeight:700,padding:"12px",borderRadius:3,border:"none",cursor:!profile.name||!profile.email||!profile.jobTitle?"default":"pointer",transition:"all 0.2s"}}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 3: Job preferences ─── */}
        {step === 3 && (
          <div>
            <h1 style={{fontFamily:SERIF,fontSize:isMobile?22:26,fontWeight:500,color:INK,marginBottom:8}}>
              Job preferences
            </h1>
            <p style={{fontSize:14,color:INK_SOFT,marginBottom:28,lineHeight:1.7}}>
              This helps us tailor your CV rewrites and cover letters to the kind of role you&apos;re after.
            </p>

            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <div>
                <label style={labelStyle}>Preferred job title *</label>
                <input style={inputStyle} value={profile.preferredJobTitle} onChange={e=>setProfile(p=>({...p,preferredJobTitle:e.target.value}))} placeholder="e.g. Senior Product Manager"/>
              </div>
              <div>
                <label style={labelStyle}>Industry</label>
                <select style={selectStyle} value={profile.industry} onChange={e=>setProfile(p=>({...p,industry:e.target.value}))}>
                  <option value="">Any industry</option>
                  <option value="Technology">Technology / Software</option>
                  <option value="Finance">Finance / Banking</option>
                  <option value="Healthcare">Healthcare / Medical</option>
                  <option value="Marketing">Marketing / Advertising</option>
                  <option value="Education">Education</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Sales">Sales / Business Development</option>
                  <option value="Operations">Operations / Supply Chain</option>
                  <option value="Legal">Legal</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:16}}>
                <div>
                  <label style={labelStyle}>Job type *</label>
                  <select style={selectStyle} value={profile.jobType} onChange={e=>setProfile(p=>({...p,jobType:e.target.value}))}>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="freelance">Freelance</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Work preference *</label>
                  <select style={selectStyle} value={profile.workPreference} onChange={e=>setProfile(p=>({...p,workPreference:e.target.value}))}>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="onsite">On-site</option>
                    <option value="any">Any</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Desired location</label>
                <input style={inputStyle} value={profile.desiredLocation} onChange={e=>setProfile(p=>({...p,desiredLocation:e.target.value}))} placeholder="e.g. Johannesburg, Remote, London..."/>
              </div>
              <div>
                <label style={labelStyle}>Salary expectation</label>
                <input style={inputStyle} value={profile.salaryExpectation} onChange={e=>setProfile(p=>({...p,salaryExpectation:e.target.value}))} placeholder="e.g. $3,000/month or R45,000/month"/>
              </div>
            </div>

            <div style={{display:"flex",gap:12,marginTop:28}}>
              <button onClick={()=>setStep(2)} style={{background:"transparent",color:INK_SOFT,fontSize:14,fontWeight:600,padding:"12px 24px",borderRadius:3,border:`1px solid ${LINE}`,cursor:"pointer"}}>
                Back
              </button>
              <button
                onClick={()=>setStep(4)}
                disabled={!profile.preferredJobTitle}
                style={{flex:1,background:!profile.preferredJobTitle?LINE:ACCENT,color:!profile.preferredJobTitle?INK_FAINT:PAPER,fontSize:14,fontWeight:700,padding:"12px",borderRadius:3,border:"none",cursor:!profile.preferredJobTitle?"default":"pointer",transition:"all 0.2s"}}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 4: Complete ─── */}
        {step === 4 && (
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:56,marginBottom:20}}>🎉</div>
            <h1 style={{fontFamily:SERIF,fontSize:isMobile?24:30,fontWeight:500,color:INK,marginBottom:12}}>
              You&apos;re all set, <span style={{color:ACCENT}}>{profile.name.split(' ')[0] || 'there'}</span>!
            </h1>
            <p style={{fontSize:14,color:INK_SOFT,marginBottom:32,lineHeight:1.7,maxWidth:400,margin:"0 auto 32px"}}>
              Your profile is saved. Head to your dashboard, paste a job description, and get a tailored CV and cover letter in about 30 seconds.
            </p>

            {/* CV Summary Card */}
            <div style={{background:CARD,border:`1.5px solid ${ACCENT}`,borderRadius:8,padding:24,textAlign:"left",marginBottom:24}}>
              <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20}}>
                {/* ATS Score Circle */}
                <div style={{position:"relative",width:80,height:80,flexShrink:0}}>
                  <svg width="80" height="80" style={{transform:"rotate(-90deg)"}}>
                    <circle cx="40" cy="40" r="32" fill="none" stroke={LINE} strokeWidth="8"/>
                    <circle cx="40" cy="40" r="32" fill="none" stroke={ACCENT} strokeWidth="8"
                      strokeDasharray={`${2*Math.PI*32}`}
                      strokeDashoffset={`${2*Math.PI*32*(1-atsScore/100)}`}
                      strokeLinecap="round"/>
                  </svg>
                  <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
                    <span style={{fontFamily:SERIF,fontSize:16,color:ACCENT,lineHeight:1}}>{atsScore}%</span>
                    <span style={{fontSize:8,color:INK_FAINT,lineHeight:1,marginTop:2}}>ATS</span>
                  </div>
                </div>
                <div>
                  <div style={{fontSize:18,fontWeight:700,color:INK,marginBottom:3}}>{profile.name}</div>
                  <div style={{fontSize:13,color:ACCENT,fontWeight:600,marginBottom:2}}>{profile.jobTitle || profile.preferredJobTitle}</div>
                  <div style={{fontSize:12,color:INK_SOFT}}>{profile.location}</div>
                </div>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
                {[
                  {label:"Experience",value:profile.experienceYears ? `${profile.experienceYears}+ years` : "—"},
                  {label:"Looking for",value:profile.preferredJobTitle || "—"},
                  {label:"Work type",value:profile.workPreference || "—"},
                  {label:"Job type",value:profile.jobType || "—"},
                ].map(s=>(
                  <div key={s.label} style={{background:PAPER,border:`1px solid ${LINE}`,borderRadius:6,padding:"10px 14px"}}>
                    <div style={{fontSize:10,color:INK_FAINT,fontWeight:700,textTransform:"uppercase",letterSpacing:"1px",marginBottom:3}}>{s.label}</div>
                    <div style={{fontSize:13,color:INK,fontWeight:600}}>{s.value}</div>
                  </div>
                ))}
              </div>

              {profile.keySkills && (
                <div>
                  <div style={{fontSize:10,color:INK_FAINT,fontWeight:700,textTransform:"uppercase",letterSpacing:"1px",marginBottom:8}}>Key skills</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {profile.keySkills.split(',').slice(0,8).map(s=>(
                      <span key={s} style={{background:"rgba(63,93,82,0.1)",color:ACCENT,fontSize:11,padding:"3px 10px",borderRadius:99,fontWeight:600}}>{s.trim()}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{background:"rgba(63,93,82,0.08)",border:"1.5px solid rgba(63,93,82,0.25)",borderRadius:8,padding:16,marginBottom:28,textAlign:"left"}}>
              <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                <span style={{fontSize:18}}>⚡</span>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:ACCENT,marginBottom:4}}>Your CV is ready to tailor</div>
                  <div style={{fontSize:12,color:INK_SOFT,lineHeight:1.6}}>
                    Paste any job description in your dashboard and get a CV and cover letter rewritten for that exact role in about 30 seconds.
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleComplete}
              style={{width:"100%",background:ACCENT,color:PAPER,fontSize:16,fontWeight:700,padding:"16px",borderRadius:3,border:"none",cursor:"pointer",boxShadow:"0 4px 20px rgba(63,93,82,0.25)"}}>
              Take me to my dashboard →
            </button>
          </div>
        )}

      </div>
    </main>
  );
}
