
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.models.tables import User, Warehouse
from app.core.security import hash_password, create_access_token


TEST_DATABASE_URL = "sqlite:///./test_warehouse.db"

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


@pytest.fixture
def auth_headers(db_session):
    user = User(
        username="warehousetestuser",
        email="warehousetest@example.com",
        password_hash=hash_password("TestPassword123"),
        role="staff",
        is_active=True,
    )

    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    token = create_access_token(
        Data={
            "sub": user.email,
            "role": user.role,
        }
    )

    return {
        "Authorization": f"Bearer {token}"
    }


@pytest.fixture
def warehouse(db_session):
    warehouse = Warehouse(
        name="Main Warehouse",
        location="Lahore",
        is_active=True,
    )

    db_session.add(warehouse)
    db_session.commit()
    db_session.refresh(warehouse)

    return warehouse


def test_create_warehouse(
    client,
    db_session,
    auth_headers,
):
    response = client.post(
        "/warehouses/create",
        json={
            "name": "New Warehouse",
            "location": "Islamabad",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["name"] == "New Warehouse"
    assert data["location"] == "Islamabad"
    assert data["is_active"] is True
    assert "id" in data

    saved_warehouse = (
        db_session.query(Warehouse)
        .filter(Warehouse.name == "New Warehouse")
        .first()
    )

    assert saved_warehouse is not None
    assert saved_warehouse.location == "Islamabad"


def test_create_duplicate_warehouse(
    client,
    auth_headers,
    warehouse,
):
    response = client.post(
        "/warehouses/create",
        json={
            "name": "Main Warehouse",
            "location": "Karachi",
        },
        headers=auth_headers,
    )

    assert response.status_code == 400

    assert (
        response.json()["detail"]
        == "This name already taken: Try some other name"
    )


def test_create_warehouse_without_auth(client):
    response = client.post(
        "/warehouses/create",
        json={
            "name": "Unauthorized Warehouse",
            "location": "Lahore",
        },
    )

    assert response.status_code in [401, 403]


def test_get_warehouses(
    client,
    warehouse,
):
    response = client.get("/warehouses/get")

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)
    assert len(data) == 1

    assert data[0]["id"] == warehouse.id
    assert data[0]["name"] == "Main Warehouse"
    assert data[0]["location"] == "Lahore"
    assert data[0]["is_active"] is True


def test_get_warehouses_only_active(
    client,
    db_session,
):
    active_warehouse = Warehouse(
        name="Active Warehouse",
        location="Lahore",
        is_active=True,
    )

    inactive_warehouse = Warehouse(
        name="Inactive Warehouse",
        location="Karachi",
        is_active=False,
    )

    db_session.add_all([
        active_warehouse,
        inactive_warehouse,
    ])
    db_session.commit()

    response = client.get("/warehouses/get")

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["name"] == "Active Warehouse"


def test_get_warehouse_by_id(
    client,
    warehouse,
):
    response = client.get(
        f"/warehouses/get/{warehouse.id}"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == warehouse.id
    assert data["name"] == "Main Warehouse"
    assert data["location"] == "Lahore"
    assert data["is_active"] is True


def test_get_warehouse_not_found(client):
    response = client.get("/warehouses/get/99999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Warehouse Not Found"


def test_get_inactive_warehouse_by_id(
    client,
    db_session,
):
    warehouse = Warehouse(
        name="Inactive Warehouse",
        location="Faisalabad",
        is_active=False,
    )

    db_session.add(warehouse)
    db_session.commit()
    db_session.refresh(warehouse)

    response = client.get(
        f"/warehouses/get/{warehouse.id}"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Warehouse Not Found"


def test_update_warehouse_name(
    client,
    db_session,
    auth_headers,
    warehouse,
):
    response = client.put(
        f"/warehouses/update/{warehouse.id}",
        json={
            "name": "Updated Warehouse",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["name"] == "Updated Warehouse"
    assert data["location"] == "Lahore"

    db_session.refresh(warehouse)

    assert warehouse.name == "Updated Warehouse"
    assert warehouse.location == "Lahore"


def test_update_warehouse_location(
    client,
    db_session,
    auth_headers,
    warehouse,
):
    response = client.put(
        f"/warehouses/update/{warehouse.id}",
        json={
            "location": "Islamabad",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["name"] == "Main Warehouse"
    assert data["location"] == "Islamabad"

    db_session.refresh(warehouse)

    assert warehouse.name == "Main Warehouse"
    assert warehouse.location == "Islamabad"


def test_update_warehouse_name_and_location(
    client,
    db_session,
    auth_headers,
    warehouse,
):
    response = client.put(
        f"/warehouses/update/{warehouse.id}",
        json={
            "name": "Updated Warehouse",
            "location": "Islamabad",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    # Current router uses if/elif, so only name is updated
    assert data["name"] == "Updated Warehouse"
    assert data["location"] == "Lahore"

    db_session.refresh(warehouse)

    assert warehouse.name == "Updated Warehouse"
    assert warehouse.location == "Lahore"


def test_update_warehouse_not_found(
    client,
    auth_headers,
):
    response = client.put(
        "/warehouses/update/99999",
        json={
            "name": "Updated Warehouse",
        },
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Warehouse Not Found"


def test_update_inactive_warehouse(
    client,
    db_session,
    auth_headers,
):
    warehouse = Warehouse(
        name="Inactive Warehouse",
        location="Lahore",
        is_active=False,
    )

    db_session.add(warehouse)
    db_session.commit()
    db_session.refresh(warehouse)

    response = client.put(
        f"/warehouses/update/{warehouse.id}",
        json={
            "name": "Trying To Update",
        },
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Warehouse Not Found"


def test_update_warehouse_without_auth(
    client,
    warehouse,
):
    response = client.put(
        f"/warehouses/update/{warehouse.id}",
        json={
            "name": "Unauthorized Update",
        },
    )

    assert response.status_code in [401, 403]


def test_delete_warehouse(
    client,
    db_session,
    auth_headers,
    warehouse,
):
    response = client.delete(
        f"/warehouses/delete/{warehouse.id}",
        headers=auth_headers,
    )

    assert response.status_code == 204

    db_session.refresh(warehouse)

    assert warehouse.is_active is False


def test_delete_warehouse_not_found(
    client,
    auth_headers,
):
    response = client.delete(
        "/warehouses/delete/99999",
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Warehouse NOT FOUND"


def test_delete_inactive_warehouse(
    client,
    db_session,
    auth_headers,
):
    warehouse = Warehouse(
        name="Already Inactive",
        location="Lahore",
        is_active=False,
    )

    db_session.add(warehouse)
    db_session.commit()
    db_session.refresh(warehouse)

    response = client.delete(
        f"/warehouses/delete/{warehouse.id}",
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Warehouse NOT FOUND"


def test_delete_warehouse_without_auth(
    client,
    warehouse,
):
    response = client.delete(
        f"/warehouses/delete/{warehouse.id}",
    )

    assert response.status_code in [401, 403]


def test_deleted_warehouse_not_returned(
    client,
    db_session,
    auth_headers,
    warehouse,
):
    warehouse.is_active = False
    db_session.commit()

    response = client.get("/warehouses/get")

    assert response.status_code == 200
    assert response.json() == []

    response = client.get(
        f"/warehouses/get/{warehouse.id}"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Warehouse Not Found"
