import {
  WorkspaceNotificationBase,
  type WorkspaceNotificationBaseProps,
} from './workspace-notification-base'

export type WorkspaceMemberJoinedEmailProps = {
  userName?: string | null
  workspaceName: string
  memberName: string
  memberEmail: string
  joinedAt: string
  membersUrl: string
}

export default function WorkspaceMemberJoinedEmail({
  userName,
  workspaceName,
  memberName,
  memberEmail,
  joinedAt,
  membersUrl,
}: WorkspaceMemberJoinedEmailProps) {
  const content: WorkspaceNotificationBaseProps = {
    preview: `A member joined ${workspaceName}`,
    title: 'A member joined the workspace',
    greetingName: userName,
    intro: `${memberName} joined ${workspaceName}.`,
    details: `Email: ${memberEmail}\nJoined at: ${joinedAt}`,
    actionLabel: 'Review member list',
    actionUrl: membersUrl,
  }

  return <WorkspaceNotificationBase {...content} />
}

WorkspaceMemberJoinedEmail.PreviewProps = {
  userName: 'John Doe',
  workspaceName: 'Acme Workspace',
  memberName: 'Jane Doe',
  memberEmail: 'jane@example.com',
  joinedAt: 'Apr 22, 2026 11:05 AM UTC',
  membersUrl: 'https://example.com/app/acme/members',
} satisfies WorkspaceMemberJoinedEmailProps
