from __future__ import annotations

import os
import tempfile

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Dùng một file SQLite riêng cho test, tách biệt với DB dev
_db_fd, _db_path = tempfile.mkstemp(suffix=".db")
os.environ["DATABASE_URL"] = f"sqlite:///{_db_path}"
os.environ["JWT_SECRET_KEY"] = "test-secret"
os.environ["DEMO_USER_EMAIL"] = "demo@company.com"
os.environ["DEMO_USER_PASSWORD"] = "demo1234"

from app.database import Base  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c
    os.close(_db_fd)
    os.remove(_db_path)


@pytest.fixture(scope="session")
def auth_headers(client):
    resp = client.post(
        "/auth/login",
        json={"email": "demo@company.com", "password": "demo1234"},
    )
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
