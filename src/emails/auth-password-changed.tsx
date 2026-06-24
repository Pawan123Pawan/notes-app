import {
  NotificationEmailBase,
  type NotificationEmailBaseProps,
} from './notification-email-base'

export type AuthPasswordChangedEmailProps = {
  userName?: string | null
  workspaceName: string
  changedAt: string
  securityUrl: string
}

export default function AuthPasswordChangedEmail({
  userName,
  workspaceName,
  changedAt,
  securityUrl,
}: AuthPasswordChangedEmailProps) {
  const content: NotificationEmailBaseProps = {
    preview: `Password changed for ${workspaceName}`,
    title: 'Password changed',
    greetingName: userName,
    intro: `Your account password for ${workspaceName} was changed.`,
    details: `Change time: ${changedAt}`,
    actionLabel: 'Review security settings',
    actionUrl: securityUrl,
    footer:
      'If you did not make this change, secure your account immediately and contact support.',
  }

  return <NotificationEmailBase {...content} />
}

AuthPasswordChangedEmail.PreviewProps = {
  userName: 'Jane Doe',
  workspaceName: 'Acme Workspace',
  changedAt: 'Apr 22, 2026 10:30 AM UTC',
  securityUrl: 'https://example.com/app/acme/settings?tab=account',
} satisfies AuthPasswordChangedEmailProps
