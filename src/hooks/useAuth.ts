import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { authService } from '@/services/auth'
import { useAuthStore } from '@/store/auth'

export function useAuth() {
  const router = useRouter()
  const { user, setUser, setAuthenticated } = useAuthStore()

  useEffect(() => {
    const token = Cookies.get('access_token')
    if (!token) {
      router.push('/login')
      return
    }
    if (!user) {
      authService.me()
        .then(data => {
          setUser(data)
          setAuthenticated(true)
        })
        .catch(() => router.push('/login'))
    }
  }, [])

  return { user }
}