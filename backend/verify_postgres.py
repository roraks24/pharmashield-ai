"""Verification script for PostgreSQL connection, schema initialization, and complaint flow."""
import asyncio
from sqlalchemy import text, select
from database import engine, init_db, AsyncSessionLocal
from models.db_models import ComplaintDB, AnalysisDB
from services.complaint_service import ComplaintService
from models.complaint import ComplaintCreate
from datetime import datetime


async def run_verification():
    print("=" * 60)
    print("STEP 1: Testing PostgreSQL Connection")
    print("=" * 60)
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT current_database(), current_user, version();"))
            db_name, user, version = result.fetchone()
            print(f"Connection Status: SUCCESS")
            print(f"Database Name:     {db_name}")
            print(f"Database User:     {user}")
            print(f"PostgreSQL Build:  {version.split(',')[0]}")
    except Exception as exc:
        print(f"Connection Status: FAILED ({exc})")
        return False

    print("\n" + "=" * 60)
    print("STEP 2: Creating Tables in aivoa_qms via SQLAlchemy Models")
    print("=" * 60)
    await init_db()
    print("Table creation executed successfully.")

    print("\n" + "=" * 60)
    print("STEP 3: Verifying Tables in PostgreSQL Schema")
    print("=" * 60)
    async with engine.connect() as conn:
        result = await conn.execute(text(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
        ))
        tables = [row[0] for row in result.fetchall()]
        print(f"Tables in 'public' schema: {tables}")
        if "complaints" in tables and "analyses" in tables:
            print("Table Verification: SUCCESS (both 'complaints' and 'analyses' exist)")
        else:
            print("Table Verification: FAILED (missing tables)")
            return False

    print("\n" + "=" * 60)
    print("STEP 4: Testing Complaint Creation & Query Flow in PostgreSQL")
    print("=" * 60)
    async with AsyncSessionLocal() as session:
        # Create a safe test complaint
        test_complaint = ComplaintCreate(
            complaint_source="Email",
            customer_name="PharmaCorp QA",
            product_name="Amoxicillin 500mg",
            batch_number="VERIFY-PG-001",
            description="Automated PostgreSQL verification test complaint.",
            severity="MEDIUM",
            priority="MEDIUM",
            status="Open",
        )
        created = await ComplaintService.create_complaint(session, test_complaint)
        complaint_id = str(created.id)
        print(f"Complaint Created in PostgreSQL: ID = {complaint_id[:8]}...")

        # Store test analysis
        test_analysis = {
            "summary": "Automated verification complaint for Amoxicillin 500mg.",
            "completeness_score": 90,
            "missing_fields": ["expiry_date"],
            "risk_level": "MEDIUM",
            "risk_reason": "Verification test rationale.",
            "recommended_next_action": "Complete automated check.",
            "root_cause_hypotheses": ["Test hypothesis"],
            "capa_recommendations": ["Test CAPA action"],
            "duplicate_score": 0.0,
        }
        await ComplaintService.store_analysis(session, complaint_id, test_analysis)
        print(f"Analysis Linked & Stored in PostgreSQL for Complaint ID = {complaint_id[:8]}...")

        # Query back from PostgreSQL
        retrieved = await ComplaintService.get_complaint_with_analysis(session, complaint_id)
        assert retrieved["complaint"]["customer_name"] == "PharmaCorp QA"
        assert retrieved["analysis"] is not None
        assert retrieved["analysis"]["risk_level"] == "MEDIUM"
        print("Record Query & Validation: SUCCESS (data retrieved from PostgreSQL matches)")

    print("\n" + "=" * 60)
    print("ALL POSTGRESQL VERIFICATION STEPS PASSED SUCCESSFULLY!")
    print("=" * 60)
    return True


if __name__ == "__main__":
    success = asyncio.run(run_verification())
    exit(0 if success else 1)
