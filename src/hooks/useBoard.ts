import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import { boardsService } from '@/services/boards'
import { cardsService } from '@/services/cards'
import { Card, Column } from '@/types'

interface MoveModal {
  cardId: string
  fromColumn: string
  toColumnId: string
  toColumnName: string
}

// Dado um over.id, retorna a coluna correta:
// - se over.id é id de uma coluna → retorna essa coluna
// - se over.id é id de um card → retorna a coluna que contém esse card
function findTargetColumn(columns: Column[], overId: string): Column | undefined {
  // Primeiro tenta achar por id de coluna
  const byColumnId = columns.find(c => c.id === overId)
  if (byColumnId) return byColumnId

  // Se não, acha pela coluna que contém o card com esse id
  return columns.find(c => c.cards?.some(card => card.id === overId))
}

function findSourceColumn(columns: Column[], cardId: string): Column | undefined {
  return columns.find(c => c.cards?.some(card => card.id === cardId))
}

export function useBoard(boardId: string) {
  const queryClient = useQueryClient()

  const [moveModal, setMoveModal] = useState<MoveModal | null>(null)
  const [observation, setObservation] = useState('')
  const [obsError, setObsError] = useState('')
  const [activeCard, setActiveCard] = useState<Card | null>(null)

  const { data: board, isLoading, isError } = useQuery({
    queryKey: ['board', boardId],
    queryFn: () => boardsService.get(boardId),
    enabled: !!boardId,
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
    },
    onError: (error: { response?: { data?: { error?: { message?: string } } } }) => {
      setObsError(error?.response?.data?.error?.message || 'Erro ao mover card.')
    },
  })

  function handleDragStart(event: DragStartEvent) {
    const allCards = board?.columns?.flatMap((c: Column) => c.cards || []) || []
    setActiveCard(allCards.find((c: Card) => c.id === event.active.id) || null)
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveCard(null)

    if (!over || !board) return

    const columns: Column[] = board.columns || []

    const fromColumn = findSourceColumn(columns, active.id as string)
    const toColumn = findTargetColumn(columns, over.id as string)

    // Mesma coluna ou coluna não encontrada — ignora
    if (!fromColumn || !toColumn || fromColumn.id === toColumn.id) return

    // Card arquivado não pode ser movido
    const draggedCard = fromColumn.cards?.find((c: Card) => c.id === active.id)
    if (draggedCard?.is_archived) return

    // Verificar WIP limit
    const activeCardsInTarget = toColumn.cards?.filter((c: Card) => !c.is_archived) || []
    if (
      toColumn.wip_limit !== null &&
      toColumn.wip_limit !== undefined &&
      activeCardsInTarget.length >= toColumn.wip_limit
    ) {
      setObsError(`Limite WIP atingido na coluna "${toColumn.name}" (${toColumn.wip_limit} cards)`)
      setTimeout(() => setObsError(''), 5000)
      return
    }

    // Abrir modal de observação
    setMoveModal({
      cardId: active.id as string,
      fromColumn: fromColumn.name,
      toColumnId: toColumn.id,
      toColumnName: toColumn.name,
    })
  }

  function handleConfirmMove() {
    if (!observation || observation.trim().length < 10) {
      setObsError('A observação deve ter no mínimo 10 caracteres.')
      return
    }
    if (!moveModal) return
    moveMutation.mutate({
      cardId: moveModal.cardId,
      targetColumnId: moveModal.toColumnId,
      observation: observation.trim(),
    })
  }

  function closeMoveModal() {
    setMoveModal(null)
    setObservation('')
    setObsError('')
  }

  return {
    board,
    isLoading,
    isError,
    activeCard,
    moveModal,
    observation,
    obsError,
    moveMutation,
    setObservation,
    setObsError,
    handleDragStart,
    handleDragEnd,
    handleConfirmMove,
    closeMoveModal,
  }
}