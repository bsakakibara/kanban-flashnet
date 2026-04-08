'use client'

import { Plus, AlertTriangle } from 'lucide-react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Column } from '@/types'
import { KanbanCard } from './KanbanCard'

interface KanbanColumnProps {
  column: Column
  permission: string
  onAddCard: (columnId: string) => void
  onOpenCard: (cardId: string) => void
  mobile?: boolean
}

export function KanbanColumn({ column, permission, onAddCard, onOpenCard, mobile = false }: KanbanColumnProps) {
  const activeCards = column.cards?.filter(c => !c.is_archived) || []
  const isAtLimit = column.wip_limit !== null && activeCards.length >= column.wip_limit
  const isNearLimit = column.wip_limit !== null && activeCards.length === column.wip_limit - 1

  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  const sidePad = mobile ? '16px' : '10px'

  return (
    <div style={{
      backgroundColor: mobile ? 'transparent' : '#EBEBEA',
      borderRadius: mobile ? '0' : '10px',
      width: mobile ? '100%' : '260px',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      maxHeight: mobile ? 'none' : 'calc(100vh - 120px)',
      flex: mobile ? 1 : undefined,
      boxSizing: 'border-box',
    }}>

      <div style={{
        padding: mobile ? '0 16px 8px' : '12px 14px 8px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#1C1C1B' }}>
          {column.name}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {(isAtLimit || isNearLimit) && (
            <AlertTriangle size={12} color={isAtLimit ? '#A32D2D' : '#854F0B'} />
          )}
          <span style={{
            fontSize: '11px', padding: '2px 7px', borderRadius: '20px', fontWeight: '500',
            backgroundColor: isAtLimit ? '#FCEBEB' : isNearLimit ? '#FAEEDA' : '#D3D1C7',
            color: isAtLimit ? '#A32D2D' : isNearLimit ? '#854F0B' : '#888780',
          }}>
            {column.wip_limit ? `${activeCards.length} / ${column.wip_limit}` : activeCards.length}
          </span>
        </div>
      </div>

      {isAtLimit && (
        <div style={{
          margin: `0 ${sidePad} 8px`, padding: '4px 8px', borderRadius: '6px',
          backgroundColor: '#FCEBEB', border: '1px solid #F7C1C1',
          fontSize: '11px', fontWeight: '500', color: '#A32D2D',
        }}>
          Limite atingido — {column.wip_limit} de {column.wip_limit}
        </div>
      )}
      {isNearLimit && !isAtLimit && (
        <div style={{
          margin: `0 ${sidePad} 8px`, padding: '4px 8px', borderRadius: '6px',
          backgroundColor: '#FAEEDA', border: '1px solid #FAC775',
          fontSize: '11px', fontWeight: '500', color: '#854F0B',
        }}>
          Limite quase atingido — {activeCards.length} de {column.wip_limit}
        </div>
      )}

      <SortableContext items={activeCards.map(c => c.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          style={{
            padding: `0 ${sidePad}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            overflowY: mobile ? 'visible' : 'auto',
            flex: 1,
            minHeight: '60px',
            backgroundColor: isOver && activeCards.length === 0 ? 'rgba(55,138,221,0.06)' : 'transparent',
            borderRadius: '6px',
            transition: 'background-color 0.15s',
          }}
        >
          {activeCards.length === 0 && (
            <div
              style={{
                textAlign: 'center', padding: '40px 20px',
                fontSize: '13px', color: isOver ? '#378ADD' : '#888780',
                transition: 'color 0.15s',
              }}>
              {isOver ? 'Soltar aqui' : 'Nenhum card nesta coluna'}
            </div>
          )}
          {activeCards.map(card => (
            <KanbanCard
              key={card.id}
              card={card}
              permission={permission}
              onOpen={() => onOpenCard(card.id)}
            />
          ))}
        </div>
      </SortableContext>

      {permission !== 'viewer' && (
        <button
          onClick={() => onAddCard(column.id)}
          style={{
            margin: `8px ${sidePad} ${mobile ? '16px' : '10px'}`,
            padding: '8px',
            border: '1px dashed #B4B2A9',
            borderRadius: '6px',
            fontSize: '12px',
            color: '#888780',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
          }}
        >
          <Plus size={13} color="#888780" />
          Adicionar card
        </button>
      )}
    </div>
  )
}