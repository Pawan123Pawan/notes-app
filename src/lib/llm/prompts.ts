export const structureNotesPrompt = (
  rawTranscript: string,
) => `You are an expert academic note-taker for Hindi-medium students. Take as much care as needed to produce accurate, complete study notes.

LANGUAGE RULES (STRICT):
- Write ALL notes in **Hindi** (Devanagari script): headings, explanations, bullets, takeaways, and revision sections.
- Keep **keywords / key terms / technical concepts bilingual**: Hindi first, then the English term in parentheses.
  Example: **प्रकाश संश्लेषण (Photosynthesis)**, **कोशिका (Cell)**, **निर्वाचन (Election)**
- Proper nouns that are already English brand/product names may stay in English.
- Section titles must also be in Hindi, e.g. "## मुख्य बिंदु (Key Takeaways)", "## त्वरित पुनरावृत्ति (Revision Quick Reference)"
- Formulas, LaTeX, numbers, and code stay as-is (not translated).

CONTENT RULES:
- Prefer depth and completeness over speed — cover every topic from the transcript thoroughly
- Add clear headings (H1, H2, H3) and subheadings in Hindi
- Highlight key concepts, definitions, and bilingual keywords in **bold**
- Use bullet points and numbered lists for steps and enumerations
- Include examples where the speaker gave them; add brief clarifying examples if helpful (in Hindi)
- Call out tips with blockquotes: > **टिप (Tip):** ...
- Add a "मुख्य बिंदु (Key Takeaways)" section at the end (5–10 bullets)
- Add a "त्वरित पुनरावृत्ति (Revision Quick Reference)" section with the most important facts
- Preserve ALL factual content from the transcript — do not invent information
- You MAY condense filler words and repetition, but do NOT omit topics
- Use clean markdown formatting throughout (plain structure; no HTML colors)
- For formulas use LaTeX: inline $...$ and block $$...$$
- For tables, use markdown tables
- For processes/relationships described in text, add a mermaid diagram block where helpful (node labels in Hindi; bilingual keywords where useful)

TRANSCRIPT:
---
${rawTranscript}
---

Output ONLY the markdown notes in Hindi with bilingual English keywords. No preamble or explanation.`

export const notebookHtmlPrompt = (
  structuredNotes: string,
) => `Convert the provided study notes into complete, colorful, A4 handwritten spiral notebook HTML.

OUTPUT RULES:
- Return ONLY a complete HTML document. No markdown fences, no preamble, no explanation.
- Reproduce 100% of the provided text exactly (Hindi Devanagari + bilingual English keywords).
- Do NOT summarize, shorten, rewrite, translate, or omit any information.
- Split content across as many A4 pages as needed so text does not overflow a page.
- Take time to produce correct dimensions, spacing, and colorful visual hierarchy.

STRICT A4 PAGE SIZE (required CSS — copy these rules exactly):
.notebook-page {
  width: 210mm;
  height: 297mm;
  min-width: 210mm;
  min-height: 297mm;
  max-width: 210mm;
  max-height: 297mm;
  box-sizing: border-box;
  margin: 12px auto;
  padding: 18mm 18mm 20mm 28mm;
  position: relative;
  overflow: hidden;
  page-break-after: always;
  background-color: #fffef0;
  background-image: repeating-linear-gradient(
    transparent,
    transparent 7.8mm,
    rgba(100, 149, 237, 0.18) 7.8mm,
    rgba(100, 149, 237, 0.18) 8mm
  );
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.12);
}
@page { size: A4; margin: 0; }
@media print {
  body { background: white; }
  .notebook-page {
    margin: 0;
    box-shadow: none;
    page-break-after: always;
  }
}

PAGE CHROME:
- Spiral binding dots/holes on the left edge of each page
- Red vertical margin line ~20mm from the left
- Page numbers centered at the bottom (Page N)

COLORFUL TYPOGRAPHY (HTML notebook ONLY — multi-color, large type):
- Fonts: Google Fonts Noto Sans Devanagari + Caveat
- Body: 20px–22px, line-height 1.75, color #1a1a2e
- H1: 34px–40px, bold; cycle colors #1e3a8a / #6d28d9 / #0f766e
- H2: 26px–30px, color #1d4ed8 or #b45309
- H3: 22px–24px, color #047857
- Keywords / strong: #c0392b with yellow marker highlight #fff59d
- Bullets: blue markers; tip boxes lavender; takeaways mint; revision peach

STRUCTURE:
<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Noto+Sans+Devanagari:wght@400;600;700&display=swap" rel="stylesheet">
  <style>/* include full A4 CSS above + colorful text styles */</style>
</head>
<body style="margin:0;background:#e8eaf0;">
  <div class="notebook-page">...</div>
  <div class="notebook-page">...</div>
</body>
</html>

STUDY NOTES TO RENDER:
---
${structuredNotes}
---`

export const noteTitlePrompt = (
  structuredNotesPreview: string,
) => `Given these study notes, return ONLY a short title in Hindi (Devanagari, max 60 chars) suitable for a notebook cover.
You may include one key English term in parentheses if helpful.
No quotes, no explanation.

${structuredNotesPreview}`
