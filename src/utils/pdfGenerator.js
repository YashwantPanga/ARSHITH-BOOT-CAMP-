import jsPDF from 'jspdf';
import { api } from '../services/api';
import { visualDiagramFor } from '../data/visualDiagrams';
import { drawVisualDiagram, drawWorkflow, workflowToPng } from './pdfDiagrams';

// Helper function to sanitize non-ASCII characters & encoding artifacts for jsPDF WinAnsi font
export function cleanText(str) {
  if (!str) return '';
  return String(str)
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

/** Loads each module's workflow diagram (same data as the lesson page) and renders it to an image. */
async function prepareWorkflows(course) {
  const out = {};
  await Promise.all((course.modules || []).map(async (mod) => {
    try {
      const res = await api.getModuleEnrichment(course.id, mod.id);
      const wf = res?.enrichment?.workflow;
      if (wf?.nodes?.length) out[mod.id] = { def: wf, png: await workflowToPng(wf) };
    } catch {
      // No workflow for this module, or it could not be loaded: the PDF simply leaves it out.
    }
  }));
  return out;
}

export async function generateCoursePDF(course, studentName = 'Student') {
  const workflows = typeof window !== 'undefined' ? await prepareWorkflows(course) : {};
  const PDFDoc = (jsPDF && jsPDF.jsPDF) ? jsPDF.jsPDF : jsPDF;
  const doc = new PDFDoc({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let y = margin;

  const cleanCourseTitle = cleanText(course.title);
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
        doc.setGState(new doc.GState({ opacity: 0.06 }));
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
    doc.text(cleanCourseTitle, pageWidth - margin, 8, { align: "right" });

    // Footer bar
    doc.setDrawColor(228, 224, 215);
    doc.setLineWidth(0.4);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFontSize(8);
    doc.setTextColor(122, 116, 106);
    doc.text("Learn Today, Build Tomorrow * www.arshithbootcamp.com", margin, pageHeight - 6);
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

  // Helper for Section Subheading
  const renderSubheading = (title, num = null, color = [30, 81, 65]) => {
    checkPageBreak(22);
    y += 2;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.setTextColor(color[0], color[1], color[2]);
    const headingText = num ? `${num}. ${cleanText(title)}` : cleanText(title);
    doc.text(headingText, margin, y);
    y += 6.5;
  };

  // Helper for Text Paragraph
  const renderParagraph = (text, size = 9.5, color = [48, 43, 37], font = "normal") => {
    if (!text) return;
    const clean = cleanText(text);
    doc.setFont("helvetica", font);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines = doc.splitTextToSize(clean, contentWidth);
    
    lines.forEach(line => {
      checkPageBreak(6);
      doc.text(line, margin, y);
      y += 4.8;
    });
    y += 3;
  };

  // Helper for Bullet Point
  const renderBullet = (bulletText, indent = 4, bulletChar = "-") => {
    if (!bulletText) return;
    const clean = cleanText(bulletText);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(48, 43, 37);
    const lines = doc.splitTextToSize(`${bulletChar} ${clean}`, contentWidth - indent);
    
    lines.forEach((line, idx) => {
      checkPageBreak(6);
      doc.text(line, margin + (idx === 0 ? indent : indent + 3), y);
      y += 4.8;
    });
    y += 1.5;
  };

  // Helper for Code Block (with wrapping and line-by-line support)
  const renderCodeBox = (title, codeString, language = "code", explanation = null, lineByLine = null) => {
    checkPageBreak(25);

    if (title) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(1, 58, 43);
      doc.text(`${cleanText(title)} (${language.toUpperCase()})`, margin, y);
      y += 4.5;
    }

    const cleanRaw = String(codeString || '').replace(/\t/g, '  ');
    const rawLines = cleanRaw.split('\n');
    const wrappedLines = [];
    rawLines.forEach(l => {
      const sanitized = cleanText(l);
      const split = doc.splitTextToSize(sanitized, contentWidth - 12);
      if (split.length > 0) {
        wrappedLines.push(...split);
      } else {
        wrappedLines.push('');
      }
    });

    // Chunk code box across pages if needed
    let lineIdx = 0;
    while (lineIdx < wrappedLines.length) {
      checkPageBreak(15);
      const availableSpace = pageHeight - 22 - y;
      const maxLinesCanFit = Math.max(2, Math.floor((availableSpace - 8) / 4.2));
      const chunk = wrappedLines.slice(lineIdx, lineIdx + maxLinesCanFit);
      const boxH = (chunk.length * 4.2) + 7;

      doc.setFillColor(12, 45, 38); // Evergreen #0C2D26
      doc.roundedRect(margin, y, contentWidth, boxH, 2, 2, 'F');

      doc.setFont("courier", "normal");
      doc.setFontSize(8);
      doc.setTextColor(228, 224, 215); // Light slate text
      doc.text(chunk, margin + 6, y + 5);

      y += boxH + 4;
      lineIdx += chunk.length;
    }

    if (explanation) {
      checkPageBreak(12);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(122, 116, 106);
      const expLines = doc.splitTextToSize(`Note: ${cleanText(explanation)}`, contentWidth);
      expLines.forEach(l => {
        checkPageBreak(5);
        doc.text(l, margin, y);
        y += 4;
      });
      y += 2;
    }

    // Line-by-Line Breakdown
    if (lineByLine && Array.isArray(lineByLine) && lineByLine.length > 0) {
      checkPageBreak(18);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(66, 101, 87); // Teal
      doc.text("Line-by-Line Code Annotation:", margin, y);
      y += 4.5;

      lineByLine.forEach(lbl => {
        checkPageBreak(8);
        doc.setFont("courier", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(1, 58, 43);
        const lineNumStr = `Line ${lbl.line}:`;
        doc.text(lineNumStr, margin + 2, y);

        doc.setFont("courier", "normal");
        doc.setTextColor(48, 43, 37);
        const codeSnip = doc.splitTextToSize(cleanText(lbl.code), 45);
        doc.text(codeSnip, margin + 18, y);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(93, 87, 78);
        const expLines = doc.splitTextToSize(cleanText(lbl.explanation), contentWidth - 68);
        doc.text(expLines, margin + 66, y);

        const rowH = Math.max(codeSnip.length * 3.5, expLines.length * 3.5, 4.5);
        y += rowH + 1.5;
      });
      y += 2;
    }
    y += 2;
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
  doc.text("Learn Today, Build Tomorrow * Official Learning Platform", margin + 14, 57);

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

  let coverY = 80 + (titleLines.length * 7.5);
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(205, 199, 187);
  const subtitle = isWebDev
    ? "Comprehensive 15-Module Curriculum | Front-End, Back-End, Databases & Cloud"
    : isAIDataScience
      ? "Comprehensive 15-Module Curriculum | Python, Statistics, Machine Learning, Deep Learning, GenAI & MLOps"
      : `Level: ${cleanText(course.level)} | Duration: ${cleanText(course.duration)} | Modules: ${course.modules.length}`;
  doc.text(subtitle, margin + 14, coverY);
  coverY += 6;

  doc.setFontSize(9);
  doc.setTextColor(163, 157, 145);
  const authorText = isWebDev
    ? "Chief Architect: Vikramaditya Rao | Arshith Bootcamp Technical Curriculum Board"
    : isAIDataScience
      ? "Chief AI Scientist: Dr. Ananya Sharma | Arshith Bootcamp Advanced AI Research Board"
      : "Chief Architect & Lead Educators | Arshith Bootcamp Technical Curriculum Board";
  doc.text(authorText, margin + 14, coverY);

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
  doc.text(`Candidate Name: ${cleanStudentName}`, margin + 10, 183);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(228, 224, 215);
  doc.text(`Platform: Arshith Bootcamp Learning Systems`, margin + 10, 193);
  const curriculumSummary = isAIDataScience
    ? "Curriculum: 15 Core Modules + 5 Capstone Projects + 25-Question Certification Exam"
    : "Curriculum: 15 Core Modules + 3 Mini Projects + 1 Capstone + 25-Question Certification Exam";
  doc.text(curriculumSummary, margin + 10, 200);
  doc.text(`Export Date: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, margin + 10, 207);

  // Verification Seal
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(251, 248, 241); // Ivory accent
  doc.text("[VERIFIED OFFICIAL MANUAL]", pageWidth - margin - 58, 183);

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

    checkPageBreak(20);

    const numStr = `Module ${(idx + 1).toString().padStart(2, '0')}:`;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(1, 58, 43);
    doc.text(numStr, margin, y);
    
    const titleLines = doc.splitTextToSize(cleanTitle.replace(/^Module \d+\s*[-–—]\s*/i, ''), contentWidth - 32);
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

    // List key subtopics from sections
    if (mod.readingMaterial && mod.readingMaterial.sections) {
      const subtopics = mod.readingMaterial.sections.map(s => cleanText(s.heading)).slice(0, 4);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(66, 101, 87);
      const subtopicLine = `Core Topics: ${subtopics.join(' * ')} | Tutorials, 15 Practice Qs, 10 Interview Qs`;
      const wrappedSubtopics = doc.splitTextToSize(subtopicLine, contentWidth - 32);
      wrappedSubtopics.forEach(sl => {
        checkPageBreak(5);
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
  y += 6;

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
    doc.text(cleanText(es.title), margin + 12, y);
    y += 4.2;

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
  course.modules.forEach((mod) => {
    // Each module begins on a fresh page
    doc.addPage();
    pageCount++;
    addHeaderFooter(pageCount);
    y = 25;

    const cleanTitle = cleanText(mod.title);
    const cleanDesc = cleanText(mod.description);

    // Module Header Card
    const boxInnerWidth = contentWidth - 14;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12.5);
    const modTitleLines = doc.splitTextToSize(cleanTitle, boxInnerWidth);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const modDescLines = cleanDesc ? doc.splitTextToSize(cleanDesc, boxInnerWidth) : [];

    const titleH = modTitleLines.length * 5.2;
    const descH = modDescLines.length * 4;
    const headerBoxH = 10 + titleH + (modDescLines.length > 0 ? descH + 4 : 0);

    doc.setFillColor(239, 244, 241); // Sage tint #EFF4F1
    doc.roundedRect(margin, y, contentWidth, headerBoxH, 3, 3, 'F');
    doc.setDrawColor(30, 81, 65);
    doc.setLineWidth(0.6);
    doc.roundedRect(margin, y, contentWidth, headerBoxH, 3, 3, 'S');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12.5);
    doc.setTextColor(1, 58, 43);
    doc.text(modTitleLines, margin + 7, y + 8);

    if (modDescLines.length > 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(48, 43, 37);
      doc.text(modDescLines, margin + 7, y + 9 + titleH);
    }

    y += headerBoxH + 8;

    const rm = mod.readingMaterial;
    if (rm) {
      // 1. Introduction
      if (rm.introduction) {
        renderSubheading("1. Introduction & Overview", null, [30, 81, 65]);
        renderParagraph(rm.introduction);
      }

      // 2. Learning Objectives
      if (rm.objectives && rm.objectives.length > 0) {
        renderSubheading("2. Learning Objectives", null, [30, 81, 65]);
        rm.objectives.forEach(obj => renderBullet(obj, 4, "[x]"));
        y += 3;
      }

      // 3. Technical Terminology & Core Definitions
      if (rm.terminology && rm.terminology.length > 0) {
        renderSubheading("3. Important Definitions & Technical Terminology", null, [30, 81, 65]);
        rm.terminology.forEach(t => {
          checkPageBreak(14);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(1, 58, 43);
          doc.text(`* ${cleanText(t.term)}:`, margin + 2, y);
          y += 4.2;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(48, 43, 37);
          const defLines = doc.splitTextToSize(cleanText(t.definition), contentWidth - 8);
          defLines.forEach(l => {
            checkPageBreak(5);
            doc.text(l, margin + 6, y);
            y += 4;
          });

          if (t.importance) {
            doc.setFont("helvetica", "italic");
            doc.setFontSize(8);
            doc.setTextColor(66, 101, 87);
            const impLines = doc.splitTextToSize(`Significance: ${cleanText(t.importance)}`, contentWidth - 8);
            impLines.forEach(l => {
              checkPageBreak(4.5);
              doc.text(l, margin + 6, y);
              y += 3.8;
            });
          }
          y += 2;
        });
        y += 2;
      }

      // 4. Visual Diagram & Architecture — the same diagrams the lesson page shows
      const wf = workflows[mod.id];
      const visual = visualDiagramFor(mod.id);
      if (rm.diagram || wf) {
        // Keep the heading on the same page as the first diagram.
        if (wf) {
          const imgW = Math.min(contentWidth, wf.png.width * 0.2);
          checkPageBreak(Math.min(pageHeight - 50, (imgW * wf.png.height) / wf.png.width) + 32);
        }
        renderSubheading("4. Architecture & Visual Workflow Diagram", null, [30, 81, 65]);
        const diagramCtx = { doc, margin, contentWidth, pageHeight, checkPageBreak, renderCodeBox, getY: () => y, setY: (v) => { y = v; } };
        if (wf) drawWorkflow(diagramCtx, wf.def, wf.png);
      }
      if (rm.diagram && visual) {
        drawVisualDiagram({ doc, margin, contentWidth, pageHeight, checkPageBreak, renderCodeBox, getY: () => y, setY: (v) => { y = v; } }, visual);
        if (rm.diagram.explanation) {
          renderParagraph(rm.diagram.explanation, 8.5, [93, 87, 78], "italic");
        }
      } else if (rm.diagram) {
        checkPageBreak(12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(48, 43, 37);
        doc.text(cleanText(rm.diagram.title), margin, y);
        y += 4.5;

        if (rm.diagram.ascii) {
          const asciiLines = rm.diagram.ascii.split('\n');
          const cleanAscii = asciiLines.map(l => cleanText(l));
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

        if (rm.diagram.explanation) {
          renderParagraph(rm.diagram.explanation, 8.5, [93, 87, 78], "italic");
        }
      }

      // 5. Detailed Explanations & Core Subtopics
      if (rm.sections && rm.sections.length > 0) {
        renderSubheading("5. Detailed Explanations of Every Topic & Subtopic", null, [30, 81, 65]);
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

            // Table Header
            doc.setFillColor(248, 245, 238);
            doc.rect(margin, y, contentWidth, 6.5, 'F');
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(48, 43, 37);

            sec.table.headers.forEach((h, hIdx) => {
              const hText = doc.splitTextToSize(cleanText(h), colWidth - 4);
              doc.text(hText, margin + (hIdx * colWidth) + 2, y + 4.5);
            });
            y += 6.5;

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
              doc.rect(margin, y, contentWidth, maxRowHeight, 'S');

              formattedCells.forEach((cellLines, cIdx) => {
                doc.text(cellLines, margin + (cIdx * colWidth) + 2, y + 4);
              });
              y += maxRowHeight;
            });
            y += 4;
          }
        });
      }

      // 6. Step-by-Step Practical Tutorials
      if (rm.tutorials && rm.tutorials.length > 0) {
        renderSubheading("6. Step-by-Step Practical Tutorials", null, [30, 81, 65]);
        rm.tutorials.forEach(tut => {
          checkPageBreak(12);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(1, 58, 43);
          doc.text(`Tutorial: ${cleanText(tut.title)}`, margin, y);
          y += 5;

          if (tut.steps && Array.isArray(tut.steps)) {
            tut.steps.forEach(st => {
              checkPageBreak(12);
              doc.setFont("helvetica", "bold");
              doc.setFontSize(8.5);
              doc.setTextColor(30, 81, 65);
              doc.text(`Step ${st.step}: ${cleanText(st.instruction)}`, margin + 3, y);
              y += 4.5;

              if (st.code) {
                renderCodeBox(null, st.code, "code", st.explanation);
              } else if (st.explanation) {
                renderParagraph(st.explanation, 8, [93, 87, 78]);
              }
            });
          }
        });
      }

      // 7. Syntax & Complete Working Code Examples
      if (rm.codeExamples && rm.codeExamples.length > 0) {
        renderSubheading("7. Syntax & Complete Working Code Examples", null, [30, 81, 65]);
        rm.codeExamples.forEach(ex => {
          renderCodeBox(
            ex.title,
            ex.code,
            ex.language || "javascript",
            ex.explanation,
            ex.lineByLine
          );
        });
      }

      // 8. Common Errors, Debugging Techniques & Solutions
      if (rm.commonErrors && rm.commonErrors.length > 0) {
        renderSubheading("8. Common Errors, Debugging Techniques & Solutions", null, [185, 28, 28]); // Red
        rm.commonErrors.forEach(err => {
          checkPageBreak(16);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(185, 28, 28);
          doc.text(`! Error: ${cleanText(err.error)}`, margin, y);
          y += 4.2;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(48, 43, 37);
          const rLines = doc.splitTextToSize(`Root Cause: ${cleanText(err.reason)}`, contentWidth - 4);
          rLines.forEach(l => {
            checkPageBreak(5);
            doc.text(l, margin + 4, y);
            y += 4;
          });

          if (err.wrongCode) {
            renderCodeBox("Incorrect / Buggy Code", err.wrongCode, "buggy", null);
          }
          if (err.fixCode) {
            renderCodeBox("Correct Solution / Fixed Code", err.fixCode, "fixed", err.explanation);
          }
          y += 2;
        });
      }

      // 9. Best Practices & Industry Standards
      if (rm.bestPractices && rm.bestPractices.length > 0) {
        renderSubheading("9. Best Practices & Industry Standards", null, [66, 101, 87]); // Teal
        rm.bestPractices.forEach(bp => {
          checkPageBreak(14);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(66, 101, 87);
          doc.text(`* ${cleanText(bp.title)}`, margin + 2, y);
          y += 4.2;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(48, 43, 37);
          const ruleLines = doc.splitTextToSize(cleanText(bp.rule), contentWidth - 6);
          ruleLines.forEach(l => {
            checkPageBreak(5);
            doc.text(l, margin + 6, y);
            y += 4;
          });

          if (bp.why) {
            doc.setFont("helvetica", "italic");
            doc.setFontSize(8);
            doc.setTextColor(122, 116, 106);
            const whyLines = doc.splitTextToSize(`Rationale: ${cleanText(bp.why)}`, contentWidth - 6);
            whyLines.forEach(l => {
              checkPageBreak(4.5);
              doc.text(l, margin + 6, y);
              y += 3.8;
            });
          }

          if (bp.example) {
            renderCodeBox("Industry Standard Example", bp.example, "best-practice", null);
          }
          y += 2;
        });
      }

      // 10. Hands-on Practice Exercise & Detailed Solution
      if (rm.practiceExercise) {
        renderSubheading("10. Hands-On Practice Exercise & Solution", null, [66, 101, 87]); // Amber
        checkPageBreak(14);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(66, 101, 87);
        doc.text(`Exercise Challenge: ${cleanText(rm.practiceExercise.title)}`, margin, y);
        y += 4.5;

        renderParagraph(rm.practiceExercise.problem, 8.5, [48, 43, 37]);

        if (rm.practiceExercise.hints && rm.practiceExercise.hints.length > 0) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(66, 101, 87);
          doc.text("Implementation Hints:", margin + 2, y);
          y += 4;
          rm.practiceExercise.hints.forEach(h => renderBullet(h, 4, ">"));
          y += 2;
        }

        if (rm.practiceExercise.solutionCode) {
          renderCodeBox("Complete Working Solution Code", rm.practiceExercise.solutionCode, "solution", rm.practiceExercise.explanation);
        }
      }

      // 11. Practice Questions with Answers (15 Questions)
      if (rm.practiceQuestions && rm.practiceQuestions.length > 0) {
        renderSubheading("11. Practice Questions & Technical Explanations (15 Qs)", null, [30, 81, 65]);
        rm.practiceQuestions.forEach((pq, pqIdx) => {
          checkPageBreak(25);
          y += 2;

          // Question header & text
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(1, 58, 43);
          const qTitle = `Practice Question ${pqIdx + 1}:`;
          doc.text(qTitle, margin, y);
          y += 4.5;

          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(48, 43, 37);
          const qLines = doc.splitTextToSize(cleanText(pq.question), contentWidth);
          qLines.forEach(l => {
            checkPageBreak(5.5);
            doc.text(l, margin, y);
            y += 4.5;
          });

          // Model Answer
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(30, 81, 65);
          checkPageBreak(5);
          doc.text("Technical Answer:", margin + 4, y);
          y += 4.2;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(48, 43, 37);
          const aLines = doc.splitTextToSize(cleanText(pq.answer), contentWidth - 6);
          aLines.forEach(l => {
            checkPageBreak(5);
            doc.text(l, margin + 4, y);
            y += 4.2;
          });

          // Detailed Explanation
          if (pq.explanation) {
            checkPageBreak(5);
            doc.setFont("helvetica", "italic");
            doc.setFontSize(8);
            doc.setTextColor(93, 87, 78);
            const expLines = doc.splitTextToSize(`Concept Deep Dive: ${cleanText(pq.explanation)}`, contentWidth - 6);
            expLines.forEach(l => {
              checkPageBreak(4.5);
              doc.text(l, margin + 4, y);
              y += 4;
            });
          }
          y += 3.5;
        });
        y += 2;
      }

      // 12. Technical Interview Questions & Model Answers (10 Questions)
      if (rm.interviewQuestions && rm.interviewQuestions.length > 0) {
        renderSubheading("12. Technical Interview Questions & Model Answers (10 Qs)", null, [30, 81, 65]); // Purple
        rm.interviewQuestions.forEach((iq, iqIdx) => {
          checkPageBreak(25);
          y += 2;

          doc.setFont("helvetica", "bold");
          doc.setFontSize(9.5);
          doc.setTextColor(30, 81, 65);
          const qTitle = `Interview Question ${iqIdx + 1}:`;
          doc.text(qTitle, margin, y);
          y += 4.5;

          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(48, 43, 37);
          const qLines = doc.splitTextToSize(cleanText(iq.question), contentWidth);
          qLines.forEach(l => {
            checkPageBreak(5.5);
            doc.text(l, margin, y);
            y += 4.5;
          });

          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(30, 81, 65);
          checkPageBreak(5);
          doc.text("Candidate Model Answer:", margin + 4, y);
          y += 4.2;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
          doc.setTextColor(48, 43, 37);
          const aLines = doc.splitTextToSize(cleanText(iq.answer), contentWidth - 6);
          aLines.forEach(l => {
            checkPageBreak(5);
            doc.text(l, margin + 4, y);
            y += 4.2;
          });

          if (iq.keyPoints && iq.keyPoints.length > 0) {
            checkPageBreak(6);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(8);
            doc.setTextColor(30, 81, 65);
            doc.text("Key Talking Points for Interviewers:", margin + 4, y);
            y += 4.2;
            iq.keyPoints.forEach(kp => renderBullet(kp, 6, "*"));
          }
          y += 3.5;
        });
        y += 2;
      }

      // 13. Practical Mini-Task / Real-World Assignment
      if (rm.miniTask) {
        renderSubheading("13. Practical Mini-Task & Assignment", null, [30, 81, 65]);
        checkPageBreak(14);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(1, 58, 43);
        doc.text(`Assignment: ${cleanText(rm.miniTask.title)}`, margin, y);
        y += 4.5;

        renderParagraph(`Objective: ${rm.miniTask.objective}`, 8.5, [48, 43, 37]);

        if (rm.miniTask.requirements && rm.miniTask.requirements.length > 0) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(48, 43, 37);
          doc.text("Task Requirements:", margin, y);
          y += 4;
          rm.miniTask.requirements.forEach(req => renderBullet(req, 4, "[ ]"));
          y += 2;
        }

        if (rm.miniTask.deliverable) {
          renderParagraph(`Deliverable: ${rm.miniTask.deliverable}`, 8.5, [66, 101, 87], "bold");
        }

        if (rm.miniTask.evaluationCriteria && rm.miniTask.evaluationCriteria.length > 0) {
          checkPageBreak(15);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(48, 43, 37);
          doc.text("Grading & Evaluation Rubric:", margin, y);
          y += 4;
          rm.miniTask.evaluationCriteria.forEach(ec => renderBullet(ec, 4, "*"));
          y += 2;
        }
      }

      // 14. Module Summary & Key Takeaways
      if (rm.summary) {
        renderSubheading("14. Module Summary & Key Takeaways", null, [30, 81, 65]);
        if (rm.summary.takeaways && rm.summary.takeaways.length > 0) {
          rm.summary.takeaways.forEach(tk => renderBullet(tk, 4, "v"));
          y += 2;
        }
        if (rm.summary.quickReference && rm.summary.quickReference.length > 0) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(1, 58, 43);
          doc.text("Quick Reference Cheatsheet:", margin, y);
          y += 4;
          rm.summary.quickReference.forEach(qr => renderBullet(qr, 4, "#"));
          y += 2;
        }
      }

      // 15. Module Self-Assessment MCQs
      if (rm.selfAssessment && rm.selfAssessment.questions && rm.selfAssessment.questions.length > 0) {
        renderSubheading("15. Module Self-Assessment (5 MCQs)", null, [30, 81, 65]);
        rm.selfAssessment.questions.forEach((q, qIdx) => {
          checkPageBreak(14);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.setTextColor(1, 58, 43);
          const qLines = doc.splitTextToSize(`Q${qIdx + 1}: ${cleanText(q.questionText)}`, contentWidth);
          qLines.forEach(l => {
            checkPageBreak(5);
            doc.text(l, margin, y);
            y += 4;
          });

          if (q.codeSnippet) {
            renderCodeBox(null, q.codeSnippet, "snippet", null);
          }

          if (q.options && Array.isArray(q.options)) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(48, 43, 37);
            q.options.forEach((opt, oIdx) => {
              const optLabel = `${String.fromCharCode(65 + oIdx)}) ${cleanText(opt)}`;
              checkPageBreak(4.5);
              doc.text(optLabel, margin + 4, y);
              y += 3.8;
            });
          }

          if (q.explanation) {
            doc.setFont("helvetica", "italic");
            doc.setFontSize(8);
            doc.setTextColor(66, 101, 87);
            checkPageBreak(5);
            doc.text(`Key: Option ${cleanText(q.correctAnswer)} - ${cleanText(q.explanation)}`, margin + 4, y);
            y += 4;
          }
          y += 2;
        });
      }

      // References
      if (rm.references && rm.references.length > 0) {
        checkPageBreak(12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(122, 116, 106);
        doc.text("Official References & Documentation:", margin, y);
        y += 4;
        rm.references.forEach(ref => {
          renderBullet(`${ref.title}: ${ref.url}`, 4, "-");
        });
        y += 4;
      }
    }
  });

  // ==========================================
  // SECTION: COURSE PRACTICAL PROJECTS (3 MINI PROJECTS)
  // ==========================================
  if (course.projects && course.projects.length > 0) {
    doc.addPage();
    pageCount++;
    addHeaderFooter(pageCount);
    y = 25;

    doc.setFillColor(12, 45, 38);
    doc.roundedRect(margin, y, contentWidth, 20, 3, 3, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text("COURSE PRACTICAL PROJECTS - INDUSTRY ASSIGNMENTS", margin + 8, y + 12);
    y += 28;

    course.projects.forEach((proj, pIdx) => {
      checkPageBreak(25);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12.5);
      doc.setTextColor(1, 58, 43);
      doc.text(`Project ${pIdx + 1}: ${cleanText(proj.title)}`, margin, y);
      y += 5.5;

      if (proj.subtitle) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(66, 101, 87);
        doc.text(cleanText(proj.subtitle), margin, y);
        y += 4.5;
      }

      if (proj.difficulty || proj.estimatedTime) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(122, 116, 106);
        doc.text(`Difficulty: ${cleanText(proj.difficulty || 'Medium')} | Duration: ${cleanText(proj.estimatedTime || '8 hours')}`, margin, y);
        y += 4.5;
      }

      renderParagraph(proj.description);

      if (proj.objectives && proj.objectives.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(30, 81, 65);
        doc.text("Core Learning Objectives:", margin, y);
        y += 4.5;
        proj.objectives.forEach(obj => renderBullet(obj, 4, "[x]"));
        y += 3;
      }

      if (proj.requirements && proj.requirements.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(48, 43, 37);
        doc.text("Technical & Architectural Requirements:", margin, y);
        y += 4.5;
        proj.requirements.forEach(req => renderBullet(req, 4, ">"));
        y += 3;
      }

      if (proj.starterCode) {
        renderCodeBox("Project Implementation & Starter Code", proj.starterCode, "javascript", null);
      }

      if (proj.expectedOutput) {
        checkPageBreak(12);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(1, 58, 43);
        doc.text("Expected Milestone Deliverable:", margin, y);
        y += 4.5;
        renderParagraph(proj.expectedOutput, 8.5, [93, 87, 78], "italic");
      }
      y += 6;
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

    doc.setFillColor(1, 58, 43);
    doc.roundedRect(margin, y, contentWidth, 22, 3, 3, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text("FINAL CAPSTONE PROJECT - PRODUCTION SPECIFICATION", margin + 8, y + 14);
    y += 30;

    const fp = course.finalProject;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(1, 58, 43);
    doc.text(cleanText(fp.title), margin, y);
    y += 6;

    renderParagraph(fp.description);

    if (fp.techStack && fp.techStack.length > 0) {
      renderParagraph(`Full Stack Architecture: ${fp.techStack.join(' * ')}`, 9, [66, 101, 87], "bold");
    }

    if (fp.requirements && fp.requirements.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(30, 81, 65);
      doc.text("Capstone Requirements & Modules:", margin, y);
      y += 4.5;
      fp.requirements.forEach(req => renderBullet(req, 4, "[ ]"));
      y += 4;
    }

    if (fp.rubric && fp.rubric.length > 0) {
      checkPageBreak(25);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(48, 43, 37);
      doc.text("Evaluation & Grading Rubric:", margin, y);
      y += 5;

      fp.rubric.forEach(rb => {
        checkPageBreak(8);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(30, 81, 65);
        doc.text(`${cleanText(rb.criterion)} (${rb.weight}):`, margin + 4, y);
        y += 4;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(93, 87, 78);
        const descLines = doc.splitTextToSize(cleanText(rb.description), contentWidth - 8);
        descLines.forEach(l => {
          checkPageBreak(4.5);
          doc.text(l, margin + 6, y);
          y += 3.8;
        });
        y += 1.5;
      });
    }

    // Capstone Database Schema Specifications
    checkPageBreak(25);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(1, 58, 43);
    doc.text("Capstone Data Architecture & Relational / Document Schemas:", margin, y);
    y += 5;

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
    checkPageBreak(25);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(1, 58, 43);
    doc.text("RESTful API Endpoint Architecture Specification:", margin, y);
    y += 5;

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
      renderCodeBox("Full-Stack Capstone Starter Architecture", fp.starterArchitecture, "javascript", null);
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

    doc.setFillColor(66, 101, 87); // Sage header
    doc.roundedRect(margin, y, contentWidth, 24, 3, 3, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text(`EXAMINATION PAPER ${pIdx + 1}: ${cleanText(paper.title)}`, margin + 8, y + 10);

    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(248, 245, 238);
    doc.text(`${cleanText(paper.subtitle || 'Official Question Paper')} | Time Allowed: ${paper.timeLimitMinutes || 45} Mins | Passing Score: ${paper.passingScore || 80}%`, margin + 8, y + 17);
    y += 32;

    paper.questions.forEach((q, qIdx) => {
      checkPageBreak(18);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(1, 58, 43);
      const qNumText = `Question ${qIdx + 1} [${cleanText(q.topic || 'General')}]:`;
      doc.text(qNumText, margin, y);
      y += 4.5;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(48, 43, 37);
      const qLines = doc.splitTextToSize(cleanText(q.questionText), contentWidth);
      qLines.forEach(l => {
        checkPageBreak(5);
        doc.text(l, margin, y);
        y += 4;
      });

      if (q.codeSnippet) {
        renderCodeBox(null, q.codeSnippet, "snippet", null);
      }

      if (q.options && Array.isArray(q.options)) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(48, 43, 37);
        q.options.forEach((opt, oIdx) => {
          const optLabel = `${String.fromCharCode(65 + oIdx)}) ${cleanText(opt)}`;
          checkPageBreak(4.5);
          doc.text(optLabel, margin + 4, y);
          y += 3.8;
        });
      }

      if (q.explanation || q.correctAnswer !== undefined) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(30, 81, 65);
        checkPageBreak(5);
        const ansLabel = `Answer: Option ${cleanText(q.correctAnswer)} - ${cleanText(q.explanation || '')}`;
        const ansLines = doc.splitTextToSize(ansLabel, contentWidth - 4);
        ansLines.forEach(l => {
          checkPageBreak(4.5);
          doc.text(l, margin + 4, y);
          y += 3.8;
        });
      }
      y += 3;
    });
  });

  // ==========================================
  // SECTION: FINAL REVISION & PROJECT CHECKLIST
  // ==========================================
  doc.addPage();
  pageCount++;
  addHeaderFooter(pageCount);
  y = 25;

  doc.setFillColor(1, 58, 43);
  doc.roundedRect(margin, y, contentWidth, 20, 3, 3, 'F');
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text("FINAL REVISION & PRE-FLIGHT DEPLOYMENT CHECKLIST", margin + 8, y + 13);
  y += 28;

  const checklistCategories = [
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

  checklistCategories.forEach(cat => {
    checkPageBreak(16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 81, 65);
    doc.text(cat.category, margin, y);
    y += 5;

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
  doc.text("Congratulations on completing the entire Web Development curriculum!", margin + 15, y + 36);

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.line(margin + 15, y + 45, pageWidth - margin - 15, y + 45);

  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`Student Name: ${cleanStudentName}`, margin + 15, y + 58);
  doc.text(`Course Title: ${cleanCourseTitle}`, margin + 15, y + 68);
  doc.text(`Modules Completed: ${course.modules.length} / ${course.modules.length} Modules (100% Comprehensive)`, margin + 15, y + 78);
  const portfolioText = isAIDataScience
    ? `Practical Portfolio: 5 End-to-End Capstone Projects Completed`
    : isWebDev
      ? `Practical Portfolio: 3 Mini Projects + 1 Enterprise Capstone Completed`
      : `Practical Portfolio: Practical Capstone Projects Completed`;
  doc.text(portfolioText, margin + 15, y + 88);
  doc.text(`Certification Assessment: Verified Passing Score on 25 Comprehensive Qs`, margin + 15, y + 98);
  doc.text(`Official Issuer: Arshith Bootcamp Platform (www.arshithbootcamp.com)`, margin + 15, y + 108);

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(251, 248, 241); // Ivory accent
  doc.text("* VERIFIED OFFICIAL COURSE DOCUMENT *", margin + 15, y + 124);

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
