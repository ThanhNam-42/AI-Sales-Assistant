def _lead_payload(**overrides):
    payload = {
        "name": "Nguyễn Văn A",
        "company": "ABC Corp",
        "industry": "Tech",
        "source": "Referral",
        "deal_size": 12000,
        "contact_frequency": 5,
        "days_since_last_contact": 2,
        "response_rate": 0.8,
        "status": "Mới",
    }
    payload.update(overrides)
    return payload


def test_create_lead_returns_score(client, auth_headers):
    resp = client.post("/leads", json=_lead_payload(), headers=auth_headers)
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert 0 <= data["score"] <= 100
    assert isinstance(data["top_factors"], list)
    assert len(data["top_factors"]) > 0


def test_hot_lead_scores_higher_than_cold_lead(client, auth_headers):
    hot = client.post("/leads", json=_lead_payload(), headers=auth_headers).json()
    cold = client.post(
        "/leads",
        json=_lead_payload(
            industry="Manufacturing",
            source="Cold Call",
            deal_size=300,
            contact_frequency=0,
            days_since_last_contact=55,
            response_rate=0.05,
        ),
        headers=auth_headers,
    ).json()
    assert hot["score"] > cold["score"]


def test_list_leads_sorted_by_score_desc(client, auth_headers):
    resp = client.get("/leads", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert "items" in body and "total" in body
    scores = [lead["score"] for lead in body["items"]]
    assert scores == sorted(scores, reverse=True)


def test_list_leads_pagination(client, auth_headers):
    for _ in range(5):
        client.post("/leads", json=_lead_payload(), headers=auth_headers)

    page1 = client.get("/leads", params={"page": 1, "page_size": 2}, headers=auth_headers)
    assert page1.status_code == 200
    body1 = page1.json()
    assert len(body1["items"]) == 2
    assert body1["total"] >= 5
    assert body1["page"] == 1
    assert body1["page_size"] == 2

    page2 = client.get("/leads", params={"page": 2, "page_size": 2}, headers=auth_headers)
    ids_page1 = {lead["id"] for lead in body1["items"]}
    ids_page2 = {lead["id"] for lead in page2.json()["items"]}
    assert ids_page1.isdisjoint(ids_page2)


def test_list_leads_search_by_name_or_company(client, auth_headers):
    client.post(
        "/leads",
        json=_lead_payload(name="Trần Thị Unique", company="Zeta Corp"),
        headers=auth_headers,
    )
    resp = client.get("/leads", params={"search": "Unique"}, headers=auth_headers)
    assert resp.status_code == 200
    names = [lead["name"] for lead in resp.json()["items"]]
    assert "Trần Thị Unique" in names

    resp2 = client.get("/leads", params={"search": "Zeta"}, headers=auth_headers)
    companies = [lead["company"] for lead in resp2.json()["items"]]
    assert "Zeta Corp" in companies


def test_get_update_delete_lead_lifecycle(client, auth_headers):
    created = client.post("/leads", json=_lead_payload(), headers=auth_headers).json()
    lead_id = created["id"]

    got = client.get(f"/leads/{lead_id}", headers=auth_headers)
    assert got.status_code == 200

    updated = client.put(
        f"/leads/{lead_id}",
        json={"status": "Đang liên hệ"},
        headers=auth_headers,
    )
    assert updated.status_code == 200
    assert updated.json()["status"] == "Đang liên hệ"

    deleted = client.delete(f"/leads/{lead_id}", headers=auth_headers)
    assert deleted.status_code == 204

    not_found = client.get(f"/leads/{lead_id}", headers=auth_headers)
    assert not_found.status_code == 404


def test_notes_and_summarize_flow(client, auth_headers):
    lead = client.post("/leads", json=_lead_payload(), headers=auth_headers).json()
    lead_id = lead["id"]

    empty_summary = client.post(f"/leads/{lead_id}/summarize", headers=auth_headers)
    assert empty_summary.status_code == 200
    assert empty_summary.json()["method"] == "none"

    note_resp = client.post(
        f"/leads/{lead_id}/notes",
        json={"content": "Khách quan tâm gói Enterprise, hẹn gọi lại thứ 5."},
        headers=auth_headers,
    )
    assert note_resp.status_code == 201

    notes_list = client.get(f"/leads/{lead_id}/notes", headers=auth_headers)
    assert notes_list.status_code == 200
    assert len(notes_list.json()) == 1

    summary = client.post(f"/leads/{lead_id}/summarize", headers=auth_headers)
    assert summary.status_code == 200
    body = summary.json()
    assert body["summary"]
    assert body["method"] in ("rule_based", "openai")


def test_leads_are_isolated_per_user(client, auth_headers):
    # Tạo 1 lead bằng tài khoản demo (tài khoản chung dùng ở các test khác)
    demo_lead = client.post("/leads", json=_lead_payload(), headers=auth_headers).json()

    # Đăng ký tài khoản mới — chưa có lead nào
    reg = client.post(
        "/auth/register",
        json={"email": "isolation_test@example.com", "password": "abcdef12"},
    )
    assert reg.status_code == 201, reg.text
    other_headers = {"Authorization": f"Bearer {reg.json()['access_token']}"}

    # Danh sách lead của tài khoản mới không được chứa lead của tài khoản demo
    other_list = client.get("/leads", headers=other_headers)
    assert other_list.status_code == 200
    assert all(
        lead["id"] != demo_lead["id"] for lead in other_list.json()["items"]
    )

    # Không thể truy cập trực tiếp lead của người khác qua id
    forbidden = client.get(f"/leads/{demo_lead['id']}", headers=other_headers)
    assert forbidden.status_code == 404
