const REVISION_NOTES_CSS = `
:root {
  --primary: #1e3a8a;
  --secondary: #0d9488;
  --accent: #ea580c;
  --danger: #dc2626;
  --bg-light: #f8fafc;
  --text-dark: #1e293b;
  --card-bg: #ffffff;
  --border-color: #cbd5e1;
  --highlight-yellow: rgba(254, 240, 138, 0.95);
  --highlight-amber: #fef3c7;
}
html, body {
  margin: 0;
  padding: 0;
}
body {
  font-family: 'Noto Sans Devanagari', 'Segoe UI', system-ui, -apple-system, sans-serif;
  line-height: 1.65;
  color: var(--text-dark);
  background-color: var(--bg-light);
  padding: 24px;
}
.container {
  max-width: 1100px;
  margin: auto;
  background: var(--card-bg);
  padding: 36px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--border-color);
  box-sizing: border-box;
}
.container h1 {
  text-align: center;
  color: var(--primary);
  border-bottom: 3px solid var(--accent);
  padding-bottom: 16px;
  font-size: 2.1rem;
  margin-top: 0;
}
.container h2 {
  color: var(--primary);
  border-left: 6px solid var(--secondary);
  padding-left: 12px;
  margin-top: 36px;
  margin-bottom: 16px;
  font-size: 1.5rem;
  background: linear-gradient(90deg, #dbeafe, #ecfdf5);
  padding-top: 6px;
  padding-bottom: 6px;
  border-radius: 0 6px 6px 0;
}
.container h3 {
  color: var(--secondary);
  margin-top: 24px;
  margin-bottom: 8px;
  font-size: 1.2rem;
}
.container p {
  margin: 8px 0;
}
.bilingual-block {
  margin-bottom: 14px;
}
.hi-text {
  font-weight: 500;
  color: #0f172a;
}
.en-text {
  font-size: 0.94rem;
  color: #475569;
  font-style: italic;
}
.card {
  background: #ffffff;
  border: 1px solid var(--border-color);
  border-left: 4px solid var(--primary);
  border-radius: 6px;
  padding: 16px;
  margin: 14px 0;
}
.card-accent {
  border-left: 5px solid var(--accent);
  background: var(--highlight-amber);
  box-shadow: 0 2px 8px rgba(234, 88, 12, 0.12);
}
.badge {
  display: inline-block;
  padding: 2px 10px;
  font-size: 0.8rem;
  font-weight: 700;
  border-radius: 12px;
  color: #fff;
  background: #0f766e;
  margin-right: 6px;
}
.badge-accent {
  background: var(--accent);
}
.badge-danger {
  background: var(--danger);
}
.container strong {
  color: #b45309;
  background: linear-gradient(transparent 58%, var(--highlight-yellow) 58%);
}
.container table {
  width: 100%;
  border-collapse: collapse;
  margin: 18px 0;
  font-size: 0.92rem;
}
.container th,
.container td {
  border: 1px solid var(--border-color);
  padding: 10px 14px;
  text-align: left;
}
.container th {
  background-color: var(--primary);
  color: #ffffff;
}
.container tr:nth-child(even) {
  background-color: #f8fafc;
}
.mcq-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-top: 20px;
}
.mcq-item {
  border: 1px solid var(--border-color);
  background: #ffffff;
  border-radius: 8px;
  padding: 16px;
}
.mcq-header {
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 8px;
}
.mcq-options {
  margin: 10px 0;
  padding-left: 20px;
}
.mcq-options li {
  margin-bottom: 4px;
}
.mcq-answer-side {
  background: linear-gradient(90deg, #fef3c7, #fff7ed);
  border-left: 4px solid var(--accent);
  padding: 8px 12px;
  font-size: 0.9rem;
  margin-top: 8px;
  border-radius: 0 4px 4px 0;
}
.mcq-ans-label {
  font-weight: bold;
  color: var(--danger);
}
.mcq-exp {
  color: #334155;
  margin-top: 4px;
  font-size: 0.85rem;
}
.container code {
  color: var(--danger);
  background: #fce7f3;
  padding: 2px 6px;
  border-radius: 6px;
}
.container pre {
  background: #0f172a;
  color: #e2e8f0;
  padding: 14px;
  border-radius: 10px;
  border-left: 5px solid var(--secondary);
  overflow: auto;
}
`.trim()

