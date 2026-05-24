const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

async function request(path, options = {}) {
  const { headers: extraHeaders, ...restOptions } = options
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    ...restOptions,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error(`[authService] ${path} failed:`, res.status, data)
    throw new Error(data.detail || data.message || 'Something went wrong')
  }
  return data
}

export const authService = {
  login: (email, password) => {
    const params = new URLSearchParams()
    params.append('username', email)
    params.append('password', password)
    return request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })
  },

  register: (payload) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifyOtp: (email, otp_code) =>
    request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp_code }),
    }),

  me: (token) =>
    request('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  forgotPassword: (email) =>
    request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (payload) =>
    request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateProfile: (userId, payload, token) =>
    request(`/api/users/${userId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),

  getTrainingRecords: (userId, token) =>
    request(`/api/training-records/employee/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  addTrainingRecord: (payload, token) =>
    request('/api/training-records/', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),

  deleteTrainingRecord: (recordId, token) =>
    request(`/api/training-records/${recordId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateTrainingRecord: (recordId, payload, token) =>
    request(`/api/training-records/${recordId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),

  getDevelopmentPlans: (userId, token) =>
    request(`/api/development-plans/employee/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  addDevelopmentPlan: (payload, token) =>
    request('/api/development-plans/', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),

  deleteDevelopmentPlan: (planId, token) =>
    request(`/api/development-plans/${planId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateDevelopmentPlan: (planId, payload, token) =>
    request(`/api/development-plans/${planId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }),
}