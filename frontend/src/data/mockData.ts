import type { ActivityLog, CitizenComment, NewsItem, Receipt, ReportProject, SKOfficial, AccountRecord } from '../types'

// ─── BARANGAYS ────────────────────────────────────────────────────────────────
export const BARANGAYS = [
  'Aplaya', 'Balibago', 'Caingin', 'Dila', 'Dita', 'Don Jose',
  'Ibaba', 'Kanluran', 'Labas', 'Macabling', 'Malitlit', 'Malusak',
  'Market Area', 'Pooc', 'Pulong Santa Cruz', 'Santo Domingo', 'Sinalhan', 'Tagapo'
] as const

// ─── BARANGAY SUMMARY (all 18) ────────────────────────────────────────────────
export const barangaySummary = [
  { barangay: 'Aplaya',           annualBudget: 2_150_000, spent: 1_240_000, projects: 6,  remaining: 910_000  },
  { barangay: 'Balibago',         annualBudget: 2_780_000, spent: 1_620_000, projects: 9,  remaining: 1_160_000 },
  { barangay: 'Caingin',          annualBudget: 1_920_000, spent: 1_055_000, projects: 5,  remaining: 865_000  },
  { barangay: 'Dila',             annualBudget: 2_040_000, spent: 1_180_000, projects: 7,  remaining: 860_000  },
  { barangay: 'Dita',             annualBudget: 2_310_000, spent: 1_475_000, projects: 8,  remaining: 835_000  },
  { barangay: 'Don Jose',         annualBudget: 2_890_000, spent: 1_870_000, projects: 11, remaining: 1_020_000 },
  { barangay: 'Ibaba',            annualBudget: 1_840_000, spent: 985_000,  projects: 5,  remaining: 855_000  },
  { barangay: 'Kanluran',         annualBudget: 2_120_000, spent: 1_335_000, projects: 7,  remaining: 785_000  },
  { barangay: 'Labas',            annualBudget: 2_450_000, spent: 1_580_000, projects: 8,  remaining: 870_000  },
  { barangay: 'Macabling',        annualBudget: 2_680_000, spent: 1_730_000, projects: 10, remaining: 950_000  },
  { barangay: 'Malitlit',         annualBudget: 1_990_000, spent: 1_125_000, projects: 5,  remaining: 865_000  },
  { barangay: 'Malusak',          annualBudget: 1_760_000, spent: 920_000,  projects: 4,  remaining: 840_000  },
  { barangay: 'Market Area',      annualBudget: 2_540_000, spent: 1_690_000, projects: 9,  remaining: 850_000  },
  { barangay: 'Pooc',             annualBudget: 2_220_000, spent: 1_380_000, projects: 7,  remaining: 840_000  },
  { barangay: 'Pulong Santa Cruz',annualBudget: 2_380_000, spent: 1_455_000, projects: 8,  remaining: 925_000  },
  { barangay: 'Santo Domingo',    annualBudget: 2_610_000, spent: 1_720_000, projects: 10, remaining: 890_000  },
  { barangay: 'Sinalhan',         annualBudget: 2_090_000, spent: 1_260_000, projects: 6,  remaining: 830_000  },
  { barangay: 'Tagapo',           annualBudget: 2_760_000, spent: 1_810_000, projects: 11, remaining: 950_000  },
]

export const cityHighlights = [
  { label: 'Total Barangays',      value: '18'  },
  { label: 'Active SK Projects',   value: '141' },
  { label: 'Funds Released',       value: '₱39.2M' },
  { label: 'Citizen Suggestions',  value: '284' },
]

