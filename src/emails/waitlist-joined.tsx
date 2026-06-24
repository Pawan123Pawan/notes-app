import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'react-email'

export type WaitlistJoinedEmailProps = {
  fullName: string
  email: string
  appName: string
}

export default function WaitlistJoinedEmail({
  fullName,
  email,
  appName,
}: WaitlistJoinedEmailProps) {
  const greetingName = fullName.trim() || email.split('@')[0] || 'there'

  return (
    <Html lang="en">
      <Head />
      <Preview>Thanks for joining the waitlist</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading as="h1" style={h1}>
            You are on the waitlist
          </Heading>
          <Text style={text}>Hi {greetingName},</Text>
          <Text style={text}>
            Thank you for joining the {appName} waitlist.
          </Text>
          <Text style={text}>
            Someone from our team will contact you soon with the next steps.
          </Text>
          <Text style={text}>We appreciate your interest.</Text>
          <Text style={footerSite}>{appName}</Text>
        </Container>
      </Body>
    </Html>
  )
}

WaitlistJoinedEmail.PreviewProps = {
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  appName: 'Micro SaaS Starter',
} satisfies WaitlistJoinedEmailProps

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

const footerSite = {
  borderTop: '1px solid #e5e7eb',
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '1.5',
  margin: '24px 0 0',
  paddingTop: '16px',
  textAlign: 'center' as const,
}
