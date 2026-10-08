from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default="caregiver")  # caregiver, elderly, admin
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    devices: Mapped[list[Device]] = relationship("Device", back_populates="owner")
    caregiver_profile: Mapped[Caregiver | None] = relationship("Caregiver", back_populates="user", uselist=False)


class Caregiver(Base):
    __tablename__ = "caregivers"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    phone_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    user: Mapped[User] = relationship("User", back_populates="caregiver_profile")


class ElderlyProfile(Base):
    __tablename__ = "elderly_profiles"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    age: Mapped[int | None] = mapped_column(Integer, nullable=True)
    medical_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    emergency_contact_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    emergency_contact_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    devices: Mapped[list[Device]] = relationship("Device", back_populates="elderly_profile")


class Device(Base):
    __tablename__ = "devices"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    device_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    device_secret: Mapped[str | None] = mapped_column(String(255), nullable=True)
    owner_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    elderly_profile_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("elderly_profiles.id", ondelete="SET NULL"), nullable=True)
    firmware_version: Mapped[str | None] = mapped_column(String(50), default="1.0.0")
    battery_level: Mapped[int | None] = mapped_column(Integer, default=100)
    status: Mapped[str] = mapped_column(String(50), default="online")  # online, offline, emergency
    last_seen_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=utc_now)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    owner: Mapped[User | None] = relationship("User", back_populates="devices")
    elderly_profile: Mapped[ElderlyProfile | None] = relationship("ElderlyProfile", back_populates="devices")


class DeviceTelemetry(Base):
    __tablename__ = "device_telemetry"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    device_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    battery_level: Mapped[int | None] = mapped_column(Integer, nullable=True)
    wifi_signal: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status_code: Mapped[str | None] = mapped_column(String(50), default="OK")
    raw_payload: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class FallEvent(Base):
    __tablename__ = "fall_events"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    device_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    event_type: Mapped[str] = mapped_column(String(50), index=True, default="FALL_DETECTED")
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    confidence: Mapped[float] = mapped_column(Float, default=1.0)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    location_accuracy: Mapped[float | None] = mapped_column(Float, nullable=True)
    detection_model: Mapped[str] = mapped_column(String(50), default="1d_cnn")
    confirmation_status: Mapped[str] = mapped_column(String(50), default="confirmed")  # confirmed, cancelled, pending
    communication_path: Mapped[str] = mapped_column(String(50), default="wifi")  # wifi, gsm
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    alerts: Mapped[list[Alert]] = relationship("Alert", back_populates="fall_event", cascade="all, delete-orphan")


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    fall_event_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("fall_events.id", ondelete="CASCADE"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), index=True, default="ACTIVE")  # ACTIVE, ACKNOWLEDGED, RESOLVED
    acknowledged_by_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    acknowledged_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_by_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    fall_event: Mapped[FallEvent] = relationship("FallEvent", back_populates="alerts")


class Location(Base):
    __tablename__ = "locations"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    device_id: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    accuracy: Mapped[float | None] = mapped_column(Float, nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
