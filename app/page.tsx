'use client';
import { useEffect, useRef, useState } from 'react';
import { useAuth, UserButton } from '@clerk/nextjs';
import QuickApply, { isAutoApply } from './components/QuickApply';

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  category: string;
  level: string;
  salary?: string;
  type?: string;
}

export default function Home() {
  const { isSignedIn } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [total, setTotal] = useState(0);
  const [currency, setCurrency] = useState<'ZAR' | 'USD'>('USD');
  const [activeTab, setActiveTab] = useState<'all' | 'remote' | 'relocation' | 'teaching' | 'south-africa'>('all');
  const [africaCity, setAfricaCity] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const jobsSectionRef = useRef<HTMLDivElement>(null);
  const jobsFetchedRef = useRef(false);
  const [savedJobs, setSavedJobs] = useState<number[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jobsesame_saved_jobs');
      if (saved) return JSON.parse(saved).map((j: Job) => j.id);
    }
    return [];
  });

  const toggleSaveJob = (job: Job) => {
    const saved = localStorage.getItem('jobsesame_saved_jobs');
    const savedList: Job[] = saved ? JSON.parse(saved) : [];
    const isAlreadySaved = savedList.some(j => j.id === job.id);
    let updated: Job[];
    if (isAlreadySaved) {
      updated = savedList.filter(j => j.id !== job.id);
    } else {
      updated = [...savedList, job];
    }
    localStorage.setItem('jobsesame_saved_jobs', JSON.stringify(updated));
    setSavedJobs(updated.map(j => j.id));
  };

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(data => { if (data.country_code === 'ZA') setCurrency('ZAR'); })
      .catch(() => setCurrency('USD'));
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const fetchJobs = async (tab = 'all', searchQuery = '', loc = '') => {
    setLoading(true);
    try {
      let url = '';
      if (tab === 'remote') {
        url = `/api/remote?query=${encodeURIComponent(searchQuery || 'developer')}`;
      } else if (tab === 'relocation') {
        url = `/api/relocation?query=${encodeURIComponent(searchQuery || 'engineer')}`;
      } else if (tab === 'teaching') {
        url = `/api/teaching`;
      } else if (tab === 'south-africa') {
        const cityParam = africaCity ? `&location=${encodeURIComponent(africaCity)}` : '';
        url = `/api/africa?query=${encodeURIComponent(searchQuery || '')}${cityParam}`;
      } else {
        url = `/api/jobs?query=${encodeURIComponent(searchQuery || 'software engineer')}&location=${encodeURIComponent(loc)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setJobs(data.jobs || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
    setLoading(false);
  };

  // TASK 2 — lazy-load jobs via IntersectionObserver
  useEffect(() => {
    const el = jobsSectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !jobsFetchedRef.current) {
          jobsFetchedRef.current = true;
          fetchJobs('all');
        }
      },
      { rootMargin: '300px' } // start fetching 300px before the section scrolls into view
    );
    observer.observe(el);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // TASK 4 — redirect to dashboard if user just signed in
  useEffect(() => {
    if (isSignedIn && typeof document !== 'undefined' && document.referrer.includes('/sign-in')) {
      window.location.href = '/dashboard';
    }
  }, [isSignedIn]);

  const handleTabChange = (tab: 'all' | 'remote' | 'relocation' | 'teaching' | 'south-africa') => {
    setActiveTab(tab);
    fetchJobs(tab, query, location);
  };

  const handleAfricaCityChange = (city: string) => {
    setAfricaCity(city);
    // Re-fetch with new city filter
    setLoading(true);
    const cityParam = city ? `&location=${encodeURIComponent(city)}` : '';
    fetch(`/api/africa?query=${encodeURIComponent(query || '')}${cityParam}`)
      .then(r => r.json())
      .then(data => { setJobs(data.jobs || []); setTotal(data.total || 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs(activeTab, query, location);
  };

  const tabStyle = (tab: string) => ({
    padding: '10px 22px',
    borderRadius: 99,
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    border: 'none',
    background: activeTab === tab ? '#C8E600' : 'transparent',
    color: activeTab === tab ? '#052A14' : '#A8D8B0',
    transition: 'all 0.15s',
  } as React.CSSProperties);

  return (
    <main style={{fontFamily:"'Plus Jakarta Sans',sans-serif",background:"#fff",margin:0,padding:0}}>

      {/* QUICK APPLY MODAL */}
      {selectedJob && (
        <QuickApply
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          currency={currency}
        />
      )}

      {/* NAV */}
      <nav style={{background:"#052A14",padding:"0 24px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
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
        <div style={{display:"flex",gap:16,alignItems:"center"}}>
          {!isMobile && <>
            <a href="#jobs" style={{fontSize:13,color:"#A8D8B0",fontWeight:500,textDecoration:"none"}}>Find jobs</a>
            <a href="#pricing" style={{fontSize:13,color:"#A8D8B0",fontWeight:500,textDecoration:"none"}}>Pricing</a>
            {isSignedIn && <a href="/dashboard" style={{fontSize:13,color:"#A8D8B0",fontWeight:500,textDecoration:"none"}}>Dashboard</a>}
            {!isSignedIn && <a href="/sign-in" style={{fontSize:13,color:"#A8D8B0",fontWeight:500,textDecoration:"none"}}>Sign in</a>}
          </>}
          {isSignedIn
            ? <UserButton afterSignOutUrl="/" />
            : <a href="/sign-up" style={{background:"#C8E600",color:"#052A14",fontSize:13,fontWeight:800,padding:"9px 22px",borderRadius:99,textDecoration:"none",whiteSpace:"nowrap"}}>Start free</a>
          }
          {isMobile && (
            <button onClick={()=>setMenuOpen(!menuOpen)} style={{background:"transparent",border:"none",color:"#C8E600",fontSize:26,cursor:"pointer",padding:"4px",lineHeight:1,display:"flex",alignItems:"center"}}>
              {menuOpen ? '✕' : '☰'}
            </button>
          )}
        </div>
      </nav>
      {isMobile && menuOpen && (
        <div style={{position:"fixed",top:64,left:0,right:0,background:"#052A14",zIndex:99,borderTop:"1px solid #1A5A2A",padding:"20px 24px",display:"flex",flexDirection:"column",gap:20,boxShadow:"0 8px 32px rgba(0,0,0,0.4)"}}>
          <a href="#jobs" onClick={()=>setMenuOpen(false)} style={{fontSize:16,color:"#A8D8B0",fontWeight:600,textDecoration:"none"}}>Find jobs</a>
          <a href="#pricing" onClick={()=>setMenuOpen(false)} style={{fontSize:16,color:"#A8D8B0",fontWeight:600,textDecoration:"none"}}>Pricing</a>
          {isSignedIn
            ? <a href="/dashboard" onClick={()=>setMenuOpen(false)} style={{fontSize:16,color:"#A8D8B0",fontWeight:600,textDecoration:"none"}}>Dashboard</a>
            : <a href="/sign-in" onClick={()=>setMenuOpen(false)} style={{fontSize:16,color:"#A8D8B0",fontWeight:600,textDecoration:"none"}}>Sign in</a>
          }
          <a href="/sign-up" onClick={()=>setMenuOpen(false)} style={{background:"#C8E600",color:"#052A14",fontSize:14,fontWeight:800,padding:"12px 24px",borderRadius:99,textDecoration:"none",textAlign:"center"}}>Start free — no card needed</a>
        </div>
      )}

      {/* HERO */}
      <section style={{background:"#052A14",padding:isMobile?"32px 16px 40px":"64px 28px 56px",textAlign:"center",position:"relative",overflow:"hidden"}}>
        {!isMobile && (
          <>
            <div style={{position:"absolute",left:28,top:"50%",transform:"translateY(-60%)",background:"#ffffff",borderRadius:16,padding:"14px",boxShadow:"0 8px 32px rgba(0,0,0,0.35)",maxWidth:148,textAlign:"left",zIndex:2}}>
              <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400" style={{width:88,height:88,borderRadius:12,objectFit:"cover",display:"block",marginBottom:8}} alt="Hired" />
              <div style={{fontSize:11,fontWeight:800,color:"#052A14",marginBottom:2}}>Amara D.</div>
              <div style={{fontSize:10,fontWeight:700,color:"#1A7A3A"}}>✓ Just got hired</div>
              <div style={{fontSize:10,color:"#888",marginTop:2}}>Lagos → London</div>
            </div>
            <div style={{position:"absolute",right:28,top:"50%",transform:"translateY(-60%)",background:"#ffffff",borderRadius:16,padding:"14px",boxShadow:"0 8px 32px rgba(0,0,0,0.35)",maxWidth:148,textAlign:"left",zIndex:2}}>
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400" style={{width:88,height:88,borderRadius:12,objectFit:"cover",display:"block",marginBottom:8}} alt="Hired" />
              <div style={{fontSize:11,fontWeight:800,color:"#052A14",marginBottom:2}}>Thabo N.</div>
              <div style={{fontSize:10,fontWeight:700,color:"#1A7A3A"}}>✓ Just got hired</div>
              <div style={{fontSize:10,color:"#888",marginTop:2}}>Joburg → Standard Bank</div>
            </div>
          </>
        )}
        <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(200,230,0,0.12)",border:"1.5px solid #C8E600",borderRadius:99,padding:"6px 16px",fontSize:11,color:"#C8E600",fontWeight:700,marginBottom:24,letterSpacing:"0.8px"}}>
          <span style={{width:8,height:8,background:"#C8E600",borderRadius:"50%",display:"inline-block",flexShrink:0}}></span>
          AI-POWERED JOB APPLICATIONS FOR AFRICAN PROFESSIONALS
        </div>
        <h1 style={{fontSize:isMobile?26:46,fontWeight:800,color:"#FFFFFF",lineHeight:1.08,letterSpacing:-1,marginBottom:16,maxWidth:620,margin:"0 auto 16px"}}>
          Stop getting ignored.<br/><span style={{color:"#C8E600"}}>Start getting hired.</span>
        </h1>
        <p style={{fontSize:isMobile?14:16,color:"#90C898",lineHeight:1.75,margin:"0 auto 28px",maxWidth:500}}>
          AI rewrites your CV in 30 seconds to beat any ATS system.<br/>
          <strong style={{color:"#FFFFFF"}}>8 out of 10 CVs never reach a human — ours do.</strong>
        </p>
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:40}}>
          <a href="/sign-up" style={{background:"#C8E600",color:"#052A14",fontSize:15,fontWeight:800,padding:"14px 32px",borderRadius:99,textDecoration:"none",display:"inline-block"}}>Get hired free — start now</a>
          <a href="#jobs" style={{background:"transparent",color:"#C8E600",fontSize:15,fontWeight:500,padding:"14px 24px",borderRadius:99,border:"1.5px solid #1A5A2A",textDecoration:"none",display:"inline-block"}}>Browse {total > 0 ? total.toLocaleString() : '495,000+'} jobs</a>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"repeat(2,1fr)":"repeat(4,1fr)",maxWidth:460,margin:"0 auto",border:"1px solid #1A5A2A",borderRadius:12,overflow:"hidden"}}>
          {[["50,000+","JOB SEEKERS"],["495,000+","LIVE JOBS"],["30s","CV REWRITE"],["Free","NO CARD NEEDED"]].map(([val,label],i)=>(
            <div key={label} style={{padding:"14px 10px",textAlign:"center",
              borderRight:isMobile?(i%2===0?"1px solid #1A5A2A":"none"):(i<3?"1px solid #1A5A2A":"none"),
              borderBottom:isMobile&&i<2?"1px solid #1A5A2A":"none"}}>
              <div style={{fontSize:isMobile?16:20,fontWeight:800,color:"#C8E600"}}>{val}</div>
              <div style={{fontSize:9,color:"#4A8A5A",letterSpacing:"0.8px",marginTop:2}}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* GOLD BAR */}
      <div style={{background:"#C8E600",padding:"13px 24px",
        display:isMobile?"grid":"flex",
        gridTemplateColumns:isMobile?"1fr 1fr":undefined,
        alignItems:"center",justifyContent:"center",gap:isMobile?"10px 16px":24,flexWrap:"wrap"}}>
        {["Join 50,000 job seekers","495,000+ live jobs","CV rewritten in 30s","Apply while you sleep","Free — no card needed"].map(item=>(
          <div key={item} style={{display:"flex",alignItems:"center",gap:7,fontSize:12,color:"#052A14",fontWeight:700}}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" fill="#052A14"/><path d="M4 7L6 9.5L10 4.5" stroke="#C8E600" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {item}
          </div>
        ))}
      </div>

      {/* HOW IT WORKS */}
      <section style={{background:"#052A14",padding:"44px 24px"}}>
        <p style={{fontSize:11,fontWeight:700,color:"#C8E600",letterSpacing:"2.5px",textTransform:"uppercase",textAlign:"center",marginBottom:10}}>How it works</p>
        <h2 style={{fontSize:28,fontWeight:800,color:"#FFFFFF",textAlign:"center",marginBottom:6}}>Three steps to <em style={{color:"#C8E600",fontStyle:"italic"}}>open every door</em></h2>
        <p style={{fontSize:13,color:"#4A8A5A",textAlign:"center",marginBottom:32,fontStyle:"italic"}}>&ldquo;The right key opens any door — we give you that key.&rdquo;</p>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:12,maxWidth:900,margin:"0 auto"}}>
          {[
            ["1","Upload once — never fill a form again","AI reads your CV in seconds. Extracts every skill, role and achievement. Your complete profile is built instantly — never re-enter your details for any job."],
            ["2","AI opens every door — matched jobs ranked for you","Millions of live jobs across 180 countries — ranked by match percentage. See exactly why each role fits your profile. No scrolling through irrelevant listings."],
            ["3","Apply in 10 seconds — CV already perfect","Click Quick Apply. AI rewrites your CV specifically for that role in 30 seconds. ATS-optimised and employer-ready. Apply in one click — or let auto-apply do it while you sleep."]
          ].map(([num,title,desc])=>(
            <div key={num} style={{background:"#072E16",border:"1px solid #1A4A2A",borderRadius:14,padding:20}}>
              <div style={{width:32,height:32,background:"#C8E600",color:"#052A14",fontSize:13,fontWeight:800,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14}}>{num}</div>
              <div style={{fontSize:14,fontWeight:700,color:"#FFFFFF",marginBottom:7}}>{title}</div>
              <div style={{fontSize:12,color:"#3A7A4A",lineHeight:1.7}}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SEARCH + TABS */}
      <div style={{background:"#052A14",padding:"24px",borderBottom:"4px solid #C8E600"}} id="jobs">
        <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch",scrollbarWidth:"none",msOverflowStyle:"none",marginBottom:18}}>
          <div style={{display:"flex",gap:8,justifyContent:isMobile?"flex-start":"center",flexWrap:isMobile?"nowrap":"wrap",minWidth:"fit-content",padding:isMobile?"0 4px":0}}>
            {(['all','remote','relocation','teaching','south-africa'] as const).map(tab=>(
              <button key={tab} style={tabStyle(tab)} onClick={()=>handleTabChange(tab)}>
                {tab === 'all' ? '🌍 All Jobs' : tab === 'remote' ? '💻 Remote Jobs' : tab === 'teaching' ? '🎓 Teaching Jobs' : tab === 'south-africa' ? '🌍 African Jobs' : '✈️ Relocation Jobs'}
              </button>
            ))}
          </div>
        </div>
        <p style={{textAlign:"center",fontSize:12,color:"#5A9A6A",marginBottom:14,fontStyle:"italic"}}>
          {activeTab === 'all' ? 'Browse millions of jobs worldwide' : activeTab === 'remote' ? 'Work from anywhere — worldwide remote positions' : activeTab === 'teaching' ? 'Teach English in China, South Korea, Japan and UAE — $2,000–$3,500/month tax-free' : activeTab === 'south-africa' ? '200+ live jobs across South Africa, Nigeria and beyond — Adzuna, JSearch & more' : 'Jobs in London, Dubai, Toronto, Singapore and more'}
        </p>
        <form onSubmit={handleSearch} style={{display:"flex",gap:8,flexWrap:"wrap",maxWidth:720,margin:"0 auto"}}>
          <input
            value={query}
            onChange={e=>setQuery(e.target.value)}
            placeholder={activeTab === 'remote' ? "Remote job title or skill..." : activeTab === 'relocation' ? "Job title for abroad..." : activeTab === 'teaching' ? "Teaching subject or country..." : "Job title, skill or keyword..."}
            style={{flex:1,minWidth:140,padding:"13px 18px",border:"2px solid #C8E600",borderRadius:11,fontSize:14,color:"#052A14",fontWeight:600,outline:"none",background:"#fff"}}
          />
          {activeTab === 'all' && (
            <select value={location} onChange={e=>setLocation(e.target.value)}
              style={{padding:"13px 14px",border:"2px solid #C8E600",borderRadius:11,fontSize:13,color:"#052A14",fontWeight:600,outline:"none",background:"#fff"}}>
              <option value="">Worldwide</option>
              <option value="South Africa">South Africa</option>
              <option value="Nigeria">Nigeria</option>
              <option value="Kenya">Kenya</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="United States">United States</option>
              <option value="Canada">Canada</option>
              <option value="Australia">Australia</option>
              <option value="India">India</option>
              <option value="Singapore">Singapore</option>
              <option value="Dubai">Dubai</option>
            </select>
          )}
          {activeTab === 'relocation' && (
            <select value={location} onChange={e=>setLocation(e.target.value)}
              style={{padding:"13px 14px",border:"2px solid #C8E600",borderRadius:11,fontSize:13,color:"#052A14",fontWeight:600,outline:"none",background:"#fff"}}>
              <option value="">All countries</option>
              <option value="London">London, UK</option>
              <option value="Toronto">Toronto, Canada</option>
              <option value="Dubai">Dubai, UAE</option>
              <option value="Singapore">Singapore</option>
              <option value="Berlin">Berlin, Germany</option>
              <option value="Amsterdam">Amsterdam, Netherlands</option>
              <option value="Sydney">Sydney, Australia</option>
              <option value="India">India</option>
            </select>
          )}
          <button type="submit" style={{background:"#C8E600",color:"#052A14",fontSize:14,fontWeight:800,padding:"13px 28px",borderRadius:11,border:"none",cursor:"pointer",whiteSpace:"nowrap"}}>
            {loading ? 'Searching...' : 'Open the doors'}
          </button>
        </form>
      </div>

      {/* JOBS LIST */}
      <section ref={jobsSectionRef} style={{background:"#F4FCF4",padding:24}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div>
            <span style={{fontSize:15,fontWeight:800,color:"#052A14"}}>
              {activeTab === 'remote' ? 'Remote doors open worldwide' : activeTab === 'relocation' ? 'International doors open for you' : activeTab === 'teaching' ? 'Teaching jobs open worldwide' : activeTab === 'south-africa' ? 'African jobs open now' : 'Doors open for your profile'}
            </span>
            {activeTab === 'relocation' && <div style={{fontSize:11,color:"#4A8A5A",marginTop:2,fontStyle:"italic"}}>Jobs in London, Dubai, Toronto, Singapore and beyond</div>}
            {activeTab === 'remote' && <div style={{fontSize:11,color:"#4A8A5A",marginTop:2,fontStyle:"italic"}}>Work from anywhere — earn in USD, GBP or EUR</div>}
            {activeTab === 'teaching' && <div style={{fontSize:11,color:"#4A8A5A",marginTop:2,fontStyle:"italic"}}>Teach abroad — free housing, flights and $2,000–$3,500/month</div>}
            {activeTab === 'south-africa' && <div style={{fontSize:11,color:"#4A8A5A",marginTop:2,fontStyle:"italic"}}>South Africa, Nigeria, Kenya and across Africa</div>}
          </div>
          <span style={{fontSize:12,color:"#052A14",background:"#C8E600",padding:"3px 12px",borderRadius:99,fontWeight:800,whiteSpace:"nowrap"}}>
            {total > 0 ? total.toLocaleString() : '...'} matches
          </span>
        </div>
        {activeTab === 'south-africa' && (
          <div style={{marginBottom:16}}>
            <div style={{background:"#052A14",border:"1.5px solid #C8E600",borderRadius:14,padding:"14px 20px",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:18}}>🌍</span>
                <span style={{fontSize:13,color:"#A8D8B0",fontWeight:600}}>
                  Jobs across Africa — <strong style={{color:"#FFFFFF"}}>South Africa, Nigeria</strong> and beyond
                </span>
              </div>
              {total > 0 && (
                <span style={{fontSize:12,color:"#C8E600",fontWeight:700,whiteSpace:"nowrap"}}>{total.toLocaleString()} African jobs found</span>
              )}
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {['', 'Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Lagos', 'Nairobi'].map(city => (
                <button
                  key={city || 'all'}
                  onClick={() => handleAfricaCityChange(city)}
                  style={{
                    padding:'6px 14px',
                    borderRadius:99,
                    fontSize:12,
                    fontWeight:700,
                    cursor:'pointer',
                    border:'1.5px solid #C8E600',
                    background: africaCity === city ? '#C8E600' : 'transparent',
                    color: africaCity === city ? '#052A14' : '#C8E600',
                    transition:'all 0.15s',
                  }}>
                  {city || 'All Africa'}
                </button>
              ))}
            </div>
          </div>
        )}
        {activeTab === 'teaching' && !loading && (
          <div style={{background:"#052A14",border:"1.5px solid #C8E600",borderRadius:14,padding:20,marginBottom:16}}>
            <div style={{fontSize:11,color:"#C8E600",fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:8}}>🎓 TEACHING ABROAD OPPORTUNITY</div>
            <h3 style={{fontSize:16,fontWeight:800,color:"#FFFFFF",marginBottom:8}}>Teach English in Asia & the UAE — earn $2,000–$3,500/month tax-free</h3>
            <p style={{fontSize:13,color:"#A8D8B0",lineHeight:1.7,marginBottom:12}}>
              China, South Korea, Japan and the UAE are hiring English teachers right now. Most packages include <strong style={{color:"#C8E600"}}>free housing, return flights and a tax-free salary</strong> — no prior teaching experience required in many schools.
            </p>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              {[["🇨🇳 China","$1,800–$3,000/mo"],["🇰🇷 South Korea","$1,800–$2,800/mo"],["🇯🇵 Japan","$2,000–$3,000/mo"],["🇦🇪 UAE","$2,500–$3,500/mo"]].map(([country,salary])=>(
                <div key={country} style={{background:"rgba(200,230,0,0.1)",border:"1px solid rgba(200,230,0,0.3)",borderRadius:10,padding:"8px 14px"}}>
                  <span style={{fontSize:12,color:"#C8E600",fontWeight:700}}>{country}</span>
                  <span style={{fontSize:11,color:"#90C898",marginLeft:6}}>{salary} + free housing & flights</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {loading ? (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {[...Array(6)].map((_,i)=>(
              <div key={i} className="skeleton" style={{background:"#fff",border:"1.5px solid #D8EED8",borderRadius:14,padding:16,display:"flex",gap:16,alignItems:"flex-start"}}>
                <div style={{display:"flex",gap:12,flex:1,minWidth:0}}>
                  <div style={{width:44,height:44,borderRadius:11,background:"#D8EED8",flexShrink:0}}></div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{height:14,background:"#D8EED8",borderRadius:6,marginBottom:10,width:"60%"}}></div>
                    <div style={{height:11,background:"#E8F4E8",borderRadius:6,marginBottom:10,width:"45%"}}></div>
                    <div style={{display:"flex",gap:5,marginBottom:10}}>
                      <div style={{height:20,width:64,background:"#E8F4E8",borderRadius:99}}></div>
                      <div style={{height:20,width:52,background:"#E8F4E8",borderRadius:99}}></div>
                      <div style={{height:20,width:70,background:"#E8F4E8",borderRadius:99}}></div>
                    </div>
                    <div style={{height:11,background:"#E8F4E8",borderRadius:6,marginBottom:5}}></div>
                    <div style={{height:11,background:"#E8F4E8",borderRadius:6,width:"80%"}}></div>
                  </div>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:7,width:120,flexShrink:0}}>
                  <div style={{height:30,width:"100%",background:"#D8EED8",borderRadius:99}}></div>
                  <div style={{height:28,width:"100%",background:"#E8F4E8",borderRadius:99}}></div>
                  <div style={{height:28,width:"100%",background:"#E8F4E8",borderRadius:99}}></div>
                </div>
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          activeTab === 'south-africa' ? (
            <div style={{background:"#052A14",border:"1.5px solid #1A5A2A",borderRadius:16,padding:"32px 24px",textAlign:"center",maxWidth:560,margin:"0 auto"}}>
              <div style={{fontSize:32,marginBottom:16}}>🌍</div>
              <div style={{fontSize:16,fontWeight:800,color:"#FFFFFF",marginBottom:10}}>African Jobs — coming soon</div>
              <p style={{fontSize:13,color:"#90C898",lineHeight:1.8,marginBottom:20}}>
                We are activating our African job feeds. In the meantime, browse{' '}
                <strong style={{color:"#C8E600"}}>Remote Jobs</strong> — thousands of positions open to African candidates worldwide, with no relocation required.
              </p>
              <button
                onClick={() => handleTabChange('remote')}
                style={{background:"#C8E600",color:"#052A14",fontSize:13,fontWeight:800,padding:"11px 28px",borderRadius:99,border:"none",cursor:"pointer"}}>
                💻 Browse Remote Jobs
              </button>
            </div>
          ) : (
            <div style={{textAlign:"center",padding:"60px 0"}}>
              <div style={{fontSize:16,color:"#2A6A3A",fontWeight:700,marginBottom:8}}>No jobs found for that search</div>
              <div style={{fontSize:13,color:"#4A8A5A"}}>Try a different keyword</div>
            </div>
          )
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {jobs.map((job,i)=>(
              <div key={job.id} style={{
                background:i===0?"#FDFFF5":"#fff",
                border:`1.5px solid ${i===0?"#C8E600":"#D8EED8"}`,
                borderRadius:14,
                padding:16,
                display:"flex",
                flexDirection:isMobile?"column":"row",
                gap:16,
                alignItems:"flex-start",
              }}>
                {/* Logo + Content */}
                <div style={{display:"flex",gap:12,flex:1,minWidth:0}}>
                  <div style={{width:44,height:44,borderRadius:11,background:"#EAF5EA",color:"#1A5A2A",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,flexShrink:0}}>
                    {job.company.charAt(0).toUpperCase()}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:700,color:"#052A14",marginBottom:3,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{job.title}</div>
                    <div style={{fontSize:12,color:"#666",marginBottom:8,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{job.company} · {job.location}</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
                      <span style={{fontSize:11,padding:"3px 9px",borderRadius:99,fontWeight:600,background:"#EAF5EA",color:"#1A5A2A",whiteSpace:"nowrap"}}>{job.location}</span>
                      <span style={{fontSize:11,padding:"3px 9px",borderRadius:99,fontWeight:600,background:"#FDFFF5",color:"#5A7A00",border:"1px solid #C8E600",whiteSpace:"nowrap"}}>{job.level}</span>
                      <span style={{fontSize:11,padding:"3px 9px",borderRadius:99,fontWeight:600,background:"#FFF8EC",color:"#7A5000",whiteSpace:"nowrap"}}>{job.category}</span>
                      {activeTab === 'remote' && <span style={{fontSize:11,padding:"3px 9px",borderRadius:99,fontWeight:600,background:"#052A14",color:"#C8E600",whiteSpace:"nowrap"}}>Remote</span>}
                      {activeTab === 'relocation' && <span style={{fontSize:11,padding:"3px 9px",borderRadius:99,fontWeight:600,background:"#052A14",color:"#C8E600",whiteSpace:"nowrap"}}>Relocation</span>}
                      {activeTab === 'teaching' && <span style={{fontSize:11,padding:"3px 9px",borderRadius:99,fontWeight:600,background:"#052A14",color:"#C8E600",whiteSpace:"nowrap"}}>🎓 Teaching</span>}
                      {(job as any).source && <span style={{fontSize:10,padding:"2px 8px",borderRadius:99,fontWeight:600,background:"rgba(5,42,20,0.08)",color:"#3A7A4A",border:"1px solid #D8EED8",whiteSpace:"nowrap"}}>{(job as any).source}</span>}
                      {/* TASK 1 — auto-apply badge */}
                      {isAutoApply(job.url)
                        ? <span style={{fontSize:11,padding:"3px 9px",borderRadius:99,fontWeight:700,background:"rgba(200,230,0,0.12)",color:"#C8E600",border:"1px solid rgba(200,230,0,0.35)",whiteSpace:"nowrap"}}>⚡ Auto-apply</span>
                        : <span style={{fontSize:11,padding:"3px 9px",borderRadius:99,fontWeight:700,background:"rgba(255,165,0,0.10)",color:"#FFA500",border:"1px solid rgba(255,165,0,0.35)",whiteSpace:"nowrap"}}>🎯 Assisted</span>
                      }
                    </div>
                    <p style={{fontSize:12,color:"#666",lineHeight:1.55,margin:0,display:"-webkit-box" as any,WebkitLineClamp:2,WebkitBoxOrient:"vertical" as any,overflow:"hidden"}}>{job.description}</p>
                  </div>
                </div>

                {/* Buttons — desktop: column 120px wide | mobile: row full width */}
                {isMobile ? (
                  <div style={{display:"flex",gap:8,width:"100%",marginTop:4}}>
                    <button onClick={()=>setSelectedJob(job)} style={{flex:1,background:"#C8E600",color:"#052A14",fontSize:12,fontWeight:800,padding:"9px 0",borderRadius:99,border:"none",cursor:"pointer"}}>
                      ⚡ Quick Apply
                    </button>
                    <button onClick={()=>window.open(job.url,'_blank')} style={{flex:1,background:"transparent",color:"#5A9A6A",fontSize:12,fontWeight:600,padding:"9px 0",borderRadius:99,border:"1px solid #1A5A2A",cursor:"pointer"}}>
                      View job
                    </button>
                    <button onClick={()=>toggleSaveJob(job)} style={{background:savedJobs.includes(job.id)?"#1A4A2A":"transparent",color:savedJobs.includes(job.id)?"#C8E600":"#5A9A6A",fontSize:12,fontWeight:600,padding:"9px 14px",borderRadius:99,border:`1px solid ${savedJobs.includes(job.id)?"#C8E600":"#1A5A2A"}`,cursor:"pointer",flexShrink:0}}>
                      🔖
                    </button>
                  </div>
                ) : (
                  <div style={{display:"flex",flexDirection:"column",gap:7,width:120,flexShrink:0}}>
                    <button onClick={()=>setSelectedJob(job)} style={{width:"100%",background:"#C8E600",color:"#052A14",fontSize:11,fontWeight:800,padding:"8px 0",borderRadius:99,border:"none",cursor:"pointer",textAlign:"center"}}>
                      ⚡ Quick Apply
                    </button>
                    <button onClick={()=>window.open(job.url,'_blank')} style={{width:"100%",background:"transparent",color:"#5A9A6A",fontSize:11,fontWeight:600,padding:"7px 0",borderRadius:99,border:"1px solid #1A5A2A",cursor:"pointer",textAlign:"center"}}>
                      View job
                    </button>
                    <button onClick={()=>toggleSaveJob(job)} style={{width:"100%",background:savedJobs.includes(job.id)?"#1A4A2A":"transparent",color:savedJobs.includes(job.id)?"#C8E600":"#5A9A6A",fontSize:11,fontWeight:600,padding:"7px 0",borderRadius:99,border:`1px solid ${savedJobs.includes(job.id)?"#C8E600":"#1A5A2A"}`,cursor:"pointer",textAlign:"center"}}>
                      {savedJobs.includes(job.id) ? '🔖 Saved' : '🔖 Save'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* RELOCATION BANNER */}
      <section style={{background:"#052A14",padding:"32px 24px",textAlign:"center"}}>
        <p style={{fontSize:11,fontWeight:700,color:"#C8E600",letterSpacing:"2px",textTransform:"uppercase",marginBottom:10}}>RELOCATION JOBS</p>
        <h2 style={{fontSize:24,fontWeight:800,color:"#FFFFFF",marginBottom:8}}>Ready to move? <span style={{color:"#C8E600"}}>The world is hiring.</span></h2>
        <p style={{fontSize:14,color:"#5A9A6A",marginBottom:20,maxWidth:500,margin:"0 auto 20px"}}>From Johannesburg to London. Lagos to Toronto. Nairobi to Dubai. Find jobs that open doors to a new country and a new life.</p>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginBottom:24}}>
          {["🇬🇧 London","🇨🇦 Toronto","🇦🇪 Dubai","🇸🇬 Singapore","🇩🇪 Berlin","🇦🇺 Sydney"].map(city=>(
            <span key={city} style={{background:"#072E16",border:"1px solid #1A5A2A",borderRadius:99,padding:"6px 14px",fontSize:12,color:"#90C898",fontWeight:600}}>{city}</span>
          ))}
        </div>
        <button onClick={()=>handleTabChange('relocation')}
          style={{background:"#C8E600",color:"#052A14",fontSize:14,fontWeight:800,padding:"12px 28px",borderRadius:99,border:"none",cursor:"pointer"}}>
          Browse relocation jobs
        </button>
      </section>

      {/* TESTIMONIALS */}
      <section style={{background:"#F4FCF4",padding:"36px 24px"}}>
        <p style={{fontSize:11,fontWeight:700,color:"#052A14",letterSpacing:"2px",textTransform:"uppercase",textAlign:"center",marginBottom:10}}>SUCCESS STORIES</p>
        <h2 style={{fontSize:22,fontWeight:800,color:"#052A14",textAlign:"center",marginBottom:24}}>Real people. <span style={{color:"#1A7A3A"}}>Real doors opened.</span></h2>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(2,1fr)",gap:12,maxWidth:800,margin:"0 auto"}}>
          {[
            {name:"Thabo Nkosi",seed:"ThaboNkosi",location:"Johannesburg → Standard Bank",quote:"4 months of silence. Jobsesame rewrote my CV and Standard Bank called me within 3 days. My ATS score went from 31% to 94%. The door I thought was locked — was never locked at all."},
            {name:"Chioma Okafor",seed:"ChiomaOkafor",location:"Lagos → Marketing Manager",quote:"Got 12 interviews in 30 days. Jobsesame found keywords I had no idea I was missing. My match score jumped 60 points. Now earning 3× what I made before."},
            {name:"Brian Otieno",seed:"BrianOtieno",location:"Nairobi → Software Developer",quote:"Quick Apply sent 23 applications while I slept. Woke up to 4 recruiter calls. My new salary is 40% higher. Nothing has ever changed my life this fast."},
            {name:"Amara Diallo",seed:"AmaraDiallo",location:"Dakar → London, UK",quote:"I never thought I could work in London. Jobsesame matched me to a relocation job, rewrote my CV for UK employers, and I had an offer in 9 days. I am living in London now."},
          ].map(t=>(
            <div key={t.name} style={{background:"#fff",border:"1.5px solid #D8EED8",borderRadius:14,padding:20}}>
              <div style={{color:"#C8E600",fontSize:13,marginBottom:8,background:"#052A14",width:"fit-content",padding:"3px 10px",borderRadius:99,fontWeight:700}}>★★★★★</div>
              <p style={{fontSize:13,color:"#333",lineHeight:1.7,fontStyle:"italic",marginBottom:14}}>&ldquo;{t.quote}&rdquo;</p>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${t.seed}&backgroundColor=052A14`} width={40} height={40} style={{borderRadius:"50%",background:"#052A14",flexShrink:0}} alt={t.name} />
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:"#052A14"}}>{t.name}</div>
                  <div style={{fontSize:11,color:"#2A7A3A",fontWeight:600}}>{t.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{background:"#C8E600",padding:"44px 24px",textAlign:"center"}}>
        <p style={{fontSize:11,fontWeight:700,color:"#1A4A00",letterSpacing:"2px",textTransform:"uppercase",marginBottom:10}}>YOUR TURN</p>
        <h2 style={{fontSize:isMobile?24:32,fontWeight:800,color:"#052A14",marginBottom:8,letterSpacing:-0.5}}>Stop getting ignored.<br/><em style={{fontStyle:"italic"}}>Start getting hired today.</em></h2>
        <p style={{fontSize:14,color:"#2A5A14",marginBottom:8,lineHeight:1.6}}>3 free applications. AI rewrites your CV. No card needed. Takes 60 seconds.</p>
        <p style={{fontSize:13,color:"#3A6A1A",marginBottom:24}}>Join 50,000+ job seekers who stopped being ignored with Jobsesame.</p>
        <a href="/sign-up" style={{background:"#052A14",color:"#C8E600",fontSize:15,fontWeight:800,padding:"15px 38px",borderRadius:99,textDecoration:"none",display:"inline-block"}}>Get hired free — start now</a>
      </section>

      {/* URGENCY BAR */}
      <div style={{background:"#052A14",padding:"14px 24px",textAlign:"center",borderTop:"1px solid #1A5A2A"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:10,background:"rgba(200,230,0,0.08)",border:"1px solid rgba(200,230,0,0.3)",borderRadius:99,padding:"8px 20px"}}>
          <span style={{width:8,height:8,background:"#C8E600",borderRadius:"50%",display:"inline-block",flexShrink:0}}></span>
          <span style={{fontSize:13,color:"#FFFFFF",fontWeight:600}}>47 people applied for jobs in the last hour using Jobsesame</span>
        </div>
      </div>

      {/* PRICING */}
      <section id="pricing" style={{background:"#F4FCF4",padding:"32px 24px"}}>
        <div style={{textAlign:"center",marginBottom:22}}>
          <span style={{background:"#052A14",color:"#C8E600",fontSize:11,fontWeight:800,padding:"4px 14px",borderRadius:99,letterSpacing:"1.5px",textTransform:"uppercase"}}>PRICING</span>
          <h2 style={{fontSize:22,fontWeight:800,color:"#052A14",marginTop:10}}>One price. Every door unlocked. No surprises.</h2>
          <p style={{fontSize:13,color:"#4A7A4A",marginTop:4,fontStyle:"italic"}}>&ldquo;The key to your future should not cost a fortune.&rdquo;</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)",gap:10,maxWidth:800,margin:"0 auto"}}>
          {[
            {name:"Free forever",price:currency==='ZAR'?"R0":"$0",per:"/always",desc:"Browse millions of jobs. 3 free Quick Apply credits. AI CV rewrite included. No card needed.",popular:false,btn:"Open free"},
            {name:"Pro — All doors open",price:currency==='ZAR'?"R370":"$20",per:"/month",desc:"Unlimited Quick Apply. Unlimited CV rewrites. Auto-apply. Cover letters. Everything — one price.",popular:true,btn:"Unlock Pro"},
            {name:"Credits pack",price:currency==='ZAR'?"R185":"$10",per:"/pack",desc:"10 Quick Apply credits. No expiry. Perfect for occasional job seekers.",popular:false,btn:"Get credits"},
          ].map((p)=>(
            <div key={p.name} style={{background:p.popular?"#FDFFF5":"#fff",border:`1.5px solid ${p.popular?"#C8E600":"#D8EED8"}`,borderRadius:14,padding:20,textAlign:"center"}}>
              {p.popular&&<div style={{background:"#C8E600",color:"#052A14",fontSize:10,fontWeight:800,padding:"3px 12px",borderRadius:99,display:"inline-block",marginBottom:10}}>Most popular</div>}
              <div style={{fontSize:13,fontWeight:700,color:"#052A14",marginBottom:4}}>{p.name}</div>
              <div style={{fontSize:28,fontWeight:800,color:"#052A14",marginBottom:2}}>{p.price}<span style={{fontSize:13,fontWeight:500,color:"#888"}}>{p.per}</span></div>
              <div style={{fontSize:11,color:"#5A7A5A",marginBottom:14,lineHeight:1.7}}>{p.desc}</div>
              <a href="/sign-up" style={{display:"block",background:p.popular?"#C8E600":"#052A14",color:p.popular?"#052A14":"#C8E600",fontSize:12,fontWeight:800,padding:"10px",borderRadius:99,textDecoration:"none",textAlign:"center"}}>{p.btn}</a>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{background:"#052A14",borderTop:"1px solid #0D4A20",padding:"48px 24px 28px"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:36,marginBottom:36,flexDirection:isMobile?"column":"row"}}>
            <div style={{maxWidth:240}}>
              <div style={{fontSize:20,fontWeight:800,marginBottom:10}}>
                <span style={{color:"#FFFFFF"}}>job</span>
                <span style={{color:"#C8E600"}}>sesame</span>
              </div>
              <p style={{fontSize:12,color:"#3A6A4A",lineHeight:1.8,marginBottom:8}}>
                Open to the world&apos;s job market — unlocked by AI. Find jobs across 180 countries, rewrite your CV in 30 seconds, and apply in one click.
              </p>
              <p style={{fontSize:11,color:"#1A4A2A",fontStyle:"italic"}}>&ldquo;Open sesame — your future awaits&rdquo;</p>
            </div>
            <div style={{display:"flex",gap:48,flexWrap:"wrap"}}>
              <div>
                <div style={{fontSize:10,color:"#C8E600",fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:14}}>Platform</div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  <a href="/#jobs" style={{fontSize:13,color:"#5A9A6A",textDecoration:"none",fontWeight:500}}>Find Jobs</a>
                  <a href="/optimise" style={{fontSize:13,color:"#5A9A6A",textDecoration:"none",fontWeight:500}}>CV Optimiser</a>
                  <a href="/dashboard" style={{fontSize:13,color:"#5A9A6A",textDecoration:"none",fontWeight:500}}>Dashboard</a>
                  <a href="/#pricing" style={{fontSize:13,color:"#5A9A6A",textDecoration:"none",fontWeight:500}}>Pricing</a>
                </div>
              </div>
              <div>
                <div style={{fontSize:10,color:"#C8E600",fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:14}}>Company</div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  <a href="/about" style={{fontSize:13,color:"#5A9A6A",textDecoration:"none",fontWeight:500}}>About</a>
                  <a href="/privacy" style={{fontSize:13,color:"#5A9A6A",textDecoration:"none",fontWeight:500}}>Privacy Policy</a>
                  <a href="/terms" style={{fontSize:13,color:"#5A9A6A",textDecoration:"none",fontWeight:500}}>Terms of Service</a>
                  <a href="mailto:hello@jobsesame.co.za" style={{fontSize:13,color:"#5A9A6A",textDecoration:"none",fontWeight:500}}>Contact</a>
                </div>
              </div>
            </div>
          </div>
          <div style={{borderTop:"1px solid #0D4A20",paddingTop:20,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
            <span style={{fontSize:11,color:"#1A4A2A"}}>© 2025 Jobsesame. All rights reserved.</span>
            <span style={{fontSize:11,color:"#1A4A2A"}}>jobsesame.co.za</span>
          </div>
        </div>
      </footer>

    </main>
  );
}
