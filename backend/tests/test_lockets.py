def test_create_locket(client, auth_headers):
    resp = client.post("/api/v1/lockets", json={
        "image_url": "data:image/jpeg;base64,sampleimage123",
        "caption": "Khoảnh khắc tuyệt vời hôm nay",
        "visibility": "friends",
    }, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["caption"] == "Khoảnh khắc tuyệt vời hôm nay"
    assert data["image_url"] == "data:image/jpeg;base64,sampleimage123"
    assert data["visibility"] == "friends"
    assert "id" in data
    assert "owner" in data
    assert data["owner"]["display_name"] == "Test User"


def test_get_locket_feed(client, auth_headers, second_auth_headers):
    # User 1 posts public locket
    client.post("/api/v1/lockets", json={
        "image_url": "data:image/jpeg;base64,img1",
        "caption": "Public locket",
        "visibility": "public",
    }, headers=auth_headers)

    # User 2 views feed
    resp = client.get("/api/v1/lockets", headers=second_auth_headers)
    assert resp.status_code == 200
    feed = resp.json()
    assert len(feed) >= 1
    assert feed[0]["caption"] == "Public locket"


def test_react_to_locket(client, auth_headers):
    create = client.post("/api/v1/lockets", json={
        "image_url": "data:image/jpeg;base64,img_react",
        "caption": "React to this",
        "visibility": "public",
    }, headers=auth_headers)
    lid = create.json()["id"]

    # Toggle reaction ON
    resp1 = client.post(f"/api/v1/lockets/{lid}/react", json={"emoji": "❤️"}, headers=auth_headers)
    assert resp1.status_code == 200
    reactions1 = resp1.json()["reactions"]
    assert "❤️" in reactions1
    assert len(reactions1["❤️"]) == 1

    # Toggle reaction OFF
    resp2 = client.post(f"/api/v1/lockets/{lid}/react", json={"emoji": "❤️"}, headers=auth_headers)
    assert resp2.status_code == 200
    reactions2 = resp2.json()["reactions"]
    assert "❤️" not in reactions2 or len(reactions2.get("❤️", [])) == 0


def test_delete_locket(client, auth_headers, second_auth_headers):
    create = client.post("/api/v1/lockets", json={
        "image_url": "data:image/jpeg;base64,img_del",
        "caption": "Will be deleted",
        "visibility": "private",
    }, headers=auth_headers)
    lid = create.json()["id"]

    # Second user cannot delete
    del_other = client.delete(f"/api/v1/lockets/{lid}", headers=second_auth_headers)
    assert del_other.status_code == 404

    # Owner deletes
    del_owner = client.delete(f"/api/v1/lockets/{lid}", headers=auth_headers)
    assert del_owner.status_code == 204
