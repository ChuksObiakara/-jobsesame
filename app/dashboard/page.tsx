'use client';
import { useUser, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [cvData, setCvData] = useState<any>(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

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
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file only');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('cv', file);
      const response = await fetch('/api/cv', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        setCvData(data.cvData);
      } else {
        setError(data.error || 'Failed to process CV');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setUploading(false);
    }
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
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <a href="/" style={{fontSize:13,color:"#A8D8B0",fontWeight:500,textDecoration:"none"}}>Find jobs</a>
          <UserButton afterSignOutUrl="/" />
        </div>
      </nav>

      <div style={{padding:"48px 24px",maxWidth:900,margin:"0 auto"}}>
        <div style={{marginBottom:32}}>
          <h1 style={{fontSize:28,fontWeight:800,color:"#FFFFFF",marginBottom:8}}>
            Welcome, <span style={{color:"#C8E600"}}>{user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0]}</span>
          </h1>
          <p style={{fontSize:14,color:"#5A9A6A",fontStyle:"italic"}}>
            &ldquo;Your door is open — let&apos;s find what&apos;s behind it.&rdquo;
          </p>
        </div>

        {!cvData ? (
          <div>
            <div style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:16,padding:32,marginBottom:24,textAlign:"center"}}>
              <div style={{fontSize:40,marginBottom:16}}>📄</div>
              <h2 style={{fontSize:20,fontWeight:800,color:"#FFFFFF",marginBottom:8}}>Upload your CV</h2>
              <p style={{fontSize:14,color:"#5A9A6A",marginBottom:24,maxWidth:400,margin:"0 auto 24px"}}>
                Upload your CV once. AI reads everything and builds your complete career profile in seconds.
              </p>
              <div
                onDrop={handleDrop}
                onDragOver={e=>{e.preventDefault();setDragOver(true);}}
                onDragLeave={()=>setDragOver(false)}
                style={{
                  border:`2px dashed ${dragOver ? '#C8E600' : '#1A5A2A'}`,
                  borderRadius:14,
                  padding:"40px 24px",
                  marginBottom:16,
                  background:dragOver ? 'rgba(200,230,0,0.05)' : 'transparent',
                  transition:"all 0.2s",
                  cursor:"pointer",
                }}>
                <div style={{fontSize:13,color:"#5A9A6A",marginBottom:12}}>
                  {uploading ? 'Reading your CV...' : 'Drag and drop your CV here'}
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
                    <div style={{fontSize:14,color:"#C8E600",fontWeight:700,marginBottom:8}}>AI is reading your CV...</div>
                    <div style={{fontSize:12,color:"#5A9A6A"}}>This takes about 10 seconds</div>
                  </div>
                )}
              </div>
              {error && (
                <div style={{background:"rgba(163,45,45,0.2)",border:"1px solid #A32D2D",borderRadius:10,padding:"10px 16px",fontSize:13,color:"#F09595",marginBottom:16}}>
                  {error}
                </div>
              )}
              <div style={{fontSize:11,color:"#3A7A4A"}}>PDF only · Maximum 10MB · Your CV is processed securely</div>
            </div>

            <div style={{background:"#072E16",border:"1.5px solid #C8E600",borderRadius:14,padding:20,marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:"#FFFFFF",marginBottom:4}}>
                  You have <span style={{color:"#C8E600"}}>3 free AI CV rewrites</span>
                </div>
                <div style={{fontSize:12,color:"#5A9A6A"}}>Share with 3 friends to unlock 10 more free rewrites.</div>
              </div>
              <button style={{background:"#C8E600",color:"#052A14",fontSize:12,fontWeight:800,padding:"8px 20px",borderRadius:99,border:"none",cursor:"pointer",whiteSpace:"nowrap"}}>
                Share and unlock more
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{background:"#072E16",border:"1.5px solid #C8E600",borderRadius:16,padding:28,marginBottom:24}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12}}>
                <div>
                  <h2 style={{fontSize:20,fontWeight:800,color:"#FFFFFF",marginBottom:4}}>{cvData.name || 'Your profile'}</h2>
                  <div style={{fontSize:13,color:"#C8E600",fontWeight:600}}>{cvData.title}</div>
                  <div style={{fontSize:12,color:"#5A9A6A",marginTop:2}}>{cvData.location}</div>
                </div>
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  <button onClick={()=>setCvData(null)} style={{background:"transparent",color:"#5A9A6A",fontSize:12,fontWeight:600,padding:"7px 16px",borderRadius:99,border:"1px solid #1A5A2A",cursor:"pointer"}}>
                    Upload new CV
                  </button>
                  <a href="/" style={{background:"#C8E600",color:"#052A14",fontSize:12,fontWeight:800,padding:"7px 16px",borderRadius:99,textDecoration:"none",display:"inline-block"}}>
                    Find matching jobs
                  </a>
                </div>
              </div>
              {cvData.summary && (
                <p style={{fontSize:13,color:"#A8D8B0",lineHeight:1.7,marginBottom:20,fontStyle:"italic"}}>
                  &ldquo;{cvData.summary}&rdquo;
                </p>
              )}
              <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16}}>
                <div>
                  <div style={{fontSize:11,color:"#3A7A4A",fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",marginBottom:8}}>Skills</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {cvData.skills?.map((skill: string) => (
                      <span key={skill} style={{background:"#0D4A20",color:"#90C898",fontSize:11,padding:"3px 10px",borderRadius:99,fontWeight:600}}>
                        {skill}
                      </span>
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

            <div style={{background:"#C8E600",borderRadius:14,padding:20,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12,marginBottom:16}}>
              <div>
                <div style={{fontSize:15,fontWeight:800,color:"#052A14",marginBottom:4}}>Ready to rewrite your CV for any job</div>
                <div style={{fontSize:12,color:"#2A5A14"}}>AI rewrites your CV in 30 seconds. You have 3 free rewrites.</div>
              </div>
              <button style={{background:"#052A14",color:"#C8E600",fontSize:13,fontWeight:800,padding:"10px 24px",borderRadius:99,border:"none",cursor:"pointer",whiteSpace:"nowrap"}}>
                Rewrite my CV — free
              </button>
            </div>

            <div style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:14,padding:20,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:"#FFFFFF",marginBottom:4}}>Unlock Pro — all doors open</div>
                <div style={{fontSize:12,color:"#5A9A6A"}}>Unlimited rewrites. Auto-apply. Cover letters. Everything for $20/month.</div>
              </div>
              <button style={{background:"#C8E600",color:"#052A14",fontSize:13,fontWeight:800,padding:"10px 24px",borderRadius:99,border:"none",cursor:"pointer",whiteSpace:"nowrap"}}>
                Upgrade to Pro
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
