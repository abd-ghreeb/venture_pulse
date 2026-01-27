import asyncio
from datetime import datetime, timezone
from sqlmodel import Session
from models.venture import Venture
from models.pilot_customer import PilotCustomer
from models.user import User
from models.db import engine

# The data provided in the prompt
ventures_data = [
    {
        "id": "1",
        "name": "PortFlow",
        "pod": "Infrastructure",
        "stage": "Scale",
        "founder": "Alex Chen",
        "health": "On Track",
        "monthlyBurn": 85000,
        "runway": 18,
        "nps": 72,
        "pilotCustomers": [
            {"id": "p1", "name": "Maersk Logistics", "contractValue": 120000, "startDate": "2024-01-15", "status": "Active"},
            {"id": "p2", "name": "DHL Express", "contractValue": 95000, "startDate": "2024-02-20", "status": "Active"},
            {"id": "p3", "name": "FedEx Ground", "contractValue": 78000, "startDate": "2024-03-10", "status": "Active"},
        ],
        "lastUpdate": "Closed Series A term sheet. Onboarding 2 new enterprise clients.",
        "burnHistory": [72000, 78000, 81000, 79000, 83000, 85000],
        "description": "AI-powered port logistics optimization platform",
    },
    {
        "id": "2",
        "name": "LogiChain",
        "pod": "Infrastructure",
        "stage": "Pilot",
        "founder": "Sarah Kim",
        "health": "At Risk",
        "monthlyBurn": 62000,
        "runway": 8,
        "nps": 45,
        "pilotCustomers": [
            {"id": "p4", "name": "Amazon Warehouse", "contractValue": 55000, "startDate": "2024-04-01", "status": "Active"},
            {"id": "p5", "name": "Target Distribution", "contractValue": 42000, "startDate": "2024-05-15", "status": "Pending"},
        ],
        "lastUpdate": "Need to close bridge round. Product-market fit still uncertain.",
        "burnHistory": [45000, 52000, 58000, 61000, 60000, 62000],
        "description": "Blockchain-based supply chain tracking",
    },
    {
        "id": "3",
        "name": "BioSync",
        "pod": "HealthTech",
        "stage": "Growth",
        "founder": "Dr. Maya Patel",
        "health": "On Track",
        "monthlyBurn": 145000,
        "runway": 24,
        "nps": 85,
        "pilotCustomers": [
            {"id": "p6", "name": "Mayo Clinic", "contractValue": 250000, "startDate": "2023-09-01", "status": "Active"},
            {"id": "p7", "name": "Cleveland Clinic", "contractValue": 180000, "startDate": "2023-11-15", "status": "Active"},
            {"id": "p8", "name": "Kaiser Permanente", "contractValue": 320000, "startDate": "2024-01-20", "status": "Active"},
            {"id": "p9", "name": "Johns Hopkins", "contractValue": 195000, "startDate": "2024-03-01", "status": "Active"},
        ],
        "lastUpdate": "FDA clearance received. Expanding to 15 new hospital networks.",
        "burnHistory": [110000, 118000, 125000, 132000, 140000, 145000],
        "description": "Real-time patient biosignal monitoring system",
    },
    {
        "id": "4",
        "name": "MedFlow",
        "pod": "HealthTech",
        "stage": "Validation",
        "founder": "James Liu",
        "health": "Critical",
        "monthlyBurn": 48000,
        "runway": 4,
        "nps": 28,
        "pilotCustomers": [
            {"id": "p10", "name": "Rural Health Network", "contractValue": 25000, "startDate": "2024-06-01", "status": "Churned"},
        ],
        "lastUpdate": "Lost key pilot customer. Pivoting product strategy. Urgent funding needed.",
        "burnHistory": [35000, 38000, 42000, 45000, 47000, 48000],
        "description": "Telemedicine platform for rural healthcare",
    },
    {
        "id": "5",
        "name": "PayStack",
        "pod": "FinTech",
        "stage": "Scale",
        "founder": "Emma Rodriguez",
        "health": "On Track",
        "monthlyBurn": 120000,
        "runway": 16,
        "nps": 68,
        "pilotCustomers": [
            {"id": "p11", "name": "Stripe SMB", "contractValue": 85000, "startDate": "2024-01-10", "status": "Active"},
            {"id": "p12", "name": "Square Merchants", "contractValue": 72000, "startDate": "2024-02-15", "status": "Active"},
            {"id": "p13", "name": "PayPal Business", "contractValue": 68000, "startDate": "2024-04-20", "status": "Active"},
        ],
        "lastUpdate": "Processing $2M monthly. Partnership talks with major bank.",
        "burnHistory": [95000, 102000, 108000, 112000, 118000, 120000],
        "description": "B2B payment orchestration platform",
    },
    {
        "id": "6",
        "name": "CreditLens",
        "pod": "FinTech",
        "stage": "Pilot",
        "founder": "Michael Park",
        "health": "At Risk",
        "monthlyBurn": 55000,
        "runway": 7,
        "nps": 52,
        "pilotCustomers": [
            {"id": "p14", "name": "Community Bank USA", "contractValue": 40000, "startDate": "2024-05-01", "status": "Active"},
            {"id": "p15", "name": "Credit Union Network", "contractValue": 35000, "startDate": "2024-06-10", "status": "Pending"},
        ],
        "lastUpdate": "Regulatory compliance taking longer than expected. Need legal support.",
        "burnHistory": [42000, 46000, 48000, 51000, 53000, 55000],
        "description": "AI credit scoring for underbanked populations",
    },
    {
        "id": "7",
        "name": "SolarGrid",
        "pod": "CleanTech",
        "stage": "Growth",
        "founder": "David Nakamura",
        "health": "On Track",
        "monthlyBurn": 165000,
        "runway": 22,
        "nps": 78,
        "pilotCustomers": [
            {"id": "p16", "name": "SunPower Corp", "contractValue": 280000, "startDate": "2023-10-01", "status": "Active"},
            {"id": "p17", "name": "Tesla Energy", "contractValue": 350000, "startDate": "2024-01-15", "status": "Active"},
            {"id": "p18", "name": "NextEra Energy", "contractValue": 220000, "startDate": "2024-03-20", "status": "Active"},
        ],
        "lastUpdate": "Deploying to 50K residential units. Series B discussions started.",
        "burnHistory": [125000, 138000, 148000, 155000, 160000, 165000],
        "description": "Smart grid optimization for renewable energy",
    },
    {
        "id": "8",
        "name": "CarbonTrack",
        "pod": "CleanTech",
        "stage": "Discovery",
        "founder": "Lisa Wang",
        "health": "On Track",
        "monthlyBurn": 28000,
        "runway": 14,
        "nps": 0,
        "pilotCustomers": [],
        "lastUpdate": "Completed market research. Building MVP. First pilot lined up for Q2.",
        "burnHistory": [22000, 24000, 25000, 26000, 27000, 28000],
        "description": "Enterprise carbon footprint monitoring",
    }
]


