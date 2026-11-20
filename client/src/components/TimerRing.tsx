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
          // Every fifth tick is a longer, heavier mark, like a watch dial
          let tickLength = 14
          if (index % 5 === 0) {
            tickClass = tickClass + ' tick-major'
            tickLength = 22
          }

          return (
            <line
              key={index}
              className={tickClass}
              x1="100"
              y1="8"
              x2="100"
              y2={8 + tickLength}
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