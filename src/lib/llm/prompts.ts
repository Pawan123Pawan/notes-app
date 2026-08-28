export const structureNotesPrompt = (rawTranscript: string) => `# TASK

Transform this transcript into detailed, revision-ready bilingual study notes.

Take as much time as needed. Accuracy is more important than speed.

---

# LANGUAGE (STRICT — BILINGUAL)

• Every section must be bilingual: Hindi (Devanagari) + English.
• Headings format: ## हिंदी शीर्षक / English Heading
• Keywords format: **हिंदी (English)**
• Examples: **कोशिका (Cell)**, **प्रकाश संश्लेषण (Photosynthesis)**

Do NOT translate: formulas, code, math notation, variable names, URLs, file names.
Proper nouns stay unchanged.

---

# CONTENT RULES

• Cover every concept from the transcript — never omit topics.
• Remove only filler words and verbal pauses.
• Never invent or hallucinate facts.
• If unclear, write:
  HI: यह जानकारी ट्रांसक्रिप्ट में स्पष्ट नहीं है।
  EN: This information is not clear in the transcript.
• Reorganize poorly ordered transcripts logically while preserving every fact.
• Create COMPLETE revision-ready notes — do not over-summarize.
• Do NOT include MCQ quiz questions here (generated separately).

---

# REQUIRED STRUCTURE (MARKDOWN ONLY — IN ORDER)

# शीर्षक / Title

## Part 1: [Topic Name in Hindi] ([English Topic Name])

Detailed topic cards. Use ### for each subtopic or concept block.

For each card-ready block, use bilingual fact pairs with badge-style labels:

### [Subtopic Title — Hindi / English]

**Label (Badge):** Hindi fact line.
EN: English fact line.

**Another Label:** Hindi fact.
EN: English fact.

Use these badge label styles when relevant:
- **शुरुआत / Start:** dates, launch info
- **मुख्य फोकस / Main Focus:** primary objective
- **मॉडल / Model:** frameworks, theories
- **प्रमुख घटनाएं / Key Events:** milestones
- **वृद्धि दर / Growth Rate:** targets vs achieved
- **विशेष बिंदु / Special Note:** warnings, exceptions

Mark highlight/special topics (reforms, holidays, crises, exam-critical definitions) with a note: [ACCENT CARD]

# HIGHLIGHT MARKERS (for colorful rendering)

Tag key facts so they render with bright highlights in the final HTML:
- Prefix subtopics with [ACCENT CARD] when they contain dates, reforms, crises, key events, or exam-critical definitions.
- Use **शुरुआत / Start:** or **प्रमुख घटनाएं / Key Events:** for every date, year, percentage, or statistic.
- Use **विशेष बिंदु / Special Note:** for warnings, exceptions, and common mistakes.
- Bold-wrap (**...**) dates, numbers, percentages, proper nouns, and key terms inside fact lines.
- In Part 2 table, bold-wrap dates, numbers, and key terms in all three columns — not just the topic column.

Include when relevant within Part 1:
• Numbered steps
• LaTeX for formulas ($inline$ or $$block$$)
• Mermaid diagrams for processes/relationships

---

## Part 2: [Synthesis Title in Hindi] ([English Synthesis Title])

A markdown comparison/synthesis table covering key facts from the transcript.

| विषय / Topic | प्रमुख तथ्य (Hindi) | Key Facts (English) |
|---|---|---|
| **Topic** | Hindi facts | English facts |

Include every major topic, event, date, name, and fact worth quick revision.
Add as many rows as needed — do not leave out transcript content.

---

# OUTPUT RULES

Return ONLY markdown.
No introduction. No explanation.
No code fences except Mermaid.
No HTML.
No MCQ quiz questions.
No Video Q&A section.
No separate Key Takeaways or Quick Revision sections (content belongs in Part 1 and Part 2).

---

# TRANSCRIPT

${rawTranscript}
`

export type VideoQuizBatch = {
  batchIndex: number
  totalBatches: number
  startQuestion: number
  endQuestion: number
  totalMcqCount: number
  padWidth: number
}

function formatQuizQuestionNumber(questionNumber: number, padWidth: number) {
  return padWidth > 0
    ? `Q${String(questionNumber).padStart(padWidth, '0')}`
    : `Q${questionNumber}`
}

export const videoQuizPrompt = (
  rawTranscript: string,
  structuredNotesPreview: string,
  batch: VideoQuizBatch,
) => {
  const batchCount = batch.endQuestion - batch.startQuestion + 1
  const startLabel = formatQuizQuestionNumber(
    batch.startQuestion,
    batch.padWidth,
  )
  const endLabel = formatQuizQuestionNumber(batch.endQuestion, batch.padWidth)
  const exampleLabel = formatQuizQuestionNumber(
    batch.startQuestion,
    batch.padWidth,
  )

  return `# TASK

Create bilingual Hindi–English MCQs for study material.

The user requested EXACTLY ${batch.totalMcqCount} MCQs in total.
This batch must contain EXACTLY ${batchCount} questions.
Question numbers: ${startLabel} through ${endLabel}.
Batch ${batch.batchIndex} of ${batch.totalBatches}.

---

# RULES (STRICT)

• You MUST produce exactly ${batch.totalMcqCount} MCQs across all batches combined.
• This batch: exactly ${batchCount} questions — no more, no less.
• Base every question ONLY on facts in the transcript and study notes preview.
• Never invent or hallucinate facts.
• Each question: exactly 4 options (A, B, C, D), exactly one correct answer.
• All text bilingual: Hindi (Devanagari) + English.
• Do NOT repeat questions from other batches.

---

# OUTPUT FORMAT

${batch.batchIndex === 1 ? `## Part 3: MCQ Quiz (${batch.totalMcqCount} MCQs)\n` : ''}
For each question:

### ${exampleLabel}
**HI:** [Hindi question]
**EN:** [English question]
- A) [Hindi] / [English]
- B) [Hindi] / [English]
- C) [Hindi] / [English]
- D) [Hindi] / [English]
**Correct:** [A|B|C|D]
**CorrectText:** [Full correct option text, e.g. B (Harrod-Domar Model)]
**ExplainHI:** [Hindi — why this answer is correct]
**ExplainEN:** [English — why this answer is correct]

