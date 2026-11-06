def test_get_profile(client, auth_headers):
    resp = client.get("/api/v1/profile", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "test@example.com"
    assert resp.json()["display_name"] == "Test User"


def test_update_profile(client, auth_headers):
    resp = client.patch("/api/v1/profile", json={
        "display_name": "Updated Name",
        "bio": "Hello world!",
        "avatar_url": "https://example.com/avatar.jpg",
    }, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["display_name"] == "Updated Name"
    assert resp.json()["bio"] == "Hello world!"
    assert resp.json()["avatar_url"] == "https://example.com/avatar.jpg"


def test_profile_unauthorized(client):
    resp = client.get("/api/v1/profile")
    assert resp.status_code == 401
