from __future__ import annotations

import datetime as dt
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------
class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str = ""


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
    name: Optional[str] = None
    company: Optional[str] = None
    industry: Optional[str] = None
    source: Optional[str] = None
    deal_size: Optional[float] = None
    contact_frequency: Optional[int] = None
    days_since_last_contact: Optional[int] = None
    response_rate: Optional[float] = None
    status: Optional[str] = None


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
    next_action: Optional[str] = None
    method: str
