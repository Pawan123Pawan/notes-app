export function parseTranscriptFileContent(fileName: string, content: string) {
  const extension = fileName.split('.').pop()?.toLowerCase()

  if (extension === 'srt' || extension === 'vtt') {
    return stripSubtitleMarkup(content)
  }

  return content.trim()
}

function stripSubtitleMarkup(content: string) {
  return content
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) {
        return false
      }

      if (/^\d+$/.test(line)) {
        return false
      }

      if (/^\d{2}:\d{2}:\d{2}[.,]\d{3}\s+-->/.test(line)) {
        return false
      }

      if (line === 'WEBVTT') {
        return false
      }

      if (/^\d{2}:\d{2}:\d{2}[.,]\d{3}$/.test(line)) {
        return false
      }

      return true
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}
