'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AxiosError } from 'axios'
import { authService } from '../../../services/auth'
import { useAuthStore } from '../../../store/auth'
import { ApiError } from '../../../types'

export default function LoginPage() {
  const router = useRouter()
  const { setUser, setAuthenticated } = useAuthStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await authService.login({ username, password })
      setUser(data.user)
      setAuthenticated(true)
      router.push('/boards')
    } catch (err) {
      const error = err as AxiosError<ApiError>
      if (error.response?.status === 403) {
        setError('Sua conta esta inativa. Fale com o administrador.')
      } else if (error.response?.status === 401) {
        setError('Usuario ou senha incorretos. Tente novamente.')
      } else {
        setError('Erro ao conectar. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  const formContent = (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#5F5E5A', marginBottom: '6px' }}>
          Usuario
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Digite seu usuario"
          required
          style={{
            width: '100%', padding: '10px 14px', fontSize: '13px',
            border: '1px solid #D3D1C7', borderRadius: '8px',
            outline: 'none', backgroundColor: '#FFFFFF', color: '#1C1C1B',
            boxSizing: 'border-box',
          }}
        />
      </div>
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#5F5E5A', marginBottom: '6px' }}>
          Senha
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="********"
          required
          style={{
            width: '100%', padding: '10px 14px', fontSize: '13px',
            border: '1px solid #D3D1C7', borderRadius: '8px',
            outline: 'none', backgroundColor: '#FFFFFF', color: '#1C1C1B',
            boxSizing: 'border-box',
          }}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%', padding: '12px', fontSize: '14px', fontWeight: '500',
          backgroundColor: loading ? '#444441' : '#1C1C1B',
          color: loading ? '#B4B2A9' : '#FFFFFF',
          border: 'none', borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  )

  const errorAlert = error ? (
    <div style={{
      backgroundColor: '#FCEBEB', border: '1px solid #F09595',
      borderRadius: '8px', padding: '12px 14px', marginBottom: '20px',
      display: 'flex', alignItems: 'flex-start', gap: '8px',
    }}>
      <div style={{
        width: '16px', height: '16px', backgroundColor: '#E24B4A',
        borderRadius: '50%', display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: '#FFFFFF', fontSize: '10px',
        fontWeight: '700', flexShrink: 0, marginTop: '1px',
      }}>!</div>
      <span style={{ fontSize: '13px', color: '#A32D2D' }}>{error}</span>
    </div>
  ) : null

  return (
    <>
      {/* Desktop */}
      <div className="desktop-login" style={{
        minHeight: '100vh', backgroundColor: '#F5F5F4',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{
            backgroundColor: '#FFFFFF', border: '1px solid #D3D1C7',
            borderRadius: '12px', padding: '32px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div style={{
                width: '32px', height: '32px', backgroundColor: '#1C1C1B',
                borderRadius: '8px', display: 'grid',
                gridTemplateColumns: '1fr 1fr', gap: '3px', padding: '7px', flexShrink: 0,
              }}>
                {[0,1,2,3].map(i => (
                  <div key={i} style={{ backgroundColor: '#FFFFFF', borderRadius: '1px' }} />
                ))}
              </div>
              <span style={{ fontSize: '18px', fontWeight: '600', color: '#1C1C1B' }}>Kanban</span>
            </div>
            <p style={{ fontSize: '13px', color: '#888780', margin: '0 0 20px' }}>
              Entre com sua conta para continuar
            </p>
            <div style={{ height: '1px', backgroundColor: '#EBEBEA', marginBottom: '24px' }} />
            {errorAlert}
            {formContent}
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="mobile-login" style={{
        minHeight: '100vh', backgroundColor: '#F5F5F4',
        display: 'none', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '48px', height: '48px', backgroundColor: '#1C1C1B',
            borderRadius: '12px', display: 'grid',
            gridTemplateColumns: '1fr 1fr', gap: '4px',
            padding: '10px', margin: '0 auto 12px',
          }}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{ backgroundColor: '#FFFFFF', borderRadius: '2px' }} />
            ))}
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#1C1C1B' }}>Kanban</h1>
          <p style={{ fontSize: '13px', color: '#888780', marginTop: '4px' }}>
            Entre com sua conta para continuar
          </p>
        </div>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{
            backgroundColor: '#FFFFFF', border: '1px solid #D3D1C7',
            borderRadius: '12px', padding: '32px',
          }}>
            {errorAlert}
            {formContent}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .desktop-login { display: none !important; }
          .mobile-login { display: flex !important; }
        }
      `}</style>
    </>
  )
}