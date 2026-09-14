from __future__ import annotations

import datetime as dt

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(255), default="")

    leads: Mapped[list["Lead"]] = relationship(
        "Lead", back_populates="owner", cascade="all, delete-orphan"
    )


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    company: Mapped[str] = mapped_column(String(255))
    industry: Mapped[str] = mapped_column(String(100))
    source: Mapped[str] = mapped_column(String(100))
    deal_size: Mapped[float] = mapped_column(Float, default=0)
    contact_frequency: Mapped[int] = mapped_column(Integer, default=0)
    days_since_last_contact: Mapped[int] = mapped_column(Integer, default=0)
    response_rate: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(50), default="Mới")

    score: Mapped[int] = mapped_column(Integer, default=0)
    top_factors: Mapped[str] = mapped_column(Text, default="")  # JSON-encoded list

    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime, default=dt.datetime.utcnow
    )

    notes: Mapped[list["Note"]] = relationship(
        "Note", back_populates="lead", cascade="all, delete-orphan"
    )
    owner: Mapped["User"] = relationship("User", back_populates="leads")


class Note(Base):
    __tablename__ = "notes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    lead_id: Mapped[int] = mapped_column(ForeignKey("leads.id"))
    content: Mapped[str] = mapped_column(Text)
    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime, default=dt.datetime.utcnow
    )

    lead: Mapped["Lead"] = relationship("Lead", back_populates="notes")
