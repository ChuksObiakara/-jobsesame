// ── Server-side PDF generation ─────────────────────────────────────────────
// Builds CV and cover-letter PDFs using jsPDF in the Node runtime (no DOM
// needed for the text/rect operations this file uses). Generating the PDF on
// the server and streaming it back with a Content-Disposition: attachment
// header is what makes downloads reliable on iOS/mobile Safari — a client
// built Blob + synthetic <a> click is known to silently fail there because
// the click fires asynchronously, after the page's "user activation" window
// has expired. A real HTTP response with Content-Disposition is honoured by
// every platform's native download handling instead.

import { jsPDF } from 'jspdf';

export interface PdfExperience {
  title?: string;
  company?: string;
  duration?: string;
  bullets?: string[];
}

export interface PdfCV {
  name?: string;
  title?: string;
  location?: string;
  email?: string;
  phone?: string;
  summary?: string;
  skills?: string[];
  experience?: PdfExperience[];
  education?: string;
  languages?: string[];
}

export function buildCvPdf(cv: PdfCV): Uint8Array {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = 0;

  doc.setFillColor(28, 26, 22);
  doc.rect(0, 0, pageW, 44, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text(cv.name || '', margin, 17);
  doc.setFontSize(12);
  doc.setTextColor(200, 200, 195);
  doc.text(cv.title || '', margin, 27);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(210, 210, 205);
  doc.text([cv.location, cv.email, cv.phone].filter(Boolean).join('   ·   '), margin, 37);
  y = 54;

  const sectionHeader = (title: string) => {
    if (y > 268) { doc.addPage(); y = 18; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(28, 26, 22);
    doc.text(title.toUpperCase(), margin, y);
    doc.setDrawColor(28, 26, 22);
    doc.line(margin, y + 1.5, pageW - margin, y + 1.5);
    y += 7;
  };

  if (cv.summary) {
    sectionHeader('Professional Summary');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    const lines = doc.splitTextToSize(cv.summary, contentW) as string[];
    doc.text(lines, margin, y);
    y += lines.length * 5.2 + 8;
  }

  if (cv.skills?.length) {
    sectionHeader('Skills');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    const skillLines = doc.splitTextToSize(cv.skills.join('   ·   '), contentW) as string[];
    doc.text(skillLines, margin, y);
    y += skillLines.length * 5.2 + 8;
  }

  if (cv.experience?.length) {
    sectionHeader('Experience');
    cv.experience.forEach((exp) => {
      if (y > 268) { doc.addPage(); y = 18; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(28, 26, 22);
      doc.text(exp.title || '', margin, y);
      y += 5.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(`${exp.company || ''}   ·   ${exp.duration || ''}`, margin, y);
      y += 5;
      (exp.bullets || []).forEach((b) => {
        if (y > 275) { doc.addPage(); y = 18; }
        doc.setFontSize(9);
        doc.setTextColor(50, 50, 50);
        const bLines = doc.splitTextToSize(`•  ${b}`, contentW - 4) as string[];
        doc.text(bLines, margin + 2, y);
        y += bLines.length * 4.6;
      });
      y += 6;
    });
  }

  if (cv.education) {
    if (y > 262) { doc.addPage(); y = 18; }
    sectionHeader('Education');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.text(cv.education, margin, y);
    y += 11;
  }

  if (cv.languages?.length) {
    if (y > 268) { doc.addPage(); y = 18; }
    sectionHeader('Languages');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.text(cv.languages.join('   ·   '), margin, y);
  }

  return new Uint8Array(doc.output('arraybuffer'));
}

export interface PdfCoverLetter {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  bodyText: string;
}

export function buildCoverLetterPdf(data: PdfCoverLetter): Uint8Array {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(data.name || '', margin, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const contactParts = [data.email, data.phone, data.location].filter(Boolean);
  doc.text(contactParts.join('  |  '), margin, 27);

  doc.setDrawColor(180, 180, 180);
  doc.line(margin, 31, pageWidth - margin, 31);

  doc.setFontSize(11);
  const lines = doc.splitTextToSize(data.bodyText || '', maxWidth) as string[];
  doc.text(lines, margin, 40);

  return new Uint8Array(doc.output('arraybuffer'));
}
