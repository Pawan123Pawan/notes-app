import {
  WorkspaceNotificationBase,
  type WorkspaceNotificationBaseProps,
} from './workspace-notification-base'

export type WorkspaceInvitationResponseEmailProps = {
  userName?: string | null
  workspaceName: string
  inviteeEmail: string
  response: 'accepted' | 'declined'
  respondedAt: string
  membersUrl: string
}

export default function WorkspaceInvitationResponseEmail({
  userName,
  workspaceName,
  inviteeEmail,
  response,
  respondedAt,
  membersUrl,
}: WorkspaceInvitationResponseEmailProps) {
  const content: WorkspaceNotificationBaseProps = {
    preview: `Invitation ${response} for ${workspaceName}`,
    title: `Invitation ${response}`,
    greetingName: userName,
    intro: `${inviteeEmail} has ${response} your invitation to join ${workspaceName}.`,
    details: `Response time: ${respondedAt}`,
    actionLabel: 'View workspace members',
    actionUrl: membersUrl,
  }

  return <WorkspaceNotificationBase {...content} />
}

WorkspaceInvitationResponseEmail.PreviewProps = {
  userName: 'John Doe',
  workspaceName: 'Acme Workspace',
  inviteeEmail: 'jane@example.com',
  response: 'accepted',
  respondedAt: 'Apr 22, 2026 11:00 AM UTC',
  membersUrl: 'https://example.com/app/acme/members',
} satisfies WorkspaceInvitationResponseEmailProps
