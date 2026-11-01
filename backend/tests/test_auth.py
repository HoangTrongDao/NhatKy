def test_register(client):
    resp = client.post("/api/v1/auth/register", json={
        "email": "new@example.com",
        "password": "mypassword123",
        "display_name": "New User",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "new@example.com"
    assert data["display_name"] == "New User"
    assert "id" in data


def test_register_duplicate(client):
    payload = {"email": "dup@example.com", "password": "password123", "display_name": "Dup"}
    client.post("/api/v1/auth/register", json=payload)
    resp = client.post("/api/v1/auth/register", json=payload)
    assert resp.status_code == 409


def test_login_success(client):
    client.post("/api/v1/auth/register", json={
        "email": "login@example.com", "password": "password123", "display_name": "Login User"
    })
    resp = client.post("/api/v1/auth/login", data={
        "username": "login@example.com", "password": "password123"
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_wrong_password(client):
    client.post("/api/v1/auth/register", json={
        "email": "wrong@example.com", "password": "password123", "display_name": "Wrong"
    })
    resp = client.post("/api/v1/auth/login", data={
        "username": "wrong@example.com", "password": "wrongpassword"
    })
    assert resp.status_code == 401


def test_me(client, auth_headers):
    resp = client.get("/api/v1/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "test@example.com"


def test_me_unauthorized(client):
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 401


def test_change_password(client, auth_headers):
    resp = client.post("/api/v1/auth/change-password", json={
        "current_password": "testpassword123",
        "new_password": "newpassword456",
    }, headers=auth_headers)
    assert resp.status_code == 200

    # Login with new password
    resp2 = client.post("/api/v1/auth/login", data={
        "username": "test@example.com", "password": "newpassword456"
    })
    assert resp2.status_code == 200


def test_change_password_wrong_current(client, auth_headers):
    resp = client.post("/api/v1/auth/change-password", json={
        "current_password": "wrongpassword",
        "new_password": "newpassword456",
    }, headers=auth_headers)
    assert resp.status_code == 400
