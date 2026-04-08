'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { DndContext, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core'
import { Activity, ArrowLeft, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useBoard } from '@/hooks/useBoard'
import { KanbanColumn } from '@/components/kanban/KanbanColumn'
import { Avatar } from '@/components/ui/Avatar'
import CreateCardModal from '@/components/modals/CreateCardModal'
import CardDetailModal from '@/components/modals/CardDetailModal'
import { authService } from '@/services/auth'
import { Column, Card } from '@/types'

export default function BoardPage() {
    const router = useRouter()
    const params = useParams()
    const boardId = params.id as string
    const { user } = useAuth()

    const {
        board, isLoading, isError,
        activeCard, moveModal, observation, obsError, moveMutation,
        setObservation, setObsError,
        handleDragStart, handleDragEnd, handleConfirmMove, closeMoveModal,
    } = useBoard(boardId)

    const [activeTabIndex, setActiveTabIndex] = useState(0)
    const [createCardModal, setCreateCardModal] = useState<{ columnId: string; columnName: string } | null>(null)
    const [detailCardId, setDetailCardId] = useState<string | null>(null)

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

    function handleOpenCard(cardId: string) {
        if (activeCard) return
        setDetailCardId(cardId)
    }

    function handleOpenAddCard(columnId: string) {
        const col = board?.columns?.find((c: Column) => c.id === columnId)
        if (col) setCreateCardModal({ columnId, columnName: col.name })
    }

    function handleLogout() {
        authService.logout().finally(() => router.push('/login'))
    }

    const permission = board?.my_permission || 'viewer'
    const columns: Column[] = board?.columns || []
    const activeColumn = columns[activeTabIndex] || columns[0]

    if (isLoading) return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
                {[1, 2, 3].map(i => <div key={i} style={{ width: '260px', backgroundColor: '#EBEBEA', borderRadius: '10px', height: '300px' }} />)}
            </div>
        </div>
    )

    if (isError) return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div
                style={{
                    backgroundColor: '#FCEBEB',
                    border: '1px solid #F09595',
                    borderRadius: '8px',
                    padding: '16px',
                    color: '#A32D2D'
                }}
            >
                Erro ao carregar o board.
            </div>
        </div>
    )

    return (
        <>
            {/* desktop */}
            <div
                className="board-desktop"
                style={{ minHeight: '100vh', backgroundColor: '#F5F5F4', display: 'flex' }}>
                <div
                    style={{
                        width: '220px',
                        backgroundColor: '#1C1C1B',
                        minHeight: '100vh',
                        padding: '24px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        flexShrink: 0
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', marginBottom: '16px' }}>
                        <div
                            style={{
                                width: '24px',
                                height: '24px',
                                backgroundColor: '#FFFFFF',
                                borderRadius: '6px',
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '3px',
                                padding: '5px'
                            }}
                        >
                            {[0, 1, 2, 3].map(i => <div key={i} style={{ backgroundColor: '#1C1C1B', borderRadius: '1px' }} />)}
                        </div>
                        <span style={{ fontSize: '15px', fontWeight: '600', color: '#FFFFFF' }}>
                            Kanban
                        </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#5F5E5A', padding: '8px 10px 4px', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                        Boards
                    </div>
                    <div
                        onClick={() => router.push('/boards')}
                        style={{
                            padding: '8px 10px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            color: '#888780',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <ArrowLeft size={13} /> Voltar
                    </div>
                    <div
                        style={{
                            padding: '8px 10px',
                            borderRadius: '6px',
                            fontSize: '13px',
                            backgroundColor: '#2C2C2A',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#378ADD' }} />
                        {board?.name}
                    </div>
                    <div style={{ marginTop: 'auto', borderTop: '1px solid #2C2C2A', paddingTop: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px' }}>
                            <Avatar username={user?.username} size={28} fontSize={11} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '13px', color: '#FFFFFF', fontWeight: '500' }}>
                                    {user?.username}
                                </div>
                                <div style={{ fontSize: '11px', color: '#5F5E5A' }}>
                                    {user?.role}
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                                <LogOut size={14} color="#5F5E5A" />
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div
                        style={{
                            backgroundColor: '#FFFFFF',
                            borderBottom: '1px solid #D3D1C7',
                            padding: '0 24px',
                            height: '56px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexShrink: 0
                        }}
                    >
                        <span style={{ fontSize: '16px', fontWeight: '600', color: '#1C1C1B' }}>
                            {board?.name}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {permission === 'viewer' && <span
                                style={{
                                    fontSize: '11px',
                                    padding: '3px 8px',
                                    borderRadius: '20px',
                                    backgroundColor: '#F1EFE8',
                                    color: '#5F5E5A',
                                    fontWeight: '500'
                                }}
                            >
                                Modo visualização
                            </span>}
                            <button
                                onClick={() => router.push(`/boards/${boardId}/activity`)}
                                style={{
                                    padding: '6px 12px',
                                    fontSize: '12px',
                                    color: '#5F5E5A',
                                    backgroundColor: '#FFFFFF',
                                    border: '1px solid #D3D1C7',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Activity size={13} /> Feed de Atividade
                            </button>
                        </div>
                    </div>
                    {obsError && !moveModal && <div
                        style={{
                            margin: '12px 24px 0',
                            padding: '10px 14px',
                            backgroundColor: '#FCEBEB',
                            border: '1px solid #F09595',
                            borderRadius: '8px',
                            fontSize: '13px',
                            color: '#A32D2D'
                        }}
                    >
                        {obsError}
                    </div>}
                    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                        <div style={{ flex: 1, padding: '24px', display: 'flex', gap: '16px', overflowX: 'auto', alignItems: 'flex-start' }}>
                            {columns.map((column: Column) => (
                                <KanbanColumn
                                    key={column.id}
                                    column={column}
                                    permission={permission}
                                    onAddCard={handleOpenAddCard}
                                    onOpenCard={handleOpenCard}
                                    mobile={true}
                                />
                            ))}
                        </div>
                        <DragOverlay>
                            {activeCard && <div
                                style={{
                                    backgroundColor: '#FFFFFF',
                                    border: '2px dashed #378ADD',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    width: '260px',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    color: '#1C1C1B',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                }}
                            >
                                {activeCard.title}
                            </div>}
                        </DragOverlay>
                    </DndContext>
                </div>
            </div>

            {/* mobile */}
            <div
                className="board-mobile"
                style={{ minHeight: '100vh', backgroundColor: '#F5F5F4', display: 'flex', flexDirection: 'column' }}>
                <div
                    style={{
                        backgroundColor: '#1C1C1B',
                        padding: '0 16px',
                        height: '52px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexShrink: 0
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                            onClick={() => router.push('/boards')}
                            style={{ background: 'none', border: 'none', color: '#888780', cursor: 'pointer', fontSize: '18px' }}>
                            <ArrowLeft size={13} />
                        </button>
                        <span style={{ fontSize: '15px', fontWeight: '600', color: '#FFFFFF' }}>{board?.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                            onClick={() => router.push(`/boards/${boardId}/activity`)}
                            style={{
                                background: 'none',
                                border: '1px solid #2C2C2A',
                                borderRadius: '6px',
                                color: '#888780',
                                cursor: 'pointer',
                                fontSize: '11px',
                                padding: '5px 10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                        >
                            <Activity size={11} /> Atividade
                        </button>
                        <Avatar username={user?.username} size={30} fontSize={11} />
                    </div>
                </div>

                {columns.length > 0 && (
                    <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #D3D1C7', display: 'flex', overflowX: 'auto', flexShrink: 0, scrollbarWidth: 'none' }}>
                        {columns.map((col: Column, idx: number) => {
                            const ac = col.cards?.filter(c => !c.is_archived) || []
                            const isActive = idx === activeTabIndex
                            return (
                                <button
                                    key={col.id}
                                    onClick={() => setActiveTabIndex(idx)}
                                    style={{
                                        padding: '12px 16px',
                                        fontSize: '13px',
                                        fontWeight: isActive ? '600' : '400',
                                        color: isActive ? '#1C1C1B' : '#888780',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        borderBottom: isActive ? '2px solid #1C1C1B' : '2px solid transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    {col.name}
                                    <span
                                        style={{
                                            fontSize: '11px',
                                            padding: '1px 6px',
                                            borderRadius: '20px',
                                            fontWeight: '500',
                                            backgroundColor: isActive ? '#1C1C1B' : '#EBEBEA',
                                            color: isActive ? '#FFFFFF' : '#888780'
                                        }}>
                                        {ac.length}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                )}

                {obsError && !moveModal && <div
                    style={{
                        margin: '10px 16px 0',
                        padding: '10px 14px',
                        backgroundColor: '#FCEBEB',
                        border: '1px solid #F09595',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#A32D2D'
                    }}
                >
                    {obsError}
                </div>}

                {activeColumn && (
                    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                        <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <KanbanColumn
                                column={activeColumn}
                                permission={permission}
                                onAddCard={handleOpenAddCard}
                                onOpenCard={handleOpenCard}
                                mobile={true}
                            />
                        </div>
                        <DragOverlay>
                            {activeCard && (
                                <div style={{
                                    backgroundColor: '#FFFFFF',
                                    border: '2px dashed #378ADD',
                                    borderRadius: '8px',
                                    padding: '12px',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    color: '#1C1C1B'
                                }}>
                                    {activeCard.title}
                                </div>
                            )}
                        </DragOverlay>
                    </DndContext>
                )}

                {permission !== 'viewer' && (
                    <button
                        onClick={() => { if (activeColumn) setCreateCardModal({ columnId: activeColumn.id, columnName: activeColumn.name }) }}
                        style={{
                            position: 'fixed',
                            bottom: '24px',
                            right: '20px',
                            width: '52px',
                            height: '52px',
                            borderRadius: '16px',
                            backgroundColor: '#1C1C1B',
                            color: '#FFFFFF',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
                        }}
                    >
                        +
                    </button>
                )}
            </div>

            <style>{`
        .board-desktop { display: flex !important; }
        .board-mobile { display: none !important; }
        @media (max-width: 767px) {
          .board-desktop { display: none !important; }
          .board-mobile { display: flex !important; }
        }
      `}</style>

            {moveModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(28,28,27,0.45)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '24px'
                    }}
                >
                    <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', width: '100%', maxWidth: '480px', overflow: 'hidden' }}>
                        <div
                            style={{
                                padding: '20px 24px 16px',
                                borderBottom: '1px solid #EBEBEA',
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'space-between'
                            }}
                        >
                            <div>
                                <div style={{ fontSize: '15px', fontWeight: '600', color: '#1C1C1B' }}>
                                    Mover card
                                </div>
                                <div style={{ fontSize: '12px', color: '#888780', marginTop: '2px' }}>
                                    {board?.columns?.flatMap((c: Column) => c.cards || []).find((c: Card) => c.id === moveModal.cardId)?.title}
                                </div>
                            </div>
                            <button
                                onClick={closeMoveModal}
                                style={{
                                    width: '28px',
                                    height: '28px',
                                    backgroundColor: '#F5F5F4',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    color: '#5F5E5A'
                                }}>
                                ✕
                            </button>
                        </div>
                        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ backgroundColor: '#F5F5F4', borderRadius: '8px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span
                                    style={{
                                        backgroundColor: '#EBEBEA',
                                        borderRadius: '4px',
                                        padding: '2px 8px',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        color: '#1C1C1B'
                                    }}
                                >
                                    {moveModal.fromColumn}
                                </span>
                                <span style={{ color: '#888780' }}>→</span>
                                <span
                                    style={{
                                        backgroundColor: '#E6F1FB',
                                        borderRadius: '4px',
                                        padding: '2px 8px',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        color: '#185FA5'
                                    }}
                                >
                                    {moveModal.toColumnName}
                                </span>
                            </div>
                            <div>
                                <label
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        color: '#5F5E5A',
                                        marginBottom: '6px'
                                    }}
                                >
                                    Observação <span style={{ color: '#E24B4A' }}>*</span>
                                </label>
                                <textarea value={observation} onChange={e => { setObservation(e.target.value); setObsError('') }}
                                    placeholder="Descreva o motivo da movimentação (mínimo 10 caracteres)..." rows={3}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        fontSize: '13px',
                                        border: `1px solid ${obsError ? '#E24B4A' : '#D3D1C7'}`,
                                        borderRadius: '8px',
                                        outline: 'none',
                                        resize: 'none',
                                        backgroundColor: obsError ? '#FFFAFA' : '#FFFFFF',
                                        color: '#1C1C1B',
                                        fontFamily: 'inherit',
                                        boxSizing: 'border-box'
                                    }}
                                />
                                {obsError && <div style={{ fontSize: '11px', color: '#A32D2D', marginTop: '4px' }}>
                                    ✕ {obsError}
                                </div>}
                                <div style={{ fontSize: '11px', textAlign: 'right', marginTop: '4px', color: observation.length >= 10 ? '#3B6D11' : '#888780' }}>
                                    {observation.length} / 10 mínimos {observation.length >= 10 ? '✓' : ''}
                                </div>
                            </div>
                        </div>
                        <div style={{ padding: '16px 24px', borderTop: '1px solid #EBEBEA', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button onClick={closeMoveModal}
                                style={{
                                    padding: '10px 20px',
                                    fontSize: '13px',
                                    color: '#5F5E5A',
                                    backgroundColor: '#FFFFFF',
                                    border: '1px solid #D3D1C7',
                                    borderRadius: '8px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancelar
                            </button>
                            <button onClick={handleConfirmMove} disabled={observation.length < 10 || moveMutation.isPending}
                                style={{
                                    padding: '10px 20px',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    backgroundColor: observation.length >= 10 ? '#1C1C1B' : '#D3D1C7',
                                    color: observation.length >= 10 ? '#FFFFFF' : '#888780',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: observation.length >= 10 ? 'pointer' : 'not-allowed'
                                }}
                            >
                                {moveMutation.isPending ? 'Movendo...' : 'Confirmar movimentação'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {createCardModal && <CreateCardModal boardId={boardId} columnId={createCardModal.columnId} columnName={createCardModal.columnName} onClose={() => setCreateCardModal(null)} />}
            {detailCardId && <CardDetailModal cardId={detailCardId} boardId={boardId} permission={permission} onClose={() => setDetailCardId(null)} />}
        </>
    )
}