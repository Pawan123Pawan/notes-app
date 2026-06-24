'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { SettingsSection } from './settings-section'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  workspaceNotificationDefaults,
  type WorkspaceNotificationSettingKey,
  type WorkspaceNotificationSettings,
} from '@/db/schema/settings'
import { showErrorToast } from '@/lib/utils'
import { useTRPC } from '@/trpc/client'
import { Switch } from '@/components/ui/switch'

type NotificationSettingsProps = {
  workspaceId: string
}

const notificationGroups: Array<{
  id: string
  title: string
  description: string
  items: Array<{
    key: WorkspaceNotificationSettingKey
    label: string
    description: string
  }>
}> = [
  {
    id: 'auth-security',
    title: 'Auth & Security Notifications',
    description:
      'Stay informed about account security actions that affect your workspace access.',
    items: [
      {
        key: 'authNewLoginDetected',
        label: 'New login detected',
        description: 'Device and location details for suspicious sign-ins.',
      },
      {
        key: 'authPasswordChanged',
        label: 'Password changed',
        description: 'When your account password is updated.',
      },
      {
        key: 'authTwoFactorStatusChanged',
        label: 'Two-factor authentication enabled or disabled',
        description: 'When 2FA status changes on your account.',
      },
      {
        key: 'authAccountDeletionInitiated',
        label: 'Account deletion initiated',
        description: 'When account deletion has been requested.',
      },
    ],
  },
  {
    id: 'workspace',
    title: 'Workspace Notifications',
    description:
      'Receive activity updates about membership, permissions, and workspace lifecycle events.',
    items: [
      {
        key: 'workspaceInvitationReceived',
        label: 'You were invited to a workspace',
        description: 'Invitation details and who sent it.',
      },
      {
        key: 'workspaceInvitationResponse',
        label: 'Your invitation was accepted or declined',
        description: 'Status updates for invitations you sent.',
      },
      {
        key: 'workspaceMemberJoined',
        label: 'A member joined the workspace',
        description: 'When a new member joins your workspace.',
      },
      {
        key: 'workspaceMemberLeft',
        label: 'A member left the workspace',
        description: 'When a member leaves voluntarily.',
      },
      {
        key: 'workspaceMemberRemoved',
        label: 'A member was removed from the workspace',
        description: 'When an admin removes a member.',
      },
      {
        key: 'workspaceRoleChanged',
        label: 'Your role was changed',
        description: 'For example, member to admin.',
      },
      {
        key: 'workspaceSettingsUpdated',
        label: 'Workspace settings were updated',
        description: 'Changes to workspace name, logo, and related details.',
      },
      {
        key: 'workspaceDeleted',
        label: 'Workspace was deleted',
        description: 'Critical alert when a workspace is deleted.',
      },
    ],
  },
]

export function NotificationSettings({
  workspaceId,
}: NotificationSettingsProps) {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const notificationsQuery = useQuery(
    trpc.settings.getNotifications.queryOptions({ workspaceId }),
  )

  const currentNotifications =
    notificationsQuery.data ?? workspaceNotificationDefaults
  const saveNotifications = useMutation(
    trpc.settings.updateNotifications.mutationOptions({
      onMutate: async (variables) => {
        const notificationsQueryKey = trpc.settings.getNotifications.queryKey({
          workspaceId,
        })
        await queryClient.cancelQueries({
          queryKey: notificationsQueryKey,
        })

        const previousNotifications =
          queryClient.getQueryData<WorkspaceNotificationSettings>(
            notificationsQueryKey,
          )
        queryClient.setQueryData(notificationsQueryKey, variables.notifications)

        return { previousNotifications, notificationsQueryKey }
      },
      onSuccess: (data) => {
        queryClient.setQueryData(
          trpc.settings.getNotifications.queryKey({ workspaceId }),
          data,
        )
        toast.success('Notification settings updated.')
      },
      onError: (error, _variables, context) => {
        if (context?.previousNotifications) {
          queryClient.setQueryData(
            context.notificationsQueryKey,
            context.previousNotifications,
          )
        }
        showErrorToast('Could not save notification settings.', error)
      },
      onSettled: async () => {
        await queryClient.invalidateQueries(
          trpc.settings.getNotifications.queryFilter({ workspaceId }),
        )
      },
    }),
  )

  if (notificationsQuery.isPending) {
    return (
      <p className="text-muted-foreground text-sm">
        Loading notification settings…
      </p>
    )
  }

  if (notificationsQuery.isError) {
    return (
      <p className="text-destructive text-sm">
        {notificationsQuery.error instanceof Error
          ? notificationsQuery.error.message
          : 'Could not load notification settings.'}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-10">
      <SettingsSection
        description="Choose what email notifications you receive for security and workspace activity."
        title="Notifications"
      >
        <div className="flex flex-col gap-6">
          {notificationGroups.map((group) => (
            <Card className="border-border" key={group.id}>
              <CardHeader>
                <CardTitle>{group.title}</CardTitle>
                <CardDescription>{group.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  {group.items.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-start justify-between gap-5"
                    >
                      <div className="min-w-0">
                        <p className="text-foreground text-sm font-medium">
                          {item.label}
                        </p>
                        <p className="text-muted-foreground mt-1 text-sm">
                          {item.description}
                        </p>
                      </div>
                      <Switch
                        checked={currentNotifications[item.key]}
                        disabled={saveNotifications.isPending}
                        aria-label={`Toggle ${item.label}`}
                        onCheckedChange={() => {
                          saveNotifications.mutate({
                            workspaceId,
                            notifications: {
                              ...currentNotifications,
                              [item.key]: !currentNotifications[item.key],
                            },
                          })
                        }}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {saveNotifications.isError ? (
            <p className="text-destructive text-sm">
              {saveNotifications.error instanceof Error
                ? saveNotifications.error.message
                : 'Could not save notification settings.'}
            </p>
          ) : null}
        </div>
      </SettingsSection>
    </div>
  )
}
