from __future__ import annotations

import os
import sys
import asyncio
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath("backend"))
sys.path.insert(0, os.path.abspath("."))

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"

from app.main import app, engine, Base
from firmware.firmware_sim_runner import ESP32FirmwareSimulator


def test_failure_scenarios_and_recovery():
    print("\n==================================================")
    print("STARTING NEX GUARD FAILURE SCENARIOS TEST SUITE")
    print("==================================================")

    # 1. Test User Cancellation (False Alarm Recovery)
    sim = ESP32FirmwareSimulator()
    state_cancelled = sim.run_simulation_step(trigger_fall=True, press_cancel=True)
    assert state_cancelled in ["CANCELLED", "NORMAL"], f"Expected CANCELLED or NORMAL state, got {state_cancelled}"

    print("[OK] Scenario 1: User False Alarm Cancellation — Button Press Clears Alert Locally")

    # 2. Test Backend Outage Recovery (Local Confirmation operational without Wi-Fi)
    sim_offline = ESP32FirmwareSimulator(backend_url="http://localhost:9999_invalid")
    state_offline = sim_offline.run_simulation_step(trigger_fall=True, press_cancel=False)
    assert state_offline == "ALERTING", f"Expected ALERTING state on Wi-Fi failure, got {state_offline}"
    print("[OK] Scenario 2: Backend/Wi-Fi Unavailable — Wearable Local Alert Remains Operational")

    # 3. Test Missing GNSS Fix (Send emergency payload with null coordinates without blocking)
    async def init_db():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
    asyncio.run(init_db())

    client = TestClient(app)

    no_gps_payload = {
        "device_id": "nex-guard-001",
        "event_type": "FALL_DETECTED",
        "confidence": 0.91,
        "latitude": None,
        "longitude": None,
        "location_accuracy": None,
        "detection_model": "1d_cnn",
        "confirmation_status": "confirmed",
        "communication_path": "gsm",
        "battery_level": 45,
    }

    resp = client.post("/api/v1/events/fall", json=no_gps_payload)
    assert resp.status_code == 201
    assert resp.json()["latitude"] is None
    print("[OK] Scenario 3: GPS Unavailable — Emergency Alert Sent with Null Coordinates (Non-blocking)")

    # 4. Test Invalid Payload Validation
    invalid_resp = client.post("/api/v1/events/fall", json={"device_id": "nex-guard-001", "event_type": "INVALID"})
    assert invalid_resp.status_code == 422
    print("[OK] Scenario 4: Malformed Payload Validation — Rejected safely with 422")

    print("\n==================================================")
    print("ALL FAILURE RECOVERY SCENARIOS PASSED SUCCESSFULLY!")
    print("==================================================")


if __name__ == "__main__":
    test_failure_scenarios_and_recovery()
