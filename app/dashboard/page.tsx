'use client';
import { useEffect, useState } from 'react';

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
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [total, setTotal] = useState(0);
  const [currency, setCurrency] = useState<'ZAR' | 'USD'>('USD');
  const [activeTab, setActiveTab] = useState<'all' | 'remote' | 'relocation'>('all');

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(data => { if (data.country_code === 'ZA') setCurrency('ZAR'); })
      .catch(() => setCurrency('USD'));
  }, []);

  const fetchJobs = async (tab = 'all', searchQuery = '', loc = '') => {
    setLoading(true);
    try {
      let url = '';
      if (tab === 'remote') {
        url = `/api/remote?query=${encodeURIComponent(searchQuery || 'developer')}`;
      } else if (tab === 'relocation') {
        url = `/api/relocation?query=${encodeURIComponent(searchQuery || 'engineer')}`;
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

  useEffect(() => { fetchJobs('all'); }, []);

  const handleTabChange = (tab: 'all' | 'remote' | 'relocation') => {
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
  } as React.CSSProperties);

  return (
    <main style={{fontFamily:"'Plus Jakarta Sans',sans-serif",background:"#fff",margin:0,padding:0}}>

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
          <a href="#jobs" style={{fontSize:13,color:"#A8D8B0",fontWeight:500,textDecoration:"none"}}>Find jobs</a>
          <a href="#" style={{fontSize:13,color:"#A8D8B0",fontWeight:500,textDecoration:"none"}}>Recruiters</a>
          <a href="#pricing" style={{fontSize:13,color:"#A8D8B0",fontWeight:500,textDecoration:"none"}}>Pricing</a>
          <a href="/sign-in" style={{fontSize:13,color:"#A8D8B0",fontWeight:500,textDecoration:"none"}}>Sign in</a>
          <a href="/sign-up" style={{background:"#C8E600",color:"#052A14",fontSize:13,fontWeight:800,padding:"9px 22px",borderRadius:99,textDecoration:"none"}}>Start free</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{background:"#052A14",padding:"64px 28px 56px",textAlign:"center"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(200,230,0,0.12)",border:"1.5px solid #C8E600",borderRadius:99,padding:"6px 16px",fontSize:11,color:"#C8E600",fontWeight:700,marginBottom:24,letterSpacing:"0.8px"}}>
          <span style={{width:8,height:8,background:"#C8E600",borderRadius:"50%",display:"inline-block",flexShrink:0}}></span>
          OPEN THE DOORS TO YOUR FUTURE — UNLOCKED BY AI
        </div>
        <h1 style={{fontSize:42,fontWeight:800,color:"#FFFFFF",lineHeight:1.1,letterSpacing:-1,marginBottom:10,maxWidth:600,margin:"0 auto 10px"}}>
          Every door. Every <span style={{color:"#C8E600"}}>opportunity.</span> Unlocked.
        </h1>
        <p style={{fontSize:16,color:"#90C898",fontStyle:"italic",marginTop:12,marginBottom:8}}>
          &ldquo;Open sesame — and watch your future open.&rdquo;
        </p>
        <p style={{fontSize:14,color:"#7AAA88",lineHeight:1.8,margin:"8px auto 16px",maxWidth:500}}>
          From Johannesburg to London. Lagos to Toronto. Nairobi to Dubai.<br/>
          <strong style={{color:"#FFFFFF"}}>Your next job has no borders.</strong>
        </p>
        <p style={{fontSize:14,color:"#B0D8B8",lineHeight:1.8,margin:"0 auto 32px",maxWidth:440}}>
          Upload your CV once. AI opens <strong style={{color:"#FFFFFF"}}>{total > 0 ? total.toLocaleString() : '495,000+'} doors worldwide</strong> — matching jobs, rewriting your CV in 30 seconds, and applying automatically.
        </p>
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:40}}>
          <a href="/sign-up" style={{background:"#C8E600",color:"#052A14",fontSize:15,fontWeight:800,padding:"14px 32px",borderRadius:99,textDecoration:"none",display:"inline-block"}}>Open your future — free</a>
          <a href="#jobs" style={{background:"transparent",color:"#C8E600",fontSize:15,fontWeight:500,padding:"14px 24px",borderRadius:99,border:"1.5px solid #1A5A2A",textDecoration:"none",display:"inline-block"}}>Browse jobs now</a>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",maxWidth:440,margin:"0 auto",border:"1px solid #1A5A2A",borderRadius:12,overflow:"hidden"}}>
          {[["2.4M+","LIVE JOBS"],["180+","COUNTRIES"],["30s","CV REWRITE"],["$20","PER MONTH"]].map(([val,label],i)=>(
            <div key={label} style={{padding:"14px 10px",textAlign:"center",borderRight:i<3?"1px solid #1A5A2A":"none"}}>
              <div style={{fontSize:20,fontWeight:800,color:"#C8E600"}}>{val}</div>
              <div style={{fontSize:9,color:"#4A8A5A",letterSpacing:"0.8px",marginTop:2}}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* GOLD BAR */}
      <div style={{background:"#C8E600",padding:"13px 24px",display:"flex",alignItems:"center",justifyContent:"center",gap:24,flexWrap:"wrap"}}>
        {["2.4M+ live jobs worldwide","180+ countries","CV rewritten in 30 seconds","Auto-apply while you sleep","3 free rewrites — no card needed"].map(item=>(
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
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,maxWidth:900,margin:"0 auto"}}>
          {[
            ["1","Upload your CV once","AI reads everything instantly. Extracts your skills, experience and ambitions. Builds your complete global career profile. No forms to fill."],
            ["2","AI opens your matching doors","Platform unlocks millions of live jobs across 180 countries. Shows every role ranked by match percentage with full explanation of why each one fits."],
            ["3","Walk through — apply in seconds","Click any job. AI rewrites your CV in 30 seconds. Download and apply — or let auto-apply send applications while you sleep."]
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
        <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:18,flexWrap:"wrap"}}>
          {(['all','remote','relocation'] as const).map(tab=>(
            <button key={tab} style={tabStyle(tab)} onClick={()=>handleTabChange(tab)}>
              {tab === 'all' ? '🌍 All Jobs' : tab === 'remote' ? '💻 Remote Jobs' : '✈️ Relocation Jobs'}
            </button>
          ))}
        </div>
        <p style={{textAlign:"center",fontSize:12,color:"#5A9A6A",marginBottom:14,fontStyle:"italic"}}>
          {activeTab === 'all' ? 'Browse millions of jobs worldwide' : activeTab === 'remote' ? 'Work from anywhere — worldwide remote positions' : 'Jobs in London, Dubai, Toronto, Singapore and more'}
        </p>
        <form onSubmit={handleSearch} style={{display:"flex",gap:8,flexWrap:"wrap",maxWidth:720,margin:"0 auto"}}>
          <input
            value={query}
            onChange={e=>setQuery(e.target.value)}
            placeholder={activeTab === 'remote' ? "Remote job title or skill..." : activeTab === 'relocation' ? "Job title for abroad..." : "Job title, skill or keyword..."}
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
      <section style={{background:"#F4FCF4",padding:24}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div>
            <span style={{fontSize:15,fontWeight:800,color:"#052A14"}}>
              {activeTab === 'remote' ? 'Remote doors open worldwide' : activeTab === 'relocation' ? 'International doors open for you' : 'Doors open for your profile'}
            </span>
            {activeTab === 'relocation' && <div style={{fontSize:11,color:"#4A8A5A",marginTop:2,fontStyle:"italic"}}>Jobs in London, Dubai, Toronto, Singapore and beyond</div>}
            {activeTab === 'remote' && <div style={{fontSize:11,color:"#4A8A5A",marginTop:2,fontStyle:"italic"}}>Work from anywhere — earn in USD, GBP or EUR</div>}
          </div>
          <span style={{fontSize:12,color:"#052A14",background:"#C8E600",padding:"3px 12px",borderRadius:99,fontWeight:800,whiteSpace:"nowrap"}}>
            {total > 0 ? total.toLocaleString() : '...'} matches
          </span>
        </div>
        {loading ? (
          <div style={{textAlign:"center",padding:"60px 0"}}>
            <div style={{fontSize:16,color:"#2A6A3A",fontWeight:700,marginBottom:8}}>Opening doors for you...</div>
            <div style={{fontSize:13,color:"#4A8A5A"}}>Finding the best opportunities worldwide</div>
          </div>
        ) : jobs.length === 0 ? (
          <div style={{textAlign:"center",padding:"60px 0"}}>
            <div style={{fontSize:16,color:"#2A6A3A",fontWeight:700,marginBottom:8}}>No doors found for that search</div>
            <div style={{fontSize:13,color:"#4A8A5A"}}>Try a different keyword</div>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {jobs.map((job,i)=>(
              <div key={job.id}
                style={{background:i===0?"#FDFFF5":"#fff",border:`1.5px solid ${i===0?"#C8E600":"#D8EED8"}`,borderRadius:14,padding:16,display:"flex",gap:12,cursor:"pointer"}}
                onClick={()=>window.open(job.url,'_blank')}>
                <div style={{width:44,height:44,borderRadius:11,background:"#EAF5EA",color:"#1A5A2A",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,flexShrink:0}}>
                  {job.company.charAt(0).toUpperCase()}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#052A14",marginBottom:2}}>{job.title}</div>
                  <div style={{fontSize:12,color:"#555",marginBottom:8}}>{job.company} · {job.location}</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>
                    <span style={{fontSize:11,padding:"3px 9px",borderRadius:99,fontWeight:600,background:"#EAF5EA",color:"#1A5A2A"}}>{job.location}</span>
                    <span style={{fontSize:11,padding:"3px 9px",borderRadius:99,fontWeight:600,background:"#FDFFF5",color:"#5A7A00",border:"1px solid #C8E600"}}>{job.level}</span>
                    <span style={{fontSize:11,padding:"3px 9px",borderRadius:99,fontWeight:600,background:"#FFF8EC",color:"#7A5000"}}>{job.category}</span>
                    {activeTab === 'remote' && <span style={{fontSize:11,padding:"3px 9px",borderRadius:99,fontWeight:600,background:"#052A14",color:"#C8E600"}}>Remote — work from anywhere</span>}
                    {activeTab === 'relocation' && <span style={{fontSize:11,padding:"3px 9px",borderRadius:99,fontWeight:600,background:"#052A14",color:"#C8E600"}}>Relocation opportunity</span>}
                    {activeTab === 'all' && i===0 && <span style={{fontSize:11,padding:"3px 9px",borderRadius:99,fontWeight:600,background:"#052A14",color:"#C8E600"}}>Open the doors to your future</span>}
                  </div>
                  <p style={{fontSize:12,color:"#666",lineHeight:1.6,margin:0}}>{job.description}</p>
                  {job.salary && <div style={{fontSize:12,color:"#1A6A2A",fontWeight:700,marginTop:6}}>{job.salary}</div>}
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:7,flexShrink:0}}>
                  <button onClick={e=>{e.stopPropagation();window.open(job.url,'_blank');}}
                    style={{background:"#052A14",color:"#C8E600",fontSize:11,fontWeight:800,padding:"6px 14px",borderRadius:99,border:"none",cursor:"pointer",whiteSpace:"nowrap"}}>
                    Unlock now
                  </button>
                  {currency === 'ZAR' && activeTab === 'remote' && <span style={{fontSize:10,color:"#4A8A5A",fontWeight:600,textAlign:"right"}}>Earn in USD/GBP/EUR</span>}
                </div>
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
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:12,maxWidth:800,margin:"0 auto"}}>
          {[
            {name:"Thabo Nkosi",location:"Johannesburg → Standard Bank",quote:"4 months of silence. Jobsesame rewrote my CV and Standard Bank called me within 3 days. The door I thought was locked — was never locked at all.",initials:"TN"},
            {name:"Chioma Okafor",location:"Lagos → Marketing Manager",quote:"The AI completely transformed my CV. I could see exactly which keywords were missing. Got my dream job within 6 weeks.",initials:"CO"},
            {name:"Brian Otieno",location:"Nairobi → Software Developer",quote:"Auto-apply opened 47 doors while I slept. I woke up to 4 recruiter emails. Nothing has ever saved me this much time.",initials:"BO"},
            {name:"Amara Diallo",location:"Dakar → London, UK",quote:"I never thought I could work in London. Jobsesame matched me to a relocation job, rewrote my CV, and I got the offer in 9 days.",initials:"AD"},
          ].map(t=>(
            <div key={t.name} style={{background:"#fff",border:"1.5px solid #D8EED8",borderRadius:14,padding:20}}>
              <div style={{color:"#C8E600",fontSize:13,marginBottom:8,background:"#052A14",width:"fit-content",padding:"3px 10px",borderRadius:99,fontWeight:700}}>★★★★★</div>
              <p style={{fontSize:13,color:"#333",lineHeight:1.7,fontStyle:"italic",marginBottom:14}}>&ldquo;{t.quote}&rdquo;</p>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:36,height:36,borderRadius:"50%",background:"#052A14",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#C8E600",flexShrink:0}}>{t.initials}</div>
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
        <h2 style={{fontSize:32,fontWeight:800,color:"#052A14",marginBottom:8,letterSpacing:-0.5}}>Open sesame —<br/><em style={{fontStyle:"italic"}}>your future is behind this door</em></h2>
        <p style={{fontSize:14,color:"#2A5A14",marginBottom:8,lineHeight:1.6}}>3 free AI CV rewrites. No card needed. No risk. Just open the door.</p>
        <p style={{fontSize:13,color:"#3A6A1A",marginBottom:24}}>Join 50,000+ job seekers who unlocked their careers with Jobsesame.</p>
        <a href="/sign-up" style={{background:"#052A14",color:"#C8E600",fontSize:15,fontWeight:800,padding:"15px 38px",borderRadius:99,textDecoration:"none",display:"inline-block"}}>Open your future — free</a>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{background:"#F4FCF4",padding:"32px 24px"}}>
        <div style={{textAlign:"center",marginBottom:22}}>
          <span style={{background:"#052A14",color:"#C8E600",fontSize:11,fontWeight:800,padding:"4px 14px",borderRadius:99,letterSpacing:"1.5px",textTransform:"uppercase"}}>PRICING</span>
          <h2 style={{fontSize:22,fontWeight:800,color:"#052A14",marginTop:10}}>One price. Every door unlocked. No surprises.</h2>
          <p style={{fontSize:13,color:"#4A7A4A",marginTop:4,fontStyle:"italic"}}>&ldquo;The key to your future should not cost a fortune.&rdquo;</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,maxWidth:800,margin:"0 auto"}}>
          {[
            {name:"Free forever",price:currency==='ZAR'?"R0":"$0",per:"/always",desc:"Browse millions of jobs worldwide. 3 free AI CV rewrites after sharing. Salary data. Application tracker.",popular:false,btn:"Open free"},
            {name:"Pro — All doors open",price:currency==='ZAR'?"R370":"$20",per:"/month",desc:"Unlimited AI CV rewrites. Auto-apply included. Cover letters. Market intelligence. Everything — one price.",popular:true,btn:"Unlock Pro"},
            {name:"Credits pack",price:currency==='ZAR'?"R185":"$10",per:"/pack",desc:"10 AI CV rewrites and cover letters. No expiry. Perfect for occasional job seekers.",popular:false,btn:"Get credits"},
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
      <footer style={{background:"#052A14",padding:"22px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,borderTop:"1px solid #0D4A20"}}>
        <span style={{fontSize:15,fontWeight:800}}>
          <span style={{color:"#FFFFFF"}}>job</span>
          <span style={{color:"#C8E600"}}>sesame</span>
        </span>
        <span style={{fontSize:11,color:"#2A5A3A"}}>Open to the world&apos;s job market — unlocked by AI · jobsesame.co.za</span>
        <span style={{fontSize:13,color:"#C8E600",fontStyle:"italic"}}>&ldquo;Open sesame — your future awaits&rdquo;</span>
      </footer>

    </main>
  );
}
