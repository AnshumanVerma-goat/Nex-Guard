from __future__ import annotations

import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any
from uuid import UUID, uuid4

from fastapi import Depends, FastAPI, HTTPException, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.auth import create_access_token, get_current_user, get_password_hash, verify_password
from app.models import (
    Alert,
    Base,
    Caregiver,
    Device,
    DeviceTelemetry,
    ElderlyProfile,
    FallEvent,
    User,
)
from app.schemas import (
    AlertAcknowledgeRequest,
    AlertResolveRequest,
    AlertResponse,
    DeviceHeartbeatRequest,
    DeviceRegisterRequest,
    DeviceRegisterResponse,
    DeviceTelemetryRequest,
    ElderlyProfileCreate,
    ElderlyProfileResponse,
    FallEventCreate,
    FallEventResponse,
    Token,
    UserLogin,
    UserRegister,
    UserResponse,
)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://nex_guard:nex_guard@localhost:5432/nex_guard",
)

# Engine setup
engine = create_async_engine(DATABASE_URL, pool_pre_ping=True)
session_factory = async_sessionmaker(engine, expire_on_commit=False)


async def get_db():
    async with session_factory() as session:
        yield session


class ConnectionManager:
    def __init__(self) -> None:
        self.connections: set[WebSocket] = set()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.connections.add(websocket)

    def disconnect(self, websocket: WebSocket) -> None:
        self.connections.discard(websocket)

    async def broadcast(self, payload: dict[str, Any]) -> None:
        stale: list[WebSocket] = []
        for connection in self.connections:
            try:
                await connection.send_json(payload)
            except Exception:
                stale.append(connection)
        for connection in stale:
            self.disconnect(connection)


manager = ConnectionManager()


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)
    except Exception:
        pass
    yield
    await engine.dispose()


app = FastAPI(title="Nex Guard API", version="1.0.0", lifespan=lifespan)

origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "*").split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def serialize_fall_event(event: FallEvent) -> dict[str, Any]:
    return {
        "id": str(event.id),
        "device_id": event.device_id,
        "event_type": event.event_type,
        "occurred_at": event.occurred_at.isoformat() if isinstance(event.occurred_at, datetime) else str(event.occurred_at),
        "confidence": event.confidence,
        "latitude": event.latitude,
        "longitude": event.longitude,
        "location_accuracy": event.location_accuracy,
        "detection_model": event.detection_model,
        "confirmation_status": event.confirmation_status,
        "communication_path": event.communication_path,
    }


def serialize_alert(alert: Alert) -> dict[str, Any]:
    return {
        "id": str(alert.id),
        "fall_event_id": str(alert.fall_event_id),
        "status": alert.status,
        "acknowledged_by_id": str(alert.acknowledged_by_id) if alert.acknowledged_by_id else None,
        "acknowledged_at": alert.acknowledged_at.isoformat() if alert.acknowledged_at else None,
        "resolved_by_id": str(alert.resolved_by_id) if alert.resolved_by_id else None,
        "resolved_at": alert.resolved_at.isoformat() if alert.resolved_at else None,
        "notes": alert.notes,
        "created_at": alert.created_at.isoformat() if isinstance(alert.created_at, datetime) else str(alert.created_at),
        "fall_event": serialize_fall_event(alert.fall_event) if alert.fall_event else None,
    }


# Override auth DB dependency
async def get_db_for_auth():
    async with session_factory() as session:
        yield session

app.dependency_overrides[get_current_user] = lambda token=Depends(get_current_user): token


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "nex-guard-api"}


# Authentication endpoints
@app.post("/api/v1/auth/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(payload: UserRegister, session: AsyncSession = Depends(get_db)):
    result = await session.execute(select(User).where(User.email == payload.email))
    if result.scalar_one_or_none() is not None:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        id=uuid4(),
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        role=payload.role,
    )
    session.add(user)
    await session.commit()

    if payload.role == "caregiver":
        caregiver = Caregiver(id=uuid4(), user_id=user.id, phone_number=payload.phone_number)
        session.add(caregiver)
        await session.commit()

    token = create_access_token({"sub": str(user.id), "email": user.email})
    return Token(access_token=token, token_type="bearer", user_id=user.id, email=user.email, full_name=user.full_name)


