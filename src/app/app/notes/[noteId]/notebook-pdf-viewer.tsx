'use client'

import { useCallback, useRef, useState } from 'react'
import { ExternalLink, Maximize, Minus, Plus, Printer } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  NOTEBOOK_A4_WIDTH_PX,
  prepareNotebookForView,
} from '@/lib/notebook-html'

export type NotebookPdfViewerProps = {
  title: string
  html: string
  noteId?: string
  /** Fullscreen PDF-only surface (notebook pages only). */
  variant?: 'embedded' | 'standalone'
}

const minZoom = 0.5
const maxZoom = 2
const zoomStep = 0.1

export function NotebookPdfViewer({
  title,
  html,
  noteId,
  variant = 'embedded',
}: NotebookPdfViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [fitMode, setFitMode] = useState(true)
  const [fitZoom, setFitZoom] = useState(1)
  const [customZoom, setCustomZoom] = useState(1)

  const isStandalone = variant === 'standalone'
  const zoom = fitMode ? fitZoom : customZoom
  const srcDoc = prepareNotebookForView(html, { zoom })
  const zoomLabel = `${Math.round(zoom * 100)}%`

  const measureFitZoom = useCallback(
    (width: number) => {
      const available = Math.max(width - (isStandalone ? 0 : 48), 200)
      const next = Math.min(
        Math.max(available / NOTEBOOK_A4_WIDTH_PX, minZoom),
        maxZoom,
      )
      setFitZoom(next)
    },
    [isStandalone],
  )

  const containerRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) {
        return
      }

      measureFitZoom(node.clientWidth)

      const observer = new ResizeObserver((entries) => {
        const entry = entries[0]
        if (!entry) {
          return
        }

        measureFitZoom(entry.contentRect.width)
      })

      observer.observe(node)

      return () => {
        observer.disconnect()
      }
    },
    [measureFitZoom],
  )

  const setManualZoom = (next: number) => {
    setFitMode(false)
    setCustomZoom(Math.min(Math.max(next, minZoom), maxZoom))
  }

  const openInNewTab = () => {
    if (!noteId) {
      return
    }
    window.open(`/app/notes/${noteId}/view`, '_blank', 'noopener,noreferrer')
  }

  if (isStandalone) {
    return (
      <div ref={containerRef} className="min-h-dvh bg-[#525659]">
        <iframe
          ref={iframeRef}
          key={zoomLabel}
          title={`${title} notebook`}
          srcDoc={srcDoc}
          className="block min-h-dvh w-full border-0"
        />
      </div>
    )
  }

  return (
    <Card className="overflow-hidden py-0">
      <CardContent className="flex flex-col gap-0 p-0">
        <div className="flex flex-wrap items-center justify-end gap-1 border-b px-3 py-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Zoom out"
            disabled={zoom <= minZoom}
            onClick={() => setManualZoom(zoom - zoomStep)}
          >
            <Minus />
          </Button>
          <span className="text-muted-foreground w-14 text-center text-xs tabular-nums">
            {zoomLabel}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Zoom in"
            disabled={zoom >= maxZoom}
            onClick={() => setManualZoom(zoom + zoomStep)}
          >
            <Plus />
          </Button>
          <Button
            type="button"
            variant={fitMode ? 'secondary' : 'outline'}
            size="sm"
            aria-label="Fit to width"
            aria-pressed={fitMode}
            onClick={() => setFitMode(true)}
          >
            <Maximize />
            Fit width
          </Button>
          {noteId ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-label="Open notebook in new tab"
              onClick={openInNewTab}
            >
              <ExternalLink />
              New tab
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Print notebook"
            onClick={() => iframeRef.current?.contentWindow?.print()}
          >
            <Printer />
            Print
          </Button>
        </div>

        <div
          ref={containerRef}
          className="min-h-[calc(100dvh-12rem)] bg-[#525659]"
        >
          <iframe
            ref={iframeRef}
            key={zoomLabel}
            title={`${title} notebook`}
            srcDoc={srcDoc}
            className="block h-full min-h-[calc(100dvh-12rem)] w-full border-0"
          />
        </div>
      </CardContent>
    </Card>
  )
}
