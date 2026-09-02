import uuid
import json

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import SessionLocal
from app.core.security import hash_password, create_access_token
from app.models.tables import User, AuditLog

client = TestClient(app)


# =========================================================
# FIXTURES
# =========================================================

@pytest.fixture
def db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def user(db):
    unique = uuid.uuid4().hex[:8]

    user = User(
        username=f"audit_user_{unique}",
        email=f"audit_{unique}@example.com",
        password_hash=hash_password("password123"),
        role="staff",
        is_active=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@pytest.fixture
def second_user(db):
    unique = uuid.uuid4().hex[:8]

    user = User(
        username=f"audit_second_{unique}",
        email=f"audit_second_{unique}@example.com",
        password_hash=hash_password("password123"),
        role="staff",
        is_active=True,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@pytest.fixture
def auth_headers(user):
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
def audit_log(db, user):
    unique = uuid.uuid4().hex[:8]

    log = AuditLog(
        user_id=user.id,
        action="CREATE_PRODUCT",
        entity="Product",
        entity_id=1000,
        before=None,
        after=json.dumps({
            "name": f"Test Product {unique}",
            "sku": f"AUDIT-{unique}",
        }),
    )

    db.add(log)
    db.commit()
    db.refresh(log)

    return log


@pytest.fixture
def multiple_audit_logs(db, user):
    unique = uuid.uuid4().hex[:8]

    logs = [
        AuditLog(
            user_id=user.id,
            action="CREATE_PRODUCT",
            entity="Product",
            entity_id=1001,
            before=None,
            after=json.dumps({
                "name": "Product One",
            }),
        ),
        AuditLog(
            user_id=user.id,
            action="UPDATE_PRODUCT",
            entity="Product",
            entity_id=1001,
            before=json.dumps({
                "name": "Product One",
            }),
            after=json.dumps({
                "name": "Product Updated",
            }),
        ),
        AuditLog(
            user_id=user.id,
            action="DELETE_PRODUCT",
            entity="Product",
            entity_id=1001,
            before=json.dumps({
                "name": "Product Updated",
            }),
            after=None,
        ),
        AuditLog(
            user_id=user.id,
            action="CREATE_VENDOR",
            entity="Vendor",
            entity_id=2001,
            before=None,
            after=json.dumps({
                "name": f"Vendor {unique}",
            }),
        ),
    ]

    db.add_all(logs)
    db.commit()

    for log in logs:
        db.refresh(log)

    return logs


# =========================================================
# BASIC GET
# =========================================================

def test_get_audit_logs(
    auth_headers,
    audit_log,
):
    response = client.get(
        "/audit/",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)
    assert len(data) >= 1

    log = next(
        item
        for item in data
        if item["id"] == audit_log.id
    )

    assert log["user_id"] == audit_log.user_id
    assert log["action"] == "CREATE_PRODUCT"
    assert log["entity"] == "Product"
    assert log["entity_id"] == 1000


# =========================================================
# BEFORE / AFTER DATA
# =========================================================

def test_audit_log_before_after(
    auth_headers,
    audit_log,
):
    response = client.get(
        "/audit/",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    log = next(
        item
        for item in data
        if item["id"] == audit_log.id
    )

    assert log["before"] is None
    assert log["after"] is not None

    after_data = json.loads(log["after"])

    assert after_data["name"] in log["after"]


# =========================================================
# ENTITY FILTER
# =========================================================

def test_filter_audit_logs_by_entity(
    auth_headers,
    multiple_audit_logs,
):
    response = client.get(
        "/audit/?entity=Product",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) >= 1

    for log in data:
        assert log["entity"] == "Product"


def test_filter_audit_logs_by_non_existing_entity(
    auth_headers,
    multiple_audit_logs,
):
    response = client.get(
        "/audit/?entity=NonExistingEntity",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data == []


# =========================================================
# ENTITY ID FILTER
# =========================================================

def test_filter_audit_logs_by_entity_id(
    auth_headers,
    multiple_audit_logs,
):
    response = client.get(
        "/audit/?entity_id=1001",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) >= 1

    for log in data:
        assert log["entity_id"] == 1001


def test_filter_audit_logs_by_non_existing_entity_id(
    auth_headers,
    multiple_audit_logs,
):
    response = client.get(
        "/audit/?entity_id=999999",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data == []


# =========================================================
# USER ID FILTER
# =========================================================

def test_filter_audit_logs_by_user_id(
    auth_headers,
    user,
    audit_log,
):
    response = client.get(
        f"/audit/?user_id={user.id}",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) >= 1

    for log in data:
        assert log["user_id"] == user.id


def test_filter_audit_logs_by_non_existing_user_id(
    auth_headers,
    audit_log,
):
    response = client.get(
        "/audit/?user_id=999999",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data == []


# =========================================================
# LIMIT
# =========================================================

def test_audit_logs_limit(
    auth_headers,
    multiple_audit_logs,
):
    response = client.get(
        "/audit/?limit=2",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) <= 2


def test_audit_logs_limit_one(
    auth_headers,
    multiple_audit_logs,
):
    response = client.get(
        "/audit/?limit=1",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) <= 1


# =========================================================
# COMBINED FILTERS
# =========================================================

def test_audit_logs_combined_filters(
    auth_headers,
    user,
    multiple_audit_logs,
):
    response = client.get(
        f"/audit/?entity=Product&entity_id=1001&user_id={user.id}",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) >= 1

    for log in data:
        assert log["entity"] == "Product"
        assert log["entity_id"] == 1001
        assert log["user_id"] == user.id


# =========================================================
# NO FILTERS
# =========================================================

def test_audit_logs_without_filters(
    auth_headers,
    multiple_audit_logs,
):
    response = client.get(
        "/audit/",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)
    assert len(data) >= 4


# =========================================================
# AUTHENTICATION
# =========================================================

def test_audit_logs_without_auth(
    audit_log,
):
    response = client.get(
        "/audit/"
    )

    assert response.status_code in [401, 403]


# =========================================================
# RESPONSE STRUCTURE
# =========================================================

def test_audit_log_response_structure(
    auth_headers,
    audit_log,
):
    response = client.get(
        "/audit/",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    log = next(
        item
        for item in data
        if item["id"] == audit_log.id
    )

    assert "id" in log
    assert "user_id" in log
    assert "action" in log
    assert "entity" in log
    assert "entity_id" in log
    assert "before" in log
    assert "after" in log
    assert "created_at" in log


# =========================================================
# ACTION VALUES
# =========================================================

def test_audit_logs_return_correct_actions(
    auth_headers,
    multiple_audit_logs,
):
    response = client.get(
        "/audit/?entity=Product",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    actions = {
        log["action"]
        for log in data
    }

    assert "CREATE_PRODUCT" in actions
    assert "UPDATE_PRODUCT" in actions
    assert "DELETE_PRODUCT" in actions


# =========================================================
# SERVICE TEST
# =========================================================

def test_create_audit_log_service(
    db,
    user,
):
    from app.services.audit_service import create_audit_log

    before = {
        "name": "Old Product",
        "quantity": 10,
    }

    after = {
        "name": "New Product",
        "quantity": 20,
    }

    create_audit_log(
        db=db,
        user_id=user.id,
        action="UPDATE_PRODUCT",
        entity="Product",
        entity_id=5000,
        before=before,
        after=after,
    )

    db.commit()

    log = (
        db.query(AuditLog)
        .filter(
            AuditLog.user_id == user.id,
            AuditLog.action == "UPDATE_PRODUCT",
            AuditLog.entity_id == 5000,
        )
        .first()
    )

    assert log is not None

    assert log.before == json.dumps(before)
    assert log.after == json.dumps(after)


# =========================================================
# SERVICE TEST WITH NONE VALUES
# =========================================================

def test_create_audit_log_service_without_before_after(
    db,
    user,
):
    from app.services.audit_service import create_audit_log

    create_audit_log(
        db=db,
        user_id=user.id,
        action="CREATE_PRODUCT",
        entity="Product",
        entity_id=6000,
    )

    db.commit()

    log = (
        db.query(AuditLog)
        .filter(
            AuditLog.user_id == user.id,
            AuditLog.action == "CREATE_PRODUCT",
            AuditLog.entity_id == 6000,
        )
        .first()
    )

    assert log is not None
    assert log.before is None
    assert log.after is None