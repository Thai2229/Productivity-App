import nodemailer, { type Transporter } from 'nodemailer'

// Sends the site's emails (only password resets for now) through a Gmail account.
// GMAIL_USER is the Gmail address and GMAIL_APP_PASSWORD is a Google "App password" for it,
// not the account's normal password.

let transport: Transporter | null = null

function getTransport() {
  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  if (!user || !pass) {
    return null
  }
  if (!transport) {
    // Google shows App passwords in groups of four with spaces, so strip those
    transport = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass: pass.replace(/\s/g, '') },
    })
  }
  return transport
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function sendPasswordResetEmail(to: string, name: string, url: string) {
  const mailer = getTransport()

  if (!mailer) {
    // On your laptop, print the link so you can test without email set up.
    // On Vercel, never print reset links; just report that email isn't set up.
    if (process.env.VERCEL) {
      console.error('GMAIL_USER / GMAIL_APP_PASSWORD are not set, so the reset email was not sent')
      return
    }
    console.log('Email is not set up. Password reset link for ' + to + ':\n' + url)
    return
  }

  let greeting = 'Hi,'
  if (name.trim() !== '') {
    greeting = 'Hi ' + name.trim() + ','
  }

  const text = [
    greeting,
    '',
    'Someone asked to reset the password for your Productivity App account.',
    'Open this link to choose a new password. It expires in 1 hour:',
    url,
    '',
    "If this wasn't you, you can ignore this email. Your password won't change.",
  ].join('\n')

  const html = `
    <div style="font-family: Arial, sans-serif; font-size: 15px; color: #16202a; max-width: 480px;">
      <p>${escapeHtml(greeting)}</p>
      <p>Someone asked to reset the password for your Productivity App account.</p>
      <p>
        <a href="${escapeHtml(url)}"
           style="display: inline-block; padding: 10px 18px; background: #2f5fd0; color: #ffffff; border-radius: 8px; text-decoration: none; font-weight: 600;">
          Choose a new password
        </a>
      </p>
      <p style="color: #667382; font-size: 13px;">This link expires in 1 hour. If this wasn't you, you can ignore this email and your password won't change.</p>
    </div>`

  await mailer.sendMail({
    from: { name: 'Productivity App', address: process.env.GMAIL_USER as string },
    to,
    subject: 'Reset your Productivity App password',
    text,
    html,
  })
}

// The 6-digit code people type in to prove they own their email
export async function sendVerificationCodeEmail(to: string, code: string) {
  const mailer = getTransport()

  if (!mailer) {
    if (process.env.VERCEL) {
      console.error('GMAIL_USER / GMAIL_APP_PASSWORD are not set, so the verification code was not sent')
      return
    }
    console.log('Email is not set up. Verification code for ' + to + ': ' + code)
    return
  }

  const text = [
    'Your Productivity App verification code is:',
    '',
    code,
    '',
    'It expires in 10 minutes.',
    "If you didn't try to sign up or log in, you can ignore this email.",
  ].join('\n')

  const html = `
    <div style="font-family: Arial, sans-serif; font-size: 15px; color: #16202a; max-width: 480px;">
      <p>Your Productivity App verification code is:</p>
      <p style="margin: 18px 0; font-size: 32px; font-weight: 700; letter-spacing: 8px;">${escapeHtml(code)}</p>
      <p style="color: #667382; font-size: 13px;">It expires in 10 minutes. If you didn't try to sign up or log in, you can ignore this email.</p>
    </div>`

  await mailer.sendMail({
    from: { name: 'Productivity App', address: process.env.GMAIL_USER as string },
    to,
    subject: 'Your Productivity App code is ' + code,
    text,
    html,
  })
}
