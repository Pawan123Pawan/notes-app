'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  CheckCheck,
  CircleAlert,
  CircleCheckBig,
  ExternalLink,
  Info,
  Trash2,
  XCircle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import dayjs from '@/lib/dayjs'
import { cn, showErrorToast } from '@/lib/utils'
import { useTRPC } from '@/trpc/client'

type NotificationsPageClientProps = {
  workspaceSlug: string
}

type NotificationTab = 'all' | 'unread' | 'read'
type NotificationType = 'info' | 'success' | 'warning' | 'error'

type WorkspaceNotificationRow = {
  id: string
  title: string
  body: string
  type: NotificationType
  actionUrl: string | null
  isRead: boolean
  readAt: string | Date | null
  createdAt: string | Date
}

function getNotificationTypeIcon(type: NotificationType) {
  switch (type) {
    case 'success':
      return <CircleCheckBig className="size-4 text-green-600" />
    case 'warning':
      return <CircleAlert className="size-4 text-amber-600" />
    case 'error':
      return <XCircle className="size-4 text-red-600" />
    default:
      return <Info className="size-4 text-blue-600" />
  }
}

function getFilteredNotifications(
  notifications: WorkspaceNotificationRow[],
  tab: NotificationTab,
) {
  if (tab === 'unread') return notifications.filter((item) => !item.isRead)
  if (tab === 'read') return notifications.filter((item) => item.isRead)
  return notifications
}

