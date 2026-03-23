import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/admin'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error.response?.data || error)
)

export const adminApi = {
  // Characters
  getCharacters: (params?: { category?: string; status?: string }) =>
    api.get('/characters', { params }),
  
  createCharacter: (data: any) =>
    api.post('/characters', data),
  
  updateCharacter: (id: string, data: any) =>
    api.put(`/characters/${id}`, data),
  
  deleteCharacter: (id: string) =>
    api.delete(`/characters/${id}`),

  // Users
  getUsers: () =>
    api.get('/users'),
  
  updateUserStatus: (id: string, status: string) =>
    api.put(`/users/${id}/status`, { status }),

  // Events
  getEvents: () =>
    api.get('/events'),
  
  createEvent: (data: any) =>
    api.post('/events', data),
  
  updateEvent: (id: string, data: any) =>
    api.put(`/events/${id}`, data),

  // Stats
  getOverviewStats: () =>
    api.get('/stats/overview'),
  
  getVolumeStats: (params?: { period?: string }) =>
    api.get('/stats/volume', { params }),

  // Config
  getConfig: () =>
    api.get('/config'),
  
  updateConfig: (data: any) =>
    api.put('/config', data),

  // Mining (from miner service)
  getMiningStats: () =>
    api.get('/mining/stats'),
  
  getMiningRecords: (params?: { limit?: number }) =>
    api.get('/mining/records', { params }),
}

export default api
