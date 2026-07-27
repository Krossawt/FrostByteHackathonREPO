/**
 * eSKala — API Client & Integration Service
 * Connects the frontend to the FastAPI REST backend with JWT authentication.
 */

import type { UserAccount, ReportProject, NewsItem } from '../types'

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api/v1'
const TOKEN_KEY = 'eskala_access_token'

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string | null, remember = false): void {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
  } else if (remember) {
    localStorage.setItem(TOKEN_KEY, token)
    sessionStorage.removeItem(TOKEN_KEY)
  } else {
    sessionStorage.setItem(TOKEN_KEY, token)
    localStorage.removeItem(TOKEN_KEY)
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`
    try {
      const errJson = await response.json()
      if (errJson.detail) {
        errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail)
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorDetail)
  }

  return response.json() as Promise<T>
}

// ─── AUTH ENDPOINTS ─────────────────────────────────────────────────────────

export interface LoginPayload {
  credential: string
  password: string
  rememberMe?: boolean
}

export interface AuthResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
  user: UserAccount
}

export async function loginApi(credential: string, password: string, rememberMe = false): Promise<AuthResponse> {
  const res = await request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ credential, password, rememberMe }),
  })
  setStoredToken(res.accessToken, rememberMe)
  return res
}

export async function registerApi(
  userName: string,
  userEmail: string,
  password: string,
  userLocation: string,
  userIsStaRosa = true
): Promise<AuthResponse> {
  const res = await request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ userName, userEmail, password, userLocation, userIsStaRosa }),
  })
  setStoredToken(res.accessToken, true)
  return res
}

export async function getCurrentUserApi(): Promise<UserAccount> {
  return request<UserAccount>('/auth/me')
}

// ─── PROJECTS ENDPOINTS ─────────────────────────────────────────────────────

export async function fetchProjectsApi(params?: {
  barangay?: string
  status?: string
  search?: string
  category?: string
}): Promise<ReportProject[]> {
  const query = new URLSearchParams()
  if (params?.barangay) query.append('barangay', params.barangay)
  if (params?.status) query.append('status', params.status)
  if (params?.search) query.append('search', params.search)
  if (params?.category) query.append('category', params.category)

  const queryString = query.toString() ? `?${query.toString()}` : ''
  return request<ReportProject[]>(`/projects${queryString}`)
}

export async function createProjectApi(payload: {
  projectName: string
  projectDescription?: string
  projectStartTime: string
  projectEndTime: string
  projectLocation: string
  projectBudget?: number
  projectCategory?: string
}): Promise<ReportProject> {
  return request<ReportProject>('/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ─── ANNUAL BUDGET REPORTS (ABYIP) ──────────────────────────────────────────

export async function postApprovedAbyipApi(payload: {
  budgetBarangay: string
  budgetYear: number
  budgetValue: number
  budgetFileURL?: string
}): Promise<any> {
  return request('/annual-budget-reports', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// ─── REPORTS / DASHBOARD SUMMARY ─────────────────────────────────────────────

export async function fetchExecutiveSummaryApi(): Promise<any> {
  return request('/reports/summary')
}

// ─── AUDIT LOGS ─────────────────────────────────────────────────────────────

export async function fetchAuditLogsApi(limit = 50): Promise<any[]> {
  return request<any[]>(`/audit-logs?limit=${limit}`)
}

export async function registerCitizenApi(payload: {
  userName: string
  userEmail: string
  userPassword: string
  userLocation: string
  userIsStaRosa?: boolean
}): Promise<any> {
  const res = await request<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      userName: payload.userName,
      userEmail: payload.userEmail,
      password: payload.userPassword,
      userLocation: payload.userLocation,
      userIsStaRosa: payload.userIsStaRosa ?? true,
    }),
  })
  setStoredToken(res.accessToken, true)
  return res.user
}

export async function fetchBarangayReportApi(barangayName: string): Promise<any> {
  return request(`/reports/barangay/${encodeURIComponent(barangayName)}`)
}

// ─── USER ACCOUNTS (SUPER ADMIN) ────────────────────────────────────────────

export async function fetchUserAccountsApi(): Promise<any[]> {
  return request<any[]>('/admin/accounts')
}

export async function createUserAccountApi(payload: {
  userName: string
  userEmail: string
  userPassword: string
  userRole: string
  userLocation: string
  userIsSK?: boolean
  userSKTermStart?: string
  userSKTermEnd?: string
}): Promise<any> {
  return request('/admin/accounts', {
    method: 'POST',
    body: JSON.stringify({
      userName: payload.userName,
      userEmail: payload.userEmail,
      password: payload.userPassword,
      userRole: payload.userRole,
      userLocation: payload.userLocation,
      userIsSK: payload.userIsSK ?? true,
      userIsStaRosa: true,
    }),
  })
}

export async function toggleUserStatusApi(userId: number, isActive: boolean): Promise<any> {
  return request(`/admin/accounts/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ userIsActive: isActive }),
  })
}

export async function fetchSKOfficialsApi(barangay?: string): Promise<any[]> {
  const query = barangay ? `?barangay=${encodeURIComponent(barangay)}` : ''
  return request<any[]>(`/reports/sk-officials${query}`)
}

// ─── COMMENTS & SUGGESTIONS ──────────────────────────────────────────────────

export async function fetchCommentsApi(projectId: number): Promise<any[]> {
  return request<any[]>(`/comments/project/${projectId}`)
}

export async function postCommentApi(payload: {
  commentFor: number
  commentDetails: string
  commentType?: 'comment' | 'suggestion'
  parentCommentID?: number
}): Promise<any> {
  return request('/comments', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function voteCommentApi(commentId: number): Promise<any> {
  return request(`/comments/${commentId}/vote`, {
    method: 'POST',
  })
}

// ─── NEWSLETTER / CITY NEWS ──────────────────────────────────────────────────

export async function fetchNewsApi(): Promise<NewsItem[]> {
  return request<NewsItem[]>('/newsletter')
}
