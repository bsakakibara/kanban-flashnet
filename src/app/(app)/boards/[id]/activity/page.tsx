'use client'

import { useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, LogOut } from 'lucide-react'
import { boardsService } from '@/services/boards'
import { authService } from '@/services/auth'
import { ActivityItem } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { Avatar } from '@/components/ui/Avatar'

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function getActionLabel(action: string) {
    const labels: Record<string, string> = {
        moved: 'moveu',
        created: 'criou',
        commented: 'comentou em',
        edited: 'editou',
        archived: 'arquivou',
        assigned: 'atribuiu',
        priority_changed: 'alterou prioridade de',
        due_date_changed: 'alterou data de',
    }
    return labels[action] || action
}

export default function ActivityPage() {
    const router = useRouter()
    const params = useParams()
    const boardId = params.id as string
    const { user } = useAuth()

    const { data: board } = useQuery({
        queryKey: ['board', boardId],
        queryFn: () => boardsService.get(boardId),
    })

    const { data: activity, isLoading } = useQuery({
        queryKey: ['activity', boardId],
        queryFn: () => boardsService.getActivity(boardId, 50),
    })

    function handleLogout() {
        authService.logout().finally(() => router.push('/login'))
    }

    const feedContent = (
        <>
            {isLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {[1, 2, 3, 4].map(i => (
                        <div
                            key={i}
                            style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#EBEBEA', flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ height: '14px', backgroundColor: '#EBEBEA', borderRadius: '4px', width: '60%', marginBottom: '8px' }} />
                                <div style={{ height: '12px', backgroundColor: '#EBEBEA', borderRadius: '4px', width: '40%' }} />
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {!isLoading && activity?.items?.length === 0 && (
                <div
                    style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px dashed #D3D1C7',
                        borderRadius: '10px',
                        padding: '40px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#1C1C1B' }}>
                        Nenhuma atividade ainda
                    </div>
                    <div style={{ fontSize: '12px', color: '#888780' }}>
                        As ações do board aparecerão aqui
                    </div>
                </div>
            )}
            {!isLoading && activity?.items?.map((item: ActivityItem, index: number) => (
                <div key={item.id}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <Avatar username={item.performed_by.username} size={32} fontSize={11} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '13px', color: '#1C1C1B', lineHeight: '1.5' }}>
                                <strong>{item.performed_by.username}</strong>{' '}
                                {getActionLabel(item.action)}{' '}
                                <span style={{ fontWeight: '500' }}>
                                    {item.card?.title}
                                </span>
                                {item.from_column && item.to_column && (
                                    <span style={{ color: '#888780' }}>
                                        ({item.from_column} → {item.to_column})
                                    </span>
                                )}
                            </div>
                            {item.observation && (
                                <div
                                    style={{
                                        marginTop: '6px',
                                        padding: '8px 12px',
                                        backgroundColor: '#F5F5F4',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        color: '#5F5E5A',
                                        lineHeight: '1.5',
                                        borderLeft: '2px solid #D3D1C7'
                                    }}
                                >
                                    {item.observation}
                                </div>
                            )}
                            <div style={{ fontSize: '11px', color: '#888780', marginTop: '4px' }}>
                                {formatDate(item.created_at)}
                            </div>
                        </div>
                    </div>
                    {index < (activity?.items?.length || 0) - 1 && (
                        <div style={{ width: '1px', height: '16px', backgroundColor: '#D3D1C7', marginLeft: '15px', marginTop: '4px', marginBottom: '4px' }} />
                    )}
                </div>
            ))}
        </>
    )

    return (
        <>
            <div
                className="activity-desktop"
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
                            {[0, 1, 2, 3].map(i => <div
                                key={i}
                                style={{
                                    backgroundColor: '#1C1C1B', borderRadius: '1px'

                                }}
                            />
                            )}
                        </div>
                        <span style={{ fontSize: '15px', fontWeight: '600', color: '#FFFFFF' }}>
                            Kanban
                        </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#5F5E5A', padding: '8px 10px 4px', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                        Boards
                    </div>
                    <div
                        onClick={() => router.push(`/boards/${boardId}`)}
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
                        <ArrowLeft size={14} /> Voltar ao board
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
                                style={{ background: 'none', border: 'none', color: '#5F5E5A', cursor: 'pointer', padding: '4px' }}>
                                <LogOut size={14} color="#5F5E5A" />
                            </button>
                        </div>
                    </div>
                </div>
                <div style={{ flex: 1, padding: '32px', maxWidth: '880px' }}>
                    <div style={{ marginBottom: '24px' }}>
                        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1C1C1B' }}>
                            Feed de Atividade
                        </h1>
                        <p style={{ fontSize: '13px', color: '#888780', marginTop: '4px' }}>
                            Todas as interações do board {board?.name} em ordem cronológica
                        </p>
                    </div>
                    <div style={{ height: '1px', backgroundColor: '#EBEBEA', marginBottom: '24px' }} />
                    {feedContent}
                </div>
            </div>

            <div
                className="activity-mobile"
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
                            onClick={() => router.push(`/boards/${boardId}`)}
                            style={{ background: 'none', border: 'none', color: '#888780', cursor: 'pointer', padding: '4px' }}>
                            <ArrowLeft size={18} color="#888780" />
                        </button>
                        <span style={{ fontSize: '15px', fontWeight: '600', color: '#FFFFFF' }}>
                            Atividade
                        </span>
                    </div>
                    <Avatar username={user?.username} size={30} fontSize={11} />
                </div>
                <div style={{ padding: '16px 16px 8px' }}>
                    <p style={{ fontSize: '12px', color: '#888780', margin: 0 }}>
                        {board?.name} · em ordem cronológica
                    </p>
                </div>
                <div style={{ flex: 1, padding: '0 16px 32px', overflowY: 'auto' }}>
                    {feedContent}
                </div>
            </div>

            <style>{`
        .activity-desktop { display: flex !important; }
        .activity-mobile { display: none !important; }
        @media (max-width: 767px) {
          .activity-desktop { display: none !important; }
          .activity-mobile { display: flex !important; }
        }
      `}</style>
        </>
    )
}