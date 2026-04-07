'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cardsService } from '@/services/cards'
import { CardHistory } from '@/types'

interface CardDetailModalProps {
    cardId: string
    boardId: string
    permission: string
    onClose: () => void
}

function getPriorityColor(priority: string) {
    if (priority === 'critical') return { dot: '#E24B4A', text: '#A32D2D', bg: '#FCEBEB' }
    if (priority === 'high') return { dot: '#BA7517', text: '#854F0B', bg: '#FAEEDA' }
    if (priority === 'medium') return { dot: '#378ADD', text: '#185FA5', bg: '#E6F1FB' }
    return { dot: '#888780', text: '#5F5E5A', bg: '#F1EFE8' }
}

function getActionLabel(action: string) {
    const labels: Record<string, string> = {
        moved: 'moveu o card',
        created: 'criou o card',
        commented: 'comentou',
        edited: 'editou o card',
        archived: 'arquivou o card',
        assigned: 'atribuiu o card',
        unassigned: 'removeu atribuição',
        priority_changed: 'alterou a prioridade',
        due_date_changed: 'alterou a data limite',
    }
    return labels[action] || action
}

function getAvatarColor(username: string) {
    const colors = ['#378ADD', '#639922', '#BA7517', '#E24B4A', '#534AB7', '#0F6E56']
    return colors[username.charCodeAt(0) % colors.length]
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

function formatDateShort(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function CardDetailModal({ cardId, boardId, permission, onClose }: CardDetailModalProps) {
    const queryClient = useQueryClient()
    const [comment, setComment] = useState('')
    const [commentError, setCommentError] = useState('')
    const [activeTab, setActiveTab] = useState<'details' | 'history'>('details')

    const { data: card, isLoading: cardLoading } = useQuery({
        queryKey: ['card', cardId],
        queryFn: () => cardsService.get(cardId),
    })

    const { data: history, isLoading: historyLoading } = useQuery({
        queryKey: ['card-history', cardId],
        queryFn: () => cardsService.getHistory(cardId, 1),
        enabled: activeTab === 'history',
    })

    const commentMutation = useMutation({
        mutationFn: () => cardsService.comment(cardId, comment.trim()),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['card-history', cardId] })
            queryClient.invalidateQueries({ queryKey: ['activity', boardId] })
            setComment('')
            setCommentError('')
            setActiveTab('history')
        },
        onError: (err: { response?: { data?: { error?: { message?: string } } } }) => {
            setCommentError(err?.response?.data?.error?.message || 'Erro ao comentar.')
        },
    })

    const archiveMutation = useMutation({
        mutationFn: () => cardsService.archive(cardId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['board', boardId] })
            onClose()
        },
    })

    function handleComment() {
        if (!comment.trim()) { setCommentError('O comentário não pode estar vazio.'); return }
        setCommentError('')
        commentMutation.mutate()
    }

    const pColor = card ? getPriorityColor(card.priority) : getPriorityColor('low')

    const historyItems: CardHistory[] = history?.items
        ? [...history.items].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        : []

    function CommentBox({ rows }: { rows: number }) {
        return (
            <div>
                <textarea
                    value={comment}
                    onChange={e => { setComment(e.target.value); setCommentError('') }}
                    placeholder="Adicionar comentário..."
                    rows={rows}
                    style={{
                        width: '100%', padding: '10px 14px', fontSize: '13px',
                        border: `1px solid ${commentError ? '#E24B4A' : '#D3D1C7'}`,
                        borderRadius: '8px', outline: 'none', resize: 'none',
                        color: '#1C1C1B', fontFamily: 'inherit', boxSizing: 'border-box',
                        backgroundColor: commentError ? '#FFFAFA' : '#FFFFFF',
                    }}
                />
                {commentError && <div style={{ fontSize: '11px', color: '#A32D2D', marginTop: '4px' }}>✕ {commentError}</div>}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button
                        onClick={handleComment}
                        disabled={!comment.trim() || commentMutation.isPending}
                        style={{
                            padding: '8px 18px', fontSize: '12px', fontWeight: '500',
                            backgroundColor: comment.trim() ? '#1C1C1B' : '#D3D1C7',
                            color: comment.trim() ? '#FFFFFF' : '#888780',
                            border: 'none', borderRadius: '6px',
                            cursor: comment.trim() ? 'pointer' : 'not-allowed',
                        }}
                    >
                        {commentMutation.isPending ? 'Enviando...' : 'Comentar'}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(28,28,27,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '16px',
        }}>
            <div style={{
                backgroundColor: '#FFFFFF', borderRadius: '12px',
                width: '100%', maxWidth: '600px',
                maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
            }}>

                {/* Skeleton loading */}
                {cardLoading && (
                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{
                            height: '18px', backgroundColor: '#EBEBEA', borderRadius: '4px', width: '70%'
                        }} />
                        <div style={{ height: '14px', backgroundColor: '#EBEBEA', borderRadius: '4px', width: '40%' }} />
                    </div>
                )}

                {/* Header */}
                {!cardLoading && card && (
                    <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <div style={{ flex: 1, marginRight: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '11px', color: '#888780' }}>{card.column?.name ?? '—'}</span>
                                    {card.is_archived && (
                                        <span style={{
                                            fontSize: '10px',
                                            padding: '1px 7px',
                                            borderRadius: '20px',
                                            backgroundColor: '#F1EFE8',
                                            color: '#5F5E5A',
                                            fontWeight: '500'
                                        }}
                                        >
                                            arquivado
                                        </span>
                                    )}
                                </div>
                                <h2 style={{ fontSize: '17px', fontWeight: '600', color: '#1C1C1B', margin: 0, lineHeight: '1.4' }}>
                                    {card.title}
                                </h2>
                            </div>
                            <button onClick={onClose}
                                style={{
                                    width: '28px',
                                    height: '28px',
                                    backgroundColor: '#F5F5F4',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    color: '#5F5E5A',
                                    flexShrink: 0
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                            <span
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '11px',
                                    padding: '3px 8px',
                                    borderRadius: '20px',
                                    fontWeight: '500',
                                    backgroundColor: pColor.bg,
                                    color: pColor.text
                                }}
                            >
                                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: pColor.dot, display: 'inline-block' }} />
                                {card.priority}
                            </span>
                            {card.assignee && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <div
                                        style={{
                                            width: '18px',
                                            height: '18px',
                                            borderRadius: '50%',
                                            backgroundColor: getAvatarColor(card.assignee.username),
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '8px',
                                            fontWeight: '600',
                                            color: '#FFFFFF'
                                        }}
                                    >
                                        {card.assignee.username.slice(0, 2).toUpperCase()}
                                    </div>
                                    <span style={{ fontSize: '12px', color: '#5F5E5A' }}>{card.assignee.username}</span>
                                </div>
                            )}
                            {card.due_date && (
                                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '20px', backgroundColor: '#F1EFE8', color: '#5F5E5A', fontWeight: '500' }}>
                                    {formatDateShort(card.due_date)}
                                </span>
                            )}
                            {card.tags?.map((tag, i) => (
                                <span key={i}
                                    style={{
                                        fontSize: '11px',
                                        padding: '3px 8px',
                                        borderRadius: '20px',
                                        fontWeight: '500',
                                        backgroundColor: '#E6F1FB',
                                        color: '#185FA5'
                                    }}
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>

                        <div style={{ display: 'flex', borderBottom: '1px solid #EBEBEA' }}>
                            {(['details', 'history'] as const).map(tab => (
                                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                                    padding: '8px 16px', fontSize: '13px', fontWeight: activeTab === tab ? '600' : '400',
                                    color: activeTab === tab ? '#1C1C1B' : '#888780',
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    borderBottom: activeTab === tab ? '2px solid #1C1C1B' : '2px solid transparent',
                                }}>
                                    {tab === 'details' ? 'Detalhes' : `Histórico${history ? ` (${history.total})` : ''}`}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Body */}
                <div style={{ flex: 1, overflowY: 'auto' }}>

                    {/* TAB DETALHES */}
                    {activeTab === 'details' && card && (
                        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <div style={{
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    color: '#888780',
                                    marginBottom: '8px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '.04em'
                                }}
                                >
                                    Descrição
                                </div>
                                {card.description
                                    ? <p style={{ fontSize: '13px', color: '#1C1C1B', lineHeight: '1.6', margin: 0 }}>
                                        {card.description}
                                    </p>
                                    : <p style={{ fontSize: '13px', color: '#B4B2A9', margin: 0, fontStyle: 'italic' }}>
                                        Sem descrição
                                    </p>
                                }
                            </div>

                            <div style={{
                                backgroundColor: '#F5F5F4',
                                borderRadius: '8px',
                                padding: '14px 16px',
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '12px'
                            }}
                            >
                                <div>
                                    <div style={{ fontSize: '11px', color: '#888780', marginBottom: '4px' }}>
                                        Criado por
                                    </div>
                                    <div style={{ fontSize: '12px', fontWeight: '500', color: '#1C1C1B' }}>
                                        {card.created_by?.username ?? '—'}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#888780', marginBottom: '4px' }}>
                                        Criado em
                                    </div>
                                    <div style={{ fontSize: '12px', fontWeight: '500', color: '#1C1C1B' }}>
                                        {formatDateShort(card.created_at)}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#888780', marginBottom: '4px' }}
                                    >Última atualização
                                    </div>
                                    <div style={{ fontSize: '12px', fontWeight: '500', color: '#1C1C1B' }}>
                                        {formatDate(card.updated_at)}
                                    </div>
                                </div>
                                {card.due_date && (
                                    <div>
                                        <div style={{ fontSize: '11px', color: '#888780', marginBottom: '4px' }}>
                                            Data limite
                                        </div>
                                        <div style={{ fontSize: '12px', fontWeight: '500', color: '#1C1C1B' }}>
                                            {formatDateShort(card.due_date)}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <div style={{ fontSize: '12px', fontWeight: '500', color: '#888780', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.04em' }}>
                                    Adicionar comentário
                                </div>
                                <CommentBox rows={3} />
                            </div>

                            {permission === 'editor' && !card.is_archived && (
                                <div style={{ borderTop: '1px solid #EBEBEA', paddingTop: '16px' }}>
                                    <button
                                        onClick={() => { if (confirm('Arquivar este card?')) archiveMutation.mutate() }}
                                        disabled={archiveMutation.isPending}
                                        style={{
                                            padding: '8px 16px',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                            backgroundColor: '#FFFFFF',
                                            border: '1px solid #F09595',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            color: '#A32D2D'
                                        }}
                                    >
                                        {archiveMutation.isPending ? 'Arquivando...' : '◻ Arquivar card'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB HISTÓRICO */}
                    {activeTab === 'history' && (
                        <div style={{ padding: '20px 24px' }}>
                            {historyLoading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {[1, 2, 3].map(i => (
                                        <div key={i} style={{ display: 'flex', gap: '10px' }}>
                                            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#EBEBEA', flexShrink: 0 }} />
                                            <div style={{ flex: 1 }}>
                                                <div style={{ height: '13px', backgroundColor: '#EBEBEA', borderRadius: '4px', width: '60%', marginBottom: '6px' }} />
                                                <div style={{ height: '11px', backgroundColor: '#EBEBEA', borderRadius: '4px', width: '35%' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : historyItems.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '32px', fontSize: '13px', color: '#888780' }}>
                                    Nenhum histórico ainda
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {historyItems.map((item, index) => (
                                        <div key={item.id}>
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                                <div style={{
                                                    width: '28px',
                                                    height: '28px',
                                                    borderRadius: '50%',
                                                    backgroundColor: getAvatarColor(item.performed_by.username),
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '10px',
                                                    fontWeight: '600',
                                                    color: '#FFFFFF',
                                                    flexShrink: 0
                                                }}
                                                >
                                                    {item.performed_by.username.slice(0, 2).toUpperCase()}
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '13px', color: '#1C1C1B', lineHeight: '1.5' }}>
                                                        <strong>{item.performed_by.username}</strong>{' '}
                                                        <span style={{ color: '#5F5E5A' }}>{getActionLabel(item.action)}</span>
                                                        {item.from_column && item.to_column && (
                                                            <span style={{ color: '#888780', fontSize: '12px' }}>
                                                                ({item.from_column.name} → {item.to_column.name})
                                                            </span>
                                                        )}
                                                    </div>

                                                    {typeof item.observation === 'string' && item.observation.trim() !== '' && (
                                                        <div style={{
                                                            marginTop: '6px',
                                                            padding: '8px 12px',
                                                            backgroundColor: '#F5F5F4',
                                                            borderRadius: '6px',
                                                            fontSize: '12px',
                                                            color: '#5F5E5A',
                                                            lineHeight: '1.5',
                                                            borderLeft: `2px solid ${item.action === 'commented' ? '#378ADD' : '#D3D1C7'}`
                                                        }}
                                                        >
                                                            {item.observation}
                                                        </div>
                                                    )}

                                                    {item.metadata != null && typeof (item.metadata as Record<string, unknown>).field === 'string' && (
                                                        <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#888780' }}>
                                                            <span style={{ backgroundColor: '#EBEBEA', borderRadius: '4px', padding: '1px 6px', fontFamily: 'monospace' }}>
                                                                {String((item.metadata as Record<string, unknown>).from ?? '—')}
                                                            </span>
                                                            <span>→</span>
                                                            <span style={{
                                                                backgroundColor: '#E6F1FB',
                                                                color: '#185FA5',
                                                                borderRadius: '4px',
                                                                padding: '1px 6px',
                                                                fontFamily: 'monospace',
                                                                fontWeight: '500'
                                                            }}
                                                            >
                                                                {String((item.metadata as Record<string, unknown>).to ?? '—')}
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div style={{ fontSize: '11px', color: '#B4B2A9', marginTop: '4px' }}>{formatDate(item.created_at)}</div>
                                                </div>
                                            </div>
                                            {index < historyItems.length - 1 && (
                                                <div style={{ width: '1px', height: '12px', backgroundColor: '#EBEBEA', marginLeft: '13px', marginTop: '4px', marginBottom: '4px' }} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ marginTop: '24px', borderTop: '1px solid #EBEBEA', paddingTop: '16px' }}>
                                <CommentBox rows={2} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}