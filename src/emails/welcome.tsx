import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from 'react-email'

export type WelcomeEmailProps = {
  user: {
    id: string
    email: string
    name?: string | null
  }
  appUrl: string
}

export default function WelcomeEmail({ user, appUrl }: WelcomeEmailProps) {
  const greetingName = user.name?.trim() || user.email.split('@')[0] || 'there'
  const dashboardUrl = `${appUrl}/app`

  return (
    <Html lang="en">
      <Head />
      <Preview>Welcome to Next Vibe App Starter</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading as="h1" style={h1}>
            Welcome to Next Vibe App Starter
          </Heading>
          <Text style={text}>Hi {greetingName},</Text>
          <Text style={text}>
            Your account is ready. You can now access your dashboard and start
            building your SaaS product.
          </Text>
          <Button href={dashboardUrl} style={button}>
            Open dashboard
          </Button>
          <Text style={muted}>
            Signed in as <span style={emailInline}>{user.email}</span>
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            Need help getting started? Reply to this email and we&apos;ll help
            you out.
          </Text>
          <Text style={footerSite}>Next Vibe App Starter</Text>
        </Container>
      </Body>
    </Html>
  )
}

WelcomeEmail.PreviewProps = {
  user: {
    id: 'user_123',
    email: 'jane@example.com',
    name: 'Jane Doe',
  },
  appUrl: 'https://example.com',
} satisfies WelcomeEmailProps

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
  margin: '0 0 16px',
}

const emailInline = {
  fontWeight: 600 as const,
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
