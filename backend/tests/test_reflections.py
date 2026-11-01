def test_create_reflection(client, auth_headers):
    resp = client.post("/api/v1/reflections", json={
        "situation": "An argument",
        "feelings": "Sad and confused",
        "lesson": "Listen more",
        "closure_note": "Let it go",
    }, headers=auth_headers)
    assert resp.status_code == 201
    assert resp.json()["situation"] == "An argument"


def test_list_reflections(client, auth_headers):
    client.post("/api/v1/reflections", json={"situation": "S1"}, headers=auth_headers)
    client.post("/api/v1/reflections", json={"situation": "S2"}, headers=auth_headers)
    resp = client.get("/api/v1/reflections", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_update_reflection(client, auth_headers):
    create = client.post("/api/v1/reflections", json={"situation": "S"}, headers=auth_headers)
    rid = create.json()["id"]
    resp = client.patch(f"/api/v1/reflections/{rid}", json={"situation": "Updated"}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["situation"] == "Updated"


def test_delete_reflection(client, auth_headers):
    create = client.post("/api/v1/reflections", json={"situation": "S"}, headers=auth_headers)
    rid = create.json()["id"]
    resp = client.delete(f"/api/v1/reflections/{rid}", headers=auth_headers)
    assert resp.status_code == 204


def test_ownership_reflection(client, auth_headers, second_auth_headers):
    create = client.post("/api/v1/reflections", json={"situation": "Private"}, headers=auth_headers)
    rid = create.json()["id"]
    resp = client.patch(f"/api/v1/reflections/{rid}", json={"situation": "Hacked"}, headers=second_auth_headers)
    assert resp.status_code == 404
    resp = client.delete(f"/api/v1/reflections/{rid}", headers=second_auth_headers)
    assert resp.status_code == 404