// ─── SK OFFICIALS ──────────────────────────────────────────────────────────────
export const skOfficials: SKOfficial[] = [
  // Aplaya
  { id: 'SK-A01', barangay: 'Aplaya',   name: 'Reniel M. Santos',     position: 'Chairperson', phone: '+63 917 101 2201', email: 'rsantos.aplaya@sk.gov.ph',     term: '2023–2025' },
  { id: 'SK-A02', barangay: 'Aplaya',   name: 'Carmela B. Flores',    position: 'Secretary',   phone: '+63 917 101 2202', email: 'cflores.aplaya@sk.gov.ph',     term: '2023–2025' },
  { id: 'SK-A03', barangay: 'Aplaya',   name: 'Joshua L. Reyes',      position: 'Treasurer',   phone: '+63 917 101 2203', email: 'jreyes.aplaya@sk.gov.ph',      term: '2023–2025' },
  // Balibago
  { id: 'SK-B01', barangay: 'Balibago', name: 'Patricia Ann C. Dizon',position: 'Chairperson', phone: '+63 917 202 3301', email: 'padizon.balibago@sk.gov.ph',   term: '2023–2025' },
  { id: 'SK-B02', barangay: 'Balibago', name: 'Marco D. Villanueva',   position: 'Secretary',   phone: '+63 917 202 3302', email: 'mvillanueva.balibago@sk.gov.ph',term: '2023–2025' },
  { id: 'SK-B03', barangay: 'Balibago', name: 'Kristine P. Lim',      position: 'Treasurer',   phone: '+63 917 202 3303', email: 'klim.balibago@sk.gov.ph',      term: '2023–2025' },
  { id: 'SK-B04', barangay: 'Balibago', name: 'Angelo S. Bautista',   position: 'Kagawad',     phone: '+63 917 202 3304', email: 'abautista.balibago@sk.gov.ph', term: '2023–2025' },
  // Caingin
  { id: 'SK-C01', barangay: 'Caingin',  name: 'Diego A. Mercado',     position: 'Chairperson', phone: '+63 917 303 4401', email: 'dmercado.caingin@sk.gov.ph',   term: '2023–2025' },
  { id: 'SK-C02', barangay: 'Caingin',  name: 'Alyssa R. Dela Cruz',  position: 'Secretary',   phone: '+63 917 303 4402', email: 'ardelacruz.caingin@sk.gov.ph', term: '2023–2025' },
  { id: 'SK-C03', barangay: 'Caingin',  name: 'Nathan B. Gonzales',   position: 'Treasurer',   phone: '+63 917 303 4403', email: 'ngonzales.caingin@sk.gov.ph',  term: '2023–2025' },
  // Dila
  { id: 'SK-D01', barangay: 'Dila',     name: 'Maria Lourdes T. Cruz',position: 'Chairperson', phone: '+63 917 404 5501', email: 'mltcruz.dila@sk.gov.ph',       term: '2023–2025' },
  { id: 'SK-D02', barangay: 'Dila',     name: 'Kevin S. Aguilar',     position: 'Secretary',   phone: '+63 917 404 5502', email: 'kaguilar.dila@sk.gov.ph',      term: '2023–2025' },
  { id: 'SK-D03', barangay: 'Dila',     name: 'Hannah Mae F. Ocampo', position: 'Treasurer',   phone: '+63 917 404 5503', email: 'hmocampo.dila@sk.gov.ph',      term: '2023–2025' },
  // Dita
  { id: 'SK-E01', barangay: 'Dita',     name: 'Jerome R. Valdez',     position: 'Chairperson', phone: '+63 917 505 6601', email: 'jrvaldez.dita@sk.gov.ph',      term: '2023–2025' },
  { id: 'SK-E02', barangay: 'Dita',     name: 'Sophia G. Pascual',    position: 'Secretary',   phone: '+63 917 505 6602', email: 'sgpascual.dita@sk.gov.ph',     term: '2023–2025' },
  { id: 'SK-E03', barangay: 'Dita',     name: 'Elaine C. Castillo',   position: 'Treasurer',   phone: '+63 917 505 6603', email: 'ecastillo.dita@sk.gov.ph',     term: '2023–2025' },
  // Don Jose
  { id: 'SK-F01', barangay: 'Don Jose', name: 'Adrian M. Torres',     position: 'Chairperson', phone: '+63 917 606 7701', email: 'amtorres.donjose@sk.gov.ph',   term: '2023–2025' },
  { id: 'SK-F02', barangay: 'Don Jose', name: 'Bianca N. Ramos',      position: 'Secretary',   phone: '+63 917 606 7702', email: 'bnramos.donjose@sk.gov.ph',    term: '2023–2025' },
  { id: 'SK-F03', barangay: 'Don Jose', name: 'Carlo P. Santiago',    position: 'Treasurer',   phone: '+63 917 606 7703', email: 'cpsantiago.donjose@sk.gov.ph', term: '2023–2025' },
  // Ibaba
  { id: 'SK-G01', barangay: 'Ibaba',    name: 'Lea M. Fernandez',     position: 'Chairperson', phone: '+63 917 707 8801', email: 'lmfernandez.ibaba@sk.gov.ph',  term: '2023–2025' },
  { id: 'SK-G02', barangay: 'Ibaba',    name: 'Mark A. Rivera',       position: 'Secretary',   phone: '+63 917 707 8802', email: 'marivera.ibaba@sk.gov.ph',     term: '2023–2025' },
  { id: 'SK-G03', barangay: 'Ibaba',    name: 'Nicole S. Bernal',     position: 'Treasurer',   phone: '+63 917 707 8803', email: 'nsbernal.ibaba@sk.gov.ph',     term: '2023–2025' },
  // Kanluran
  { id: 'SK-H01', barangay: 'Kanluran', name: 'Ryan C. Macaraeg',     position: 'Chairperson', phone: '+63 917 808 9901', email: 'rcmacaraeg.kanluran@sk.gov.ph',term: '2023–2025' },
  { id: 'SK-H02', barangay: 'Kanluran', name: 'Ria L. Panganiban',    position: 'Secretary',   phone: '+63 917 808 9902', email: 'rlpanganiban.kanluran@sk.gov.ph',term: '2023–2025' },
  { id: 'SK-H03', barangay: 'Kanluran', name: 'Joseph D. Aquino',     position: 'Treasurer',   phone: '+63 917 808 9903', email: 'jdaquino.kanluran@sk.gov.ph',  term: '2023–2025' },
  // Labas
  { id: 'SK-I01', barangay: 'Labas',    name: 'Vanessa O. Medina',    position: 'Chairperson', phone: '+63 917 909 1101', email: 'vomedina.labas@sk.gov.ph',     term: '2023–2025' },
  { id: 'SK-I02', barangay: 'Labas',    name: 'Christian T. Soriano', position: 'Secretary',   phone: '+63 917 909 1102', email: 'ctsoriano.labas@sk.gov.ph',    term: '2023–2025' },
  { id: 'SK-I03', barangay: 'Labas',    name: 'Pamela G. Vidal',      position: 'Treasurer',   phone: '+63 917 909 1103', email: 'pgvidal.labas@sk.gov.ph',      term: '2023–2025' },
  // Macabling
  { id: 'SK-J01', barangay: 'Macabling',name: 'Gabriel A. Cruz',      position: 'Chairperson', phone: '+63 917 110 2201', email: 'gacruz.macabling@sk.gov.ph',   term: '2023–2025' },
  { id: 'SK-J02', barangay: 'Macabling',name: 'Diana Rose M. Santos', position: 'Secretary',   phone: '+63 917 110 2202', email: 'drmsantos.macabling@sk.gov.ph',term: '2023–2025' },
  { id: 'SK-J03', barangay: 'Macabling',name: 'Erwin P. Lopez',       position: 'Treasurer',   phone: '+63 917 110 2203', email: 'eplopez.macabling@sk.gov.ph',  term: '2023–2025' },
  // Malitlit
  { id: 'SK-K01', barangay: 'Malitlit', name: 'Jessa A. Aquino',      position: 'Chairperson', phone: '+63 917 211 3301', email: 'jaaquino.malitlit@sk.gov.ph',  term: '2023–2025' },
  { id: 'SK-K02', barangay: 'Malitlit', name: 'Renan D. dela Cruz',   position: 'Secretary',   phone: '+63 917 211 3302', email: 'rddelacruz.malitlit@sk.gov.ph',term: '2023–2025' },
  { id: 'SK-K03', barangay: 'Malitlit', name: 'Mika B. Lopez',        position: 'Treasurer',   phone: '+63 917 211 3303', email: 'mblopez.malitlit@sk.gov.ph',   term: '2023–2025' },
  // Malusak
  { id: 'SK-L01', barangay: 'Malusak',  name: 'Lorraine V. Uy',       position: 'Chairperson', phone: '+63 917 312 4401', email: 'lvuy.malusak@sk.gov.ph',       term: '2023–2025' },
  { id: 'SK-L02', barangay: 'Malusak',  name: 'Rex A. Domingo',       position: 'Secretary',   phone: '+63 917 312 4402', email: 'radomingo.malusak@sk.gov.ph',  term: '2023–2025' },
  { id: 'SK-L03', barangay: 'Malusak',  name: 'Aileen T. Menor',      position: 'Treasurer',   phone: '+63 917 312 4403', email: 'atmenor.malusak@sk.gov.ph',    term: '2023–2025' },
  // Market Area
  { id: 'SK-M01', barangay: 'Market Area', name: 'Julius C. Bernardo',position: 'Chairperson', phone: '+63 917 413 5501', email: 'jcbernardo.market@sk.gov.ph',  term: '2023–2025' },
  { id: 'SK-M02', barangay: 'Market Area', name: 'Roselyn P. Tan',    position: 'Secretary',   phone: '+63 917 413 5502', email: 'rptan.market@sk.gov.ph',       term: '2023–2025' },
  { id: 'SK-M03', barangay: 'Market Area', name: 'Dante S. Ramirez',  position: 'Treasurer',   phone: '+63 917 413 5503', email: 'dsramirez.market@sk.gov.ph',   term: '2023–2025' },
  // Pooc
  { id: 'SK-N01', barangay: 'Pooc',     name: 'Christine A. Mateo',   position: 'Chairperson', phone: '+63 917 514 6601', email: 'camateo.pooc@sk.gov.ph',       term: '2023–2025' },
  { id: 'SK-N02', barangay: 'Pooc',     name: 'Dennis O. Velasco',    position: 'Secretary',   phone: '+63 917 514 6602', email: 'dovelasco.pooc@sk.gov.ph',     term: '2023–2025' },
  { id: 'SK-N03', barangay: 'Pooc',     name: 'Liza Mae C. Halili',   position: 'Treasurer',   phone: '+63 917 514 6603', email: 'lmhalili.pooc@sk.gov.ph',      term: '2023–2025' },
  // Pulong Santa Cruz
  { id: 'SK-O01', barangay: 'Pulong Santa Cruz', name: 'Eugene R. Dimaano', position: 'Chairperson', phone: '+63 917 615 7701', email: 'erdimaano.psc@sk.gov.ph', term: '2023–2025' },
  { id: 'SK-O02', barangay: 'Pulong Santa Cruz', name: 'Joy B. Macaraig',   position: 'Secretary',   phone: '+63 917 615 7702', email: 'jbmacaraig.psc@sk.gov.ph', term: '2023–2025' },
  { id: 'SK-O03', barangay: 'Pulong Santa Cruz', name: 'Aldrin P. Villar',  position: 'Treasurer',   phone: '+63 917 615 7703', email: 'apvillar.psc@sk.gov.ph',   term: '2023–2025' },
  // Santo Domingo
  { id: 'SK-P01', barangay: 'Santo Domingo', name: 'Angelica M. Gatdula',  position: 'Chairperson', phone: '+63 917 716 8801', email: 'amgatdula.sd@sk.gov.ph',   term: '2023–2025' },
  { id: 'SK-P02', barangay: 'Santo Domingo', name: 'Nico S. Buenaventura', position: 'Secretary',   phone: '+63 917 716 8802', email: 'nsbuenaventura.sd@sk.gov.ph',term: '2023–2025' },
  { id: 'SK-P03', barangay: 'Santo Domingo', name: 'Mariz T. Pineda',      position: 'Treasurer',   phone: '+63 917 716 8803', email: 'mtpineda.sd@sk.gov.ph',    term: '2023–2025' },
  // Sinalhan
  { id: 'SK-Q01', barangay: 'Sinalhan', name: 'Gilbert A. Montoya',   position: 'Chairperson', phone: '+63 917 817 9901', email: 'gamontoya.sinalhan@sk.gov.ph', term: '2023–2025' },
  { id: 'SK-Q02', barangay: 'Sinalhan', name: 'Leilanie C. Roque',    position: 'Secretary',   phone: '+63 917 817 9902', email: 'lcroque.sinalhan@sk.gov.ph',   term: '2023–2025' },
  { id: 'SK-Q03', barangay: 'Sinalhan', name: 'Raymond D. Solis',     position: 'Treasurer',   phone: '+63 917 817 9903', email: 'rdsolis.sinalhan@sk.gov.ph',   term: '2023–2025' },
  // Tagapo
  { id: 'SK-R01', barangay: 'Tagapo',   name: 'Danielle C. Abella',   position: 'Chairperson', phone: '+63 917 918 1001', email: 'dcabella.tagapo@sk.gov.ph',    term: '2023–2025' },
  { id: 'SK-R02', barangay: 'Tagapo',   name: 'Harold S. Alcantara',  position: 'Secretary',   phone: '+63 917 918 1002', email: 'hsalcantara.tagapo@sk.gov.ph', term: '2023–2025' },
  { id: 'SK-R03', barangay: 'Tagapo',   name: 'Trisha M. Espiritu',   position: 'Treasurer',   phone: '+63 917 918 1003', email: 'tmespiritu.tagapo@sk.gov.ph',  term: '2023–2025' },
]

