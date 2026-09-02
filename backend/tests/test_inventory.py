
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
    AuditLog,
)
from app.core.security import hash_password, create_access_token


TEST_DATABASE_URL = "sqlite:///./test_inventory.db"

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
        username="inventorytestuser",
        email="inventorytest@example.com",
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
        sku="INV-SKU-001",
        name="Inventory Test Product",
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
        name="Main Warehouse",
        location="Lahore",
        is_active=True,
    )

    db_session.add(warehouse)
    db_session.commit()
    db_session.refresh(warehouse)

    return warehouse


def test_receive_stock_success(
    client,
    db_session,
    auth_headers,
    product,
    warehouse,
):
    response = client.post(
        "/inventory/receive",
        json={
            "product_id": product.id,
            "warehouse_id": warehouse.id,
            "quantity": 50,
        },
        headers=auth_headers,
    )

    assert response.status_code == 201

    data = response.json()

    assert data["message"] == "Stock Successfully Received"

    stock = (
        db_session.query(StockBalance)
        .filter(
            StockBalance.product_id == product.id,
            StockBalance.warehouse_id == warehouse.id,
        )
        .first()
    )

    assert stock is not None
    assert stock.quantity == 50


def test_receive_stock_creates_inventory_movement(
    client,
    db_session,
    auth_headers,
    product,
    warehouse,
):
    response = client.post(
        "/inventory/receive",
        json={
            "product_id": product.id,
            "warehouse_id": warehouse.id,
            "quantity": 25,
        },
        headers=auth_headers,
    )

    assert response.status_code == 201

    movement = (
        db_session.query(InventoryMovement)
        .filter(
            InventoryMovement.product_id == product.id,
            InventoryMovement.warehouse_id == warehouse.id,
        )
        .first()
    )

    assert movement is not None
    assert movement.movement_type == "RECEIPT"
    assert movement.qty_delta == 25


def test_receive_stock_default_reference_type(
    client,
    db_session,
    auth_headers,
    product,
    warehouse,
):
    response = client.post(
        "/inventory/receive",
        json={
            "product_id": product.id,
            "warehouse_id": warehouse.id,
            "quantity": 10,
        },
        headers=auth_headers,
    )

    assert response.status_code == 201

    movement = (
        db_session.query(InventoryMovement)
        .filter(
            InventoryMovement.product_id == product.id,
            InventoryMovement.warehouse_id == warehouse.id,
        )
        .first()
    )

    assert movement.reference_type == "Purchase Order"
    assert movement.reference_id is None


def test_receive_stock_custom_reference(
    client,
    db_session,
    auth_headers,
    product,
    warehouse,
):
    response = client.post(
        "/inventory/receive",
        json={
            "product_id": product.id,
            "warehouse_id": warehouse.id,
            "quantity": 15,
            "reference_type": "GRN",
            "reference_id": 123,
        },
        headers=auth_headers,
    )

    assert response.status_code == 201

    movement = (
        db_session.query(InventoryMovement)
        .filter(
            InventoryMovement.product_id == product.id,
            InventoryMovement.warehouse_id == warehouse.id,
        )
        .first()
    )

    assert movement.reference_type == "GRN"
    assert movement.reference_id == 123


def test_receive_stock_updates_existing_balance(
    client,
    db_session,
    auth_headers,
    product,
    warehouse,
):
    stock = StockBalance(
        product_id=product.id,
        warehouse_id=warehouse.id,
        quantity=100,
    )

    db_session.add(stock)
    db_session.commit()

    response = client.post(
        "/inventory/receive",
        json={
            "product_id": product.id,
            "warehouse_id": warehouse.id,
            "quantity": 30,
        },
        headers=auth_headers,
    )

    assert response.status_code == 201

    db_session.refresh(stock)

    assert stock.quantity == 130


def test_receive_stock_multiple_receipts(
    client,
    db_session,
    auth_headers,
    product,
    warehouse,
):
    response1 = client.post(
        "/inventory/receive",
        json={
            "product_id": product.id,
            "warehouse_id": warehouse.id,
            "quantity": 40,
        },
        headers=auth_headers,
    )

    response2 = client.post(
        "/inventory/receive",
        json={
            "product_id": product.id,
            "warehouse_id": warehouse.id,
            "quantity": 60,
        },
        headers=auth_headers,
    )

    assert response1.status_code == 201
    assert response2.status_code == 201

    stock = (
        db_session.query(StockBalance)
        .filter(
            StockBalance.product_id == product.id,
            StockBalance.warehouse_id == warehouse.id,
        )
        .first()
    )

    assert stock.quantity == 100

    movements = (
        db_session.query(InventoryMovement)
        .filter(
            InventoryMovement.product_id == product.id,
            InventoryMovement.warehouse_id == warehouse.id,
        )
        .all()
    )

    assert len(movements) == 2