def seed_database():
    with Session(engine) as session:
        print("🌱 Seeding database with Venture Pulse data (Denormalized Schema)...")

        for v_data in ventures_data:
            # 1. Create Venture with Aggregate Metrics
            # We map the provided data to the new denormalized columns
            venture = Venture(
                id=v_data["id"],
                name=v_data["name"],
                pod=v_data["pod"],
                stage=v_data["stage"],
                health=v_data["health"],
                founder=v_data["founder"],
                description=v_data["description"],
                last_update_text=v_data["lastUpdate"],
                # NEW AGGREGATE COLUMNS
                burn_rate_monthly=float(v_data["monthlyBurn"]),
                runway_months=v_data["runway"],
                nps_score=v_data["nps"],
                pilot_customers_count=len(v_data["pilotCustomers"])
            )
            session.add(venture)

            # 2. Create Pilot Customers
            for p_data in v_data["pilotCustomers"]:
                customer = PilotCustomer(
                    id=p_data["id"],
                    name=p_data["name"],
                    contract_value=p_data["contractValue"],
                    start_date=datetime.fromisoformat(p_data["startDate"]),
                    status=p_data["status"],
                    venture_id=venture.id
                )
                session.add(customer)

        # 4. Add Test User
        test_user = User(
            id="user_123",
            role="admin",
            full_name="Test User",
            email="test@example.com",
            hashed_password="$2b$12$OOrA.a5eSf.41qTgTNX1suXZa0nmdBo6dMU2LgMH0vQK47T9K0YVO",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        session.add(test_user)

        session.commit()
        print("✅ Database successfully populated with aggregated metrics!")

if __name__ == "__main__":
    seed_database()