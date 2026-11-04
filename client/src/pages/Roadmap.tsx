import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Background,
  Controls,
  MarkerType,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type Edge,
  type FinalConnectionState,
  type EdgeChange,
  type NodeChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import SkillNode, { type SkillNodeType } from '../components/SkillNode'
import {
  STATUSES,
  autoArrange,
  createLink,
  createRoadmap,
  createSkill,
  deleteLink,
  deleteRoadmap,
  deleteSkill,
  getRoadmap,
  listRoadmaps,
  renameRoadmap,
  savePositions,
  updateSkill,
  type RoadmapSummary,
  type Skill,
  type SkillLink,
  type SkillStatus,
} from '../lib/roadmaps'
import '../roadmap.css'

type LoadState = 'loading' | 'ready' | 'error'
type BarMode = 'none' | 'new' | 'rename' | 'delete'

const nodeTypes = { skill: SkillNode }

const defaultEdgeOptions = {
  markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: 'var(--muted)' },
}

function toNode(skill: Skill): SkillNodeType {
  return {
    id: skill.id,
    type: 'skill',
    position: { x: skill.x, y: skill.y },
    data: { name: skill.name, status: skill.status },
  }
}

function toEdge(link: SkillLink): Edge {
  return { id: link.id, source: link.fromId, target: link.toId }
}

function errorText(error: unknown) {
  return (error as Error).message
}

// ---------- Editing one selected skill ----------

type EditorProps = {
  node: SkillNodeType
  onRename: (name: string) => void
  onStatus: (status: SkillStatus) => void
  onDelete: () => void
}

