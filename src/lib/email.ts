import nodemailer from 'nodemailer'

import { env } from '@/lib/env'

export type SendEmailOptions = {
  to: string
  subject: string
  text: string
  html?: string
}

function isSmtpConfigured() {
  return Boolean(env.SMTP_HOST && env.SMTP_FROM)
}

function createTransporter() {
  if (!env.SMTP_HOST) {
    throw new Error('SMTP_HOST is not configured')
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    secure: env.SMTP_SECURE ?? env.SMTP_PORT === 465,
    auth:
      env.SMTP_USER && env.SMTP_PASS
        ? {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          }
        : undefined,
  })
}

let transporter: ReturnType<typeof createTransporter> | null = null

function getTransporter() {
  if (!transporter) {
    transporter = createTransporter()
  }

  return transporter
}

/**
 * Sends email via Nodemailer. When SMTP is not configured in development,
 * logs the message instead so auth flows remain usable locally.
 */
export async function sendEmail(options: SendEmailOptions) {
  if (!isSmtpConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'SMTP is not configured. Set SMTP_HOST and SMTP_FROM to send email.',
      )
    }

    console.info('[email] SMTP not configured; logging message instead', {
      to: options.to,
      subject: options.subject,
      text: options.text,
    })
    return
  }

  const transport = getTransporter()

  await transport.sendMail({
    from: env.SMTP_FROM,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  })
}
