def test_dashboard_stats(client, auth_headers):
    # Create some data
    client.post("/api/v1/memories", json={"title": "M1", "content": "C1"}, headers=auth_headers)
    client.post("/api/v1/memories", json={"title": "M2", "content": "C2"}, headers=auth_headers)
    client.post("/api/v1/reflections", json={"situation": "S1"}, headers=auth_headers)
    create = client.post("/api/v1/goals", json={"title": "G1"}, headers=auth_headers)
    gid = create.json()["id"]
    client.patch(f"/api/v1/goals/{gid}", json={"status": "completed"}, headers=auth_headers)
    client.post("/api/v1/goals", json={"title": "G2"}, headers=auth_headers)

    resp = client.get("/api/v1/stats/dashboard", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_memories"] == 2
    assert data["total_reflections"] == 1
    assert data["total_goals"] == 2
    assert data["goals_completed"] == 1
    assert data["recent_memory_title"] == "M2"
    assert data["days_since_joined"] >= 0


def test_stats_unauthorized(client):
    resp = client.get("/api/v1/stats/dashboard")
    assert resp.status_code == 401