// ─── PROJECTS ──────────────────────────────────────────────────────────────────
export const projects: ReportProject[] = [
  {
    id: 'PRJ-001', barangay: 'Balibago', category: 'Education',
    title: 'Youth Digital Literacy Program',
    status: 'ongoing', progress: 74,
    proposedBudget: 650_000, spent: 478_000,
    startDate: '2025-03-04', endDate: '2025-06-05',
    description: 'A combined soft-skills and digital literacy workshop series for senior high school youth including basic coding, online safety, and civic tech literacy.',
    needsReceiptScan: true,
    receipts: [
      { id: 'R-001A', projectId: 'PRJ-001', vendor: 'SM Santa Rosa Office Supplies', amount: 48_500, date: '2025-03-15', description: 'Workshop materials and printed modules' },
      { id: 'R-001B', projectId: 'PRJ-001', vendor: 'Tech4Youth Inc.', amount: 125_000, date: '2025-04-02', description: 'Facilitator fees & resource persons' },
    ]
  },
  {
    id: 'PRJ-002', barangay: 'Caingin', category: 'Health',
    title: 'Community Health Education Booths',
    status: 'upcoming', progress: 10,
    proposedBudget: 325_000, spent: 12_000,
    startDate: '2025-08-10', endDate: '2025-11-12',
    description: 'A barangay-wide health and nutrition campaign targeting student awareness, mental health advocacy, and safe community practices in coordination with RHU Santa Rosa.',
  },
  {
    id: 'PRJ-003', barangay: 'Dila', category: 'Environment',
    title: 'Youth Urban Agriculture Hub',
    status: 'ongoing', progress: 58,
    proposedBudget: 520_000, spent: 312_000,
    startDate: '2025-06-15', endDate: '2025-12-20',
    description: 'Building a vertical farming demonstration site with youth volunteers to promote sustainable food systems, waste composting, and clean environment practices.',
    receipts: [
      { id: 'R-003A', projectId: 'PRJ-003', vendor: 'Agri-Green Supplies', amount: 89_000, date: '2025-06-20', description: 'Seeds, soil, and planting containers' },
    ]
  },
  {
    id: 'PRJ-004', barangay: 'Don Jose', category: 'Arts & Culture',
    title: 'Cultural Arts and Performance Series',
    status: 'ongoing', progress: 88,
    proposedBudget: 470_000, spent: 420_000,
    startDate: '2025-05-22', endDate: '2025-09-03',
    description: 'Youth-driven art performances, local heritage storytelling, and civic celebration events across the barangay, culminating in a public art exhibition.',
  },
  {
    id: 'PRJ-005', barangay: 'Malitlit', category: 'Environment',
    title: 'Barangay Clean Water Drive',
    status: 'completed', progress: 100,
    proposedBudget: 340_000, spent: 340_000,
    startDate: '2025-04-08', endDate: '2025-06-12',
    description: 'Completed initiative to improve drinking water access, install water purification systems at community centers, and conduct awareness campaigns for water safety.',
  },
  {
    id: 'PRJ-006', barangay: 'Tagapo', category: 'Peace & Order',
    title: 'Community Safety Patrol Launch',
    status: 'upcoming', progress: 22,
    proposedBudget: 410_000, spent: 84_000,
    startDate: '2025-09-01', endDate: '2026-01-20',
    description: 'A neighborhood patrol and volunteer response training program for youth leaders, civic partners, and coordination with barangay tanod units.',
  },
  {
    id: 'PRJ-007', barangay: 'Macabling', category: 'Sports',
    title: 'Inter-Barangay Youth Sports Festival',
    status: 'ongoing', progress: 45,
    proposedBudget: 580_000, spent: 260_000,
    startDate: '2025-07-01', endDate: '2025-10-30',
    description: 'Organizing basketball, volleyball, and chess tournaments for youth aged 15–24 from all barangays. Includes medals, uniforms, and venue management.',
    needsReceiptScan: true,
    receipts: [
      { id: 'R-007A', projectId: 'PRJ-007', vendor: 'Sports World Laguna', amount: 95_000, date: '2025-07-10', description: 'Sports equipment and uniforms' },
    ]
  },
  {
    id: 'PRJ-008', barangay: 'Santo Domingo', category: 'Livelihood',
    title: 'Youth Entrepreneurship Bootcamp',
    status: 'completed', progress: 100,
    proposedBudget: 480_000, spent: 455_000,
    startDate: '2025-02-01', endDate: '2025-05-15',
    description: 'A 3-month intensive entrepreneurship training covering business planning, financial literacy, and product development for out-of-school youth.',
  },
  {
    id: 'PRJ-009', barangay: 'Aplaya', category: 'Education',
    title: 'Iskolar ng Kabataan Scholarship Drive',
    status: 'ongoing', progress: 62,
    proposedBudget: 720_000, spent: 445_000,
    startDate: '2025-06-01', endDate: '2026-03-31',
    description: 'Financial assistance program for college-bound youth from low-income households, covering tuition, allowance, and required school supplies.',
  },
  {
    id: 'PRJ-010', barangay: 'Sinalhan', category: 'Disaster Preparedness',
    title: 'Youth DRRM Training & Orientation',
    status: 'ongoing', progress: 80,
    proposedBudget: 295_000, spent: 235_000,
    startDate: '2025-05-10', endDate: '2025-08-30',
    description: 'Disaster Risk Reduction and Management (DRRM) orientations, basic life support, and emergency simulation drills for SK officers and youth volunteers.',
  },
  {
    id: 'PRJ-011', barangay: 'Labas', category: 'Health',
    title: 'Anti-Drug Awareness Outreach',
    status: 'completed', progress: 100,
    proposedBudget: 250_000, spent: 242_000,
    startDate: '2025-01-15', endDate: '2025-04-10',
    description: 'Community-based anti-drug campaign in coordination with PDEA-Laguna and barangay officials, including seminars, pledges, and information drives.',
  },
  {
    id: 'PRJ-012', barangay: 'Pooc', category: 'Sports',
    title: 'Barangay Mini Olympics',
    status: 'upcoming', progress: 5,
    proposedBudget: 380_000, spent: 18_000,
    startDate: '2025-10-01', endDate: '2025-11-15',
    description: 'Annual youth sports event covering athletics, swimming, badminton, and chess. Open to all residents 10–30 years old from Pooc.',
  },
  {
    id: 'PRJ-013', barangay: 'Market Area', category: 'Livelihood',
    title: 'Skills Training for Out-of-School Youth',
    status: 'ongoing', progress: 55,
    proposedBudget: 510_000, spent: 280_000,
    startDate: '2025-04-20', endDate: '2025-09-30',
    description: 'TESDA-aligned technical-vocational training for 18–30 year olds in areas of food processing, electrical installation, and consumer electronics servicing.',
  },
  {
    id: 'PRJ-014', barangay: 'Kanluran', category: 'Governance',
    title: 'KK Assembly & Youth Forum Series',
    status: 'ongoing', progress: 67,
    proposedBudget: 185_000, spent: 124_000,
    startDate: '2025-03-01', endDate: '2025-12-15',
    description: 'Quarterly Katipunan ng Kabataan assemblies with civic forums, project consultations, and youth governance awareness sessions.',
  },
  {
    id: 'PRJ-015', barangay: 'Ibaba', category: 'Environment',
    title: 'Coastal Cleanup & Mangrove Planting',
    status: 'completed', progress: 100,
    proposedBudget: 195_000, spent: 190_000,
    startDate: '2025-03-22', endDate: '2025-04-22',
    description: 'Earth month coastal cleanup drive along Laguna de Bay shorelines with mangrove planting, waste segregation, and livelihood tips for fisherfolk youth.',
  },
]

