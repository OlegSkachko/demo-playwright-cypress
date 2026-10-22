const TOKEN_KEY = 'lumen.token'

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export const setToken = (token) => {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Token ${token}`

  const res = await fetch(`/api${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })

  // Протухший токен: разлогиниваем и повторяем запрос как гость
  if (res.status === 401 && token) {
    setToken(null)
    window.dispatchEvent(new Event('lumen:session-expired'))
    return api(path, { method, body })
  }
  if (res.status === 204) return null

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(data.detail || 'Ошибка сервера', res.status)
  return data
}
