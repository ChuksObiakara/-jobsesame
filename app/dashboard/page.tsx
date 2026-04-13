'use client';
import { useUser, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  dateApplied: string;
  status: 'Applied' | 'Interview' | 'Offer' | 'Rejected';
  jobUrl?: string;
}

export default function Dashboard() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [cvData, setCvData] = useState<any>(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [showRewrite, setShowRewrite] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [jobCompany, setJobCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [rewriting, setRewriting] = useState(false);
  const [rewrittenCV, setRewrittenCV] = useState<any>(null);
  const [rewriteError, setRewriteError] = useState('');
  const [referralLink, setReferralLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<'cv' | 'referral' | 'applications'>('cv');
  const [referralsCount] = useState(0);
  const [applications, setApplications] = useState<Application[]>([]);
  const [currency, setCurrency] = useState<'ZAR' | 'USD'>('USD');
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const freeRewrites = 3;

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (isSignedIn && user) {
      generateReferralLink();
      sendWelcomeEmailOnce();
    }
  }, [isSignedIn, user]);

  useEffect(() => {
    const stored = localStorage.getItem('jobsesame_applications');
    if (stored) setApplications(JSON.parse(stored));
  }, []);

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(data => { if (data.country_code === 'ZA') setCurrency('ZAR'); })
      .catch(() => setCurrency('USD'));
  }, []);

  const updateApplicationStatus = (id: string, status: Application['status']) => {
    const updated = applications.map(a => a.id === id ? { ...a, status } : a);
    setApplications(updated);
    localStorage.setItem('jobsesame_applications', JSON.stringify(updated));
  };

  const sendWelcomeEmailOnce = async () => {
    if (localStorage.getItem('jobsesame_welcome_sent')) return;
    const email = user?.emailAddresses[0]?.emailAddress;
    const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || '';
    const userId = user?.id;
    if (!email || !userId) return;
    try {
      await fetch('/api/welcome-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, userId }),
      });
    } catch {
      // Non-critical — do not surface errors to the user
    }
    localStorage.setItem('jobsesame_welcome_sent', 'true');
  };

  const generateReferralLink = async () => {
    try {
      const response = await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, action: 'get' }),
      });
      const data = await response.json();
      if (data.success) {
        setReferralLink(data.referralLink);
      }
    } catch (err) {
      console.error('Failed to generate referral link');
    }
  };

  if (!isLoaded) {
    return (
      <div style={{background:"#052A14",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{color:"#C8E600",fontSize:16,fontWeight:700}}>Opening your doors...</div>
      </div>
    );
  }

  if (!isSignedIn) return null;

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (file.type !== 'application/pdf') { setError('Please upload a PDF file only'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('File too large. Maximum 10MB'); return; }
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('cv', file);
      const response = await fetch('/api/cv', { method: 'POST', body: formData });
      const data = await response.json();
      if (data.success) { setCvData(data.cvData); } else { setError(data.error || 'Failed to process CV'); }
    } catch (err) { setError('Something went wrong. Please try again.'); }
    finally { setUploading(false); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleRewrite = async () => {
    if (!jobTitle) { setRewriteError('Please enter a job title'); return; }
    setRewriting(true); setRewriteError('');
    try {
      const response = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvData, jobTitle, jobCompany, jobDescription }),
      });
      const data = await response.json();
      if (data.success) { setRewrittenCV(data.rewrittenCV); setShowRewrite(false); }
      else { setRewriteError(data.error || 'Failed to rewrite CV'); }
    } catch (err) { setRewriteError('Something went wrong. Please try again.'); }
    finally { setRewriting(false); }
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const message = `I found this amazing AI job platform that rewrites your CV in 30 seconds and applies to jobs for you! Get 3 free rewrites here: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareEmail = () => {
    const subject = 'You need to try Jobsesame — free AI CV rewriter';
    const body = `Hi!\n\nI have been using Jobsesame to find jobs and it is incredible. AI rewrites your CV for any job in 30 seconds.\n\nSign up free here: ${referralLink}\n\nYou get 3 free CV rewrites — no card needed.`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const handlePayment = async (plan: 'credits' | 'pro') => {
    const email = user?.emailAddresses[0]?.emailAddress;
    if (!email) { router.push('/sign-in'); return; }
    setPaying(true);
    setPaymentError('');
    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, plan, currency }),
      });
      const data = await res.json();
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        setPaymentError(data.error || 'Payment failed. Please try again.');
        setPaying(false);
      }
    } catch {
      setPaymentError('Something went wrong. Please try again.');
      setPaying(false);
    }
  };

  const navBtnStyle = (section: string) => ({
    padding: '8px 18px',
    borderRadius: 99,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    border: 'none',
    background: activeSection === section ? '#C8E600' : 'transparent',
    color: activeSection === section ? '#052A14' : '#A8D8B0',
  } as React.CSSProperties);

  return (
    <main style={{fontFamily:"'Plus Jakarta Sans',sans-serif",background:"#052A14",minHeight:"100vh"}}>
      <nav style={{background:"#052A14",padding:"0 24px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #0D4A20"}}>
        <div style={{display:"flex",alignItems:"center",gap:11}}>
          <div style={{width:38,height:38,background:"#C8E600",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="9" cy="9" r="5.5" stroke="#052A14" strokeWidth="2.2"/>
              <circle cx="9" cy="9" r="2.5" fill="#052A14" opacity="0.4"/>
              <line x1="13.5" y1="13.5" x2="20" y2="20" stroke="#052A14" strokeWidth="2.8" strokeLinecap="round"/>
              <line x1="16" y1="14" x2="14.5" y2="17" stroke="#052A14" strokeWidth="2" strokeLinecap="round"/>
              <line x1="19" y1="17" x2="17.5" y2="20" stroke="#052A14" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{fontSize:20,fontWeight:800,letterSpacing:-0.5}}>
            <span style={{color:"#FFFFFF"}}>job</span>
            <span style={{color:"#C8E600"}}>sesame</span>
          </span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <button style={navBtnStyle('cv')} onClick={()=>setActiveSection('cv')}>My CV</button>
          <button style={navBtnStyle('referral')} onClick={()=>setActiveSection('referral')}>Free rewrites</button>
          <button style={navBtnStyle('applications')} onClick={()=>setActiveSection('applications')}>My Applications</button>
          <a href="/" style={{fontSize:13,color:"#A8D8B0",fontWeight:500,textDecoration:"none",marginLeft:6}}>Jobs</a>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      <div style={{padding:"40px 24px",maxWidth:900,margin:"0 auto"}}>

        <div style={{marginBottom:28}}>
          <h1 style={{fontSize:26,fontWeight:800,color:"#FFFFFF",marginBottom:6}}>
            Welcome, <span style={{color:"#C8E600"}}>{user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0]}</span>
          </h1>
          <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
            <span style={{fontSize:12,color:"#5A9A6A"}}>
              Free rewrites remaining: <strong style={{color:"#C8E600"}}>{freeRewrites}</strong>
            </span>
            <span style={{fontSize:12,color:"#5A9A6A"}}>
              Referrals: <strong style={{color:"#C8E600"}}>{referralsCount}/3</strong> to unlock 10 more
            </span>
          </div>
        </div>

        {activeSection === 'referral' && (
          <div>
            <div style={{background:"#072E16",border:"1.5px solid #C8E600",borderRadius:16,padding:28,marginBottom:20}}>
              <h2 style={{fontSize:20,fontWeight:800,color:"#FFFFFF",marginBottom:6}}>
                Unlock 10 free CV rewrites
              </h2>
              <p style={{fontSize:14,color:"#5A9A6A",marginBottom:24,lineHeight:1.7}}>
                Share Jobsesame with 3 friends. When they sign up using your link you unlock 10 free AI CV rewrites — permanently.
              </p>

              <div style={{display:"flex",gap:0,marginBottom:24,border:"1px solid #1A5A2A",borderRadius:12,overflow:"hidden"}}>
                {[1,2,3].map(n=>(
                  <div key={n} style={{flex:1,padding:"16px 10px",textAlign:"center",borderRight:n<3?"1px solid #1A5A2A":"none",background:referralsCount>=n?"rgba(200,230,0,0.1)":"transparent"}}>
                    <div style={{fontSize:24,marginBottom:4}}>{referralsCount>=n?"✅":"👤"}</div>
                    <div style={{fontSize:11,color:referralsCount>=n?"#C8E600":"#3A7A4A",fontWeight:600}}>Friend {n}</div>
                  </div>
                ))}
              </div>

              <div style={{background:"#0D3A1A",borderRadius:12,padding:16,marginBottom:20}}>
                <div style={{fontSize:11,color:"#3A7A4A",fontWeight:700,marginBottom:8,letterSpacing:"1px",textTransform:"uppercase"}}>Your unique referral link</div>
                <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                  <div style={{flex:1,background:"#072E16",border:"1px solid #1A5A2A",borderRadius:8,padding:"10px 14px",fontSize:12,color:"#90C898",fontFamily:"monospace",minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {referralLink || 'Generating your link...'}
                  </div>
                  <button
                    onClick={copyReferralLink}
                    style={{background:copied?"#1A6A2A":"#C8E600",color:copied?"#C8E600":"#052A14",fontSize:12,fontWeight:800,padding:"10px 18px",borderRadius:8,border:"none",cursor:"pointer",whiteSpace:"nowrap"}}>
                    {copied ? 'Copied!' : 'Copy link'}
                  </button>
                </div>
              </div>

              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <button
                  onClick={shareWhatsApp}
                  style={{background:"#25D366",color:"#fff",fontSize:13,fontWeight:700,padding:"11px 22px",borderRadius:99,border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:7}}>
                  Share on WhatsApp
                </button>
                <button
                  onClick={shareEmail}
                  style={{background:"#072E16",color:"#C8E600",fontSize:13,fontWeight:700,padding:"11px 22px",borderRadius:99,border:"1px solid #1A5A2A",cursor:"pointer"}}>
                  Share via Email
                </button>
              </div>
            </div>

            <div style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:14,padding:20,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:"#FFFFFF",marginBottom:4}}>Want unlimited rewrites now?</div>
                <div style={{fontSize:12,color:"#5A9A6A"}}>Upgrade to Pro for {currency === 'ZAR' ? 'R370' : '$20'}/month — unlimited everything.</div>
              </div>
              <button
                onClick={() => handlePayment('pro')}
                disabled={paying}
                style={{background:"#C8E600",color:"#052A14",fontSize:13,fontWeight:800,padding:"10px 24px",borderRadius:99,border:"none",cursor:paying?"default":"pointer",opacity:paying?0.7:1}}>
                {paying ? 'Loading...' : 'Upgrade to Pro'}
              </button>
            </div>
          </div>
        )}

        {activeSection === 'applications' && (
          <div>
            <div style={{marginBottom:20}}>
              <h2 style={{fontSize:20,fontWeight:800,color:"#FFFFFF",marginBottom:4}}>My Applications</h2>
              <p style={{fontSize:13,color:"#5A9A6A"}}>Every job you applied to with Quick Apply — tracked automatically.</p>
            </div>
            {applications.length === 0 ? (
              <div style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:16,padding:48,textAlign:"center"}}>
                <div style={{fontSize:40,marginBottom:16}}>📋</div>
                <h3 style={{fontSize:18,fontWeight:800,color:"#FFFFFF",marginBottom:8}}>No applications yet</h3>
                <p style={{fontSize:13,color:"#5A9A6A",marginBottom:24}}>Use Quick Apply on any job and it will appear here automatically.</p>
                <a href="/" style={{background:"#C8E600",color:"#052A14",fontSize:13,fontWeight:800,padding:"11px 28px",borderRadius:99,textDecoration:"none",display:"inline-block"}}>Browse jobs</a>
              </div>
            ) : (
              <div style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:16,overflow:"hidden"}}>
                <div style={{display:"grid",gridTemplateColumns:"2fr 1.5fr 1fr 1fr 1.2fr",gap:0,padding:"12px 20px",borderBottom:"1px solid #1A4A2A",background:"#0D3A1A"}}>
                  {["Job","Company","Location","Date","Status"].map(h=>(
                    <div key={h} style={{fontSize:10,color:"#5A9A6A",fontWeight:700,letterSpacing:"1px",textTransform:"uppercase"}}>{h}</div>
                  ))}
                </div>
                {applications.map((app, i) => (
                  <div key={app.id} style={{display:"grid",gridTemplateColumns:"2fr 1.5fr 1fr 1fr 1.2fr",gap:0,padding:"14px 20px",borderBottom:i<applications.length-1?"1px solid #0D3A1A":"none",alignItems:"center"}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:700,color:"#FFFFFF",marginBottom:2}}>{app.jobTitle}</div>
                      {app.jobUrl && (
                        <a href={app.jobUrl} target="_blank" rel="noreferrer" style={{fontSize:11,color:"#3A7A4A",textDecoration:"none"}}>View posting ↗</a>
                      )}
                    </div>
                    <div style={{fontSize:12,color:"#90C898"}}>{app.company}</div>
                    <div style={{fontSize:12,color:"#5A9A6A"}}>{app.location}</div>
                    <div style={{fontSize:11,color:"#3A7A4A"}}>{new Date(app.dateApplied).toLocaleDateString('en-ZA',{day:'numeric',month:'short'})}</div>
                    <div>
                      <select
                        value={app.status}
                        onChange={e => updateApplicationStatus(app.id, e.target.value as Application['status'])}
                        style={{
                          padding:"5px 10px",
                          borderRadius:99,
                          border:"1.5px solid",
                          fontSize:11,
                          fontWeight:700,
                          cursor:"pointer",
                          outline:"none",
                          background:"#0D3A1A",
                          borderColor: app.status==='Offer'?'#C8E600':app.status==='Interview'?'#FFA500':app.status==='Rejected'?'#A32D2D':'#1A5A2A',
                          color: app.status==='Offer'?'#C8E600':app.status==='Interview'?'#FFA500':app.status==='Rejected'?'#F09595':'#90C898',
                        }}
                      >
                        <option value="Applied">Applied</option>
                        <option value="Interview">Interview</option>
                        <option value="Offer">Offer</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{display:"flex",gap:12,marginTop:16,flexWrap:"wrap"}}>
              {[
                {label:"Total applied",value:applications.length,color:"#90C898"},
                {label:"Interviews",value:applications.filter(a=>a.status==='Interview').length,color:"#FFA500"},
                {label:"Offers",value:applications.filter(a=>a.status==='Offer').length,color:"#C8E600"},
              ].map(stat=>(
                <div key={stat.label} style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:12,padding:"14px 20px",flex:1,minWidth:120}}>
                  <div style={{fontSize:22,fontWeight:800,color:stat.color,marginBottom:2}}>{stat.value}</div>
                  <div style={{fontSize:11,color:"#5A9A6A",fontWeight:600}}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'cv' && (
          <div>
            {!cvData ? (
              <div>
                <div style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:16,padding:32,marginBottom:20,textAlign:"center"}}>
                  <div style={{fontSize:40,marginBottom:16}}>📄</div>
                  <h2 style={{fontSize:20,fontWeight:800,color:"#FFFFFF",marginBottom:8}}>Upload your CV</h2>
                  <p style={{fontSize:14,color:"#5A9A6A",marginBottom:24,maxWidth:400,margin:"0 auto 24px"}}>
                    Upload your CV once. AI reads everything and builds your complete career profile in seconds.
                  </p>
                  <div
                    onDrop={handleDrop}
                    onDragOver={e=>{e.preventDefault();setDragOver(true);}}
                    onDragLeave={()=>setDragOver(false)}
                    style={{border:`2px dashed ${dragOver?'#C8E600':'#1A5A2A'}`,borderRadius:14,padding:"40px 24px",marginBottom:16,background:dragOver?'rgba(200,230,0,0.05)':'transparent',transition:"all 0.2s",cursor:"pointer"}}>
                    <div style={{fontSize:13,color:"#5A9A6A",marginBottom:12}}>
                      {uploading ? 'AI is reading your CV...' : 'Drag and drop your CV here'}
                    </div>
                    {!uploading && (
                      <div>
                        <div style={{fontSize:12,color:"#3A7A4A",marginBottom:16}}>or</div>
                        <label style={{cursor:"pointer"}}>
                          <input type="file" accept=".pdf" onChange={handleFileInput} style={{display:"none"}}/>
                          <span style={{background:"#C8E600",color:"#052A14",fontSize:13,fontWeight:800,padding:"10px 24px",borderRadius:99,cursor:"pointer"}}>
                            Choose PDF file
                          </span>
                        </label>
                      </div>
                    )}
                    {uploading && (
                      <div style={{marginTop:16}}>
                        <div style={{fontSize:14,color:"#C8E600",fontWeight:700,marginBottom:8}}>Reading your CV...</div>
                        <div style={{fontSize:12,color:"#5A9A6A"}}>About 10 seconds</div>
                      </div>
                    )}
                  </div>
                  {error && <div style={{background:"rgba(163,45,45,0.2)",border:"1px solid #A32D2D",borderRadius:10,padding:"10px 16px",fontSize:13,color:"#F09595",marginBottom:16}}>{error}</div>}
                  <div style={{fontSize:11,color:"#3A7A4A"}}>PDF only · Maximum 10MB · Processed securely</div>
                </div>
              </div>
            ) : rewrittenCV ? (
              <div>
                <div style={{background:"#C8E600",borderRadius:14,padding:16,marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
                  <div>
                    <div style={{fontSize:15,fontWeight:800,color:"#052A14"}}>CV rewritten for {jobTitle}</div>
                    <div style={{fontSize:12,color:"#2A5A14"}}>Match: {rewrittenCV.match_score}% · ATS: {rewrittenCV.ats_score}%</div>
                  </div>
                  <button onClick={()=>setRewrittenCV(null)} style={{background:"#052A14",color:"#C8E600",fontSize:12,fontWeight:700,padding:"7px 16px",borderRadius:99,border:"none",cursor:"pointer"}}>
                    Rewrite for another job
                  </button>
                </div>
                <div style={{background:"#072E16",border:"1.5px solid #C8E600",borderRadius:16,padding:28,marginBottom:20}}>
                  <h2 style={{fontSize:20,fontWeight:800,color:"#FFFFFF",marginBottom:4}}>{rewrittenCV.name}</h2>
                  <div style={{fontSize:14,color:"#C8E600",fontWeight:600,marginBottom:2}}>{rewrittenCV.title}</div>
                  <div style={{fontSize:12,color:"#5A9A6A",marginBottom:16}}>{rewrittenCV.location}</div>
                  <p style={{fontSize:13,color:"#A8D8B0",lineHeight:1.7,marginBottom:20,fontStyle:"italic"}}>&ldquo;{rewrittenCV.summary}&rdquo;</p>
                  <div style={{marginBottom:16}}>
                    <div style={{fontSize:11,color:"#3A7A4A",fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:8}}>Skills matched</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                      {rewrittenCV.skills?.map((skill: string) => (
                        <span key={skill} style={{background:"#0D4A20",color:"#90C898",fontSize:11,padding:"3px 10px",borderRadius:99,fontWeight:600}}>{skill}</span>
                      ))}
                    </div>
                  </div>
                  {rewrittenCV.keywords_added?.length > 0 && (
                    <div style={{marginBottom:16}}>
                      <div style={{fontSize:11,color:"#3A7A4A",fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:8}}>Keywords added for ATS</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                        {rewrittenCV.keywords_added?.map((kw: string) => (
                          <span key={kw} style={{background:"rgba(200,230,0,0.1)",color:"#C8E600",fontSize:11,padding:"3px 10px",borderRadius:99,fontWeight:600,border:"1px solid rgba(200,230,0,0.3)"}}>{kw}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {rewrittenCV.experience?.map((exp: any, i: number) => (
                    <div key={i} style={{marginBottom:12,padding:14,background:"#0D3A1A",borderRadius:10}}>
                      <div style={{fontSize:13,fontWeight:700,color:"#FFFFFF",marginBottom:2}}>{exp.title}</div>
                      <div style={{fontSize:12,color:"#C8E600",marginBottom:8}}>{exp.company} · {exp.duration}</div>
                      {exp.bullets?.map((bullet: string, j: number) => (
                        <div key={j} style={{fontSize:12,color:"#90C898",lineHeight:1.7,paddingLeft:12,position:"relative"}}>
                          <span style={{position:"absolute",left:0,color:"#C8E600"}}>·</span>{bullet}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:14,padding:20,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:800,color:"#FFFFFF",marginBottom:4}}>Unlock Pro to download as PDF or Word</div>
                    <div style={{fontSize:12,color:"#5A9A6A"}}>Unlimited rewrites. Auto-apply. Everything for {currency === 'ZAR' ? 'R370' : '$20'}/month.</div>
                  </div>
                  <button
                    onClick={() => handlePayment('pro')}
                    disabled={paying}
                    style={{background:"#C8E600",color:"#052A14",fontSize:13,fontWeight:800,padding:"10px 24px",borderRadius:99,border:"none",cursor:paying?"default":"pointer",opacity:paying?0.7:1}}>
                    {paying ? 'Loading...' : 'Upgrade to Pro'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{background:"#072E16",border:"1.5px solid #C8E600",borderRadius:16,padding:28,marginBottom:20}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12}}>
                    <div>
                      <h2 style={{fontSize:20,fontWeight:800,color:"#FFFFFF",marginBottom:4}}>{cvData.name}</h2>
                      <div style={{fontSize:13,color:"#C8E600",fontWeight:600}}>{cvData.title}</div>
                      <div style={{fontSize:12,color:"#5A9A6A",marginTop:2}}>{cvData.location}</div>
                    </div>
                    <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                      <button onClick={()=>setCvData(null)} style={{background:"transparent",color:"#5A9A6A",fontSize:12,fontWeight:600,padding:"7px 16px",borderRadius:99,border:"1px solid #1A5A2A",cursor:"pointer"}}>Upload new CV</button>
                      <a href="/" style={{background:"#C8E600",color:"#052A14",fontSize:12,fontWeight:800,padding:"7px 16px",borderRadius:99,textDecoration:"none",display:"inline-block"}}>Find matching jobs</a>
                    </div>
                  </div>
                  {cvData.summary && <p style={{fontSize:13,color:"#A8D8B0",lineHeight:1.7,marginBottom:20,fontStyle:"italic"}}>&ldquo;{cvData.summary}&rdquo;</p>}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16}}>
                    <div>
                      <div style={{fontSize:11,color:"#3A7A4A",fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:8}}>Skills</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                        {cvData.skills?.map((skill: string) => (
                          <span key={skill} style={{background:"#0D4A20",color:"#90C898",fontSize:11,padding:"3px 10px",borderRadius:99,fontWeight:600}}>{skill}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{fontSize:11,color:"#3A7A4A",fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:8}}>Details</div>
                      <div style={{fontSize:12,color:"#90C898",lineHeight:1.8}}>
                        {cvData.experience_years && <div>Experience: {cvData.experience_years} years</div>}
                        {cvData.education && <div>Education: {cvData.education}</div>}
                        {cvData.languages?.length > 0 && <div>Languages: {cvData.languages.join(', ')}</div>}
                      </div>
                    </div>
                  </div>
                </div>

                {showRewrite ? (
                  <div style={{background:"#072E16",border:"1.5px solid #C8E600",borderRadius:16,padding:28,marginBottom:20}}>
                    <h3 style={{fontSize:16,fontWeight:800,color:"#FFFFFF",marginBottom:20}}>Rewrite my CV for a specific job</h3>
                    <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:20}}>
                      <div>
                        <label style={{fontSize:12,color:"#5A9A6A",fontWeight:600,display:"block",marginBottom:6}}>Job title *</label>
                        <input value={jobTitle} onChange={e=>setJobTitle(e.target.value)} placeholder="e.g. Senior Project Manager" style={{width:"100%",padding:"11px 14px",border:"1.5px solid #1A5A2A",borderRadius:10,fontSize:14,color:"#FFFFFF",background:"#0D3A1A",outline:"none",fontFamily:"inherit"}}/>
                      </div>
                      <div>
                        <label style={{fontSize:12,color:"#5A9A6A",fontWeight:600,display:"block",marginBottom:6}}>Company name</label>
                        <input value={jobCompany} onChange={e=>setJobCompany(e.target.value)} placeholder="e.g. Standard Bank" style={{width:"100%",padding:"11px 14px",border:"1.5px solid #1A5A2A",borderRadius:10,fontSize:14,color:"#FFFFFF",background:"#0D3A1A",outline:"none",fontFamily:"inherit"}}/>
                      </div>
                      <div>
                        <label style={{fontSize:12,color:"#5A9A6A",fontWeight:600,display:"block",marginBottom:6}}>Job description (paste for best results)</label>
                        <textarea value={jobDescription} onChange={e=>setJobDescription(e.target.value)} placeholder="Paste the job description here..." rows={5} style={{width:"100%",padding:"11px 14px",border:"1.5px solid #1A5A2A",borderRadius:10,fontSize:13,color:"#FFFFFF",background:"#0D3A1A",outline:"none",fontFamily:"inherit",resize:"vertical"}}/>
                      </div>
                    </div>
                    {rewriteError && <div style={{background:"rgba(163,45,45,0.2)",border:"1px solid #A32D2D",borderRadius:10,padding:"10px 16px",fontSize:13,color:"#F09595",marginBottom:16}}>{rewriteError}</div>}
                    <div style={{display:"flex",gap:10}}>
                      <button onClick={handleRewrite} disabled={rewriting} style={{background:"#C8E600",color:"#052A14",fontSize:14,fontWeight:800,padding:"12px 28px",borderRadius:99,border:"none",cursor:rewriting?"default":"pointer",opacity:rewriting?0.7:1}}>
                        {rewriting ? 'Rewriting...' : 'Rewrite my CV now'}
                      </button>
                      <button onClick={()=>setShowRewrite(false)} style={{background:"transparent",color:"#5A9A6A",fontSize:13,fontWeight:600,padding:"12px 20px",borderRadius:99,border:"1px solid #1A5A2A",cursor:"pointer"}}>Cancel</button>
                    </div>
                    {rewriting && <div style={{marginTop:16,fontSize:13,color:"#5A9A6A",fontStyle:"italic"}}>AI is rewriting your CV... about 15 seconds.</div>}
                  </div>
                ) : (
                  <div style={{background:"#C8E600",borderRadius:14,padding:20,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:16}}>
                    <div>
                      <div style={{fontSize:15,fontWeight:800,color:"#052A14",marginBottom:4}}>Ready to rewrite your CV for any job</div>
                      <div style={{fontSize:12,color:"#2A5A14"}}>AI rewrites in 30 seconds. You have {freeRewrites} free rewrites.</div>
                    </div>
                    <button onClick={()=>setShowRewrite(true)} style={{background:"#052A14",color:"#C8E600",fontSize:13,fontWeight:800,padding:"10px 24px",borderRadius:99,border:"none",cursor:"pointer",whiteSpace:"nowrap"}}>
                      Rewrite my CV — free
                    </button>
                  </div>
                )}

                <div style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:14,padding:20,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
                  <div>
                    <div style={{fontSize:14,fontWeight:800,color:"#FFFFFF",marginBottom:4}}>Unlock Pro — all doors open</div>
                    <div style={{fontSize:12,color:"#5A9A6A"}}>Unlimited rewrites. Auto-apply. Cover letters. {currency === 'ZAR' ? 'R370' : '$20'}/month.</div>
                  </div>
                  <button
                    onClick={() => handlePayment('pro')}
                    disabled={paying}
                    style={{background:"#C8E600",color:"#052A14",fontSize:13,fontWeight:800,padding:"10px 24px",borderRadius:99,border:"none",cursor:paying?"default":"pointer",opacity:paying?0.7:1}}>
                    {paying ? 'Loading...' : 'Upgrade to Pro'}
                  </button>
                </div>
                {paymentError && (
                  <div style={{background:"rgba(163,45,45,0.2)",border:"1px solid #A32D2D",borderRadius:10,padding:"10px 16px",fontSize:13,color:"#F09595",marginTop:12}}>
                    {paymentError}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
