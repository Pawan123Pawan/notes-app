export const structureNotesPrompt = (
  rawTranscript: string,
) => `You are an expert academic note-taker for Hindi-medium students. Transform the following transcript into attractive, detailed, structured study notes.

LANGUAGE RULES (STRICT):
- Write ALL notes in **Hindi** (Devanagari script): headings, explanations, bullets, takeaways, and revision sections.
- Keep **keywords / key terms / technical concepts bilingual**: Hindi first, then the English term in parentheses.
  Example: **प्रकाश संश्लेषण (Photosynthesis)**, **कोशिका (Cell)**, **निर्वाचन (Election)**
- Proper nouns that are already English brand/product names may stay in English.
- Section titles must also be in Hindi, e.g. "## मुख्य बिंदु (Key Takeaways)", "## त्वरित पुनरावृत्ति (Revision Quick Reference)"
- Formulas, LaTeX, numbers, and code stay as-is (not translated).

CONTENT RULES:
- Add clear headings (H1, H2, H3) and subheadings in Hindi
- Highlight key concepts, definitions, and formulas in **bold**, with bilingual keywords as above
- Use bullet points and numbered lists for steps and enumerations
- Include examples where the speaker gave them; add brief clarifying examples if helpful (in Hindi)
- Add a "मुख्य बिंदु (Key Takeaways)" section at the end (5–10 bullets)
- Add a "त्वरित पुनरावृत्ति (Revision Quick Reference)" section with the most important facts
- Preserve ALL factual content from the transcript — do not invent information
- You MAY condense filler words and repetition, but do NOT omit topics
- Use markdown formatting throughout
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
) => `Convert the provided study notes into realistic handwritten spiral notebook pages.

OUTPUT RULES:
- Return ONLY complete HTML + CSS. No explanations, markdown, comments, or extra text.
- Reproduce 100% of the provided text exactly as written (Hindi Devanagari + bilingual English keywords).
- Do NOT summarize, shorten, rewrite, translate, or omit any information.
- Preserve all formulas, definitions, examples, tables, diagrams, flowcharts, lists, and Q&A sections.
- Convert textual explanations of diagrams/processes into simple handwritten SVG sketches where applicable.

NOTEBOOK STYLE:
- Multiple A4 pages (210mm × 297mm each), NOT one continuous canvas
- Each page is a <div class="notebook-page"> with spiral binding on the left
- Lined paper background (horizontal rules every ~8mm)
- Red vertical margin line on the left
- Handwriting-friendly fonts that support Hindi Devanagari AND Latin: load Google Fonts "Noto Sans Devanagari" (for Hindi) and "Caveat" (for any Latin flourish). Use Noto Sans Devanagari as the primary body/handwriting font for Devanagari text.
- Slight random rotation/offset on headings for realism
- Page numbers at bottom center
- Use CSS @media print for clean printing

COLOR PALETTE:
- Paper: #fffef0 (cream)
- Ink: #1a1a2e (dark blue-black)
- Highlights: soft yellow marker (#fff59d at 40% opacity)
- Important terms: underline with red pen (#c0392b)

STRUCTURE:
<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Noto+Sans+Devanagari:wght@400;700&display=swap" rel="stylesheet">
  <style>/* all styles here; body font-family: 'Noto Sans Devanagari', 'Caveat', sans-serif; */</style>
</head>
<body>
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