/** Legacy CSS for notes generated before the revision template. */
const LEGACY_STUDY_NOTES_CSS = `
html, body {
  margin: 0;
  padding: 0;
}
body {
  font-family: 'Noto Sans Devanagari', system-ui, sans-serif;
  font-size: 17px;
  line-height: 1.75;
  color: #1e293b;
  background: #f8fafc;
}
.study-notes {
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 32px clamp(16px, 4vw, 48px) 64px;
  background: #ffffff;
  box-sizing: border-box;
}
.study-notes h1 {
  font-size: 2rem;
  line-height: 1.25;
  margin: 0 0 16px;
  color: #1e3a8a;
}
.study-notes h2 {
  font-size: 1.5rem;
  line-height: 1.3;
  margin: 28px 0 12px;
  color: #1e3a8a;
  border-bottom: 2px solid #bfdbfe;
  padding-bottom: 6px;
}
.study-notes h3 {
  font-size: 1.2rem;
  line-height: 1.35;
  margin: 20px 0 8px;
  color: #059669;
}
.study-notes table {
  width: 100%;
  border-collapse: collapse;
  margin: 14px 0;
}
.study-notes th {
  background: #dbeafe;
  color: #1e3a8a;
  border: 1.5px solid #93c5fd;
  padding: 10px 12px;
  text-align: left;
}
.study-notes td {
  border: 1.5px solid #bfdbfe;
  padding: 10px 12px;
}
`.trim()

const A4_NOTEBOOK_CSS = `
html, body {
  margin: 0;
  padding: 0;
}
.notebook-page {
  width: 210mm;
  height: 297mm;
  min-width: 210mm;
  min-height: 297mm;
  max-width: 210mm;
  max-height: 297mm;
  box-sizing: border-box;
  margin: 12px auto;
  padding: 18mm 18mm 22mm 28mm;
  position: relative;
  overflow: hidden;
  page-break-after: always;
  break-after: page;
  background-color: #fffef0;
  background-image: repeating-linear-gradient(
    transparent,
    transparent 7.8mm,
    rgba(100, 149, 237, 0.18) 7.8mm,
    rgba(100, 149, 237, 0.18) 8mm
  );
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.12);
}
.notebook-page::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 20mm;
  width: 1.5px;
  background: #e74c3c;
  opacity: 0.75;
}
.notebook-page h1 {
  font-size: 34px;
  line-height: 1.25;
  margin: 0 0 14px;
  color: #1e3a8a;
}
.notebook-page h1:nth-of-type(3n+2) { color: #6d28d9; }
.notebook-page h1:nth-of-type(3n+3) { color: #0f766e; }
.notebook-page h2 {
  font-size: 26px;
  line-height: 1.3;
  margin: 18px 0 10px;
  color: #1d4ed8;
}
.notebook-page h2:nth-of-type(4n+2) { color: #b45309; }
.notebook-page h2:nth-of-type(4n+3) { color: #be185d; }
.notebook-page h2:nth-of-type(4n+4) { color: #7c3aed; }
.notebook-page h3 {
  font-size: 22px;
  line-height: 1.35;
  margin: 14px 0 8px;
  color: #047857;
}
.notebook-page h3:nth-of-type(3n+2) { color: #0369a1; }
.notebook-page h3:nth-of-type(3n+3) { color: #c2410c; }
.notebook-page strong {
  color: #c0392b;
  background: linear-gradient(transparent 58%, rgba(255, 245, 157, 0.85) 58%);
}
.notebook-page em {
  color: #6d28d9;
  font-style: italic;
}
.notebook-page a {
  color: #1d4ed8;
}
.notebook-page ul li::marker,
.notebook-page ol li::marker {
  color: #2563eb;
  font-weight: 700;
}
.notebook-page ul li:nth-child(3n+2)::marker { color: #db2777; }
.notebook-page ul li:nth-child(3n+3)::marker { color: #059669; }
.notebook-page ol li:nth-child(3n+2)::marker { color: #d97706; }
.notebook-page ol li:nth-child(3n+3)::marker { color: #7c3aed; }
.notebook-page blockquote {
  margin: 12px 0;
  padding: 10px 14px;
  border-left: 5px solid #7c3aed;
  background: linear-gradient(90deg, #ede9fe, #fdf4ff);
  border-radius: 0 10px 10px 0;
  color: #4c1d95;
}
.notebook-page blockquote:nth-of-type(3n+2) {
  border-left-color: #0891b2;
  background: linear-gradient(90deg, #ecfeff, #e0f2fe);
  color: #155e75;
}
.notebook-page blockquote:nth-of-type(3n+3) {
  border-left-color: #059669;
  background: linear-gradient(90deg, #ecfdf5, #f0fdf4);
  color: #065f46;
}
.notebook-page table {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  font-size: 17px;
}
.notebook-page th {
  background: #dbeafe;
  color: #1e3a8a;
  border: 1.5px solid #93c5fd;
  padding: 8px 10px;
  text-align: left;
}
.notebook-page td {
  border: 1.5px solid #bfdbfe;
  padding: 8px 10px;
}
.notebook-page tr:nth-child(even) td {
  background: #f0fdf4;
}
.notebook-page code {
  color: #9d174d;
  background: #fce7f3;
  padding: 1px 6px;
  border-radius: 6px;
  font-size: 0.9em;
}
.notebook-page pre {
  background: #0f172a;
  color: #e2e8f0;
  padding: 12px 14px;
  border-radius: 10px;
  border-left: 5px solid #38bdf8;
  overflow: auto;
}
.notebook-page hr {
  border: none;
  border-top: 2px dashed #f59e0b;
  margin: 16px 0;
}
.qa-item {
  margin: 14px 0;
  padding: 12px 14px;
  border: 1.5px solid #93c5fd;
  border-radius: 10px;
  background: linear-gradient(135deg, #eff6ff, #f0fdf4);
}
.qa-label {
  font-weight: 700;
  color: #1e3a8a;
  margin: 0 0 6px;
  font-size: 16px;
}
.qa-hi {
  margin: 0 0 4px;
  color: #1e3a8a;
}
.qa-en {
  margin: 0 0 8px;
  color: #0891b2;
  font-style: italic;
}
.qa-answer {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1.5px dashed #b45309;
}
.qa-explain-hi,
.qa-explain-en {
  margin: 6px 0 0;
  font-size: 16px;
  color: #4c1d95;
}
.quiz-item {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 16px;
  align-items: start;
  margin: 16px 0;
  padding: 12px;
  border: 1.5px solid #bfdbfe;
  border-radius: 10px;
  background: #fffef8;
}
.quiz-main {
  min-width: 0;
}
.quiz-number {
  font-weight: 700;
  color: #7c3aed;
  margin: 0 0 8px;
  font-size: 18px;
}
.quiz-q-hi {
  margin: 0 0 4px;
  color: #1e3a8a;
  font-weight: 600;
}
.quiz-q-en {
  margin: 0 0 10px;
  color: #0891b2;
  font-style: italic;
}
.quiz-options {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.quiz-option {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 8px;
  margin: 0;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  color: #334155;
  background: transparent;
}
.quiz-option input[type="radio"] {
  margin-top: 4px;
  accent-color: #7c3aed;
  flex-shrink: 0;
}
.quiz-answer-panel {
  background: linear-gradient(135deg, #ede9fe, #ecfeff);
  border: 2px solid #7c3aed;
  border-radius: 10px;
  padding: 12px;
  min-width: 0;
}
.quiz-correct-label {
  font-weight: 700;
  color: #be185d;
  margin: 0 0 4px;
  font-size: 14px;
  text-align: center;
}
.quiz-correct-letter {
  font-size: 28px;
  font-weight: 700;
  color: #059669;
  text-align: center;
  margin: 0 0 8px;
}
.quiz-explain-hi {
  margin: 0 0 6px;
  color: #1e3a8a;
  font-size: 15px;
}
.quiz-explain-en {
  margin: 0;
  color: #0891b2;
  font-size: 14px;
  font-style: italic;
}
.page-number {
  position: absolute;
  bottom: 10mm;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 14px;
  color: #64748b;
}
@page {
  size: A4;
  margin: 0;
}
@media print {
  html, body {
    background: white !important;
  }
  body {
    padding: 0 !important;
    zoom: 1 !important;
  }
  .notebook-page {
    margin: 0 !important;
    box-shadow: none !important;
    page-break-after: always;
  }
  .quiz-item {
    grid-template-columns: 1fr 240px;
    gap: 12px;
  }
}
`.trim()

