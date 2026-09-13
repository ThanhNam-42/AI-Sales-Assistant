from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.ml.predict import predict_score
from app.models import Lead, Note
from app.schemas import (
    LeadCreate,
    LeadOut,
    LeadUpdate,
    NoteCreate,
    NoteOut,
    SummaryOut,
)
from app.summarizer import summarize_notes

router = APIRouter(
    prefix="/leads", tags=["leads"], dependencies=[Depends(get_current_user)]
)


def _lead_to_out(lead: Lead) -> LeadOut:
    # Xây dựng dict thủ công thay vì LeadOut.model_validate(lead) trực tiếp,
    # vì top_factors được lưu trong DB dạng chuỗi JSON (Text column) chứ
    # không phải list, nên cần parse trước khi Pydantic validate kiểu list[str].
    return LeadOut(
        id=lead.id,
        name=lead.name,
        company=lead.company,
        industry=lead.industry,
        source=lead.source,
        deal_size=lead.deal_size,
        contact_frequency=lead.contact_frequency,
        days_since_last_contact=lead.days_since_last_contact,
        response_rate=lead.response_rate,
        status=lead.status,
        score=lead.score,
        top_factors=json.loads(lead.top_factors or "[]"),
        created_at=lead.created_at,
    )


def _score_lead(lead: Lead) -> None:
    result = predict_score(
        {
            "industry": lead.industry,
            "source": lead.source,
            "deal_size": lead.deal_size,
            "contact_frequency": lead.contact_frequency,
            "days_since_last_contact": lead.days_since_last_contact,
            "response_rate": lead.response_rate,
        }
    )
    lead.score = result["score"]
    lead.top_factors = json.dumps(result["top_factors"], ensure_ascii=False)


@router.get("", response_model=list[LeadOut])
def list_leads(
    industry: str | None = None,
    status_filter: str | None = None,
    source: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(Lead)
    if industry:
        query = query.filter(Lead.industry == industry)
    if status_filter:
        query = query.filter(Lead.status == status_filter)
    if source:
        query = query.filter(Lead.source == source)
    leads = query.order_by(Lead.score.desc()).all()
    return [_lead_to_out(lead) for lead in leads]


@router.post("", response_model=LeadOut, status_code=201)
def create_lead(payload: LeadCreate, db: Session = Depends(get_db)):
    lead = Lead(**payload.model_dump())
    _score_lead(lead)
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return _lead_to_out(lead)


@router.get("/{lead_id}", response_model=LeadOut)
def get_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(404, "Không tìm thấy lead")
    return _lead_to_out(lead)


@router.put("/{lead_id}", response_model=LeadOut)
def update_lead(lead_id: int, payload: LeadUpdate, db: Session = Depends(get_db)):
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(404, "Không tìm thấy lead")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(lead, field, value)
    _score_lead(lead)
    db.commit()
    db.refresh(lead)
    return _lead_to_out(lead)


@router.delete("/{lead_id}", status_code=204)
def delete_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(404, "Không tìm thấy lead")
    db.delete(lead)
    db.commit()


@router.post("/{lead_id}/notes", response_model=NoteOut, status_code=201)
def add_note(lead_id: int, payload: NoteCreate, db: Session = Depends(get_db)):
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(404, "Không tìm thấy lead")
    note = Note(lead_id=lead_id, content=payload.content)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.get("/{lead_id}/notes", response_model=list[NoteOut])
def list_notes(lead_id: int, db: Session = Depends(get_db)):
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(404, "Không tìm thấy lead")
    return lead.notes


@router.post("/{lead_id}/summarize", response_model=SummaryOut)
def summarize_lead_notes(lead_id: int, db: Session = Depends(get_db)):
    lead = db.get(Lead, lead_id)
    if not lead:
        raise HTTPException(404, "Không tìm thấy lead")
    notes_content = [n.content for n in lead.notes]
    result = summarize_notes(notes_content)
    return SummaryOut(**result)
