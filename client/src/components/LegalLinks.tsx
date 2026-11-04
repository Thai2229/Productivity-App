import { Link } from 'react-router-dom'

// Small links to the Privacy Policy and Terms, shown under the landing, log in and sign up pages.
// The sign-up version says that making an account means agreeing to them.
export default function LegalLinks({ forSignUp = false }: { forSignUp?: boolean }) {
  if (forSignUp) {
    return (
      <p className="legal-links">
        By creating an account, you agree to the <Link to="/terms">Terms of Service</Link> and{' '}
        <Link to="/privacy">Privacy Policy</Link>.
      </p>
    )
  }

  return (
    <p className="legal-links">
      <Link to="/privacy">Privacy Policy</Link>
      <span aria-hidden="true"> · </span>
      <Link to="/terms">Terms of Service</Link>
    </p>
  )
}
