import Nav from '../components/Nav';
import Footer from '../components/Footer';
import BlogFilter from './BlogFilter';
import { PAPER, INK, SANS } from '../lib/theme';

export const metadata = {
  title: 'Career Insights | Jobsesame',
  description: 'Expert advice to help you get hired faster — CV tips, salary guides, and relocation resources.',
};

export default function BlogPage() {
  return (
    <main style={{ fontFamily: SANS, background: PAPER, color: INK, minHeight: '100vh', margin: 0 }}>
      <Nav theme="light" />
      <BlogFilter />
      <Footer theme="light" />
    </main>
  );
}
