import { Link } from 'react-router-dom'
import '../legal.css'

const CONTACT_EMAIL = 'mrthaivanle@gmail.com'
const LAST_UPDATED = 'November 4, 2026'

export default function Privacy() {
  return (
    <article className="legal">
      <h1>Privacy Policy</h1>
      <p className="legal-updated">Last updated {LAST_UPDATED}</p>

      <p>
        Productivity App is a free personal project built and run by one student. This page explains, in plain
        English, what the app stores about you and why. Questions? Email{' '}
        <a href={'mailto:' + CONTACT_EMAIL}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>What the app stores</h2>
      <ul>
        <li>
          <strong>Your account:</strong> your name and email. If you sign up with a password, only a scrambled
          (hashed) version is stored, never the password itself.
        </li>
        <li>
          <strong>If you sign in with Google:</strong> Google shares your name and email address. Your profile picture
          is not kept, and the app can't see anything else in your Google account.
        </li>
        <li>
          <strong>What you add:</strong> your job applications (company, title, stage, location, notes, link and dates),
          your habits and check-ins, and your roadmaps and skills.
        </li>
        <li>
          <strong>Login details:</strong> when you log in, the app keeps a session record with your IP address and
          browser type. It's used to keep you logged in and to block people trying to break into accounts.
        </li>
        <li>
          <strong>On your device only:</strong> your chosen theme is saved in your browser and never sent to the
          server.
        </li>
      </ul>

      <h2>How it's used</h2>
      <p>
        Only to run the app for you: showing your data, keeping you logged in, sending password reset emails you ask
        for, and protecting the site from abuse. There are no ads, no analytics or tracking tools, and your data is{' '}
        <strong>never sold or shared for marketing</strong>.
      </p>

      <h2>Services the app relies on</h2>
      <p>These companies handle data only as needed to run the app:</p>
      <ul>
        <li>
          <strong>Vercel</strong> hosts the website and server.
        </li>
        <li>
          <strong>Neon</strong> hosts the database where your account and data are stored.
        </li>
        <li>
          <strong>Cloudflare Turnstile</strong> checks that sign-ups come from real people, not bots.
        </li>
        <li>
          <strong>Google</strong> handles "Continue with Google", if you choose to use it.
        </li>
        <li>
          <strong>Gmail</strong> sends password reset emails.
        </li>
      </ul>

      <h2>Cookies</h2>
      <p>
        The app only uses cookies to keep you logged in and to finish signing in with Google. They aren't used for
        tracking. Cloudflare's bot check on the sign-up page may set its own cookie to do that check.
      </p>

      <h2>Keeping and deleting your data</h2>
      <p>
        Your data is kept for as long as you have an account. To delete your account and everything in it, email{' '}
        <a href={'mailto:' + CONTACT_EMAIL}>{CONTACT_EMAIL}</a> from the address you signed up with, and it will be
        deleted within 30 days. You can also ask for a copy of your data the same way.
      </p>

      <h2>Security</h2>
      <p>
        The site only works over an encrypted (HTTPS) connection, passwords are hashed, and every request is checked
        so that people can only ever see their own data. No website is perfectly secure, so please use a password you
        don't use anywhere else.
      </p>

      <h2>Children</h2>
      <p>The app isn't meant for children under 13, and it doesn't knowingly collect their information.</p>

      <h2>Changes</h2>
      <p>
        If this policy changes, the new version will be posted here with a new date. See also the{' '}
        <Link to="/terms">Terms of Service</Link>.
      </p>
    </article>
  )
}
