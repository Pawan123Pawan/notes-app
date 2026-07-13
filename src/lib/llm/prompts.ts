export const structureNotesPrompt = (
  rawTranscript: string,
) => `You are an expert academic note-taker. Transform the following transcript into attractive, detailed, structured study notes.

RULES:
- Add clear headings (H1, H2, H3) and subheadings
- Highlight key concepts, definitions, and formulas in **bold**
- Use bullet points and numbered lists for steps and enumerations
- Include examples where the speaker gave them; add brief clarifying examples if helpful
- Add a "Key Takeaways" section at the end (5–10 bullets)
- Add a "Revision Quick Reference" section with the most important facts
- Preserve ALL factual content from the transcript — do not invent information
- You MAY condense filler words and repetition, but do NOT omit topics
- Use markdown formatting throughout
- For formulas use LaTeX: inline $...$ and block $$...$$
- For tables, use markdown tables
- For processes/relationships described in text, add a mermaid diagram block where helpful

TRANSCRIPT:
---
${rawTranscript}
---

Output ONLY the markdown notes. No preamble or explanation.`

export const notebookHtmlPrompt = (
  structuredNotes: string,
) => `Convert the provided study notes into realistic handwritten spiral notebook pages.

OUTPUT RULES:
- Return ONLY complete HTML + CSS. No explanations, markdown, comments, or extra text.
- Reproduce 100% of the provided text exactly as written.
- Do NOT summarize, shorten, rewrite, or omit any information.
- Preserve all formulas, definitions, examples, tables, diagrams, flowcharts, lists, and Q&A sections.
- Convert textual explanations of diagrams/processes into simple handwritten SVG sketches where applicable.

NOTEBOOK STYLE:
- Multiple A4 pages (210mm × 297mm each), NOT one continuous canvas
- Each page is a <div class="notebook-page"> with spiral binding on the left
- Lined paper background (horizontal rules every ~8mm)
- Red vertical margin line on the left
- Handwriting font: use Google Font "Caveat" or "Patrick Hand"
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
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap" rel="stylesheet">
  <style>/* all styles here */</style>
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
) => `Given these study notes, return ONLY a short title (max 60 chars) suitable for a notebook cover.
No quotes, no explanation.

${structuredNotesPreview}`
