from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = Field(min_length=1)
    role: str = Field(default="caregiver")
    phone_number: str | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: UUID
    email: str
    full_name: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: str
    full_name: str
    role: str
    created_at: datetime


class ElderlyProfileCreate(BaseModel):
    full_name: str = Field(min_length=1)
    age: int | None = Field(default=None, ge=0, le=130)
    medical_notes: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None


class ElderlyProfileResponse(ElderlyProfileCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime


class DeviceRegisterRequest(BaseModel):
    device_id: str = Field(min_length=1, max_length=100)
    device_secret: str | None = None
    firmware_version: str | None = "1.0.0"


class DeviceRegisterResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    device_id: str
    status: str
    firmware_version: str | None
    created_at: datetime


class DeviceHeartbeatRequest(BaseModel):
    battery_level: int | None = Field(default=None, ge=0, le=100)
    status: str | None = "online"
    firmware_version: str | None = None


class DeviceTelemetryRequest(BaseModel):
    battery_level: int | None = Field(default=None, ge=0, le=100)
    wifi_signal: int | None = None
    status_code: str | None = "OK"
    raw_payload: str | None = None


class FallEventCreate(BaseModel):
    device_id: str = Field(min_length=1, max_length=100)
    event_type: str = Field(default="FALL_DETECTED", pattern="^(FALL_DETECTED|POTENTIAL_FALL|CANCELLED)$")
    occurred_at: datetime | None = None
    confidence: float = Field(default=1.0, ge=0, le=1)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    location_accuracy: float | None = None
    detection_model: str = Field(default="1d_cnn")
    confirmation_status: str = Field(default="confirmed")
    communication_path: str = Field(default="wifi")
    battery_level: int | None = Field(default=None, ge=0, le=100)


class FallEventResponse(FallEventCreate):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    occurred_at: datetime


class AlertAcknowledgeRequest(BaseModel):
    notes: str | None = None


class AlertResolveRequest(BaseModel):
    notes: str | None = None


class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    fall_event_id: UUID
    status: str
    acknowledged_by_id: UUID | None
    acknowledged_at: datetime | None
    resolved_by_id: UUID | None
    resolved_at: datetime | None
    notes: str | None
    created_at: datetime
    fall_event: FallEventResponse
