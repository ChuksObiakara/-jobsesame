export default function AboutPage() {
  return (
    <main style={{fontFamily:"'Plus Jakarta Sans',sans-serif",background:"#052A14",minHeight:"100vh"}}>

      {/* NAV */}
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
          <a href="/#jobs" style={{fontSize:13,color:"#A8D8B0",fontWeight:500,textDecoration:"none"}}>Find jobs</a>
          <a href="/#pricing" style={{fontSize:13,color:"#A8D8B0",fontWeight:500,textDecoration:"none"}}>Pricing</a>
          <a href="/sign-up" style={{background:"#C8E600",color:"#052A14",fontSize:13,fontWeight:800,padding:"9px 22px",borderRadius:99,textDecoration:"none"}}>Start free</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{background:"#052A14",padding:"72px 24px 56px",textAlign:"center",borderBottom:"1px solid #0D4A20"}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:8,background:"rgba(200,230,0,0.12)",border:"1.5px solid #C8E600",borderRadius:99,padding:"5px 16px",fontSize:11,color:"#C8E600",fontWeight:700,marginBottom:24,letterSpacing:"1px"}}>
          OUR STORY
        </div>
        <h1 style={{fontSize:40,fontWeight:800,color:"#FFFFFF",lineHeight:1.1,letterSpacing:-1,maxWidth:640,margin:"0 auto 20px"}}>
          Built in Africa.<br/>
          <span style={{color:"#C8E600"}}>Open to the world.</span>
        </h1>
        <p style={{fontSize:16,color:"#90C898",maxWidth:520,margin:"0 auto",lineHeight:1.8}}>
          We believe where you were born should never limit where you can work. Jobsesame exists to make that true.
        </p>
      </section>

      <div style={{maxWidth:800,margin:"0 auto",padding:"56px 24px"}}>

        {/* ORIGIN STORY */}
        <div style={{marginBottom:48}}>
          <div style={{display:"flex",alignItems:"flex-start",gap:20,marginBottom:32}}>
            <div style={{width:48,height:48,background:"#C8E600",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🌍</div>
            <div>
              <h2 style={{fontSize:22,fontWeight:800,color:"#FFFFFF",marginBottom:12}}>The problem we saw every day</h2>
              <p style={{fontSize:14,color:"#90C898",lineHeight:1.9,marginBottom:12}}>
                In Johannesburg, Lagos, Nairobi, Accra, and Cape Town — brilliant, hardworking people were spending hours sending CVs into silence. Not because they lacked talent, but because the job market was built for someone else. CVs optimised for London. Job boards designed for the US. AI tools priced for Silicon Valley salaries.
              </p>
              <p style={{fontSize:14,color:"#90C898",lineHeight:1.9}}>
                A developer in Lagos with ten years of experience was competing against a LinkedIn-optimised profile from San Francisco, with the same recruiter algorithm making the call. The game was rigged — not by malice, but by neglect. Africa was an afterthought.
              </p>
            </div>
          </div>

          <div style={{display:"flex",alignItems:"flex-start",gap:20,marginBottom:32}}>
            <div style={{width:48,height:48,background:"#C8E600",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>💡</div>
            <div>
              <h2 style={{fontSize:22,fontWeight:800,color:"#FFFFFF",marginBottom:12}}>The idea behind the name</h2>
              <p style={{fontSize:14,color:"#90C898",lineHeight:1.9,marginBottom:12}}>
                Open sesame. The magic words that open the door to hidden treasure. We chose that name deliberately — because for too long, the global job market has been a locked cave. The right password, the right contacts, the right university on your CV. If you had them, the doors opened. If you did not, they stayed shut.
              </p>
              <p style={{fontSize:14,color:"#90C898",lineHeight:1.9}}>
                Jobsesame is the magic words. The AI key that opens every door — regardless of where you grew up, what school you attended, or which city you live in.
              </p>
            </div>
          </div>

          <div style={{display:"flex",alignItems:"flex-start",gap:20}}>
            <div style={{width:48,height:48,background:"#C8E600",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🚀</div>
            <div>
              <h2 style={{fontSize:22,fontWeight:800,color:"#FFFFFF",marginBottom:12}}>What we built</h2>
              <p style={{fontSize:14,color:"#90C898",lineHeight:1.9,marginBottom:12}}>
                We built an AI job platform that does in 30 seconds what used to take hours. Upload your CV once. Our AI reads everything — your skills, your experience, your ambition — and rebuilds it specifically for each job you apply to, optimised for ATS systems and human recruiters alike.
              </p>
              <p style={{fontSize:14,color:"#90C898",lineHeight:1.9}}>
                We then give you access to millions of live jobs across 180 countries — remote positions, relocation opportunities, teaching roles abroad — and let you apply with one click. The CV is already rewritten. The door is already open.
              </p>
            </div>
          </div>
        </div>

        {/* MISSION STATEMENT */}
        <div style={{background:"#C8E600",borderRadius:20,padding:"40px 36px",marginBottom:48,textAlign:"center"}}>
          <div style={{fontSize:11,fontWeight:800,color:"#1A4A00",letterSpacing:"2px",textTransform:"uppercase",marginBottom:16}}>OUR MISSION</div>
          <p style={{fontSize:22,fontWeight:800,color:"#052A14",lineHeight:1.4,maxWidth:560,margin:"0 auto",letterSpacing:-0.3}}>
            To democratise access to the global job market — so that talent from Johannesburg competes equally with talent from London.
          </p>
        </div>

        {/* VALUES */}
        <div style={{marginBottom:48}}>
          <h2 style={{fontSize:22,fontWeight:800,color:"#FFFFFF",marginBottom:24,textAlign:"center"}}>What we stand for</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16}}>
            {[
              {
                icon:"🌍",
                title:"Africa first",
                body:"We built for Johannesburg, Lagos, Nairobi, Accra, and Kampala before anywhere else. Our platform understands African job markets, African qualifications, and African career paths — while also opening doors to the entire world.",
              },
              {
                icon:"⚖️",
                title:"Equal access",
                body:"A brilliant engineer in Kigali deserves the same shot at a London tech role as someone who went to Oxford. AI is the great equaliser. We put it in the hands of the people who need it most.",
              },
              {
                icon:"🔓",
                title:"No gatekeeping",
                body:"No recruiters to impress. No premium tiers that lock out the people who can least afford them. Three free applications, no card needed, because your first step into the global market should not cost you anything.",
              },
              {
                icon:"🤖",
                title:"AI that serves you",
                body:"Our AI does not just match keywords. It understands what makes you exceptional and communicates it in the language employers respond to. Every rewrite is specific to the job. Every application is your best application.",
              },
            ].map(v => (
              <div key={v.title} style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:16,padding:24}}>
                <div style={{fontSize:28,marginBottom:12}}>{v.icon}</div>
                <div style={{fontSize:15,fontWeight:800,color:"#FFFFFF",marginBottom:8}}>{v.title}</div>
                <p style={{fontSize:13,color:"#5A9A6A",lineHeight:1.8,margin:0}}>{v.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* BY THE NUMBERS */}
        <div style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:20,padding:"36px 32px",marginBottom:48}}>
          <h2 style={{fontSize:18,fontWeight:800,color:"#FFFFFF",marginBottom:28,textAlign:"center"}}>Opening doors across Africa and beyond</h2>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:0}}>
            {[
              {val:"2.4M+",label:"Live jobs worldwide"},
              {val:"180+",label:"Countries covered"},
              {val:"30s",label:"Average CV rewrite"},
              {val:"50K+",label:"Job seekers helped"},
            ].map((stat,i)=>(
              <div key={stat.label} style={{textAlign:"center",padding:"16px 8px",borderRight:i<3?"1px solid #1A4A2A":"none"}}>
                <div style={{fontSize:26,fontWeight:800,color:"#C8E600",marginBottom:4}}>{stat.val}</div>
                <div style={{fontSize:11,color:"#3A7A4A",fontWeight:600,lineHeight:1.4}}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* WHO WE SERVE */}
        <div style={{marginBottom:48}}>
          <h2 style={{fontSize:22,fontWeight:800,color:"#FFFFFF",marginBottom:8,textAlign:"center"}}>Built for people who were being ignored</h2>
          <p style={{fontSize:14,color:"#5A9A6A",textAlign:"center",marginBottom:28,fontStyle:"italic"}}>If this sounds like you, Jobsesame was made for you.</p>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {[
              {city:"🇿🇦 Johannesburg",desc:"A software developer tired of local salary ceilings, ready to work remotely for a London or New York company — but no one is seeing their CV."},
              {city:"🇳🇬 Lagos",desc:"A marketing manager with a decade of results who wants a shot at a senior role in Dubai or Toronto, but the ATS system keeps rejecting their application before a human ever reads it."},
              {city:"🇰🇪 Nairobi",desc:"A finance professional who knows they are ready for a global career but has no idea how to position their experience for international recruiters."},
              {city:"🇬🇭 Accra",desc:"A recent graduate who cannot afford to pay a CV writer R2,000 to rewrite their CV for every application — but needs every application to be their best."},
              {city:"🌍 Anywhere in Africa",desc:"Anyone who is brilliant, ambitious, and has been told in a thousand small ways that global opportunities are for other people. They are not. Not anymore."},
            ].map(p=>(
              <div key={p.city} style={{background:"#072E16",border:"1.5px solid #1A4A2A",borderRadius:14,padding:20,display:"flex",gap:16,alignItems:"flex-start"}}>
                <div style={{fontSize:22,flexShrink:0,marginTop:2}}>{p.city.split(' ')[0]}</div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:"#C8E600",marginBottom:4}}>{p.city.substring(p.city.indexOf(' ')+1)}</div>
                  <p style={{fontSize:13,color:"#90C898",lineHeight:1.7,margin:0}}>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{background:"#C8E600",borderRadius:20,padding:"40px 32px",textAlign:"center"}}>
          <h2 style={{fontSize:24,fontWeight:800,color:"#052A14",marginBottom:8}}>Your door is open. Walk through it.</h2>
          <p style={{fontSize:14,color:"#2A5A14",marginBottom:24,lineHeight:1.7}}>
            Three free Quick Apply credits. AI CV rewrite included. No card needed. No excuses.
          </p>
          <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
            <a href="/sign-up" style={{background:"#052A14",color:"#C8E600",fontSize:14,fontWeight:800,padding:"13px 32px",borderRadius:99,textDecoration:"none",display:"inline-block"}}>
              Open your future — free
            </a>
            <a href="/" style={{background:"transparent",color:"#052A14",fontSize:14,fontWeight:600,padding:"13px 24px",borderRadius:99,border:"2px solid #052A14",textDecoration:"none",display:"inline-block"}}>
              Browse jobs
            </a>
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <footer style={{borderTop:"1px solid #0D4A20",padding:"28px 24px",textAlign:"center"}}>
        <div style={{display:"flex",justifyContent:"center",gap:24,flexWrap:"wrap",marginBottom:16}}>
          <a href="/" style={{fontSize:13,color:"#3A7A4A",textDecoration:"none"}}>Home</a>
          <a href="/privacy" style={{fontSize:13,color:"#3A7A4A",textDecoration:"none"}}>Privacy Policy</a>
          <a href="/terms" style={{fontSize:13,color:"#3A7A4A",textDecoration:"none"}}>Terms of Service</a>
          <a href="mailto:hello@jobsesame.co.za" style={{fontSize:13,color:"#3A7A4A",textDecoration:"none"}}>Contact</a>
        </div>
        <span style={{fontSize:11,color:"#1A4A2A"}}>© 2025 Jobsesame. All rights reserved.</span>
      </footer>

    </main>
  );
}
