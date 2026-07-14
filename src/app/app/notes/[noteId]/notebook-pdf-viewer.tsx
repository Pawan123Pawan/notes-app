'use client'

import Link from 'next/link'
import { useCallback, useRef, useState } from 'react'
import { ExternalLink, Maximize, Minus, Plus, Printer } from 'lucide-react'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
  NOTEBOOK_A4_WIDTH_PX,
  prepareNotebookForView,
} from '@/lib/notebook-html'
import { cn } from '@/lib/utils'

export type NotebookPdfViewerProps = {
  title: string
  html: string
  noteId?: string
  subjectId?: string
  subjectName?: string
  /** Fullscreen PDF surface without app shell chrome. */
  variant?: 'embedded' | 'standalone'
}

const minZoom = 0.5
const maxZoom = 2
const zoomStep = 0.1

export function NotebookPdfViewer({
  title,
  html,
  noteId,
  subjectId,
  subjectName,
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
  const frameMinHeight = isStandalone
    ? 'min-h-[calc(100dvh-3.25rem)]'
    : 'min-h-[calc(100dvh-12rem)]'

  const measureFitZoom = useCallback((width: number) => {
    const available = Math.max(width - 48, 200)
    const next = Math.min(
      Math.max(available / NOTEBOOK_A4_WIDTH_PX, minZoom),
      maxZoom,
    )
    setFitZoom(next)
  }, [])

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

  const header = (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2',
        isStandalone && 'bg-background',
      )}
    >
      <Breadcrumb className="min-w-0">
        <BreadcrumbList className="flex-wrap sm:flex-nowrap">
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/app">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {subjectId && subjectName ? (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/app/subjects/${subjectId}`}>{subjectName}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </>
          ) : null}
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="max-w-48 truncate sm:max-w-xs">
              {title}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
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
        {!isStandalone && noteId ? (
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
    </div>
  )

  const frame = (
    <div
      ref={containerRef}
      className={cn(frameMinHeight, 'bg-muted-foreground')}
    >
      <iframe
        ref={iframeRef}
        key={zoomLabel}
        title={`${title} notebook`}
        srcDoc={srcDoc}
        className={cn('block h-full w-full border-0', frameMinHeight)}
      />
    </div>
  )

  if (isStandalone) {
    return (
      <div className="flex min-h-dvh flex-col">
        {header}
        {frame}
      </div>
    )
  }

  return (
    <div className="h-full overflow-hidden py-0">
      {header}
      {frame}
    </div>
  )
}
