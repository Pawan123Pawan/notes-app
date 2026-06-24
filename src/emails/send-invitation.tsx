import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Text,
} from 'react-email'

export type SendInvitationEmailProps = {
  inviteeEmail: string
  organizationName: string
  inviterName: string
  role: string
  invitationUrl: string
}

export default function SendInvitationEmail({
  inviteeEmail,
  organizationName,
  inviterName,
  role,
  invitationUrl,
}: SendInvitationEmailProps) {
  const greetingName = inviteeEmail.split('@')[0] || 'there'
  const roleLabel = role.replace(/[_-]/g, ' ')

  return (
    <Html lang="en">
      <Head />
      <Preview>Invitation to join {organizationName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading as="h1" style={h1}>
            You are invited to join {organizationName}
          </Heading>
          <Text style={text}>Hi {greetingName},</Text>
          <Text style={text}>
            {inviterName} invited you to join{' '}
            <span style={emphasis}>{organizationName}</span> as a{' '}
            <span style={emphasis}>{roleLabel}</span>.
          </Text>
          <Button href={invitationUrl} style={button}>
            Accept invitation
          </Button>
          <Text style={muted}>
            If the button does not work, copy and paste this link into your
            browser:
          </Text>
          <Link href={invitationUrl} style={link}>
            {invitationUrl}
          </Link>
          <Hr style={hr} />
          <Text style={footer}>
            This invite was sent to <span style={emphasis}>{inviteeEmail}</span>
            . If you were not expecting it, you can ignore this email.
          </Text>
          <Text style={footerSite}>Micro SaaS Starter</Text>
        </Container>
      </Body>
    </Html>
  )
}

SendInvitationEmail.PreviewProps = {
  inviteeEmail: 'jane@example.com',
  organizationName: 'Acme Workspace',
  inviterName: 'John Doe',
  role: 'member',
  invitationUrl: 'https://example.com/app/accept-invitation?id=invite_123',
} satisfies SendInvitationEmailProps

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
}

const h1 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.25',
  margin: '0 0 16px',
}

const text = {
  color: '#444',
  fontSize: '16px',
  lineHeight: '1.5',
  margin: '0 0 16px',
}

const emphasis = {
  fontWeight: 600 as const,
}

const button = {
  backgroundColor: '#111827',
  borderRadius: '6px',
  color: '#fff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '1',
  padding: '12px 20px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  margin: '0 0 24px',
}

const muted = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 8px',
}

const link = {
  color: '#2563eb',
  fontSize: '14px',
  lineHeight: '1.5',
  wordBreak: 'break-all' as const,
  margin: '0 0 24px',
  display: 'block',
}

const hr = {
  borderColor: '#e5e7eb',
  margin: '20px 0',
}

const footer = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0',
}

const footerSite = {
  borderTop: '1px solid #e5e7eb',
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '24px 0 0',
  paddingTop: '16px',
  textAlign: 'center' as const,
}
