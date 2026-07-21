import type { ActivityLog, CitizenComment, NewsItem, ReportProject, SKOfficial } from '../types'

export const barangaySummary = [
  { barangay: 'City Heights', annualBudget: 2600000, spent: 1575000, projects: 8 },
  { barangay: 'Balibago', annualBudget: 2180000, spent: 1289000, projects: 6 },
  { barangay: 'San Lorenzo', annualBudget: 1895000, spent: 1124000, projects: 5 },
  { barangay: 'Dela Paz', annualBudget: 2400000, spent: 1750000, projects: 10 },
  { barangay: 'Malitlit', annualBudget: 1980000, spent: 1025000, projects: 4 },
  { barangay: 'Nuvali', annualBudget: 2250000, spent: 1390000, projects: 7 }
]

export const cityHighlights = [
  { label: 'Total Barangays', value: 6 },
  { label: 'Active SK Projects', value: 38 },
  { label: 'Funds Released', value: '₱31.2M' },
  { label: 'Citizen Suggestions', value: 197 }
]

export const projects: ReportProject[] = [
  {
    id: 'PRJ-001',
    barangay: 'City Heights',
    title: 'Barangay Youth Skills Training',
    status: 'ongoing',
    progress: 74,
    proposedBudget: 650000,
    spent: 478000,
    startDate: '2026-07-04',
    endDate: '2026-10-05',
    description: 'A combined soft skills and digital literacy workshop for youth athletes and volunteers supporting City Heights youth governance.',
    needsReceiptScan: true
  },
  {
    id: 'PRJ-002',
    barangay: 'Balibago',
    title: 'Community Health Education Booths',
    status: 'upcoming',
    progress: 10,
    proposedBudget: 325000,
    spent: 12000,
    startDate: '2026-08-10',
    endDate: '2026-11-12',
    description: 'A barangay-wide health and nutrition campaign targeting student awareness and safe community practices.'
  },
  {
    id: 'PRJ-003',
    barangay: 'San Lorenzo',
    title: 'Youth Urban Agriculture Hub',
    status: 'ongoing',
    progress: 58,
    proposedBudget: 520000,
    spent: 312000,
    startDate: '2026-06-15',
    endDate: '2026-12-20',
    description: 'Building a vertical farming demonstration site with youth volunteers to promote sustainable food systems in San Lorenzo.'
  },
  {
    id: 'PRJ-004',
    barangay: 'Dela Paz',
    title: 'Cultural Arts and Performance Series',
    status: 'ongoing',
    progress: 88,
    proposedBudget: 470000,
    spent: 420000,
    startDate: '2026-05-22',
    endDate: '2026-09-03',
    description: 'Barangay Dela Paz hosts a series of youth-driven art performances, local heritage storytelling, and civic celebration events.'
  },
  {
    id: 'PRJ-005',
    barangay: 'Malitlit',
    title: 'Barangay Clean Water Drive',
    status: 'completed',
    progress: 100,
    proposedBudget: 340000,
    spent: 340000,
    startDate: '2026-04-08',
    endDate: '2026-06-12',
    description: 'A completed initiative to improve drinking water access and conduct an awareness campaign for water safety.'
  },
  {
    id: 'PRJ-006',
    barangay: 'Nuvali',
    title: 'Community Safety Patrol Launch',
    status: 'upcoming',
    progress: 22,
    proposedBudget: 410000,
    spent: 84000,
    startDate: '2026-09-01',
    endDate: '2027-01-20',
    description: 'A neighborhood patrol and volunteer response training program for youth leaders and civic partners.'
  }
]

export const news: NewsItem[] = [
  {
    id: 'N-01',
    title: 'Santa Rosa SK releases first quarterly transparency report',
    date: 'July 17, 2026',
    summary: 'Super admin and barangay SK officers share consolidated progress on youth programs and budget status for active projects across the city.',
    category: 'Transparency',
    image: ''
  },
  {
    id: 'N-02',
    title: 'Citizen suggestion portal now live for barangay youth projects',
    date: 'July 12, 2026',
    summary: 'Residents can submit suggestions and comments directly through the eSKala portal to help shape barangay youth initiatives.',
    category: 'City News',
    image: ''
  },
  {
    id: 'N-03',
    title: 'SK officers prepare next funding cycle for 2027 proposals',
    date: 'July 8, 2026',
    summary: 'Officials from all barangays are refining project proposals with financial consistency and public review in mind.',
    category: 'Announcements',
    image: ''
  }
]

export const skOfficials: SKOfficial[] = [
  { id: 'SK-01', barangay: 'City Heights', name: 'Alyssa Mendoza', position: 'Chairperson', phone: '+63 917 555 6781' },
  { id: 'SK-02', barangay: 'City Heights', name: 'Mark Velasco', position: 'Treasurer', phone: '+63 917 555 6790' },
  { id: 'SK-03', barangay: 'Balibago', name: 'Rachelle Dizon', position: 'Secretary', phone: '+63 917 555 6823' },
  { id: 'SK-04', barangay: 'San Lorenzo', name: 'Jerome Cruz', position: 'Chairperson', phone: '+63 917 555 6844' },
  { id: 'SK-05', barangay: 'Dela Paz', name: 'Gian Ramos', position: 'Treasurer', phone: '+63 917 555 6882' },
  { id: 'SK-06', barangay: 'Nuvali', name: 'Vanessa Ong', position: 'Secretary', phone: '+63 917 555 6905' }
]

export const citizenComments: CitizenComment[] = [
  { id: 'C-01', barangay: 'City Heights', author: 'Jessa Aquino', text: 'Very helpful to see receipts and budget rates for youth programs.', date: 'July 18, 2026' },
  { id: 'C-02', barangay: 'Balibago', author: 'Renan dela Cruz', text: 'Can we get more community drive updates from Balibago SK?', date: 'July 16, 2026' },
  { id: 'C-03', barangay: 'Dela Paz', author: 'Mika Lopez', text: 'The arts series was great; would love a follow-up report on attendance.', date: 'July 15, 2026' }
]

export const activityLogs: ActivityLog[] = [
  { id: 'L-01', user: 'Alyssa Mendoza', action: 'Updated City Heights project status to 74% complete', when: '2m ago' },
  { id: 'L-02', user: 'Mark Velasco', action: 'Added receipt scan for Youth Skills Training', when: '30m ago' },
  { id: 'L-03', user: 'Rachelle Dizon', action: 'Created Barangay Health Education Booths proposal', when: '1h ago' },
  { id: 'L-04', user: 'Gian Ramos', action: 'Published news item about citizen suggestion portal', when: '3h ago' }
]
