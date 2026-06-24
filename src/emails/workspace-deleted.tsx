import {
  WorkspaceNotificationBase,
  type WorkspaceNotificationBaseProps,
} from './workspace-notification-base'

export type WorkspaceDeletedEmailProps = {
  userName?: string | null
  workspaceName: string
  deletedByName: string
  deletedAt: string
  supportUrl: string
}

export default function WorkspaceDeletedEmail({
  userName,
  workspaceName,
  deletedByName,
  deletedAt,
  supportUrl,
}: WorkspaceDeletedEmailProps) {
  const content: WorkspaceNotificationBaseProps = {
    preview: `${workspaceName} was deleted`,
    title: 'Workspace was deleted',
    greetingName: userName,
    intro: `The workspace ${workspaceName} has been deleted.`,
    details: `Deleted by: ${deletedByName}\nDeleted at: ${deletedAt}`,
    actionLabel: 'Contact support',
    actionUrl: supportUrl,
    footer:
      'If this deletion was unexpected, contact support immediately for next steps.',
  }

  return <WorkspaceNotificationBase {...content} />
}

WorkspaceDeletedEmail.PreviewProps = {
  userName: 'Jane Doe',
  workspaceName: 'Acme Workspace',
  deletedByName: 'John Doe',
  deletedAt: 'Apr 22, 2026 11:40 AM UTC',
  supportUrl: 'https://example.com/support',
} satisfies WorkspaceDeletedEmailProps
