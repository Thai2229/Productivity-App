type TimerRingProps = {
  progress: number
  timeText: string
  label: string
}

const TICK_COUNT = 60

export default function TimerRing({ progress, timeText, label }: TimerRingProps) {
  const elapsedTicks = Math.floor((1 - progress) * TICK_COUNT)

  return (
    <div className="ring">
      <svg viewBox="0 0 200 200">
        {Array.from({ length: TICK_COUNT }, (_, index) => {
          let tickClass = 'tick tick-off'
          if (index >= elapsedTicks) {
            tickClass = 'tick tick-on'
          }

          return (
            <line
              key={index}
              className={tickClass}
              x1="100"
              y1="8"
              x2="100"
              y2="20"
              transform={'rotate(' + index * (360 / TICK_COUNT) + ' 100 100)'}
            />
          )
        })}
      </svg>
      <div className="ring-center">
        <p className="ring-time">{timeText}</p>
        <p className="ring-label">{label}</p>
      </div>
    </div>
  )
}