const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

export function getToken() { return localStorage.getItem('nb_token') }
export function setToken(token: string | null) {
  if (token) localStorage.setItem('nb_token', token)
  else localStorage.removeItem('nb_token')
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers = new Headers(options.headers)
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers })
  if (response.status === 204) return undefined as T
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body.detail || 'Có lỗi xảy ra. Vui lòng thử lại.')
  return body as T
}

/* ── Types ── */
export type User = {
  id: number
  email: string
  display_name: string
  bio: string
  created_at: string
}

export type Memory = {
  id: number
  title: string
  content: string
  occurred_at: string | null
  visibility: 'private' | 'public'
  created_at: string
  updated_at: string | null
}

export type Reflection = {
  id: number
  situation: string
  feelings: string
  lesson: string
  closure_note: string
  created_at: string
  updated_at: string | null
}

export type Goal = {
  id: number
  title: string
  description: string
  target_date: string | null
  status: 'planned' | 'in_progress' | 'completed'
  created_at: string
  updated_at: string | null
}

export type FeedItem = {
  id: number
  title: string
  content: string
  occurred_at: string | null
  created_at: string
  author: string
}

export type DashboardStats = {
  total_memories: number
  total_reflections: number
  total_goals: number
  goals_completed: number
  goals_in_progress: number
  recent_memory_title: string | null
  days_since_joined: number
}

export type ProfileUpdate = {
  display_name?: string
  bio?: string
}

export type ChangePasswordPayload = {
  current_password: string
  new_password: string
}

/* ── Friends Types ── */

export type FriendUser = {
  id: number
  email: string
  display_name: string
  bio: string
  created_at: string
}

export type FriendRequest = {
  id: number
  status: string
  created_at: string
  sender: FriendUser
  receiver: FriendUser
}

export type FriendAction = {
  detail: string
}

/* ── API helpers ── */
export const fetchProfile = () => api<User>('/profile')
export const updateProfile = (data: ProfileUpdate) =>
  api<User>('/profile', { method: 'PATCH', body: JSON.stringify(data) })
export const changePassword = (data: ChangePasswordPayload) =>
  api<void>('/auth/change-password', { method: 'POST', body: JSON.stringify(data) })
export const fetchDashboardStats = () => api<DashboardStats>('/stats/dashboard')
export type ForgotPasswordPayload = {
  email: string
  new_password: string
}

export const forgotPassword = (data: ForgotPasswordPayload) =>
  api<{ detail: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(data)
  })

  /* ── Friends API ── */

// Lấy danh sách bạn bè
export const fetchFriends = () =>
  api<FriendUser[]>('/friends')

// Lấy lời mời kết bạn nhận được
export const fetchFriendRequests = () =>
  api<FriendRequest[]>('/friends/requests')

// Lấy lời mời kết bạn đã gửi
export const fetchSentFriendRequests = () =>
  api<FriendRequest[]>('/friends/sent')

// Lấy danh sách người có thể kết bạn
export const fetchFriendSuggestions = () =>
  api<FriendUser[]>('/friends/suggestions')

// Gửi lời mời kết bạn
export const sendFriendRequest = (userId: number) =>
  api<FriendAction>(`/friends/requests/${userId}`, {
    method: 'POST'
  })

// Chấp nhận lời mời kết bạn
export const acceptFriendRequest = (requestId: number) =>
  api<FriendAction>(`/friends/requests/${requestId}/accept`, {
    method: 'POST'
  })

// Từ chối hoặc hủy lời mời kết bạn
export const deleteFriendRequest = (requestId: number) =>
  api<FriendAction>(`/friends/requests/${requestId}`, {
    method: 'DELETE'
  })

// Hủy kết bạn
export const removeFriend = (userId: number) =>
  api<FriendAction>(`/friends/${userId}`, {
    method: 'DELETE'
  })