'use client';
import { useEffect, useState } from 'react';
import QuickApply from '../components/QuickApply';

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
}

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('jobsesame_saved_jobs');
    if (saved) setSavedJobs(JSON.parse(saved));
  }, []);

  const removeJob = (id: number) => {
    const updated = savedJobs.filter(j => j.id !== id);
    setSavedJobs(updated);
    localStorage.setItem('jobsesame_saved_jobs', JSON.stringify(updated));
  };

  return (
    <main style={{fontFamily:"'Plus Jakarta Sans',sans-serif",background:"#052A14",minHeight:"100vh"}}>
      {selectedJob && <QuickApply job={selectedJob} onClose={() => setSelectedJob(null)} />}

      <nav style={{background:"#052A14",padding:"0 24px",height:64,display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #0D4A20",position:"sticky",top:0,zIndex:100}}>
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
          <a href="/" style={{fontSize:13,color:"#A8D8B0",fontWeight:500,textDecoration:"none"}}>Find jobs</a>
          <a href="/optimise" style={{fontSize:13,color:"#A8D8B0",fontWeight:500,textDecoration:"none"}}>CV Optimiser</a>
          <a href="/dashboard" style={{fontSize:13,color:"#A8D8B0",fontWeight:500,textDecoration:"none"}}>Dashboard</a>
        </div>
      </nav>

      <div style={{maxWidth:900,margin:"0 auto",padding:"40px 24px"}}>
        <div style={{marginBottom:28}}>
          <h1 style={{fontSize:28,fontWeight:800,color:"#FFFFFF",marginBottom:6}}>
            Saved jobs <span style={{color:"#C8E600"}}>({savedJobs.length})</span>
          </h1>
          <p style={{fontSize:14,color:"#5A9A6A"}}>Jobs you bookmarked — apply when you are ready.</p>
        </div>

        {savedJobs.length === 0 ? (
          <div style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:16,padding:48,textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:16}}>🔖</div>
            <h2 style={{fontSize:18,fontWeight:800,color:"#FFFFFF",marginBottom:8}}>No saved jobs yet</h2>
            <p style={{fontSize:14,color:"#5A9A6A",marginBottom:24}}>Click the bookmark icon on any job card to save it here.</p>
            <a href="/" style={{background:"#C8E600",color:"#052A14",fontSize:14,fontWeight:800,padding:"12px 28px",borderRadius:99,textDecoration:"none",display:"inline-block"}}>
              Browse jobs
            </a>
          </div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {savedJobs.map((job) => (
              <div key={job.id} style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:14,padding:16,display:"flex",gap:12}}>
                <div style={{width:44,height:44,borderRadius:11,background:"#EAF5EA",color:"#1A5A2A",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,flexShrink:0}}>
                  {job.company.charAt(0).toUpperCase()}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:14,fontWeight:700,color:"#FFFFFF",marginBottom:2}}>{job.title}</div>
                  <div style={{fontSize:12,color:"#5A9A6A",marginBottom:8}}>{job.company} · {job.location}</div>
                  <p style={{fontSize:12,color:"#3A7A4A",lineHeight:1.6,margin:0}}>{job.description?.slice(0,120)}...</p>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:8,flexShrink:0}}>
                  <button onClick={() => setSelectedJob(job)}
                    style={{background:"#C8E600",color:"#052A14",fontSize:11,fontWeight:800,padding:"8px 14px",borderRadius:99,border:"none",cursor:"pointer",whiteSpace:"nowrap"}}>
                    ⚡ Quick Apply
                  </button>
                  <button onClick={() => window.open(job.url, '_blank')}
                    style={{background:"transparent",color:"#5A9A6A",fontSize:11,fontWeight:600,padding:"6px 14px",borderRadius:99,border:"1px solid #1A5A2A",cursor:"pointer",whiteSpace:"nowrap"}}>
                    View job
                  </button>
                  <button onClick={() => removeJob(job.id)}
                    style={{background:"transparent",color:"#A32D2D",fontSize:11,fontWeight:600,padding:"6px 14px",borderRadius:99,border:"1px solid #A32D2D",cursor:"pointer",whiteSpace:"nowrap"}}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