function SkillEditor({ node, onRename, onStatus, onDelete }: EditorProps) {
  const [name, setName] = useState(node.data.name)
  const [confirming, setConfirming] = useState(false)

  function saveName() {
    const trimmed = name.trim()
    if (trimmed !== '' && trimmed !== node.data.name) {
      onRename(trimmed)
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    saveName()
  }

  return (
    <form className="skill-editor" onSubmit={handleSubmit}>
      <label className="auth-field">
        <span>Skill</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={saveName}
          maxLength={60}
          autoFocus={node.data.name === 'New skill'}
          onFocus={(event) => event.target.select()}
        />
      </label>

      <div className="status-picker" role="group" aria-label="Status">
        {STATUSES.map((status) => (
          <button
            key={status.value}
            type="button"
            data-status={status.value}
            aria-pressed={node.data.status === status.value}
            onClick={() => onStatus(status.value)}
          >
            <span className="skill-status-dot" aria-hidden="true" />
            {status.label}
          </button>
        ))}
      </div>

      {!confirming && (
        <button type="button" className="link-btn link-btn-danger" onClick={() => setConfirming(true)}>
          Delete skill
        </button>
      )}
      {confirming && (
        <span className="roadmap-confirm">
          Delete it and its arrows?
          <button type="button" className="link-btn link-btn-danger" onClick={onDelete}>
            Yes, delete
          </button>
          <button type="button" className="link-btn" onClick={() => setConfirming(false)}>
            Keep
          </button>
        </span>
      )}
    </form>
  )
}

// ---------- The canvas for one roadmap ----------

function RoadmapCanvas({ roadmapId }: { roadmapId: string }) {
  const [nodes, setNodes] = useState<SkillNodeType[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [error, setError] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)
  const flow = useReactFlow()

  useEffect(() => {
    async function load() {
      try {
        const roadmap = await getRoadmap(roadmapId)
        setNodes(roadmap.skills.map(toNode))
        setEdges(roadmap.links.map(toEdge))
        setLoadState('ready')
      } catch {
        setLoadState('error')
      }
    }
    load()
  }, [roadmapId])

  const onNodesChange = useCallback((changes: NodeChange<SkillNodeType>[]) => {
    setNodes((current) => applyNodeChanges(changes, current))
  }, [])

  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges((current) => applyEdgeChanges(changes, current))
  }, [])

  function showError(prefix: string, problem: unknown) {
    setError(prefix + ': ' + errorText(problem))
  }

  // Positions are saved once, when you let go of a block (not on every pixel)
  function handleDragStop(_event: unknown, _node: SkillNodeType, dragged: SkillNodeType[]) {
    setError('')
    const positions = dragged.map((node) => ({ id: node.id, x: node.position.x, y: node.position.y }))
    savePositions(roadmapId, positions).catch((problem) => showError("Couldn't save the new position", problem))
  }

  async function saveLink(fromId: string, toId: string) {
    setError('')
    try {
      const link = await createLink(roadmapId, fromId, toId)
      setEdges((current) => {
        if (current.some((edge) => edge.id === link.id)) {
          return current
        }
        return [...current, toEdge(link)]
      })
    } catch (problem) {
      showError("Couldn't save the arrow", problem)
    }
  }

  // Dropped on a block's dot
  function handleConnect(connection: Connection) {
    if (connection.source && connection.target && connection.source !== connection.target) {
      saveLink(connection.source, connection.target)
    }
  }

  // Dropped anywhere else on a block: connect to the block under the pointer
  function handleConnectEnd(event: MouseEvent | TouchEvent, state: FinalConnectionState) {
    if (state.isValid || !state.fromNode) {
      return
    }
    let point: { clientX: number; clientY: number } = event as MouseEvent
    if ('changedTouches' in event) {
      point = event.changedTouches[0]
    }
    const element = document.elementFromPoint(point.clientX, point.clientY)
    const targetId = element?.closest('.react-flow__node')?.getAttribute('data-id')
    if (!targetId || targetId === state.fromNode.id) {
      return
    }
    // Dragging backwards from a block's left dot makes an arrow into that block
    if (state.fromHandle?.type === 'target') {
      saveLink(targetId, state.fromNode.id)
    } else {
      saveLink(state.fromNode.id, targetId)
    }
  }

  // The keyboard's Delete key removes arrows; skills are deleted from the editor (with a confirm)
  async function allowKeyboardDelete({ nodes: toDelete }: { nodes: SkillNodeType[]; edges: Edge[] }) {
    return toDelete.length === 0
  }

  function handleEdgesDelete(deleted: Edge[]) {
    setError('')
    for (const edge of deleted) {
      deleteLink(roadmapId, edge.id).catch((problem) => showError("Couldn't delete the arrow", problem))
    }
  }

  function removeSelectedEdge(edge: Edge) {
    setEdges((current) => current.filter((item) => item.id !== edge.id))
    handleEdgesDelete([edge])
  }

  async function addSkill() {
    setError('')
    // New blocks appear in the middle of what you're looking at
    let position = { x: 0, y: 0 }
    const box = wrapperRef.current?.getBoundingClientRect()
    if (box) {
      position = flow.screenToFlowPosition({ x: box.left + box.width / 2, y: box.top + box.height / 2 })
    }
    try {
      const skill = await createSkill(roadmapId, {
        name: 'New skill',
        status: 'PLANNED',
        x: Math.round(position.x - 80),
        y: Math.round(position.y - 25),
      })
      const node = { ...toNode(skill), selected: true }
      setNodes((current) => [...current.map((item) => ({ ...item, selected: false })), node])
    } catch (problem) {
      showError("Couldn't add the skill", problem)
    }
  }

  async function arrange() {
    setError('')
    const skills: Skill[] = nodes.map((node) => ({
      id: node.id,
      name: node.data.name,
      status: node.data.status,
      x: node.position.x,
      y: node.position.y,
    }))
    const links: SkillLink[] = edges.map((edge) => ({ id: edge.id, fromId: edge.source, toId: edge.target }))
    const positions = autoArrange(skills, links)
    const byId = new Map(positions.map((item) => [item.id, item]))
    setNodes((current) => current.map((node) => {
      const spot = byId.get(node.id)
      if (!spot) {
        return node
      }
      return { ...node, position: { x: spot.x, y: spot.y } }
    }))
    window.requestAnimationFrame(() => flow.fitView({ duration: 300, padding: 0.2 }))
    try {
      await savePositions(roadmapId, positions)
    } catch (problem) {
      showError("Couldn't save the new layout", problem)
    }
  }

  function changeSkill(id: string, changes: Partial<{ name: string; status: SkillStatus }>) {
    setError('')
    setNodes((current) => current.map((node) => {
      if (node.id !== id) {
        return node
      }
      return { ...node, data: { ...node.data, ...changes } }
    }))
    updateSkill(roadmapId, id, changes).catch((problem) => showError("Couldn't save the skill", problem))
  }

  async function removeSkill(id: string) {
    setError('')
    try {
      await deleteSkill(roadmapId, id)
      setNodes((current) => current.filter((node) => node.id !== id))
      setEdges((current) => current.filter((edge) => edge.source !== id && edge.target !== id))
    } catch (problem) {
      showError("Couldn't delete the skill", problem)
    }
  }

  if (loadState === 'loading') {
    return <p className="auth-loading">Loading roadmap…</p>
  }

  if (loadState === 'error') {
    return (
      <div className="tracker-empty">
        <p>Couldn't load this roadmap. Check your connection and refresh.</p>
      </div>
    )
  }

  const selectedNodes = nodes.filter((node) => node.selected)
  const selectedEdges = edges.filter((edge) => edge.selected)
  let editing: SkillNodeType | null = null
  if (selectedNodes.length === 1) {
    editing = selectedNodes[0]
  }
  let selectedEdge: Edge | null = null
  if (!editing && selectedEdges.length === 1) {
    selectedEdge = selectedEdges[0]
  }

  return (
    <>
      <div className="roadmap-actions">
        <button type="button" className="btn btn-primary btn-small" onClick={addSkill}>
          Add skill
        </button>
        <button type="button" className="btn btn-secondary btn-small" onClick={arrange} disabled={nodes.length === 0}>
          Auto arrange
        </button>
        <ul className="status-legend" aria-label="Status colors">
          {STATUSES.map((status) => (
            <li key={status.value} data-status={status.value}>
              <span className="skill-status-dot" aria-hidden="true" />
              {status.label}
            </li>
          ))}
        </ul>
      </div>

      {error && <p className="auth-error" role="alert">{error}</p>}

      <div className="roadmap-canvas" ref={wrapperRef}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={handleDragStop}
          onConnect={handleConnect}
          onConnectEnd={handleConnectEnd}
          onBeforeDelete={allowKeyboardDelete}
          onEdgesDelete={handleEdgesDelete}
          isValidConnection={(connection) => connection.source !== connection.target}
          deleteKeyCode={['Backspace', 'Delete']}
          fitView
          fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
          minZoom={0.25}
          maxZoom={2}
        >
          <Background gap={20} size={1.5} />
          <Controls showInteractive={false} />

          {nodes.length === 0 && (
            <Panel position="top-center" className="roadmap-hint">
              Click <strong>Add skill</strong> to place your first block.
            </Panel>
          )}

          {editing && (
            <Panel position="top-right">
              <SkillEditor
                key={editing.id}
                node={editing}
                onRename={(name) => changeSkill((editing as SkillNodeType).id, { name })}
                onStatus={(status) => changeSkill((editing as SkillNodeType).id, { status })}
                onDelete={() => removeSkill((editing as SkillNodeType).id)}
              />
            </Panel>
          )}

          {selectedEdge && (
            <Panel position="top-right" className="skill-editor">
              <span>Arrow selected</span>
              <button
                type="button"
                className="link-btn link-btn-danger"
                onClick={() => removeSelectedEdge(selectedEdge as Edge)}
              >
                Delete arrow
              </button>
            </Panel>
          )}
        </ReactFlow>
      </div>

      <p className="roadmap-help">
        Drag blocks to move them. Drag from the dot on a block's right edge to another block to draw an arrow.
        Click a block to rename it or change its status; click an arrow and press Delete to remove it.
      </p>
    </>
  )
}

