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
  body { background: white; }
  .notebook-page {
    margin: 0;
    box-shadow: none;
    page-break-after: always;
  }
}
`.trim()

/**
 * Guarantees A4 page sizing and colorful notebook styles even if the LLM
 * returns incomplete CSS.
 */
export function ensureA4NotebookHtml(html: string) {
  const trimmed = html.trim()
  if (!trimmed) {
    return trimmed
  }

  const styleTag = `<style id="a4-notebook-styles">\n${A4_NOTEBOOK_CSS}\n</style>`

  if (/id=["']a4-notebook-styles["']/.test(trimmed)) {
    return trimmed
  }

  if (/<\/head>/i.test(trimmed)) {
    return trimmed.replace(/<\/head>/i, `${styleTag}</head>`)
  }

  if (/<html[^>]*>/i.test(trimmed)) {
    return trimmed.replace(
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
${trimmed}
</body>
</html>`
}
