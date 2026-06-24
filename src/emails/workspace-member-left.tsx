import {
  WorkspaceNotificationBase,
  type WorkspaceNotificationBaseProps,
} from './workspace-notification-base'

export type WorkspaceMemberLeftEmailProps = {
  userName?: string | null
  workspaceName: string
  memberName: string
  memberEmail: string
  leftAt: string
  membersUrl: string
}

export default function WorkspaceMemberLeftEmail({
  userName,
  workspaceName,
  memberName,
  memberEmail,
  leftAt,
  membersUrl,
}: WorkspaceMemberLeftEmailProps) {
  const content: WorkspaceNotificationBaseProps = {
    preview: `A member left ${workspaceName}`,
    title: 'A member left the workspace',
    greetingName: userName,
    intro: `${memberName} left ${workspaceName}.`,
    details: `Email: ${memberEmail}\nLeft at: ${leftAt}`,
    actionLabel: 'Review member list',
    actionUrl: membersUrl,
  }

  return <WorkspaceNotificationBase {...content} />
}

WorkspaceMemberLeftEmail.PreviewProps = {
  userName: 'John Doe',
  workspaceName: 'Acme Workspace',
  memberName: 'Jane Doe',
  memberEmail: 'jane@example.com',
  leftAt: 'Apr 22, 2026 11:15 AM UTC',
  membersUrl: 'https://example.com/app/acme/members',
} satisfies WorkspaceMemberLeftEmailProps
