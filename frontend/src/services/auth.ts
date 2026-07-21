import type { Role, UserAccount } from '../types'

const STORAGE_KEY = 'eskala-user'

const initialUsers: UserAccount[] = [
  { id: 'u-admin', name: 'SCC Super Admin', email: 'superadmin@eskala.ph', password: 'Admin2026!', role: 'superadmin', isStaRosa: true },
  { id: 'u-sk', name: 'SK Officer', email: 'sk@eskala.ph', password: 'Sk2026!', role: 'sk', barangay: 'City Heights', isStaRosa: true },
  { id: 'u-user', name: 'Citizen User', email: 'citizen@eskala.ph', password: 'Citizen2026!', role: 'citizen', barangay: 'Balibago', isStaRosa: true }
]

export function getStoredUser(): UserAccount | null {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as UserAccount
  } catch {
    return null
  }
}

export function storeUser(user: UserAccount | null) {
  if (!user) {
    window.localStorage.removeItem(STORAGE_KEY)
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
}

export function login(email: string, password: string, role: Role): UserAccount | null {
  const match = initialUsers.find((user) => user.email === email && user.password === password && user.role === role)
  if (match) {
    storeUser(match)
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
  storeUser(user)
  return user
}

export function logout() {
  storeUser(null)
}
