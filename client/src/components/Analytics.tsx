import { activityStats, funnelSteps, responseStats, type FunnelStep } from '../lib/analytics'
import type { Internship } from '../lib/internships'

type Props = {
  internships: Internship[]
}

function oneDecimal(value: number) {
  return value.toFixed(1).replace(/\.0$/, '')
}

function percent(rate: number | null) {
  if (rate === null) {
    return '—'
  }
  return Math.round(rate * 100) + '%'
}

function formatDay(key: string) {
  return new Date(key + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function FunnelRow({ step, highlight }: { step: FunnelStep; highlight: boolean }) {
  let width = 0
  if (step.rate !== null) {
    width = step.rate * 100
  }
  let className = 'funnel-row'
  if (highlight) {
    className = 'funnel-row funnel-row-total'
  }

  return (
    <li className={className} title={step.label + ': ' + step.to + ' of ' + step.from}>
      <span className="funnel-label">{step.label}</span>
      <span className="funnel-track" aria-hidden="true">
        <span className="funnel-fill" style={{ width: width + '%' }} />
      </span>
      <span className="funnel-value">{percent(step.rate)}</span>
      <span className="funnel-count">
        {step.to} of {step.from}
      </span>
    </li>
  )
}

export default function Analytics({ internships }: Props) {
  const response = responseStats(internships)
  const activity = activityStats(internships)
  const funnel = funnelSteps(internships)

  let averageText = '—'
  let averageUnit = ''
  if (response.averageDays !== null) {
    averageText = oneDecimal(response.averageDays)
    averageUnit = ' days'
    if (averageText === '1') {
      averageUnit = ' day'
    }
  }

  let responseNote = 'No replies yet. Move a job past Applied when a company gets back to you.'
  if (response.responded > 0) {
    let replies = response.responded + ' replies'
    if (response.responded === 1) {
      replies = '1 reply'
    }
    responseNote =
      'Based on ' + replies + ' · ' + percent(response.responded / response.total) + ' of applications got a response'
  }

  let busiestText = '—'
  let busiestNote = ''
  if (activity.busiestDay) {
    busiestText = formatDay(activity.busiestDay)
    busiestNote = activity.busiestCount + ' applications'
    if (activity.busiestCount === 1) {
      busiestNote = '1 application'
    }
  }

  return (
    <div className="analytics">
      <section className="analytics-card">
        <h2 className="analytics-title">Response time</h2>
        <p className="hero-number">
          {averageText}
          <span className="hero-unit">{averageUnit}</span>
        </p>
        <p className="analytics-note">Average time from applying to hearing back · {responseNote}</p>
      </section>

      <section className="analytics-card">
        <h2 className="analytics-title">Application activity</h2>
        <dl className="stat-grid">
          <div className="stat">
            <dt>Total applications</dt>
            <dd>{activity.total}</dd>
          </div>
          <div className="stat">
            <dt>Most active day</dt>
            <dd>
              {busiestText}
              {busiestNote && <span className="stat-note">{busiestNote}</span>}
            </dd>
          </div>
          <div className="stat">
            <dt>Per day</dt>
            <dd>{oneDecimal(activity.perDay)}</dd>
          </div>
          <div className="stat">
            <dt>Per week</dt>
            <dd>{oneDecimal(activity.perWeek)}</dd>
          </div>
          <div className="stat">
            <dt>Per month</dt>
            <dd>{oneDecimal(activity.perMonth)}</dd>
          </div>
          <div className="stat">
            <dt>Per year</dt>
            <dd>
              {Math.round(activity.perYear)}
              <span className="stat-note">at this pace</span>
            </dd>
          </div>
        </dl>
      </section>

      <section className="analytics-card">
        <h2 className="analytics-title">Conversion funnel</h2>
        <ul className="funnel">
          {funnel.steps.map((step) => (
            <FunnelRow key={step.label} step={step} highlight={false} />
          ))}
          <FunnelRow step={funnel.overall} highlight={true} />
        </ul>
      </section>
    </div>
  )
}
