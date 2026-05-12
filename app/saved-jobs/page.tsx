'use client';
import { useEffect, useState } from 'react';
import QuickApply, { isAutoApply } from '../components/QuickApply';
import NavSA from '../components/NavSA';
import FooterSA from '../components/FooterSA';

interface Job {
  id: string | number;
  dbId?: string;
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

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    fetch('/api/user/saved-jobs')
      .then(r => r.json())
      .then(d => {
        const dbJobs: Job[] = (d.savedJobs || []).map((s: any) => ({
          id: s.id,
          dbId: s.id,
          title: s.jobTitle,
          company: s.company,
          location: s.location || '',
          description: (s.jobData as Record<string, unknown>)?.description as string || '',
          url: s.jobUrl,
          category: (s.jobData as Record<string, unknown>)?.category as string || '',
          level: (s.jobData as Record<string, unknown>)?.level as string || '',
          salary: (s.jobData as Record<string, unknown>)?.salary as string,
        }));
        if (dbJobs.length > 0) {
          setSavedJobs(dbJobs);
          localStorage.setItem('jobsesame_saved_jobs', JSON.stringify(dbJobs));
        } else {
          const local = localStorage.getItem('jobsesame_saved_jobs');
          if (local) setSavedJobs(JSON.parse(local));
        }
      })
      .catch(() => {
        const local = localStorage.getItem('jobsesame_saved_jobs');
        if (local) setSavedJobs(JSON.parse(local));
      });
  }, []);

  const removeJob = (job: Job) => {
    const updated = savedJobs.filter(j => String(j.id) !== String(job.id));
    setSavedJobs(updated);
    localStorage.setItem('jobsesame_saved_jobs', JSON.stringify(updated));
    fetch('/api/user/saved-jobs', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job.dbId ? { jobId: job.dbId } : { jobUrl: job.url }),
    }).catch((err) => console.error('[saved-jobs] unsave failed:', err));
  };

  return (
    <main style={{fontFamily:"'Plus Jakarta Sans',sans-serif",background:"#061A0C",minHeight:"100vh"}}>
      {selectedJob && <QuickApply job={selectedJob} onClose={() => setSelectedJob(null)} />}

      <NavSA />

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
                    {isAutoApply(job.url, job.type) ? '⚡ Quick Apply' : 'Apply'}
                  </button>
                  <button onClick={() => window.open(job.url, '_blank')}
                    style={{background:"transparent",color:"#5A9A6A",fontSize:11,fontWeight:600,padding:"6px 14px",borderRadius:99,border:"1px solid #1A5A2A",cursor:"pointer",whiteSpace:"nowrap"}}>
                    View job
                  </button>
                  <button onClick={() => removeJob(job)}
                    style={{background:"transparent",color:"#A32D2D",fontSize:11,fontWeight:600,padding:"6px 14px",borderRadius:99,border:"1px solid #A32D2D",cursor:"pointer",whiteSpace:"nowrap"}}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <FooterSA />
    </main>
  );
}
