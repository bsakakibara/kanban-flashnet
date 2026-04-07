'use client'

import { GripVertical, AlertCircle, Circle } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '@/types'
import { Avatar } from '@/components/ui/Avatar'

interface KanbanCardProps {
  card: Card
  permission: string
  onOpen: () => void
}

function getPriorityColor(priority: string) {
  if (priority === 'critical') return { dot: '#E24B4A', text: '#A32D2D' }
  if (priority === 'high') return { dot: '#BA7517', text: '#854F0B' }
  if (priority === 'medium') return { dot: '#378ADD', text: '#185FA5' }
  return { dot: '#888780', text: '#5F5E5A' }
}

export function KanbanCard({ card, permission, onOpen }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    disabled: permission === 'viewer' || card.is_archived,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const pColor = getPriorityColor(card.priority)
  const canDrag = permission !== 'viewer' && !card.is_archived

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div
        onClick={onOpen}
        style={{
          backgroundColor: card.is_archived ? '#F5F5F4' : '#FFFFFF',
          border: '1px solid #D3D1C7',
          borderRadius: '8px',
          padding: '12px',
          cursor: canDrag ? 'grab' : 'default',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          position: 'relative',
        }}
      >
        {/* Grip icon para indicar que é arrastável */}
        {canDrag && (
          <div style={{ position: 'absolute', top: '10px', right: '8px', opacity: 0.3 }}>
            <GripVertical size={14} color="#888780" />
          </div>
        )}

        <div style={{
          fontSize: '13px', fontWeight: '500',
          color: card.is_archived ? '#888780' : '#1C1C1B',
          lineHeight: '1.4',
          paddingRight: canDrag ? '18px' : '0',
        }}>
          {card.title}
        </div>

        {card.tags && card.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {card.tags.map((tag, i) => (
              <span key={i} style={{
                fontSize: '11px', padding: '2px 7px', borderRadius: '20px',
                fontWeight: '500', backgroundColor: '#E6F1FB', color: '#185FA5',
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {card.priority === 'critical' ? (
              <AlertCircle size={12} color={pColor.dot} />
            ) : (
              <Circle size={8} color={pColor.dot} fill={pColor.dot} />
            )}
            <span style={{ fontSize: '11px', fontWeight: '500', color: pColor.text }}>
              {card.priority}
            </span>
          </div>

          {card.assignee && (
            <Avatar username={card.assignee.username} size={20} fontSize={9} />
          )}
        </div>
      </div>
    </div>
  )
}