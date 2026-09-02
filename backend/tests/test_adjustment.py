
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
    StockAdjustment,
    InventoryMovement,
    AuditLog,
)
from app.core.security import hash_password, create_access_token


TEST_DATABASE_URL = "sqlite:///./test_adjustments.db"

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
        username="adjustmenttestuser",
        email="adjustmenttest@example.com",
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
def product(db_session):
    product = Product(
        sku="ADJ-SKU-001",
        name="Adjustment Test Product",
        category="General",
        unit="pcs",
        reorder_point=10,
        unit_cost=100.0,
        is_active=True,
    )

    db_session.add(product)
    db_session.commit()
    db_session.refresh(product)

    return product


@pytest.fixture
def warehouse(db_session):
    warehouse = Warehouse(
        name="Adjustment Warehouse",
        location="Lahore",
        is_active=True,
    )

    db_session.add(warehouse)
    db_session.commit()
    db_session.refresh(warehouse)

    return warehouse


@pytest.fixture
def stock(db_session, product, warehouse):
    stock = StockBalance(
        product_id=product.id,
        warehouse_id=warehouse.id,
        quantity=100,
    )

    db_session.add(stock)
    db_session.commit()
    db_session.refresh(stock)

    return stock


def test_create_stock_adjustment_positive(
    client,
    db_session,
    auth_headers,
    product,
    warehouse,
):
    response = client.post(
        "/adjustments/stock_adjustments/",
        json={
            "product_id": product.id,
            "warehouse_id": warehouse.id,
            "qty_delta": 25,
            "reason": "Physical stock count",
            "approved_by": "Manager",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["product_id"] == product.id
    assert data["warehouse_id"] == warehouse.id
    assert data["qty_delta"] == 25
    assert data["reason"] == "Physical stock count"
    assert data["approved_by"] == "Manager"

    adjustment = (
        db_session.query(StockAdjustment)
        .filter(StockAdjustment.id == data["id"])
        .first()
    )

    assert adjustment is not None
    assert adjustment.qty_delta == 25


def test_create_stock_adjustment_negative(
    client,
    db_session,
    auth_headers,
    product,
    warehouse,
    stock,
):
    response = client.post(
        "/adjustments/stock_adjustments/",
        json={
            "product_id": product.id,
            "warehouse_id": warehouse.id,
            "qty_delta": -20,
            "reason": "Damaged goods",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["product_id"] == product.id
    assert data["qty_delta"] == -20
    assert data["reason"] == "Damaged goods"

    db_session.refresh(stock)

    assert stock.quantity == 80


def test_create_adjustment_updates_existing_stock(
    client,
    db_session,
    auth_headers,
    product,
    warehouse,
    stock,
):
    response = client.post(
        "/adjustments/stock_adjustments/",
        json={
            "product_id": product.id,
            "warehouse_id": warehouse.id,
            "qty_delta": 30,
            "reason": "Stock correction",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    db_session.refresh(stock)

    assert stock.quantity == 130


def test_create_adjustment_creates_stock_balance_if_missing(
    client,
    db_session,
    auth_headers,
    product,
    warehouse,
):
    existing_stock = (
        db_session.query(StockBalance)
        .filter(
            StockBalance.product_id == product.id,
            StockBalance.warehouse_id == warehouse.id,
        )
        .first()
    )

    assert existing_stock is None

    response = client.post(
        "/adjustments/stock_adjustments/",
        json={
            "product_id": product.id,
            "warehouse_id": warehouse.id,
            "qty_delta": 40,
            "reason": "Initial stock correction",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    stock = (
        db_session.query(StockBalance)
        .filter(
            StockBalance.product_id == product.id,
            StockBalance.warehouse_id == warehouse.id,
        )
        .first()
    )

    assert stock is not None
    assert stock.quantity == 40


def test_create_adjustment_default_approved_by(
    client,
    auth_headers,
    product,
    warehouse,
):
    response = client.post(
        "/adjustments/stock_adjustments/",
        json={
            "product_id": product.id,
            "warehouse_id": warehouse.id,
            "qty_delta": 10,
            "reason": "Correction",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["approved_by"] is None


def test_adjustment_creates_inventory_movement(
    client,
    db_session,
    auth_headers,
    product,
    warehouse,
    stock,
):
    response = client.post(
        "/adjustments/stock_adjustments/",
        json={
            "product_id": product.id,
            "warehouse_id": warehouse.id,
            "qty_delta": 15,
            "reason": "Inventory correction",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    adjustment_id = response.json()["id"]

    movement = (
        db_session.query(InventoryMovement)
        .filter(
            InventoryMovement.reference_type == "StockAdjustment",
            InventoryMovement.reference_id == adjustment_id,
        )
        .first()
    )

    assert movement is not None
    assert movement.product_id == product.id
    assert movement.warehouse_id == warehouse.id
    assert movement.movement_type == "ADJUSTMENT"
    assert movement.qty_delta == 15


def test_negative_adjustment_creates_negative_movement(
    client,
    db_session,
    auth_headers,
    product,
    warehouse,
    stock,
):
    response = client.post(
        "/adjustments/stock_adjustments/",
        json={
            "product_id": product.id,
            "warehouse_id": warehouse.id,
            "qty_delta": -35,
            "reason": "Damaged stock",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    adjustment_id = response.json()["id"]

    movement = (
        db_session.query(InventoryMovement)
        .filter(
            InventoryMovement.reference_type == "StockAdjustment",
            InventoryMovement.reference_id == adjustment_id,
        )
        .first()
    )

    assert movement is not None
    assert movement.qty_delta == -35
    assert movement.movement_type == "ADJUSTMENT"


def test_adjustment_creates_audit_log(
    client,
    db_session,
    auth_headers,
    product,
    warehouse,
):
    response = client.post(
        "/adjustments/stock_adjustments/",
        json={
            "product_id": product.id,
            "warehouse_id": warehouse.id,
            "qty_delta": 20,
            "reason": "Audit correction",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    adjustment_id = response.json()["id"]

    audit = (
        db_session.query(AuditLog)
        .filter(
            AuditLog.action == "CREATE_STOCK_ADJUSTMENT",
            AuditLog.entity == "StockAdjustment",
            AuditLog.entity_id == adjustment_id,
        )
        .first()
    )

    assert audit is not None
    assert audit.action == "CREATE_STOCK_ADJUSTMENT"


def test_adjustment_invalid_warehouse(
    client,
    auth_headers,
    product,
):
    response = client.post(
        "/adjustments/stock_adjustments/",
        json={
            "product_id": product.id,
            "warehouse_id": 99999,
            "qty_delta": 10,
            "reason": "Invalid warehouse test",
        },
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Warehouse not found"


def test_adjustment_invalid_product(
    client,
    auth_headers,
    warehouse,
):
    response = client.post(
        "/adjustments/stock_adjustments/",
        json={
            "product_id": 99999,
            "warehouse_id": warehouse.id,
            "qty_delta": 10,
            "reason": "Invalid product test",
        },
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Product not found"


def test_adjustment_without_auth(
    client,
    product,
    warehouse,
):
    response = client.post(
        "/adjustments/stock_adjustments/",
        json={
            "product_id": product.id,
            "warehouse_id": warehouse.id,
            "qty_delta": 10,
            "reason": "Unauthorized adjustment",
        },
    )

    assert response.status_code in [401, 403]


def test_adjustment_missing_product_id(
    client,
    auth_headers,
    warehouse,
):
    response = client.post(
        "/adjustments/stock_adjustments/",
        json={
            "warehouse_id": warehouse.id,
            "qty_delta": 10,
            "reason": "Missing product",
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


def test_adjustment_missing_warehouse_id(
    client,
    auth_headers,
    product,
):
    response = client.post(
        "/adjustments/stock_adjustments/",
        json={
            "product_id": product.id,
            "qty_delta": 10,
            "reason": "Missing warehouse",
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


def test_adjustment_missing_qty_delta(
    client,
    auth_headers,
    product,
    warehouse,
):
    response = client.post(
        "/adjustments/stock_adjustments/",
        json={
            "product_id": product.id,
            "warehouse_id": warehouse.id,
            "reason": "Missing quantity",
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


def test_adjustment_missing_reason(
    client,
    auth_headers,
    product,
    warehouse,
):
    response = client.post(
        "/adjustments/stock_adjustments/",
        json={
            "product_id": product.id,
            "warehouse_id": warehouse.id,
            "qty_delta": 10,
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


def test_zero_quantity_adjustment(
    client,
    db_session,
    auth_headers,
    product,
    warehouse,
):
    response = client.post(
        "/adjustments/stock_adjustments/",
        json={
            "product_id": product.id,
            "warehouse_id": warehouse.id,
            "qty_delta": 0,
            "reason": "Zero adjustment",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["qty_delta"] == 0

    stock = (
        db_session.query(StockBalance)
        .filter(
            StockBalance.product_id == product.id,
            StockBalance.warehouse_id == warehouse.id,
        )
        .first()
    )

    assert stock is not None
    assert stock.quantity == 0

