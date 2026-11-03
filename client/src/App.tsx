import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import RequireAuth from './components/RequireAuth'
import Pomodoro from './pages/Pomodoro'
import Internships from './pages/Internships'
import Habits from './pages/Habits'
import Roadmap from './pages/Roadmap'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import './App.css'
import './auth.css'

export default function App() {
  return (
    <>
      <Navbar />
      <main className="page">
        <Routes>
          <Route path="/" element={<Navigate to="/pomodoro" replace />} />
          <Route path="/pomodoro" element={<Pomodoro />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route element={<RequireAuth />}>
            <Route path="/internships" element={<Internships />} />
            <Route path="/habits" element={<Habits />} />
            <Route path="/roadmap" element={<Roadmap />} />
          </Route>
        </Routes>
      </main>
    </>
  )
}