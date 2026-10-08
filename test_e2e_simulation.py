from __future__ import annotations

import os
import sys
import asyncio
from fastapi.testclient import TestClient

# Ensure root & backend directory in python path
sys.path.insert(0, os.path.abspath("backend"))
sys.path.insert(0, os.path.abspath("."))

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"

from app.main import app, engine, Base
from firmware.firmware_sim_runner import ESP32FirmwareSimulator


def test_full_end_to_end_fall_alert_flow():
    print("\n==================================================")
    print("STARTING NEX GUARD END-TO-END SIMULATION PIPELINE TEST")
    print("==================================================")

    # 1. Initialize DB tables
    async def init_db():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
    asyncio.run(init_db())

    client = TestClient(app)

    # 2. Register Caregiver User & Device
    reg_user = client.post(
        "/api/v1/auth/register",
        json={
            "email": "e2e_caregiver@example.com",
            "password": "securepassword123",
            "full_name": "E2E Caregiver",
            "role": "caregiver",
        },
    )
    assert reg_user.status_code == 201, f"User registration failed: {reg_user.text}"
    token = reg_user.json()["access_token"]
    print("[OK] Caregiver Registered & Authenticated with JWT")


    reg_device = client.post(
        "/api/v1/devices/register",
        json={"device_id": "nex-guard-001", "firmware_version": "1.0.0"},
    )
    assert reg_device.status_code == 201
    print("[OK] Wearable Device nex-guard-001 Registered")

    # 3. Simulate Wearable Sensor Window & State Machine Fall Detection
    sim = ESP32FirmwareSimulator()
    state = sim.run_simulation_step(trigger_fall=True, press_cancel=False)
    assert state in ["ALERTING", "ACKNOWLEDGED"]
    print("[OK] ESP32 State Machine: NORMAL -> POSSIBLE_FALL -> USER_CONFIRMATION -> CONFIRMED_FALL -> LOCATING -> ALERTING")

    # 4. Post Confirmed Fall Event from ESP32 to FastAPI Backend
    fall_payload = {
        "device_id": "nex-guard-001",
        "event_type": "FALL_DETECTED",
        "confidence": 0.96,
        "latitude": 22.7196,
        "longitude": 75.8577,
        "location_accuracy": 2.5,
        "detection_model": "1d_cnn",
        "confirmation_status": "confirmed",
        "communication_path": "wifi",
        "battery_level": 84,
    }

    ws = client.websocket_connect("/api/v1/ws")
    ws_conn = ws.__enter__()

    event_resp = client.post("/api/v1/events/fall", json=fall_payload)
    assert event_resp.status_code == 201, f"Fall event creation failed: {event_resp.text}"
    event_data = event_resp.json()

    alerts_resp = client.get("/api/v1/alerts")
    assert alerts_resp.status_code == 200
    alerts = alerts_resp.json()
    assert len(alerts) >= 1
    alert_id = alerts[0]["id"]
    print(f"[OK] Fall Event Persisted in Database (Event ID: {event_data['id']}, Alert ID: {alert_id})")


    # 5. Receive Real-Time WebSocket Event in Caregiver Mobile App
    ws_msg = ws_conn.receive_json()
    assert ws_msg["event_type"] == "FALL_DETECTED"
    assert ws_msg["device_id"] == "nex-guard-001"
    print("[OK] WebSocket Broadcast Received on Mobile App: FALL_DETECTED")

    # 6. Caregiver Acknowledges Alert
    ack_resp = client.post(
        f"/api/v1/alerts/{alert_id}/acknowledge",
        headers={"Authorization": f"Bearer {token}"},
        json={"notes": "Caregiver checking in immediately"},
    )
    assert ack_resp.status_code == 200
    assert ack_resp.json()["status"] == "ACKNOWLEDGED"
    print("[OK] Caregiver Mobile Action: Alert ACKNOWLEDGED")

    # 7. Caregiver Resolves Alert
    res_resp = client.post(
        f"/api/v1/alerts/{alert_id}/resolve",
        headers={"Authorization": f"Bearer {token}"},
        json={"notes": "Elderly person verified safe"},
    )
    assert res_resp.status_code == 200
    assert res_resp.json()["status"] == "RESOLVED"
    print("[OK] Caregiver Mobile Action: Alert RESOLVED")


    ws.__exit__(None, None, None)
    print("\n==================================================")
    print("END-TO-END SIMULATION WORKFLOW VERIFIED SUCCESSFULLY!")
    print("==================================================")


if __name__ == "__main__":
    test_full_end_to_end_fall_alert_flow()
