/**
 * eSKala — API Client & Integration Service
 * Connects the frontend to the FastAPI REST backend with JWT authentication.
 */

import type { UserAccount, ReportProject, NewsItem } from '../types'

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'https://frostbytehackathonrepo.onrender.com/api/v1'
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

const IS_DEV = true

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken()
  const method = options.method || 'GET'
  const fullUrl = `${API_BASE_URL}${endpoint}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  if (IS_DEV) {
    console.log(
      `%c[API REQUEST] %c${method} %c${endpoint}`,
      'background: #760031; color: #fff; font-weight: bold; padding: 2px 6px; border-radius: 3px;',
      'color: #b45309; font-weight: bold;',
      'color: #1d4ed8;',
      { fullUrl, payload: options.body ? JSON.parse(options.body as string) : null }
    )
  }

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
    })

    if (!response.ok) {
      let errorDetail = `HTTP ${response.status}: ${response.statusText}`
      try {
        const errJson = await response.json()
        if (errJson.detail) {
          errorDetail = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail)
        }
      } catch {
        // fallback to HTTP status
      }

      console.error(
        `%c[API ERROR ${response.status}] %c${method} ${endpoint}`,
        'background: #b91c1c; color: #fff; font-weight: bold; padding: 2px 6px; border-radius: 3px;',
        'color: #991b1b; font-weight: bold;',
        errorDetail
      )
      throw new Error(errorDetail)
    }

    const data = await response.json()
    if (IS_DEV) {
      console.log(
        `%c[API SUCCESS] %c${method} ${endpoint}`,
        'background: #166534; color: #fff; font-weight: bold; padding: 2px 6px; border-radius: 3px;',
        'color: #15803d;',
        data
      )
    }
    return data as T
  } catch (err: any) {
    if (err.name === 'TypeError' || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError') || err.message?.includes('failed with status')) {
      console.error(
        `%c[NETWORK ERROR 🚨] %cFastAPI Backend is Offline at ${API_BASE_URL}`,
        'background: #7f1d1d; color: #fef2f2; font-weight: bold; padding: 4px 8px; border-radius: 4px; font-size: 12px;',
        'color: #b91c1c; font-weight: bold;',
        'Make sure the FastAPI backend is running! Start it with: python -m uvicorn main:app --reload --port 8000'
      )
    }
    throw err
  }
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
  public_only?: boolean
}): Promise<ReportProject[]> {
  const query = new URLSearchParams()
  if (params?.barangay) query.append('barangay', params.barangay)
  if (params?.status) query.append('status', params.status)
  if (params?.search) query.append('search', params.search)
  if (params?.category) query.append('category', params.category)
  if (params?.public_only === false) query.append('public_only', 'false')

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

export interface UpdateProjectPayload {
  projectName?: string
  projectDescription?: string
  projectStartTime?: string
  projectEndTime?: string
  projectLocation?: string
  projectBudget?: number
  projectCategory?: string
  projectProgress?: number
}

export async function fetchProjectByIdApi(projectId: number | string): Promise<any> {
  return request<any>(`/projects/${projectId}`)
}

export async function updateProjectApi(projectId: number | string, payload: UpdateProjectPayload): Promise<any> {
  return request<any>(`/projects/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteProjectApi(projectId: number | string): Promise<any> {
  return request<any>(`/projects/${projectId}`, {
    method: 'DELETE',
  })
}

// ─── ANNUAL BUDGET REPORTS (ABYIP) ──────────────────────────────────────────