// ─── NEWS ─────────────────────────────────────────────────────────────────────
export const news: NewsItem[] = [
  {
    id: 'N-01', category: 'Transparency',
    title: 'Santa Rosa SK releases Q1 2025 Financial Transparency Report',
    date: 'July 17, 2025',
    summary: 'The City of Santa Rosa CYDO officially published the first quarterly SK transparency report for 2025, detailing budget utilization across all 18 barangays with a combined release of ₱39.2 million for youth programs.',
  },
  {
    id: 'N-02', category: 'City News',
    title: 'eSKala Citizen Suggestion Portal Now Active for All 18 Barangays',
    date: 'July 12, 2025',
    summary: 'Residents can now submit suggestions, comments, and project proposals directly through eSKala. SK officers from all 18 barangays are committed to reviewing all submissions within 15 business days.',
  },
  {
    id: 'N-03', category: 'Announcements',
    title: 'SK Federation President Joins City Council Education Committee',
    date: 'July 8, 2025',
    summary: 'The SK Federation President of Santa Rosa City, elected via BSKE 2023, officially assumed ex-officio member status in the Sangguniang Panlungsod Education & Youth Affairs Committee.',
  },
  {
    id: 'N-04', category: 'Programs',
    title: 'CYDO Launches Youth Leadership Summit 2025 for 400 Participants',
    date: 'June 30, 2025',
    summary: 'The City Youth Development Office launches its annual Youth Leadership Summit gathering 400 SK officers and youth volunteers for two days of governance training and team-building activities at Hotel Seda Nuvali.',
  },
  {
    id: 'N-05', category: 'Recognition',
    title: 'Macabling & Don Jose SKs Cited for Outstanding Financial Compliance',
    date: 'June 22, 2025',
    summary: 'Two Santa Rosa City barangay SK units were recognized by the DILG-Laguna office for exemplary compliance with SK financial reporting requirements and timely submission of liquidation documents.',
  },
  {
    id: 'N-06', category: 'Events',
    title: 'National Youth Day 2025 Celebration: Santa Rosa Joins Nationwide Rallies',
    date: 'June 12, 2025',
    summary: 'Santa Rosa City youth marked National Independence and Youth Day with civic marches, flag ceremonies, and a youth pledge drive involving all 18 barangay SK councils at the City Government Center plaza.',
  },
  {
    id: 'N-07', category: 'Policy',
    title: 'RA 11768 Amendment: Enhanced SK Fund Guidelines Effective July 2025',
    date: 'June 5, 2025',
    summary: 'Updated regulations under RA 11768 took effect this month, requiring all SK units to digitize quarterly financial reports and publish them publicly within 30 days of the close of each quarter.',
  },
  {
    id: 'N-08', category: 'City News',
    title: 'Santa Rosa Named Among Top Youth-Friendly Cities in Region IV-A',
    date: 'May 28, 2025',
    summary: 'Santa Rosa City received citation from the Regional Youth Development Office for consistent investment in youth sports, education, health, and livelihood programs — with SK programs playing a key role.',
  },
]

