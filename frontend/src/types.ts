export type Role = 'guest' | 'citizen' | 'sk' | 'superadmin'

export interface UserAccount {
  id: string
  name: string
  email: string
  password?: string
  role: Role
  barangay?: string
  isStaRosa: boolean
}

export interface ReportProject {
  id: string
  barangay: string
  title: string
  status: 'upcoming' | 'ongoing' | 'completed'
  progress: number
  proposedBudget: number
  spent: number
  startDate: string
  endDate: string
  description: string
  needsReceiptScan?: boolean
}

export interface NewsItem {
  id: string
  title: string
  date: string
  summary: string
  category: string
  image?: string
}

export interface SKOfficial {
  id: string
  barangay: string
  name: string
  position: string
  phone?: string
}

export interface CitizenComment {
  id: string
  barangay: string
  author: string
  text: string
  date: string
}

export interface ActivityLog {
  id: string
  user: string
  action: string
  when: string
}
