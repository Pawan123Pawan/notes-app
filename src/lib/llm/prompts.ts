export const structureNotesPrompt = (rawTranscript: string) => `# ROLE

You are an expert academic note creator and educational content writer specializing in bilingual Hindi–English study material.

Your task is to transform the given transcript into attractive, detailed, and structured professional study notes.

Take as much time as needed.
Accuracy is more important than speed.

---

# LANGUAGE RULES (STRICT)

• Notes must be BILINGUAL: Hindi (Devanagari) primary + English parallel lines.
• Every heading, subheading, definition, bullet, and summary must appear in BOTH languages.
• Format headings as: ## हिंदी शीर्षक / English Heading
• Every important academic keyword must use: **हिंदी (English)**
• Examples:
  - **कोशिका (Cell)**
  - **प्रकाश संश्लेषण (Photosynthesis)**
  - **लोकतंत्र (Democracy)**

Do NOT translate:
- formulas
- code
- mathematical notation
- variable names
- URLs
- file names

Proper nouns remain unchanged.

---

# CONTENT RULES

• Cover every concept mentioned in the transcript.
• Never omit topics.
• Remove only filler words, repeated phrases, and verbal pauses.
• Preserve factual information.
• Never invent or hallucinate facts.
• If something is unclear, write exactly:

HI: यह जानकारी ट्रांसक्रिप्ट में स्पष्ट नहीं है।
EN: This information is not clear in the transcript.

If the transcript is poorly organized:
- reorganize logically
- preserve every fact

Do NOT summarize aggressively.
Create COMPLETE notes suitable for long-term revision.

Do NOT include MCQ quiz questions here — those are generated separately.

---

# REQUIRED SECTIONS (IN ORDER)

Use Markdown only. Follow this exact structure:

# शीर्षक / Title

## परिचय / Introduction
Brief bilingual overview of the topic.

## मुख्य अवधारणाएँ / Key Concepts
Use ### subtopics for each major concept.
Include definitions, explanations, and bullet lists.

### परिभाषा / Definition
Whenever a definition exists, provide Hindi + English.

## महत्वपूर्ण बिंदु / Important Points
Bulleted list of critical facts, rules, and formulas.

## उदाहरण / Examples
Include transcript examples. If a concept has no example, add ONE short clarification example only — no new facts.

Include whenever relevant:
• Numbered steps
• Tables (for comparisons)
• Mermaid diagrams when processes or relationships exist
• LaTeX for formulas

---

# VIDEO Q&A SECTION (MANDATORY)

## वीडियो प्रश्नोत्तर / Video Q&A

Create 10–20 question–answer pairs based ONLY on the transcript.

Each pair must use this exact format:

### Q1
**QuestionHI:** ...
**QuestionEN:** ...
**AnswerHI:** ...
**AnswerEN:** ...
**ExplanationHI:** ...
**ExplanationEN:** ...

Number sequentially: Q1, Q2, Q3 …

---

# EMPHASIS

Bold:
- definitions
- formulas
- keywords
- important dates
- names
- laws
- theories

Example:
**ऊर्जा संरक्षण का नियम (Law of Conservation of Energy)**

---

# TIP BOXES

Important tricks:
> **टिप / Tip:**
> HI: ...
> EN: ...

Warnings:
> **सावधानी / Warning:**
> HI: ...
> EN: ...

---

# DIAGRAMS

Whenever relationships or processes are described, generate Mermaid diagrams.

\`\`\`mermaid
graph TD
A[ऊर्जा (Energy)] --> B[कार्य (Work)]
\`\`\`

Node labels should remain bilingual.

---

# END SECTIONS

Always end with:

## मुख्य बिंदु / Key Takeaways
5–10 concise bilingual bullets.

## त्वरित पुनरावृत्ति / Quick Revision
Include:
- formulas
- definitions
- keywords
- dates
- important facts

---

# OUTPUT RULES

Return ONLY markdown.
No introduction.
No explanation.
No code fences except Mermaid.
No HTML.
No MCQ quiz questions.

---

# TRANSCRIPT

${rawTranscript}
`

export type VideoQuizBatch = {
  batchIndex: number
  totalBatches: number
  startQuestion: number
  endQuestion: number
}

export const videoQuizPrompt = (
  rawTranscript: string,
  structuredNotesPreview: string,
  batch: VideoQuizBatch,
) => `# ROLE

You are an expert exam question writer creating bilingual Hindi–English MCQs for video study material.

Generate EXACTLY ${batch.endQuestion - batch.startQuestion + 1} multiple-choice questions for this batch.
Question numbers: Q${String(batch.startQuestion).padStart(3, '0')} through Q${String(batch.endQuestion).padStart(3, '0')}.
Batch ${batch.batchIndex} of ${batch.totalBatches}.

---

# RULES (STRICT)

• Base every question ONLY on facts in the transcript and study notes preview.
• Never invent or hallucinate facts.
• Each question has exactly 4 options: A, B, C, D.
• Exactly one correct answer per question.
• All text must be bilingual (Hindi Devanagari + English).
• Do NOT repeat questions from other batches.
• Output EXACTLY ${batch.endQuestion - batch.startQuestion + 1} questions — no more, no less.

---

# OUTPUT FORMAT (STRICT)

${batch.batchIndex === 1 ? '## वीडियो क्विज़ / Video Quiz (100 MCQs)\n' : ''}
For each question use this exact schema:

### Q${String(batch.startQuestion).padStart(3, '0')}
**HI:** [Hindi question]
**EN:** [English question]
- A) [Hindi] / [English]
- B) [Hindi] / [English]
- C) [Hindi] / [English]
- D) [Hindi] / [English]
**Correct:** [A|B|C|D]
**ExplainHI:** [Hindi explanation of why the answer is correct]
**ExplainEN:** [English explanation of why the answer is correct]

Continue numbering sequentially through Q${String(batch.endQuestion).padStart(3, '0')}.

---

# OUTPUT RULES

Return ONLY markdown.
No introduction.
No explanation.
No HTML.
No code fences.

---

# STUDY NOTES PREVIEW

${structuredNotesPreview}

---

# TRANSCRIPT

${rawTranscript}
`

