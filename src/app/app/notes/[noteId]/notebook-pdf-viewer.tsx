'use client'

import Link from 'next/link'
import { useCallback, useRef, useState } from 'react'
import { MaximizeIcon, MinusIcon, PlusIcon, PrinterIcon } from 'lucide-react'

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

export type NotebookPdfViewerProps = {
  title: string
  html: string
  subjectId?: string
  subjectName?: string
}

const minZoom = 0.5
const maxZoom = 2
const zoomStep = 0.1

export function NotebookPdfViewer({
  title,
  html,
  subjectId,
  subjectName,
}: NotebookPdfViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [fitMode, setFitMode] = useState(false)
  const [fitZoom, setFitZoom] = useState(1)
  const [customZoom, setCustomZoom] = useState(1)

  const zoom = fitMode ? fitZoom : customZoom
  const srcDoc = prepareNotebookForView(html, { zoom })
  const zoomLabel = `${Math.round(zoom * 100)}%`

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

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
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
                    <Link href={`/app/subjects/${subjectId}`}>
                      {subjectName}
                    </Link>
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
            <MinusIcon />
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
            <PlusIcon />
          </Button>
          <Button
            type="button"
            variant={fitMode ? 'secondary' : 'outline'}
            size="sm"
            aria-label="Fit to width"
            aria-pressed={fitMode}
            onClick={() => setFitMode(true)}
          >
            <MaximizeIcon />
            Fit width
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Print notebook"
            onClick={() => iframeRef.current?.contentWindow?.print()}
          >
            <PrinterIcon />
            Print
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="bg-muted-foreground min-h-0 flex-1 overflow-auto"
      >
        <iframe
          ref={iframeRef}
          key={zoomLabel}
          title={`${title} notebook`}
          srcDoc={srcDoc}
          className="block size-full min-h-full border-0"
        />
      </div>
    </div>
  )
}
