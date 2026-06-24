import {
  WorkspaceNotificationBase,
  type WorkspaceNotificationBaseProps,
} from './workspace-notification-base'

export type WorkspaceRoleChangedEmailProps = {
  userName?: string | null
  workspaceName: string
  oldRole: string
  newRole: string
  changedByName: string
  changedAt: string
  settingsUrl: string
}

export default function WorkspaceRoleChangedEmail({
  userName,
  workspaceName,
  oldRole,
  newRole,
  changedByName,
  changedAt,
  settingsUrl,
}: WorkspaceRoleChangedEmailProps) {
  const content: WorkspaceNotificationBaseProps = {
    preview: `Your role changed in ${workspaceName}`,
    title: 'Your role was changed',
    greetingName: userName,
    intro: `Your role in ${workspaceName} changed from ${oldRole} to ${newRole}.`,
    details: `Changed by: ${changedByName}\nChanged at: ${changedAt}`,
    actionLabel: 'Open workspace settings',
    actionUrl: settingsUrl,
  }

  return <WorkspaceNotificationBase {...content} />
}

WorkspaceRoleChangedEmail.PreviewProps = {
  userName: 'Jane Doe',
  workspaceName: 'Acme Workspace',
  oldRole: 'member',
  newRole: 'admin',
  changedByName: 'John Doe',
  changedAt: 'Apr 22, 2026 11:25 AM UTC',
  settingsUrl: 'https://example.com/app/acme/settings',
} satisfies WorkspaceRoleChangedEmailProps
