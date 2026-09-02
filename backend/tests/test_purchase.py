
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.models.tables import (
    User,
    Vendor,
    Product,
    Warehouse,
    PurchaseOrder,
    PurchaseOrderItem,
    InventoryMovement,
    StockBalance,
    AuditLog,
)
from app.core.security import hash_password, create_access_token


TEST_DATABASE_URL = "sqlite:///./test_purchase.db"

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
        username="purchasetestuser",
        email="purchasetest@example.com",
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


@pytest.fixture
def product(db_session):
    product = Product(
        sku="PUR-SKU-001",
        name="Purchase Test Product",
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
def second_product(db_session):
    product = Product(
        sku="PUR-SKU-002",
        name="Second Purchase Product",
        category="General",
        unit="pcs",
        reorder_point=10,
        unit_cost=200.0,
        is_active=True,
    )

    db_session.add(product)
    db_session.commit()
    db_session.refresh(product)

    return product


@pytest.fixture
def warehouse(db_session):
    warehouse = Warehouse(
        name="Purchase Warehouse",
        location="Lahore",
        is_active=True,
    )

    db_session.add(warehouse)
    db_session.commit()
    db_session.refresh(warehouse)

    return warehouse


@pytest.fixture
def purchase_order(
    db_session,
    vendor,
    warehouse,
    product,
):
    order = PurchaseOrder(
        vendor_id=vendor.id,
        warehouse_id=warehouse.id,
        status="Draft",
    )

    db_session.add(order)
    db_session.flush()

    item = PurchaseOrderItem(
        purchase_order_id=order.id,
        product_id=product.id,
        ordered_qty=100,
        received_qty=0,
    )

    db_session.add(item)
    db_session.commit()
    db_session.refresh(order)

    return order


def test_create_purchase_order(
    client,
    db_session,
    auth_headers,
    vendor,
    warehouse,
    product,
):
    response = client.post(
        "/purchase/",
        json={
            "vendor_id": vendor.id,
            "warehouse_id": warehouse.id,
            "items": [
                {
                    "product_id": product.id,
                    "ordered_qty": 100,
                }
            ],
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["vendor_id"] == vendor.id
    assert data["warehouse_id"] == warehouse.id
    assert data["status"] == "Draft"

    assert len(data["items"]) == 1
    assert data["items"][0]["product_id"] == product.id
    assert data["items"][0]["ordered_qty"] == 100
    assert data["items"][0]["received_qty"] == 0

    saved_order = (
        db_session.query(PurchaseOrder)
        .filter(PurchaseOrder.id == data["id"])
        .first()
    )

    assert saved_order is not None
    assert saved_order.status == "Draft"


def test_create_purchase_order_multiple_items(
    client,
    auth_headers,
    vendor,
    warehouse,
    product,
    second_product,
):
    response = client.post(
        "/purchase/",
        json={
            "vendor_id": vendor.id,
            "warehouse_id": warehouse.id,
            "items": [
                {
                    "product_id": product.id,
                    "ordered_qty": 50,
                },
                {
                    "product_id": second_product.id,
                    "ordered_qty": 75,
                },
            ],
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data["items"]) == 2

    assert data["items"][0]["product_id"] == product.id
    assert data["items"][0]["ordered_qty"] == 50
    assert data["items"][0]["received_qty"] == 0

    assert data["items"][1]["product_id"] == second_product.id
    assert data["items"][1]["ordered_qty"] == 75
    assert data["items"][1]["received_qty"] == 0


def test_create_purchase_order_without_auth(
    client,
    vendor,
    warehouse,
    product,
):
    response = client.post(
        "/purchase/",
        json={
            "vendor_id": vendor.id,
            "warehouse_id": warehouse.id,
            "items": [
                {
                    "product_id": product.id,
                    "ordered_qty": 10,
                }
            ],
        },
    )

    assert response.status_code in [401, 403]


def test_create_purchase_order_audit_log(
    client,
    db_session,
    auth_headers,
    vendor,
    warehouse,
    product,
):
    response = client.post(
        "/purchase/",
        json={
            "vendor_id": vendor.id,
            "warehouse_id": warehouse.id,
            "items": [
                {
                    "product_id": product.id,
                    "ordered_qty": 50,
                }
            ],
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    audit = (
        db_session.query(AuditLog)
        .filter(
            AuditLog.action == "CREATE_PURCHASE_ORDER",
            AuditLog.entity == "PurchaseOrder",
        )
        .first()
    )

    assert audit is not None
    assert audit.action == "CREATE_PURCHASE_ORDER"
    assert audit.entity == "PurchaseOrder"


def test_get_all_purchase_orders(
    client,
    purchase_order,
):
    response = client.get("/purchase/")

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)
    assert len(data) == 1

    assert data[0]["id"] == purchase_order.id
    assert data[0]["status"] == "Draft"
    assert len(data[0]["items"]) == 1


def test_get_purchase_order_by_id(
    client,
    purchase_order,
    vendor,
    warehouse,
    product,
):
    response = client.get(
        f"/purchase/{purchase_order.id}"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == purchase_order.id
    assert data["vendor_id"] == vendor.id
    assert data["warehouse_id"] == warehouse.id
    assert data["status"] == "Draft"

    assert len(data["items"]) == 1
    assert data["items"][0]["product_id"] == product.id
    assert data["items"][0]["ordered_qty"] == 100
    assert data["items"][0]["received_qty"] == 0


def test_get_purchase_order_not_found(client):
    response = client.get("/purchase/99999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Purchase Order Not Found"


def test_submit_purchase_order(
    client,
    db_session,
    auth_headers,
    purchase_order,
):
    response = client.patch(
        f"/purchase/{purchase_order.id}/submit",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["message"] == "Purchase order submitted successfully"
    assert data["order_id"] == purchase_order.id
    assert data["status"] == "Submitted"

    db_session.refresh(purchase_order)

    assert purchase_order.status == "Submitted"


def test_submit_purchase_order_not_found(
    client,
    auth_headers,
):
    response = client.patch(
        "/purchase/99999/submit",
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Purchase order not found"


def test_submit_purchase_order_already_submitted(
    client,
    db_session,
    auth_headers,
    purchase_order,
):
    purchase_order.status = "Submitted"
    db_session.commit()

    response = client.patch(
        f"/purchase/{purchase_order.id}/submit",
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert (
        response.json()["detail"]
        == "Only draft orders can be submitted"
    )


def test_submit_purchase_order_without_auth(
    client,
    purchase_order,
):
    response = client.patch(
        f"/purchase/{purchase_order.id}/submit",
    )

    assert response.status_code in [401, 403]


def test_submit_purchase_order_audit_log(
    client,
    db_session,
    auth_headers,
    purchase_order,
):
    response = client.patch(
        f"/purchase/{purchase_order.id}/submit",
        headers=auth_headers,
    )

    assert response.status_code == 200

    audit = (
        db_session.query(AuditLog)
        .filter(
            AuditLog.action == "SUBMIT_PURCHASE_ORDER",
            AuditLog.entity == "PurchaseOrder",
        )
        .first()
    )

    assert audit is not None
    assert audit.action == "SUBMIT_PURCHASE_ORDER"


def test_receive_purchase_order_full(
    client,
    db_session,
    auth_headers,
    purchase_order,
    product,
    warehouse,
):
    response = client.post(
        f"/purchase/{purchase_order.id}/receive",
        json={
            "items": [
                {
                    "product_id": product.id,
                    "receive_qty": 100,
                }
            ]
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["message"] == "Stock received successfully"
    assert data["order_id"] == purchase_order.id
    assert data["status"] == "Received"

    db_session.refresh(purchase_order)

    assert purchase_order.status == "Received"

    order_item = (
        db_session.query(PurchaseOrderItem)
        .filter(
            PurchaseOrderItem.purchase_order_id == purchase_order.id,
            PurchaseOrderItem.product_id == product.id,
        )
        .first()
    )

    assert order_item.received_qty == 100

    stock = (
        db_session.query(StockBalance)
        .filter(
            StockBalance.product_id == product.id,
            StockBalance.warehouse_id == warehouse.id,
        )
        .first()
    )

    assert stock is not None
    assert stock.quantity == 100


def test_receive_purchase_order_partial(
    client,
    db_session,
    auth_headers,
    purchase_order,
    product,
):
    response = client.post(
        f"/purchase/{purchase_order.id}/receive",
        json={
            "items": [
                {
                    "product_id": product.id,
                    "receive_qty": 40,
                }
            ]
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "Partially Received"

    db_session.refresh(purchase_order)

    assert purchase_order.status == "Partially Received"

    order_item = (
        db_session.query(PurchaseOrderItem)
        .filter(
            PurchaseOrderItem.purchase_order_id == purchase_order.id,
            PurchaseOrderItem.product_id == product.id,
        )
        .first()
    )

    assert order_item.received_qty == 40


def test_receive_purchase_order_updates_existing_stock(
    client,
    db_session,
    auth_headers,
    purchase_order,
    product,
    warehouse,
):
    stock = StockBalance(
        product_id=product.id,
        warehouse_id=warehouse.id,
        quantity=50,
    )

    db_session.add(stock)
    db_session.commit()

    response = client.post(
        f"/purchase/{purchase_order.id}/receive",
        json={
            "items": [
                {
                    "product_id": product.id,
                    "receive_qty": 30,
                }
            ]
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    db_session.refresh(stock)

    assert stock.quantity == 80


def test_receive_purchase_order_creates_inventory_movement(
    client,
    db_session,
    auth_headers,
    purchase_order,
    product,
    warehouse,
):
    response = client.post(
        f"/purchase/{purchase_order.id}/receive",
        json={
            "items": [
                {
                    "product_id": product.id,
                    "receive_qty": 25,
                }
            ]
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

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
    assert movement.reference_type == "PURCHASE_ORDER"
    assert movement.reference_id == purchase_order.id


def test_receive_purchase_order_multiple_items(
    client,
    db_session,
    auth_headers,
    vendor,
    warehouse,
    product,
    second_product,
):
    order = PurchaseOrder(
        vendor_id=vendor.id,
        warehouse_id=warehouse.id,
        status="Draft",
    )

    db_session.add(order)
    db_session.flush()

    item1 = PurchaseOrderItem(
        purchase_order_id=order.id,
        product_id=product.id,
        ordered_qty=50,
        received_qty=0,
    )

    item2 = PurchaseOrderItem(
        purchase_order_id=order.id,
        product_id=second_product.id,
        ordered_qty=75,
        received_qty=0,
    )

    db_session.add_all([item1, item2])
    db_session.commit()
    db_session.refresh(order)

    response = client.post(
        f"/purchase/{order.id}/receive",
        json={
            "items": [
                {
                    "product_id": product.id,
                    "receive_qty": 50,
                },
                {
                    "product_id": second_product.id,
                    "receive_qty": 75,
                },
            ]
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "Received"

    db_session.refresh(order)

    assert order.status == "Received"

    saved_item1 = (
        db_session.query(PurchaseOrderItem)
        .filter(
            PurchaseOrderItem.purchase_order_id == order.id,
            PurchaseOrderItem.product_id == product.id,
        )
        .first()
    )

    saved_item2 = (
        db_session.query(PurchaseOrderItem)
        .filter(
            PurchaseOrderItem.purchase_order_id == order.id,
            PurchaseOrderItem.product_id == second_product.id,
        )
        .first()
    )

    assert saved_item1.received_qty == 50
    assert saved_item2.received_qty == 75


def test_receive_purchase_order_not_found(
    client,
    auth_headers,
    product,
):
    response = client.post(
        "/purchase/99999/receive",
        json={
            "items": [
                {
                    "product_id": product.id,
                    "receive_qty": 10,
                }
            ]
        },
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Purchase Order not found"


def test_receive_already_received_order(
    client,
    db_session,
    auth_headers,
    purchase_order,
    product,
):
    purchase_order.status = "Received"
    db_session.commit()

    response = client.post(
        f"/purchase/{purchase_order.id}/receive",
        json={
            "items": [
                {
                    "product_id": product.id,
                    "receive_qty": 10,
                }
            ]
        },
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert (
        response.json()["detail"]
        == "Order is already received or closed"
    )


def test_receive_closed_order(
    client,
    db_session,
    auth_headers,
    purchase_order,
    product,
):
    purchase_order.status = "Closed"
    db_session.commit()

    response = client.post(
        f"/purchase/{purchase_order.id}/receive",
        json={
            "items": [
                {
                    "product_id": product.id,
                    "receive_qty": 10,
                }
            ]
        },
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert (
        response.json()["detail"]
        == "Order is already received or closed"
    )


def test_receive_product_not_in_order(
    client,
    auth_headers,
    purchase_order,
    second_product,
):
    response = client.post(
        f"/purchase/{purchase_order.id}/receive",
        json={
            "items": [
                {
                    "product_id": second_product.id,
                    "receive_qty": 10,
                }
            ]
        },
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert (
        response.json()["detail"]
        == f"Product {second_product.id} not in this order"
    )


def test_receive_quantity_exceeds_ordered_quantity(
    client,
    auth_headers,
    purchase_order,
    product,
):
    response = client.post(
        f"/purchase/{purchase_order.id}/receive",
        json={
            "items": [
                {
                    "product_id": product.id,
                    "receive_qty": 101,
                }
            ]
        },
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert (
        response.json()["detail"]
        == (
            f"Received quantity exceeds ordered quantity "
            f"for product {product.id}"
        )
    )


def test_receive_quantity_exceeds_remaining_quantity(
    client,
    db_session,
    auth_headers,
    purchase_order,
    product,
):
    order_item = (
        db_session.query(PurchaseOrderItem)
        .filter(
            PurchaseOrderItem.purchase_order_id == purchase_order.id,
            PurchaseOrderItem.product_id == product.id,
        )
        .first()
    )

    order_item.received_qty = 80
    db_session.commit()

    response = client.post(
        f"/purchase/{purchase_order.id}/receive",
        json={
            "items": [
                {
                    "product_id": product.id,
                    "receive_qty": 21,
                }
            ]
        },
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert (
        response.json()["detail"]
        == (
            f"Received quantity exceeds ordered quantity "
            f"for product {product.id}"
        )
    )


def test_receive_purchase_order_without_auth(
    client,
    purchase_order,
    product,
):
    response = client.post(
        f"/purchase/{purchase_order.id}/receive",
        json={
            "items": [
                {
                    "product_id": product.id,
                    "receive_qty": 10,
                }
            ]
        },
    )

    assert response.status_code in [401, 403]


def test_receive_purchase_order_audit_log(
    client,
    db_session,
    auth_headers,
    purchase_order,
    product,
):
    response = client.post(
        f"/purchase/{purchase_order.id}/receive",
        json={
            "items": [
                {
                    "product_id": product.id,
                    "receive_qty": 25,
                }
            ]
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    audit = (
        db_session.query(AuditLog)
        .filter(
            AuditLog.action == "RECEIVE_PURCHASE_ORDER",
            AuditLog.entity == "PurchaseOrder",
        )
        .first()
    )

    assert audit is not None
    assert audit.action == "RECEIVE_PURCHASE_ORDER"
    assert audit.entity == "PurchaseOrder"

