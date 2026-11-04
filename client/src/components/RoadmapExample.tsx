import { useState } from 'react'
import { Background, MarkerType, ReactFlow, applyNodeChanges, type Edge, type NodeChange } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import SkillNode, { type SkillNodeType } from './SkillNode'
import { SAMPLE_LINKS, SAMPLE_SKILLS } from '../lib/landing-samples'
import '../roadmap.css'

const nodeTypes = { skill: SkillNode }

const startNodes: SkillNodeType[] = SAMPLE_SKILLS.map((skill) => ({
  id: skill.id,
  type: 'skill',
  position: { x: skill.x, y: skill.y },
  data: { name: skill.name, status: skill.status },
}))

const edges: Edge[] = SAMPLE_LINKS.map(([from, to]) => ({
  id: from + '-' + to,
  source: from,
  target: to,
  markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: 'var(--muted)' },
}))

// A sample roadmap visitors can drag around; nothing here is saved
export default function RoadmapExample() {
  const [nodes, setNodes] = useState(startNodes)

  function handleNodesChange(changes: NodeChange<SkillNodeType>[]) {
    setNodes((current) => applyNodeChanges(changes, current))
  }

  return (
    <div className="roadmap-canvas landing-roadmap">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        nodesConnectable={false}
        elementsSelectable={false}
        zoomOnScroll={false}
        preventScrolling={false}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.2}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1.5} />
      </ReactFlow>
    </div>
  )
}