export function NotificationsPageClient({
  workspaceSlug,
}: NotificationsPageClientProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<NotificationTab>('all')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const notificationsQuery = useQuery(
    trpc.notification.list.queryOptions({ workspaceSlug }),
  )

  const notifications = useMemo(
    () => notificationsQuery.data ?? [],
    [notificationsQuery.data],
  )
  const unreadCount = notifications.filter((item) => !item.isRead).length
  const readCount = notifications.length - unreadCount

  const filteredNotifications = useMemo(
    () => getFilteredNotifications(notifications, activeTab),
    [activeTab, notifications],
  )
  const filteredNotificationIds = filteredNotifications.map((item) => item.id)
  const selectedFilteredCount = filteredNotificationIds.filter((id) =>
    selectedIds.includes(id),
  ).length
  const areAllFilteredSelected =
    filteredNotificationIds.length > 0 &&
    selectedFilteredCount === filteredNotificationIds.length
  const selectedCount = selectedIds.length

  const clearSelection = () => setSelectedIds([])

  const bulkMarkMutation = useMutation(
    trpc.notification.bulkMark.mutationOptions({
      onSuccess: async () => {
        clearSelection()
        await queryClient.invalidateQueries(
          trpc.notification.list.queryFilter({ workspaceSlug }),
        )
      },
      onError: (error) => {
        showErrorToast('Could not update notifications.', error)
      },
    }),
  )

  const bulkDeleteMutation = useMutation(
    trpc.notification.bulkDelete.mutationOptions({
      onSuccess: async () => {
        clearSelection()
        await queryClient.invalidateQueries(
          trpc.notification.list.queryFilter({ workspaceSlug }),
        )
      },
      onError: (error) => {
        showErrorToast('Could not delete notifications.', error)
      },
    }),
  )

  const isMutating = bulkMarkMutation.isPending || bulkDeleteMutation.isPending

  const onToggleSelection = (notificationId: string) => {
    setSelectedIds((previous) =>
      previous.includes(notificationId)
        ? previous.filter((id) => id !== notificationId)
        : [...previous, notificationId],
    )
  }

  const onToggleSelectAllFiltered = () => {
    if (areAllFilteredSelected) {
      setSelectedIds((previous) =>
        previous.filter((id) => !filteredNotificationIds.includes(id)),
      )
      return
    }

    setSelectedIds((previous) => {
      const merged = new Set([...previous, ...filteredNotificationIds])
      return Array.from(merged)
    })
  }

  return (
    <PageContainer>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/app/${workspaceSlug}`}>Workspace Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Notifications</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PageHeader
        title="Notifications"
        description="Review all notifications for this workspace and keep your inbox organized."
        extraAction={
          <Button
            type="button"
            variant="outline"
            loading={bulkMarkMutation.isPending}
            disabled={notifications.length === 0 || isMutating}
            onClick={() => {
              bulkMarkMutation.mutate({
                workspaceSlug,
                all: true,
                markAs: 'read',
              })
            }}
          >
            <CheckCheck className="size-4" />
            Mark all as read
          </Button>
        }
      />

      <div className="inline-flex rounded-md border p-1">
        <button
          type="button"
          className={cn(
            'rounded-sm px-3 py-1.5 text-sm',
            activeTab === 'all'
              ? 'bg-muted text-foreground font-medium'
              : 'text-muted-foreground hover:text-foreground',
          )}
          onClick={() => {
            setActiveTab('all')
            clearSelection()
          }}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          className={cn(
            'rounded-sm px-3 py-1.5 text-sm',
            activeTab === 'unread'
              ? 'bg-muted text-foreground font-medium'
              : 'text-muted-foreground hover:text-foreground',
          )}
          onClick={() => {
            setActiveTab('unread')
            clearSelection()
          }}
        >
          Unread ({unreadCount})
        </button>
        <button
          type="button"
          className={cn(
            'rounded-sm px-3 py-1.5 text-sm',
            activeTab === 'read'
              ? 'bg-muted text-foreground font-medium'
              : 'text-muted-foreground hover:text-foreground',
          )}
          onClick={() => {
            setActiveTab('read')
            clearSelection()
          }}
        >
          Read ({readCount})
        </button>
      </div>

      <div className="bg-card rounded-lg border p-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 rounded border"
                checked={areAllFilteredSelected}
                disabled={filteredNotifications.length === 0}
                onChange={onToggleSelectAllFiltered}
              />
              Select all
            </label>
            {selectedCount > 0 ? (
              <span className="text-muted-foreground text-sm">
                {selectedCount} selected
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={bulkMarkMutation.isPending}
              disabled={selectedCount === 0 || isMutating}
              onClick={() => {
                bulkMarkMutation.mutate({
                  workspaceSlug,
                  notificationIds: selectedIds,
                  markAs: 'read',
                })
              }}
            >
              Mark as read
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              loading={bulkMarkMutation.isPending}
              disabled={selectedCount === 0 || isMutating}
              onClick={() => {
                bulkMarkMutation.mutate({
                  workspaceSlug,
                  notificationIds: selectedIds,
                  markAs: 'unread',
                })
              }}
            >
              Mark as unread
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              loading={bulkDeleteMutation.isPending}
              disabled={selectedCount === 0 || isMutating}
              onClick={() => {
                bulkDeleteMutation.mutate({
                  workspaceSlug,
                  notificationIds: selectedIds,
                })
              }}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {notificationsQuery.isPending ? (
            <p className="text-muted-foreground px-2 py-5 text-sm">
              Loading notifications...
            </p>
          ) : notificationsQuery.isError ? (
            <p className="text-destructive px-2 py-5 text-sm">
              {notificationsQuery.error instanceof Error
                ? notificationsQuery.error.message
                : 'Could not load notifications.'}
            </p>
          ) : filteredNotifications.length === 0 ? (
            <p className="text-muted-foreground px-2 py-5 text-sm">
              No notifications found.
            </p>
          ) : (
            filteredNotifications.map((notification) => {
              const isSelected = selectedIds.includes(notification.id)

              return (
                <article
                  key={notification.id}
                  className={cn(
                    'rounded-lg border p-4',
                    isSelected && 'ring-primary ring-1',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 size-4 rounded border"
                      checked={isSelected}
                      onChange={() => {
                        onToggleSelection(notification.id)
                      }}
                    />
                    <div className="mt-1">
                      {getNotificationTypeIcon(notification.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-foreground text-base font-semibold">
                          {notification.title}
                        </h2>
                        {!notification.isRead ? (
                          <span className="bg-foreground inline-block size-2 rounded-full" />
                        ) : null}
                      </div>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {notification.body}
                      </p>
                      <div className="text-muted-foreground mt-3 flex items-center gap-4 text-sm">
                        <span>{dayjs(notification.createdAt).fromNow()}</span>
                        {notification.actionUrl ? (
                          <Link
                            href={notification.actionUrl}
                            className="text-foreground inline-flex items-center gap-1 hover:underline"
                          >
                            View details <ExternalLink className="size-3.5" />
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              )
            })
          )}
        </div>
      </div>
    </PageContainer>
  )
}
