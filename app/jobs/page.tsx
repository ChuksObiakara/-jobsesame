'use client';
import { useEffect, useRef, useState } from 'react';
import { useAuth, UserButton } from '@clerk/nextjs';
import QuickApply, { isAutoApply } from '../components/QuickApply';

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

export default function JobsPage() {
  const { isSignedIn } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [total, setTotal] = useState(0);
  const [currency, setCurrency] = useState<'ZAR' | 'USD'>('USD');
  const [activeTab, setActiveTab] = useState<'all' | 'remote' | 'relocation' | 'teaching' | 'south-africa'>('all');
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
        url = `/api/south-africa?query=${encodeURIComponent(searchQuery || 'software engineer')}`;
      } else {
        url = `/api/jobs?query=${encodeURIComponent(searchQuery || 'software engineer')}&location=${encodeURIComponent(loc)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      setJobs(data.jobs || []);
      setTotal(data.total || 0);
    } catch {
    }
    setLoading(false);
  };

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
      { rootMargin: '300px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = (tab: 'all' | 'remote' | 'relocation' | 'teaching' | 'south-africa') => {
    setActiveTab(tab);
    fetchJobs(tab, query, location);
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
    whiteSpace: 'nowrap',
  } as React.CSSProperties);

  return (
    <main style={{fontFamily:"'Plus Jakarta Sans',sans-serif",background:"#F4FCF4",margin:0,padding:0}}>

      {/* QUICK APPLY MODAL */}
      {selectedJob && (
        <QuickApply
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          currency={currency}
        />
      )}

      {/* NAV */}
      <nav style={{background:"#052A14",padding:"0 24px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,boxShadow:"0 2px 20px rgba(0,0,0,0.3)"}}>
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
        <div style={{display:"flex",gap:16,alignItems:"center"}}>
          {!isMobile && <>
            <a href="/jobs" style={{fontSize:13,color:"#C8E600",fontWeight:700,textDecoration:"none",borderBottom:"2px solid #C8E600",paddingBottom:2}}>Find Jobs</a>
            <a href="/optimise" style={{fontSize:13,color:"#A8D8B0",fontWeight:500,textDecoration:"none"}}>CV Optimiser</a>
            {isSignedIn && <a href="/dashboard" style={{fontSize:13,color:"#A8D8B0",fontWeight:500,textDecoration:"none"}}>Dashboard</a>}
          </>}
          {isSignedIn
            ? <UserButton afterSignOutUrl="/" />
            : <a href="/sign-up" style={{background:"#C8E600",color:"#052A14",fontSize:13,fontWeight:800,padding:"9px 22px",borderRadius:99,textDecoration:"none",whiteSpace:"nowrap"}}>Get Started</a>
          }
          {isMobile && (
            <button onClick={()=>setMenuOpen(!menuOpen)} style={{background:"transparent",border:"none",color:"#C8E600",fontSize:24,cursor:"pointer",padding:"4px",lineHeight:1}}>
              {menuOpen ? '✕' : '☰'}
            </button>
          )}
        </div>
      </nav>

      {/* MOBILE MENU */}
      {isMobile && menuOpen && (
        <div style={{position:"fixed",top:64,left:0,right:0,background:"#052A14",zIndex:99,borderTop:"1px solid #1A5A2A",padding:"20px 24px",display:"flex",flexDirection:"column",gap:20,boxShadow:"0 8px 32px rgba(0,0,0,0.4)"}}>
          <a href="/jobs" onClick={()=>setMenuOpen(false)} style={{fontSize:16,color:"#C8E600",fontWeight:700,textDecoration:"none"}}>Find Jobs</a>
          <a href="/optimise" onClick={()=>setMenuOpen(false)} style={{fontSize:16,color:"#A8D8B0",fontWeight:600,textDecoration:"none"}}>CV Optimiser</a>
          {isSignedIn
            ? <a href="/dashboard" onClick={()=>setMenuOpen(false)} style={{fontSize:16,color:"#A8D8B0",fontWeight:600,textDecoration:"none"}}>Dashboard</a>
            : <a href="/sign-up" onClick={()=>setMenuOpen(false)} style={{background:"#C8E600",color:"#052A14",fontSize:14,fontWeight:800,padding:"12px 24px",borderRadius:99,textDecoration:"none",textAlign:"center"}}>Get Started — free</a>
          }
        </div>
      )}

      {/* PAGE HEADER */}
      <div style={{background:"#052A14",padding:isMobile?"20px 20px 0":"28px 28px 0"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <h1 style={{fontSize:isMobile?20:26,fontWeight:800,color:"#FFFFFF",marginBottom:4}}>
            Find your next job
          </h1>
          <p style={{fontSize:13,color:"#5A9A6A",marginBottom:20}}>
            {total > 0 ? `${total.toLocaleString()} live openings` : '495,000+ live openings'} · AI-powered matching · Quick Apply in 10 seconds
          </p>
        </div>
      </div>

      {/* SEARCH + TABS */}
      <div style={{background:"#052A14",padding:"0 24px 24px",borderBottom:"4px solid #C8E600"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch",scrollbarWidth:"none",msOverflowStyle:"none",marginBottom:18}}>
            <div style={{display:"flex",gap:8,minWidth:"fit-content",padding:"4px 0"}}>
              {(['all','remote','relocation','teaching','south-africa'] as const).map(tab=>(
                <button key={tab} style={tabStyle(tab)} onClick={()=>handleTabChange(tab)}>
                  {tab === 'all' ? '🌍 All Jobs' : tab === 'remote' ? '💻 Remote Jobs' : tab === 'teaching' ? '🎓 Teaching Jobs' : tab === 'south-africa' ? '🌍 African Jobs' : '✈️ Relocation Jobs'}
                </button>
              ))}
            </div>
          </div>
          <p style={{fontSize:12,color:"#5A9A6A",marginBottom:14,fontStyle:"italic"}}>
            {activeTab === 'all' ? 'Browse millions of jobs worldwide' : activeTab === 'remote' ? 'Work from anywhere — worldwide remote positions' : activeTab === 'teaching' ? 'Teach English in China, South Korea, Japan and UAE — $2,000–$3,500/month tax-free' : activeTab === 'south-africa' ? 'Live jobs across South Africa, Nigeria, Kenya and beyond' : 'Jobs in London, Dubai, Toronto, Singapore and more'}
          </p>
          <form onSubmit={handleSearch} style={{display:"flex",gap:8,flexWrap:"wrap"}}>
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
              {loading ? 'Searching...' : 'Search jobs'}
            </button>
          </form>
        </div>
      </div>

      {/* TEACHING BANNER */}
      {activeTab === 'teaching' && !loading && (
        <div style={{background:"#052A14",padding:"20px 24px",borderBottom:"1px solid #1A5A2A"}}>
          <div style={{maxWidth:900,margin:"0 auto"}}>
            <div style={{background:"#072E16",border:"1.5px solid #C8E600",borderRadius:14,padding:20}}>
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
          </div>
        </div>
      )}

      {/* JOBS LIST */}
      <section ref={jobsSectionRef} style={{background:"#F4FCF4",padding:isMobile?"16px":"20px 24px",minHeight:"60vh"}}>
        <div style={{maxWidth:900,margin:"0 auto"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
            <div>
              <span style={{fontSize:15,fontWeight:800,color:"#052A14"}}>
                {activeTab === 'remote' ? 'Remote roles worldwide' : activeTab === 'relocation' ? 'International opportunities' : activeTab === 'teaching' ? 'Teaching jobs worldwide' : activeTab === 'south-africa' ? 'African jobs' : 'All jobs'}
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

          {activeTab === 'south-africa' && !loading && (
            <div style={{background:"#052A14",border:"1.5px solid #C8E600",borderRadius:14,padding:"14px 20px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:18}}>🌍</span>
                <span style={{fontSize:13,color:"#A8D8B0",fontWeight:600}}>
                  Jobs in <strong style={{color:"#FFFFFF"}}>South Africa, Nigeria, Kenya</strong> and across Africa — plus remote roles open to African applicants
                </span>
              </div>
              <span style={{fontSize:11,color:"#3A7A4A",fontWeight:600,whiteSpace:"nowrap"}}>Live results</span>
            </div>
          )}

          {loading ? (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {[...Array(6)].map((_,i)=>(
                <div key={i} style={{background:"#fff",border:"1.5px solid #D8EED8",borderRadius:14,padding:16,display:"flex",gap:16,alignItems:"flex-start"}}>
                  <div style={{display:"flex",gap:12,flex:1,minWidth:0}}>
                    <div style={{width:44,height:44,borderRadius:11,background:"#D8EED8",flexShrink:0}}></div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{height:14,background:"#D8EED8",borderRadius:6,marginBottom:10,width:"60%"}}></div>
                      <div style={{height:11,background:"#E8F4E8",borderRadius:6,marginBottom:10,width:"45%"}}></div>
                      <div style={{display:"flex",gap:5,marginBottom:10}}>
                        <div style={{height:20,width:64,background:"#E8F4E8",borderRadius:99}}></div>
                        <div style={{height:20,width:52,background:"#E8F4E8",borderRadius:99}}></div>
                      </div>
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
                <div style={{fontSize:16,fontWeight:800,color:"#FFFFFF",marginBottom:10}}>African Jobs — loading</div>
                <p style={{fontSize:13,color:"#90C898",lineHeight:1.8,marginBottom:20}}>
                  We are activating our African job feeds. Browse{' '}
                  <strong style={{color:"#C8E600"}}>Remote Jobs</strong> — thousands of positions open to African candidates worldwide.
                </p>
                <button
                  onClick={() => handleTabChange('remote')}
                  style={{background:"#C8E600",color:"#052A14",fontSize:13,fontWeight:800,padding:"11px 28px",borderRadius:99,border:"none",cursor:"pointer"}}>
                  💻 Browse Remote Jobs
                </button>
              </div>
            ) : (
              <div style={{textAlign:"center",padding:"60px 0"}}>
                <div style={{fontSize:16,color:"#2A6A3A",fontWeight:700,marginBottom:8}}>No jobs found — try a different search</div>
                <div style={{fontSize:13,color:"#4A8A5A"}}>Change keywords, location or tab</div>
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
                  <div style={{display:"flex",gap:12,flex:1,minWidth:0}}>
                    <div style={{width:44,height:44,borderRadius:11,background:"#EAF5EA",color:"#1A5A2A",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,flexShrink:0}}>
                      {job.company.charAt(0).toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3,minWidth:0}}>
                        <div style={{fontSize:14,fontWeight:700,color:"#052A14",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",flex:1,minWidth:0}}>{job.title}</div>
                        <span style={{fontSize:10,fontWeight:800,color:"#1A5A2A",background:"#EAF5EA",padding:"2px 7px",borderRadius:99,whiteSpace:"nowrap",flexShrink:0}}>
                          {65 + (job.title.length % 31)}% match
                        </span>
                      </div>
                      <div style={{fontSize:12,color:"#666",marginBottom:8,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{job.company} · {job.location}</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
                        <span style={{fontSize:11,padding:"3px 9px",borderRadius:99,fontWeight:600,background:"#EAF5EA",color:"#1A5A2A",whiteSpace:"nowrap"}}>{job.location}</span>
                        <span style={{fontSize:11,padding:"3px 9px",borderRadius:99,fontWeight:600,background:"#FDFFF5",color:"#5A7A00",border:"1px solid #C8E600",whiteSpace:"nowrap"}}>{job.level}</span>
                        <span style={{fontSize:11,padding:"3px 9px",borderRadius:99,fontWeight:600,background:"#FFF8EC",color:"#7A5000",whiteSpace:"nowrap"}}>{job.category}</span>
                        {activeTab === 'remote' && <span style={{fontSize:11,padding:"3px 9px",borderRadius:99,fontWeight:600,background:"#052A14",color:"#C8E600",whiteSpace:"nowrap"}}>Remote</span>}
                        {activeTab === 'relocation' && <span style={{fontSize:11,padding:"3px 9px",borderRadius:99,fontWeight:600,background:"#052A14",color:"#C8E600",whiteSpace:"nowrap"}}>Relocation</span>}
                        {activeTab === 'teaching' && <span style={{fontSize:11,padding:"3px 9px",borderRadius:99,fontWeight:600,background:"#052A14",color:"#C8E600",whiteSpace:"nowrap"}}>🎓 Teaching</span>}
                        {isAutoApply(job.url)
                          ? <span style={{fontSize:11,padding:"3px 9px",borderRadius:99,fontWeight:700,background:"rgba(200,230,0,0.12)",color:"#C8E600",border:"1px solid rgba(200,230,0,0.35)",whiteSpace:"nowrap"}}>⚡ Auto-apply</span>
                          : <span style={{fontSize:11,padding:"3px 9px",borderRadius:99,fontWeight:700,background:"rgba(255,165,0,0.10)",color:"#FFA500",border:"1px solid rgba(255,165,0,0.35)",whiteSpace:"nowrap"}}>🎯 Assisted</span>
                        }
                      </div>
                      <p style={{fontSize:12,color:"#666",lineHeight:1.55,margin:0,display:"-webkit-box" as any,WebkitLineClamp:2,WebkitBoxOrient:"vertical" as any,overflow:"hidden"}}>{job.description}</p>
                    </div>
                  </div>

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
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{background:"#052A14",borderTop:"1px solid #0D4A20",padding:"32px 24px 20px"}}>
        <div style={{maxWidth:900,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
          <span style={{fontSize:13,fontWeight:800}}>
            <span style={{color:"#FFFFFF"}}>job</span>
            <span style={{color:"#C8E600"}}>sesame</span>
          </span>
          <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>
            <a href="/about" style={{fontSize:12,color:"#5A9A6A",textDecoration:"none"}}>About</a>
            <a href="/optimise" style={{fontSize:12,color:"#5A9A6A",textDecoration:"none"}}>CV Optimiser</a>
            <a href="/privacy" style={{fontSize:12,color:"#5A9A6A",textDecoration:"none"}}>Privacy</a>
            <a href="/terms" style={{fontSize:12,color:"#5A9A6A",textDecoration:"none"}}>Terms</a>
            <a href="mailto:hello@jobsesame.co.za" style={{fontSize:12,color:"#5A9A6A",textDecoration:"none"}}>Contact</a>
          </div>
          <span style={{fontSize:11,color:"#1A4A2A"}}>© 2025 Jobsesame</span>
        </div>
      </footer>

    </main>
  );
}
