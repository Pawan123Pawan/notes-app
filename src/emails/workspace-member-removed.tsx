import {
  WorkspaceNotificationBase,
  type WorkspaceNotificationBaseProps,
} from './workspace-notification-base'

export type WorkspaceMemberRemovedEmailProps = {
  userName?: string | null
  workspaceName: string
  memberName: string
  removedByName: string
  removedAt: string
  membersUrl: string
}

export default function WorkspaceMemberRemovedEmail({
  userName,
  workspaceName,
  memberName,
  removedByName,
  removedAt,
  membersUrl,
}: WorkspaceMemberRemovedEmailProps) {
  const content: WorkspaceNotificationBaseProps = {
    preview: `A member was removed from ${workspaceName}`,
    title: 'A member was removed from the workspace',
    greetingName: userName,
    intro: `${memberName} was removed from ${workspaceName}.`,
    details: `Removed by: ${removedByName}\nRemoved at: ${removedAt}`,
    actionLabel: 'Review members and roles',
    actionUrl: membersUrl,
  }

  return <WorkspaceNotificationBase {...content} />
}

WorkspaceMemberRemovedEmail.PreviewProps = {
  userName: 'John Doe',
  workspaceName: 'Acme Workspace',
  memberName: 'Jane Doe',
  removedByName: 'Admin User',
  removedAt: 'Apr 22, 2026 11:20 AM UTC',
  membersUrl: 'https://example.com/app/acme/members',
} satisfies WorkspaceMemberRemovedEmailProps
