'use client'

import { useSyncExternalStore } from 'react'

import { useSidebar } from '@/components/ui/sidebar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import dayjs from '@/lib/dayjs'
import { cn } from '@/lib/utils'

const COUNTDOWN_START = '2026-09-15'
const COUNTDOWN_TARGET = '2026-12-03'

let nowMs: number | null = null

function msUntilNextHour(fromMs: number) {
  const nextHour = new Date(fromMs)
  nextHour.setMinutes(0, 0, 0)
  nextHour.setHours(nextHour.getHours() + 1)
  return Math.max(1, nextHour.getTime() - fromMs)
}

function subscribeToHourClock(onStoreChange: () => void) {
  let timeoutId = 0

  function tick() {
    nowMs = Date.now()
    onStoreChange()
    timeoutId = window.setTimeout(tick, msUntilNextHour(Date.now()))
  }

  function onVisibilityChange() {
    if (document.visibilityState !== 'visible') {
      return
    }

    window.clearTimeout(timeoutId)
    tick()
  }

  tick()
  document.addEventListener('visibilitychange', onVisibilityChange)

  return () => {
    window.clearTimeout(timeoutId)
    document.removeEventListener('visibilitychange', onVisibilityChange)
  }
}

function getNowSnapshot() {
  return nowMs
}

function getNowServerSnapshot() {
  return null
}

function useNowMs() {
  return useSyncExternalStore(
    subscribeToHourClock,
    getNowSnapshot,
    getNowServerSnapshot,
  )
}

function getCountdown(now: number) {
  const current = dayjs(now)
  const start = dayjs(COUNTDOWN_START).startOf('day')
  const target = dayjs(COUNTDOWN_TARGET).startOf('day')
  const today = current.startOf('day')
  const totalHours = Math.max(0, target.diff(current, 'hour'))
  const totalMs = Math.max(1, target.diff(start))
  const elapsedMs = current.diff(start)
  const progress = Math.min(1, Math.max(0, elapsedMs / totalMs))

  return {
    days: Math.floor(totalHours / 24),
    hours: totalHours % 24,
    progress,
    isDone: today.isAfter(target),
  }
}

export function AppShellDayCounter() {
  const now = useNowMs()
  const { isMobile, state } = useSidebar()
  const countdown = now === null ? null : getCountdown(now)
  const isDone = countdown?.isDone ?? false
  const days = countdown?.days ?? 0
  const hours = countdown?.hours ?? 0
  const progress = countdown?.progress ?? 0

  const tooltip =
    countdown === null
      ? 'Countdown to 3 Dec'
      : isDone
        ? 'Done · 3 Dec'
        : `${days}d ${hours}h left · 3 Dec`

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          role="status"
          aria-live="polite"
          aria-label={
            countdown === null
              ? 'Countdown to 3 December 2026'
              : isDone
                ? 'Countdown complete, 3 December 2026'
                : `${days} days and ${hours} hours left until 3 December 2026`
          }
          className={cn(
            'bg-primary text-primary-foreground w-full rounded-xl p-3 shadow-[0_10px_24px_oklch(0_0_0/0.22),0_1px_0_oklch(1_0_0/0.18)_inset]',
            'group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-lg group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:shadow-none',
          )}
        >
          <span className="hidden text-xs font-semibold tabular-nums group-data-[collapsible=icon]:inline">
            {countdown === null ? '—' : isDone ? '0' : days}
          </span>
          <div className="flex flex-col gap-2.5 group-data-[collapsible=icon]:hidden">
            <p className="text-[0.7rem] font-medium tracking-wide text-balance uppercase opacity-80">
              Until 3 Dec 2026
            </p>
            {isDone ? (
              <p className="text-2xl leading-none font-semibold tracking-tight">
                Done
              </p>
            ) : (
              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[2rem] leading-none font-semibold tracking-tight tabular-nums">
                    {countdown === null ? '—' : days}
                  </p>
                  <p className="mt-1 text-[0.7rem] font-medium tracking-wide uppercase opacity-80">
                    days
                  </p>
                </div>
                <div className="bg-primary-foreground/20 rounded-lg px-2.5 py-1.5 shadow-[0_1px_0_oklch(1_0_0/0.16)_inset]">
                  <p className="text-xl leading-none font-semibold tabular-nums">
                    {countdown === null ? '—' : hours}
                  </p>
                  <p className="mt-1 text-[0.65rem] font-medium tracking-wide uppercase opacity-80">
                    hours
                  </p>
                </div>
              </div>
            )}
            <div className="bg-primary-foreground/20 h-1.5 overflow-hidden rounded-full">
              <div
                className="bg-primary-foreground h-full rounded-full transition-[width] duration-500"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <p className="text-[0.65rem] font-medium tracking-wide opacity-70">
              15 Sep → 3 Dec
            </p>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        align="center"
        hidden={state !== 'collapsed' || isMobile}
      >
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}
