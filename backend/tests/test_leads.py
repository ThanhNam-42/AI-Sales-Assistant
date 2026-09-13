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
    scores = [lead["score"] for lead in resp.json()]
    assert scores == sorted(scores, reverse=True)


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
