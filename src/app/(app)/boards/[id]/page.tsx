'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DndContext, DragEndEvent, DragOverEvent, DragStartEvent, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { boardsService } from '../../../../services/boards'
import { cardsService } from '../../../../services/cards'
import { useAuthStore } from '../../../../store/auth'
import { authService } from '../../../../services/auth'
import { Column, Card } from '../../../../types'
import Cookies from 'js-cookie'

function getPriorityColor(priority: string) {
  if (priority === 'critical') return { dot: '#E24B4A', text: '#A32D2D' }
  if (priority === 'high') return { dot: '#BA7517', text: '#854F0B' }
  if (priority === 'medium') return { dot: '#378ADD', text: '#185FA5' }
  return { dot: '#888780', text: '#5F5E5A' }
}

function KanbanCard({ card, permission }: { card: Card; permission: string }) {
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

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div style={{
        backgroundColor: card.is_archived ? '#F5F5F4' : '#FFFFFF',
        border: '1px solid #D3D1C7',
        borderRadius: '8px',
        padding: '12px',
        cursor: permission === 'viewer' || card.is_archived ? 'default' : 'grab',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        <div style={{ fontSize: '13px', fontWeight: '500', color: card.is_archived ? '#888780' : '#1C1C1B', lineHeight: '1.4' }}>
          {card.title}
        </div>
        {card.tags && card.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {card.tags.map((tag, i) => (
              <span key={i} style={{
                fontSize: '11px', padding: '2px 7px', borderRadius: '20px',
                fontWeight: '500', backgroundColor: '#E6F1FB', color: '#185FA5',
              }}>{tag}</span>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: pColor.dot }} />
            <span style={{ fontSize: '11px', fontWeight: '500', color: pColor.text }}>{card.priority}</span>
          </div>
          {card.assignee && (
            <div style={{
              width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#378ADD',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '9px', fontWeight: '600', color: '#FFFFFF',
            }}>
              {card.assignee.username.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DroppableColumn({ column, permission, onAddCard }: {
  column: Column
  permission: string
  onAddCard: (columnId: string) => void
}) {
  const activeCards = column.cards?.filter(c => !c.is_archived) || []
  const isAtLimit = column.wip_limit !== null && activeCards.length >= column.wip_limit
  const isNearLimit = column.wip_limit !== null && activeCards.length === column.wip_limit - 1

  return (
    <div style={{
      backgroundColor: '#EBEBEA',
      borderRadius: '10px',
      width: '260px',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      maxHeight: 'calc(100vh - 120px)',
    }}>
      <div style={{ padding: '12px 14px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#1C1C1B' }}>{column.name}</span>
        <span style={{
          fontSize: '11px', padding: '2px 7px', borderRadius: '20px', fontWeight: '500',
          backgroundColor: isAtLimit ? '#FCEBEB' : isNearLimit ? '#FAEEDA' : '#D3D1C7',
          color: isAtLimit ? '#A32D2D' : isNearLimit ? '#854F0B' : '#888780',
        }}>
          {column.wip_limit ? `${activeCards.length} / ${column.wip_limit}` : activeCards.length}
        </span>
      </div>

      {isAtLimit && (
        <div style={{
          margin: '0 10px 8px', padding: '4px 8px', borderRadius: '6px',
          backgroundColor: '#FCEBEB', border: '1px solid #F7C1C1',
          fontSize: '11px', fontWeight: '500', color: '#A32D2D',
        }}>
          Limite atingido — {column.wip_limit} de {column.wip_limit}
        </div>
      )}

      {isNearLimit && (
        <div style={{
          margin: '0 10px 8px', padding: '4px 8px', borderRadius: '6px',
          backgroundColor: '#FAEEDA', border: '1px solid #FAC775',
          fontSize: '11px', fontWeight: '500', color: '#854F0B',
        }}>
          Limite quase atingido — {activeCards.length} de {column.wip_limit}
        </div>
      )}

      <SortableContext items={activeCards.map(c => c.id)} strategy={verticalListSortingStrategy}>
        <div style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
          {activeCards.map(card => (
            <KanbanCard key={card.id} card={card} permission={permission} />
          ))}
        </div>
      </SortableContext>

      {permission !== 'viewer' && (
        <button
          onClick={() => onAddCard(column.id)}
          style={{
            margin: '8px 10px 10px', padding: '8px', border: '1px dashed #B4B2A9',
            borderRadius: '6px', fontSize: '12px', color: '#888780',
            backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'center',
          }}
        >
          + Adicionar card
        </button>
      )}
    </div>
  )
}

export default function BoardPage() {
  const router = useRouter()
  const params = useParams()
  const boardId = params.id as string
  const queryClient = useQueryClient()
  const { user, setUser, setAuthenticated } = useAuthStore()

  const [moveModal, setMoveModal] = useState<{ cardId: string; fromColumn: string; toColumnId: string; toColumnName: string } | null>(null)
  const [observation, setObservation] = useState('')
  const [obsError, setObsError] = useState('')
  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const [pendingMove, setPendingMove] = useState<{ cardId: string; toColumnId: string } | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  useEffect(() => {
    const token = Cookies.get('access_token')
    if (!token) { router.push('/login'); return }
    if (!user) {
      authService.me().then(data => { setUser(data); setAuthenticated(true) })
        .catch(() => router.push('/login'))
    }
  }, [])

  const { data: board, isLoading, isError } = useQuery({
    queryKey: ['board', boardId],
    queryFn: () => boardsService.get(boardId),
  })

  const moveMutation = useMutation({
    mutationFn: (data: { cardId: string; targetColumnId: string; observation: string }) =>
      cardsService.move(data.cardId, {
        target_column_id: data.targetColumnId,
        position: 0,
        observation: data.observation,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
      setMoveModal(null)
      setObservation('')
      setObsError('')
      setPendingMove(null)
    },
    onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
      const msg = error?.response?.data?.error?.message || 'Erro ao mover card.'
      setObsError(msg)
    },
  })

  function handleDragStart(event: DragStartEvent) {
    const { active } = event
    const allCards = board?.columns?.flatMap((c: Column) => c.cards || []) || []
    const card = allCards.find((c: Card) => c.id === active.id)
    setActiveCard(card || null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveCard(null)
    if (!over || !board) return

    const fromColumn = board.columns.find((c: Column) => c.cards?.some((card: Card) => card.id === active.id))
    const toColumn = board.columns.find((c: Column) =>
      c.id === over.id || c.cards?.some((card: Card) => card.id === over.id)
    )

    if (!fromColumn || !toColumn || fromColumn.id === toColumn.id) return

    const activeCards = toColumn.cards?.filter((c: Card) => !c.is_archived) || []
    if (toColumn.wip_limit !== null && activeCards.length >= toColumn.wip_limit) {
      setObsError(`Limite WIP atingido na coluna "${toColumn.name}" (${toColumn.wip_limit} cards)`)
      setTimeout(() => setObsError(''), 4000)
      return
    }

    setMoveModal({
      cardId: active.id as string,
      fromColumn: fromColumn.name,
      toColumnId: toColumn.id,
      toColumnName: toColumn.name,
    })
  }

  function handleConfirmMove() {
    if (!observation || observation.trim().length < 10) {
      setObsError('A observacao deve ter no minimo 10 caracteres.')
      return
    }
    if (!moveModal) return
    moveMutation.mutate({
      cardId: moveModal.cardId,
      targetColumnId: moveModal.toColumnId,
      observation: observation.trim(),
    })
  }

  function handleLogout() {
    authService.logout().finally(() => router.push('/login'))
  }

  const permission = board?.my_permission || 'viewer'

  if (isLoading) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontSize: '14px', color: '#888780' }}>Carregando board...</div>
    </div>
  )

  if (isError) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ backgroundColor: '#FCEBEB', border: '1px solid #F09595', borderRadius: '8px', padding: '16px', color: '#A32D2D' }}>
        Erro ao carregar o board.
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F4', display: 'flex' }}>

      {/* Sidebar */}
      <div style={{
        width: '220px', backgroundColor: '#1C1C1B', minHeight: '100vh',
        padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', marginBottom: '16px' }}>
          <div style={{
            width: '24px', height: '24px', backgroundColor: '#FFFFFF', borderRadius: '6px',
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', padding: '5px',
          }}>
            {[0,1,2,3].map(i => <div key={i} style={{ backgroundColor: '#1C1C1B', borderRadius: '1px' }} />)}
          </div>
          <span style={{ fontSize: '15px', fontWeight: '600', color: '#FFFFFF' }}>Kanban</span>
        </div>

        <div style={{ fontSize: '11px', color: '#5F5E5A', padding: '8px 10px 4px', textTransform: 'uppercase', letterSpacing: '.06em' }}>
          Boards
        </div>

        <div onClick={() => router.push('/boards')} style={{
          padding: '8px 10px', borderRadius: '6px', fontSize: '13px',
          color: '#888780', cursor: 'pointer',
        }}>
          ← Voltar
        </div>

        <div style={{
          padding: '8px 10px', borderRadius: '6px', fontSize: '13px',
          backgroundColor: '#2C2C2A', color: '#FFFFFF',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#378ADD' }} />
          {board?.name}
        </div>

        <div style={{ marginTop: 'auto', borderTop: '1px solid #2C2C2A', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#378ADD',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: '600', color: '#FFFFFF', flexShrink: 0,
            }}>
              {user?.username?.slice(0, 2).toUpperCase() || 'US'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', color: '#FFFFFF', fontWeight: '500' }}>{user?.username}</div>
              <div style={{ fontSize: '11px', color: '#5F5E5A' }}>{user?.role}</div>
            </div>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#5F5E5A', cursor: 'pointer', fontSize: '12px' }}>
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Topbar */}
        <div style={{
          backgroundColor: '#FFFFFF', borderBottom: '1px solid #D3D1C7',
          padding: '0 24px', height: '56px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <span style={{ fontSize: '16px', fontWeight: '600', color: '#1C1C1B' }}>{board?.name}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {permission === 'viewer' && (
              <span style={{
                fontSize: '11px', padding: '3px 8px', borderRadius: '20px',
                backgroundColor: '#F1EFE8', color: '#5F5E5A', fontWeight: '500',
              }}>
                Modo visualizacao
              </span>
            )}
            <button
              onClick={() => router.push(`/boards/${boardId}/activity`)}
              style={{
                padding: '6px 12px', fontSize: '12px', color: '#5F5E5A',
                backgroundColor: '#FFFFFF', border: '1px solid #D3D1C7',
                borderRadius: '6px', cursor: 'pointer',
              }}
            >
              Feed de Atividade
            </button>
          </div>
        </div>

        {/* Erro WIP */}
        {obsError && !moveModal && (
          <div style={{
            margin: '12px 24px 0', padding: '10px 14px',
            backgroundColor: '#FCEBEB', border: '1px solid #F09595',
            borderRadius: '8px', fontSize: '13px', color: '#A32D2D',
          }}>
            {obsError}
          </div>
        )}

        {/* Board area */}
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div style={{
            flex: 1, padding: '24px', display: 'flex', gap: '16px',
            overflowX: 'auto', alignItems: 'flex-start',
          }}>
            {board?.columns?.map((column: Column) => (
              <DroppableColumn
                key={column.id}
                column={column}
                permission={permission}
                onAddCard={() => {}}
              />
            ))}
          </div>

          <DragOverlay>
            {activeCard && (
              <div style={{
                backgroundColor: '#FFFFFF', border: '2px dashed #378ADD',
                borderRadius: '8px', padding: '12px', width: '260px',
                fontSize: '13px', fontWeight: '500', color: '#1C1C1B',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}>
                {activeCard.title}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Modal de movimentacao */}
      {moveModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(28,28,27,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '24px',
        }}>
          <div style={{
            backgroundColor: '#FFFFFF', borderRadius: '12px',
            width: '100%', maxWidth: '480px', overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #EBEBEA', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#1C1C1B' }}>Mover card</div>
                <div style={{ fontSize: '12px', color: '#888780', marginTop: '2px' }}>
                  {board?.columns?.flatMap((c: Column) => c.cards || []).find((c: Card) => c.id === moveModal.cardId)?.title}
                </div>
              </div>
              <button
                onClick={() => { setMoveModal(null); setObservation(''); setObsError('') }}
                style={{
                  width: '28px', height: '28px', backgroundColor: '#F5F5F4',
                  border: 'none', borderRadius: '6px', cursor: 'pointer',
                  fontSize: '14px', color: '#5F5E5A',
                }}
              >✕</button>
            </div>

            {/* Body */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Info movimentacao */}
              <div style={{
                backgroundColor: '#F5F5F4', borderRadius: '8px', padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span style={{ backgroundColor: '#EBEBEA', borderRadius: '4px', padding: '2px 8px', fontSize: '12px', fontWeight: '500', color: '#1C1C1B' }}>
                  {moveModal.fromColumn}
                </span>
                <span style={{ color: '#888780' }}>→</span>
                <span style={{ backgroundColor: '#E6F1FB', borderRadius: '4px', padding: '2px 8px', fontSize: '12px', fontWeight: '500', color: '#185FA5' }}>
                  {moveModal.toColumnName}
                </span>
              </div>

              {/* Campo observacao */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '500', color: '#5F5E5A', marginBottom: '6px' }}>
                  Observacao <span style={{ color: '#E24B4A' }}>*</span>
                </label>
                <textarea
                  value={observation}
                  onChange={(e) => { setObservation(e.target.value); setObsError('') }}
                  placeholder="Descreva o motivo da movimentacao (minimo 10 caracteres)..."
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 14px', fontSize: '13px',
                    border: `1px solid ${obsError ? '#E24B4A' : '#D3D1C7'}`,
                    borderRadius: '8px', outline: 'none', resize: 'none',
                    backgroundColor: obsError ? '#FFFAFA' : '#FFFFFF',
                    color: '#1C1C1B', fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
                {obsError && (
                  <div style={{ fontSize: '11px', color: '#A32D2D', marginTop: '4px' }}>✕ {obsError}</div>
                )}
                <div style={{
                  fontSize: '11px', textAlign: 'right', marginTop: '4px',
                  color: observation.length >= 10 ? '#3B6D11' : '#888780',
                }}>
                  {observation.length} / 10 caracteres minimos {observation.length >= 10 ? '✓' : ''}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid #EBEBEA', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setMoveModal(null); setObservation(''); setObsError('') }}
                style={{
                  padding: '10px 20px', fontSize: '13px', color: '#5F5E5A',
                  backgroundColor: '#FFFFFF', border: '1px solid #D3D1C7',
                  borderRadius: '8px', cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmMove}
                disabled={observation.length < 10 || moveMutation.isPending}
                style={{
                  padding: '10px 20px', fontSize: '13px', fontWeight: '500',
                  backgroundColor: observation.length >= 10 ? '#1C1C1B' : '#D3D1C7',
                  color: observation.length >= 10 ? '#FFFFFF' : '#888780',
                  border: 'none', borderRadius: '8px',
                  cursor: observation.length >= 10 ? 'pointer' : 'not-allowed',
                }}
              >
                {moveMutation.isPending ? 'Movendo...' : 'Confirmar movimentacao'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}