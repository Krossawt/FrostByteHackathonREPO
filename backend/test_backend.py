"""
eSKala — Backend API Suite & Health Verifier
Tests all FastAPI endpoints, RBAC security rules, JWT generation, and workflow transitions.
"""

import sys
import os
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def run_suite():
    print("==================================================")
    print("   eSKala FastAPI Backend Automated Test Suite    ")
    print("==================================================")
    
    passed = 0
    failed = 0

    def assert_test(name: str, condition: bool, details: str = ""):
        nonlocal passed, failed
        if condition:
            passed += 1
            print(f"[PASS] {name}")
        else:
            failed += 1
            print(f"[FAIL] {name} — {details}")

    # 1. Health Checks
    r = client.get("/")
    assert_test("Health Check Root (/) ", r.status_code == 200 and r.json().get("status") == "ok")

    r = client.get("/health")
    assert_test("Health Check Endpoint (/health)", r.status_code == 200 and r.json().get("database") == "connected")

    # 2. Super Admin Login
    admin_login = client.post("/api/v1/auth/login", json={
        "credential": "superadmin@eskala.ph",
        "password": "Admin2026!"
    })
    admin_ok = admin_login.status_code == 200 and "accessToken" in admin_login.json()
    assert_test("Super Admin JWT Login", admin_ok, f"Status: {admin_login.status_code}, Body: {admin_login.text}")
    admin_token = admin_login.json().get("accessToken") if admin_ok else None

    # 3. SK Chairperson Account Provisioning & Login
    if admin_token:
        # Create test SK Chairperson account if not existing
        res_acct = client.post("/api/v1/admin/accounts", headers={"Authorization": f"Bearer {admin_token}"}, json={
            "userName": "Patricia Dizon",
            "userEmail": "padizon.balibago@sk.gov.ph",
            "password": "Sk20262026!",
            "userRole": "SK Chairperson",
            "userLocation": "Balibago",
            "userIsSK": True,
            "userIsStaRosa": True
        })

    chair_login = client.post("/api/v1/auth/login", json={
        "credential": "padizon.balibago@sk.gov.ph",
        "password": "Sk20262026!"
    })
    chair_ok = chair_login.status_code == 200 and "accessToken" in chair_login.json()
    assert_test("SK Chairperson JWT Login", chair_ok, f"Status: {chair_login.status_code}")
    chair_token = chair_login.json().get("accessToken") if chair_ok else None

    # 4. Citizen Self-Registration
    import random
    rand_email = f"citizen_{random.randint(1000, 9999)}@example.com"
    reg = client.post("/api/v1/auth/register", json={
        "userName": "Test Citizen User",
        "userEmail": rand_email,
        "password": "Password123!",
        "userLocation": "Balibago",
        "userIsStaRosa": True
    })
    assert_test("Citizen Self-Registration", reg.status_code == 201 and "accessToken" in reg.json())

    # 5. Public Projects Listing
    projects_res = client.get("/api/v1/projects")
    assert_test("Public Projects API (/api/v1/projects)", projects_res.status_code == 200 and isinstance(projects_res.json(), list))

    # 6. SK Officer Create Project Proposal (RBAC)
    if chair_token:
        headers = {"Authorization": f"Bearer {chair_token}"}
        new_proj = client.post("/api/v1/projects", headers=headers, json={
            "projectName": "Automated Backend Test Youth Summit 2026",
            "projectDescription": "Comprehensive leadership development summit for barangay youth.",
            "projectStartTime": "2026-08-01T09:00:00Z",
            "projectEndTime": "2026-08-02T17:00:00Z",
            "projectLocation": "Balibago",
            "projectBudget": 150000.0,
            "projectCategory": "Sports & Recreation"
        })
        assert_test("SK Chairperson Create Project Draft", new_proj.status_code == 201, f"Status: {new_proj.status_code}, Body: {new_proj.text}")

    # 7. Super Admin Post Approved ABYIP Budget (RBAC)
    if admin_token:
        headers = {"Authorization": f"Bearer {admin_token}"}
        abyip = client.post("/api/v1/budget-reports", headers=headers, json={
            "budgetBarangay": "Balibago",
            "budgetYear": 2026,
            "budgetValue": 3500000.0
        })
        assert_test("Super Admin Post Approved ABYIP Budget", abyip.status_code == 201, f"Status: {abyip.status_code}, Body: {abyip.text}")

    # 8. Executive Summary Dashboard Metrics
    if admin_token:
        headers = {"Authorization": f"Bearer {admin_token}"}
        summary = client.get("/api/v1/reports/summary", headers=headers)
        assert_test(
            "Executive Dashboard Summary (/api/v1/reports/summary)",
            summary.status_code == 200 and "totalBudget" in summary.json() and "skOfficialsCount" in summary.json(),
        )

    # 9. Audit Trail Logging Verification
    if admin_token:
        headers = {"Authorization": f"Bearer {admin_token}"}
        audit = client.get("/api/v1/audit-logs", headers=headers)
        assert_test("Audit Trail Log Retrieval (/api/v1/audit-logs)", audit.status_code == 200 and len(audit.json()) > 0)

    # 10. RBAC Protection Check (Citizen trying to create project -> 403 Forbidden)
    citizen_token = reg.json().get("accessToken") if reg.status_code == 201 else None
    if citizen_token:
        headers = {"Authorization": f"Bearer {citizen_token}"}
        bad_proj = client.post("/api/v1/projects", headers=headers, json={
            "projectName": "Unauthorized Citizen Project",
            "projectStartTime": "2026-09-01T09:00:00Z",
            "projectEndTime": "2026-09-02T17:00:00Z",
            "projectLocation": "Balibago"
        })
        assert_test("RBAC Enforcement (Citizen denied project creation -> 403)", bad_proj.status_code == 403)

    print("==================================================")
    print(f"   Summary: {passed} PASSED, {failed} FAILED           ")
    print("==================================================")

    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    run_suite()
