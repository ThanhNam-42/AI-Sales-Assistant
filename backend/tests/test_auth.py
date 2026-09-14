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


def test_register_new_user(client):
    resp = client.post(
        "/auth/register",
        json={"email": "newuser_test@example.com", "password": "abcdef12"},
    )
    assert resp.status_code == 201, resp.text
    assert "access_token" in resp.json()


def test_register_duplicate_email_rejected(client):
    client.post(
        "/auth/register",
        json={"email": "dup_test@example.com", "password": "abcdef12"},
    )
    resp = client.post(
        "/auth/register",
        json={"email": "dup_test@example.com", "password": "abcdef12"},
    )
    assert resp.status_code == 400
