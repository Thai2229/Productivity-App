import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import ServerStatus from './components/ServerStatus'
import Pomodoro from './pages/Pomodoro'
import Internships from './pages/Internships'
import Habits from './pages/Habits'
import Roadmap from './pages/Roadmap'
import './App.css'

export default function App() {
  return (
    <>
      <Navbar />
      <main className="page">
        <Routes>
          <Route path="/" element={<Navigate to="/pomodoro" replace />} />
          <Route path="/pomodoro" element={<Pomodoro />} />
          <Route path="/internships" element={<Internships />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/roadmap" element={<Roadmap />} />
        </Routes>
      </main>
      <ServerStatus />
    </>
  )
}