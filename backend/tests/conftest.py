import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import Base, get_db
from app.main import app

SQLALCHEMY_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def auth_headers(client: TestClient):
    """Register a test user and return auth headers."""
    client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "password": "testpassword123",
        "display_name": "Test User",
    })
    resp = client.post("/api/v1/auth/login", data={
        "username": "test@example.com",
        "password": "testpassword123",
    })
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def second_auth_headers(client: TestClient):
    """Register a second test user and return auth headers."""
    client.post("/api/v1/auth/register", json={
        "email": "other@example.com",
        "password": "otherpassword123",
        "display_name": "Other User",
    })
    resp = client.post("/api/v1/auth/login", data={
        "username": "other@example.com",
        "password": "otherpassword123",
    })
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
