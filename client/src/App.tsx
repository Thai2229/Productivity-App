import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import RequireAuth from './components/RequireAuth'
import Pomodoro from './pages/Pomodoro'
import Internships from './pages/Internships'
import Habits from './pages/Habits'
import Todos from './pages/Todos'
import Calendar from './pages/Calendar'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Settings from './pages/Settings'
import Landing from './pages/Landing'
import './App.css'
import './auth.css'

// The roadmap editor is large, so it only downloads when someone opens that page
const Roadmap = lazy(() => import('./pages/Roadmap'))

export default function App() {
  return (
    <>
      <Navbar />
      <main className="page">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route element={<RequireAuth />}>
            <Route path="/pomodoro" element={<Pomodoro />} />
            <Route path="/internships" element={<Internships />} />
            <Route path="/habits" element={<Habits />} />
            <Route path="/todos" element={<Todos />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/settings" element={<Settings />} />
            <Route
              path="/roadmap"
              element={
                <Suspense fallback={<p className="auth-loading">Loading…</p>}>
                  <Roadmap />
                </Suspense>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  )
}