export async function postApprovedAbyipApi(payload: {
  budgetBarangay: string
  budgetYear: number
  budgetValue: number
  budgetFileURL?: string
}): Promise<any> {
  return request('/budget-reports', {
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

// TEMPORARY STUB — replace once backend implements PUT/PATCH /users/:id
export async function updateUserAccountApi(id: number, payload: any) {
  console.warn('updateUserAccountApi stub — backend endpoint not yet implemented', id, payload)
  return { userID: id, ...payload }
}

export async function toggleUserStatusApi(userId: number, isActive: boolean): Promise<any> {
  void isActive
  return request(`/admin/accounts/${userId}/toggle-active`, {
    method: 'PATCH',
  })
}

export async function fetchSKOfficialsApi(barangay?: string): Promise<any[]> {
  const query = barangay ? `?barangay=${encodeURIComponent(barangay)}` : ''
  return request<any[]>(`/reports/sk-officials${query}`)
}
// ─── PROJECT WORKFLOW TRANSITIONS ────────────────────────────────────────────

export async function submitProjectToFinanceApi(projectId: number): Promise<ReportProject> {
  return request<ReportProject>(`/projects/${projectId}/submit-to-finance`, {
    method: 'PATCH',
  })
}

export async function updateProjectBreakdownApi(projectId: number, projectBreakdown: number): Promise<ReportProject> {
  return request<ReportProject>(`/projects/${projectId}/update-breakdown`, {
    method: 'PATCH',
    body: JSON.stringify({ projectBreakdown }),
  })
}

export async function submitProjectForApprovalApi(projectId: number): Promise<ReportProject> {
  return request<ReportProject>(`/projects/${projectId}/submit-for-approval`, {
    method: 'PATCH',
  })
}

export async function approveAndPostProjectApi(projectId: number): Promise<ReportProject> {
  return request<ReportProject>(`/projects/${projectId}/approve-post`, {
    method: 'PATCH',
  })
}

export async function rejectProjectApi(projectId: number): Promise<ReportProject> {
  return request<ReportProject>(`/projects/${projectId}/reject`, {
    method: 'PATCH',
  })
}

// ─── PURCHASE ORDERS (FINANCE MIS) ───────────────────────────────────────────

export async function fetchPurchaseOrdersApi(projectId?: number): Promise<any[]> {
  const query = projectId ? `?project_id=${projectId}` : ''
  return request<any[]>(`/purchase-orders${query}`)
}

export interface CreatePurchaseOrderPayload {
  projectID: number
  orderName?: string
  orderType?: string
  orderQty?: number
  orderPrice?: number
  supplierName?: string
  orderItemsDescription?: string
  orderAmount?: number
}

export async function createPurchaseOrderApi(payload: CreatePurchaseOrderPayload): Promise<any> {
  const normalizedPayload = {
    projectID: payload.projectID,
    orderName: payload.orderName ?? payload.supplierName ?? 'Unnamed Order',
    orderType: payload.orderType ?? 'Physical',
    orderQty: payload.orderQty ?? 1,
    orderPrice: payload.orderPrice ?? payload.orderAmount ?? 0,
  }

  return request('/purchase-orders', {
    method: 'POST',
    body: JSON.stringify(normalizedPayload),
  })
}

// ─── COMMENTS & SUGGESTIONS ──────────────────────────────────────────────────

export async function fetchCommentsApi(projectId: number): Promise<any[]> {
  return request<any[]>(`/projects/${projectId}/comments`)
}

export async function postCommentApi(payload: {
  commentFor: number
  commentDetails: string
  commentType?: 'comment' | 'suggestion'
  parentCommentID?: number
}): Promise<any> {
  return request(`/projects/${payload.commentFor}/comments`, {
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
  const res = await request<any>('/newsletter')
  if (Array.isArray(res)) return res
  if (res && Array.isArray(res.items)) return res.items
  if (res && Array.isArray(res.data)) return res.data
  if (res && Array.isArray(res.newsletter)) return res.newsletter
  return []
}

export async function createNewsletterApi(payload: {
  title: string
  summary: string
  category?: string
  projectLocation?: string
  imageURL?: string
}): Promise<any> {
  return request('/newsletter', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

// TEMPORARY STUB — replace once backend implements PUT/PATCH /newsletter/:id
export async function updateNewsletterApi(newsletterId: number, payload: any) {
  console.warn('updateNewsletterApi stub — backend endpoint not yet implemented', newsletterId, payload)
  return { newsletterID: newsletterId, ...payload }
}

export async function uploadNewsImageApi(file: File): Promise<{ imageURL: string }> {
  const token = getStoredToken()
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${API_BASE_URL}/newsletter/upload-image`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  })

  if (!res.ok) {
    throw new Error(`Image upload failed with status ${res.status}`)
  }
  return res.json()
}

export async function deleteNewsletterApi(newsletterId: number): Promise<any> {
  return request(`/newsletter/${newsletterId}`, {
    method: 'DELETE',
  })
}