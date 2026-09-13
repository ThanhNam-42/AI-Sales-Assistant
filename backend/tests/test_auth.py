def test_login_success(client):
    resp = client.post(
        "/auth/login",
        json={"email": "demo@company.com", "password": "demo1234"},
    )
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_wrong_password(client):
    resp = client.post(
        "/auth/login",
        json={"email": "demo@company.com", "password": "wrong-password"},
    )
    assert resp.status_code == 401


def test_leads_requires_auth(client):
    resp = client.get("/leads")
    assert resp.status_code == 401
