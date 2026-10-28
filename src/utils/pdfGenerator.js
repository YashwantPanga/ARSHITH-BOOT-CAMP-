import jsPDF from 'jspdf';
import { api } from '../services/api';
import { visualDiagramFor } from '../data/visualDiagrams';
import { drawVisualDiagram, drawWorkflow, measureWorkflow } from './pdfDiagrams';
import { drawCodeCard, drawExplanationPanel } from './pdfCode';
import { normalizeModule } from './normalizeModule';
import { detectLanguage } from './highlight';
import { displayTitle } from './textUtils';
import { latexToText, isMathSpan } from './latexText';

export { latexToText };

// Helper function to sanitize non-ASCII characters & encoding artifacts for jsPDF WinAnsi font
export function cleanText(str) {
  if (!str) return '';
  return String(str)
    // LaTeX maths between $...$ or $$...$$ becomes readable text (prices such as $300 are left alone)
    .replace(/\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g, (m, a, b) => (isMathSpan(a || b) ? latexToText(a || b) : m))
    // Fix existing corruption artifacts
    .replace(/"Çö/g, ' - ')
    .replace(/Çö/g, ' - ')
    .replace(/â€”—/g, ' - ')
    .replace(/â€”/g, ' - ')
    .replace(/â€“/g, ' - ')
    .replace(/â€/g, '')
    // Unicode dashes
    .replace(/[\u2014\u2013\u2012\u2015]/g, ' - ')
    // Unicode quotes
    .replace(/[\u201C\u201D\u201E]/g, '"')
    .replace(/[\u2018\u2019\u201A]/g, "'")
    // Special symbols to ASCII equivalents
    .replace(/\u2022/g, '-')
    .replace(/\u25A0/g, '-')
    .replace(/\u2713/g, 'v')
    .replace(/\u2717/g, 'x')
    .replace(/\u00B0/g, ' deg ')
    .replace(/\u20AC/g, 'EUR')
    .replace(/\u03C0/g, 'pi')
    .replace(/\u00B2/g, '^2')
    .replace(/\u00D7/g, 'x')
    .replace(/\u2248/g, '~=')
    .replace(/\u03C3/g, 'sigma')
    .replace(/[\u2500-\u257F]/g, '-')
    // Unusual whitespace & zero-width spaces
    .replace(/[\u00A0\u200B]/g, ' ')
    // Remove any remaining non-ASCII character safely
    .replace(/[^\x00-\x7F]/g, ' ')
    // Clean up multiple spaces & dash spacing
    .replace(/\s+/g, ' ')
    .replace(/ -\s*- /g, ' - ')
    .trim();
}

/** Like cleanText, but for code: keeps indentation and inner spacing, only replaces characters
 *  the PDF fonts cannot show. */
export function cleanCodeLine(str) {
  return String(str ?? '')
    .replace(/\t/g, '    ')
    .replace(/[—–‒―]/g, '-')
    .replace(/[“”„]/g, '"')
    .replace(/[‘’‚]/g, "'")
    .replace(/→/g, '->').replace(/←/g, '<-')
    .replace(/≥/g, '>=').replace(/≤/g, '<=').replace(/≠/g, '!=')
    .replace(/×/g, 'x').replace(/•/g, '-').replace(/✓/g, 'v').replace(/✗/g, 'x')
    .replace(/[─-╿]/g, '-')
    .replace(/[ ​]/g, ' ')
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/\s+$/, '');
}

/** Loads each module's workflow diagram (same data as the lesson page) and renders it to an image. */
async function prepareWorkflows(course) {
  const out = {};
  await Promise.all((course.modules || []).map(async (mod) => {
    try {
      const res = await api.getModuleEnrichment(course.id, mod.id);
      const wf = res?.enrichment?.workflow;
      if (wf?.nodes?.length) out[mod.id] = { def: wf };
    } catch {
      // No workflow for this module, or it could not be loaded: the PDF simply leaves it out.
    }
  }));
  return out;
}

/**
 * Builds and downloads the course manual. `onProgress({ step, total, label })` is called as the PDF is
 * assembled (used by the download animation); the build yields between modules so the page can repaint.
 */
