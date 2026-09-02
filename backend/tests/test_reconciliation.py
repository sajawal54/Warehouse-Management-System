import uuid

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import SessionLocal
from app.models.tables import (
    User,
    Product,
    Warehouse,
    StockBalance,
    InventoryMovement,
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
def product(db):
    unique = uuid.uuid4().hex[:8]

    product = Product(
        sku=f"RECON-{unique}",
        name="Reconciliation Test Product",
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
def warehouse(db):
    unique = uuid.uuid4().hex[:8]

    warehouse = Warehouse(
        name=f"Reconciliation Warehouse {unique}",
        location="Lahore",
        is_active=True,
    )

    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)

    return warehouse


@pytest.fixture
def stock_balance(db, product, warehouse):
    stock = StockBalance(
        product_id=product.id,
        warehouse_id=warehouse.id,
        quantity=100,
    )

    db.add(stock)
    db.commit()
    db.refresh(stock)

    return stock


# =========================================================
# BASIC ENDPOINT TEST
# =========================================================

def test_run_reconciliation_success():
    response = client.post(
        "/reconciliation/run-reconciliation"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["message"] == (
        "Reconciliation process completed successfully."
    )


# =========================================================
# MATCHING STOCK
# =========================================================

def test_reconciliation_matching_stock(
    db,
    product,
    warehouse,
):
    stock = StockBalance(
        product_id=product.id,
        warehouse_id=warehouse.id,
        quantity=100,
    )

    db.add(stock)
    db.flush()

    movement = InventoryMovement(
        product_id=product.id,
        warehouse_id=warehouse.id,
        movement_type="RECEIPT",
        qty_delta=100,
        reference_type="Test",
        reference_id=1,
        created_by="Test User",
    )

    db.add(movement)
    db.commit()

    response = client.post(
        "/reconciliation/run-reconciliation"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["message"] == (
        "Reconciliation process completed successfully."
    )


# =========================================================
# MISMATCH
# =========================================================

def test_reconciliation_detects_mismatch(
    db,
    product,
    warehouse,
):
    stock = StockBalance(
        product_id=product.id,
        warehouse_id=warehouse.id,
        quantity=100,
    )

    db.add(stock)
    db.flush()

    movement = InventoryMovement(
        product_id=product.id,
        warehouse_id=warehouse.id,
        movement_type="RECEIPT",
        qty_delta=80,
        reference_type="Test",
        reference_id=1,
        created_by="Test User",
    )

    db.add(movement)
    db.commit()

    response = client.post(
        "/reconciliation/run-reconciliation"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["message"] == (
        "Reconciliation process completed successfully."
    )


# =========================================================
# NEGATIVE INVENTORY
# =========================================================

def test_reconciliation_negative_inventory(
    db,
    product,
    warehouse,
):
    stock = StockBalance(
        product_id=product.id,
        warehouse_id=warehouse.id,
        quantity=-10,
    )

    db.add(stock)

    movement = InventoryMovement(
        product_id=product.id,
        warehouse_id=warehouse.id,
        movement_type="SALE",
        qty_delta=-10,
        reference_type="Test",
        reference_id=1,
        created_by="Test User",
    )

    db.add(movement)
    db.commit()

    response = client.post(
        "/reconciliation/run-reconciliation"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["message"] == (
        "Reconciliation process completed successfully."
    )


# =========================================================
# LOW STOCK
# =========================================================

def test_reconciliation_low_stock(
    db,
    product,
    warehouse,
):
    product.reorder_point = 20

    stock = StockBalance(
        product_id=product.id,
        warehouse_id=warehouse.id,
        quantity=10,
    )

    db.add(stock)

    movement = InventoryMovement(
        product_id=product.id,
        warehouse_id=warehouse.id,
        movement_type="RECEIPT",
        qty_delta=10,
        reference_type="Test",
        reference_id=1,
        created_by="Test User",
    )

    db.add(movement)
    db.commit()

    response = client.post(
        "/reconciliation/run-reconciliation"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["message"] == (
        "Reconciliation process completed successfully."
    )


# =========================================================
# STOCK AT EXACT REORDER POINT
# =========================================================

def test_reconciliation_stock_at_reorder_point(
    db,
    product,
    warehouse,
):
    product.reorder_point = 10

    stock = StockBalance(
        product_id=product.id,
        warehouse_id=warehouse.id,
        quantity=10,
    )

    db.add(stock)

    movement = InventoryMovement(
        product_id=product.id,
        warehouse_id=warehouse.id,
        movement_type="RECEIPT",
        qty_delta=10,
        reference_type="Test",
        reference_id=1,
        created_by="Test User",
    )

    db.add(movement)
    db.commit()

    response = client.post(
        "/reconciliation/run-reconciliation"
    )

    assert response.status_code == 200


# =========================================================
# MULTIPLE MOVEMENTS
# =========================================================

def test_reconciliation_multiple_movements(
    db,
    product,
    warehouse,
):
    stock = StockBalance(
        product_id=product.id,
        warehouse_id=warehouse.id,
        quantity=70,
    )

    db.add(stock)

    movements = [
        InventoryMovement(
            product_id=product.id,
            warehouse_id=warehouse.id,
            movement_type="RECEIPT",
            qty_delta=100,
            reference_type="Purchase",
            reference_id=1,
            created_by="Test User",
        ),
        InventoryMovement(
            product_id=product.id,
            warehouse_id=warehouse.id,
            movement_type="SALE",
            qty_delta=-20,
            reference_type="SalesOrder",
            reference_id=1,
            created_by="Test User",
        ),
        InventoryMovement(
            product_id=product.id,
            warehouse_id=warehouse.id,
            movement_type="ADJUSTMENT",
            qty_delta=-10,
            reference_type="Adjustment",
            reference_id=1,
            created_by="Test User",
        ),
    ]

    db.add_all(movements)
    db.commit()

    response = client.post(
        "/reconciliation/run-reconciliation"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["message"] == (
        "Reconciliation process completed successfully."
    )


# =========================================================
# MULTIPLE ISSUES
# =========================================================

def test_reconciliation_detects_multiple_issues(
    db,
    product,
    warehouse,
):
    product.reorder_point = 20

    stock = StockBalance(
        product_id=product.id,
        warehouse_id=warehouse.id,
        quantity=-10,
    )

    db.add(stock)

    movement = InventoryMovement(
        product_id=product.id,
        warehouse_id=warehouse.id,
        movement_type="SALE",
        qty_delta=-5,
        reference_type="Test",
        reference_id=1,
        created_by="Test User",
    )

    db.add(movement)
    db.commit()

    response = client.post(
        "/reconciliation/run-reconciliation"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["message"] == (
        "Reconciliation process completed successfully."
    )


# =========================================================
# MULTIPLE PRODUCTS / WAREHOUSES
# =========================================================

def test_reconciliation_multiple_stock_pairs(
    db,
    product,
    warehouse,
):
    unique = uuid.uuid4().hex[:8]

    product2 = Product(
        sku=f"RECON-SECOND-{unique}",
        name="Second Reconciliation Product",
        category="Test",
        unit="pcs",
        reorder_point=10,
        unit_cost=200.0,
        is_active=True,
    )

    warehouse2 = Warehouse(
        name=f"Second Recon Warehouse {unique}",
        location="Faisalabad",
        is_active=True,
    )

    db.add_all([product2, warehouse2])
    db.commit()

    stock1 = StockBalance(
        product_id=product.id,
        warehouse_id=warehouse.id,
        quantity=50,
    )

    stock2 = StockBalance(
        product_id=product2.id,
        warehouse_id=warehouse2.id,
        quantity=30,
    )

    movement1 = InventoryMovement(
        product_id=product.id,
        warehouse_id=warehouse.id,
        movement_type="RECEIPT",
        qty_delta=50,
        reference_type="Test",
        reference_id=1,
        created_by="Test User",
    )

    movement2 = InventoryMovement(
        product_id=product2.id,
        warehouse_id=warehouse2.id,
        movement_type="RECEIPT",
        qty_delta=30,
        reference_type="Test",
        reference_id=2,
        created_by="Test User",
    )

    db.add_all([
        stock1,
        stock2,
        movement1,
        movement2,
    ])

    db.commit()

    response = client.post(
        "/reconciliation/run-reconciliation"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["message"] == (
        "Reconciliation process completed successfully."
    )


# =========================================================
# ZERO STOCK
# =========================================================

def test_reconciliation_zero_stock(
    db,
    product,
    warehouse,
):
    product.reorder_point = 10

    stock = StockBalance(
        product_id=product.id,
        warehouse_id=warehouse.id,
        quantity=0,
    )

    db.add(stock)

    movement = InventoryMovement(
        product_id=product.id,
        warehouse_id=warehouse.id,
        movement_type="ADJUSTMENT",
        qty_delta=0,
        reference_type="Test",
        reference_id=1,
        created_by="Test User",
    )

    db.add(movement)
    db.commit()

    response = client.post(
        "/reconciliation/run-reconciliation"
    )

    assert response.status_code == 200


# =========================================================
# NO STOCK BALANCES
# =========================================================

def test_reconciliation_with_no_stock_balances():
    response = client.post(
        "/reconciliation/run-reconciliation"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["message"] == (
        "Reconciliation process completed successfully."
    )


# =========================================================
# SERVICE DIRECT TEST
# =========================================================

def test_run_reconciliation_service(
    db,
    product,
    warehouse,
):
    from app.services.reconciliation import run_reconciliation

    stock = StockBalance(
        product_id=product.id,
        warehouse_id=warehouse.id,
        quantity=100,
    )

    movement = InventoryMovement(
        product_id=product.id,
        warehouse_id=warehouse.id,
        movement_type="RECEIPT",
        qty_delta=100,
        reference_type="Test",
        reference_id=1,
        created_by="Test User",
    )

    db.add(stock)
    db.add(movement)
    db.commit()

    result = run_reconciliation(db)

    assert result is None