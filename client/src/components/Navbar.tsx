import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { NavLink } from 'react-router-dom'
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, horizontalListSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { authClient } from '../lib/auth-client'
import { NAV_ORDER_EVENT, NAV_PAGES, loadNavOrder, saveNavOrder, type NavPage } from '../lib/navOrder'
import ProfileMenu from './ProfileMenu'

function getLinkClass({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return 'nav-link active'
  }
  return 'nav-link'
}

// Logged out: log in / sign up links.
// Logged in: the profile letter (dark mode lives in Settings → Appearance).
function AuthControls() {
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return null
  }

  if (!session) {
    return (
      <>
        <NavLink to="/login" className={getLinkClass}>Log in</NavLink>
        <NavLink to="/signup" className={getLinkClass}>Sign up</NavLink>
      </>
    )
  }

  return <ProfileMenu name={session.user.name} email={session.user.email} />
}

// Links only slide sideways while being dragged
const onlySideways: Modifier = ({ transform }) => ({ ...transform, y: 0 })

type SortableLinkProps = {
  page: NavPage
  onClickCapture: (event: MouseEvent) => void
}

// One menu link that can be dragged to a new spot. A plain click still opens the page.
function SortableLink({ page, onClickCapture }: SortableLinkProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id })

  // Keep it a normal link for screen readers instead of the library's default "button" role
  const { role: _role, tabIndex: _tabIndex, ...dragAttributes } = attributes

  let wrapperClass = 'nav-sortable'
  if (isDragging) {
    wrapperClass = 'nav-sortable nav-sortable-dragging'
  }

  return (
    <span
      ref={setNodeRef}
      className={wrapperClass}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      <NavLink
        to={page.to}
        className={getLinkClass}
        onClickCapture={onClickCapture}
        draggable={false}
        {...dragAttributes}
        {...listeners}
      >
        {page.label}
      </NavLink>
    </span>
  )
}

function PageLinks() {
  const [order, setOrder] = useState(loadNavOrder)
  // A click right after a drag is the mouse being released, not a request to open the page
  const justDragged = useRef(false)

  useEffect(() => {
    function reload() {
      setOrder(loadNavOrder())
    }
    window.addEventListener(NAV_ORDER_EVENT, reload)
    return () => window.removeEventListener(NAV_ORDER_EVENT, reload)
  }, [])

  const sensors = useSensors(
    // Mouse: start dragging after moving 6px, so clicks still work
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // Touch: press and hold, so swiping the menu sideways still scrolls it
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    // Keyboard: focus a link, press Space to pick it up, arrows to move, Space to drop
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space', 'Enter'] },
    }),
  )

  function handleDragStart() {
    justDragged.current = true
  }

  function handleDragEnd(event: DragEndEvent) {
    // Let the click that ends a mouse drag pass by first
    setTimeout(() => {
      justDragged.current = false
    }, 0)
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }
    const from = order.indexOf(String(active.id))
    const to = order.indexOf(String(over.id))
    const next = arrayMove(order, from, to)
    setOrder(next)
    saveNavOrder(next)
  }

  function handleClickCapture(event: MouseEvent) {
    if (justDragged.current) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  const pages = order
    .map((id) => NAV_PAGES.find((page) => page.id === id))
    .filter((page): page is NavPage => page !== undefined)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[onlySideways]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        justDragged.current = false
      }}
      accessibility={{
        screenReaderInstructions: {
          draggable: 'To move this page in the menu, press Space, use the arrow keys, then press Space again.',
        },
      }}
    >
      <SortableContext items={order} strategy={horizontalListSortingStrategy}>
        <div className="nav-links">
          {pages.map((page) => (
            <SortableLink key={page.id} page={page} onClickCapture={handleClickCapture} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

export default function Navbar() {
  const { data: session } = authClient.useSession()

  return (
    <nav className="navbar">
      {!session && (
        <NavLink to="/" className="nav-brand">
          Productivity App
        </NavLink>
      )}
      {session && <PageLinks />}
      <div className="nav-actions">
        <AuthControls />
      </div>
    </nav>
  )
}