export async function generateCoursePDF(course, studentName = 'Student', { onProgress } = {}) {
  const totalSteps = (course.modules?.length || 0) + 3;
  const report = async (step, label) => {
    onProgress?.({ step, total: totalSteps, label });
    if (onProgress) await new Promise(r => setTimeout(r, 0));
  };
  await report(0, 'Collecting diagrams');
  const workflows = typeof window !== 'undefined' ? await prepareWorkflows(course) : {};
  await report(1, 'Designing the cover and contents');
  const PDFDoc = (jsPDF && jsPDF.jsPDF) ? jsPDF.jsPDF : jsPDF;
  const doc = new PDFDoc({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true // much smaller files; the syntax-coloured code adds many small text runs
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let y = margin;

  const cleanCourseTitle = cleanText(displayTitle(course.title));
  const cleanStudentName = cleanText(studentName);

  // Helper to add semi-transparent brand watermark
  const addWatermark = (isDarkBg = false) => {
    const centerX = pageWidth / 2;
    const centerY = pageHeight / 2;

    doc.saveGraphicsState();
    if (isDarkBg) {
      if (typeof doc.setGState === 'function') {
        doc.setGState(new doc.GState({ opacity: 0.05 }));
      }
      doc.setTextColor(255, 255, 255);
    } else {
      if (typeof doc.setGState === 'function') {
        doc.setGState(new doc.GState({ opacity: 0.04 }));
      }
      doc.setTextColor(1, 58, 43);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(44);
    doc.text("ARSHITH BOOTCAMP", centerX, centerY - 6, {
      align: "center",
      angle: 35
    });

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    if (!isDarkBg) {
      doc.setTextColor(66, 101, 87);
    } else {
      doc.setTextColor(188, 209, 198);
    }
    doc.text("OFFICIAL COURSE MANUAL - VERIFIED", centerX, centerY + 10, {
      align: "center",
      angle: 35
    });

    doc.restoreGraphicsState();
  };

  // Helper to add header & footer
  let pageCount = 1;
  const addHeaderFooter = (pNum) => {
    addWatermark(false);

    // Header bar
    doc.setFillColor(1, 58, 43); // Forest Green #013A2B
    doc.rect(0, 0, pageWidth, 12, 'F');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("ARSHITH BOOTCAMP - Official Course Manual", margin, 8);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    // Shorten a long course title so it never runs into the left-hand label.
    let headerTitle = cleanCourseTitle;
    const maxHeaderW = contentWidth - doc.getTextWidth("ARSHITH BOOTCAMP - Official Course Manual") * (8 / 9) - 14;
    while (headerTitle.length > 4 && doc.getTextWidth(headerTitle) > maxHeaderW) headerTitle = headerTitle.slice(0, -2);
    if (headerTitle !== cleanCourseTitle) headerTitle = headerTitle.replace(/\s+\S*$/, '') + '...';
    doc.text(headerTitle, pageWidth - margin, 8, { align: "right" });

    // Footer bar
    doc.setDrawColor(228, 224, 215);
    doc.setLineWidth(0.4);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFontSize(8);
    doc.setTextColor(122, 116, 106);
    doc.text("Learn Today, Build Tomorrow  |  arshithgroup.com", margin, pageHeight - 6);
    doc.text(`Page ${pNum}`, pageWidth - margin, pageHeight - 6, { align: "right" });
  };

  const checkPageBreak = (neededHeight = 25) => {
    if (y + neededHeight > pageHeight - 20) {
      doc.addPage();
      pageCount++;
      addHeaderFooter(pageCount);
      y = 25;
      return true;
    }
    return false;
  };

  const INK = [48, 43, 37];
  const MUTED = [122, 116, 106];
  const lineH = (size) => size * 0.3528 * 1.38; // mm between baselines for a font size in pt

  /**
   * Writes wrapped text at the current position, breaking pages between lines.
   * `keep` reserves extra room so a label stays on the same page as the content after it.
   */
  const writeText = (text, { x = margin, width = contentWidth - (x - margin), size = 9, style = "normal", color = INK, font = "helvetica", lh, keep = 0, after = 1 } = {}) => {
    const clean = cleanText(text);
    if (!clean) return;
    doc.setFont(font, style);
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(clean, width);
    const h = lh || lineH(size);
    checkPageBreak(Math.min(lines.length, 2) * h + keep);
    lines.forEach(l => {
      checkPageBreak(h + 1);
      doc.setFont(font, style);
      doc.setFontSize(size);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(l, x, y);
      y += h;
    });
    y += after;
  };
  // A bold label that always stays on the same page as at least a few lines of what follows it.
  const writeLabel = (text, opts = {}) => writeText(text, { size: 8.6, style: "bold", color: [1, 58, 43], keep: 12, after: 0.6, ...opts });

  // Helper for Section Subheading
  const renderSubheading = (title, num = null, color = [30, 81, 65]) => {
    checkPageBreak(45); // keep the heading with the start of its section
    y += 4;
    const tx = num ? margin + 9.5 : margin;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    const lines = doc.splitTextToSize(cleanText(title), contentWidth - (tx - margin));
    if (num) {
      doc.setFillColor(color[0], color[1], color[2]);
      doc.roundedRect(margin, y - 4.6, 7, 6.4, 1.4, 1.4, 'F');
      doc.setFontSize(8.6);
      doc.setTextColor(255, 255, 255);
      doc.text(String(num), margin + 3.5, y - 0.2, { align: "center" });
      doc.setFontSize(12);
    }
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(lines, tx, y);
    y += (lines.length - 1) * 5.4 + 3.2;
    doc.setDrawColor(228, 224, 215);
    doc.setLineWidth(0.3);
    doc.line(margin, y, margin + contentWidth, y);
    y += 5.2;
  };

  // Helper for Text Paragraph
  const renderParagraph = (text, size = 9.5, color = [48, 43, 37], font = "normal") => {
    if (!text) return;
    const clean = cleanText(text);
    doc.setFont("helvetica", font);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(clean, contentWidth);
    const h = lineH(size);

    lines.forEach(line => {
      checkPageBreak(h + 1);
      doc.setFont("helvetica", font);
      doc.setFontSize(size);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(line, margin, y);
      y += h;
    });
    y += 3;
  };

  // Helper for Bullet Point. The marker is drawn as a shape (round dot, or an empty box for
  // checklists "[ ]") and every line of the text hangs at the same indent.
  const renderBullet = (bulletText, indent = 4, bulletChar = "-") => {
    if (!bulletText) return;
    const clean = cleanText(bulletText);
    const size = 9;
    const h = lineH(size);
    const textX = margin + indent + 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(clean, contentWidth - indent - 4);

    lines.forEach((line, idx) => {
      checkPageBreak(h + 1);
      if (idx === 0) {
        if (bulletChar === "[ ]") {
          doc.setDrawColor(66, 101, 87);
          doc.setLineWidth(0.3);
          doc.rect(margin + indent, y - 2.3, 2.4, 2.4, 'S');
        } else {
          doc.setFillColor(66, 101, 87);
          doc.circle(margin + indent + 1, y - 1.1, 0.75, 'F');
        }
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(size);
      doc.setTextColor(48, 43, 37);
      doc.text(line, textX, y);
      y += h;
    });
    y += 1.2;
  };

  // Helper for Code Block (with wrapping and line-by-line support)
  // Code block: an editor-style card (title bar, language tag, line numbers, syntax colours) and,
  // when there is one, a "How this code works" panel with the explanation and line-by-line notes.
  // `language` may be a real language or a role tag ("buggy", "fixed", "solution", "snippet"...).
  const codeCtx = { doc, margin, contentWidth, pageHeight, checkPageBreak, getY: () => y, setY: (v) => { y = v; } };
  const renderCodeBox = (title, codeString, language = "code", explanation = null, lineByLine = null) => {
    const tag = String(language || '').toLowerCase();
    const variant = tag === 'buggy' ? 'buggy' : tag === 'fixed' ? 'fixed' : 'default';
    const realLang = /^(python|py|javascript|js|jsx|typescript|ts|sql|html|css|bash|shell|sh|json|java|go)$/.test(tag)
      ? tag
      : detectLanguage(codeString, '', course.id);
    y += 1.5;
    drawCodeCard(codeCtx, { title, code: codeString, language: realLang, variant });
    if (explanation || (Array.isArray(lineByLine) && lineByLine.length)) {
      drawExplanationPanel(codeCtx, { explanation, lineByLine, heading: variant === 'buggy' ? 'Why this is wrong' : 'How this code works' });
    }
    y += 1.5;
  };

  // Renders the simple Markdown used in some modules' theory/tutorial text: ### headings, bullet and
  // numbered lists, paragraphs, **bold** markers (shown as plain text) and ``` code fences.
  const inlineMd = (t) => String(t).replace(/\*\*(.+?)\*\*/g, '$1').replace(/__(.+?)__/g, '$1').replace(/`([^`]+)`/g, '$1').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');
  const renderMarkdown = (md) => {
    const lines = String(md || '').replace(/\r/g, '').split('\n');
    let para = [];
    const flush = () => { if (para.length) { renderParagraph(inlineMd(para.join(' ')), 9); para = []; } };
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^\s*```/.test(line)) {
        flush();
        const lang = line.replace(/^\s*```/, '').trim();
        const code = [];
        for (i++; i < lines.length && !/^\s*```/.test(lines[i]); i++) code.push(lines[i]);
        renderCodeBox(null, code.join('\n'), lang || 'code');
        continue;
      }
      const h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) {
        flush();
        y += 1.5;
        writeLabel(inlineMd(h[2]), { size: h[1].length <= 2 ? 10.2 : 9.4, keep: 14, after: 1.2 });
        continue;
      }
      const b = line.match(/^(\s*)[-*+]\s+(.*)$/);
      if (b) { flush(); renderBullet(inlineMd(b[2]), b[1].length >= 2 ? 12 : 4, "-"); continue; }
      const n = line.match(/^\s*(\d+)[.)]\s+(.*)$/);
      if (n) {
        flush();
        const size = 9;
        doc.setFont("helvetica", "bold"); doc.setFontSize(size);
        checkPageBreak(lineH(size) + 1);
        doc.setTextColor(66, 101, 87);
        doc.text(`${n[1]}.`, margin + 4, y);
        writeText(inlineMd(n[2]), { x: margin + 10, size, after: 1 });
        continue;
      }
      if (!line.trim()) { flush(); continue; }
      para.push(line.trim());
    }
    flush();
  };

  // Section banner: a filled rounded box whose height follows its (wrapped) title and subtitle.
  const renderBanner = (title, subtitle = null, fill = [1, 58, 43]) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13.5);
    const tLines = doc.splitTextToSize(cleanText(title), contentWidth - 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.6);
    const sLines = subtitle ? doc.splitTextToSize(cleanText(subtitle), contentWidth - 16) : [];
    const h = 9 + tLines.length * 6 + (sLines.length ? sLines.length * 4 + 1.5 : 0) + 2;
    checkPageBreak(h + 10);
    doc.setFillColor(fill[0], fill[1], fill[2]);
    doc.roundedRect(margin, y, contentWidth, h, 3, 3, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13.5);
    doc.setTextColor(255, 255, 255);
    doc.text(tLines, margin + 8, y + 9.5);
    if (sLines.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.6);
      doc.setTextColor(232, 238, 234);
      doc.text(sLines, margin + 8, y + 9.5 + tLines.length * 6 + 0.5);
    }
    y += h + 8;
  };

  // ==========================================
  // COVER PAGE (PAGE 1)
  // ==========================================
  doc.setFillColor(1, 58, 43); // Forest Green #013A2B
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  addWatermark(true);

  // Mint decorative accent bar
  doc.setFillColor(66, 101, 87); // Sage #426557
  doc.rect(margin, 35, 6, 95, 'F');

  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(255, 255, 255);
  doc.text("ARSHITH BOOTCAMP", margin + 14, 47);

  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(188, 209, 198);
  doc.text("Learn Today, Build Tomorrow  |  Official Learning Platform", margin + 14, 57);

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.line(margin + 14, 65, pageWidth - margin, 65);

  const isWebDev = course.id === 'web-development';
  const isAIDataScience = course.id === 'data-science-ai';
  const coverTitleMain = isWebDev
    ? "WEB DEVELOPMENT - COMPLETE COURSE MATERIAL"
    : isAIDataScience
      ? "AI WITH DATA SCIENCE — COMPLETE 15-MODULE COURSE MATERIAL"
      : `COMPLETE COURSE MANUAL:\n${cleanCourseTitle.toUpperCase()}`;

  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  const titleLines = doc.splitTextToSize(coverTitleMain, contentWidth - 20);
  doc.text(titleLines, margin + 14, 80);

  let coverY = 80 + (titleLines.length * 7.5) + 2;
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(205, 199, 187);
  const subtitle = isWebDev
    ? "Comprehensive 15-Module Curriculum | Front-End, Back-End, Databases & Cloud"
    : isAIDataScience
      ? "Comprehensive 15-Module Curriculum | Python, Statistics, Machine Learning, Deep Learning, GenAI & MLOps"
      : `Level: ${cleanText(course.level)} | Duration: ${cleanText(course.duration)} | Modules: ${course.modules.length}`;
  const subtitleLines = doc.splitTextToSize(cleanText(subtitle), contentWidth - 20);
  doc.text(subtitleLines, margin + 14, coverY);
  coverY += subtitleLines.length * 5 + 2;

  doc.setFontSize(9);
  doc.setTextColor(163, 157, 145);
  const authorText = isWebDev
    ? "Chief Architect: Vikramaditya Rao | Arshith Bootcamp Technical Curriculum Board"
    : isAIDataScience
      ? "Chief AI Scientist: Dr. Ananya Sharma | Arshith Bootcamp Advanced AI Research Board"
      : "Chief Architect & Lead Educators | Arshith Bootcamp Technical Curriculum Board";
  doc.text(doc.splitTextToSize(authorText, contentWidth - 20), margin + 14, coverY);

  // Student Enrollment Card Box
  doc.setFillColor(12, 45, 38); // Dark green card
  doc.roundedRect(margin, 160, contentWidth, 54, 4, 4, 'F');
  doc.setDrawColor(66, 101, 87);
  doc.setLineWidth(0.6);
  doc.roundedRect(margin, 160, contentWidth, 54, 4, 4, 'S');

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(188, 209, 198);
  doc.text("OFFICIAL STUDENT CREDENTIAL & ENROLLMENT", margin + 10, 172);

  doc.setFontSize(12.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(doc.splitTextToSize(`Candidate Name: ${cleanStudentName}`, contentWidth - 78)[0], margin + 10, 183);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(228, 224, 215);
  doc.text(`Platform: Arshith Bootcamp Learning Systems`, margin + 10, 193);
  const curriculumSummary = isAIDataScience
    ? "Curriculum: 15 Core Modules + 5 Capstone Projects + 25-Question Certification Exam"
    : "Curriculum: 15 Core Modules + 3 Mini Projects + 1 Capstone + 25-Question Certification Exam";
  doc.text(doc.splitTextToSize(curriculumSummary, contentWidth - 20)[0], margin + 10, 200);
  doc.text(`Export Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, margin + 10, 207);

  // Verification Seal
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(251, 248, 241); // Ivory accent
  doc.setDrawColor(188, 209, 198);
  doc.setLineWidth(0.4);
  doc.roundedRect(pageWidth - margin - 58, 177.5, 50, 8.5, 2, 2, 'S');
  doc.text("VERIFIED OFFICIAL MANUAL", pageWidth - margin - 33, 183, { align: "center" });

  // ==========================================
  // TABLE OF CONTENTS (PAGE 2)
  // ==========================================
  doc.addPage();
  pageCount++;
  addHeaderFooter(pageCount);

  y = 25;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(1, 58, 43);
  doc.text("Table of Contents", margin, y);
  y += 5;

  doc.setDrawColor(66, 101, 87);
  doc.setLineWidth(1);
  doc.line(margin, y, margin + 45, y);
  y += 10;

  // Table of Contents with subtopics
  course.modules.forEach((mod, idx) => {
    const cleanTitle = cleanText(mod.title);
    const cleanDesc = cleanText(mod.description);

    checkPageBreak(26); // keep a contents entry (title, description, topics) together

    const numStr = `Module ${(idx + 1).toString().padStart(2, '0')}`;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(1, 58, 43);
    doc.text(numStr, margin, y);

    const titleLines = doc.splitTextToSize(cleanTitle.replace(/^Module\s*\d+\s*[:\-–—]\s*/i, ''), contentWidth - 32);
    doc.text(titleLines, margin + 28, y);
    y += (titleLines.length * 4.4);

    if (cleanDesc) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(122, 116, 106);
      const descLines = doc.splitTextToSize(cleanDesc, contentWidth - 32);
      doc.text(descLines, margin + 28, y);
      y += (descLines.length * 3.6) + 1.5;
    }

    // List key subtopics: section headings, or the ### headings of Markdown theory text.
    const tocRm = mod.readingMaterial || {};
    const subtopics = (Array.isArray(tocRm.sections) && tocRm.sections.length
      ? tocRm.sections.map(s => s.heading)
      : String(tocRm.theory || '').split('\n').filter(l => /^#{1,4}\s/.test(l)).map(l => l.replace(/^#+\s*/, '').replace(/\*\*/g, ''))
    ).map(t => cleanText(t).replace(/^\d+[.)]\s*/, '')).filter(Boolean).slice(0, 4);
    if (subtopics.length) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(66, 101, 87);
      const subtopicLine = `Core topics: ${subtopics.join('  |  ')}`;
      const wrappedSubtopics = doc.splitTextToSize(subtopicLine, contentWidth - 32);
      wrappedSubtopics.forEach(sl => {
        checkPageBreak(5);
        // A page break redraws the header and changes the font, so set it again for every line.
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7.5);
        doc.setTextColor(66, 101, 87);
        doc.text(sl, margin + 28, y);
        y += 3.6;
      });
      y += 2;
    } else {
      y += 2;
    }
  });

  // Table of Contents - Projects & Certification
  checkPageBreak(25);
  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 81, 65);
  doc.text("Practical Projects & Final Certification Examination", margin, y);
  y += 7;

  const extraSections = isAIDataScience ? [
    { num: "P1.", title: "Capstone Project 1: Real Estate Valuation & Predictive Modeling Engine", desc: "Data Cleaning, Skewness, ColumnTransformer, Ridge/Lasso, and Residual Diagnostics." },
    { num: "P2.", title: "Capstone Project 2: Customer Churn Prediction & Retention Strategy Platform", desc: "Imbalanced Classification, Cost-Sensitive Learning, SMOTE, and Threshold Optimization." },
    { num: "P3.", title: "Capstone Project 3: Customer Segmentation & Market Basket Intelligence", desc: "RFM Vectors, K-Means++, Silhouette Validation, and 2D PCA Manifold Projection." },
    { num: "P4.", title: "Capstone Project 4: NLP Sentiment Analysis & Spam Classification System", desc: "Text Preprocessing, TF-IDF n-grams, Multinomial Naive Bayes, and Calibration." },
    { num: "P5.", title: "Capstone Project 5: AI-Powered Document Question-Answering with RAG", desc: "Text Chunking, Vector Embeddings, Cosine Similarity Index, and Grounded Prompting." },
    { num: "FE1.", title: "Final Certification Exam: Paper 1 (Set A - Data Foundations & Analytics)", desc: "25 Questions covering Python Memory, Vectorization, Cleaning, EDA & Statistical Inference." },
    { num: "FE2.", title: "Final Certification Exam: Paper 2 (Set B - Statistics & Classical ML)", desc: "25 Questions covering Hypothesis Testing, CLT, Pipelines & Regularized Regressions." },
    { num: "FE3.", title: "Final Certification Exam: Paper 3 (Set C - Advanced Supervised & Unsupervised ML)", desc: "25 Questions covering Classification Imbalance, SVM Kernels, K-Means++ & PCA." },
    { num: "FE4.", title: "Final Certification Exam: Paper 4 (Set D - Deep Learning, GenAI & MLOps)", desc: "25 Questions covering Backpropagation, Transformers, Self-Attention, RAG & FastAPI Serving." }
  ] : isWebDev ? [
    { num: "P1.", title: "Mini Project 1: Responsive Product Landing Page & Showcase", desc: "Semantic HTML5, CSS Grid/Flexbox, fluid typography clamp(), mobile-first layout." },
    { num: "P2.", title: "Mini Project 2: Interactive Task & Productivity Dashboard", desc: "Modern JavaScript ES6+, DOM manipulation, drag-and-drop, LocalStorage state." },
    { num: "P3.", title: "Mini Project 3: Full-Stack Course Catalog REST API & Client", desc: "React hooks, Node.js Express backend, REST CRUD endpoints, input validation." },
    { num: "CP.", title: "Enterprise Capstone Project: DevConnect Platform", desc: "Full-Stack social networking, database schema, 12 REST APIs, JWT authentication, Docker." },
    { num: "FE1.", title: "Final Certification Exam: Paper 1 (Set A - Full-Stack Architecture)", desc: "25 Questions covering Internet Fundamentals, HTML5 Semantics, CSS Layouts & JS Engine." },
    { num: "FE2.", title: "Final Certification Exam: Paper 2 (Set B - Frontend Engineering)", desc: "25 Questions covering DOM Events, React Components, Hooks Lifecycle & State Management." },
    { num: "FE3.", title: "Final Certification Exam: Paper 3 (Set C - Backend & Databases)", desc: "25 Questions covering Node.js Event Loop, Express Middleware, REST APIs & SQL Security." },
    { num: "FE4.", title: "Final Certification Exam: Paper 4 (Set D - Production & Security)", desc: "25 Questions covering JWT Tokens, OWASP Web Security, Performance & Cloud Deployment." },
    { num: "RV.", title: "Production Readiness Revision & Pre-Flight Deployment Checklist", desc: "50-point checklist covering a11y, performance, security hardening, and deployment." }
  ] : [
    { num: "P1.", title: "Mini Project 1: Core Practical Application", desc: "Hands-on project applying core curriculum principles." },
    { num: "P2.", title: "Mini Project 2: Intermediate Data Application", desc: "Data processing, algorithms, and practical workflows." },
    { num: "P3.", title: "Mini Project 3: Advanced Pipeline Project", desc: "Full-pipeline production project and portfolio asset." },
    { num: "FE.", title: "Final Certification Examination", desc: "25 Questions comprehensive master certification assessment." }
  ];

  extraSections.forEach(es => {
    checkPageBreak(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(1, 58, 43);
    doc.text(es.num, margin, y);
    const esTitle = doc.splitTextToSize(cleanText(es.title), contentWidth - 12);
    doc.text(esTitle, margin + 12, y);
    y += esTitle.length * 4.2;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(122, 116, 106);
    const descLines = doc.splitTextToSize(cleanText(es.desc), contentWidth - 12);
    doc.text(descLines, margin + 12, y);
    y += (descLines.length * 3.4) + 2.5;
  });

  // ==========================================
  // ALL 15 MODULES DETAILED CONTENT
  // ==========================================
  for (const [modIdx, mod] of (course.modules || []).entries()) {
    await report(2 + modIdx, `Typesetting module ${modIdx + 1} of ${course.modules.length}`);
    // Each module begins on a fresh page
    doc.addPage();
    pageCount++;
    addHeaderFooter(pageCount);
    y = 25;

    const cleanTitle = cleanText(mod.title);
    const cleanDesc = cleanText(mod.description);

    // Module opener: a solid chapter band with the module number, title, description and a summary
    // of what the module contains.
    const openerRm = mod.readingMaterial || {};
    const openerNm = normalizeModule(mod);
    const inside = [
      openerNm.sections.length ? `${openerNm.sections.length} topics` : (openerNm.theoryMarkdown ? 'Concepts' : null),
      (workflows[mod.id] || visualDiagramFor(mod.id)) ? `${(workflows[mod.id] ? 1 : 0) + (visualDiagramFor(mod.id) ? 1 : 0)} figure${(workflows[mod.id] && visualDiagramFor(mod.id)) ? 's' : ''}` : null,
      openerNm.codeExamples.length ? `${openerNm.codeExamples.length} code example${openerNm.codeExamples.length > 1 ? 's' : ''}` : null,
      openerNm.practiceExercise ? 'Practice exercise' : null,
      openerRm.selfAssessment?.questions?.length ? `${openerRm.selfAssessment.questions.length}-question self check` : null
    ].filter(Boolean);
    const modNumber = (cleanTitle.match(/^Module\s*(\d+)/i) || [])[1] || String(modIdx + 1).padStart(2, '0');
    const titleOnly = cleanTitle.replace(/^Module\s*\d+\s*[:\-–—]\s*/i, '');
    const bandInnerW = contentWidth - 16;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    const modTitleLines = doc.splitTextToSize(titleOnly, bandInnerW);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const modDescLines = cleanDesc ? doc.splitTextToSize(cleanDesc, bandInnerW) : [];
    const bandH = 12 + modTitleLines.length * 6.6 + (modDescLines.length ? modDescLines.length * 4.2 + 3 : 0) + (inside.length ? 9 : 0) + 4;

    doc.setFillColor(1, 58, 43);
    doc.roundedRect(margin, y, contentWidth, bandH, 3, 3, 'F');
    doc.setFillColor(66, 101, 87);
    doc.roundedRect(margin, y, 2.2, bandH, 1.1, 1.1, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.4);
    doc.setTextColor(188, 209, 198);
    doc.text(`MODULE ${modNumber}`, margin + 8, y + 8);
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text(modTitleLines, margin + 8, y + 15.5);
    let bandY = y + 15.5 + (modTitleLines.length - 1) * 6.6;
    if (modDescLines.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(214, 229, 221);
      doc.text(modDescLines, margin + 8, bandY + 6);
      bandY += 6 + (modDescLines.length - 1) * 4.2;
    }
    if (inside.length) {
      let cx = margin + 8;
      const cy = bandY + 4.6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.8);
      inside.forEach(label => {
        const w = doc.getTextWidth(label) + 5;
        if (cx + w > margin + contentWidth - 6) return;
        doc.setFillColor(30, 81, 65);
        doc.roundedRect(cx, cy, w, 4.8, 2.4, 2.4, 'F');
        doc.setTextColor(221, 236, 228);
        doc.text(label, cx + w / 2, cy + 3.25, { align: "center" });
        cx += w + 2;
      });
    }

    y += bandH + 9;

    const rm = mod.readingMaterial;
    // Modules store their reading material in a few different shapes; normalise like the lesson page does.
    const nm = normalizeModule(mod);
    let sectionNo = 0;
    const section = (title, color = [30, 81, 65]) => renderSubheading(title, ++sectionNo, color);
    if (rm) {
      // 1. Introduction
      if (rm.introduction) {
        section("Introduction & Overview");
        renderParagraph(rm.introduction);
      }

      // 2. Learning Objectives
      if (rm.objectives && rm.objectives.length > 0) {
        section("Learning Objectives");
        rm.objectives.forEach(obj => renderBullet(obj, 4, "[x]"));
        y += 3;
      }

      // 3. Technical Terminology & Core Definitions
      if (rm.terminology && rm.terminology.length > 0) {
        section("Important Definitions & Technical Terminology");
        rm.terminology.forEach(t => {
          writeLabel(cleanText(t.term), { size: 9, x: margin + 2 });
          writeText(t.definition, { x: margin + 6, size: 8.6, after: 0.4 });
          if (t.importance) writeText(`Significance: ${cleanText(t.importance)}`, { x: margin + 6, size: 8, style: "italic", color: [66, 101, 87], after: 0 });
          y += 2.2;
        });
        y += 2;
      }

      // 4. Visual Diagram & Architecture — the same diagrams the lesson page shows
      const wf = workflows[mod.id];
      const visual = visualDiagramFor(mod.id);
      const dg = nm.diagram;
      // Figures are numbered per module: Figure 7.1, 7.2...
      let figNo = 0;
      const nextFigure = () => `Figure ${modIdx + 1}.${++figNo}`;
      const diagramCtx = { doc, margin, contentWidth, pageHeight, checkPageBreak, renderCodeBox, getY: () => y, setY: (v) => { y = v; } };
      if (dg || wf) {
        // keep the section heading on the same page as the first figure
        checkPageBreak(wf ? Math.min(measureWorkflow(doc, wf.def, contentWidth, pageHeight) + 22, pageHeight - 45) : 70);
        section("Architecture & Visual Workflow Diagram");
        if (wf) drawWorkflow(diagramCtx, wf.def, nextFigure());
      }
      if (dg && visual) {
        drawVisualDiagram(diagramCtx, visual, nextFigure());
        if (dg.explanation) {
          renderParagraph(dg.explanation, 8.6, [93, 87, 78]);
        }
      } else if (dg) {
        checkPageBreak(12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(48, 43, 37);
        if (dg.title) { doc.text(cleanText(dg.title), margin, y); y += 4.5; }

        if (dg.ascii) {
          const asciiLines = dg.ascii.split('\n');
          const cleanAscii = asciiLines.map(l => cleanCodeLine(l));
          const boxH = (cleanAscii.length * 3.5) + 6;

          checkPageBreak(boxH + 4);
          doc.setFillColor(12, 45, 38); // Evergreen #0C2D26
          doc.roundedRect(margin, y, contentWidth, boxH, 2, 2, 'F');

          doc.setFont("courier", "normal");
          doc.setFontSize(7);
          doc.setTextColor(144, 177, 162); // Emerald
          doc.text(cleanAscii, margin + 5, y + 4.5);
          y += boxH + 4;
        }

        if (dg.explanation) {
          renderParagraph(dg.explanation, 8.5, [93, 87, 78], "italic");
        }
      }

      // 5. Detailed Explanations & Core Subtopics
      if (rm.sections && rm.sections.length > 0) {
        section("Detailed Explanations of Every Topic & Subtopic");
        rm.sections.forEach(sec => {
          checkPageBreak(14);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(1, 58, 43);
          const headingLines = doc.splitTextToSize(cleanText(sec.heading), contentWidth);
          doc.text(headingLines, margin, y);
          y += (headingLines.length * 4.5) + 1;

          if (sec.text) {
            renderParagraph(sec.text);
          }

          if (sec.bulletPoints && sec.bulletPoints.length > 0) {
            sec.bulletPoints.forEach(bp => renderBullet(bp, 4, "-"));
            y += 2;
          }

          // Table rendering
          if (sec.table && sec.table.headers && sec.table.rows) {
            checkPageBreak(25);
            const colCount = sec.table.headers.length;
            const colWidth = contentWidth / colCount;
            const drawColumnLines = (top, height) => {
              doc.setDrawColor(228, 224, 215);
              doc.setLineWidth(0.25);
              for (let c = 1; c < colCount; c++) doc.line(margin + c * colWidth, top, margin + c * colWidth, top + height);
            };

            // Table Header (as tall as its longest heading)
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            const headerCells = sec.table.headers.map(h => doc.splitTextToSize(cleanText(h), colWidth - 4));
            const headerH = Math.max(...headerCells.map(l => l.length)) * 3.6 + 3.4;
            doc.setFillColor(239, 244, 241);
            doc.rect(margin, y, contentWidth, headerH, 'F');
            doc.setTextColor(1, 58, 43);
            headerCells.forEach((lines, hIdx) => {
              doc.text(lines, margin + (hIdx * colWidth) + 2, y + 4.4);
            });
            drawColumnLines(y, headerH);
            y += headerH;

            // Table Rows
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(48, 43, 37);

            sec.table.rows.forEach(r => {
              let maxRowHeight = 5.5;
              const formattedCells = r.map(cell => {
                const cellLines = doc.splitTextToSize(cleanText(cell), colWidth - 4);
                maxRowHeight = Math.max(maxRowHeight, (cellLines.length * 3.6) + 3);
                return cellLines;
              });

              checkPageBreak(maxRowHeight + 2);
              doc.setDrawColor(228, 224, 215);
              doc.setLineWidth(0.25);
              doc.rect(margin, y, contentWidth, maxRowHeight, 'S');
              drawColumnLines(y, maxRowHeight);

              doc.setFont("helvetica", "normal");
              doc.setFontSize(8);
              doc.setTextColor(48, 43, 37);
              formattedCells.forEach((cellLines, cIdx) => {
                doc.text(cellLines, margin + (cIdx * colWidth) + 2, y + 4);
              });
              y += maxRowHeight;
            });
            y += 4;
          }

          // Step-by-step lesson extras: syntax, the example, what it produced, and the tip
          if (sec.syntax) renderCodeBox("Syntax", sec.syntax, sec.language || "snippet");
          if (sec.code) renderCodeBox("Example", sec.code, sec.language || "snippet");
          const r = sec.result;
          if (r?.columns?.length) {
            const rows = [r.columns.join(" | "), ...r.rows.map(row => row.map(c => (c === null ? "NULL" : String(c))).join(" | "))];
            if (r.more) rows.push(`... ${r.more} more rows`);
            renderCodeBox("Result", rows.join("\n"), "text");
          }
          if (r?.output || sec.output) renderCodeBox(r?.output ? "Output" : "What you will see", r?.output || sec.output, "text");
          if (r?.image) {
            try {
              const props = doc.getImageProperties(r.image);
              const w = Math.min(contentWidth * 0.75, props.width * 0.26);
              const h = w * (props.height / props.width);
              checkPageBreak(h + 4);
              doc.addImage(r.image, "PNG", margin, y, w, h);
              y += h + 4;
            } catch { /* a chart that cannot be embedded is skipped; the code above still shows it */ }
          }
          if (sec.note) renderParagraph(`Tip: ${sec.note}`);
        });
      }

      if (nm.theoryMarkdown) {
        section("Concepts Explained");
        renderMarkdown(nm.theoryMarkdown);
      }

      // 6. Step-by-Step Practical Tutorials
      // normalizeModule maps every stored step shape onto { step, title, instruction, code, explanation }
      if (nm.tutorials.length > 0) {
        section("Step-by-Step Practical Tutorials");
        nm.tutorials.forEach(tut => {
          const total = tut.steps.length;
          writeLabel(`Tutorial: ${cleanText(tut.title)}`, { size: 9.5, keep: 22, after: 0.6 });
          writeText(`Follow these ${total} step${total === 1 ? '' : 's'} in order. Each step says what to do and why.`, { size: 8, color: [93, 87, 78], after: 1.6 });

          tut.steps.forEach(st => {
            // heading: "Step 2 of 5 - Title" (falls back to the instruction when a step has no title)
            const head = st.title ? cleanText(st.title) : '';
            writeText(`Step ${st.step} of ${total}${head ? ` - ${head}` : ''}`, { x: margin + 3, size: 9, style: "bold", color: [30, 81, 65], keep: 16, after: 0.6 });
            if (st.instruction) writeText(cleanText(st.instruction), { x: margin + 6, size: 8.6, color: INK, after: 1.2 });
            if (st.code) {
              renderCodeBox(head || `Step ${st.step}`, st.code, detectLanguage(st.code, '', course.id), st.explanation);
            } else if (st.explanation) {
              writeText(`Why: ${cleanText(st.explanation)}`, { x: margin + 6, size: 8.2, color: [93, 87, 78], after: 1.4 });
            }
            y += 1.2;
          });
          y += 2;
        });
      }

      if (nm.tutorialMarkdown) {
        section("Step-by-Step Practical Tutorial");
        renderMarkdown(nm.tutorialMarkdown);
      }

      // 7. Syntax & Complete Working Code Examples
      if (rm.codeExamples && rm.codeExamples.length > 0) {
        section("Syntax & Complete Working Code Examples");
        rm.codeExamples.forEach(ex => {
          renderCodeBox(
            ex.title,
            ex.code,
            ex.language || detectLanguage(ex.code, '', course.id),
            ex.explanation,
            ex.lineByLine
          );
        });
      }

      // 8. Common Errors, Debugging Techniques & Solutions
      if (rm.commonErrors && rm.commonErrors.length > 0) {
        section("Common Errors, Debugging Techniques & Solutions", [185, 28, 28]);
        rm.commonErrors.forEach(err => {
          writeLabel(`Error: ${cleanText(err.error)}`, { size: 9, color: [185, 28, 28], keep: 14 });
          writeText(`Root cause: ${cleanText(err.reason)}`, { x: margin + 4, size: 8.6, after: 0.6 });

          if (err.wrongCode) {
            renderCodeBox("Incorrect / Buggy Code", err.wrongCode, "buggy", null);
          }
          if (err.fixCode) {
            renderCodeBox("Correct Solution / Fixed Code", err.fixCode, "fixed", err.explanation);
          }
          y += 2;
        });
      }

      // 8b. Common mistakes stored as a plain list (Python and SQL modules)
      if (nm.commonMistakes.length > 0) {
        section("Common Mistakes & How to Avoid Them", [185, 28, 28]);
        writeText("Watch out for these while you practise - each one is a frequent cause of bugs.", { size: 8, color: [93, 87, 78], after: 1.4 });
        nm.commonMistakes.forEach((cm, i) => {
          if (typeof cm === 'string') { renderBullet(`${i + 1}. ${cm}`, 2, "!"); return; }
          writeLabel(`${i + 1}. ${cleanText(cm.mistake || cm.title || cm.error || '')}`, { size: 9, color: [185, 28, 28], keep: 12 });
          const fix = cm.fix || cm.solution || cm.explanation;
          if (fix) writeText(`How to avoid it: ${cleanText(fix)}`, { x: margin + 4, size: 8.6, after: 1 });
        });
        y += 2;
      }

      // 9. Best Practices & Industry Standards
      if (rm.bestPractices && rm.bestPractices.length > 0) {
        section("Best Practices & Industry Standards", [66, 101, 87]);
        rm.bestPractices.forEach(bp => {
          if (typeof bp === 'string') { renderBullet(bp, 2, "-"); return; }
          writeLabel(cleanText(bp.title), { size: 9, x: margin + 2, color: [66, 101, 87] });
          writeText(bp.rule, { x: margin + 6, size: 8.6, after: 0.4 });
          if (bp.why) writeText(`Rationale: ${cleanText(bp.why)}`, { x: margin + 6, size: 8, style: "italic", color: MUTED, after: 0 });

          if (bp.example) {
            renderCodeBox("Industry Standard Example", bp.example, "best-practice", null);
          }
          y += 2;
        });
      }

      // 10. Hands-on Practice Exercise & Detailed Solution
      const pe = nm.practiceExercise;
      if (pe) {
        section("Hands-On Practice Exercise & Solution", [66, 101, 87]);
        writeLabel(`Exercise: ${cleanText(pe.title)}`, { size: 9.5, color: [66, 101, 87], keep: 14, after: 1.2 });

        renderParagraph(pe.problem, 8.8, [48, 43, 37]);
        if (pe.starterCode) renderCodeBox("Starter code", pe.starterCode, detectLanguage(pe.starterCode, '', course.id));

        if (rm.practiceExercise?.hints && rm.practiceExercise.hints.length > 0) {
          writeLabel("Implementation hints", { x: margin + 2, size: 8.4, color: [66, 101, 87] });
          rm.practiceExercise.hints.forEach(h => renderBullet(h, 4, ">"));
          y += 2;
        }

        if (pe.solutionCode) {
          renderCodeBox("Complete working solution", pe.solutionCode, detectLanguage(pe.solutionCode, '', course.id), rm.practiceExercise?.explanation);
        }
      }

      // 11. Practice Questions with Answers (15 Questions)
      if (rm.practiceQuestions && rm.practiceQuestions.length > 0) {
        section(`Practice Questions & Technical Explanations (${rm.practiceQuestions.length})`);
        rm.practiceQuestions.forEach((pq, pqIdx) => {
          checkPageBreak(28);
          y += 1.5;
          writeLabel(`Practice Question ${pqIdx + 1}`, { size: 9.4, keep: 18 });
          writeText(pq.question, { size: 9, style: "bold", after: 1.2 });
          writeLabel("Answer", { x: margin + 4, size: 8.4, color: [30, 81, 65], keep: 8 });
          writeText(pq.answer, { x: margin + 4, size: 8.6, after: 0.6 });
          if (pq.explanation) writeText(`Concept deep dive: ${cleanText(pq.explanation)}`, { x: margin + 4, size: 8, style: "italic", color: [93, 87, 78], after: 0 });
          y += 3;
        });
        y += 2;
      }

      // 12. Technical Interview Questions & Model Answers (10 Questions)
      if (rm.interviewQuestions && rm.interviewQuestions.length > 0) {
        section(`Technical Interview Questions & Model Answers (${rm.interviewQuestions.length})`);
        rm.interviewQuestions.forEach((iq, iqIdx) => {
          checkPageBreak(28);
          y += 1.5;
          writeLabel(`Interview Question ${iqIdx + 1}`, { size: 9.4, color: [30, 81, 65], keep: 18 });
          writeText(iq.question, { size: 9, style: "bold", after: 1.2 });
          writeLabel("Model answer", { x: margin + 4, size: 8.4, color: [30, 81, 65], keep: 8 });
          writeText(iq.answer, { x: margin + 4, size: 8.6, after: 0.6 });
          if (iq.keyPoints && iq.keyPoints.length > 0) {
            writeLabel("Key talking points", { x: margin + 4, size: 8.2, color: [30, 81, 65] });
            iq.keyPoints.forEach(kp => renderBullet(kp, 6, "*"));
          }
          y += 3;
        });
        y += 2;
      }

      // 13. Practical Mini-Task / Real-World Assignment
      if (nm.miniTasks.length) {
        section(nm.miniTasks.length > 1 ? "Practical Mini-Tasks & Assignments" : "Practical Mini-Task & Assignment");
        nm.miniTasks.forEach((task, tIdx) => {
          if (tIdx > 0) y += 1.5;
          writeLabel(`${nm.miniTasks.length > 1 ? `Task ${tIdx + 1}` : 'Assignment'}: ${cleanText(task.title || '').replace(/^Mini task \d+$/i, '') || 'Practice task'}`, { size: 9.4, keep: 14, after: 1 });
          const brief = task.objective || task.description;
          if (brief) renderParagraph(brief, 8.8, [48, 43, 37]);
          if (task.requirements && task.requirements.length > 0) {
            writeLabel("Task requirements", { color: INK });
            task.requirements.forEach(req => renderBullet(req, 4, "[ ]"));
            y += 1.5;
          }
          if (task.deliverable) writeText(`Deliverable: ${cleanText(task.deliverable)}`, { size: 8.8, style: "bold", color: [66, 101, 87], after: 1.5 });
          if (task.evaluationCriteria && task.evaluationCriteria.length > 0) {
            writeLabel("Grading & evaluation rubric", { color: INK });
            task.evaluationCriteria.forEach(ec => renderBullet(ec, 4, "*"));
            y += 1.5;
          }
        });
      }

      // 14. Module Summary & Key Takeaways
      const sm = nm.summary;
      if (sm.takeaways.length || sm.quickReference.length || sm.text) {
        section("Module Summary & Key Takeaways");
        if (sm.text) renderParagraph(sm.text, 9);
        if (sm.takeaways.length) {
          sm.takeaways.forEach(tk => renderBullet(tk, 4, "-"));
          y += 2;
        }
        if (sm.quickReference.length) {
          writeLabel("Quick reference cheatsheet");
          sm.quickReference.forEach(qr => renderBullet(qr, 4, "-"));
          y += 2;
        }
      }

      // 15. Module Self-Assessment MCQs
      if (rm.selfAssessment && rm.selfAssessment.questions && rm.selfAssessment.questions.length > 0) {
        section(`Module Self-Assessment (${rm.selfAssessment.questions.length} questions)`);
        rm.selfAssessment.questions.forEach((q, qIdx) => {
          checkPageBreak(24);
          writeText(`Q${qIdx + 1}. ${cleanText(q.questionText)}`, { size: 8.8, style: "bold", color: [1, 58, 43], keep: 12, after: 0.8 });

          if (q.codeSnippet) {
            renderCodeBox(null, q.codeSnippet, "snippet", null);
          }

          if (q.options && Array.isArray(q.options)) {
            q.options.forEach((opt, oIdx) => writeText(`${String.fromCharCode(65 + oIdx)})  ${cleanText(opt)}`, { x: margin + 4, size: 8.4, after: 0.2 }));
          }

          if (q.explanation) {
            writeText(`Answer: ${cleanText(q.correctAnswer)}  -  ${cleanText(q.explanation)}`, { x: margin + 4, size: 8, style: "italic", color: [66, 101, 87], after: 0 });
          }
          y += 2.5;
        });
      }

      // References
      if (nm.references.length > 0) {
        y += 2;
        writeLabel("Official references & documentation", { color: MUTED });
        nm.references.forEach(ref => {
          renderBullet(`${ref.title}: ${ref.url}`, 4, "-");
        });
        y += 4;
      }
    }
  }

  await report(totalSteps - 1, 'Adding projects, checklist and summary');

  // ==========================================
  // SECTION: COURSE PRACTICAL PROJECTS (3 MINI PROJECTS)
  // ==========================================
  if (course.projects && course.projects.length > 0) {
    doc.addPage();
    pageCount++;
    addHeaderFooter(pageCount);
    y = 25;

    renderBanner("COURSE PRACTICAL PROJECTS - INDUSTRY ASSIGNMENTS", null, [12, 45, 38]);

    course.projects.forEach((proj, pIdx) => {
      checkPageBreak(30);
      if (pIdx > 0) {
        doc.setDrawColor(228, 224, 215);
        doc.setLineWidth(0.3);
        doc.line(margin, y - 4, margin + contentWidth, y - 4);
      }
      writeText(`Project ${pIdx + 1}: ${cleanText(proj.title.replace(/^Project\s*\d+\s*:\s*/i, ''))}`, { size: 12, style: "bold", color: [1, 58, 43], keep: 14, after: 0.8 });
      if (proj.subtitle) writeText(proj.subtitle, { size: 8.6, style: "bold", color: [66, 101, 87], after: 0.4 });
      if (proj.difficulty || proj.estimatedTime) {
        writeText(`Difficulty: ${cleanText(proj.difficulty || 'Medium')}   |   Duration: ${cleanText(proj.estimatedTime || '8 hours')}`, { size: 8.4, color: MUTED, after: 1.5 });
      }

      renderParagraph(proj.description);

      if (proj.objectives && proj.objectives.length > 0) {
        writeLabel("Core learning objectives", { size: 9, color: [30, 81, 65] });
        proj.objectives.forEach(obj => renderBullet(obj, 4, "[x]"));
        y += 3;
      }

      if (proj.requirements && proj.requirements.length > 0) {
        writeLabel("Technical & architectural requirements", { size: 9, color: INK });
        proj.requirements.forEach(req => renderBullet(req, 4, ">"));
        y += 3;
      }

      if (proj.starterCode) {
        renderCodeBox("Project implementation & starter code", proj.starterCode, detectLanguage(proj.starterCode, '', course.id), null);
      }

      if (proj.expectedOutput) {
        writeLabel("Expected milestone deliverable");
        renderParagraph(proj.expectedOutput, 8.5, [93, 87, 78], "italic");
      }
      y += 8;
    });
  }

  // ==========================================
  // SECTION: ENTERPRISE CAPSTONE PROJECT
  // ==========================================
  if (course.finalProject) {
    doc.addPage();
    pageCount++;
    addHeaderFooter(pageCount);
    y = 25;

    renderBanner("FINAL CAPSTONE PROJECT - PRODUCTION SPECIFICATION");

    const fp = course.finalProject;
    writeText(fp.title, { size: 12.5, style: "bold", color: [1, 58, 43], after: 2 });

    renderParagraph(fp.description);

    if (fp.techStack && fp.techStack.length > 0) {
      renderParagraph(`Full Stack Architecture: ${fp.techStack.join('  |  ')}`, 9, [66, 101, 87], "bold");
    }

    if (fp.requirements && fp.requirements.length > 0) {
      writeLabel("Capstone requirements & modules", { size: 9.4, color: [30, 81, 65] });
      fp.requirements.forEach(req => renderBullet(req, 4, "[ ]"));
      y += 4;
    }

    if (fp.rubric && fp.rubric.length > 0) {
      writeLabel("Evaluation & grading rubric", { size: 9.4, color: INK, keep: 16 });
      fp.rubric.forEach(rb => {
        writeText(`${cleanText(rb.criterion)} (${cleanText(rb.weight)})`, { x: margin + 4, size: 8.6, style: "bold", color: [30, 81, 65], keep: 6, after: 0.3 });
        writeText(rb.description, { x: margin + 6, size: 8.2, color: [93, 87, 78], after: 1.4 });
      });
    }

    // Capstone Database Schema Specifications
    y += 2;
    writeLabel("Capstone data architecture & relational / document schemas", { size: 10, keep: 24 });

    const schemaCode = `// Capstone Database Architecture Specification
// PostgreSQL / MongoDB Schema Models

// 1. Users Collection / Table
// id (UUID / ObjectId PK), username (VARCHAR UNIQUE), email (VARCHAR UNIQUE),
// passwordHash (VARCHAR), role ('student' | 'developer' | 'recruiter'),
// bio (TEXT), avatarUrl (VARCHAR), skills (ARRAY), createdAt (TIMESTAMP)

// 2. Posts & Feeds Collection / Table
// id (UUID PK), authorId (FK -> Users.id), content (TEXT),
// tags (ARRAY), mediaUrl (VARCHAR NULL), likesCount (INT DEFAULT 0),
// commentsCount (INT DEFAULT 0), createdAt (TIMESTAMP)

// 3. Comments Collection / Table
// id (UUID PK), postId (FK -> Posts.id), authorId (FK -> Users.id),
// text (TEXT), createdAt (TIMESTAMP)

// 4. Jobs & Opportunities Collection / Table
// id (UUID PK), recruiterId (FK -> Users.id), title (VARCHAR), company (VARCHAR),
// location (VARCHAR), remote (BOOLEAN), salaryRange (VARCHAR),
// requirements (TEXT), status ('open' | 'closed'), createdAt (TIMESTAMP)

// 5. Job Applications Collection / Table
// id (UUID PK), jobId (FK -> Jobs.id), candidateId (FK -> Users.id),
// resumeUrl (VARCHAR), coverNote (TEXT), status ('submitted' | 'review' | 'accepted' | 'rejected')`;
    renderCodeBox("Relational & NoSQL Schema Models", schemaCode, "schema", null);

    // Capstone REST API Endpoints Table
    y += 2;
    writeLabel("RESTful API endpoint architecture specification", { size: 10, keep: 24 });

    const apiEndpointsCode = `// REST API Routes Specification
// Base URL: /api/v1

// Authentication & Identity
POST   /api/v1/auth/register       -> Create account, returns JWT & user profile
POST   /api/v1/auth/login          -> Verify credentials, returns HttpOnly session cookie
GET    /api/v1/auth/me             -> Current authenticated user profile [Protected]

// Developer Community Feeds
GET    /api/v1/posts               -> Paginated post list with author metadata
POST   /api/v1/posts               -> Publish new post with tags [Protected]
GET    /api/v1/posts/:id           -> Single post with comments tree
DELETE /api/v1/posts/:id           -> Remove post (author or admin only) [Protected]
POST   /api/v1/posts/:id/like      -> Toggle like status [Protected]

// Job Board & Recruiting
GET    /api/v1/jobs                -> Filter jobs by keyword, location, remote status
POST   /api/v1/jobs                -> Post new job listing (recruiter role) [Protected]
POST   /api/v1/jobs/:id/apply      -> Submit job application with resume [Protected]
GET    /api/v1/jobs/:id/applicants -> Review candidate applications [Recruiter Protected]`;
    renderCodeBox("Production REST API Endpoint Matrix", apiEndpointsCode, "api-spec", null);

    if (fp.starterArchitecture) {
      renderCodeBox("Full-stack capstone starter architecture", fp.starterArchitecture, detectLanguage(fp.starterArchitecture, '', course.id), null);
    }
  }

  // ==========================================
  // SECTION: FINAL CERTIFICATION EXAMINATION PAPERS
  // ==========================================
  const questionPapers = (course.finalTest && course.finalTest.questionPapers && course.finalTest.questionPapers.length > 0)
    ? course.finalTest.questionPapers
    : (course.finalTest && course.finalTest.questions)
      ? [{
          id: "qp-default",
          title: "Comprehensive Final Certification Examination (25 Questions)",
          subtitle: "Standard Candidate Question Paper",
          timeLimitMinutes: 45,
          passingScore: 80,
          questions: course.finalTest.questions
        }]
      : [];

  questionPapers.forEach((paper, pIdx) => {
    doc.addPage();
    pageCount++;
    addHeaderFooter(pageCount);
    y = 25;

    renderBanner(
      `Examination Paper ${pIdx + 1}: ${cleanText(paper.title)}`,
      `${cleanText(paper.subtitle || 'Official Question Paper')}   |   Time allowed: ${paper.timeLimitMinutes || 45} minutes   |   Passing score: ${paper.passingScore || 70}%`,
      [66, 101, 87]
    );

    paper.questions.forEach((q, qIdx) => {
      checkPageBreak(26);
      writeLabel(`Question ${qIdx + 1}  -  ${cleanText(q.topic || 'General')}`, { size: 8.8, keep: 16 });
      writeText(q.questionText, { size: 8.8, style: "bold", after: 0.8 });

      if (q.codeSnippet) {
        renderCodeBox(null, q.codeSnippet, "snippet", null);
      }

      if (q.options && Array.isArray(q.options)) {
        q.options.forEach((opt, oIdx) => writeText(`${String.fromCharCode(65 + oIdx)})  ${cleanText(opt)}`, { x: margin + 4, size: 8.4, after: 0.2 }));
      }

      if (q.explanation || q.correctAnswer !== undefined) {
        const answerText = typeof q.correctAnswer === 'number' && Array.isArray(q.options) ? String.fromCharCode(65 + q.correctAnswer) : cleanText(q.correctAnswer);
        writeText(`Answer: ${answerText}${q.explanation ? `  -  ${cleanText(q.explanation)}` : ''}`, { x: margin + 4, size: 8.2, style: "bold", color: [30, 81, 65], after: 0 });
      }
      y += 3.5;
    });
  });

  // ==========================================
  // SECTION: FINAL REVISION & PROJECT CHECKLIST
  // ==========================================
  doc.addPage();
  pageCount++;
  addHeaderFooter(pageCount);
  y = 25;

  renderBanner(isWebDev ? "FINAL REVISION & PRE-FLIGHT DEPLOYMENT CHECKLIST" : "FINAL REVISION CHECKLIST",
    isWebDev ? null : "Tick each point once you can explain it without notes. Built from the key takeaways of every module.");

  // The web checklist is specific to web development; other courses revise their own modules' takeaways.
  const moduleChecklist = (course.modules || []).map((m, i) => {
    const sum = m.readingMaterial?.summary;
    const take = Array.isArray(sum) ? sum : Array.isArray(sum?.takeaways) ? sum.takeaways : [];
    return { category: `${i + 1}. ${cleanText(m.title).replace(/^Module\s*\d+\s*[:\-]\s*/i, '')}`, items: take.slice(0, 3).map(t => (typeof t === 'string' ? t : t?.text || '')).filter(Boolean) };
  }).filter(c => c.items.length);
  const webChecklist = [
    {
      category: "1. HTML5 & Semantic Web Architecture",
      items: [
        "All pages use valid <!DOCTYPE html> with proper lang attribute on <html> element.",
        "Strict semantic tag hierarchy (header, nav, main, article, section, aside, footer).",
        "Unique <h1> per page; logical heading nesting (h1 -> h2 -> h3).",
        "All <img> tags provide descriptive alt text for accessibility and SEO.",
        "Interactive elements (button vs anchor) correctly utilized according to navigation vs action semantics."
      ]
    },
    {
      category: "2. CSS3, Responsive Layout & Performance",
      items: [
        "Mobile-first responsive media queries configured with flexible unit systems (rem, em, clamp).",
        "CSS Grid and Flexbox layouts tested across 320px mobile to 4K ultra-wide monitors.",
        "Color contrast ratios meet WCAG AA/AAA guidelines (minimum 4.5:1 for body copy).",
        "Critical CSS prioritized; external web fonts loaded with font-display: swap.",
        "Transitions and micro-interactions optimized via transform and opacity GPU layers."
      ]
    },
    {
      category: "3. JavaScript ES6+ & Asynchronous State",
      items: [
        "Zero global variable leakage; strict scoping using let and const exclusively.",
        "All asynchronous Promise flows encapsulated with try/catch or .catch() handlers.",
        "Event listeners cleaned up on unmount to prevent severe browser memory leaks.",
        "User inputs sanitized and validated both client-side and server-side.",
        "Browser LocalStorage/SessionStorage data parsed safely with fallback error handling."
      ]
    },
    {
      category: "4. Backend APIs & Database Architecture",
      items: [
        "RESTful API endpoints follow consistent HTTP methods (GET, POST, PUT/PATCH, DELETE).",
        "Centralized Express error-handling middleware catches all uncaught exceptions.",
        "Database connections managed through connection pooling with automatic retry policies.",
        "Database indexes created for all foreign keys, lookup fields, and unique email constraints.",
        "Input schemas strictly validated via Joi or Zod before hitting business logic."
      ]
    },
    {
      category: "5. Production Security & Cloud Deployment",
      items: [
        "Passwords hashed using bcrypt with salt rounds >= 10; never stored in plaintext.",
        "JWT tokens stored in secure, HttpOnly, SameSite cookies to mitigate XSS and CSRF.",
        "CORS restricted to authorized client domains; Helmet.js security headers enabled.",
        "Environment variables (.env) isolated; production API keys excluded from version control.",
        "CI/CD automated testing pipeline configured and verified before production release."
      ]
    }
  ];

  const checklistCategories = isWebDev || !moduleChecklist.length ? webChecklist : moduleChecklist;
  checklistCategories.forEach(cat => {
    writeLabel(cat.category, { size: 9.8, color: [30, 81, 65], keep: 14, after: 1 });
    cat.items.forEach(item => {
      renderBullet(item, 4, "[ ]");
    });
    y += 3;
  });

  // ==========================================
  // FINAL COMPLETION SUMMARY PAGE
  // ==========================================
  doc.addPage();
  pageCount++;
  addHeaderFooter(pageCount);
  y = 35;

  doc.setFillColor(1, 58, 43);
  doc.roundedRect(margin, y, contentWidth, 140, 4, 4, 'F');

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text("COURSE COMPLETION SUMMARY", margin + 15, y + 25);

  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(188, 209, 198);
  doc.text(doc.splitTextToSize(`Congratulations on completing the entire ${cleanCourseTitle} curriculum!`, contentWidth - 30), margin + 15, y + 36);

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.line(margin + 15, y + 45, pageWidth - margin - 15, y + 45);

  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`Student Name: ${cleanStudentName}`, margin + 15, y + 58);
  doc.text(doc.splitTextToSize(`Course Title: ${cleanCourseTitle}`, contentWidth - 30)[0], margin + 15, y + 68);
  doc.text(`Modules Completed: ${course.modules.length} / ${course.modules.length} Modules (100% Comprehensive)`, margin + 15, y + 78);
  const portfolioText = isAIDataScience
    ? `Practical Portfolio: 5 End-to-End Capstone Projects Completed`
    : isWebDev
      ? `Practical Portfolio: 3 Mini Projects + 1 Enterprise Capstone Completed`
      : `Practical Portfolio: ${course.projects?.length || 3} Mini Projects`;
  doc.text(portfolioText, margin + 15, y + 88);
  doc.text(`Certification Assessment: 25-question proctored final (70% to pass)`, margin + 15, y + 98);
  doc.text(`Official Issuer: Arshith Bootcamp Platform (arshithgroup.com)`, margin + 15, y + 108);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(251, 248, 241); // Ivory accent
  doc.text("VERIFIED OFFICIAL COURSE DOCUMENT", margin + 15, y + 124);

  await report(totalSteps, 'Saving your PDF');

  if (typeof doc.save === 'function' && typeof window !== 'undefined') {
    const filename = isWebDev
      ? 'ArshithBootcamp_Web_Development_Complete_Course.pdf'
      : isAIDataScience
        ? 'ArshithBootcamp_AI_With_Data_Science_Complete_Course.pdf'
        : `ArshithBootcamp_${course.id}_Complete_Course.pdf`;
    doc.save(filename);
  }

  return doc;
}

export function generateQuestionPaperPDF(course, paper) {
  const PDFDoc = (jsPDF && jsPDF.jsPDF) ? jsPDF.jsPDF : jsPDF;
  const doc = new PDFDoc({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  const margin = 15;
  const y = margin;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(1, 58, 43);
  doc.text(cleanText(paper.title || "Examination Paper"), margin, y + 10);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Candidate: ${cleanText(paper.studentName || 'Student')} | Roll No: ${cleanText(paper.rollNo || 'N/A')}`, margin, y + 18);
  doc.text(`Course: ${cleanText(course.title || 'Course')}`, margin, y + 24);
  const filename = `${paper.id || 'question-paper'}.pdf`;
  if (typeof doc.save === 'function' && typeof window !== 'undefined') {
    doc.save(filename);
  }
  return doc;
}
