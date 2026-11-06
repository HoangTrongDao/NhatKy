import pytest
from fastapi.testclient import TestClient

from app.models.friend import Friendship


def _create_user(client: TestClient, email: str, name: str) -> tuple[dict, int]:
    """Helper to create a user and return (auth_headers, user_id)."""
    resp = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "password123",
        "display_name": name,
    })
    user_id = resp.json()["id"]

    login_resp = client.post("/api/v1/auth/login", data={
        "username": email,
        "password": "password123",
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    return headers, user_id


def test_send_message_requires_friendship(client: TestClient):
    headers1, user1_id = _create_user(client, "user1@example.com", "User 1")
    _, user2_id = _create_user(client, "user2@example.com", "User 2")

    # Attempt to send message without being friends
    resp = client.post(
        f"/api/v1/messages/{user2_id}",
        json={"content": "Xin chào!"},
        headers=headers1,
    )
    assert resp.status_code == 403
    assert "bạn bè" in resp.json()["detail"].lower()


def test_send_message_to_self(client: TestClient):
    headers1, user1_id = _create_user(client, "user1@example.com", "User 1")

    resp = client.post(
        f"/api/v1/messages/{user1_id}",
        json={"content": "Tự gửi tin"},
        headers=headers1,
    )
    assert resp.status_code == 400


def test_send_and_get_messages(client: TestClient, db):
    headers1, user1_id = _create_user(client, "alice@example.com", "Alice")
    headers2, user2_id = _create_user(client, "bob@example.com", "Bob")

    # Manually establish mutual friendship in db
    db.add(Friendship(user_id=user1_id, friend_id=user2_id))
    db.add(Friendship(user_id=user2_id, friend_id=user1_id))
    db.commit()

    # Alice sends message to Bob
    resp = client.post(
        f"/api/v1/messages/{user2_id}",
        json={"content": "Chào Bob! Bạn khỏe không?"},
        headers=headers1,
    )
    assert resp.status_code == 201
    msg_data = resp.json()
    assert msg_data["content"] == "Chào Bob! Bạn khỏe không?"
    assert msg_data["sender_id"] == user1_id
    assert msg_data["receiver_id"] == user2_id
    assert msg_data["read_at"] is None

    # Bob checks unread count
    resp = client.get("/api/v1/messages/unread-count", headers=headers2)
    assert resp.status_code == 200
    assert resp.json()["unread_count"] == 1

    # Bob lists conversations
    resp = client.get("/api/v1/messages/conversations", headers=headers2)
    assert resp.status_code == 200
    convs = resp.json()
    assert len(convs) == 1
    assert convs[0]["friend"]["id"] == user1_id
    assert convs[0]["unread_count"] == 1
    assert convs[0]["last_message"]["content"] == "Chào Bob! Bạn khỏe không?"

    # Bob opens messages from Alice (auto-marks as read)
    resp = client.get(f"/api/v1/messages/{user1_id}", headers=headers2)
    assert resp.status_code == 200
    msgs = resp.json()
    assert len(msgs) == 1
    assert msgs[0]["content"] == "Chào Bob! Bạn khỏe không?"

    # Bob checks unread count again -> should be 0
    resp = client.get("/api/v1/messages/unread-count", headers=headers2)
    assert resp.status_code == 200
    assert resp.json()["unread_count"] == 0

    # Bob replies
    resp = client.post(
        f"/api/v1/messages/{user1_id}",
        json={"content": "Chào Alice! Mình khỏe, cảm ơn bạn!"},
        headers=headers2,
    )
    assert resp.status_code == 201

    # Alice gets message history
    resp = client.get(f"/api/v1/messages/{user2_id}", headers=headers1)
    assert resp.status_code == 200
    msgs = resp.json()
    assert len(msgs) == 2
    assert msgs[0]["content"] == "Chào Bob! Bạn khỏe không?"
    assert msgs[1]["content"] == "Chào Alice! Mình khỏe, cảm ơn bạn!"
