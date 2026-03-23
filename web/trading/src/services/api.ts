import axios from 'axios'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error.response?.data || error)
  }
)

// Auth API
export const authApi = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  
  getMe: () =>
    api.get('/auth/me'),
  
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },
}

// Characters API
export const characterApi = {
  list: (params?: { category?: string; status?: string }) =>
    api.get('/characters', { params }),
  
  get: (id: string) =>
    api.get(`/characters/${id}`),
}

// Account API
export const accountApi = {
  getAccount: () =>
    api.get('/account'),
  
  getHoldings: () =>
    api.get('/holdings'),
  
  dailyLogin: () =>
    api.post('/account/daily-login'),
}

// Mining API
export const miningApi = {
  createSession: (characterId: string) =>
    api.post('/mining/session', { character_id: characterId }),
  
  submitNonce: (data: { session_id: string; nonce: string; hash_rate: number }) =>
    api.post('/mining/submit', data),
  
  getStats: () =>
    api.get('/mining/stats'),
}

export default api
