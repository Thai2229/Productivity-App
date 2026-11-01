import { useEffect, useRef, useState } from 'react'
import TimerRing from '../components/TimerRing'
import { playChime, prepareAlerts, showNotification } from '../utils/alerts'

type Mode = 'work' | 'break' | 'longBreak'

const WORK_SECONDS = 25 * 60
const BREAK_SECONDS = 5 * 60
const LONG_BREAK_SECONDS = 30 * 60
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

function getAlertMessage(nextMode: Mode) {
  if (nextMode === 'break') {
    return { title: 'Work session complete', body: 'Time for a 5 minute rest.' }
  }
  if (nextMode === 'longBreak') {
    return { title: 'Work session complete', body: 'Time for a 30 minute rest.' }
  }
  return { title: 'Rest is over', body: 'Ready for the next work session.' }
}

export default function Pomodoro() {
  const [mode, setMode] = useState<Mode>('work')
  const [secondsLeft, setSecondsLeft] = useState(WORK_SECONDS)
  const [isRunning, setIsRunning] = useState(false)
  const [completedSessions, setCompletedSessions] = useState(0)
  const endTimeRef = useRef(0)

  const isActive = isRunning && secondsLeft > 0

  useEffect(() => {
    if (!isActive) {
      return undefined
    }

    const id = setInterval(() => {
      const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000)
      if (remaining > 0) {
        setSecondsLeft(remaining)
        return
      }

      const next = getNextSession(mode, completedSessions)
      const message = getAlertMessage(next.mode)
      playChime()
      showNotification(message.title, message.body)

      setMode(next.mode)
      setCompletedSessions(next.completedSessions)
      setSecondsLeft(getDuration(next.mode))
      setIsRunning(false)
    }, 250)

    return () => clearInterval(id)
  }, [isActive, mode, completedSessions])

  function handleStartPause() {
    if (!isRunning) {
      prepareAlerts()
      endTimeRef.current = Date.now() + secondsLeft * 1000
    }
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

  const progress = secondsLeft / getDuration(mode)

  return (
    <div className="timer">
      <h1>Pomodoro Timer</h1>
      <TimerRing
        mode={mode}
        progress={progress}
        timeText={formatTime(secondsLeft)}
        label={getLabel(mode)}
      />
      <div className="timer-controls">
        <button onClick={handleStartPause}>{buttonLabel}</button>
        <button onClick={handleReset}>Reset</button>
      </div>
      <p>Work sessions completed: {completedSessions}</p>
      <p>Work sessions until long rest: {sessionsUntilLongBreak}</p>
    </div>
  )
}