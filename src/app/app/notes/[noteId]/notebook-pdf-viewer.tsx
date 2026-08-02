'use client'

import Link from 'next/link'
import { useCallback, useRef, useState, useSyncExternalStore } from 'react'
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
import { triggerRouteProgressStart } from '@/lib/route-progress'

export type NotebookBreadcrumbFolder = {
  id: string
  name: string
}

export type NotebookPdfViewerProps = {
  title: string
  html: string
  subjectId?: string
  subjectName?: string
  /** Ancestor folders from subject root to the note’s folder (inclusive). */
  folderPath?: NotebookBreadcrumbFolder[]
}

const minZoom = 0.5
const maxZoom = 2
const zoomStep = 0.1
/** Mobile + tablet (below Tailwind `lg`). */
const compactBreakpoint = 1024
const compactDefaultZoom = 0.5

function subscribeCompactViewport(onStoreChange: () => void) {
  const mql = window.matchMedia(`(max-width: ${compactBreakpoint - 1}px)`)
  mql.addEventListener('change', onStoreChange)
  return () => mql.removeEventListener('change', onStoreChange)
}

function getCompactViewportSnapshot() {
  return window.innerWidth < compactBreakpoint
}

function getCompactViewportServerSnapshot() {
  return false
}

function useIsCompactViewport() {
  return useSyncExternalStore(
    subscribeCompactViewport,
    getCompactViewportSnapshot,
    getCompactViewportServerSnapshot,
  )
}

export function NotebookPdfViewer({
  title,
  html,
  subjectId,
  subjectName,
  folderPath = [],
}: NotebookPdfViewerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const isCompactViewport = useIsCompactViewport()
  const [fitMode, setFitMode] = useState(false)
  const [fitZoom, setFitZoom] = useState(1)
  const [manualZoom, setManualZoom] = useState<number | null>(null)

  const customZoom = manualZoom ?? (isCompactViewport ? compactDefaultZoom : 1)
  const zoom = fitMode ? fitZoom : customZoom
  const srcDoc = prepareNotebookForView(html, { zoom })
  const zoomLabel = `${Math.round(zoom * 100)}%`
  const subjectHref = subjectId ? `/app?subjectId=${subjectId}` : '/app'

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

  const setZoom = (next: number) => {
    setFitMode(false)
    setManualZoom(Math.min(Math.max(next, minZoom), maxZoom))
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
        <Breadcrumb className="min-w-0">
          <BreadcrumbList className="flex-wrap sm:flex-nowrap">
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  href="/app"
                  onClick={() => triggerRouteProgressStart('/app')}
                >
                  Dashboard
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {subjectId && subjectName ? (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link
                      href={subjectHref}
                      onClick={() => triggerRouteProgressStart(subjectHref)}
                    >
                      {subjectName}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {folderPath.map((folder) => {
                  const href = `/app?subjectId=${subjectId}&folderId=${folder.id}`

                  return (
                    <span key={folder.id} className="contents">
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                          <Link
                            href={href}
                            onClick={() => triggerRouteProgressStart(href)}
                          >
                            {folder.name}
                          </Link>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                    </span>
                  )
                })}
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
            onClick={() => setZoom(zoom - zoomStep)}
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
            onClick={() => setZoom(zoom + zoomStep)}
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
        className="bg-muted-foreground h-0 min-h-0 flex-1 overflow-auto"
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
