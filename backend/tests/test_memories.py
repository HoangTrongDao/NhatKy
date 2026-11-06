def test_create_memory(client, auth_headers):
    resp = client.post("/api/v1/memories", json={
        "title": "A happy day",
        "content": "It was wonderful",
    }, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "A happy day"
    assert data["visibility"] == "private"


def test_list_memories(client, auth_headers):
    client.post("/api/v1/memories", json={"title": "M1", "content": "C1"}, headers=auth_headers)
    client.post("/api/v1/memories", json={"title": "M2", "content": "C2"}, headers=auth_headers)
    resp = client.get("/api/v1/memories", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_get_memory(client, auth_headers):
    create = client.post("/api/v1/memories", json={"title": "T", "content": "C"}, headers=auth_headers)
    mid = create.json()["id"]
    resp = client.get(f"/api/v1/memories/{mid}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["title"] == "T"


def test_update_memory(client, auth_headers):
    create = client.post("/api/v1/memories", json={"title": "T", "content": "C"}, headers=auth_headers)
    mid = create.json()["id"]
    resp = client.patch(f"/api/v1/memories/{mid}", json={"title": "Updated"}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["title"] == "Updated"


def test_delete_memory(client, auth_headers):
    create = client.post("/api/v1/memories", json={"title": "T", "content": "C"}, headers=auth_headers)
    mid = create.json()["id"]
    resp = client.delete(f"/api/v1/memories/{mid}", headers=auth_headers)
    assert resp.status_code == 204


def test_ownership_check(client, auth_headers, second_auth_headers):
    create = client.post("/api/v1/memories", json={"title": "Secret", "content": "Mine"}, headers=auth_headers)
    mid = create.json()["id"]
    # Other user cannot access
    resp = client.get(f"/api/v1/memories/{mid}", headers=second_auth_headers)
    assert resp.status_code == 404
    resp = client.patch(f"/api/v1/memories/{mid}", json={"title": "Hacked"}, headers=second_auth_headers)
    assert resp.status_code == 404
    resp = client.delete(f"/api/v1/memories/{mid}", headers=second_auth_headers)
    assert resp.status_code == 404


def test_search_memories(client, auth_headers):
    client.post("/api/v1/memories", json={"title": "Beach sunset", "content": "Beautiful"}, headers=auth_headers)
    client.post("/api/v1/memories", json={"title": "Coffee morning", "content": "Nice"}, headers=auth_headers)
    resp = client.get("/api/v1/memories?search=beach", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1


def test_filter_visibility(client, auth_headers):
    client.post("/api/v1/memories", json={"title": "P1", "content": "C", "visibility": "public"}, headers=auth_headers)
    client.post("/api/v1/memories", json={"title": "P2", "content": "C", "visibility": "private"}, headers=auth_headers)
    resp = client.get("/api/v1/memories?visibility=public", headers=auth_headers)
    assert len(resp.json()) == 1
    assert resp.json()[0]["visibility"] == "public"


def test_pagination(client, auth_headers):
    for i in range(5):
        client.post("/api/v1/memories", json={"title": f"M{i}", "content": "C"}, headers=auth_headers)
    resp = client.get("/api/v1/memories?limit=2&offset=0", headers=auth_headers)
    assert len(resp.json()) == 2
    resp2 = client.get("/api/v1/memories?limit=2&offset=4", headers=auth_headers)
    assert len(resp2.json()) == 1


def test_create_memory_with_locket_image(client, auth_headers):
    resp = client.post("/api/v1/memories", json={
        "title": "Locket moment",
        "content": "Sunset with friends",
        "image_url": "data:image/jpeg;base64,locket123",
        "visibility": "public"
    }, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["image_url"] == "data:image/jpeg;base64,locket123"

    mid = data["id"]
    get_resp = client.get(f"/api/v1/memories/{mid}", headers=auth_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["image_url"] == "data:image/jpeg;base64,locket123"

