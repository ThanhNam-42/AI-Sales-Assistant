from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth import ensure_demo_user
from app.database import Base, SessionLocal, engine
from app.routers import auth_router, leads

app = FastAPI(
    title="AI Sales Assistant API",
    description="API chấm điểm lead & tóm tắt ghi chú chăm sóc khách hàng bằng AI.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # demo project: mở CORS để frontend deploy riêng domain vẫn gọi được
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        ensure_demo_user(db)
    finally:
        db.close()


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(auth_router.router)
app.include_router(leads.router)
