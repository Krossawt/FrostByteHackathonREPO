import type { UserAccount } from '../types'
import { loginApi, registerCitizenApi } from './api'

const STORAGE_KEY = 'eskala-user'
const SESSION_KEY = 'eskala-user-session'

const USERS_DB_KEY = 'eskala-users-db'

export function getUsersDB(): UserAccount[] {
  const raw = window.localStorage.getItem(USERS_DB_KEY)
  if (!raw) {
    return []
  }
  try {
    return JSON.parse(raw) as UserAccount[]
  } catch {
    return []
  }
}

function saveUsersDB(users: UserAccount[]) {
  window.localStorage.setItem(USERS_DB_KEY, JSON.stringify(users))
}

function readStoredUser(key: string): UserAccount | null {
  const raw = window.localStorage.getItem(key) || window.sessionStorage.getItem(key)
  if (!raw) return null
  try { return JSON.parse(raw) as UserAccount } catch { return null }
}

export function getStoredUser(): UserAccount | null {
  return readStoredUser(STORAGE_KEY) || readStoredUser(SESSION_KEY)
}

function storeUser(user: UserAccount | null, _rememberMe = true) {
  if (!user) {
    window.localStorage.removeItem(STORAGE_KEY)
    window.sessionStorage.removeItem(SESSION_KEY)
    return
  }
  const payload = JSON.stringify(user)
  window.localStorage.setItem(STORAGE_KEY, payload)
  window.sessionStorage.setItem(SESSION_KEY, payload)
}

export async function loginAsync(emailOrUsername: string, password: string, rememberMe = false): Promise<UserAccount | null> {
  try {
    const res: any = await loginApi(emailOrUsername, password)
    const userRoleStr = (res.user?.userRole || 'Guest').toLowerCase()
    const mappedRole = userRoleStr.includes('admin') ? 'superadmin' : userRoleStr.includes('sk') ? 'sk' : 'citizen'

    const user: UserAccount = {
      id: String(res.user?.userID || '1'),
      name: res.user?.userName || 'User',
      email: res.user?.userEmail || emailOrUsername,
      username: (res.user?.userName || emailOrUsername).toLowerCase().replace(/\s+/g, ''),
      role: mappedRole as any,
      barangay: res.user?.userLocation !== 'Santa Rosa City' ? res.user?.userLocation : undefined,
      skPosition: res.user?.userRole?.includes('Chairperson') ? 'Chairperson' : res.user?.userRole?.includes('Secretary') ? 'Secretary' : res.user?.userRole?.includes('Treasurer') ? 'Treasurer' : undefined,
      isStaRosa: res.user?.userIsStaRosa ?? true,
      isActive: res.user?.userIsActive ?? true,
    }
    storeUser(user, rememberMe)
    return user
  } catch (err) {
    console.warn('API login failed, checking fallback:', err)
    return login(emailOrUsername, password, rememberMe)
  }
}

export function login(emailOrUsername: string, password: string, rememberMe = false): UserAccount | null {
  const key = emailOrUsername.trim().toLowerCase()

  // Pre-set Super Admin Account Fallback
  if ((key === 'superadmin@eskala.ph' || key === 'superadmin') && password === 'Admin2026!') {
    const admin: UserAccount = {
      id: '1',
      name: 'SCC Super Admin',
      email: 'superadmin@eskala.ph',
      username: 'superadmin',
      role: 'superadmin',
      isStaRosa: true,
      isActive: true,
    }
    storeUser(admin, rememberMe)
    return admin
  }

  const users = getUsersDB()
  const match = users.find(
    (u) => (u.email.toLowerCase() === key || u.username?.toLowerCase() === key) && u.password === password
  )
  if (match) { storeUser(match, rememberMe); return match }
  return null
}

export async function registerAsync(name: string, email: string, password: string, barangay: string, isStaRosa: boolean, username?: string): Promise<UserAccount> {
  try {
    const created = await registerCitizenApi({
      userName: name,
      userEmail: email,
      userPassword: password,
      userLocation: barangay,
      userIsStaRosa: isStaRosa,
    })

    const user: UserAccount = {
      id: String(created.userID),
      name: created.userName,
      email: created.userEmail,
      username: username || email.split('@')[0],
      role: 'citizen',
      barangay: created.userLocation,
      isStaRosa: created.userIsStaRosa,
      isActive: true,
    }
    storeUser(user, true)
    return user
  } catch (err) {
    return register(name, email, password, barangay, isStaRosa, username)
  }
}

export function register(name: string, email: string, password: string, barangay: string, isStaRosa: boolean, username?: string): UserAccount {
  const users = getUsersDB()
  const user: UserAccount = {
    id: `u-${Math.random().toString(36).slice(2, 10)}`,
    name,
    email,
    username: username || email.split('@')[0],
    password,
    role: 'citizen',
    barangay,
    isStaRosa,
    isActive: true,
  }
  users.push(user)
  saveUsersDB(users)
  storeUser(user, true)
  return user
}

export function logout() { storeUser(null, false) }

