// src/api/http.js
const API_BASE = 'https://putak-porject-2-1.onrender.com/api'

function authHeaders() {
  const token = localStorage.getItem('pustak-auth-token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers || {}),
    },
  })

  if (!res.ok) {
    let message = 'à¦•à¦¿à¦›à§ à¦à¦•à¦Ÿà¦¾ à¦¸à¦®à¦¸à§à¦¯à¦¾ à¦¹à¦¯à¦¼à§‡à¦›à§‡'
    try {
      const body = await res.json()
      message = body.message || message
    } catch (e) {
      // response wasn't JSON, keep default message
    }
    throw new Error(message)
  }

  if (res.status === 204) return null
  return res.json()
}

export const api = {
  get:    (path)        => request(path),
  post:   (path, body)  => request(path, { method: 'POST',   body: JSON.stringify(body) }),
  patch:  (path, body)  => request(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  put:    (path, body)  => request(path, { method: 'PUT',    body: JSON.stringify(body) }),
  del:    (path, body)  => request(path, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined }),
}