@app.post("/api/v1/auth/login", response_model=Token)
async def login(payload: UserLogin, session: AsyncSession = Depends(get_db)):
    result = await session.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": str(user.id), "email": user.email})
    return Token(access_token=token, token_type="bearer", user_id=user.id, email=user.email, full_name=user.full_name)


# Elderly profile endpoints
@app.post("/api/v1/elderly", response_model=ElderlyProfileResponse, status_code=201)
async def create_elderly_profile(payload: ElderlyProfileCreate, session: AsyncSession = Depends(get_db)):
    profile = ElderlyProfile(
        id=uuid4(),
        full_name=payload.full_name,
        age=payload.age,
        medical_notes=payload.medical_notes,
        emergency_contact_name=payload.emergency_contact_name,
        emergency_contact_phone=payload.emergency_contact_phone,
    )
    session.add(profile)
    await session.commit()
    await session.refresh(profile)
    return profile


@app.get("/api/v1/elderly", response_model=list[ElderlyProfileResponse])
async def list_elderly_profiles(session: AsyncSession = Depends(get_db)):
    result = await session.execute(select(ElderlyProfile).order_by(ElderlyProfile.created_at.desc()))
    return list(result.scalars().all())


# Device management endpoints
@app.post("/api/v1/devices/register", response_model=DeviceRegisterResponse, status_code=201)
async def register_device(payload: DeviceRegisterRequest, session: AsyncSession = Depends(get_db)):
    result = await session.execute(select(Device).where(Device.device_id == payload.device_id))
    existing = result.scalar_one_or_none()
    if existing:
        existing.firmware_version = payload.firmware_version or existing.firmware_version
        existing.last_seen_at = datetime.now(timezone.utc)
        await session.commit()
        await session.refresh(existing)
        return existing

    device = Device(
        id=uuid4(),
        device_id=payload.device_id,
        device_secret=payload.device_secret,
        firmware_version=payload.firmware_version,
        status="online",
    )
    session.add(device)
    await session.commit()
    await session.refresh(device)
    return device


@app.post("/api/v1/devices/{device_id}/heartbeat")
async def device_heartbeat(device_id: str, payload: DeviceHeartbeatRequest, session: AsyncSession = Depends(get_db)):
    result = await session.execute(select(Device).where(Device.device_id == device_id))
    device = result.scalar_one_or_none()
    now = datetime.now(timezone.utc)
    if device is None:
        device = Device(id=uuid4(), device_id=device_id, status=payload.status or "online", battery_level=payload.battery_level, last_seen_at=now)
        session.add(device)
    else:
        if payload.battery_level is not None:
            device.battery_level = payload.battery_level
        if payload.status is not None:
            device.status = payload.status
        if payload.firmware_version:
            device.firmware_version = payload.firmware_version
        device.last_seen_at = now
    await session.commit()
    return {"status": "ok", "device_id": device_id, "last_seen_at": now.isoformat()}


@app.post("/api/v1/devices/{device_id}/telemetry", status_code=201)
async def record_telemetry(device_id: str, payload: DeviceTelemetryRequest, session: AsyncSession = Depends(get_db)):
    telemetry = DeviceTelemetry(
        id=uuid4(),
        device_id=device_id,
        battery_level=payload.battery_level,
        wifi_signal=payload.wifi_signal,
        status_code=payload.status_code,
        raw_payload=payload.raw_payload,
    )
    session.add(telemetry)

    # Update device status
    result = await session.execute(select(Device).where(Device.device_id == device_id))
    device = result.scalar_one_or_none()
    if device:
        if payload.battery_level is not None:
            device.battery_level = payload.battery_level
        device.last_seen_at = datetime.now(timezone.utc)
    await session.commit()
    return {"status": "ok", "telemetry_id": str(telemetry.id)}