// ─── CITIZEN COMMENTS ─────────────────────────────────────────────────────────
export const citizenComments: CitizenComment[] = [
  { id: 'C-01', barangay: 'Balibago',  author: 'Jessa A.',    text: 'Very transparent! I can see exactly where the Digital Literacy funds are going. Kudos to SK Balibago!', date: 'July 18, 2025', type: 'comment', votes: 14 },
  { id: 'C-02', barangay: 'Caingin',   author: 'Renan D.',    text: 'Can we get more updates on the Community Health Booths? My family is looking forward to the free check-ups.', date: 'July 16, 2025', type: 'comment', votes: 8  },
  { id: 'C-03', barangay: 'Don Jose',  author: 'Mika L.',     text: 'The Cultural Arts series was amazing! Would love a follow-up event specifically for heritage arts.', date: 'July 15, 2025', type: 'suggestion', votes: 22 },
  { id: 'C-04', barangay: 'Macabling', author: 'Joshua T.',   text: 'Please add women\'s volleyball to the Sports Festival lineup. Many girls want to join!', date: 'July 14, 2025', type: 'suggestion', votes: 31 },
  { id: 'C-05', barangay: 'Aplaya',    author: 'Carmela R.',  text: 'Really appreciate the scholarship drive. My sister was a beneficiary last year — changed her life.', date: 'July 13, 2025', type: 'comment', votes: 18 },
  { id: 'C-06', barangay: 'Tagapo',    author: 'Adrian S.',   text: 'We need more budget transparency for the Safety Patrol project. What vehicles are being procured?', date: 'July 12, 2025', type: 'comment', votes: 9  },
  { id: 'C-07', barangay: 'Dila',      author: 'Patricia B.', text: 'Suggestion: Teach urban gardening techniques in our schools too, not just at the Hub. Involve teachers!', date: 'July 11, 2025', type: 'suggestion', votes: 17 },
  { id: 'C-08', barangay: 'Sinalhan',  author: 'Eugene M.',   text: 'The DRRM training schedule was not well-publicized. Please send announcements to our group chats!', date: 'July 10, 2025', type: 'comment', votes: 12 },
  { id: 'C-09', barangay: 'Labas',     author: 'Lorraine V.', text: 'Anti-drug program was effective. Please bring it back for parents and guardians next time.', date: 'July 9, 2025', type: 'suggestion', votes: 25 },
  { id: 'C-10', barangay: 'Kanluran',  author: 'Bianca N.',   text: 'The KK Assembly for June was so empowering. Please keep the youth forums regular!', date: 'July 8, 2025', type: 'comment', votes: 7  },
  { id: 'C-11', barangay: 'Pooc',      author: 'Ryan C.',     text: 'Looking forward to Barangay Mini Olympics! Please include swimming and badminton this year.', date: 'July 7, 2025', type: 'suggestion', votes: 19 },
  { id: 'C-12', barangay: 'Market Area',author: 'Gilbert S.', text: 'TESDA-aligned training is great but please also add NC II certification exams on-site.', date: 'July 6, 2025', type: 'suggestion', votes: 28 },
]

