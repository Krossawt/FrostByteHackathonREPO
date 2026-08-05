/**
 * eSKala — Global Search Registry
 * Defines all searchable features per user role.
 * Each entry has keywords (for matching), a label (displayed), a
 * category tag, an icon name (from lucide-react), and a route path.
 */

import type { Role, SKPosition } from '../types'

export interface SearchEntry {
  /** Short user-facing name shown in results */
  label: string
  /** Broader category shown as a tag */
  category: string
  /** Lucide icon name */
  icon: string
  /** Route to navigate to on click */
  path: string
  /** Array of searchable keywords (case-insensitive match) */
  keywords: string[]
  /** Optional: restrict to specific SK positions */
  skPositions?: SKPosition[]
}

// ── Citizen entries ────────────────────────────────────────────────────────────
const CITIZEN_ENTRIES: SearchEntry[] = [
  {
    label: 'Dashboard',
    category: 'Home',
    icon: 'LayoutDashboard',
    path: '/citizen/home',
    keywords: ['dashboard', 'home', 'overview', 'main'],
  },
  {
    label: 'Budget Overview',
    category: 'Finance',
    icon: 'PieChart',
    path: '/citizen/home',
    keywords: ['budget', 'spending', 'finance', 'funds', 'money', 'allocated'],
  },
  {
    label: 'Projects',
    category: 'Projects',
    icon: 'FolderOpen',
    path: '/citizen/projects',
    keywords: ['projects', 'programs', 'initiatives', 'barangay projects', 'sk projects'],
  },
  {
    label: 'News & Announcements',
    category: 'News',
    icon: 'Newspaper',
    path: '/citizen/home',
    keywords: ['news', 'announcements', 'updates', 'bulletin', 'latest'],
  },
  {
    label: 'Submit Suggestion',
    category: 'Community',
    icon: 'MessageSquarePlus',
    path: '/citizen/home',
    keywords: ['suggest', 'suggestion', 'feedback', 'comment', 'leave feedback', 'idea'],
  },
  {
    label: 'Community Suggestions',
    category: 'Community',
    icon: 'Users',
    path: '/citizen/home',
    keywords: ['community', 'all suggestions', 'citizen feedback', 'forum', 'discussion'],
  },
  {
    label: 'Barangay Transactions',
    category: 'Finance',
    icon: 'Receipt',
    path: '/citizen/home',
    keywords: ['transactions', 'receipts', 'expenses', 'disbursement', 'spending details'],
  },
  {
    label: 'My SK Officials',
    category: 'Officials',
    icon: 'BadgeCheck',
    path: '/citizen/mysks',
    keywords: ['sks', 'officials', 'sk members', 'sk officials', 'kagawad', 'chairperson', 'my sk'],
  },
  {
    label: 'About eSKala',
    category: 'Info',
    icon: 'Info',
    path: '/about',
    keywords: ['about', 'eskala', 'what is', 'transparency', 'system info'],
  },
]

// ── SK entries ─────────────────────────────────────────────────────────────────
const SK_ENTRIES: SearchEntry[] = [
  {
    label: 'Dashboard',
    category: 'Home',
    icon: 'LayoutDashboard',
    path: '/sk/home',
    keywords: ['dashboard', 'home', 'overview', 'main'],
  },
  {
    label: 'Budget Report',
    category: 'Finance',
    icon: 'PieChart',
    path: '/sk/home',
    keywords: ['budget', 'finance', 'spending', 'funds', 'breakdown', 'allocation'],
  },
  {
    label: 'Manage Projects',
    category: 'Projects',
    icon: 'FolderOpen',
    path: '/sk/projects',
    keywords: ['projects', 'manage projects', 'project list', 'all projects'],
  },
  {
    label: 'Create New Project',
    category: 'Projects',
    icon: 'FolderPlus',
    path: '/sk/projects',
    keywords: ['create project', 'add project', 'new project', 'create'],
    skPositions: ['Chairperson', 'Secretary'],
  },
  {
    label: 'Transactions & Receipts',
    category: 'Finance',
    icon: 'Receipt',
    path: '/sk/home',
    keywords: ['transactions', 'receipts', 'purchase orders', 'expenses', 'vouchers'],
  },
  {
    label: 'Citizen Suggestions',
    category: 'Community',
    icon: 'MessageSquare',
    path: '/sk/home',
    keywords: ['suggestions', 'citizen feedback', 'community feedback', 'comments'],
  },
  {
    label: 'News & Announcements',
    category: 'News',
    icon: 'Newspaper',
    path: '/sk/home',
    keywords: ['news', 'announcements', 'updates', 'bulletin'],
  },
  {
    label: 'Export PDF Report',
    category: 'Reports',
    icon: 'FileDown',
    path: '/sk/home',
    keywords: ['export', 'pdf', 'download', 'report', 'print', 'generate report'],
  },
  {
    label: 'About eSKala',
    category: 'Info',
    icon: 'Info',
    path: '/about',
    keywords: ['about', 'eskala', 'system info'],
  },
]

