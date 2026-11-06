import { useEffect, useRef, useState } from 'react'
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

// Links only slide sideways while being dragged, and stop at either end of the
// visible menu, so the row never scrolls the other links out of view
const sidewaysWithinMenu: Modifier = ({ transform, draggingNodeRect, containerNodeRect }) => {
  let x = transform.x
  if (draggingNodeRect && containerNodeRect) {
    const furthestLeft = containerNodeRect.left - draggingNodeRect.left
    const furthestRight = containerNodeRect.right - draggingNodeRect.right
    if (x < furthestLeft) {
      x = furthestLeft
    }
    if (x > furthestRight) {
      x = furthestRight
    }
  }
  return { ...transform, x, y: 0 }
}

// One menu link that can be dragged to a new spot. A plain click still opens the page.
function SortableLink({ page }: { page: NavPage }) {
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
        draggable={false}
        {...dragAttributes}
        {...listeners}
      >
        {page.label}
      </NavLink>
    </span>
  )
}

// How long after a drag ends a click is still treated as part of the drag
const CLICK_AFTER_DRAG_MS = 400

function PageLinks() {
  const [order, setOrder] = useState(loadNavOrder)
  // Releasing the mouse (or finger) at the end of a drag also counts as a click.
  // These ignore clicks during a drag and for a moment after it ends.
  const isDragging = useRef(false)
  const dragEndedAt = useRef(0)
  const rowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function reload() {
      setOrder(loadNavOrder())
    }
    window.addEventListener(NAV_ORDER_EVENT, reload)
    return () => window.removeEventListener(NAV_ORDER_EVENT, reload)
  }, [])

  // Catch the click that comes from letting go of a drag before anything else sees it.
  // Without this, dropping a link back in its own spot can make the browser open
  // (and fully reload) that page.
  useEffect(() => {
    function blockClickAfterDrag(event: globalThis.MouseEvent) {
      const recentlyDragged = isDragging.current || Date.now() - dragEndedAt.current < CLICK_AFTER_DRAG_MS
      if (recentlyDragged && rowRef.current && rowRef.current.contains(event.target as Node)) {
        event.preventDefault()
        event.stopPropagation()
      }
    }
    window.addEventListener('click', blockClickAfterDrag, true)
    return () => window.removeEventListener('click', blockClickAfterDrag, true)
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
    isDragging.current = true
  }

  function finishDrag() {
    isDragging.current = false
    dragEndedAt.current = Date.now()
  }

  function handleDragEnd(event: DragEndEvent) {
    finishDrag()
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

  const pages = order
    .map((id) => NAV_PAGES.find((page) => page.id === id))
    .filter((page): page is NavPage => page !== undefined)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[sidewaysWithinMenu]}
      autoScroll={false}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={finishDrag}
      accessibility={{
        screenReaderInstructions: {
          draggable: 'To move this page in the menu, press Space, use the arrow keys, then press Space again.',
        },
      }}
    >
      <SortableContext items={order} strategy={horizontalListSortingStrategy}>
        <div className="nav-links" ref={rowRef}>
          {pages.map((page) => (
            <SortableLink key={page.id} page={page} />
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
