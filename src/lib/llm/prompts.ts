export const structureNotesPrompt = (rawTranscript: string) => `# ROLE

You are an expert academic note creator and educational content writer specializing in Hindi-medium study material.

Your task is to transform the given transcript into professional study notes.

Take as much time as needed.
Accuracy is more important than speed.

---

# LANGUAGE RULES (STRICT)

• Entire notes must be in Hindi (Devanagari), including headings, explanations, bullets, summaries, examples, and revision sections.
• Every important academic keyword must be bilingual:

**हिंदी (English)**

Examples:

- **कोशिका (Cell)**
- **प्रकाश संश्लेषण (Photosynthesis)**
- **लोकतंत्र (Democracy)**
- **मांग (Demand)**

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

यह जानकारी ट्रांसक्रिप्ट में स्पष्ट नहीं है।

If the transcript is poorly organized:

- reorganize logically
- preserve every fact

Do NOT summarize aggressively.
Create COMPLETE notes suitable for long-term revision.

---

# ORGANIZATION

Use Markdown only.

Structure:

# शीर्षक

## परिचय

## मुख्य विषय

### उप-विषय

Include whenever relevant:

• Definitions
• Important concepts
• Bullet lists
• Numbered steps
• Tables
• Examples
• Tips
• Warnings
• Mermaid diagrams when processes or relationships exist
• LaTeX for formulas

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

# DEFINITIONS

Whenever a definition exists:

### परिभाषा (Definition)

followed by the explanation.

---

# EXAMPLES

If examples exist in the transcript, include them.

If the transcript explains a concept but gives no example:

You MAY add ONE very short clarification example.

Never add new factual information.

---

# TABLES

Whenever a comparison exists, convert it into a markdown table.

---

# FORMULAS

Inline:

$E=mc^2$

Block:

$$
F = ma
$$

---

# DIAGRAMS

Whenever relationships or processes are described, generate Mermaid diagrams.

Example:

\`\`\`mermaid
graph TD
A[ऊर्जा (Energy)] --> B[कार्य (Work)]
\`\`\`

Node labels should remain bilingual.

---

# TIP BOXES

Important tricks:

> **टिप (Tip):**
> ...

Warnings:

> **सावधानी (Warning):**
> ...

---

# END SECTIONS

Always end with:

## मुख्य बिंदु (Key Takeaways)

5–10 concise bullets.

Then:

## त्वरित पुनरावृत्ति (Revision)

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

---

# TRANSCRIPT

${rawTranscript}
`

export const notebookHtmlPrompt = (structuredNotes: string) => `# ROLE

You are an expert HTML notebook designer.

Convert the provided Markdown study notes into a beautiful spiral notebook HTML document.

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

- <html>
- <head> (with CSS and Google Fonts)
- <body>
- </html>

---

# CONTENT RULES

Render every character from the study notes.

Preserve:

- Hindi (Devanagari)
- English keywords
- bold
- italic
- headings
- tables
- lists
- blockquotes
- Mermaid code blocks
- formulas
- code blocks

Never rewrite.
Never translate.
Never shorten.
Do NOT remove content.

---

# NOTEBOOK STYLE

• Spiral notebook appearance
• A4 pages
• Ruled paper lines
• Red left margin
• Page numbers (centered footer: Page N)
• Multiple pages as needed
• No overflowing content
• Google Fonts: Noto Sans Devanagari and Caveat

---

# PAGINATION

Split automatically across multiple A4 pages.

No text may overflow a page.

Each page must have:

- spiral binding visual
- notebook ruled lines
- left red margin
- page number
- A4 dimensions

If remaining content does not fit, create another page.

Never shrink text to fit.

---

# PAGE SIZE

Each page MUST use:

width: 210mm;
height: 297mm;

Overflow must never be visible.

---

# TYPOGRAPHY

Body: 20px–22px
Line height: 1.75
Large readable text
Handwritten notebook appearance using Caveat where appropriate (e.g. titles / accents)
Noto Sans Devanagari for Devanagari body text

• Colorful headings
• Highlight keywords (marker-style highlights on bold)
• Colored tables with alternating rows
• Colored tip / warning boxes for blockquotes
• Colored list markers

---

# STRUCTURE

Use semantic HTML:

h1, h2, h3, p, ul, ol, table, blockquote, pre, code

Optional notebook title in the page header.

---

# STUDY NOTES

${structuredNotes}
`

export const noteTitlePrompt = (
  structuredNotesPreview: string,
) => `Generate ONE notebook title for these study notes.

Requirements:

- Hindi (Devanagari)
- Maximum 60 characters
- Clear and descriptive
- Suitable for a notebook cover
- May include ONE English keyword in parentheses
- No quotation marks
- No punctuation at the end
- Return ONLY the title text

Study Notes:

${structuredNotesPreview}
`