Continue through ${endLabel}.

---

# OUTPUT RULES

Return ONLY markdown.
No introduction. No explanation. No HTML. No code fences.

---

# STUDY NOTES PREVIEW

${structuredNotesPreview}

---

# TRANSCRIPT

${rawTranscript}
`
}

export const notebookHtmlPrompt = (
  structuredNotes: string,
  mcqCount: number,
) => `# TASK

Transform the provided Markdown study notes into a complete HTML document.

The notes include Part 1 (detailed cards), Part 2 (synthesis table), and Part 3 (exactly ${mcqCount} MCQs).

Take as much time as needed. Accuracy is more important than speed.

Never summarize. Never omit content. Never rewrite text. Render EVERYTHING.

---

# OUTPUT RULES

Return ONLY a complete valid HTML document.

Do NOT include any <style> tags or CSS — styles are injected server-side.
Do NOT return markdown.
Do NOT explain anything.
Do NOT wrap in code fences.
Do NOT use external stylesheets.

Begin with <!DOCTYPE html> and include <html lang="hi">, <head> (meta charset + viewport only), <body>.

Put all content inside: <div class="container">...</div>

Do NOT use spiral notebook layout, A4 page divs, ruled lines, red margins, or page numbers.

---

# PART 1 — DETAILED CARDS

Render each ### subtopic as a card block.

Normal card:
<div class="card">
  <h3>Subtopic Title</h3>
  <div class="bilingual-block">
    <p class="hi-text"><span class="badge">Label</span> Hindi fact.</p>
    <p class="en-text">English fact.</p>
    <p class="hi-text"><span class="badge badge-accent">Label</span> Hindi fact.</p>
    <p class="en-text">English fact.</p>
  </div>
</div>

For [ACCENT CARD] topics or special highlights, use class="card card-accent".
For warnings/exceptions use <span class="badge badge-danger">Label</span>.

Each Hindi fact → <p class="hi-text"> with optional badge span.
Each English fact → <p class="en-text"> immediately after its Hindi pair.

# HIGHLIGHT AND COLOR RULES (IMPORTANT — READABILITY)

Apply colorful highlights to key facts so notes are easy to scan:
- [ACCENT CARD] subtopics → always use <div class="card card-accent"> (never plain .card).
- Dates, years, percentages, statistics, exam facts → <span class="badge badge-accent">Label</span> and wrap the value in <strong>.
- Warnings, exceptions, common mistakes → <span class="badge badge-danger">Label</span>.
- Key terms, names, numbers inside fact text → wrap in <strong> inside .hi-text and .en-text.
- Most cards should have at least one badge-accent or strong highlight.

---

# PART 2 — SYNTHESIS TABLE

Render the markdown table as a styled <table> with <thead> and <tbody>.
Preserve all rows. Use <strong> for topic names in the first column.
Also wrap dates, numbers, percentages, and key terms in <strong> inside every table cell.

---

# PART 3 — MCQs (${mcqCount} questions — CRITICAL)

Render ALL ${mcqCount} MCQs in a single-column layout. NO radio buttons. NO side panels.

<div class="mcq-container">
  <div class="mcq-item">
    <div class="mcq-header">Q1. Hindi question / English question</div>
    <ul class="mcq-options">
      <li>A) Option text</li>
      <li>B) Option text</li>
      <li>C) Option text</li>
      <li>D) Option text</li>
    </ul>
    <div class="mcq-answer-side">
      <span class="mcq-ans-label">Correct Option:</span> <strong>B (Full answer text)</strong>
      <div class="mcq-exp">व्याख्या: Hindi explanation. / English explanation.</div>
    </div>
  </div>
</div>

FORBIDDEN in MCQ HTML:
- Radio buttons, checkboxes, or interactive inputs
- Two-column grid layouts for questions
- Side answer panels (answers go BELOW options in .mcq-answer-side)
- Toggle buttons, "Show answer", accordion, or show/hide controls
- Highlighting or bolding the correct option in the option list
- Embedded <style> tags or inline CSS

---

# HEADINGS

- Document title → <h1> inside .container
- Part 1, Part 2, Part 3 section headings → <h2>
- Card subtopic titles → <h3> inside .card

---

# STUDY NOTES

${structuredNotes}
`

export const noteTitlePrompt = (structuredNotesPreview: string) => `# TASK

Generate ONE notebook cover title for these bilingual study notes.

Requirements:
- Bilingual: Hindi (Devanagari) with English in parentheses
- Example: कोशिका विज्ञान (Cell Biology)
- Maximum 60 characters
- Clear, descriptive, suitable for a notebook cover
- No quotation marks, no trailing punctuation
- Return ONLY the title text

Study Notes:

${structuredNotesPreview}
`
