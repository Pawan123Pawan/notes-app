import {
  NotificationEmailBase,
  type NotificationEmailBaseProps,
} from './notification-email-base'

export type AuthTwoFactorStatusChangedEmailProps = {
  userName?: string | null
  workspaceName: string
  status: 'enabled' | 'disabled'
  changedAt: string
  securityUrl: string
}

export default function AuthTwoFactorStatusChangedEmail({
  userName,
  workspaceName,
  status,
  changedAt,
  securityUrl,
}: AuthTwoFactorStatusChangedEmailProps) {
  const content: NotificationEmailBaseProps = {
    preview: `Two-factor authentication ${status}`,
    title: `Two-factor authentication ${status}`,
    greetingName: userName,
    intro: `Two-factor authentication was ${status} for your ${workspaceName} account.`,
    details: `Change time: ${changedAt}`,
    actionLabel: 'Manage authentication settings',
    actionUrl: securityUrl,
  }

  return <NotificationEmailBase {...content} />
}

AuthTwoFactorStatusChangedEmail.PreviewProps = {
  userName: 'Jane Doe',
  workspaceName: 'Acme Workspace',
  status: 'enabled',
  changedAt: 'Apr 22, 2026 10:40 AM UTC',
  securityUrl: 'https://example.com/app/acme/settings?tab=account',
} satisfies AuthTwoFactorStatusChangedEmailProps
