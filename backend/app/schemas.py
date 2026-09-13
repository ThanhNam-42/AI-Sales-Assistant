from __future__ import annotations

import datetime as dt

from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------
class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---------- Lead ----------
class LeadBase(BaseModel):
    name: str
    company: str
    industry: str
    source: str
    deal_size: float = Field(ge=0)
    contact_frequency: int = Field(ge=0, default=0)
    days_since_last_contact: int = Field(ge=0, default=0)
    response_rate: float = Field(ge=0, le=1, default=0.0)
    status: str = "Mới"


class LeadCreate(LeadBase):
    pass


class LeadUpdate(BaseModel):
    name: str | None = None
    company: str | None = None
    industry: str | None = None
    source: str | None = None
    deal_size: float | None = None
    contact_frequency: int | None = None
    days_since_last_contact: int | None = None
    response_rate: float | None = None
    status: str | None = None


class LeadOut(LeadBase):
    id: int
    score: int
    top_factors: list[str]
    created_at: dt.datetime

    class Config:
        from_attributes = True


# ---------- Note ----------
class NoteCreate(BaseModel):
    content: str = Field(min_length=1)


class NoteOut(BaseModel):
    id: int
    content: str
    created_at: dt.datetime

    class Config:
        from_attributes = True


class SummaryOut(BaseModel):
    summary: str
    next_action: str | None = None
    method: str
