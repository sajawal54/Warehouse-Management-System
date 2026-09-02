import uuid

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import SessionLocal
from app.core.security import hash_password, create_access_token
from app.models.tables import (
    User,
    Product,
    Warehouse,
    StockBalance,
    StockTransfer,
    StockTransferItem,
    InventoryMovement,
    AuditLog,
)

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
        username=f"transfer_user_{unique}",
        email=f"transfer_{unique}@example.com",
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
def product(db):
    unique = uuid.uuid4().hex[:8]

    product = Product(
        sku=f"TRANSFER-{unique}",
        name="Transfer Test Product",
        category="Test",
        unit="pcs",
        reorder_point=10,
        unit_cost=100.0,
        is_active=True,
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    return product


@pytest.fixture
def warehouses(db):
    unique = uuid.uuid4().hex[:8]

    source = Warehouse(
        name=f"Transfer Source {unique}",
        location="Lahore",
        is_active=True,
    )

    destination = Warehouse(
        name=f"Transfer Destination {unique}",
        location="Faisalabad",
        is_active=True,
    )

    db.add_all([source, destination])
    db.commit()

    db.refresh(source)
    db.refresh(destination)

    return source, destination


@pytest.fixture
def source_stock(db, product, warehouses):
    source, _ = warehouses

    stock = StockBalance(
        product_id=product.id,
        warehouse_id=source.id,
        quantity=100,
    )

    db.add(stock)
    db.commit()
    db.refresh(stock)

    return stock


@pytest.fixture
def transfer(db, product, warehouses):
    source, destination = warehouses

    stock_transfer = StockTransfer(
        source_warehouse_id=source.id,
        dest_warehouse_id=destination.id,
        status="Pending",
    )

    db.add(stock_transfer)
    db.flush()

    item = StockTransferItem(
        transfer_id=stock_transfer.id,
        product_id=product.id,
        qty=20,
    )

    db.add(item)
    db.commit()
    db.refresh(stock_transfer)

    return stock_transfer


# =========================================================
# CREATE STOCK TRANSFER
# =========================================================

def test_create_stock_transfer(
    auth_headers,
    product,
    warehouses,
):
    source, destination = warehouses

    response = client.post(
        "/stock_transfer/stock_transfers/",
        json={
            "source_warehouse_id": source.id,
            "dest_warehouse_id": destination.id,
            "items": [
                {
                    "product_id": product.id,
                    "qty": 20,
                }
            ],
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["source_warehouse_id"] == source.id
    assert data["dest_warehouse_id"] == destination.id
    assert data["status"] == "Pending"

    assert len(data["items"]) == 1
    assert data["items"][0]["product_id"] == product.id
    assert data["items"][0]["qty"] == 20


def test_create_stock_transfer_multiple_items(
    auth_headers,
    product,
    warehouses,
    db,
):
    source, destination = warehouses

    unique = uuid.uuid4().hex[:8]

    product2 = Product(
        sku=f"TRANSFER-SECOND-{unique}",
        name="Second Transfer Product",
        category="Test",
        unit="pcs",
        reorder_point=10,
        unit_cost=200.0,
        is_active=True,
    )

    db.add(product2)
    db.commit()
    db.refresh(product2)

    response = client.post(
        "/stock_transfer/stock_transfers/",
        json={
            "source_warehouse_id": source.id,
            "dest_warehouse_id": destination.id,
            "items": [
                {
                    "product_id": product.id,
                    "qty": 20,
                },
                {
                    "product_id": product2.id,
                    "qty": 10,
                },
            ],
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "Pending"
    assert len(data["items"]) == 2


def test_create_stock_transfer_invalid_source_warehouse(
    auth_headers,
    product,
    warehouses,
):
    _, destination = warehouses

    response = client.post(
        "/stock_transfer/stock_transfers/",
        json={
            "source_warehouse_id": 999999,
            "dest_warehouse_id": destination.id,
            "items": [
                {
                    "product_id": product.id,
                    "qty": 20,
                }
            ],
        },
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == (
        "Source or destination warehouse not found"
    )


def test_create_stock_transfer_invalid_destination_warehouse(
    auth_headers,
    product,
    warehouses,
):
    source, _ = warehouses

    response = client.post(
        "/stock_transfer/stock_transfers/",
        json={
            "source_warehouse_id": source.id,
            "dest_warehouse_id": 999999,
            "items": [
                {
                    "product_id": product.id,
                    "qty": 20,
                }
            ],
        },
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == (
        "Source or destination warehouse not found"
    )


def test_create_stock_transfer_invalid_product(
    auth_headers,
    warehouses,
):
    source, destination = warehouses

    response = client.post(
        "/stock_transfer/stock_transfers/",
        json={
            "source_warehouse_id": source.id,
            "dest_warehouse_id": destination.id,
            "items": [
                {
                    "product_id": 999999,
                    "qty": 20,
                }
            ],
        },
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert "Product with ID" in response.json()["detail"]


def test_create_stock_transfer_without_auth(
    product,
    warehouses,
):
    source, destination = warehouses

    response = client.post(
        "/stock_transfer/stock_transfers/",
        json={
            "source_warehouse_id": source.id,
            "dest_warehouse_id": destination.id,
            "items": [
                {
                    "product_id": product.id,
                    "qty": 20,
                }
            ],
        },
    )

    assert response.status_code in [401, 403]


def test_create_stock_transfer_audit_log(
    auth_headers,
    product,
    warehouses,
    db,
):
    source, destination = warehouses

    response = client.post(
        "/stock_transfer/stock_transfers/",
        json={
            "source_warehouse_id": source.id,
            "dest_warehouse_id": destination.id,
            "items": [
                {
                    "product_id": product.id,
                    "qty": 20,
                }
            ],
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    transfer_id = response.json()["id"]

    audit = (
        db.query(AuditLog)
        .filter(
            AuditLog.action == "CREATE_STOCK_TRANSFER",
            AuditLog.entity_id == transfer_id,
        )
        .first()
    )

    assert audit is not None


# =========================================================
# COMPLETE STOCK TRANSFER
# =========================================================

def test_complete_stock_transfer(
    auth_headers,
    transfer,
    source_stock,
    product,
    warehouses,
    db,
):
    source, destination = warehouses

    response = client.post(
        f"/stock_transfer/stock_transfers/{transfer.id}/complete",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == transfer.id
    assert data["status"] == "Completed"

    # API uses a separate DB session.
    # Expire local session objects so fresh values are loaded.
    db.expire_all()

    source_stock_db = (
        db.query(StockBalance)
        .filter(
            StockBalance.product_id == product.id,
            StockBalance.warehouse_id == source.id,
        )
        .first()
    )

    destination_stock = (
        db.query(StockBalance)
        .filter(
            StockBalance.product_id == product.id,
            StockBalance.warehouse_id == destination.id,
        )
        .first()
    )

    assert source_stock_db is not None
    assert destination_stock is not None

    assert source_stock_db.quantity == 80
    assert destination_stock.quantity == 20


def test_complete_stock_transfer_existing_destination_stock(
    auth_headers,
    transfer,
    source_stock,
    product,
    warehouses,
    db,
):
    source, destination = warehouses

    destination_stock = StockBalance(
        product_id=product.id,
        warehouse_id=destination.id,
        quantity=50,
    )

    db.add(destination_stock)
    db.commit()

    response = client.post(
        f"/stock_transfer/stock_transfers/{transfer.id}/complete",
        headers=auth_headers,
    )

    assert response.status_code == 200

    # Refresh local session objects.
    db.expire_all()

    destination_stock_db = (
        db.query(StockBalance)
        .filter(
            StockBalance.product_id == product.id,
            StockBalance.warehouse_id == destination.id,
        )
        .first()
    )

    assert destination_stock_db is not None
    assert destination_stock_db.quantity == 70


def test_complete_stock_transfer_creates_inventory_movements(
    auth_headers,
    transfer,
    source_stock,
    product,
    warehouses,
    db,
):
    response = client.post(
        f"/stock_transfer/stock_transfers/{transfer.id}/complete",
        headers=auth_headers,
    )

    assert response.status_code == 200

    db.expire_all()

    movements = (
        db.query(InventoryMovement)
        .filter(
            InventoryMovement.reference_type == "StockTransfer",
            InventoryMovement.reference_id == transfer.id,
        )
        .all()
    )

    assert len(movements) == 2

    movement_types = {
        movement.movement_type
        for movement in movements
    }

    assert "TRANSFER_OUT" in movement_types
    assert "TRANSFER_IN" in movement_types


def test_complete_stock_transfer_correct_quantities(
    auth_headers,
    transfer,
    source_stock,
    product,
    warehouses,
    db,
):
    source, destination = warehouses

    response = client.post(
        f"/stock_transfer/stock_transfers/{transfer.id}/complete",
        headers=auth_headers,
    )

    assert response.status_code == 200

    db.expire_all()

    out_movement = (
        db.query(InventoryMovement)
        .filter(
            InventoryMovement.reference_id == transfer.id,
            InventoryMovement.movement_type == "TRANSFER_OUT",
        )
        .first()
    )

    in_movement = (
        db.query(InventoryMovement)
        .filter(
            InventoryMovement.reference_id == transfer.id,
            InventoryMovement.movement_type == "TRANSFER_IN",
        )
        .first()
    )

    assert out_movement is not None
    assert in_movement is not None

    assert out_movement.qty_delta == -20
    assert in_movement.qty_delta == 20

    assert out_movement.warehouse_id == source.id
    assert in_movement.warehouse_id == destination.id


def test_complete_stock_transfer_not_found(
    auth_headers,
):
    response = client.post(
        "/stock_transfer/stock_transfers/999999/complete",
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Stock transfer not found"


def test_complete_stock_transfer_already_completed(
    auth_headers,
    transfer,
    source_stock,
    db,
):
    transfer.status = "Completed"
    db.commit()

    response = client.post(
        f"/stock_transfer/stock_transfers/{transfer.id}/complete",
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Transfer is already completed"


def test_complete_stock_transfer_insufficient_stock(
    auth_headers,
    transfer,
    source_stock,
    db,
):
    source_stock.quantity = 5
    db.commit()

    response = client.post(
        f"/stock_transfer/stock_transfers/{transfer.id}/complete",
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert "Insufficient stock in source warehouse" in (
        response.json()["detail"]
    )


def test_complete_stock_transfer_without_stock(
    auth_headers,
    transfer,
):
    response = client.post(
        f"/stock_transfer/stock_transfers/{transfer.id}/complete",
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert "Insufficient stock in source warehouse" in (
        response.json()["detail"]
    )


def test_complete_stock_transfer_without_auth(
    transfer,
):
    response = client.post(
        f"/stock_transfer/stock_transfers/{transfer.id}/complete"
    )

    assert response.status_code in [401, 403]


def test_complete_stock_transfer_audit_log(
    auth_headers,
    transfer,
    source_stock,
    db,
):
    response = client.post(
        f"/stock_transfer/stock_transfers/{transfer.id}/complete",
        headers=auth_headers,
    )

    assert response.status_code == 200

    db.expire_all()

    audit = (
        db.query(AuditLog)
        .filter(
            AuditLog.action == "COMPLETE_STOCK_TRANSFER",
            AuditLog.entity_id == transfer.id,
        )
        .first()
    )

    assert audit is not None


# =========================================================
# GET SINGLE STOCK TRANSFER
# =========================================================

def test_get_stock_transfer(
    transfer,
):
    response = client.get(
        f"/stock_transfer/stock_transfers/{transfer.id}"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == transfer.id

    assert data["source_warehouse_id"] == (
        transfer.source_warehouse_id
    )

    assert data["dest_warehouse_id"] == (
        transfer.dest_warehouse_id
    )

    assert data["status"] == "Pending"

    assert len(data["items"]) == 1

    assert data["items"][0]["product_id"] == (
        transfer.items[0].product_id
    )

    assert data["items"][0]["qty"] == transfer.items[0].qty


def test_get_stock_transfer_not_found():
    response = client.get(
        "/stock_transfer/stock_transfers/999999"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Stock transfer not found"


# =========================================================
# LIST STOCK TRANSFERS
# =========================================================

def test_list_stock_transfers(
    transfer,
):
    response = client.get(
        "/stock_transfer/stock_transfers"
    )

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)

    assert any(
        item["id"] == transfer.id
        for item in data
    )


def test_list_stock_transfers_returns_items(
    transfer,
):
    response = client.get(
        "/stock_transfer/stock_transfers"
    )

    assert response.status_code == 200

    data = response.json()

    transfer_data = next(
        item
        for item in data
        if item["id"] == transfer.id
    )

    assert "items" in transfer_data
    assert len(transfer_data["items"]) == 1


# =========================================================
# SCHEMA VALIDATION
# =========================================================

def test_create_stock_transfer_missing_items(
    auth_headers,
    warehouses,
):
    source, destination = warehouses

    response = client.post(
        "/stock_transfer/stock_transfers/",
        json={
            "source_warehouse_id": source.id,
            "dest_warehouse_id": destination.id,
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


def test_create_stock_transfer_missing_product_id(
    auth_headers,
    warehouses,
):
    source, destination = warehouses

    response = client.post(
        "/stock_transfer/stock_transfers/",
        json={
            "source_warehouse_id": source.id,
            "dest_warehouse_id": destination.id,
            "items": [
                {
                    "qty": 20,
                }
            ],
        },
        headers=auth_headers,
    )

    assert response.status_code == 422


def test_create_stock_transfer_missing_qty(
    auth_headers,
    product,
    warehouses,
):
    source, destination = warehouses

    response = client.post(
        "/stock_transfer/stock_transfers/",
        json={
            "source_warehouse_id": source.id,
            "dest_warehouse_id": destination.id,
            "items": [
                {
                    "product_id": product.id,
                }
            ],
        },
        headers=auth_headers,
    )

    assert response.status_code == 422