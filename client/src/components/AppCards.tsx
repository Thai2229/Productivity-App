import type { CSSProperties } from 'react'
import { APP_CARDS, type AppCardId } from '../lib/landing-samples'

type AppCardsProps = {
  active: AppCardId
  hovered: AppCardId | null
  onHover: (id: AppCardId | null) => void
  onPick: (id: AppCardId) => void
}

// The hand of cards under the preview: one card per tool. Hovering or focusing a card lifts it out of
// the hand (the preview follows once the pointer settles); clicking or tapping picks it.
// The look of the fan is in landing.css; here each card only says where it sits and whether it is lifted.
export default function AppCards({ active, hovered, onHover, onPick }: AppCardsProps) {
  const liftedIndex = APP_CARDS.findIndex((card) => card.id === hovered)
  const middle = (APP_CARDS.length - 1) / 2

  return (
    <div className="app-cards" role="group" aria-label="Tools" onMouseLeave={() => onHover(null)}>
      {APP_CARDS.map((card, index) => {
        const isActive = card.id === active
        let lean = 0
        if (liftedIndex !== -1 && index < liftedIndex) {
          lean = -1
        }
        if (liftedIndex !== -1 && index > liftedIndex) {
          lean = 1
        }
        let lift = 0
        let zIndex = index + 1
        let cardClass = 'app-card'
        if (index === liftedIndex) {
          lift = 1
          zIndex = 20
          cardClass = 'app-card app-card--lifted'
        }
        let raised = 0
        if (isActive && liftedIndex === -1) {
          raised = 1
        }
        let action = 'Preview'
        if (isActive) {
          action = 'Previewing'
        }
        const style = {
          '--o': index - middle,
          '--lean': lean,
          '--lift': lift,
          '--raised': raised,
          zIndex,
        } as CSSProperties
        return (
          <button
            key={card.id}
            type="button"
            className={cardClass}
            style={style}
            aria-pressed={isActive}
            aria-controls="tool-window"
            onMouseEnter={() => onHover(card.id)}
            onFocus={() => onHover(card.id)}
            onBlur={() => onHover(null)}
            onClick={() => onPick(card.id)}
          >
            <span className="app-card__media" aria-hidden="true">
              <img src={'/cards/' + card.id + '.webp'} alt="" width={640} height={400} loading="lazy" draggable={false} />
            </span>
            <span className="app-card__name">{card.name}</span>
            <span className="app-card__action" aria-hidden="true">
              {action}
            </span>
          </button>
        )
      })}
    </div>
  )
}
