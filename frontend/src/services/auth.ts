import type { UserAccount } from '../types'

const STORAGE_KEY = 'eskala-user'
const SESSION_KEY = 'eskala-user-session'

const initialUsers: UserAccount[] = [
  { id: 'u-admin', name: 'SCC Super Admin', email: 'superadmin@eskala.ph', password: 'Admin2026!', role: 'superadmin', isStaRosa: true },
  { id: 'u-sk', name: 'SK Officer', email: 'sk@eskala.ph', password: 'Sk2026!', role: 'sk', barangay: 'City Heights', isStaRosa: true },
  { id: 'u-user', name: 'Citizen User', email: 'citizen@eskala.ph', password: 'Citizen2026!', role: 'citizen', barangay: 'Balibago', isStaRosa: true }
]

function readStoredUser(key: string): UserAccount | null {
  const raw = window.localStorage.getItem(key) || window.sessionStorage.getItem(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as UserAccount
  } catch {
    return null
  }
}

export function getStoredUser(): UserAccount | null {
  return readStoredUser(STORAGE_KEY) || readStoredUser(SESSION_KEY)
}

function storeUser(user: UserAccount | null, rememberMe: boolean) {
  if (!user) {
    window.localStorage.removeItem(STORAGE_KEY)
    window.sessionStorage.removeItem(SESSION_KEY)
    return
  }

  const payload = JSON.stringify(user)
  if (rememberMe) {
    window.localStorage.setItem(STORAGE_KEY, payload)
    window.sessionStorage.removeItem(SESSION_KEY)
    return
  }

  window.sessionStorage.setItem(SESSION_KEY, payload)
  window.localStorage.removeItem(STORAGE_KEY)
}

export function login(email: string, password: string, rememberMe = false): UserAccount | null {
  const match = initialUsers.find((user) => user.email.toLowerCase() === email.trim().toLowerCase() && user.password === password)
  if (match) {
    storeUser(match, rememberMe)
    return match
  }
  return null
}

export function register(name: string, email: string, password: string, barangay: string, isStaRosa: boolean): UserAccount {
  const user: UserAccount = {
    id: `u-${Math.random().toString(36).slice(2, 10)}`,
    name,
    email,
    password,
    role: 'citizen',
    barangay,
    isStaRosa,
  }
  storeUser(user, true)
  return user
}

export function logout() {
  storeUser(null, false)
}
