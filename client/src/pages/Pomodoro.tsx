import { useEffect, useState } from 'react'

type Mode = 'work' | 'break' | 'longBreak'

const WORK_SECONDS = 25 * 60
const BREAK_SECONDS = 5 * 60
const LONG_BREAK_SECONDS = 15 * 60
const SESSIONS_PER_LONG_BREAK = 4

function getDuration(mode: Mode) {
  if (mode === 'work') {
    return WORK_SECONDS
  }
  if (mode === 'break') {
    return BREAK_SECONDS
  }
  return LONG_BREAK_SECONDS
}

function getLabel(mode: Mode) {
  if (mode === 'work') {
    return 'Work'
  }
  if (mode === 'break') {
    return 'Short Rest'
  }
  return 'Long Rest'
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0')
}

function getNextSession(
  mode: Mode,
  completedSessions: number,
): { mode: Mode; completedSessions: number } {
  if (mode !== 'work') {
    return { mode: 'work', completedSessions: completedSessions }
  }

  const updatedSessions = completedSessions + 1
  if (updatedSessions % SESSIONS_PER_LONG_BREAK === 0) {
    return { mode: 'longBreak', completedSessions: updatedSessions }
  }
  return { mode: 'break', completedSessions: updatedSessions }
}

export default function Pomodoro() {
  const [mode, setMode] = useState<Mode>('work')
  const [secondsLeft, setSecondsLeft] = useState(WORK_SECONDS)
  const [isRunning, setIsRunning] = useState(false)
  const [completedSessions, setCompletedSessions] = useState(0)

  const isActive = isRunning && secondsLeft > 0

  useEffect(() => {
    if (!isActive) {
      return undefined
    }

    const id = setTimeout(() => {
      if (secondsLeft > 1) {
        setSecondsLeft(secondsLeft - 1)
        return
      }

      const next = getNextSession(mode, completedSessions)
      setMode(next.mode)
      setCompletedSessions(next.completedSessions)
      setSecondsLeft(getDuration(next.mode))
      setIsRunning(false)
    }, 1000)

    return () => clearTimeout(id)
  }, [isActive, secondsLeft, mode, completedSessions])

  function handleStartPause() {
    setIsRunning(!isRunning)
  }

  function handleReset() {
    setSecondsLeft(getDuration(mode))
    setIsRunning(false)
  }

  let buttonLabel = 'Start'
  if (isActive) {
    buttonLabel = 'Pause'
  }

  const sessionsUntilLongBreak =
    SESSIONS_PER_LONG_BREAK - (completedSessions % SESSIONS_PER_LONG_BREAK)

  return (
    <div className="timer">
      <h1>Pomodoro Timer</h1>
      <p className="timer-mode">{getLabel(mode)}</p>
      <p className="timer-clock">{formatTime(secondsLeft)}</p>
      <div className="timer-controls">
        <button onClick={handleStartPause}>{buttonLabel}</button>
        <button onClick={handleReset}>Reset</button>
      </div>
      <p>Work sessions completed: {completedSessions}</p>
      <p>Work sessions until long rest: {sessionsUntilLongBreak}</p>
    </div>
  )
}