/** PDF-reader chrome for A4 notebook pages (gray canvas + page shadows). */
const NOTEBOOK_PDF_VIEW_CSS = `
@media screen {
  html, body {
    margin: 0;
    width: 100%;
    min-height: 100%;
    height: auto;
    background: #525659;
  }
  body {
    min-height: 100vh;
    padding: 20px 0 40px;
    zoom: var(--notebook-zoom, 1);
  }
  .notebook-page {
    margin: 16px auto !important;
    box-shadow:
      0 1px 1px rgba(0, 0, 0, 0.08),
      0 4px 12px rgba(0, 0, 0, 0.22),
      0 12px 28px rgba(0, 0, 0, 0.18) !important;
  }
}
`.trim()

/** Viewer chrome for imported/custom HTML — zoom only, preserve author styles. */
const CUSTOM_HTML_VIEW_CSS = `
@media screen {
  html, body {
    margin: 0;
    width: 100%;
    min-height: 100%;
    height: auto;
  }
  body {
    min-height: 100vh;
    zoom: var(--notebook-zoom, 1);
  }
}
`.trim()

/** Legacy A4 notebook page width at 96dpi — only for `.notebook-page` HTML. */
export const NOTEBOOK_A4_WIDTH_PX = (210 * 96) / 25.4

