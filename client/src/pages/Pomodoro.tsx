import { useEffect, useState } from 'react'

const WORK_SECONDS = 25 * 60

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0')
}

export default function Pomodoro() {
  const [secondsLeft, setSecondsLeft] = useState(WORK_SECONDS)
  const [isRunning, setIsRunning] = useState(false)

  const isActive = isRunning && secondsLeft > 0

  useEffect(() => {
    if (!isActive) {
      return undefined
    }

    const id = setTimeout(() => {
      setSecondsLeft(secondsLeft - 1)
    }, 1000)

    return () => clearTimeout(id)
  }, [isActive, secondsLeft])

  function handleStartPause() {
    if (secondsLeft === 0) {
      return
    }
    setIsRunning(!isRunning)
  }

  function handleReset() {
    setSecondsLeft(WORK_SECONDS)
    setIsRunning(false)
  }

  let buttonLabel = 'Start'
  if (isActive) {
    buttonLabel = 'Pause'
  }

  return (
    <div className="timer">
      <h1>Pomodoro Timer</h1>
      <p className="timer-clock">{formatTime(secondsLeft)}</p>
      <div className="timer-controls">
        <button onClick={handleStartPause}>{buttonLabel}</button>
        <button onClick={handleReset}>Reset</button>
      </div>
      {secondsLeft === 0 && <p>Time's up!</p>}
    </div>
  )
}