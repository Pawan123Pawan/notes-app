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

/** Props align with `emailAndPassword.sendResetPassword` in `src/lib/auth.ts` (`user`, `url`). */
export type ResetPasswordEmailProps = {
  user: {
    email: string
    name?: string | null
  }
  url: string
}

export default function ResetPasswordEmail({
  user,
  url,
}: ResetPasswordEmailProps) {
  const greetingName = user.name?.trim() || user.email.split('@')[0] || 'there'

  return (
    <Html lang="en">
      <Head />
      <Preview>Reset your password</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading as="h1" style={h1}>
            Reset your password
          </Heading>
          <Text style={text}>Hi {greetingName},</Text>
          <Text style={text}>
            We received a request to reset the password for{' '}
            <span style={emailInline}>{user.email}</span>. Use the button below
            to set a new password.
          </Text>
          <Button href={url} style={button}>
            Reset password
          </Button>
          <Text style={muted}>
            If the button does not work, copy and paste this link into your
            browser:
          </Text>
          <Link href={url} style={link}>
            {url}
          </Link>
          <Hr style={hr} />
          <Text style={footer}>
            If you did not request this, you can ignore this email. Your
            password will not change.
          </Text>
          <Text style={footerSite}>Micro SaaS Starter</Text>
        </Container>
      </Body>
    </Html>
  )
}

ResetPasswordEmail.PreviewProps = {
  user: {
    email: 'jane@example.com',
    name: 'Jane Doe',
  },
  url: 'https://example.com/api/auth/reset-password/abc123?callbackURL=%252Fapp',
} satisfies ResetPasswordEmailProps

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

const emailInline = {
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