def test_receive_stock_invalid_product(
    client,
    auth_headers,
    warehouse,
):
    response = client.post(
        "/inventory/receive",
        json={
            "product_id": 99999,
            "warehouse_id": warehouse.id,
            "quantity": 10,
        },
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Product or Warehouse do not found"


def test_receive_stock_invalid_warehouse(
    client,
    auth_headers,
    product,
):
    response = client.post(
        "/inventory/receive",
        json={
            "product_id": product.id,
            "warehouse_id": 99999,
            "quantity": 10,
        },
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Product or Warehouse do not found"


def test_receive_stock_inactive_product(
    client,
    db_session,
    auth_headers,
    warehouse,
):
    product = Product(
        sku="INACTIVE-SKU",
        name="Inactive Product",
        category="General",
        unit="pcs",
        reorder_point=10,
        unit_cost=50.0,
        is_active=False,
    )

    db_session.add(product)
    db_session.commit()
    db_session.refresh(product)

    response = client.post(
        "/inventory/receive",
        json={
            "product_id": product.id,
            "warehouse_id": warehouse.id,
            "quantity": 10,
        },
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Product or Warehouse do not found"


def test_receive_stock_inactive_warehouse(
    client,
    db_session,
    auth_headers,
    product,
):
    warehouse = Warehouse(
        name="Inactive Warehouse",
        location="Lahore",
        is_active=False,
    )

    db_session.add(warehouse)
    db_session.commit()
    db_session.refresh(warehouse)

    response = client.post(
        "/inventory/receive",
        json={
            "product_id": product.id,
            "warehouse_id": warehouse.id,
            "quantity": 10,
        },
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Product or Warehouse do not found"


def test_receive_stock_zero_quantity(
    client,
    auth_headers,
    product,
    warehouse,
):
    response = client.post(
        "/inventory/receive",
        json={
            "product_id": product.id,
            "warehouse_id": warehouse.id,
            "quantity": 0,
        },
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Quantity should be greater than 0"


def test_receive_stock_negative_quantity(
    client,
    auth_headers,
    product,
    warehouse,
):
    response = client.post(
        "/inventory/receive",
        json={
            "product_id": product.id,
            "warehouse_id": warehouse.id,
            "quantity": -10,
        },
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Quantity should be greater than 0"


def test_receive_stock_without_auth(
    client,
    product,
    warehouse,
):
    response = client.post(
        "/inventory/receive",
        json={
            "product_id": product.id,
            "warehouse_id": warehouse.id,
            "quantity": 10,
        },
    )

    assert response.status_code in [401, 403]


def test_receive_stock_records_created_by_user(
    client,
    db_session,
    auth_headers,
    product,
    warehouse,
):
    response = client.post(
        "/inventory/receive",
        json={
            "product_id": product.id,
            "warehouse_id": warehouse.id,
            "quantity": 20,
        },
        headers=auth_headers,
    )

    assert response.status_code == 201

    movement = (
        db_session.query(InventoryMovement)
        .filter(
            InventoryMovement.product_id == product.id,
            InventoryMovement.warehouse_id == warehouse.id,
        )
        .first()
    )

    assert movement is not None
    assert movement.created_by is not None


def test_receive_stock_creates_audit_log(
    client,
    db_session,
    auth_headers,
    product,
    warehouse,
):
    response = client.post(
        "/inventory/receive",
        json={
            "product_id": product.id,
            "warehouse_id": warehouse.id,
            "quantity": 35,
        },
        headers=auth_headers,
    )

    assert response.status_code == 201

    audit = (
        db_session.query(AuditLog)
        .filter(
            AuditLog.action == "RECEIVE_STOCK",
            AuditLog.entity == "StockBalance",
        )
        .first()
    )

    assert audit is not None
    assert audit.action == "RECEIVE_STOCK"
    assert audit.entity == "StockBalance"


def test_receive_stock_does_not_create_stock_on_invalid_quantity(
    client,
    db_session,
    auth_headers,
    product,
    warehouse,
):
    response = client.post(
        "/inventory/receive",
        json={
            "product_id": product.id,
            "warehouse_id": warehouse.id,
            "quantity": -5,
        },
        headers=auth_headers,
    )

    assert response.status_code == 400

    stock = (
        db_session.query(StockBalance)
        .filter(
            StockBalance.product_id == product.id,
            StockBalance.warehouse_id == warehouse.id,
        )
        .first()
    )

    movement = (
        db_session.query(InventoryMovement)
        .filter(
            InventoryMovement.product_id == product.id,
            InventoryMovement.warehouse_id == warehouse.id,
        )
        .first()
    )

    assert stock is None
    assert movement is None

