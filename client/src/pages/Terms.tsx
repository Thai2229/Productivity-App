import { Link } from 'react-router-dom'
import '../legal.css'

const CONTACT_EMAIL = 'mrthaivanle@gmail.com'
const LAST_UPDATED = 'November 4, 2026'

export default function Terms() {
  return (
    <article className="legal">
      <h1>Terms of Service</h1>
      <p className="legal-updated">Last updated {LAST_UPDATED}</p>

      <p>
        Productivity App is a free personal project built and run by one student. By creating an account or using the
        app, you agree to these terms. If you don't agree, please don't use it.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>Each account is for one person. Use your real email so you can reset your password.</li>
        <li>Keep your password private. You're responsible for what happens under your account.</li>
        <li>You must be at least 13 years old to use the app.</li>
      </ul>

      <h2>Your content</h2>
      <p>
        Everything you add (jobs, habits, roadmaps and notes) stays yours. The app only stores and shows it so you can
        use the app. See the <Link to="/privacy">Privacy Policy</Link> for details.
      </p>

      <h2>Fair use</h2>
      <p>Please don't:</p>
      <ul>
        <li>try to get into other people's accounts or data</li>
        <li>attack, overload or try to break the site, or get around its security or rate limits</li>
        <li>create accounts or send requests with bots or scripts</li>
        <li>use the app for anything illegal</li>
      </ul>
      <p>Accounts that do these things may be suspended or deleted.</p>

      <h2>A free app, as is</h2>
      <p>
        The app is free and provided "as is", without any guarantees. It may have bugs, go down, change, or shut down
        at any time. Please keep your own copy of anything important. To the extent the law allows, the creator isn't
        responsible for any loss that comes from using the app or not being able to use it.
      </p>

      <h2>Leaving</h2>
      <p>
        You can stop using the app at any time. To delete your account and data, email{' '}
        <a href={'mailto:' + CONTACT_EMAIL}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>Changes</h2>
      <p>
        These terms may be updated. The new version will be posted here with a new date, and continuing to use the app
        means you accept it.
      </p>

      <h2>Contact</h2>
      <p>
        Questions? Email <a href={'mailto:' + CONTACT_EMAIL}>{CONTACT_EMAIL}</a>.
      </p>
    </article>
  )
}
