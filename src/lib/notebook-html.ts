const A4_NOTEBOOK_CSS = `
html, body {
  margin: 0;
  padding: 0;
  background: #e8eaf0;
}
body {
  font-family: 'Noto Sans Devanagari', 'Noto Sans', sans-serif;
  font-size: 20px;
  line-height: 1.75;
  color: #1a1a2e;
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
}
`.trim()

/** PDF-reader chrome for on-screen viewing (print stays true A4). */
const NOTEBOOK_PDF_VIEW_CSS = `
@media screen {
  html, body {
    margin: 0;
    background: #525659;
  }
  body {
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

/** CSS pixel width of one A4 page at 96dpi. */
export const NOTEBOOK_A4_WIDTH_PX = (210 * 96) / 25.4

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
 * Guarantees A4 page sizing and colorful notebook styles even if the LLM
 * returns incomplete CSS.
 */
export function ensureA4NotebookHtml(html: string) {
  const trimmed = html.trim()
  if (!trimmed) {
    return trimmed
  }

  return injectHeadStyle(trimmed, 'a4-notebook-styles', A4_NOTEBOOK_CSS)
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
  const withA4 = ensureA4NotebookHtml(html)
  if (!withA4) {
    return withA4
  }

  const withPdfChrome = injectHeadStyle(
    withA4,
    'notebook-pdf-view',
    NOTEBOOK_PDF_VIEW_CSS,
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
