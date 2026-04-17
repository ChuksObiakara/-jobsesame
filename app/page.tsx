'use client';
import { useEffect, useState } from 'react';
import { useAuth, UserButton } from '@clerk/nextjs';

export default function Home() {
  const { isSignedIn } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [currency, setCurrency] = useState<'ZAR' | 'USD'>('ZAR');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(data => { if (data.country_code !== 'ZA') setCurrency('USD'); })
      .catch(() => {});
  }, []);

  const LogoMark = () => (
    <a href="/" style={{display:"flex",alignItems:"center",gap:11,textDecoration:"none"}}>
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
    </a>
  );

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({behavior:'smooth'});
    setMenuOpen(false);
  };

  const faqs = [
    {
      q: "Is Jobsesame really free?",
      a: "Yes — you get 3 free AI CV rewrites and Quick Apply credits with no credit card required. After your free credits you can buy a pack of 10 for R185 or go unlimited with Pro at R370 per month.",
    },
    {
      q: "How does the AI rewrite my CV?",
      a: "You upload your CV once. When you click Quick Apply on any job our AI reads the full job description and rewrites your CV in 30 seconds to match exactly what that employer is looking for — adding the right keywords, restructuring your experience, and optimising for ATS systems.",
    },
    {
      q: "What is an ATS system?",
      a: "ATS stands for Applicant Tracking System. It is software that most companies use to automatically screen CVs before a human ever sees them. 8 out of 10 CVs are rejected by ATS. Jobsesame rewrites your CV to pass these systems automatically.",
    },
    {
      q: "Will my real experience and company names be changed?",
      a: "Never. We only rewrite how your experience is described — not the facts. Your real company names, job titles, dates and qualifications are always preserved. We just make them sound better and add the right keywords.",
    },
    {
      q: "What jobs does Jobsesame have?",
      a: "We aggregate jobs from multiple sources worldwide including remote jobs, relocation opportunities to London Dubai Toronto Singapore, teaching jobs in Asia, and local jobs in South Africa Nigeria and Kenya. New jobs are added daily.",
    },
    {
      q: "How is Jobsesame different from LinkedIn or Indeed?",
      a: "LinkedIn and Indeed are job boards — they just show you jobs. Jobsesame is an AI job application assistant. We help you actually get the job by rewriting your CV, applying automatically, and tracking everything. We also show jobs from multiple platforms in one place.",
    },
    {
      q: "Is my CV data safe?",
      a: "Yes. Your CV is processed securely and never sold to third parties. We use it only to help you apply for jobs. You can delete your data at any time.",
    },
    {
      q: "Does Quick Apply actually submit my application?",
      a: "For jobs that accept direct applications yes — we submit automatically. For jobs on platforms like LinkedIn that require a login we download your rewritten CV and open the employer portal so you can upload it in one click.",
    },
  ];

  return (
    <main style={{fontFamily:"'Plus Jakarta Sans',sans-serif",background:"#fff",margin:0,padding:0}}>
      <style>{`
        @keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
        @keyframes pulseDot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.5)}}
        @keyframes floatUp{0%,100%{transform:translateY(0px)}50%{transform:translateY(-8px)}}
        @keyframes faqSlide{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* NAV */}
      <nav style={{background:"#052A14",padding:"0 24px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 20px rgba(0,0,0,0.3)"}}>
        <LogoMark />
        <div style={{display:"flex",gap:16,alignItems:"center"}}>
          {!isMobile && isSignedIn && <>
            <a href="/jobs" style={{fontSize:13,color:"#A8D8B0",fontWeight:600,textDecoration:"none"}}>Find Jobs</a>
            <a href="/optimise" style={{fontSize:13,color:"#A8D8B0",fontWeight:600,textDecoration:"none"}}>CV Optimiser</a>
            <a href="/dashboard" style={{fontSize:13,color:"#A8D8B0",fontWeight:600,textDecoration:"none"}}>Dashboard</a>
          </>}
          {!isMobile && !isSignedIn && <>
            <button onClick={()=>scrollTo('how-it-works')} style={{background:"transparent",border:"none",fontSize:13,color:"#A8D8B0",fontWeight:600,cursor:"pointer"}}>How it works</button>
            <button onClick={()=>scrollTo('pricing')} style={{background:"transparent",border:"none",fontSize:13,color:"#A8D8B0",fontWeight:600,cursor:"pointer"}}>Pricing</button>
            <a href="/sign-in" style={{fontSize:13,color:"#A8D8B0",fontWeight:600,textDecoration:"none"}}>Sign in</a>
          </>}
          {isSignedIn
            ? <UserButton afterSignOutUrl="/" />
            : <a href="/sign-up" style={{background:"#C8E600",color:"#052A14",fontSize:13,fontWeight:800,padding:"9px 22px",borderRadius:99,textDecoration:"none",whiteSpace:"nowrap"}}>Get Started</a>
          }
          {isMobile && (
            <button onClick={()=>setMenuOpen(!menuOpen)} style={{background:"transparent",border:"none",color:"#C8E600",fontSize:24,cursor:"pointer",padding:"4px",lineHeight:1,display:"flex",alignItems:"center"}}>
              {menuOpen ? '✕' : '☰'}
            </button>
          )}
        </div>
      </nav>

      {/* MOBILE MENU */}
      {isMobile && menuOpen && (
        <div style={{position:"fixed",top:64,left:0,right:0,background:"#052A14",zIndex:99,borderTop:"1px solid #1A5A2A",padding:"20px 24px",display:"flex",flexDirection:"column",gap:20,boxShadow:"0 8px 32px rgba(0,0,0,0.4)"}}>
          {isSignedIn ? <>
            <a href="/jobs" onClick={()=>setMenuOpen(false)} style={{fontSize:16,color:"#A8D8B0",fontWeight:600,textDecoration:"none"}}>Find Jobs</a>
            <a href="/optimise" onClick={()=>setMenuOpen(false)} style={{fontSize:16,color:"#A8D8B0",fontWeight:600,textDecoration:"none"}}>CV Optimiser</a>
            <a href="/dashboard" onClick={()=>setMenuOpen(false)} style={{fontSize:16,color:"#A8D8B0",fontWeight:600,textDecoration:"none"}}>Dashboard</a>
          </> : <>
            <button onClick={()=>scrollTo('how-it-works')} style={{background:"transparent",border:"none",fontSize:16,color:"#A8D8B0",fontWeight:600,textAlign:"left",cursor:"pointer",padding:0}}>How it works</button>
            <button onClick={()=>scrollTo('pricing')} style={{background:"transparent",border:"none",fontSize:16,color:"#A8D8B0",fontWeight:600,textAlign:"left",cursor:"pointer",padding:0}}>Pricing</button>
            <a href="/sign-in" onClick={()=>setMenuOpen(false)} style={{fontSize:16,color:"#A8D8B0",fontWeight:600,textDecoration:"none"}}>Sign in</a>
            <a href="/sign-up" onClick={()=>setMenuOpen(false)} style={{background:"#C8E600",color:"#052A14",fontSize:14,fontWeight:800,padding:"12px 24px",borderRadius:99,textDecoration:"none",textAlign:"center"}}>Get Started — free</a>
          </>}
        </div>
      )}

      {/* HERO */}
      <section style={{background:"#052A14",padding:isMobile?"48px 20px 56px":"88px 28px 80px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:"40%",left:"50%",transform:"translate(-50%,-50%)",width:800,height:800,background:"radial-gradient(circle,rgba(200,230,0,0.06) 0%,transparent 65%)",pointerEvents:"none"}} />

        {/* Trust badge with shimmer */}
        <div style={{display:"flex",justifyContent:"center",marginBottom:44}}>
          <div style={{
            display:"inline-flex",alignItems:"center",gap:8,
            border:"1.5px solid rgba(200,230,0,0.35)",borderRadius:99,padding:"8px 22px",
            background:"linear-gradient(90deg,rgba(200,230,0,0.08) 0%,rgba(200,230,0,0.22) 30%,rgba(200,230,0,0.08) 60%,rgba(200,230,0,0.22) 90%,rgba(200,230,0,0.08) 100%)",
            backgroundSize:"200% auto",
            animation:"shimmer 3s linear infinite",
          }}>
            <span style={{color:"#C8E600",fontSize:12,fontWeight:700,letterSpacing:"0.3px"}}>✦ 1,200+ users · 740+ job applications submitted</span>
          </div>
        </div>

        {/* Two-column grid */}
        <div style={{
          maxWidth:1100,margin:"0 auto",
          display:isMobile?"flex":"grid",
          gridTemplateColumns:isMobile?undefined:"1fr 1fr",
          flexDirection:isMobile?"column":undefined,
          gap:isMobile?44:64,
          alignItems:"center",
          position:"relative",
          zIndex:1,
        }}>

          {/* LEFT COLUMN */}
          <div style={{textAlign:isMobile?"center":"left"}}>
            <h1 style={{fontSize:isMobile?30:54,fontWeight:800,color:"#FFFFFF",lineHeight:1.07,letterSpacing:-1.5,marginBottom:20}}>
              Your CV is losing<br/>you jobs.<br/>
              <span style={{color:"#C8E600"}}>We fix that in 30 seconds.</span>
            </h1>
            <p style={{fontSize:isMobile?15:18,color:"#90C898",lineHeight:1.75,marginBottom:36,maxWidth:480}}>
              AI rewrites your CV for every job you apply to. Beat ATS filters. Get seen. Get hired.
            </p>

            {/* CTAs */}
            <div style={{display:"flex",gap:12,flexWrap:"wrap",justifyContent:isMobile?"center":"flex-start",marginBottom:24}}>
              <a href="/sign-up" style={{
                background:"#C8E600",color:"#052A14",fontSize:15,fontWeight:800,
                padding:"16px 36px",borderRadius:99,textDecoration:"none",
                display:"inline-block",boxShadow:"0 4px 28px rgba(200,230,0,0.35)",
                whiteSpace:"nowrap",
              }}>
                Get hired faster — it&apos;s free
              </a>
              <button onClick={()=>scrollTo('how-it-works')} style={{
                background:"transparent",color:"#C8E600",fontSize:15,fontWeight:500,
                padding:"16px 28px",borderRadius:99,
                border:"1.5px solid rgba(200,230,0,0.4)",cursor:"pointer",
                whiteSpace:"nowrap",
              }}>
                Watch how it works →
              </button>
            </div>

            {/* Mini trust signals */}
            <div style={{display:"flex",gap:20,flexWrap:"wrap",justifyContent:isMobile?"center":"flex-start"}}>
              {["✓ No credit card needed","✓ 3 free applications","✓ Cancel anytime"].map(t=>(
                <span key={t} style={{fontSize:12,color:"#5A9A6A",fontWeight:600}}>{t}</span>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN — floating AI card */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>

            {/* Main card */}
            <div style={{
              background:"#fff",borderRadius:20,padding:"22px 24px",
              boxShadow:"0 28px 72px rgba(0,0,0,0.55)",
              width:"100%",maxWidth:340,
              animation:"floatUp 4s ease-in-out infinite",
            }}>
              {/* Header row */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                <span style={{fontSize:11,color:"#888",fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase"}}>AI Match Analysis</span>
                <span style={{display:"flex",alignItems:"center",gap:5,background:"#EAF5EA",color:"#1A7A3A",fontSize:10,fontWeight:700,padding:"3px 9px",borderRadius:99}}>
                  <span style={{width:6,height:6,background:"#2A9A4A",borderRadius:"50%",display:"inline-block",animation:"pulseDot 1.5s ease-in-out infinite"}}></span>
                  Live
                </span>
              </div>

              {/* Gauge + details */}
              <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:16}}>
                <div style={{position:"relative",width:84,height:84,flexShrink:0}}>
                  <svg width="84" height="84" style={{transform:"rotate(-90deg)"}}>
                    <circle cx="42" cy="42" r="34" fill="none" stroke="#052A14" strokeWidth="8"/>
                    <circle cx="42" cy="42" r="34" fill="none" stroke="#C8E600" strokeWidth="8"
                      strokeDasharray={`${2*Math.PI*34}`}
                      strokeDashoffset={`${2*Math.PI*34*(1-0.94)}`}
                      strokeLinecap="round"/>
                  </svg>
                  <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    <span style={{fontSize:18,fontWeight:800,color:"#C8E600"}}>94%</span>
                  </div>
                </div>
                <div>
                  <div style={{fontSize:16,fontWeight:800,color:"#052A14",marginBottom:4}}>Excellent Match</div>
                  <div style={{fontSize:13,color:"#333",fontWeight:600,marginBottom:2}}>Senior Product Manager</div>
                  <div style={{fontSize:12,color:"#888"}}>📍 London, UK</div>
                </div>
              </div>

              {/* Keywords */}
              <div style={{marginBottom:14}}>
                <div style={{fontSize:10,color:"#888",fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:6}}>Keywords added</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {["Agile","Stakeholder Management","P&L","OKRs","Product Strategy"].map(kw=>(
                    <span key={kw} style={{background:"#EAF5EA",color:"#1A5A2A",fontSize:10,padding:"3px 9px",borderRadius:99,fontWeight:700}}>{kw}</span>
                  ))}
                </div>
              </div>

              <div style={{background:"#C8E600",borderRadius:10,padding:"11px 14px",fontSize:13,fontWeight:800,color:"#052A14",textAlign:"center",cursor:"pointer"}}>
                ⚡ Apply in 10 seconds
              </div>
            </div>

            {/* Floating mini cards */}
            <div style={{display:"flex",gap:10,width:"100%",maxWidth:340,flexWrap:"wrap"}}>
              <div style={{
                background:"#fff",borderRadius:14,padding:"10px 14px",
                boxShadow:"0 6px 24px rgba(0,0,0,0.22)",
                display:"flex",alignItems:"center",gap:10,
                flex:1,minWidth:0,
              }}>
                <img
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=b6e3f4"
                  width={32} height={32}
                  style={{borderRadius:"50%",border:"2px solid #C8E600",flexShrink:0}}
                  alt="Sarah M."
                />
                <span style={{fontSize:11,color:"#052A14",fontWeight:600,lineHeight:1.3}}>
                  Sarah M. — Just got hired as Marketing Director 🎉
                </span>
              </div>
              <div style={{
                background:"#fff",borderRadius:14,padding:"10px 14px",
                boxShadow:"0 6px 24px rgba(0,0,0,0.22)",
                display:"flex",alignItems:"center",gap:8,
                flex:1,minWidth:0,
              }}>
                <span style={{fontSize:18,flexShrink:0}}>🔥</span>
                <span style={{fontSize:11,color:"#052A14",fontWeight:600,lineHeight:1.3}}>
                  47 people applied using Jobsesame today
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM SECTION */}
      <section style={{background:"#08150D",padding:isMobile?"52px 20px":"72px 28px",textAlign:"center"}}>
        <div style={{maxWidth:760,margin:"0 auto"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(163,45,45,0.15)",border:"1.5px solid rgba(163,45,45,0.4)",borderRadius:99,padding:"5px 16px",fontSize:11,color:"#F09595",fontWeight:700,marginBottom:24,letterSpacing:"1px",textTransform:"uppercase"}}>
            THE PROBLEM
          </div>
          <h2 style={{fontSize:isMobile?26:42,fontWeight:800,color:"#FFFFFF",lineHeight:1.1,letterSpacing:-1,marginBottom:16}}>
            Applying for jobs<br/>is <span style={{color:"#F09595",fontStyle:"italic"}}>broken.</span>
          </h2>
          <p style={{fontSize:isMobile?14:16,color:"#5A9A6A",lineHeight:1.75,marginBottom:48,maxWidth:520,margin:"0 auto 48px"}}>
            The system is rigged against you. Recruiters never even see your CV. You are competing against automated filters — and losing.
          </p>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:16}}>
            {[
              {icon:"⏰",stat:"40+ hours",title:"Wasted every month",desc:"You spend 40+ hours manually tailoring CVs, writing cover letters, and filling identical forms — for jobs that auto-reject you anyway."},
              {icon:"🤖",stat:"80% rejected",title:"Before a human sees it",desc:"8 out of 10 CVs are killed by ATS robots before any human reads them. One missing keyword and you disappear from the process entirely."},
              {icon:"😔",stat:"50 applications",title:"2 replies. 0 interviews.",desc:"You apply to 50 jobs and hear silence. Not because you're not qualified — because your CV was never optimised for their systems."},
            ].map(p=>(
              <div key={p.title} style={{background:"rgba(255,255,255,0.04)",border:"1.5px solid rgba(255,255,255,0.07)",borderRadius:16,padding:24,textAlign:"left"}}>
                <div style={{fontSize:32,marginBottom:12}}>{p.icon}</div>
                <div style={{fontSize:28,fontWeight:800,color:"#F09595",marginBottom:4}}>{p.stat}</div>
                <div style={{fontSize:14,fontWeight:700,color:"#FFFFFF",marginBottom:8}}>{p.title}</div>
                <div style={{fontSize:13,color:"#4A7A5A",lineHeight:1.7}}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOLUTION SECTION */}
      <section style={{background:"#fff",padding:isMobile?"52px 20px":"72px 28px",textAlign:"center"}}>
        <div style={{maxWidth:760,margin:"0 auto"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"#EAF5EA",border:"1.5px solid #90C898",borderRadius:99,padding:"5px 16px",fontSize:11,color:"#1A7A3A",fontWeight:700,marginBottom:24,letterSpacing:"1px",textTransform:"uppercase"}}>
            THE SOLUTION
          </div>
          <h2 style={{fontSize:isMobile?26:42,fontWeight:800,color:"#052A14",lineHeight:1.1,letterSpacing:-1,marginBottom:16}}>
            One upload.<br/><span style={{color:"#1A7A3A"}}>AI does the rest.</span>
          </h2>
          <p style={{fontSize:isMobile?14:16,color:"#5A7A5A",lineHeight:1.8,marginBottom:48,maxWidth:520,margin:"0 auto 48px"}}>
            Upload your CV once. Jobsesame reads your entire career history, finds your best matches from 495,000+ live jobs worldwide, tailors your CV perfectly for each role, and applies — all in seconds.
          </p>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,1fr)",gap:16,textAlign:"left"}}>
            {[
              {icon:"📄",title:"Upload your CV once",desc:"One upload and you never fill another form. AI extracts every skill, achievement and experience from your PDF instantly."},
              {icon:"🧠",title:"AI reads your entire profile",desc:"Not just your job titles — your actual skills, achievements, patterns. AI builds a rich career profile that gets sharper over time."},
              {icon:"🎯",title:"Matches you to jobs worldwide",desc:"495,000+ live jobs across 180+ countries. AI ranks them by match percentage so you see the best opportunities first."},
              {icon:"⚡",title:"Applies while you sleep",desc:"AI rewrites your CV for each role in 30 seconds, optimises it for their ATS, and applies automatically. Wake up to interview requests."},
            ].map(s=>(
              <div key={s.title} style={{background:"#F4FCF4",border:"1.5px solid #D8EED8",borderRadius:16,padding:24,display:"flex",gap:16,alignItems:"flex-start"}}>
                <div style={{fontSize:28,flexShrink:0}}>{s.icon}</div>
                <div>
                  <div style={{fontSize:15,fontWeight:800,color:"#052A14",marginBottom:6}}>{s.title}</div>
                  <div style={{fontSize:13,color:"#4A7A5A",lineHeight:1.7}}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{background:"#052A14",padding:isMobile?"52px 20px":"72px 28px"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <p style={{fontSize:11,fontWeight:700,color:"#C8E600",letterSpacing:"2.5px",textTransform:"uppercase",textAlign:"center",marginBottom:10}}>Features</p>
          <h2 style={{fontSize:isMobile?24:36,fontWeight:800,color:"#FFFFFF",textAlign:"center",marginBottom:12,letterSpacing:-0.5}}>
            Everything you need to get hired faster
          </h2>
          <p style={{fontSize:14,color:"#4A8A5A",textAlign:"center",marginBottom:44,maxWidth:480,margin:"0 auto 44px"}}>
            One platform. Every tool an ambitious job seeker needs.
          </p>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,1fr)",gap:14}}>
            {[
              {icon:"🧬",title:"AI CV Tailoring",badge:"Core feature",desc:"Upload once. AI reads your full career history and rewrites your CV specifically for every job you apply to — matching tone, keywords and requirements.",color:"#C8E600"},
              {icon:"🔍",title:"ATS Optimisation",badge:"Beat the robots",desc:"Our AI knows exactly what ATS systems filter on. Every CV you send scores 90%+ match — so you skip the robot and land in a human's inbox.",color:"#90C898"},
              {icon:"🌍",title:"Job Aggregation — 495,000+ roles",badge:"Global reach",desc:"All Jobs, Remote, Relocation, Teaching abroad and African jobs — all in one place. Updated live. Filtered by your profile automatically.",color:"#A8D8B0"},
              {icon:"⚡",title:"Quick Apply in 10 seconds",badge:"Apply faster",desc:"One click. AI tailors your CV, writes your cover letter, and sends the application. Fully automated. No forms, no copy-paste, no wasted time.",color:"#C8E600"},
            ].map(f=>(
              <div key={f.title} style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:18,padding:28}}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                  <div style={{fontSize:32}}>{f.icon}</div>
                  <div>
                    <div style={{fontSize:16,fontWeight:800,color:"#FFFFFF"}}>{f.title}</div>
                    <div style={{fontSize:10,color:f.color,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginTop:2}}>{f.badge}</div>
                  </div>
                </div>
                <p style={{fontSize:13,color:"#4A8A5A",lineHeight:1.8,margin:0}}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" style={{background:"#F4FCF4",padding:isMobile?"52px 20px":"72px 28px"}}>
        <div style={{maxWidth:860,margin:"0 auto"}}>
          <p style={{fontSize:11,fontWeight:700,color:"#1A7A3A",letterSpacing:"2.5px",textTransform:"uppercase",textAlign:"center",marginBottom:10}}>How it works</p>
          <h2 style={{fontSize:isMobile?24:36,fontWeight:800,color:"#052A14",textAlign:"center",marginBottom:12,letterSpacing:-0.5}}>
            Three steps to <em style={{color:"#1A7A3A",fontStyle:"italic"}}>open every door</em>
          </h2>
          <p style={{fontSize:14,color:"#4A7A5A",textAlign:"center",marginBottom:52,fontStyle:"italic"}}>
            &ldquo;Upload once. Let AI do the rest. Get hired.&rdquo;
          </p>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:20,position:"relative"}}>
            {[
              {n:"1",title:"Upload your CV once",desc:"Drag and drop your PDF CV. AI reads everything — skills, experience, achievements — in seconds. Your profile is built instantly. Never fill another form."},
              {n:"2",title:"AI matches and tailors for each job",desc:"AI browses 495,000+ live jobs and finds your top matches. For each one, it rewrites your CV specifically for that role — keywords, tone, ATS optimised."},
              {n:"3",title:"Apply in one click",desc:"Hit Quick Apply. Your perfectly tailored CV goes directly to the employer. Or use Auto-Apply to apply to 50 jobs while you sleep."},
            ].map((s,i)=>(
              <div key={s.n} style={{background:"#fff",border:"1.5px solid #D8EED8",borderRadius:18,padding:28,position:"relative"}}>
                <div style={{width:36,height:36,background:"#C8E600",color:"#052A14",fontSize:15,fontWeight:800,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16}}>{s.n}</div>
                <div style={{fontSize:16,fontWeight:800,color:"#052A14",marginBottom:10}}>{s.title}</div>
                <div style={{fontSize:13,color:"#5A7A5A",lineHeight:1.75}}>{s.desc}</div>
                {i < 2 && !isMobile && (
                  <div style={{position:"absolute",right:-24,top:"50%",transform:"translateY(-50%)",fontSize:20,color:"#D8EED8",zIndex:2}}>→</div>
                )}
              </div>
            ))}
          </div>
          <div style={{textAlign:"center",marginTop:40}}>
            <a href="/sign-up" style={{background:"#052A14",color:"#C8E600",fontSize:15,fontWeight:800,padding:"15px 38px",borderRadius:99,textDecoration:"none",display:"inline-block"}}>
              Start for free — no card needed
            </a>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <div style={{background:"#C8E600",padding:isMobile?"20px":"16px 28px"}}>
        <div style={{display:isMobile?"grid":"flex",gridTemplateColumns:isMobile?"1fr 1fr":undefined,gap:isMobile?"12px 8px":0,alignItems:"center",justifyContent:"center",maxWidth:900,margin:"0 auto",flexWrap:"wrap"}}>
          {[
            {val:"495,000+",label:"Live jobs"},
            {val:"180+",label:"Countries"},
            {val:"30 sec",label:"CV rewrite"},
            {val:"94%",label:"Avg ATS score"},
          ].map((s,i)=>(
            <div key={s.label} style={{
              textAlign:"center",flex:1,padding:isMobile?"8px 4px":"12px 24px",
              borderRight:!isMobile&&i<3?"1px solid rgba(5,42,20,0.2)":undefined,
            }}>
              <div style={{fontSize:isMobile?22:28,fontWeight:800,color:"#052A14",lineHeight:1}}>{s.val}</div>
              <div style={{fontSize:11,color:"#2A5A14",fontWeight:600,marginTop:3,textTransform:"uppercase",letterSpacing:"1px"}}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TESTIMONIALS */}
      <section style={{background:"#fff",padding:isMobile?"52px 20px":"72px 28px"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <p style={{fontSize:11,fontWeight:700,color:"#1A7A3A",letterSpacing:"2.5px",textTransform:"uppercase",textAlign:"center",marginBottom:10}}>Success stories</p>
          <h2 style={{fontSize:isMobile?24:36,fontWeight:800,color:"#052A14",textAlign:"center",marginBottom:12,letterSpacing:-0.5}}>
            Real people. <span style={{color:"#1A7A3A"}}>Real doors opened.</span>
          </h2>
          <p style={{fontSize:14,color:"#4A7A5A",textAlign:"center",marginBottom:44,maxWidth:440,margin:"0 auto 44px"}}>
            From Johannesburg to London. From silence to offers.
          </p>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,1fr)",gap:16}}>
            {[
              {name:"Thabo Nkosi",seed:"ThaboNkosi",location:"Johannesburg → Standard Bank",quote:"4 months of silence. Jobsesame rewrote my CV and Standard Bank called me within 3 days. My ATS score went from 31% to 94%. The door I thought was locked — was never locked at all."},
              {name:"Chioma Okafor",seed:"ChiomaOkafor",location:"Lagos → Marketing Manager",quote:"Got 12 interviews in 30 days. Jobsesame found keywords I had no idea I was missing. My match score jumped 60 points. Now earning 3× what I made before."},
              {name:"Brian Otieno",seed:"BrianOtieno",location:"Nairobi → Software Developer",quote:"Quick Apply sent 23 applications while I slept. Woke up to 4 recruiter calls. My new salary is 40% higher. Nothing has ever changed my life this fast."},
              {name:"Amara Diallo",seed:"AmaraDiallo",location:"Dakar → London, UK",quote:"I never thought I could work in London. Jobsesame matched me to a relocation job, rewrote my CV for UK employers, and I had an offer in 9 days. I am living in London now."},
            ].map(t=>(
              <div key={t.name} style={{background:"#F9FFF4",border:"1.5px solid #D8EED8",borderRadius:16,padding:24}}>
                <div style={{display:"inline-flex",gap:1,marginBottom:12}}>
                  {[1,2,3,4,5].map(n=>(
                    <span key={n} style={{color:"#C8E600",fontSize:14}}>★</span>
                  ))}
                </div>
                <p style={{fontSize:14,color:"#2A4A2A",lineHeight:1.75,fontStyle:"italic",marginBottom:18}}>
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${t.seed}&backgroundColor=052A14`}
                    width={44} height={44}
                    style={{borderRadius:"50%",background:"#052A14",flexShrink:0,border:"2px solid #C8E600"}}
                    alt={t.name}
                  />
                  <div>
                    <div style={{fontSize:14,fontWeight:800,color:"#052A14"}}>{t.name}</div>
                    <div style={{fontSize:12,color:"#1A7A3A",fontWeight:600}}>{t.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{background:"#F4FCF4",padding:isMobile?"52px 20px":"72px 28px"}}>
        <div style={{maxWidth:860,margin:"0 auto"}}>
          <p style={{fontSize:11,fontWeight:700,color:"#1A7A3A",letterSpacing:"2.5px",textTransform:"uppercase",textAlign:"center",marginBottom:10}}>Pricing</p>
          <h2 style={{fontSize:isMobile?24:36,fontWeight:800,color:"#052A14",textAlign:"center",marginBottom:12,letterSpacing:-0.5}}>
            Start free. Scale when you&apos;re ready.
          </h2>
          <p style={{fontSize:14,color:"#4A7A5A",textAlign:"center",marginBottom:44,fontStyle:"italic"}}>
            &ldquo;The right key to your future should not cost a fortune.&rdquo;
          </p>
          <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:14}}>
            {[
              {
                name:"Free",price:"R0",usdPrice:"$0",per:"/always",desc:"Get started instantly.",
                features:["3 AI-powered applications","CV analysed by AI","ATS score included","Browse all 495,000+ jobs","No card needed"],
                popular:false,btn:"Start free",href:"/sign-up",
              },
              {
                name:"Credits",price:"R185",usdPrice:"$10",per:"/pack",desc:"Pay as you go.",
                features:["10 Quick Apply credits","Credits never expire","AI CV rewrite for each job","Cover letter generation","All job categories"],
                popular:false,btn:"Get 10 credits",href:"/sign-up",
              },
              {
                name:"Pro",price:"R370",usdPrice:"$20",per:"/month",desc:"For serious job seekers.",
                features:["Unlimited Quick Apply","Unlimited CV rewrites","Auto-apply while you sleep","Cover letters included","Priority support"],
                popular:true,btn:"Unlock Pro",href:"/sign-up",
              },
            ].map(p=>(
              <div key={p.name} style={{
                background:p.popular?"#052A14":"#fff",
                border:`1.5px solid ${p.popular?"#C8E600":"#D8EED8"}`,
                borderRadius:18,padding:28,position:"relative",
              }}>
                {p.popular && (
                  <div style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",background:"#C8E600",color:"#052A14",fontSize:10,fontWeight:800,padding:"3px 14px",borderRadius:99,whiteSpace:"nowrap"}}>
                    Most popular
                  </div>
                )}
                <div style={{fontSize:14,fontWeight:700,color:p.popular?"#90C898":"#6A8A6A",marginBottom:4}}>{p.name}</div>
                <div style={{fontSize:34,fontWeight:800,color:p.popular?"#C8E600":"#052A14",marginBottom:2,lineHeight:1}}>
                  {currency==='ZAR'?p.price:p.usdPrice}
                  <span style={{fontSize:14,fontWeight:400,color:p.popular?"#5A9A6A":"#888"}}>{p.per}</span>
                </div>
                <div style={{fontSize:13,color:p.popular?"#5A9A6A":"#888",marginBottom:20}}>{p.desc}</div>
                <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:24}}>
                  {p.features.map(f=>(
                    <div key={f} style={{display:"flex",alignItems:"flex-start",gap:8,fontSize:13,color:p.popular?"#A8D8B0":"#4A7A5A"}}>
                      <svg width="16" height="16" viewBox="0 0 16 16" style={{flexShrink:0,marginTop:1}}>
                        <circle cx="8" cy="8" r="7" fill={p.popular?"#1A5A2A":"#EAF5EA"}/>
                        <path d="M5 8L7 10.5L11 5.5" stroke={p.popular?"#C8E600":"#1A7A3A"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {f}
                    </div>
                  ))}
                </div>
                <a href={p.href} style={{
                  display:"block",background:p.popular?"#C8E600":"#052A14",
                  color:p.popular?"#052A14":"#C8E600",
                  fontSize:14,fontWeight:800,padding:"12px 0",
                  borderRadius:99,textDecoration:"none",textAlign:"center",
                }}>
                  {p.btn}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section style={{background:"#052A14",padding:isMobile?"60px 20px":"88px 28px",textAlign:"center"}}>
        <div style={{maxWidth:640,margin:"0 auto"}}>
          <div style={{fontSize:isMobile?32:48,marginBottom:20}}>🚀</div>
          <h2 style={{fontSize:isMobile?26:44,fontWeight:800,color:"#C8E600",lineHeight:1.1,letterSpacing:-1,marginBottom:16}}>
            Your next job is waiting.
          </h2>
          <p style={{fontSize:isMobile?15:18,color:"#90C898",lineHeight:1.7,marginBottom:36}}>
            Stop applying manually. Stop getting ignored. Let AI open every door for you — starting right now.
          </p>
          <a href="/sign-up" style={{
            background:"#C8E600",color:"#052A14",
            fontSize:isMobile?15:17,fontWeight:800,
            padding:"17px 44px",borderRadius:99,
            textDecoration:"none",display:"inline-block",
            boxShadow:"0 8px 32px rgba(200,230,0,0.25)",
          }}>
            Open your future — free
          </a>
          <div style={{display:"flex",gap:24,justifyContent:"center",marginTop:24,flexWrap:"wrap"}}>
            {["3 free applications","No card needed","30 second setup"].map(t=>(
              <div key={t} style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:"#5A9A6A"}}>
                <span style={{color:"#C8E600"}}>✓</span>{t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{background:"#052A14",padding:isMobile?"56px 20px":"80px 28px"}}>
        <div style={{maxWidth:720,margin:"0 auto"}}>
          <p style={{fontSize:11,fontWeight:700,color:"#C8E600",letterSpacing:"2.5px",textTransform:"uppercase",textAlign:"center",marginBottom:10}}>FAQ</p>
          <h2 style={{fontSize:isMobile?26:38,fontWeight:800,color:"#FFFFFF",textAlign:"center",marginBottom:10,letterSpacing:-0.5}}>
            Everything you need to know
          </h2>
          <p style={{fontSize:isMobile?14:16,color:"#5A9A6A",textAlign:"center",marginBottom:48}}>
            Got questions? We have answers.
          </p>

          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {faqs.map((faq,i)=>(
              <div key={i} style={{
                background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:14,
                overflow:"hidden",
                transition:"border-color 0.2s",
                ...(openFaq===i?{borderColor:"rgba(200,230,0,0.4)"}:{}),
              }}>
                <button
                  onClick={()=>setOpenFaq(openFaq===i?null:i)}
                  style={{
                    width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",
                    padding:"18px 22px",background:"transparent",border:"none",cursor:"pointer",
                    textAlign:"left",gap:12,
                  }}
                >
                  <span style={{fontSize:isMobile?14:15,fontWeight:700,color:"#C8E600",lineHeight:1.4,flex:1}}>
                    {faq.q}
                  </span>
                  <span style={{
                    fontSize:20,color:"#C8E600",flexShrink:0,lineHeight:1,
                    transform:openFaq===i?"rotate(45deg)":"rotate(0deg)",
                    transition:"transform 0.2s",display:"inline-block",
                  }}>+</span>
                </button>
                {openFaq===i && (
                  <div style={{
                    padding:"0 22px 20px",
                    animation:"faqSlide 0.2s ease-out",
                  }}>
                    <div style={{height:1,background:"rgba(200,230,0,0.15)",marginBottom:16}} />
                    <p style={{fontSize:14,color:"#90C898",lineHeight:1.8,margin:0}}>
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{background:"#030F07",borderTop:"1px solid #0D3A18",padding:isMobile?"40px 20px 24px":"56px 28px 28px"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:40,marginBottom:44,flexDirection:isMobile?"column":"row"}}>
            <div style={{maxWidth:260}}>
              <div style={{fontSize:20,fontWeight:800,marginBottom:12}}>
                <span style={{color:"#FFFFFF"}}>job</span>
                <span style={{color:"#C8E600"}}>sesame</span>
              </div>
              <p style={{fontSize:13,color:"#2A5A3A",lineHeight:1.8,marginBottom:10}}>
                AI-powered job applications for professionals who refuse to be ignored. 495,000+ jobs. 180+ countries. One upload.
              </p>
              <p style={{fontSize:11,color:"#1A3A24",fontStyle:"italic"}}>&ldquo;Open sesame — your future awaits.&rdquo;</p>
            </div>
            <div style={{display:"flex",gap:56,flexWrap:"wrap"}}>
              <div>
                <div style={{fontSize:10,color:"#C8E600",fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:16}}>Platform</div>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <a href="/jobs" style={{fontSize:13,color:"#3A6A4A",textDecoration:"none",fontWeight:500}}>Find Jobs</a>
                  <a href="/optimise" style={{fontSize:13,color:"#3A6A4A",textDecoration:"none",fontWeight:500}}>CV Optimiser</a>
                  <a href="/dashboard" style={{fontSize:13,color:"#3A6A4A",textDecoration:"none",fontWeight:500}}>Dashboard</a>
                  <button onClick={()=>scrollTo('pricing')} style={{background:"transparent",border:"none",fontSize:13,color:"#3A6A4A",fontWeight:500,cursor:"pointer",textAlign:"left",padding:0}}>Pricing</button>
                </div>
              </div>
              <div>
                <div style={{fontSize:10,color:"#C8E600",fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:16}}>Company</div>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  <a href="/about" style={{fontSize:13,color:"#3A6A4A",textDecoration:"none",fontWeight:500}}>About</a>
                  <a href="/jobs" style={{fontSize:13,color:"#3A6A4A",textDecoration:"none",fontWeight:500}}>Jobs</a>
                  <a href="/privacy" style={{fontSize:13,color:"#3A6A4A",textDecoration:"none",fontWeight:500}}>Privacy</a>
                  <a href="/terms" style={{fontSize:13,color:"#3A6A4A",textDecoration:"none",fontWeight:500}}>Terms</a>
                  <a href="mailto:hello@jobsesame.co.za" style={{fontSize:13,color:"#3A6A4A",textDecoration:"none",fontWeight:500}}>Contact</a>
                </div>
              </div>
            </div>
          </div>
          <div style={{borderTop:"1px solid #0D3A18",paddingTop:20,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
            <span style={{fontSize:11,color:"#1A3A24"}}>© 2025 Jobsesame. All rights reserved.</span>
            <span style={{fontSize:11,color:"#1A3A24"}}>jobsesame.co.za</span>
          </div>
        </div>
      </footer>

    </main>
  );
}
