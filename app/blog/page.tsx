import NavSA from '../components/NavSA';
import BlogFilter from './BlogFilter';

export const metadata = {
  title: 'Career Insights | Jobsesame',
  description: 'Expert advice to help you get hired faster — CV tips, salary guides, and relocation resources.',
};

export default function BlogPage() {
  return (
    <main style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: '#F4FCF4', minHeight: '100vh', margin: 0 }}>
      <NavSA />
      <BlogFilter />
      <footer style={{ background: '#052A14', borderTop: '1px solid #0D4A20', padding: '24px', textAlign: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 800 }}>
          <span style={{ color: '#FFFFFF' }}>job</span>
          <span style={{ color: '#C8E600' }}>sesame</span>
        </span>
        <div style={{ fontSize: 11, color: '#1A4A2A', marginTop: 8 }}>© 2025 Jobsesame</div>
      </footer>
    </main>
  );
}
