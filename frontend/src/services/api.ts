import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const url = (error.config?.url as string) ?? ''
      // Don't intercept 401s from the auth endpoints themselves (expected login failures)
      if (!url.includes('/api/auth/')) {
        localStorage.removeItem('token')
        window.dispatchEvent(new CustomEvent('auth:expired'))
        window.location.replace('/login?reason=expired')
      }
    }
    return Promise.reject(error)
  }
)

export default api
