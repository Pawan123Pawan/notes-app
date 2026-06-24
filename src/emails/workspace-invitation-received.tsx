import {
  WorkspaceNotificationBase,
  type WorkspaceNotificationBaseProps,
} from './workspace-notification-base'

export type WorkspaceInvitationReceivedEmailProps = {
  userName?: string | null
  workspaceName: string
  inviterName: string
  role: string
  invitationUrl: string
}

export default function WorkspaceInvitationReceivedEmail({
  userName,
  workspaceName,
  inviterName,
  role,
  invitationUrl,
}: WorkspaceInvitationReceivedEmailProps) {
  const content: WorkspaceNotificationBaseProps = {
    preview: `Invitation to join ${workspaceName}`,
    title: 'You were invited to a workspace',
    greetingName: userName,
    intro: `${inviterName} invited you to join ${workspaceName}.`,
    details: `Assigned role: ${role}`,
    actionLabel: 'Review invitation',
    actionUrl: invitationUrl,
  }

  return <WorkspaceNotificationBase {...content} />
}

WorkspaceInvitationReceivedEmail.PreviewProps = {
  userName: 'Jane Doe',
  workspaceName: 'Acme Workspace',
  inviterName: 'John Doe',
  role: 'member',
  invitationUrl: 'https://example.com/app/accept-invitation?id=invite_123',
} satisfies WorkspaceInvitationReceivedEmailProps