// ─── ACTIVITY LOGS ────────────────────────────────────────────────────────────
export const activityLogs: ActivityLog[] = [
  { id: 'L-001', user: 'Patricia Ann C. Dizon',  actor: 'Patricia Ann C. Dizon',  barangay: 'Balibago',      date: 'July 18, 2025 09:12', action: 'Project Updated: Youth Digital Literacy to 74% progress',         when: '2m ago',  timestamp: '2025-07-18 09:12', description: 'Progress updated by SK Chairperson' },
  { id: 'L-002', user: 'Kristine P. Lim',         actor: 'Kristine P. Lim',         barangay: 'Balibago',      date: 'July 18, 2025 08:44', action: 'Receipt Uploaded: Tech4Youth Inc. — ₱125,000',                     when: '30m ago', timestamp: '2025-07-18 08:44', description: 'OCR-verified receipt for Youth Digital Literacy Program' },
  { id: 'L-003', user: 'Diego A. Mercado',         actor: 'Diego A. Mercado',         barangay: 'Caingin',       date: 'July 18, 2025 08:14', action: 'Project Created: Community Health Education Booths (PRJ-002)',     when: '1h ago',  timestamp: '2025-07-18 08:14' },
  { id: 'L-004', user: 'Maria Lourdes T. Cruz',    actor: 'Maria Lourdes T. Cruz',    barangay: 'Dila',          date: 'July 18, 2025 07:22', action: 'Budget Disbursement Updated: Youth Urban Agriculture Hub ₱89,000', when: '2h ago',  timestamp: '2025-07-18 07:22' },
  { id: 'L-005', user: 'Adrian M. Torres',          actor: 'Adrian M. Torres',          barangay: 'Don Jose',      date: 'July 18, 2025 06:38', action: 'Project Updated: Cultural Arts Series status → ongoing',            when: '3h ago',  timestamp: '2025-07-18 06:38' },
  { id: 'L-006', user: 'Danielle C. Abella',        actor: 'Danielle C. Abella',        barangay: 'Tagapo',        date: 'July 18, 2025 05:52', action: 'Document Uploaded: Community Safety Patrol Launch proposal',        when: '4h ago',  timestamp: '2025-07-18 05:52' },
  { id: 'L-007', user: 'Gabriel A. Cruz',            actor: 'Gabriel A. Cruz',            barangay: 'Macabling',     date: 'July 18, 2025 04:10', action: 'Project Created: Inter-Barangay Youth Sports Festival (PRJ-007)',   when: '5h ago',  timestamp: '2025-07-18 04:10' },
  { id: 'L-008', user: 'SCC Super Admin',            actor: 'SCC Super Admin',            barangay: 'System',        date: 'July 18, 2025 03:22', action: 'News Published: SK Federation President Joins City Council',        when: '6h ago',  timestamp: '2025-07-18 03:22', description: 'City-wide announcement published' },
  { id: 'L-009', user: 'Angelica M. Gatdula',        actor: 'Angelica M. Gatdula',        barangay: 'Santo Domingo', date: 'July 17, 2025 14:00', action: 'Project Completed: Youth Entrepreneurship Bootcamp (PRJ-008)',     when: '1d ago',  timestamp: '2025-07-17 14:00' },
  { id: 'L-010', user: 'SCC Super Admin',            actor: 'SCC Super Admin',            barangay: 'System',        date: 'July 17, 2025 10:15', action: 'Account Created: sktreasurer@eskala.ph (Caingin – Treasurer)',      when: '1d ago',  timestamp: '2025-07-17 10:15' },
  { id: 'L-011', user: 'Reniel M. Santos',           actor: 'Reniel M. Santos',           barangay: 'Aplaya',        date: 'July 16, 2025 09:40', action: 'Receipt Uploaded: Iskolar ng Kabataan Scholarship — BPI',           when: '2d ago',  timestamp: '2025-07-16 09:40' },
  { id: 'L-012', user: 'Gilbert A. Montoya',         actor: 'Gilbert A. Montoya',         barangay: 'Sinalhan',      date: 'July 16, 2025 08:30', action: 'Project Updated: Youth DRRM Training progress to 80%',              when: '2d ago',  timestamp: '2025-07-16 08:30' },
]

