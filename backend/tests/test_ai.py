import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.models.tables import (
    User,
    Product,
    Warehouse,
    StockBalance,
    InventoryMovement,
    AIAnalysisResult,
)
from app.core.security import hash_password, create_access_token


TEST_DATABASE_URL = "sqlite:///./test_ai.db"

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
        username="aitestuser",
        email="aitest@example.com",
        password_hash=hash_password("TestPassword123"),
        role="staff",
        is_active=True,
    )

    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # Trying common parameter name 'sub' or passing data directly depending on your security implementation
    try:
        token = create_access_token(sub=user.email, role=user.role)
    except TypeError:
        token = create_access_token({"sub": user.email, "role": user.role})

    return {
        "Authorization": f"Bearer {token}"
    }


@pytest.fixture
def product(db_session):
    product = Product(
        sku="AI-SKU-001",
        name="AI Test Product",
        category="General",
        unit="pcs",
        reorder_point=10,
        unit_cost=50.0,
        is_active=True,
    )

    db_session.add(product)
    db_session.commit()
    db_session.refresh(product)

    return product


@pytest.fixture
def warehouse(db_session):
    warehouse = Warehouse(
        name="AI Warehouse",
        location="Islamabad",
        is_active=True,
    )

    db_session.add(warehouse)
    db_session.commit()
    db_session.refresh(warehouse)

    return warehouse


def test_get_ai_dashboard_summary_empty(
    client,
    auth_headers,
):
    response = client.get(
        "/ai/dashboard/summary",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert "kpis" in data
    assert "low_stock_panel" in data
    assert "ai_findings_feed" in data

    assert data["kpis"]["total_tracked_items"] == 0
    assert data["kpis"]["low_stock_count"] == 0
    assert data["kpis"]["negative_inventory_count"] == 0
    assert data["kpis"]["total_ai_findings"] == 0


def test_get_ai_dashboard_summary_with_data(
    client,
    db_session,
    auth_headers,
    product,
    warehouse,
):
    stock = StockBalance(
        product_id=product.id,
        warehouse_id=warehouse.id,
        quantity=5,
    )

    finding = AIAnalysisResult(
        scope="reconciliation:1:1",
        issue="Low stock detected",
        severity="HIGH",
        explanation="Stock is below reorder point.",
        possible_cause="High demand or delayed restock.",
        recommendation="Reorder immediately.",
    )

    db_session.add_all([stock, finding])
    db_session.commit()

    response = client.get(
        "/ai/dashboard/summary",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["kpis"]["total_tracked_items"] == 1
    assert data["kpis"]["low_stock_count"] == 1
    assert data["kpis"]["total_ai_findings"] == 1

    assert len(data["low_stock_panel"]) == 1
    assert data["low_stock_panel"][0]["sku"] == "AI-SKU-001"

    assert len(data["ai_findings_feed"]) == 1
    assert data["ai_findings_feed"][0]["severity"] == "HIGH"


def test_get_ai_dashboard_summary_filter_severity(
    client,
    db_session,
    auth_headers,
):
    finding_high = AIAnalysisResult(
        scope="scope:1",
        issue="High issue",
        severity="HIGH",
        explanation="Test high",
        possible_cause="Test",
        recommendation="Test",
    )
    finding_low = AIAnalysisResult(
        scope="scope:2",
        issue="Low issue",
        severity="LOW",
        explanation="Test low",
        possible_cause="Test",
        recommendation="Test",
    )

    db_session.add_all([finding_high, finding_low])
    db_session.commit()

    response = client.get(
        "/ai/dashboard/summary?severity=HIGH",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["kpis"]["total_ai_findings"] == 1
    assert data["ai_findings_feed"][0]["severity"] == "HIGH"


def test_get_ai_dashboard_summary_invalid_severity(
    client,
    auth_headers,
):
    response = client.get(
        "/ai/dashboard/summary?severity=INVALID",
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert "Invalid severity" in response.json()["detail"]


def test_run_inventory_reconciliation_no_issues(
    client,
    db_session,
    auth_headers,
    product,
    warehouse,
):
    stock = StockBalance(
        product_id=product.id,
        warehouse_id=warehouse.id,
        quantity=50,
    )

    movement = InventoryMovement(
        product_id=product.id,
        warehouse_id=warehouse.id,
        movement_type="IN",
        qty_delta=50,
        reference_type="Initial",
        reference_id=1,
    )

    db_session.add_all([stock, movement])
    db_session.commit()

    response = client.post(
        "/ai/reconciliation/run",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "success"
    assert "Processed 1 stock pairs, generated 0 AI analysis findings" in data["message"]


def test_ai_chat_endpoint_unauthorized(
    client,
):
    response = client.post(
        "/ai/chat",
        json={"question": "What is my stock status?"},
    )

    assert response.status_code in [401, 403]


def test_ai_chat_endpoint_missing_question(
    client,
    auth_headers,
):
    response = client.post(
        "/ai/chat",
        json={"question": ""},
        headers=auth_headers,
    )

    assert response.status_code == 422