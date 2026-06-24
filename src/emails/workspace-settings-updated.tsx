import {
  WorkspaceNotificationBase,
  type WorkspaceNotificationBaseProps,
} from './workspace-notification-base'

export type WorkspaceSettingsUpdatedEmailProps = {
  userName?: string | null
  workspaceName: string
  changedByName: string
  updatedAt: string
  summary: string
  settingsUrl: string
}

export default function WorkspaceSettingsUpdatedEmail({
  userName,
  workspaceName,
  changedByName,
  updatedAt,
  summary,
  settingsUrl,
}: WorkspaceSettingsUpdatedEmailProps) {
  const content: WorkspaceNotificationBaseProps = {
    preview: `Workspace settings updated in ${workspaceName}`,
    title: 'Workspace settings were updated',
    greetingName: userName,
    intro: `${workspaceName} settings were updated.`,
    details: `Updated by: ${changedByName}\nUpdated at: ${updatedAt}\nChanges: ${summary}`,
    actionLabel: 'Review workspace settings',
    actionUrl: settingsUrl,
  }

  return <WorkspaceNotificationBase {...content} />
}

WorkspaceSettingsUpdatedEmail.PreviewProps = {
  userName: 'Jane Doe',
  workspaceName: 'Acme Workspace',
  changedByName: 'John Doe',
  updatedAt: 'Apr 22, 2026 11:35 AM UTC',
  summary: 'Workspace name changed from "Acme Team" to "Acme Workspace".',
  settingsUrl: 'https://example.com/app/acme/settings',
} satisfies WorkspaceSettingsUpdatedEmailProps
