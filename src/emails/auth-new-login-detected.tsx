import {
  WorkspaceNotificationBase,
  type WorkspaceNotificationBaseProps,
} from './workspace-notification-base'

export type AuthNewLoginDetectedEmailProps = {
  userName?: string | null
  workspaceName: string
  device: string
  location: string
  loginAt: string
  securityUrl: string
}

export default function AuthNewLoginDetectedEmail({
  userName,
  workspaceName,
  device,
  location,
  loginAt,
  securityUrl,
}: AuthNewLoginDetectedEmailProps) {
  const content: WorkspaceNotificationBaseProps = {
    preview: `New login detected for ${workspaceName}`,
    title: 'New login detected',
    greetingName: userName,
    intro: `A new sign-in was detected for your account in ${workspaceName}.`,
    details: `Device: ${device}\nLocation: ${location}\nTime: ${loginAt}`,
    actionLabel: 'Review account security',
    actionUrl: securityUrl,
    footer:
      'If this was not you, change your password immediately and review active sessions.',
  }

  return <WorkspaceNotificationBase {...content} />
}

AuthNewLoginDetectedEmail.PreviewProps = {
  userName: 'Jane Doe',
  workspaceName: 'Acme Workspace',
  device: 'MacBook Pro (Chrome)',
  location: 'Bengaluru, IN',
  loginAt: 'Apr 22, 2026 10:24 AM UTC',
  securityUrl: 'https://example.com/app/acme/settings?tab=account',
} satisfies AuthNewLoginDetectedEmailProps
