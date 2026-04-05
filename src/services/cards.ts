import { api } from '@/lib/api'
import { Card, CardHistory } from '@/types'

export const cardsService = {
  async get(id: string): Promise<Card> {
    const response = await api.get(`/cards/${id}`)
    return response.data
  },

  async move(cardId: string, data: {
    target_column_id: string
    position: number
    observation: string
  }) {
    const response = await api.post(`/cards/${cardId}/move`, data)
    return response.data
  },

  async comment(cardId: string, observation: string) {
    const response = await api.post(`/cards/${cardId}/comments`, { observation })
    return response.data
  },

  async getHistory(cardId: string, page = 1): Promise<{
    items: CardHistory[]
    total: number
    page: number
    per_page: number
  }> {
    const response = await api.get(`/cards/${cardId}/history?page=${page}&per_page=20`)
    return response.data
  },

  async create(boardId: string, columnId: string, data: {
    title: string
    description?: string
    priority?: string
    assignee_id?: string
    due_date?: string
    tags?: string[]
  }) {
    const response = await api.post(
      `/boards/${boardId}/columns/${columnId}/cards`,
      data
    )
    return response.data
  },

  async update(cardId: string, data: Partial<Card>) {
    const response = await api.patch(`/cards/${cardId}`, data)
    return response.data
  },

  async archive(cardId: string) {
    const response = await api.delete(`/cards/${cardId}`)
    return response.data
  }
}