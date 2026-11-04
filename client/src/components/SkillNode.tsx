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

// One block on the canvas. Arrows come in on the left and go out on the right.
export default function SkillNode({ data, selected }: NodeProps<SkillNodeType>) {
  let className = 'skill-node'
  if (selected) {
    className = 'skill-node skill-node-selected'
  }

  return (
    <div className={className} data-status={data.status}>
      <Handle type="target" position={Position.Left} className="skill-handle" />
      <span className="skill-name">{data.name}</span>
      <span className="skill-status">
        <span className="skill-status-dot" aria-hidden="true" />
        {statusLabel(data.status)}
      </span>
      <Handle type="source" position={Position.Right} className="skill-handle" />
    </div>
  )
}