// ─── ACCOUNTS (for super admin management) ───────────────────────────────────
export const accounts: AccountRecord[] = [
  { id: 'u-admin',   name: 'SCC Super Admin',         email: 'superadmin@eskala.ph',     username: 'superadmin',  role: 'superadmin', isStaRosa: true,  status: 'active',   lastLogin: 'July 18, 2025 09:00', createdAt: 'Jan 1, 2025' },
  { id: 'u-sk-bal-c',name: 'Patricia Ann C. Dizon',   email: 'padizon.balibago@sk.gov.ph',username: 'skchair_bal',role: 'sk', barangay: 'Balibago', skPosition: 'Chairperson', isStaRosa: true, status: 'active', lastLogin: 'July 18, 2025 09:12', createdAt: 'Nov 1, 2023' },
  { id: 'u-sk-bal-s',name: 'Marco D. Villanueva',     email: 'mvillanueva.balibago@sk.gov.ph',username: 'sksec_bal',role: 'sk', barangay: 'Balibago', skPosition: 'Secretary', isStaRosa: true, status: 'active', lastLogin: 'July 17, 2025 16:00', createdAt: 'Nov 1, 2023' },
  { id: 'u-sk-bal-t',name: 'Kristine P. Lim',         email: 'klim.balibago@sk.gov.ph',   username: 'sktreasurer_bal',role: 'sk', barangay: 'Balibago', skPosition: 'Treasurer', isStaRosa: true, status: 'active', lastLogin: 'July 18, 2025 08:44', createdAt: 'Nov 1, 2023' },
  { id: 'u-sk-cai-c',name: 'Diego A. Mercado',        email: 'dmercado.caingin@sk.gov.ph',username: 'skchair_cai', role: 'sk', barangay: 'Caingin', skPosition: 'Chairperson', isStaRosa: true, status: 'active', lastLogin: 'July 18, 2025 08:14', createdAt: 'Nov 1, 2023' },
  { id: 'u-sk-cai-t',name: 'Nathan B. Gonzales',      email: 'ngonzales.caingin@sk.gov.ph',username: 'sktreasurer_cai', role: 'sk', barangay: 'Caingin', skPosition: 'Treasurer', isStaRosa: true, status: 'active', lastLogin: 'July 16, 2025 14:00', createdAt: 'Nov 1, 2023' },
  { id: 'u-cit-1',   name: 'Jessa Aquino',            email: 'jaquino@email.com',          username: 'jessaaquino',role: 'citizen', barangay: 'Balibago', isStaRosa: true, status: 'active', lastLogin: 'July 18, 2025 07:30', createdAt: 'Feb 14, 2025' },
  { id: 'u-cit-2',   name: 'Renan dela Cruz',         email: 'rdelacruz@email.com',        username: 'renandc',    role: 'citizen', barangay: 'Caingin',  isStaRosa: true, status: 'active', lastLogin: 'July 16, 2025 19:00', createdAt: 'Mar 5, 2025' },
  { id: 'u-cit-3',   name: 'Mika Lopez',              email: 'mlopez@email.com',           username: 'mikalopez',  role: 'citizen', barangay: 'Don Jose', isStaRosa: true, status: 'inactive', lastLogin: 'July 10, 2025 11:00', createdAt: 'Apr 1, 2025' },
  { id: 'u-cit-4',   name: 'Adrian Santos',           email: 'asantos@email.com',          username: 'adriansantos',role: 'citizen', barangay: 'Tagapo',  isStaRosa: true, status: 'active', lastLogin: 'July 17, 2025 20:00', createdAt: 'Apr 22, 2025' },
]

