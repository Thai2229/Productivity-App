import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { STATUSES, type SkillStatus } from '../lib/roadmaps'

export type SkillNodeData = { name: string; status: SkillStatus }
export type SkillNodeType = Node<SkillNodeData, 'skill'>

function statusLabel(status: SkillStatus) {
  const match = STATUSES.find((item) => item.value === status)
  if (!match) {
    return status
  }
  return match.label
}

// The status mark: filled with a check (learned), half filled (learning), empty ring (planned)
export function StatusMark({ status }: { status: SkillStatus }) {
  return (
    <svg className="skill-mark" data-status={status} viewBox="0 0 16 16" aria-hidden="true">
      <circle className="skill-mark-ring" cx="8" cy="8" r="6.25" />
      {status === 'LEARNED' && <path className="skill-mark-check" d="M5 8.3l2 2 4-4.2" />}
      {status === 'LEARNING' && <path className="skill-mark-half" d="M8 3.5a4.5 4.5 0 0 0 0 9z" />}
    </svg>
  )
}

// One block on the canvas. Arrows come in on the left and go out on the right.
export default function SkillNode({ data, selected }: NodeProps<SkillNodeType>) {
  let className = 'skill-node'
  if (selected) {
    className = 'skill-node skill-node-selected'
  }

  return (
    <div className={className} data-status={data.status}>
      <Handle type="target" position={Position.Left} className="skill-handle" />
      <StatusMark status={data.status} />
      <span className="skill-name">{data.name}</span>
      <span className="skill-status">{statusLabel(data.status)}</span>
      <Handle type="source" position={Position.Right} className="skill-handle" />
    </div>
  )
}
