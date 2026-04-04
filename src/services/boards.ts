import { api } from "../lib/api";
import { Board, Column } from "../types";


export const boardsService = {
  async list(): Promise<{ items: Board[]; total: number }> {
    const response = await api.get('/boards')
    return response.data
  },

  async get(id: string): Promise<Board & { columns: Column[] }> {
    const response = await api.get(`/boards/${id}`)
    return response.data
  },

  async create(data: { name: string; description?: string }) {
    const response = await api.post('/boards', data)
    return response.data
  },

  async getActivity(boardId: string, limit = 50) {
    const response = await api.get(`/boards/${boardId}/activity?limit=${limit}`)
    return response.data
  }
}