// ─── RECEIPTS ─────────────────────────────────────────────────────────────────
export const receipts: Receipt[] = [
  { id: 'R-001', projectId: 'PRJ-001', projectTitle: 'Youth Digital Literacy Program', barangay: 'Balibago',  vendor: 'Tech4Youth Inc.',           amount: 125_000, date: 'July 10, 2025',  status: 'verified', ocrExtracted: true  },
  { id: 'R-002', projectId: 'PRJ-001', projectTitle: 'Youth Digital Literacy Program', barangay: 'Balibago',  vendor: 'SM Appliances Sta. Rosa',   amount:  45_500, date: 'June 28, 2025',  status: 'verified', ocrExtracted: true  },
  { id: 'R-003', projectId: 'PRJ-003', projectTitle: 'Iskolar ng Kabataan Scholarship',barangay: 'Balibago',  vendor: 'BPI Scholarship Fund',      amount: 200_000, date: 'June 15, 2025',  status: 'verified', ocrExtracted: false },
  { id: 'R-004', projectId: 'PRJ-002', projectTitle: 'Community Health Education Booths',barangay: 'Caingin', vendor: 'PhilHealth Laguna',          amount:  38_000, date: 'July 5, 2025',   status: 'pending',  ocrExtracted: true  },
  { id: 'R-005', projectId: 'PRJ-005', projectTitle: 'Youth Urban Agriculture Hub',  barangay: 'Dila',      vendor: 'Nuvali Landscape Corp.',    amount:  89_000, date: 'July 3, 2025',   status: 'verified', ocrExtracted: true  },
  { id: 'R-006', projectId: 'PRJ-007', projectTitle: 'Inter-Barangay Youth Sports Festival',barangay:'Macabling', vendor: 'Sports HQ Calamba',   amount:  62_400, date: 'July 12, 2025',  status: 'pending',  ocrExtracted: false },
  { id: 'R-007', projectId: 'PRJ-004', projectTitle: 'Cultural Arts & Heritage Series',barangay: 'Don Jose',  vendor: 'Artisano Events Corp.',     amount:  55_000, date: 'July 8, 2025',   status: 'verified', ocrExtracted: true  },
  { id: 'R-008', projectId: 'PRJ-006', projectTitle: 'Community Safety Patrol Launch',barangay: 'Tagapo',    vendor: 'Signal Barangay Supply Co.',amount:  78_500, date: 'July 15, 2025',  status: 'pending',  ocrExtracted: false },
]
