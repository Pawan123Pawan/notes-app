const MAX_NOTEBOOK_HTML_LENGTH = 2_000_000

export function getNotebookHtmlMaxLength() {
  return MAX_NOTEBOOK_HTML_LENGTH
}

export function parseNotebookHtmlFile(fileName: string, content: string) {
  const extension = fileName.split('.').pop()?.toLowerCase()
  const trimmed = content.trim()

  if (!trimmed) {
    throw new Error('HTML file is empty')
  }

  if (extension && extension !== 'html' && extension !== 'htm') {
    throw new Error('Choose an .html or .htm file')
  }

  if (trimmed.length > MAX_NOTEBOOK_HTML_LENGTH) {
    throw new Error('HTML file is too large')
  }

  return {
    notebookHtml: trimmed,
    title: extractHtmlTitle(trimmed) ?? titleFromFileName(fileName),
  }
}

export function extractHtmlTitle(html: string) {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  const title = match?.[1]?.replace(/\s+/g, ' ').trim()

  return title || undefined
}

function titleFromFileName(fileName: string) {
  const base = fileName.replace(/\.[^.]+$/, '').trim()
  return base || 'Imported notebook'
}
