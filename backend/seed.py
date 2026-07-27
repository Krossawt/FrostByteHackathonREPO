"""
eSKala — Database Seed Script
Populates the database with comprehensive mock data matching the frontend mockData.ts.
Run: python seed.py

All 18 barangays, SK officials (54+), seeded projects, purchase orders,
newsletter entries, comments, budget reports, and audit logs.
"""

import sys
import os
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, date, timedelta
from database import engine, SessionLocal, Base
import models
from models import (
    User, UserRole, Project, ProjectStatus, PurchaseOrder, OrderType,
    Comment, CommentType, Newsletter, AnnualBudgetReport, AuditLog
)
from auth import hash_password

Base.metadata.create_all(bind=engine)

def seed():
    db = SessionLocal()
    try:
        # Skip if already fully seeded (more than 10 users exist)
        if db.query(User).count() > 10:
            print("✅ Database already fully seeded. Skipping.")
            return

        print("🌱 Seeding eSKala database...")

        # ─── SUPER ADMIN ───────────────────────────────────────────────────────
        super_admin = db.query(User).filter(User.userEmail == "superadmin@eskala.ph").first()
        if not super_admin:
            super_admin = User(
                userName="SCC Super Admin",
                userEmail="superadmin@eskala.ph",
                userHashedPassword=hash_password("Admin2026!"),
                userRole=UserRole.SUPER_ADMIN,
                userLocation="Santa Rosa City",
                userIsStaRosa=True,
                userIsSK=False,
                userIsActive=True,
                userIsDeleted=False,
            )
            db.add(super_admin)
            db.flush()
            print(f"  ✔ Super Admin: superadmin@eskala.ph / Admin2026!")
        else:
            print(f"  ✔ Super Admin already present.")

        # ─── SK OFFICIALS (all 18 barangays × 3 roles each = 54) ───────────────
        sk_data = [
            # Barangay, Name, Role, Email, TermStart, TermEnd
            # Aplaya
            ("Aplaya",          "Reniel M. Santos",         UserRole.CHAIRPERSON, "rsantos.aplaya@sk.gov.ph",         "2023-11-30", "2025-11-29"),
            ("Aplaya",          "Carmela B. Flores",        UserRole.SECRETARY,   "cflores.aplaya@sk.gov.ph",         "2023-11-30", "2025-11-29"),
            ("Aplaya",          "Joshua L. Reyes",          UserRole.TREASURER,   "jreyes.aplaya@sk.gov.ph",          "2023-11-30", "2025-11-29"),
            # Balibago
            ("Balibago",        "Patricia Ann C. Dizon",    UserRole.CHAIRPERSON, "padizon.balibago@sk.gov.ph",       "2023-11-30", "2025-11-29"),
            ("Balibago",        "Marco D. Villanueva",      UserRole.SECRETARY,   "mvillanueva.balibago@sk.gov.ph",   "2023-11-30", "2025-11-29"),
            ("Balibago",        "Kristine P. Lim",          UserRole.TREASURER,   "klim.balibago@sk.gov.ph",          "2023-11-30", "2025-11-29"),
            # Caingin
            ("Caingin",         "Diego A. Mercado",         UserRole.CHAIRPERSON, "dmercado.caingin@sk.gov.ph",       "2023-11-30", "2025-11-29"),
            ("Caingin",         "Alyssa R. Dela Cruz",      UserRole.SECRETARY,   "ardelacruz.caingin@sk.gov.ph",     "2023-11-30", "2025-11-29"),
            ("Caingin",         "Nathan B. Gonzales",       UserRole.TREASURER,   "ngonzales.caingin@sk.gov.ph",      "2023-11-30", "2025-11-29"),
            # Dila
            ("Dila",            "Maria Lourdes T. Cruz",    UserRole.CHAIRPERSON, "mltcruz.dila@sk.gov.ph",           "2023-11-30", "2025-11-29"),
            ("Dila",            "Kevin S. Aguilar",         UserRole.SECRETARY,   "kaguilar.dila@sk.gov.ph",          "2023-11-30", "2025-11-29"),
            ("Dila",            "Hannah Mae F. Ocampo",     UserRole.TREASURER,   "hmocampo.dila@sk.gov.ph",          "2023-11-30", "2025-11-29"),
            # Dita
            ("Dita",            "Jerome R. Valdez",         UserRole.CHAIRPERSON, "jrvaldez.dita@sk.gov.ph",          "2023-11-30", "2025-11-29"),
            ("Dita",            "Sophia G. Pascual",        UserRole.SECRETARY,   "sgpascual.dita@sk.gov.ph",         "2023-11-30", "2025-11-29"),
            ("Dita",            "Elaine C. Castillo",       UserRole.TREASURER,   "ecastillo.dita@sk.gov.ph",         "2023-11-30", "2025-11-29"),
            # Don Jose
            ("Don Jose",        "Adrian M. Torres",         UserRole.CHAIRPERSON, "amtorres.donjose@sk.gov.ph",       "2023-11-30", "2025-11-29"),
            ("Don Jose",        "Bianca N. Ramos",          UserRole.SECRETARY,   "bnramos.donjose@sk.gov.ph",        "2023-11-30", "2025-11-29"),
            ("Don Jose",        "Carlo P. Santiago",        UserRole.TREASURER,   "cpsantiago.donjose@sk.gov.ph",     "2023-11-30", "2025-11-29"),
            # Ibaba
            ("Ibaba",           "Lea M. Fernandez",         UserRole.CHAIRPERSON, "lmfernandez.ibaba@sk.gov.ph",      "2023-11-30", "2025-11-29"),
            ("Ibaba",           "Mark A. Rivera",           UserRole.SECRETARY,   "marivera.ibaba@sk.gov.ph",         "2023-11-30", "2025-11-29"),
            ("Ibaba",           "Nicole S. Bernal",         UserRole.TREASURER,   "nsbernal.ibaba@sk.gov.ph",         "2023-11-30", "2025-11-29"),
            # Kanluran
            ("Kanluran",        "Ryan C. Macaraeg",         UserRole.CHAIRPERSON, "rcmacaraeg.kanluran@sk.gov.ph",    "2023-11-30", "2025-11-29"),
            ("Kanluran",        "Ria L. Panganiban",        UserRole.SECRETARY,   "rlpanganiban.kanluran@sk.gov.ph",  "2023-11-30", "2025-11-29"),
            ("Kanluran",        "Joseph D. Aquino",         UserRole.TREASURER,   "jdaquino.kanluran@sk.gov.ph",      "2023-11-30", "2025-11-29"),
            # Labas
            ("Labas",           "Vanessa O. Medina",        UserRole.CHAIRPERSON, "vomedina.labas@sk.gov.ph",         "2023-11-30", "2025-11-29"),
            ("Labas",           "Christian T. Soriano",     UserRole.SECRETARY,   "ctsoriano.labas@sk.gov.ph",        "2023-11-30", "2025-11-29"),
            ("Labas",           "Pamela G. Vidal",          UserRole.TREASURER,   "pgvidal.labas@sk.gov.ph",          "2023-11-30", "2025-11-29"),
            # Macabling
            ("Macabling",       "Gabriel A. Cruz",          UserRole.CHAIRPERSON, "gacruz.macabling@sk.gov.ph",       "2023-11-30", "2025-11-29"),
            ("Macabling",       "Diana Rose M. Santos",     UserRole.SECRETARY,   "drmsantos.macabling@sk.gov.ph",    "2023-11-30", "2025-11-29"),
            ("Macabling",       "Erwin P. Lopez",           UserRole.TREASURER,   "eplopez.macabling@sk.gov.ph",      "2023-11-30", "2025-11-29"),
            # Malitlit
            ("Malitlit",        "Jessa A. Aquino",          UserRole.CHAIRPERSON, "jaaquino.malitlit@sk.gov.ph",      "2023-11-30", "2025-11-29"),
            ("Malitlit",        "Renan D. dela Cruz",       UserRole.SECRETARY,   "rddelacruz.malitlit@sk.gov.ph",    "2023-11-30", "2025-11-29"),
            ("Malitlit",        "Mika B. Lopez",            UserRole.TREASURER,   "mblopez.malitlit@sk.gov.ph",       "2023-11-30", "2025-11-29"),
            # Malusak
            ("Malusak",         "Lorraine V. Uy",           UserRole.CHAIRPERSON, "lvuy.malusak@sk.gov.ph",           "2023-11-30", "2025-11-29"),
            ("Malusak",         "Rex A. Domingo",           UserRole.SECRETARY,   "radomingo.malusak@sk.gov.ph",      "2023-11-30", "2025-11-29"),
            ("Malusak",         "Aileen T. Menor",          UserRole.TREASURER,   "atmenor.malusak@sk.gov.ph",        "2023-11-30", "2025-11-29"),
            # Market Area
            ("Market Area",     "Julius C. Bernardo",       UserRole.CHAIRPERSON, "jcbernardo.market@sk.gov.ph",      "2023-11-30", "2025-11-29"),
            ("Market Area",     "Roselyn P. Tan",           UserRole.SECRETARY,   "rptan.market@sk.gov.ph",           "2023-11-30", "2025-11-29"),
            ("Market Area",     "Dante S. Ramirez",         UserRole.TREASURER,   "dsramirez.market@sk.gov.ph",       "2023-11-30", "2025-11-29"),
            # Pooc
            ("Pooc",            "Christine A. Mateo",       UserRole.CHAIRPERSON, "camateo.pooc@sk.gov.ph",           "2023-11-30", "2025-11-29"),
            ("Pooc",            "Dennis O. Velasco",        UserRole.SECRETARY,   "dovelasco.pooc@sk.gov.ph",         "2023-11-30", "2025-11-29"),
            ("Pooc",            "Liza Mae C. Halili",       UserRole.TREASURER,   "lmhalili.pooc@sk.gov.ph",          "2023-11-30", "2025-11-29"),
            # Pulong Santa Cruz
            ("Pulong Santa Cruz","Eugene R. Dimaano",       UserRole.CHAIRPERSON, "erdimaano.psc@sk.gov.ph",          "2023-11-30", "2025-11-29"),
            ("Pulong Santa Cruz","Joy B. Macaraig",         UserRole.SECRETARY,   "jbmacaraig.psc@sk.gov.ph",         "2023-11-30", "2025-11-29"),
            ("Pulong Santa Cruz","Harvey C. Delgado",       UserRole.TREASURER,   "hcdelgado.psc@sk.gov.ph",          "2023-11-30", "2025-11-29"),
            # Santo Domingo
            ("Santo Domingo",   "Karen M. Reyes",           UserRole.CHAIRPERSON, "kmreyes.santodomingo@sk.gov.ph",   "2023-11-30", "2025-11-29"),
            ("Santo Domingo",   "Alfred G. Navarro",        UserRole.SECRETARY,   "agnavarro.santodomingo@sk.gov.ph", "2023-11-30", "2025-11-29"),
            ("Santo Domingo",   "Cheryl A. Guevarra",       UserRole.TREASURER,   "caguevarra.santodomingo@sk.gov.ph","2023-11-30", "2025-11-29"),
            # Sinalhan
            ("Sinalhan",        "Paolo T. Reyes",           UserRole.CHAIRPERSON, "ptreyes.sinalhan@sk.gov.ph",       "2023-11-30", "2025-11-29"),
            ("Sinalhan",        "Marivic O. Santos",        UserRole.SECRETARY,   "mosantos.sinalhan@sk.gov.ph",      "2023-11-30", "2025-11-29"),
            ("Sinalhan",        "Ronald B. Garcia",         UserRole.TREASURER,   "rbgarcia.sinalhan@sk.gov.ph",      "2023-11-30", "2025-11-29"),
            # Tagapo
            ("Tagapo",          "Jasmine C. Manalastas",    UserRole.CHAIRPERSON, "jcmanalastas.tagapo@sk.gov.ph",    "2023-11-30", "2025-11-29"),
            ("Tagapo",          "Mark L. Bonifacio",        UserRole.SECRETARY,   "mlbonifacio.tagapo@sk.gov.ph",     "2023-11-30", "2025-11-29"),
            ("Tagapo",          "Anna Grace T. Peralta",    UserRole.TREASURER,   "agtperalta.tagapo@sk.gov.ph",      "2023-11-30", "2025-11-29"),
        ]

        sk_user_map = {}  # email -> User object
        for barangay, name, role, email, term_start, term_end in sk_data:
            existing_u = db.query(User).filter(User.userEmail == email).first()
            if existing_u:
                sk_user_map[email] = existing_u
            else:
                u = User(
                    userName=name,
                    userEmail=email,
                    userHashedPassword=hash_password("Sk2026!"),
                    userRole=role,
                    userLocation=barangay,
                    userIsStaRosa=True,
                    userIsSK=True,
                    userSKTermStart=date.fromisoformat(term_start),
                    userSKTermEnd=date.fromisoformat(term_end),
                    userIsActive=True,
                    userIsDeleted=False,
                )
                db.add(u)
                db.flush()
                sk_user_map[email] = u

        print(f"  ✔ SK officials verified/seeded across all 18 barangays")

        # ─── CITIZEN ACCOUNTS ─────────────────────────────────────────────────
        citizens_data = [
            ("Juan dela Cruz",      "citizen@eskala.ph",           "Citizen2026!",  "Balibago"),
            ("Maria Santos",        "maria.santos@gmail.com",       "Citizen2026!",  "Don Jose"),
            ("Roberto Aquino",      "roberto.aquino@gmail.com",     "Citizen2026!",  "Tagapo"),
            ("Luz Bautista",        "luz.bautista@gmail.com",       "Citizen2026!",  "Aplaya"),
        ]
        citizen_users = []
        for name, email, pwd, barangay in citizens_data:
            u = User(
                userName=name,
                userEmail=email,
                userHashedPassword=hash_password(pwd),
                userRole=UserRole.GUEST,
                userLocation=barangay,
                userIsStaRosa=True,
                userIsSK=False,
                userIsActive=True,
                userIsDeleted=False,
            )
            db.add(u)
            db.flush()
            citizen_users.append(u)

        print(f"  ✔ {len(citizen_users)} citizen accounts seeded")

        # ─── ANNUAL BUDGET REPORTS ────────────────────────────────────────────
        budget_data = [
            ("Aplaya",          2025, 0),
            ("Balibago",        2025, 0),
            ("Caingin",         2025, 0),
            ("Dila",            2025, 0),
            ("Dita",            2025, 0),
            ("Don Jose",        2025, 0),
            ("Ibaba",           2025, 0),
            ("Kanluran",        2025, 0),
            ("Labas",           2025, 0),
            ("Macabling",       2025, 0),
            ("Malitlit",        2025, 0),
            ("Malusak",         2025, 0),
            ("Market Area",     2025, 0),
            ("Pooc",            2025, 0),
            ("Pulong Santa Cruz",2025,0),
            ("Santo Domingo",   2025, 0),
            ("Sinalhan",        2025, 0),
            ("Tagapo",          2025, 0),
            # 2024 historical data for Balibago and Don Jose
            ("Balibago",        2024, 0),
            ("Don Jose",        2024, 0),
        ]

        treasurer_map = {}
        for email, u in sk_user_map.items():
            if u.userRole == UserRole.TREASURER:
                treasurer_map[u.userLocation] = u

        for barangay, year, value in budget_data:
            treasurer = treasurer_map.get(barangay)
            report = AnnualBudgetReport(
                budgetBarangay=barangay,
                budgetUploadedBy=treasurer.userID if treasurer else super_admin.userID,
                budgetYear=year,
                budgetValue=value,
                isOCRScanned=True,
                isManuallyOverridden=False,
                budgetUploadedOn=datetime(2025, 1, 15, 9, 0),
            )
            db.add(report)

        print(f"  ✔ {len(budget_data)} annual budget reports seeded")
        db.flush()

        # ─── PROJECTS ─────────────────────────────────────────────────────────
        now = datetime.utcnow()
        chair_map = {u.userLocation: u for u in sk_user_map.values() if u.userRole == UserRole.CHAIRPERSON}

        projects_data = [
            # (barangay, name, desc, start, end, budget, breakdown, status, category, progress)
            (
                "Balibago", "Youth Leadership Seminar 2025",
                "A 3-day leadership training and seminar for SK youth leaders in Barangay Balibago, covering governance, communication, and community service.",
                datetime(2025, 3, 1), datetime(2025, 3, 3),
                95_000, 88_500, ProjectStatus.POSTED, "Youth Development", 100
            ),
            (
                "Balibago", "Basketball League — Summer 2025",
                "Inter-street basketball tournament open to all youth ages 15–30 in Barangay Balibago. 16 teams registered.",
                datetime(2025, 4, 10), datetime(2025, 5, 15),
                120_000, 115_200, ProjectStatus.POSTED, "Sports", 100
            ),
            (
                "Balibago", "Outreach Program — School Supplies",
                "Distribution of school supplies to 250 underprivileged students in Balibago for the 2025–2026 school year.",
                datetime(2025, 6, 1), datetime(2025, 6, 30),
                80_000, None, ProjectStatus.FINANCE_UPDATE, "Education", 40
            ),
            (
                "Don Jose", "Health & Wellness Fair 2025",
                "Free medical consultation, blood pressure check, blood sugar testing, and dental check-up. In partnership with Santa Rosa City Health Office.",
                datetime(2025, 2, 14), datetime(2025, 2, 15),
                150_000, 142_800, ProjectStatus.POSTED, "Health", 100
            ),
            (
                "Don Jose", "SK Don Jose Mini Olympics",
                "Athletic meets and team sports for youth of Don Jose including track, badminton, table tennis, and volleyball.",
                datetime(2025, 7, 1), datetime(2025, 7, 31),
                180_000, None, ProjectStatus.DRAFTED, "Sports", 5
            ),
            (
                "Tagapo", "Environmental Clean-Up Drive",
                "Monthly clean-up of Tagapo Creek and surrounding areas with partner organizations and local youth volunteers.",
                datetime(2025, 1, 20), datetime(2025, 12, 20),
                60_000, 54_300, ProjectStatus.POSTED, "Environment", 85
            ),
            (
                "Tagapo", "Digital Literacy Workshop",
                "10-session digital literacy program for out-of-school youth covering basic computing, internet safety, and job-readiness skills.",
                datetime(2025, 8, 5), datetime(2025, 9, 30),
                75_000, None, ProjectStatus.FOR_APPROVAL, "Education", 75
            ),
            (
                "Macabling", "Livelihood Training — Entrepreneurship 101",
                "Skills training for youth entrepreneurs focusing on bakery/pastry-making, online selling, and basic financial management.",
                datetime(2025, 5, 5), datetime(2025, 5, 30),
                110_000, 105_600, ProjectStatus.POSTED, "Livelihood", 100
            ),
            (
                "Aplaya", "Community Garden Project",
                "Creation of a 500 sqm urban garden in Aplaya basketball court area. Youth volunteers will manage planting, harvesting, and distribution.",
                datetime(2025, 9, 1), datetime(2025, 11, 30),
                90_000, None, ProjectStatus.FINANCE_UPDATE, "Environment", 30
            ),
            (
                "Market Area", "SK Market Area Youth Assembly 2025",
                "Quarterly youth assembly to discuss community concerns, present project updates, and vote on community agenda.",
                datetime(2025, 3, 15), datetime(2025, 3, 15),
                30_000, 28_500, ProjectStatus.POSTED, "Governance", 100
            ),
            (
                "Santo Domingo", "First Aid and Disaster Preparedness Training",
                "1-day DRRM seminar and hands-on first aid training for 80 youth volunteers in Santo Domingo in partnership with RDRRMC Laguna.",
                datetime(2025, 4, 22), datetime(2025, 4, 22),
                45_000, 43_200, ProjectStatus.POSTED, "Safety", 100
            ),
            (
                "Pulong Santa Cruz", "Computer Literacy for Seniors",
                "5-session basic computer and smartphone literacy program for senior citizens of Pulong Santa Cruz, taught by SK youth volunteers.",
                datetime(2025, 10, 1), datetime(2025, 10, 31),
                55_000, None, ProjectStatus.DRAFTED, "Education", 0
            ),
        ]

        project_objects = []
        for (barangay, name, desc, start, end, budget, breakdown, status, category, progress) in projects_data:
            chair = chair_map.get(barangay, super_admin)
            p = Project(
                projectName=name,
                projectDescription=desc,
                projectStartTime=start,
                projectEndTime=end,
                projectLocation=barangay,
                projectCreatedBy=chair.userID,
                projectBudget=budget,
                projectBreakdown=breakdown,
                projectStatus=status,
                projectCategory=category,
                projectProgress=progress,
                isDeleted=False,
                createdAt=datetime(2025, 1, 10) + timedelta(days=len(project_objects) * 5),
                updatedAt=now,
            )
            db.add(p)
            db.flush()
            project_objects.append(p)

        print(f"  ✔ {len(project_objects)} projects seeded")

        # ─── PURCHASE ORDERS ──────────────────────────────────────────────────
        # Add POs to posted projects
        posted_projects_with_breakdown = [p for p in project_objects if p.projectStatus == ProjectStatus.POSTED and p.projectBreakdown]

        po_count = 0
        for i, project in enumerate(posted_projects_with_breakdown[:4]):
            treasurer = treasurer_map.get(project.projectLocation)
            po_items = [
                (f"Tarpaulin & Signage",  OrderType.PHYSICAL, 5,   350,  "PO"),
                (f"Sound System Rental",  OrderType.SERVICE,  1,  5000,  "PO"),
                (f"Meals & Snacks",       OrderType.PHYSICAL, 50,  150,  "PO"),
            ]
            for j, (name, otype, qty, price, prefix) in enumerate(po_items):
                order_id = f"{prefix}-{project.projectID:03d}-{j+1:02d}"
                po = PurchaseOrder(
                    orderID=order_id,
                    projectID=project.projectID,
                    orderName=name,
                    orderType=otype,
                    orderQty=qty,
                    orderPrice=price,
                    orderTotalPrice=qty * price,
                    isOCRScanned=True,
                    isManuallyOverridden=False,
                    isApproved=True,
                    approvedBy=chair_map.get(project.projectLocation, super_admin).userID,
                    createdAt=project.createdAt + timedelta(days=3),
                )
                db.add(po)
                po_count += 1

        print(f"  ✔ {po_count} purchase orders seeded")
        db.flush()

        # ─── NEWSLETTER ───────────────────────────────────────────────────────
        newsletter_data = [
            ("SK Balibago Completes Youth Leadership Seminar 2025",
             "The SK of Barangay Balibago successfully concluded its 3-day Youth Leadership Seminar last March 1–3, 2025. A total of 45 youth leaders participated in the intensive program covering governance, public speaking, and community service.",
             "SK Project Update", "Balibago", 88_500),
            ("Basketball League Concludes with Hugot Warriors as Champions",
             "After six weeks of intense competition, Hugot Warriors Balibago clinched the championship in the SK Balibago Summer Basketball League 2025. Finals were held at Balibago Multi-Purpose Court.",
             "SK Project Update", "Balibago", 115_200),
            ("Don Jose Youth Health Fair Serves 500+ Residents",
             "The SK of Don Jose conducted a free health fair on February 14–15, 2025. Over 500 residents availed of free medical consultations, blood sugar testing, and dental check-ups in partnership with SRCHO.",
             "Health & Wellness", "Don Jose", 142_800),
            ("Tagapo Creek Clean-Up: 3 Tons of Waste Removed",
             "January through March 2025, the SK Tagapo clean-up drive cleared over 3 metric tons of solid waste from the Tagapo Creek watershed. 85 youth volunteers participated over 8 sessions.",
             "Environment", "Tagapo", 54_300),
            ("SK Macabling Empowers 30 Youth Entrepreneurs",
             "Thirty youth entrepreneurs completed the Livelihood Training — Entrepreneurship 101 program. Graduates received starter kits and a certificate of completion from the SK of Macabling.",
             "Livelihood", "Macabling", 105_600),
            ("Market Area Youth Assembly Endorses 5 Community Projects",
             "The SK Market Area Youth Assembly held on March 15, 2025 at the Barangay Hall endorsed 5 new community improvement projects including a streetlight upgrade and drainage improvement initiative.",
             "Governance", "Market Area", 28_500),
            ("SK Santo Domingo Trains 80 Youth in First Aid & DRRM",
             "In partnership with RDRRMC Laguna, the SK of Santo Domingo conducted a full-day First Aid and Disaster Preparedness Training on April 22, 2025. Participants received CPR and basic life support certifications.",
             "Safety & Health", "Santo Domingo", 43_200),
            ("eSKala System Officially Launched for Santa Rosa City",
             "The City Government of Santa Rosa officially launched eSKala — the digital SK financial transparency portal — during the 2025 City Youth Summit held at the Santa Rosa City Hall. All 18 SK chapters are now onboarded.",
             "City Announcement", None, None),
        ]

        for i, (title, summary, category, location, breakdown) in enumerate(newsletter_data):
            # Link first 7 to projects
            project_id = project_objects[i].projectID if i < len(project_objects) and project_objects[i].projectStatus == ProjectStatus.POSTED else None
            nl = Newsletter(
                projectID=project_id,
                title=title,
                summary=summary,
                category=category,
                projectLocation=location,
                projectBreakdown=breakdown,
                authorID=super_admin.userID,
                isPublished=True,
                isDeleted=False,
                publishedAt=datetime(2025, 3, 1) + timedelta(days=i * 14),
                createdAt=datetime(2025, 3, 1) + timedelta(days=i * 14),
            )
            db.add(nl)

        print(f"  ✔ {len(newsletter_data)} newsletter entries seeded")

        # ─── CITIZEN COMMENTS ─────────────────────────────────────────────────
        posted_project = next((p for p in project_objects if p.projectStatus == ProjectStatus.POSTED), None)

        if posted_project and citizen_users:
            comments_data = [
                (citizen_users[0], "Great initiative by SK Balibago! Hope to see more sports events throughout the year.", CommentType.COMMENT),
                (citizen_users[1], "I suggest adding a women's volleyball category next time to include more youth.", CommentType.SUGGESTION),
                (citizen_users[2], "The venue was great but could use better lighting for evening games. Please consider for next event.", CommentType.SUGGESTION),
                (citizen_users[3], "Very well-organized event! Thank you SK Balibago for your hard work and dedication.", CommentType.COMMENT),
            ]
            root_comment = None
            for author, text, ctype in comments_data:
                c = Comment(
                    commentFor=posted_project.projectID,
                    parentCommentID=None,
                    authorID=author.userID,
                    commentName=author.userName,
                    commentDetails=text,
                    commentType=ctype,
                    votesCount=0,
                    commentTimestamp=datetime(2025, 5, 20) + timedelta(hours=comments_data.index((author, text, ctype)) * 3),
                )
                db.add(c)
                db.flush()
                if root_comment is None:
                    root_comment = c

            # SK Chairperson reply to first comment
            if root_comment:
                chair = chair_map.get(posted_project.projectLocation)
                if chair:
                    reply = Comment(
                        commentFor=posted_project.projectID,
                        parentCommentID=root_comment.commentID,
                        authorID=chair.userID,
                        commentName=chair.userName,
                        commentDetails="Thank you for your support! We are planning more sports events for the second semester. Stay tuned!",
                        commentType=CommentType.COMMENT,
                        votesCount=0,
                        commentTimestamp=datetime(2025, 5, 21, 9, 0),
                    )
                    db.add(reply)

        # ─── AUDIT LOGS ───────────────────────────────────────────────────────
        audit_entries = [
            (super_admin, "System Initialized", "system", None, "eSKala database initialized and seeded with mock data for all 18 barangays of Santa Rosa City."),
            (super_admin, "Account Created — SK Chairperson", "accounts", None, "Bulk creation of 18 SK Chairperson accounts for all barangays."),
            (super_admin, "Account Created — SK Secretary", "accounts", None, "Bulk creation of 18 SK Secretary accounts for all barangays."),
            (super_admin, "Account Created — SK Treasurer", "accounts", None, "Bulk creation of 18 SK Treasurer accounts for all barangays."),
            (super_admin, "Newsletter Published", "newsletter", None, "eSKala System officially launched announcement published."),
        ]

        for i, (actor, action, module, target_id, details) in enumerate(audit_entries):
            entry = AuditLog(
                actorID=actor.userID,
                actorName=actor.userName,
                actorRole=actor.userRole.value,
                barangay=None,
                actionType=action,
                targetModule=module,
                targetID=str(target_id) if target_id else None,
                details=details,
                timestamp=datetime(2025, 1, 10, 8, 0) + timedelta(hours=i),
            )
            db.add(entry)

        print(f"  ✔ {len(audit_entries)} audit log entries seeded")

        db.commit()
        print("\n🎉 Database seeding complete!")
        print("\n─── Login Credentials ────────────────────────────────────")
        print("  Super Admin:     superadmin@eskala.ph        / Admin2026!")
        print("  SK Chairperson:  padizon.balibago@sk.gov.ph  / Sk2026!")
        print("  SK Secretary:    mvillanueva.balibago@sk.gov.ph / Sk2026!")
        print("  SK Treasurer:    klim.balibago@sk.gov.ph     / Sk2026!")
        print("  Citizen:         citizen@eskala.ph            / Citizen2026!")
        print("──────────────────────────────────────────────────────────")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Seeding failed: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
