import { APP_CARDS, type AppCardId } from '../lib/landing-samples'

type AppCardsProps = {
  active: AppCardId
  onPick: (id: AppCardId) => void
}

// The list on the left of the window: one button per tool
export default function AppCards({ active, onPick }: AppCardsProps) {
  return (
    <ul className="app__tools">
      {APP_CARDS.map((card) => (
        <li key={card.id}>
          <button
            type="button"
            id={'tool-' + card.id}
            className="app__tool"
            aria-pressed={card.id === active}
            onClick={() => onPick(card.id)}
          >
            {card.name}
          </button>
        </li>
      ))}
    </ul>
  )
}
