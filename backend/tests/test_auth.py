import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.models.tables import User
from app.core.security import hash_password


TEST_DATABASE_URL = "sqlite:///./test_auth.db"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)

    db = TestingSessionLocal()

    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


def test_register_user(client, db_session):
    response = client.post(
        "/auth/register",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "TestPassword123",
            "role": "staff",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["username"] == "testuser"
    assert data["email"] == "test@example.com"
    assert data["role"] == "staff"
    assert "id" in data

    user = (
        db_session.query(User)
        .filter(User.email == "test@example.com")
        .first()
    )

    assert user is not None
    assert user.username == "testuser"
    assert user.password_hash != "TestPassword123"


def test_register_duplicate_email(client, db_session):
    existing_user = User(
        username="existinguser",
        email="duplicate@example.com",
        role="staff",
        password_hash=hash_password("TestPassword123"),
    )

    db_session.add(existing_user)
    db_session.commit()

    response = client.post(
        "/auth/register",
        json={
            "username": "anotheruser",
            "email": "duplicate@example.com",
            "password": "AnotherPassword123",
            "role": "staff",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "User Already Existed"


def test_login_user(client, db_session):
    user = User(
        username="loginuser",
        email="login@example.com",
        role="staff",
        password_hash=hash_password("TestPassword123"),
    )

    db_session.add(user)
    db_session.commit()

    response = client.post(
        "/auth/login",
        data={
            "username": "login@example.com",
            "password": "TestPassword123",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

    assert isinstance(data["access_token"], str)
    assert isinstance(data["refresh_token"], str)


def test_login_invalid_password(client, db_session):
    user = User(
        username="wrongpassword",
        email="wrongpassword@example.com",
        role="staff",
        password_hash=hash_password("CorrectPassword123"),
    )

    db_session.add(user)
    db_session.commit()

    response = client.post(
        "/auth/login",
        data={
            "username": "wrongpassword@example.com",
            "password": "WrongPassword123",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid Credentials"


def test_login_nonexistent_user(client):
    response = client.post(
        "/auth/login",
        data={
            "username": "doesnotexist@example.com",
            "password": "TestPassword123",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid Credentials"

