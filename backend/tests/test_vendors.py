
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.models.tables import User, Vendor, AuditLog
from app.core.security import hash_password, create_access_token


TEST_DATABASE_URL = "sqlite:///./test_vendors.db"

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
        username="vendortestuser",
        email="vendortest@example.com",
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
def vendor(db_session):
    vendor = Vendor(
        name="Test Vendor",
        contact_info="03001234567",
        address="Lahore",
        is_active=True,
    )

    db_session.add(vendor)
    db_session.commit()
    db_session.refresh(vendor)

    return vendor


def test_create_vendor(
    client,
    db_session,
    auth_headers,
):
    response = client.post(
        "/vendors/create",
        json={
            "name": "New Vendor",
            "contact_info": "03111234567",
            "address": "Islamabad",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["name"] == "New Vendor"
    assert data["contact_info"] == "03111234567"
    assert data["address"] == "Islamabad"
    assert data["is_active"] is True
    assert "id" in data

    saved_vendor = (
        db_session.query(Vendor)
        .filter(Vendor.name == "New Vendor")
        .first()
    )

    assert saved_vendor is not None


def test_create_duplicate_vendor(
    client,
    auth_headers,
    vendor,
):
    response = client.post(
        "/vendors/create",
        json={
            "name": "Test Vendor",
            "contact_info": "03009999999",
            "address": "Karachi",
        },
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert (
        response.json()["detail"]
        == "This name already taken: Try some other name"
    )


def test_create_vendor_without_auth(client):
    response = client.post(
        "/vendors/create",
        json={
            "name": "Unauthorized Vendor",
            "contact_info": "03000000000",
            "address": "Lahore",
        },
    )

    assert response.status_code in [401, 403]


def test_get_vendors(
    client,
    vendor,
):
    response = client.get("/vendors/get")

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)
    assert len(data) == 1

    assert data[0]["id"] == vendor.id
    assert data[0]["name"] == "Test Vendor"
    assert data[0]["contact_info"] == "03001234567"
    assert data[0]["address"] == "Lahore"
    assert data[0]["is_active"] is True


def test_get_vendors_only_active(
    client,
    db_session,
):
    active_vendor = Vendor(
        name="Active Vendor",
        contact_info="03001111111",
        address="Lahore",
        is_active=True,
    )

    inactive_vendor = Vendor(
        name="Inactive Vendor",
        contact_info="03002222222",
        address="Karachi",
        is_active=False,
    )

    db_session.add_all([
        active_vendor,
        inactive_vendor,
    ])
    db_session.commit()

    response = client.get("/vendors/get")

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["name"] == "Active Vendor"


def test_get_vendor_by_id(
    client,
    vendor,
):
    response = client.get(
        f"/vendors/get/{vendor.id}"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == vendor.id
    assert data["name"] == "Test Vendor"
    assert data["contact_info"] == "03001234567"
    assert data["address"] == "Lahore"
    assert data["is_active"] is True


def test_get_vendor_not_found(client):
    response = client.get("/vendors/get/99999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Vendor Not Found"


def test_get_inactive_vendor_by_id(
    client,
    db_session,
):
    vendor = Vendor(
        name="Inactive Vendor",
        contact_info="03003333333",
        address="Faisalabad",
        is_active=False,
    )

    db_session.add(vendor)
    db_session.commit()
    db_session.refresh(vendor)

    response = client.get(
        f"/vendors/get/{vendor.id}"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Vendor Not Found"


def test_update_vendor(
    client,
    db_session,
    auth_headers,
    vendor,
):
    response = client.put(
        f"/vendors/update/{vendor.id}",
        json={
            "name": "Updated Vendor",
            "contact_info": "03211234567",
            "address": "Islamabad",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == vendor.id
    assert data["name"] == "Updated Vendor"
    assert data["contact_info"] == "03211234567"
    assert data["address"] == "Islamabad"
    assert data["is_active"] is True

    db_session.refresh(vendor)

    assert vendor.name == "Updated Vendor"
    assert vendor.contact_info == "03211234567"
    assert vendor.address == "Islamabad"


def test_update_vendor_name_only(
    client,
    db_session,
    auth_headers,
    vendor,
):
    response = client.put(
        f"/vendors/update/{vendor.id}",
        json={
            "name": "Name Only Updated",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["name"] == "Name Only Updated"
    assert data["contact_info"] == "03001234567"
    assert data["address"] == "Lahore"

    db_session.refresh(vendor)

    assert vendor.name == "Name Only Updated"
    assert vendor.contact_info == "03001234567"
    assert vendor.address == "Lahore"


def test_update_vendor_contact_only(
    client,
    auth_headers,
    vendor,
):
    response = client.put(
        f"/vendors/update/{vendor.id}",
        json={
            "contact_info": "03331234567",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["name"] == "Test Vendor"
    assert data["contact_info"] == "03331234567"
    assert data["address"] == "Lahore"


def test_update_vendor_address_only(
    client,
    auth_headers,
    vendor,
):
    response = client.put(
        f"/vendors/update/{vendor.id}",
        json={
            "address": "Multan",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["name"] == "Test Vendor"
    assert data["contact_info"] == "03001234567"
    assert data["address"] == "Multan"


def test_update_vendor_not_found(
    client,
    auth_headers,
):
    response = client.put(
        "/vendors/update/99999",
        json={
            "name": "Updated Vendor",
        },
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Vendor Not Found"


def test_update_inactive_vendor(
    client,
    db_session,
    auth_headers,
):
    vendor = Vendor(
        name="Inactive Vendor",
        contact_info="03004444444",
        address="Lahore",
        is_active=False,
    )

    db_session.add(vendor)
    db_session.commit()
    db_session.refresh(vendor)

    response = client.put(
        f"/vendors/update/{vendor.id}",
        json={
            "name": "Trying To Update",
        },
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Vendor Not Found"


def test_update_vendor_without_auth(
    client,
    vendor,
):
    response = client.put(
        f"/vendors/update/{vendor.id}",
        json={
            "name": "Unauthorized Update",
        },
    )

    assert response.status_code in [401, 403]


def test_delete_vendor(
    client,
    db_session,
    auth_headers,
    vendor,
):
    response = client.delete(
        f"/vendors/delete/{vendor.id}",
        headers=auth_headers,
    )

    assert response.status_code == 204

    db_session.refresh(vendor)

    assert vendor.is_active is False


def test_delete_vendor_not_found(
    client,
    auth_headers,
):
    response = client.delete(
        "/vendors/delete/99999",
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "VENDOR NOT FOUND"


def test_delete_inactive_vendor(
    client,
    db_session,
    auth_headers,
):
    vendor = Vendor(
        name="Already Inactive",
        contact_info="03005555555",
        address="Lahore",
        is_active=False,
    )

    db_session.add(vendor)
    db_session.commit()
    db_session.refresh(vendor)

    response = client.delete(
        f"/vendors/delete/{vendor.id}",
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "VENDOR NOT FOUND"


def test_delete_vendor_without_auth(
    client,
    vendor,
):
    response = client.delete(
        f"/vendors/delete/{vendor.id}",
    )

    assert response.status_code in [401, 403]


def test_deleted_vendor_not_returned(
    client,
    db_session,
    auth_headers,
    vendor,
):
    vendor.is_active = False
    db_session.commit()

    response = client.get("/vendors/get")

    assert response.status_code == 200
    assert response.json() == []

    response = client.get(
        f"/vendors/get/{vendor.id}"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Vendor Not Found"


def test_create_vendor_audit_log(
    client,
    db_session,
    auth_headers,
):
    response = client.post(
        "/vendors/create",
        json={
            "name": "Audit Vendor",
            "contact_info": "03006666666",
            "address": "Lahore",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    audit = (
        db_session.query(AuditLog)
        .filter(
            AuditLog.action == "CREATE_VENDOR",
            AuditLog.entity == "Vendor",
        )
        .first()
    )

    assert audit is not None
    assert audit.action == "CREATE_VENDOR"
    assert audit.entity == "Vendor"


def test_update_vendor_audit_log(
    client,
    db_session,
    auth_headers,
    vendor,
):
    response = client.put(
        f"/vendors/update/{vendor.id}",
        json={
            "name": "Audit Updated Vendor",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    audit = (
        db_session.query(AuditLog)
        .filter(
            AuditLog.action == "UPDATE_VENDOR",
            AuditLog.entity == "Vendor",
        )
        .first()
    )

    assert audit is not None
    assert audit.action == "UPDATE_VENDOR"
    assert audit.entity == "Vendor"


def test_delete_vendor_audit_log(
    client,
    db_session,
    auth_headers,
    vendor,
):
    response = client.delete(
        f"/vendors/delete/{vendor.id}",
        headers=auth_headers,
    )

    assert response.status_code == 204

    audit = (
        db_session.query(AuditLog)
        .filter(
            AuditLog.action == "DELETE_VENDOR",
            AuditLog.entity == "Vendor",
        )
        .first()
    )

    assert audit is not None
    assert audit.action == "DELETE_VENDOR"
    assert audit.entity == "Vendor"

