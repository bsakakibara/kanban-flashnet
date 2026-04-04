
import Cookies from 'js-cookie'
import { LoginRequest, LoginResponse } from '../types'
import { api } from '../lib/api'

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', data)
    const { access_token, refresh_token } = response.data
    
    Cookies.set('access_token', access_token, {
      expires: 1/24,
      secure: true,
      sameSite: 'strict'
    })
    Cookies.set('refresh_token', refresh_token, {
      expires: 7,
      secure: true,
      sameSite: 'strict'
    })
    
    return response.data
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout')
    } finally {
      Cookies.remove('access_token')
      Cookies.remove('refresh_token')
    }
  },

  async me() {
    const response = await api.get('/auth/me')
    return response.data
  }
}