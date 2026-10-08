from __future__ import annotations

import os
import pytest
from fastapi.testclient import TestClient

# Set test database to in-memory SQLite before importing app
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"

from app.main import app, engine, Base


@pytest.fixture(autouse=True)

def setup_db():
    # Helper to sync run create_all on sqlite
    import asyncio
    async def init():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
    asyncio.run(init())
    yield


def test_health() -> None:
    with TestClient(app) as client:
        response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_user_registration_and_login() -> None:
    with TestClient(app) as client:
        # Register caregiver
        reg_response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "caregiver@example.com",
                "password": "securepassword123",
                "full_name": "Jane Caregiver",
                "role": "caregiver",
                "phone_number": "+1234567890",
            },
        )
        assert reg_response.status_code == 201
        data = reg_response.json()
        assert "access_token" in data
        assert data["email"] == "caregiver@example.com"

        # Login
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "caregiver@example.com",
                "password": "securepassword123",
            },
        )
        assert login_response.status_code == 200
        assert "access_token" in login_response.json()


def test_device_registration_and_heartbeat() -> None:
    with TestClient(app) as client:
        # Register device
        reg = client.post(
            "/api/v1/devices/register",
            json={
                "device_id": "nex-guard-test-01",
                "firmware_version": "1.0.0",
            },
        )
        assert reg.status_code == 201
        assert reg.json()["device_id"] == "nex-guard-test-01"

        # Heartbeat
        hb = client.post(
            "/api/v1/devices/nex-guard-test-01/heartbeat",
            json={"battery_level": 88, "status": "online"},
        )
        assert hb.status_code == 200
        assert hb.json()["status"] == "ok"

        # Telemetry
        telem = client.post(
            "/api/v1/devices/nex-guard-test-01/telemetry",
            json={"battery_level": 87, "wifi_signal": -62, "status_code": "OK"},
        )
        assert telem.status_code == 201
        assert telem.json()["status"] == "ok"


def test_fall_event_and_alert_lifecycle() -> None:
    with TestClient(app) as client:
        # Post fall event
        event_resp = client.post(
            "/api/v1/events/fall",
            json={
                "device_id": "nex-guard-test-01",
                "event_type": "FALL_DETECTED",
                "confidence": 0.94,
                "latitude": 37.7749,
                "longitude": -122.4194,
                "battery_level": 82,
            },
        )
        assert event_resp.status_code == 201
        event_data = event_resp.json()
        assert event_data["device_id"] == "nex-guard-test-01"
        assert event_data["confidence"] == 0.94

        # List alerts
        alerts_resp = client.get("/api/v1/alerts")
        assert alerts_resp.status_code == 200
        alerts = alerts_resp.json()
        assert len(alerts) >= 1
        active_alert = alerts[0]
        assert active_alert["status"] == "ACTIVE"
        alert_id = active_alert["id"]

        # Acknowledge alert
        ack_resp = client.post(
            f"/api/v1/alerts/{alert_id}/acknowledge",
            json={"notes": "Caregiver en route"},
        )
        assert ack_resp.status_code == 200
        assert ack_resp.json()["status"] == "ACKNOWLEDGED"

        # Resolve alert
        res_resp = client.post(
            f"/api/v1/alerts/{alert_id}/resolve",
            json={"notes": "Checked user, safe and sound"},
        )
        assert res_resp.status_code == 200
        assert res_resp.json()["status"] == "RESOLVED"


def test_websocket_connects() -> None:
    with TestClient(app) as client:
        with client.websocket_connect("/ws/events") as websocket:
            assert websocket is not None

        with client.websocket_connect("/api/v1/ws") as websocket:
            assert websocket is not None