// ── Super Admin entries ────────────────────────────────────────────────────────
const SUPERADMIN_ENTRIES: SearchEntry[] = [
  {
    label: 'City Dashboard',
    category: 'Home',
    icon: 'LayoutDashboard',
    path: '/superadmin/home',
    keywords: ['dashboard', 'home', 'city overview', 'overview', 'main'],
  },
  {
    label: 'City Budget Summary',
    category: 'Finance',
    icon: 'PieChart',
    path: '/superadmin/home',
    keywords: ['budget', 'city budget', 'executive summary', 'finance', 'funds'],
  },
  {
    label: 'All City Projects',
    category: 'Projects',
    icon: 'FolderOpen',
    path: '/superadmin/home',
    keywords: ['projects', 'all projects', 'city projects', 'programs'],
  },
  {
    label: 'Manage Accounts',
    category: 'Accounts',
    icon: 'Users',
    path: '/superadmin/accounts',
    keywords: ['accounts', 'users', 'manage users', 'manage accounts', 'sk accounts'],
  },
  {
    label: 'Create Account',
    category: 'Accounts',
    icon: 'UserPlus',
    path: '/superadmin/accounts',
    keywords: ['create account', 'add user', 'new user', 'add sk', 'register user', 'new account'],
  },
  {
    label: 'Activity Logs',
    category: 'Audit',
    icon: 'ClipboardList',
    path: '/superadmin/activity',
    keywords: ['activity', 'logs', 'audit', 'audit logs', 'history', 'activity logs'],
  },
  {
    label: 'Manage News',
    category: 'News',
    icon: 'Newspaper',
    path: '/superadmin/news',
    keywords: ['news', 'newsletter', 'manage news', 'announcements', 'articles'],
  },
  {
    label: 'Post News Article',
    category: 'News',
    icon: 'FilePlus',
    path: '/superadmin/news',
    keywords: ['create news', 'post news', 'add article', 'new article', 'write news'],
  },
  {
    label: 'Filter by Barangay',
    category: 'Filters',
    icon: 'MapPin',
    path: '/superadmin/home',
    keywords: ['barangay', 'filter', 'select barangay', 'location filter'],
  },
  {
    label: 'Export PDF Report',
    category: 'Reports',
    icon: 'FileDown',
    path: '/superadmin/home',
    keywords: ['export', 'pdf', 'download', 'print', 'report', 'generate'],
  },
  {
    label: 'About eSKala',
    category: 'Info',
    icon: 'Info',
    path: '/about',
    keywords: ['about', 'eskala', 'system'],
  },
]

// ── Main export ────────────────────────────────────────────────────────────────
export function getSearchEntries(
  role: Role,
  skPosition?: SKPosition
): SearchEntry[] {
  if (role === 'citizen') return CITIZEN_ENTRIES
  if (role === 'superadmin') return SUPERADMIN_ENTRIES
  if (role === 'sk') {
    return SK_ENTRIES.filter(entry => {
      if (!entry.skPositions) return true          // available to all SK
      if (!skPosition) return false                 // position unknown → hide restricted
      return entry.skPositions.includes(skPosition)
    })
  }
  return []
}

// Fuzzy search: returns entries whose keywords contain the query as a substring
export function searchEntries(
  query: string,
  role: Role,
  skPosition?: SKPosition,
  maxResults = 6
): SearchEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  const entries = getSearchEntries(role, skPosition)
  const scored: Array<{ entry: SearchEntry; score: number }> = []

  for (const entry of entries) {
    let score = 0
    const labelLower = entry.label.toLowerCase()
    const categoryLower = entry.category.toLowerCase()

    // Exact label match → highest score
    if (labelLower === q) { score = 100 }
    // Label starts with query
    else if (labelLower.startsWith(q)) { score = 80 }
    // Label contains query
    else if (labelLower.includes(q)) { score = 60 }
    // Category matches
    else if (categoryLower.includes(q)) { score = 40 }
    else {
      // Keyword substring match
      for (const kw of entry.keywords) {
        if (kw.includes(q)) { score = Math.max(score, 30); break }
      }
    }

    if (score > 0) scored.push({ entry, score })
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(s => s.entry)
}
