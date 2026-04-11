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
}

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [total, setTotal] = useState(0);
  const [currency, setCurrency] = useState<'ZAR' | 'USD'>('USD');

  useEffect(() => {
    // Detect user location for currency
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(data => {
        if (data.country_code === 'ZA') setCurrency('ZAR');
      })
      .catch(() => setCurrency('USD'));
  }, []);

  const formatSalary = (amount: number | null) => {
    if (!amount) return null;
    if (currency === 'ZAR') {
      const rand = amount * 18.5;
      return `R${Math.round(rand).toLocaleString()}`;
    }
    return `$${Math.round(amount).toLocaleString()}`;
  };

  const fetchJobs = async (searchQuery = '', loc = '') => {
    setLoading(true);
    try {
      const q = searchQuery || 'software engineer';
      const res = await fetch(`/api/jobs?query=${encodeURIComponent(q)}&location=${encodeURIComponent(loc)}`);
      const data = await res.json();
      setJobs(data.jobs || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
    setLoading(false);
  };

  useEffect(() => { fetchJobs(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchJobs(query, location);
  };

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
        <div style={{display:"flex",gap:20,alignItems:"center"}}>
          <a href="#jobs" style={{fontSize:13,color:"#A8D8B0",fontWeight:500,textDecoration:"none"}}>Find jobs</a>
          <a href="#" style={{fontSize:13,color:"#A8D8B0",fontWeight:500,textDecoration:"none"}}>Recruiters</a>
          <a href="#pricing" style={{fontSize:13,color:"#A8D8B0",fontWeight:500,textDecoration:"none"}}>Pricing</a>
          <button style={{background:"#C8E600",color:"#052A14",fontSize:13,fontWeight:800,padding:"9px 22px",borderRadius:99,border:"none",cursor:"pointer"}}>Start free</button>
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
        <p style={{fontSize:14,color:"#7AAA88",lineHeight:1.8,marginBottom:10,maxWidth:500,margin:"8px auto 16px"}}>
          From Johannesburg to London. Lagos to Toronto. Nairobi to Dubai.<br/>
          <strong style={{color:"#FFFFFF"}}>Your next job has no borders.</strong>
        </p>
        <p style={{fontSize:14,color:"#B0D8B8",lineHeight:1.8,marginBottom:32,maxWidth:440,margin:"0 auto 32px"}}>
          Upload your CV once. AI opens <strong style={{color:"#FFFFFF"}}>{total > 0 ? total.toLocaleString() : '495,000+'} doors worldwide</strong> — matching jobs, rewriting your CV in 30 seconds, and applying automatically.
        </p>
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:40}}>
          <button style={{background:"#C8E600",color:"#052A14",fontSize:15,fontWeight:800,padding:"14px 32px",borderRadius:99,border:"none",cursor:"pointer"}}>Open your future — free</button>
          <button style={{background:"transparent",color:"#C8E600",fontSize:15,fontWeight:500,padding:"14px 24px",borderRadius:99,border:"1.5px solid #1A5A2A",cursor:"pointer"}}>See how it works</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:0,maxWidth:440,margin:"0 auto",border:"1px solid #1A5A2A",borderRadius:12,overflow:"hidden"}}>
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
            ["1","Upload your CV once","AI reads everything instantly. Extracts your skills, experience and ambitions. Builds your complete global career profile automatically. No forms to fill."],
            ["2","AI opens your matching doors","Platform unlocks millions of live jobs across 180 countries. Shows every role ranked by match percentage with full explanation of why each one fits you."],
            ["3","Walk through — apply in seconds","Click any job. AI rewrites your CV for that specific role in 30 seconds. Download and apply — or let auto-apply send applications while you sleep."]
          ].map(([num,title,desc])=>(
            <div key={num} style={{background:"#072E16",border:"1px solid #1A4A2A",borderRadius:14,padding:20}}>
              <div style={{width:32,height:32,background:"#C8E600",color:"#052A14",fontSize:13,fontWeight:800,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14}}>{num}</div>
              <div style={{fontSize:14,fontWeight:700,color:"#FFFFFF",marginBottom:7}}>{title}</div>
              <div style={{fontSize:12,color:"#3A7A4A",lineHeight:1.7}}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* SEARCH — visible border and contrast */}
      <div style={{background:"#052A14",padding:"24px",borderTop:"1px solid #0D4A20",borderBottom:"4px solid #C8E600"}} id="jobs">
        <p style={{textAlign:"center",fontSize:13,color:"#C8E600",fontWeight:700,marginBottom:14,letterSpacing:"0.5px"}}>SEARCH {total > 0 ? total.toLocaleString() : '495,000+'} LIVE JOBS WORLDWIDE</p>
        <form onSubmit={handleSearch} style={{display:"flex",gap:8,flexWrap:"wrap",maxWidth:720,margin:"0 auto"}}>
          <input
            value={query}
            onChange={e=>setQuery(e.target.value)}
            placeholder="Job title, skill or keyword..."
            style={{flex:1,minWidth:140,padding:"13px 18px",border:"2px solid #C8E600",borderRadius:11,fontSize:14,color:"#052A14",fontWeight:600,outline:"none",background:"#fff"}}
          />
          <select
            value={location}
            onChange={e=>setLocation(e.target.value)}
            style={{padding:"13px 14px",border:"2px solid #C8E600",borderRadius:11,fontSize:13,color:"#052A14",fontWeight:600,outline:"none",background:"#fff"}}>
            <option value="">Worldwide</option>
            <option value="South Africa">South Africa</option>
            <option value="Nigeria">Nigeria</option>
            <option value="Kenya">Kenya</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="United States">United States</option>
            <option value="Canada">Canada</option>
            <option value="Australia">Australia</option>
            <option value="Remote">Remote only</option>
          </select>
          <button type="submit" style={{background:"#C8E600",color:"#052A14",fontSize:14,fontWeight:800,padding:"13px 28px",borderRadius:11,border:"none",cursor:"pointer",whiteSpace:"nowrap"}}>
            {loading ? 'Searching...' : 'Open the doors'}
          </button>
        </form>
      </div>

      {/* JOBS LIST */}
      <section style={{background:"#F4FCF4",padding:24}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <span style={{fontSize:15,fontWeight:800,color:"#052A14"}}>Doors open for your profile</span>
          <span style={{fontSize:12,color:"#052A14",background:"#C8E600",padding:"3px 12px",borderRadius:99,fontWeight:800}}>
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
            <div style={{fontSize:13,color:"#4A8A5A"}}>Try a different keyword or location</div>
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
                    {i===0&&<span style={{fontSize:11,padding:"3px 9px",borderRadius:99,fontWeight:600,background:"#052A14",color:"#C8E600"}}>Open the doors to your future</span>}
                  </div>
                  <p style={{fontSize:12,color:"#666",lineHeight:1.6,margin:0}}>{job.description}</p>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:7,flexShrink:0}}>
                  <button
                    onClick={e=>{e.stopPropagation();window.open(job.url,'_blank');}}
                    style={{background:"#052A14",color:"#C8E600",fontSize:11,fontWeight:800,padding:"6px 14px",borderRadius:99,border:"none",cursor:"pointer",whiteSpace:"nowrap"}}>
                    Unlock now
                  </button>
                  {currency === 'ZAR' && (
                    <span style={{fontSize:10,color:"#4A8A5A",fontWeight:600}}>Showing in ZAR</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section style={{background:"#C8E600",padding:"44px 24px",textAlign:"center"}}>
        <p style={{fontSize:11,fontWeight:700,color:"#1A4A00",letterSpacing:"2px",textTransform:"uppercase",marginBottom:10}}>YOUR TURN</p>
        <h2 style={{fontSize:32,fontWeight:800,color:"#052A14",marginBottom:8,letterSpacing:-0.5}}>Open sesame —<br/><em style={{fontStyle:"italic"}}>your future is behind this door</em></h2>
        <p style={{fontSize:14,color:"#2A5A14",marginBottom:24,lineHeight:1.6}}>3 free AI CV rewrites. No card needed. No risk. Just open the door.<br/>Join 50,000+ job seekers who unlocked their careers with Jobsesame.</p>
        <button style={{background:"#052A14",color:"#C8E600",fontSize:15,fontWeight:800,padding:"15px 38px",borderRadius:99,border:"none",cursor:"pointer"}}>Open your future — free</button>
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
              <button style={{width:"100%",background:p.popular?"#C8E600":"#052A14",color:p.popular?"#052A14":"#C8E600",fontSize:12,fontWeight:800,padding:10,borderRadius:99,border:"none",cursor:"pointer"}}>{p.btn}</button>
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
