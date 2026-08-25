import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { INK, INK_SOFT, INK_FAINT, LINE, PAPER, CARD, ACCENT, SERIF, SANS } from '../lib/theme';

export default function AboutPage() {
  return (
    <main style={{ fontFamily: SANS, background: PAPER, color: INK, minHeight: '100vh' }}>
      <Nav theme="light" />

      {/* HERO */}
      <section style={{ padding: '72px 24px 56px', textAlign: 'center', borderBottom: `1px solid ${LINE}` }}>
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: INK_FAINT, marginBottom: 24 }}>Our story</p>
        <h1 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 'clamp(30px, 5vw, 44px)', lineHeight: 1.15, maxWidth: 640, margin: '0 auto 20px' }}>
          Built in Africa. Open to the world.
        </h1>
        <p style={{ fontSize: 16, color: INK_SOFT, maxWidth: 520, margin: '0 auto', lineHeight: 1.75 }}>
          We believe where you were born should never limit where you can work. Jobsesame exists to make that true.
        </p>
      </section>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '64px 24px' }}>

        {/* ORIGIN STORY */}
        <div style={{ marginBottom: 56, borderTop: `1px solid ${LINE}` }}>
          {[
            {
              n: '01',
              title: 'The problem we saw every day',
              body: [
                'In Johannesburg, Lagos, Nairobi, Accra, and Cape Town — brilliant, hardworking people were spending hours sending CVs into silence. Not because they lacked talent, but because the job market was built for someone else. CVs formatted for London. AI tools priced for Silicon Valley salaries.',
                'A developer in Lagos with ten years of experience was competing against a polished, well-tailored CV from San Francisco, with the same ATS software making the call. The game was rigged — not by malice, but by neglect. Africa was an afterthought.',
              ],
            },
            {
              n: '02',
              title: 'The idea behind the name',
              body: [
                'Open sesame. The magic words that open the door to hidden treasure. We chose that name deliberately — because for too long, getting a CV in front of the right person has depended on the right password, the right contacts, the right university on your CV.',
                'Jobsesame is the magic words. The AI key that rewrites your CV to open doors — regardless of where you grew up, what school you attended, or which city you live in.',
              ],
            },
            {
              n: '03',
              title: 'What we built',
              body: [
                'We built an AI tool that does in 30 seconds what used to take hours, or cost money you didn’t have. Upload your CV once. Paste the job description for any role you’re applying to. Our AI rewrites your CV specifically for that job — optimised to pass ATS screening and read well to the human on the other side.',
                'Every rewrite comes with a matching cover letter and an ATS-ready PDF, ready to attach to the application. The CV is rewritten. The door is open — you take it from there.',
              ],
            },
          ].map(section => (
            <div key={section.n} style={{ display: 'grid', gridTemplateColumns: '56px 1fr', gap: 24, padding: '32px 0', borderBottom: `1px solid ${LINE}` }}>
              <span style={{ fontFamily: SERIF, fontSize: 15, color: INK_FAINT }}>{section.n}</span>
              <div>
                <h2 style={{ fontSize: 19, fontWeight: 600, marginBottom: 14 }}>{section.title}</h2>
                {section.body.map((p, i) => (
                  <p key={i} style={{ fontSize: 14.5, color: INK_SOFT, lineHeight: 1.8, marginBottom: i < section.body.length - 1 ? 12 : 0 }}>{p}</p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* MISSION STATEMENT */}
        <div style={{ borderTop: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}`, padding: '48px 0', marginBottom: 56, textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: INK_FAINT, marginBottom: 18 }}>Our mission</p>
          <p style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 26, lineHeight: 1.45, maxWidth: 560, margin: '0 auto' }}>
            To democratise access to the global job market — so that a CV from Johannesburg competes equally with a CV from London.
          </p>
        </div>

        {/* VALUES */}
        <div style={{ marginBottom: 56 }}>
          <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 26, marginBottom: 32, textAlign: 'center' }}>What we stand for</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 0, borderTop: `1px solid ${LINE}`, borderLeft: `1px solid ${LINE}` }}>
            {[
              { title: 'Africa first', body: 'We built for Johannesburg, Lagos, Nairobi, Accra, and Kampala before anywhere else. Jobsesame understands African qualifications and career paths, while opening doors to the entire world.' },
              { title: 'Equal access', body: 'A brilliant engineer in Kigali deserves the same shot at a London tech role as someone who went to Oxford. AI is the great equaliser. We put it in the hands of the people who need it most.' },
              { title: 'No gatekeeping', body: 'No premium tiers that lock out the people who can least afford them. Three free CV rewrites, no card needed, because your first step into the global market should not cost you anything.' },
              { title: 'AI that serves you', body: 'Our AI does not just match keywords. It understands what makes your experience exceptional and communicates it the way employers respond to. Every rewrite is specific to the job you’re applying for.' },
            ].map(v => (
              <div key={v.title} style={{ borderRight: `1px solid ${LINE}`, borderBottom: `1px solid ${LINE}`, padding: 28 }}>
                <div style={{ fontSize: 15.5, fontWeight: 600, marginBottom: 10 }}>{v.title}</div>
                <p style={{ fontSize: 13.5, color: INK_SOFT, lineHeight: 1.75, margin: 0 }}>{v.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* BY THE NUMBERS */}
        <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 4, padding: '36px 32px', marginBottom: 56 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, textAlign: 'center', marginBottom: 28, color: INK_SOFT }}>Opening doors across Africa and beyond</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
            {[
              ['30s', 'Average CV rewrite'],
              ['90%+', 'ATS pass rate after rewrite'],
              ['11×', 'More interviews vs. a generic CV'],
              ['3', 'Free rewrites to start, no card'],
            ].map(([val, label], i) => (
              <div key={label} style={{ textAlign: 'center', padding: '0 8px', borderRight: i < 3 ? `1px solid ${LINE}` : 'none' }}>
                <div style={{ fontFamily: SERIF, fontSize: 26, marginBottom: 6 }}>{val}</div>
                <div style={{ fontSize: 11.5, color: INK_FAINT, lineHeight: 1.4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* WHO WE SERVE */}
        <div style={{ marginBottom: 56 }}>
          <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 26, marginBottom: 8, textAlign: 'center' }}>Built for people who were being ignored</h2>
          <p style={{ fontSize: 14, color: INK_FAINT, textAlign: 'center', marginBottom: 32, fontStyle: 'italic' }}>If this sounds like you, Jobsesame was made for you.</p>
          <div style={{ borderTop: `1px solid ${LINE}` }}>
            {[
              { city: 'Johannesburg', desc: 'A software developer tired of local salary ceilings, ready to work remotely for a London or New York company — but their CV keeps getting filtered out before anyone reads it.' },
              { city: 'Lagos', desc: 'A marketing manager with a decade of results who wants a shot at a senior role abroad, but the ATS system rejects their application before a human ever sees it.' },
              { city: 'Nairobi', desc: 'A finance professional who knows they’re ready for a global career but has no idea how to position their experience for international recruiters.' },
              { city: 'Accra', desc: 'A recent graduate who can’t afford to pay a CV writer for every application — but needs every application to be their best.' },
              { city: 'Anywhere in Africa', desc: 'Anyone who is brilliant, ambitious, and has been told in a thousand small ways that global opportunities are for other people. They are not. Not anymore.' },
            ].map(p => (
              <div key={p.city} style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 20, padding: '20px 0', borderBottom: `1px solid ${LINE}` }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: ACCENT }}>{p.city}</div>
                <p style={{ fontSize: 13.5, color: INK_SOFT, lineHeight: 1.75, margin: 0 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 48, textAlign: 'center' }}>
          <h2 style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 26, marginBottom: 10 }}>Your door is open. Walk through it.</h2>
          <p style={{ fontSize: 14.5, color: INK_SOFT, marginBottom: 28, lineHeight: 1.7 }}>
            Three free AI CV rewrites. No card needed.
          </p>
          <a href="/sign-up" style={{ background: ACCENT, color: PAPER, fontSize: 14, fontWeight: 600, padding: '14px 32px', borderRadius: 3, textDecoration: 'none', display: 'inline-block' }}>
            Start free
          </a>
        </div>

      </div>

      <Footer theme="light" />
    </main>
  );
}
