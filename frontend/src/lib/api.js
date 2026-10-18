import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:4000',
  withCredentials: true
})

let csrfToken
let csrfTokenRequest

api.interceptors.request.use(async config => {
  const method = (config.method || 'get').toLowerCase()
  if (!['get', 'head', 'options'].includes(method)) {
    if (!csrfToken) {
      csrfTokenRequest ||= api.get('/api/auth/csrf').then(({ data }) => {
        csrfToken = data.csrfToken
        return csrfToken
      }).finally(() => { csrfTokenRequest = null })
      await csrfTokenRequest
    }
    config.headers['X-CSRF-Token'] = csrfToken
  }
  return config
})

export default api