// ---------- The page: pick, create, rename and delete roadmaps ----------

export default function Roadmap() {
  const [roadmaps, setRoadmaps] = useState<RoadmapSummary[]>([])
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [mode, setMode] = useState<BarMode>('none')
  const [nameInput, setNameInput] = useState('')
  const [error, setError] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()

  async function load() {
    try {
      setRoadmaps(await listRoadmaps())
      setLoadState('ready')
    } catch {
      setLoadState('error')
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- loading data once when the page opens
    load()
  }, [])

  // The chosen roadmap lives in the address (?map=...) so refresh keeps it
  let current: RoadmapSummary | null = null
  for (const roadmap of roadmaps) {
    if (roadmap.id === searchParams.get('map')) {
      current = roadmap
    }
  }
  if (!current && roadmaps.length > 0) {
    current = roadmaps[0]
  }

  function startNew() {
    setMode('new')
    setNameInput('')
    setError('')
  }

  function startRename() {
    if (current) {
      setMode('rename')
      setNameInput(current.name)
      setError('')
    }
  }

  function cancel() {
    setMode('none')
    setError('')
  }

  async function submitName(event: FormEvent) {
    event.preventDefault()
    setError('')
    const name = nameInput.trim()
    if (name === '') {
      setError('Give the roadmap a name.')
      return
    }
    try {
      if (mode === 'rename' && current) {
        const saved = await renameRoadmap(current.id, name)
        setRoadmaps((list) => list.map((item) => {
          if (item.id === saved.id) {
            return saved
          }
          return item
        }))
      } else {
        const saved = await createRoadmap(name)
        setRoadmaps((list) => [...list, saved])
        setSearchParams({ map: saved.id })
      }
      setMode('none')
    } catch (problem) {
      setError(errorText(problem))
    }
  }

  async function confirmDelete() {
    if (!current) {
      return
    }
    setError('')
    const removedId = current.id
    try {
      await deleteRoadmap(removedId)
      setRoadmaps((list) => list.filter((item) => item.id !== removedId))
      setSearchParams({})
      setMode('none')
    } catch (problem) {
      setError(errorText(problem))
    }
  }

  if (loadState === 'loading') {
    return <p className="auth-loading">Loading your roadmaps…</p>
  }

  if (loadState === 'error') {
    return (
      <div className="roadmap tracker-empty">
        <p>Couldn't load your roadmaps. Check your connection and refresh.</p>
      </div>
    )
  }

  let formTitle = 'New roadmap'
  let submitText = 'Create'
  if (mode === 'rename') {
    formTitle = 'Rename roadmap'
    submitText = 'Save'
  }

  return (
    <div className="roadmap">
      <header className="tracker-header">
        <div>
          <h1 className="tracker-title">Roadmaps</h1>
          <p className="tracker-subtitle">Map out the skills you've learned and what comes next</p>
        </div>
      </header>

      {(mode === 'new' || mode === 'rename') && (
        <form className="roadmap-name-form" onSubmit={submitName}>
          <label className="auth-field">
            <span>{formTitle}</span>
            <input
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
              maxLength={60}
              placeholder="e.g. Cybersecurity"
              autoFocus
              required
            />
          </label>
          <div className="roadmap-name-actions">
            <button type="button" className="btn btn-secondary btn-small" onClick={cancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-small">
              {submitText}
            </button>
          </div>
        </form>
      )}

      {error && <p className="auth-error" role="alert">{error}</p>}

      {roadmaps.length === 0 && mode === 'none' && (
        <div className="tracker-empty">
          <p>No roadmaps yet. Make one for each path you're following, like "Cybersecurity" or "Full-stack".</p>
          <button type="button" className="btn btn-primary" onClick={startNew}>
            Create your first roadmap
          </button>
        </div>
      )}

      {current && (
        <div className="roadmap-bar">
          <select
            className="roadmap-select"
            aria-label="Roadmap"
            value={current.id}
            onChange={(event) => {
              setSearchParams({ map: event.target.value })
              setMode('none')
            }}
          >
            {roadmaps.map((roadmap) => (
              <option key={roadmap.id} value={roadmap.id}>
                {roadmap.name}
              </option>
            ))}
          </select>

          {mode !== 'delete' && (
            <>
              <button type="button" className="btn btn-secondary btn-small" onClick={startNew}>
                New roadmap
              </button>
              <button type="button" className="link-btn" onClick={startRename}>
                Rename
              </button>
              <button type="button" className="link-btn link-btn-danger" onClick={() => setMode('delete')}>
                Delete
              </button>
            </>
          )}

          {mode === 'delete' && (
            <span className="roadmap-confirm">
              Delete "{current.name}" and all its skills?
              <button type="button" className="link-btn link-btn-danger" onClick={confirmDelete}>
                Yes, delete
              </button>
              <button type="button" className="link-btn" onClick={cancel}>
                Keep
              </button>
            </span>
          )}
        </div>
      )}

      {current && (
        <ReactFlowProvider>
          <RoadmapCanvas key={current.id} roadmapId={current.id} />
        </ReactFlowProvider>
      )}
    </div>
  )
}