# Fall Event & Alert endpoints
@app.post("/api/v1/events/fall", response_model=FallEventResponse, status_code=201)
@app.post("/api/events", response_model=FallEventResponse, status_code=201)
async def create_fall_event(payload: FallEventCreate, session: AsyncSession = Depends(get_db)):
    occurred_at = payload.occurred_at or datetime.now(timezone.utc)
    event = FallEvent(
        id=uuid4(),
        device_id=payload.device_id,
        event_type=payload.event_type,
        occurred_at=occurred_at,
        confidence=payload.confidence,
        latitude=payload.latitude,
        longitude=payload.longitude,
        location_accuracy=payload.location_accuracy,
        detection_model=payload.detection_model,
        confirmation_status=payload.confirmation_status,
        communication_path=payload.communication_path,
    )
    session.add(event)
    await session.flush()

    # Create associated active alert
    alert = Alert(
        id=uuid4(),
        fall_event_id=event.id,
        status="ACTIVE",
    )
    session.add(alert)

    # Update device battery and status
    result = await session.execute(select(Device).where(Device.device_id == payload.device_id))
    device = result.scalar_one_or_none()
    if device:
        if payload.battery_level is not None:
            device.battery_level = payload.battery_level
        device.status = "emergency"
        device.last_seen_at = occurred_at

    await session.commit()

    serialized = serialize_fall_event(event)
    serialized["battery_level"] = payload.battery_level
    serialized["alert_id"] = str(alert.id)

    # Broadcast WebSocket alert
    await manager.broadcast(serialized)
    return FallEventResponse.model_validate(serialized)


@app.get("/api/v1/events", response_model=list[FallEventResponse])
@app.get("/api/events", response_model=list[FallEventResponse])
async def list_fall_events(session: AsyncSession = Depends(get_db)):
    result = await session.execute(select(FallEvent).order_by(FallEvent.occurred_at.desc()).limit(50))
    events = result.scalars().all()
    return [FallEventResponse.model_validate(serialize_fall_event(e)) for e in events]


@app.get("/api/v1/alerts")
async def list_alerts(session: AsyncSession = Depends(get_db)):
    result = await session.execute(select(Alert).order_by(Alert.created_at.desc()).limit(50))
    alerts = result.scalars().all()
    res = []
    for a in alerts:
        fe_result = await session.execute(select(FallEvent).where(FallEvent.id == a.fall_event_id))
        a.fall_event = fe_result.scalar_one_or_none()
        res.append(serialize_alert(a))
    return res


@app.post("/api/v1/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: UUID, payload: AlertAcknowledgeRequest | None = None, session: AsyncSession = Depends(get_db)):
    result = await session.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = "ACKNOWLEDGED"
    alert.acknowledged_at = datetime.now(timezone.utc)
    if payload and payload.notes:
        alert.notes = payload.notes
    await session.commit()

    fe_result = await session.execute(select(FallEvent).where(FallEvent.id == alert.fall_event_id))
    alert.fall_event = fe_result.scalar_one_or_none()
    serialized = serialize_alert(alert)
    await manager.broadcast({"event_type": "ALERT_ACKNOWLEDGED", "alert": serialized})
    return serialized


@app.post("/api/v1/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: UUID, payload: AlertResolveRequest | None = None, session: AsyncSession = Depends(get_db)):
    result = await session.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = "RESOLVED"
    alert.resolved_at = datetime.now(timezone.utc)
    if payload and payload.notes:
        alert.notes = payload.notes
    await session.commit()

    fe_result = await session.execute(select(FallEvent).where(FallEvent.id == alert.fall_event_id))
    alert.fall_event = fe_result.scalar_one_or_none()
    serialized = serialize_alert(alert)
    await manager.broadcast({"event_type": "ALERT_RESOLVED", "alert": serialized})
    return serialized


# WebSockets
@app.websocket("/ws/events")
@app.websocket("/api/v1/ws")
async def events_socket(websocket: WebSocket) -> None:
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
