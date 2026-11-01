def test_create_goal(client, auth_headers):
    resp = client.post("/api/v1/goals", json={
        "title": "Read more books",
        "description": "Read at least one book per month",
    }, headers=auth_headers)
    assert resp.status_code == 201
    assert resp.json()["title"] == "Read more books"
    assert resp.json()["status"] == "planned"


def test_list_goals(client, auth_headers):
    client.post("/api/v1/goals", json={"title": "G1"}, headers=auth_headers)
    client.post("/api/v1/goals", json={"title": "G2"}, headers=auth_headers)
    resp = client.get("/api/v1/goals", headers=auth_headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_update_goal_status(client, auth_headers):
    create = client.post("/api/v1/goals", json={"title": "G"}, headers=auth_headers)
    gid = create.json()["id"]
    resp = client.patch(f"/api/v1/goals/{gid}", json={"status": "in_progress"}, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["status"] == "in_progress"
    resp2 = client.patch(f"/api/v1/goals/{gid}", json={"status": "completed"}, headers=auth_headers)
    assert resp2.json()["status"] == "completed"


def test_delete_goal(client, auth_headers):
    create = client.post("/api/v1/goals", json={"title": "G"}, headers=auth_headers)
    gid = create.json()["id"]
    resp = client.delete(f"/api/v1/goals/{gid}", headers=auth_headers)
    assert resp.status_code == 204


def test_ownership_goal(client, auth_headers, second_auth_headers):
    create = client.post("/api/v1/goals", json={"title": "Mine"}, headers=auth_headers)
    gid = create.json()["id"]
    resp = client.patch(f"/api/v1/goals/{gid}", json={"title": "Hacked"}, headers=second_auth_headers)
    assert resp.status_code == 404
    resp = client.delete(f"/api/v1/goals/{gid}", headers=second_auth_headers)
    assert resp.status_code == 404
