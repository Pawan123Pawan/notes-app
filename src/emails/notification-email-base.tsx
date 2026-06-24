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

export type NotificationEmailBaseProps = {
  preview: string
  title: string
  greetingName?: string | null
  intro: string
  details?: string
  actionLabel?: string
  actionUrl?: string
  footer?: string
}

export function NotificationEmailBase({
  preview,
  title,
  greetingName,
  intro,
  details,
  actionLabel,
  actionUrl,
  footer = 'You are receiving this email because of activity on your account.',
}: NotificationEmailBaseProps) {
  const safeGreeting = greetingName?.trim() || 'there'

  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading as="h1" style={h1}>
            {title}
          </Heading>
          <Text style={text}>Hi {safeGreeting},</Text>
          <Text style={text}>{intro}</Text>
          {details ? <Text style={text}>{details}</Text> : null}
          {actionLabel && actionUrl ? (
            <>
              <Button href={actionUrl} style={button}>
                {actionLabel}
              </Button>
              <Text style={muted}>
                If the button does not work, copy and paste this link into your
                browser:
              </Text>
              <Link href={actionUrl} style={link}>
                {actionUrl}
              </Link>
            </>
          ) : null}
          <Hr style={hr} />
          <Text style={footerText}>{footer}</Text>
          <Text style={footerSite}>Next Vibe App Starter</Text>
        </Container>
      </Body>
    </Html>
  )
}

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

const footerText = {
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
