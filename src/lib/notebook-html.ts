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
.notebook-page h2 {
  font-size: 26px;
  line-height: 1.3;
  margin: 18px 0 10px;
  color: #1d4ed8;
}
.notebook-page h3 {
  font-size: 22px;
  line-height: 1.35;
  margin: 14px 0 8px;
  color: #047857;
}
.notebook-page strong {
  color: #c0392b;
  background: linear-gradient(transparent 58%, rgba(255, 245, 157, 0.75) 58%);
}
.notebook-page ul li::marker,
.notebook-page ol li::marker {
  color: #2563eb;
  font-weight: 700;
}
.notebook-page blockquote {
  margin: 12px 0;
  padding: 10px 14px;
  border-left: 5px solid #7c3aed;
  background: #ede9fe;
  border-radius: 0 10px 10px 0;
  color: #4c1d95;
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
