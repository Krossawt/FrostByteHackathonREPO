import type { UserAccount } from '../types'

const STORAGE_KEY = 'eskala-user'
const SESSION_KEY = 'eskala-user-session'

const initialUsers: UserAccount[] = [
  {
    id: 'u-admin',
    name: 'SCC Super Admin',
    email: 'superadmin@eskala.ph',
    username: 'superadmin',
    password: 'Admin2026!',
    role: 'superadmin',
    isStaRosa: true,
    isActive: true,
  },
  {
    id: 'u-sk-bal-c',
    name: 'Patricia Ann C. Dizon',
    email: 'padizon.balibago@sk.gov.ph',
    username: 'skchair_bal',
    password: 'Sk2026!',
    role: 'sk',
    barangay: 'Balibago',
    skPosition: 'Chairperson',
    isStaRosa: true,
    isActive: true,
  },
  {
    id: 'u-sk-bal-s',
    name: 'Marco D. Villanueva',
    email: 'mvillanueva.balibago@sk.gov.ph',
    username: 'sksec_bal',
    password: 'Sk2026!',
    role: 'sk',
    barangay: 'Balibago',
    skPosition: 'Secretary',
    isStaRosa: true,
    isActive: true,
  },
  {
    id: 'u-sk-bal-t',
    name: 'Kristine P. Lim',
    email: 'klim.balibago@sk.gov.ph',
    username: 'sktreasurer_bal',
    password: 'Sk2026!',
    role: 'sk',
    barangay: 'Balibago',
    skPosition: 'Treasurer',
    isStaRosa: true,
    isActive: true,
  },
  {
    id: 'u-sk-cai-c',
    name: 'Diego A. Mercado',
    email: 'dmercado.caingin@sk.gov.ph',
    username: 'skchair_cai',
    password: 'Sk2026!',
    role: 'sk',
    barangay: 'Caingin',
    skPosition: 'Chairperson',
    isStaRosa: true,
    isActive: true,
  },
  {
    id: 'u-citizen',
    name: 'Juan dela Cruz',
    email: 'citizen@eskala.ph',
    username: 'citizen',
    password: 'Citizen2026!',
    role: 'citizen',
    barangay: 'Balibago',
    isStaRosa: true,
    isActive: true,
  },
]

function readStoredUser(key: string): UserAccount | null {
  const raw = window.localStorage.getItem(key) || window.sessionStorage.getItem(key)
  if (!raw) return null
  try { return JSON.parse(raw) as UserAccount } catch { return null }
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
  } else {
    window.sessionStorage.setItem(SESSION_KEY, payload)
    window.localStorage.removeItem(STORAGE_KEY)
  }
}

export function login(emailOrUsername: string, password: string, rememberMe = false): UserAccount | null {
  const key = emailOrUsername.trim().toLowerCase()
  const match = initialUsers.find(
    (u) => (u.email.toLowerCase() === key || u.username?.toLowerCase() === key) && u.password === password
  )
  if (match) { storeUser(match, rememberMe); return match }
  return null
}

export function register(name: string, email: string, password: string, barangay: string, isStaRosa: boolean, username?: string): UserAccount {
  const user: UserAccount = {
    id: `u-${Math.random().toString(36).slice(2, 10)}`,
    name, email, username: username || email.split('@')[0],
    password, role: 'citizen', barangay, isStaRosa, isActive: true,
  }
  storeUser(user, true)
  return user
}

export function logout() { storeUser(null, false) }

export { initialUsers }
