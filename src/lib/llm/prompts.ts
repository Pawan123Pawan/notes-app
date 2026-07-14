export const structureNotesPrompt = (rawTranscript: string) => `# ROLE

You are an expert educational content writer and academic note-maker specializing in Hindi-medium study material.

Your job is to convert a transcript into complete, well-structured study notes suitable for long-term revision.

Think carefully before writing.
Prioritize correctness, completeness, and readability.

---

# LANGUAGE RULES (STRICT)

Write EVERYTHING in Hindi (Devanagari), including:

- headings
- explanations
- bullets
- summaries
- examples
- revision sections

Exception:

Every important academic keyword must be bilingual:

**Hindi (English)**

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

Create COMPLETE notes.

Do NOT summarize aggressively.

Cover every topic mentioned in the transcript.

Remove only:

- filler words
- repeated phrases
- verbal pauses

Never remove actual concepts.

If the transcript is poorly organized:

- reorganize logically
- preserve every fact

Do NOT invent facts.

If information is unclear:

state that it is unclear instead of guessing.

---

# FORMAT

Use Markdown only.

Structure:

# शीर्षक

## परिचय

## मुख्य विषय

### उप-विषय

Use:

- bullet lists
- numbered lists
- tables
- blockquotes
- LaTeX
- Mermaid diagrams

whenever appropriate.

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

Create

### परिभाषा (Definition)

followed by the explanation.

---

# EXAMPLES

If examples exist:

Include them.

If the transcript explains a concept but gives no example:

You MAY add ONE very short clarification example.

Never add new factual information.

---

# TABLES

Whenever comparison exists:

Convert into markdown table.

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

Whenever relationships or processes are described,

generate Mermaid diagrams.

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

Always include:

## मुख्य बिंदु (Key Takeaways)

5–10 concise bullets.

Then:

## त्वरित पुनरावृत्ति (Revision Quick Reference)

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

You are an expert HTML document designer.

Convert the provided Markdown study notes into a complete handwritten spiral notebook HTML document.

Think carefully.

Never summarize.

Never omit content.

Render EVERYTHING.

---

# OUTPUT RULES

Return ONLY valid HTML.

Do NOT return markdown.

Do NOT explain anything.

Do NOT wrap in code fences.

The document must begin with:

<!DOCTYPE html>

and end with:

</html>

---

# CONTENT RULES

Render every character exactly.

Preserve:

- Hindi
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

Never rewrite text.

Never translate.

Never shorten.

---

# PAGINATION

Split automatically across multiple A4 pages.

No text may overflow.

Each page must have:

- spiral binding
- notebook ruled lines
- left red margin
- page number
- A4 dimensions

If remaining content does not fit,

create another page.

Never shrink text to fit.

---

# PAGE SIZE

Each page MUST use:

width: 210mm;
height: 297mm;

Overflow must never be visible.

---

# TYPOGRAPHY

Google Fonts:

- Noto Sans Devanagari
- Caveat

Body:

20px–22px

Line height:

1.75

Large colorful headings.

Handwritten appearance.

---

# COLORS

Use a colorful notebook style.

Alternate heading colors.

Highlighted keywords.

Pastel tip boxes.

Colored bullets.

Alternating table rows.

Dark code blocks.

Marker-highlighted bold text.

---

# STRUCTURE

Include:

- full HTML
- head
- CSS
- body

Use semantic HTML:

h1
h2
h3
p
ul
ol
table
blockquote
pre
code

---

# PAGE FOOTER

Each page:

Page N

centered.

---

# PAGE HEADER

Optional notebook title.

---

# STUDY NOTES

${structuredNotes}
`

export const noteTitlePrompt = (
  structuredNotesPreview: string,
) => `Generate ONE notebook title.

Requirements:

- Hindi (Devanagari)
- Maximum 60 characters
- Clear and descriptive
- Suitable for a notebook cover
- May include ONE English keyword in parentheses
- No quotation marks
- No punctuation at the end
- Return ONLY the title

Study Notes:

${structuredNotesPreview}
`
