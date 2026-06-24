import {
  NotificationEmailBase,
  type NotificationEmailBaseProps,
} from './notification-email-base'

export type AuthAccountDeletionInitiatedEmailProps = {
  userName?: string | null
  workspaceName: string
  requestedAt: string
  supportUrl: string
}

export default function AuthAccountDeletionInitiatedEmail({
  userName,
  workspaceName,
  requestedAt,
  supportUrl,
}: AuthAccountDeletionInitiatedEmailProps) {
  const content: NotificationEmailBaseProps = {
    preview: 'Account deletion initiated',
    title: 'Account deletion initiated',
    greetingName: userName,
    intro: `A request to delete your account in ${workspaceName} was initiated.`,
    details: `Request time: ${requestedAt}`,
    actionLabel: 'Contact support',
    actionUrl: supportUrl,
    footer:
      'If this request was not made by you, contact support immediately to protect your account.',
  }

  return <NotificationEmailBase {...content} />
}

AuthAccountDeletionInitiatedEmail.PreviewProps = {
  userName: 'Jane Doe',
  workspaceName: 'Acme Workspace',
  requestedAt: 'Apr 22, 2026 10:45 AM UTC',
  supportUrl: 'https://example.com/support',
} satisfies AuthAccountDeletionInitiatedEmailProps