export const notebookHtmlPrompt = (structuredNotes: string) => `# ROLE

You are an expert HTML notebook designer.

Convert the provided Markdown study notes (including Video Q&A and 100 MCQ Video Quiz) into a beautiful spiral notebook HTML document.

Take as much time as needed.
Accuracy is more important than speed.

Never summarize.
Never omit content.
Never rewrite text.
Render EVERYTHING.

---

# OUTPUT RULES

Return ONLY a complete valid HTML document.

Do NOT return markdown.
Do NOT explain anything.
Do NOT wrap in code fences.

The document must begin with:

<!DOCTYPE html>

and include:
- <html lang="hi">
- <head> (with CSS and Google Fonts)
- <body>
- </html>

Each page wrapped in: <div class="notebook-page">...</div>
Page footer: <div class="page-number">Page N</div>

---

# COLOR PALETTE (USE ALL 6)

Define and use these colors throughout:
- Navy: #1e3a8a
- Violet: #7c3aed
- Emerald: #059669
- Amber: #b45309
- Rose: #be185d
- Cyan: #0891b2

Apply to headings, tables, tip boxes, list markers, and quiz panels.

---

# CONTENT RULES

Render every character from the study notes.

Preserve:
- Hindi (Devanagari)
- English text
- bold, italic, headings, tables, lists, blockquotes
- Mermaid code blocks, formulas, code blocks

Never rewrite. Never translate. Never shorten. Do NOT remove content.

---

# NOTEBOOK STYLE

• Spiral notebook appearance
• A4 pages (210mm × 297mm)
• Ruled paper lines
• Red left margin
• Page numbers (centered footer)
• Google Fonts: Noto Sans Devanagari and Caveat
• Colorful headings with marker-style highlights on bold keywords
• Colored tables with alternating rows
• Colored tip / warning blockquote boxes

---

# VIDEO Q&A HTML

Render each Q&A pair as:

<div class="qa-item">
  <div class="qa-question">
    <p class="qa-label">प्रश्न / Question</p>
    <p class="qa-hi">...</p>
    <p class="qa-en">...</p>
  </div>
  <div class="qa-answer">
    <p class="qa-label">उत्तर / Answer</p>
    <p class="qa-hi">...</p>
    <p class="qa-en">...</p>
    <p class="qa-explain-hi"><strong>व्याख्या:</strong> ...</p>
    <p class="qa-explain-en"><strong>Explanation:</strong> ...</p>
  </div>
</div>

---

# VIDEO QUIZ HTML (100 MCQs — CRITICAL LAYOUT)

Render EVERY MCQ using a TWO-COLUMN grid — answer panel on the RIGHT, NOT at the bottom.

Required structure for each question:

<div class="quiz-item">
  <div class="quiz-main">
    <p class="quiz-number">Q001</p>
    <p class="quiz-q-hi">...</p>
    <p class="quiz-q-en">...</p>
    <div class="quiz-options">
      <label class="quiz-option"><input type="radio" name="q001" value="A"> A) ...</label>
      <label class="quiz-option"><input type="radio" name="q001" value="B"> B) ...</label>
      <label class="quiz-option"><input type="radio" name="q001" value="C"> C) ...</label>
      <label class="quiz-option"><input type="radio" name="q001" value="D"> D) ...</label>
    </div>
  </div>
  <aside class="quiz-answer-panel">
    <p class="quiz-correct-label">सही उत्तर / Correct Answer</p>
    <p class="quiz-correct-letter">B</p>
    <p class="quiz-explain-hi">...</p>
    <p class="quiz-explain-en">...</p>
  </aside>
</div>

CSS for quiz layout (include in <head>):

.quiz-item {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 16px;
  align-items: start;
  margin: 16px 0;
  padding: 12px;
  border: 1.5px solid #bfdbfe;
  border-radius: 10px;
}
.quiz-main { min-width: 0; }
.quiz-answer-panel {
  background: linear-gradient(135deg, #ede9fe, #ecfeff);
  border: 2px solid #7c3aed;
  border-radius: 10px;
  padding: 12px;
}
.quiz-option {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 8px;
  margin: 4px 0;
  border-radius: 6px;
  cursor: pointer;
}
.quiz-correct-letter {
  font-size: 28px;
  font-weight: 700;
  color: #059669;
  text-align: center;
}

FORBIDDEN in quiz HTML:
- Toggle buttons, "Show answer", accordion, or show/hide controls
- Highlighting or bolding the correct option in the option list
- Placing the correct answer block BELOW the options (must be on the RIGHT side)
- All four options must look identical in styling

---

# PAGINATION

Split content across multiple A4 pages.
No text may overflow a page.
If content does not fit, create another page.
Never shrink text to fit.

---

# STUDY NOTES

${structuredNotes}
`

export const noteTitlePrompt = (
  structuredNotesPreview: string,
) => `Generate ONE notebook title for these study notes.

Requirements:

- Bilingual format: Hindi (Devanagari) with English in parentheses
- Example: कोशिका विज्ञान (Cell Biology)
- Maximum 60 characters
- Clear and descriptive
- Suitable for a notebook cover
- No quotation marks
- No punctuation at the end
- Return ONLY the title text

Study Notes:

${structuredNotesPreview}
`