/** True when HTML uses the revision notes container layout. */
export function htmlUsesRevisionNotes(html: string) {
  return /\bclass=["'][^"']*\bcontainer\b/.test(html)
}

/** True when HTML uses the legacy generated study-notes layout. */
export function htmlUsesStudyNotes(html: string) {
  return /\bstudy-notes\b/.test(html)
}

/** True when HTML uses the app's A4 notebook page layout. */
export function htmlUsesNotebookPages(html: string) {
  return /\bnotebook-page\b/.test(html)
}

function stripInjectedNotebookStyles(html: string) {
  return html
    .replace(
      /<style id=["']revision-notes-styles["']>[\s\S]*?<\/style>\s*/gi,
      '',
    )
    .replace(/<style id=["']study-notes-styles["']>[\s\S]*?<\/style>\s*/gi, '')
    .replace(/<style id=["']a4-notebook-styles["']>[\s\S]*?<\/style>\s*/gi, '')
    .replace(/<style id=["']notebook-pdf-view["']>[\s\S]*?<\/style>\s*/gi, '')
    .replace(/<style id=["']notebook-zoom-var["']>[\s\S]*?<\/style>\s*/gi, '')
}

function injectHeadStyle(html: string, id: string, css: string) {
  const styleTag = `<style id="${id}">\n${css}\n</style>`

  if (new RegExp(`id=["']${id}["']`).test(html)) {
    return html
  }

  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${styleTag}</head>`)
  }

  if (/<html[^>]*>/i.test(html)) {
    return html.replace(
      /<html[^>]*>/i,
      (match) => `${match}<head>${styleTag}</head>`,
    )
  }

  return `<!DOCTYPE html>
<html lang="hi">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Noto+Sans+Devanagari:wght@400;600;700&display=swap" rel="stylesheet">
${styleTag}
</head>
<body>
${html}
</body>
</html>`
}

/**
 * Injects server-side CSS for generated HTML when the LLM returns structure only.
 * Supports `.container` (revision), legacy `.study-notes`, and `.notebook-page` layouts.
 */
export function ensureGeneratedHtml(html: string) {
  const trimmed = html.trim()
  if (!trimmed) {
    return trimmed
  }

  if (htmlUsesRevisionNotes(trimmed)) {
    return injectHeadStyle(trimmed, 'revision-notes-styles', REVISION_NOTES_CSS)
  }

  if (htmlUsesStudyNotes(trimmed)) {
    return injectHeadStyle(
      trimmed,
      'study-notes-styles',
      LEGACY_STUDY_NOTES_CSS,
    )
  }

  if (htmlUsesNotebookPages(trimmed)) {
    return injectHeadStyle(trimmed, 'a4-notebook-styles', A4_NOTEBOOK_CSS)
  }

  return trimmed
}

/**
 * @deprecated Use ensureGeneratedHtml. Kept for backward compatibility.
 */
export function ensureA4NotebookHtml(html: string) {
  return ensureGeneratedHtml(html)
}

export type PrepareNotebookForViewOptions = {
  /** Scale factor for on-screen reading (1 = 100%). */
  zoom?: number
}

/**
 * Prepares stored notebook HTML for a PDF-style reader: gray canvas, centered
 * A4 pages, and configurable zoom. Print output stays true A4.
 */
export function prepareNotebookForView(
  html: string,
  options: PrepareNotebookForViewOptions = {},
) {
  const zoom = options.zoom ?? 1
  const cleaned = stripInjectedNotebookStyles(html.trim())
  if (!cleaned) {
    return cleaned
  }

  const usesNotebookPages = htmlUsesNotebookPages(cleaned)
  const withStyles = ensureGeneratedHtml(cleaned)

  const withPdfChrome = injectHeadStyle(
    withStyles,
    'notebook-pdf-view',
    usesNotebookPages ? NOTEBOOK_PDF_VIEW_CSS : CUSTOM_HTML_VIEW_CSS,
  )

  const zoomStyle = `<style id="notebook-zoom-var">:root{--notebook-zoom:${zoom};}</style>`

  if (/id=["']notebook-zoom-var["']/.test(withPdfChrome)) {
    return withPdfChrome.replace(
      /<style id=["']notebook-zoom-var["']>[\s\S]*?<\/style>/i,
      zoomStyle,
    )
  }

  if (/<\/head>/i.test(withPdfChrome)) {
    return withPdfChrome.replace(/<\/head>/i, `${zoomStyle}</head>`)
  }

  return `${zoomStyle}${withPdfChrome}`
}
