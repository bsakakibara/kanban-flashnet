'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { boardsService } from '../../../services/boards'
import { useAuthStore } from '../../../store/auth'
import { authService } from '../../../services/auth'
import { Board } from '../../../types'
import Cookies from 'js-cookie'

export default function BoardsPage() {
  const router = useRouter()
  const { user, setUser, setAuthenticated } = useAuthStore()

  useEffect(() => {
    const token = Cookies.get('access_token')
    if (!token) { router.push('/login'); return }
    if (!user) {
      authService.me().then((data) => {
        setUser(data)
        setAuthenticated(true)
      }).catch(() => router.push('/login'))
    }
  }, [])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['boards'],
    queryFn: boardsService.list,
  })

  function getPermissionColor(permission: string) {
    if (permission === 'admin') return { bg: '#1C1C1B', text: '#FFFFFF' }
    if (permission === 'editor') return { bg: '#E6F1FB', text: '#185FA5' }
    return { bg: '#F1EFE8', text: '#5F5E5A' }
  }

  function handleLogout() {
    authService.logout().finally(() => router.push('/login'))
  }

  const sidebarContent = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', marginBottom: '16px' }}>
        <div style={{
          width: '24px', height: '24px', backgroundColor: '#FFFFFF',
          borderRadius: '6px', display: 'grid',
          gridTemplateColumns: '1fr 1fr', gap: '3px', padding: '5px',
        }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ backgroundColor: '#1C1C1B', borderRadius: '1px' }} />
          ))}
        </div>
        <span style={{ fontSize: '15px', fontWeight: '600', color: '#FFFFFF' }}>Kanban</span>
      </div>

      <div style={{ fontSize: '11px', color: '#5F5E5A', padding: '8px 10px 4px', textTransform: 'uppercase', letterSpacing: '.06em' }}>
        Boards
      </div>

      {data?.items.map((board: Board) => (
        <div key={board.id} onClick={() => router.push(`/boards/${board.id}`)} style={{
          padding: '8px 10px', borderRadius: '6px', fontSize: '13px',
          color: '#888780', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#378ADD', flexShrink: 0 }} />
          {board.name}
        </div>
      ))}

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
    </>
  )

  const boardsGrid = (
    <>
      {isLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {[1,2,3].map(i => (
            <div key={i} style={{
              backgroundColor: '#FFFFFF', border: '1px solid #D3D1C7',
              borderRadius: '10px', padding: '20px', height: '160px',
            }} />
          ))}
        </div>
      )}

      {isError && (
        <div style={{
          backgroundColor: '#FCEBEB', border: '1px solid #F09595',
          borderRadius: '8px', padding: '16px', color: '#A32D2D', fontSize: '13px',
        }}>
          Erro ao carregar boards. Tente novamente.
        </div>
      )}

      {!isLoading && !isError && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {data?.items.map((board: Board) => {
            const permColor = getPermissionColor(board.my_permission)
            return (
              <div key={board.id} onClick={() => router.push(`/boards/${board.id}`)} style={{
                backgroundColor: '#FFFFFF', border: '1px solid #D3D1C7',
                borderRadius: '10px', padding: '20px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', gap: '12px',
              }}>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#1C1C1B' }}>{board.name}</div>
                {board.description && (
                  <div style={{ fontSize: '12px', color: '#888780', lineHeight: '1.5' }}>{board.description}</div>
                )}
                <div>
                  <span style={{
                    fontSize: '11px', padding: '3px 8px', borderRadius: '20px',
                    fontWeight: '500', backgroundColor: permColor.bg, color: permColor.text,
                  }}>
                    {board.my_permission}
                  </span>
                </div>
                <div style={{ borderTop: '1px solid #EBEBEA', paddingTop: '12px', display: 'flex', gap: '24px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#1C1C1B' }}>{board.cards_count}</div>
                    <div style={{ fontSize: '11px', color: '#888780' }}>cards</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#1C1C1B' }}>{board.members_count}</div>
                    <div style={{ fontSize: '11px', color: '#888780' }}>membros</div>
                  </div>
                </div>
              </div>
            )
          })}

          {data?.items.length === 0 && (
            <div style={{
              backgroundColor: '#FFFFFF', border: '1px dashed #D3D1C7',
              borderRadius: '10px', padding: '40px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
            }}>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#1C1C1B' }}>Nenhum board encontrado</div>
              <div style={{ fontSize: '12px', color: '#888780' }}>Aguarde ser adicionado a um board</div>
            </div>
          )}
        </div>
      )}
    </>
  )

  return (
    <>
      {/* Desktop */}
      <div className="boards-desktop" style={{ minHeight: '100vh', backgroundColor: '#F5F5F4', display: 'flex' }}>
        <div style={{
          width: '220px', backgroundColor: '#1C1C1B', minHeight: '100vh',
          padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0,
        }}>
          {sidebarContent}
        </div>
        <div style={{ flex: 1, padding: '32px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1C1C1B', marginBottom: '24px' }}>Meus Boards</h1>
          {boardsGrid}
        </div>
      </div>

      {/* Mobile */}
      <div className="boards-mobile" style={{ minHeight: '100vh', backgroundColor: '#F5F5F4', display: 'none', flexDirection: 'column' }}>
        <div style={{
          backgroundColor: '#1C1C1B', padding: '12px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '24px', height: '24px', backgroundColor: '#FFFFFF',
              borderRadius: '6px', display: 'grid',
              gridTemplateColumns: '1fr 1fr', gap: '3px', padding: '5px',
            }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ backgroundColor: '#1C1C1B', borderRadius: '1px' }} />
              ))}
            </div>
            <span style={{ fontSize: '15px', fontWeight: '600', color: '#FFFFFF' }}>Kanban</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#378ADD',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: '600', color: '#FFFFFF',
            }}>
              {user?.username?.slice(0, 2).toUpperCase() || 'US'}
            </div>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#888780', cursor: 'pointer', fontSize: '12px' }}>
              Sair
            </button>
          </div>
        </div>
        <div style={{ padding: '20px 16px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#1C1C1B', marginBottom: '16px' }}>Meus Boards</h1>
          {boardsGrid}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .boards-desktop { display: none !important; }
          .boards-mobile { display: flex !important; }
        }
      `}</style>
    </>
  )
}