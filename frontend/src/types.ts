export type Role = 'guest' | 'citizen' | 'sk' | 'superadmin'
export type SKPosition = 'Chairperson' | 'Secretary' | 'Treasurer' | 'Kagawad' | 'Auditor' | 'Peace Officer' | 'Federation President'

export interface UserAccount {
  id: string
  name: string
  email: string
  username?: string
  password?: string
  role: Role
  barangay?: string
  isStaRosa: boolean
  skPosition?: SKPosition
  isActive?: boolean
  createdAt?: string
}

export interface ReportProject {
  id: string
  barangay: string
  title: string
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  progress: number
  progressPercent?: number
  proposedBudget: number
  spent: number
  remainingBudget?: number
  startDate: string
  endDate: string
  description: string
  category?: string
  needsReceiptScan?: boolean
  receipts?: Receipt[]
  isDeleted?: boolean
}

export interface NewsItem {
  id: string
  title: string
  date: string
  summary?: string
  category: string
  image?: string
  isDeleted?: boolean
}

export interface SKOfficial {
  id: string
  barangay: string
  name: string
  position: SKPosition
  phone?: string
  email?: string
  term?: string
}

export interface CitizenComment {
  id: string
  barangay: string
  author: string
  text: string
  date: string
  type?: 'comment' | 'suggestion'
  votes?: number
}

export interface ActivityLog {
  id: string
  user: string
  actor: string        // alias: same as user
  action: string
  barangay?: string
  when: string
  date: string         // alias: human-readable date from timestamp
  timestamp?: string
  description?: string
}

export interface Receipt {
  id: string
  projectId: string
  projectTitle?: string
  barangay?: string
  vendor: string
  amount: number
  extractedAmount?: number
  date: string
  description?: string
  imageUrl?: string
  status?: 'pending' | 'verified' | 'rejected'
  ocrExtracted?: boolean
}

export interface AccountRecord extends UserAccount {
  lastLogin?: string
  status: 'active' | 'inactive' | 'suspended'
}
