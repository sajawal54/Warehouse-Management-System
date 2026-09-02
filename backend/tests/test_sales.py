
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
    SalesOrder,
    SalesOrderItem,
    StockBalance,
    InventoryMovement,
    AuditLog,
)
from app.core.security import hash_password, create_access_token


TEST_DATABASE_URL = "sqlite:///./test_sales.db"

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
        username="salestestuser",
        email="salestest@example.com",
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
        sku="SAL-SKU-001",
        name="Sales Test Product",
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
        sku="SAL-SKU-002",
        name="Second Sales Product",
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
        name="Sales Warehouse",
        location="Lahore",
        is_active=True,
    )

    db_session.add(warehouse)
    db_session.commit()
    db_session.refresh(warehouse)

    return warehouse


@pytest.fixture
def sales_order(
    db_session,
    warehouse,
    product,
):
    order = SalesOrder(
        customer_ref="CUSTOMER-001",
        warehouse_id=warehouse.id,
        status="Draft",
    )

    db_session.add(order)
    db_session.flush()

    item = SalesOrderItem(
        sales_order_id=order.id,
        product_id=product.id,
        ordered_qty=100,
        shipped_qty=0,
    )

    db_session.add(item)
    db_session.commit()
    db_session.refresh(order)

    return order


@pytest.fixture
def submitted_sales_order(
    db_session,
    warehouse,
    product,
):
    order = SalesOrder(
        customer_ref="CUSTOMER-SUBMITTED",
        warehouse_id=warehouse.id,
        status="Submitted",
    )

    db_session.add(order)
    db_session.flush()

    item = SalesOrderItem(
        sales_order_id=order.id,
        product_id=product.id,
        ordered_qty=100,
        shipped_qty=0,
    )

    db_session.add(item)
    db_session.commit()
    db_session.refresh(order)

    return order


@pytest.fixture
def stock(
    db_session,
    product,
    warehouse,
):
    stock = StockBalance(
        product_id=product.id,
        warehouse_id=warehouse.id,
        quantity=200,
    )

    db_session.add(stock)
    db_session.commit()
    db_session.refresh(stock)

    return stock


def test_create_sales_order(
    client,
    db_session,
    auth_headers,
    product,
    warehouse,
):
    response = client.post(
        "/sales/sales_orders",
        json={
            "customer_ref": "CUSTOMER-100",
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

    data = response.json()

    assert data["customer_ref"] == "CUSTOMER-100"
    assert data["warehouse_id"] == warehouse.id
    assert data["status"] == "Draft"

    assert len(data["items"]) == 1
    assert data["items"][0]["product_id"] == product.id
    assert data["items"][0]["ordered_qty"] == 50
    assert data["items"][0]["shipped_qty"] == 0

    saved_order = (
        db_session.query(SalesOrder)
        .filter(SalesOrder.id == data["id"])
        .first()
    )

    assert saved_order is not None


def test_create_sales_order_with_custom_status(
    client,
    auth_headers,
    product,
    warehouse,
):
    response = client.post(
        "/sales/sales_orders",
        json={
            "customer_ref": "CUSTOMER-101",
            "warehouse_id": warehouse.id,
            "status": "Draft",
            "items": [
                {
                    "product_id": product.id,
                    "ordered_qty": 20,
                }
            ],
        },
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert response.json()["status"] == "Draft"


def test_create_sales_order_multiple_items(
    client,
    auth_headers,
    product,
    second_product,
    warehouse,
):
    response = client.post(
        "/sales/sales_orders",
        json={
            "customer_ref": "CUSTOMER-102",
            "warehouse_id": warehouse.id,
            "items": [
                {
                    "product_id": product.id,
                    "ordered_qty": 30,
                },
                {
                    "product_id": second_product.id,
                    "ordered_qty": 40,
                },
            ],
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data["items"]) == 2

    assert data["items"][0]["product_id"] == product.id
    assert data["items"][0]["ordered_qty"] == 30

    assert data["items"][1]["product_id"] == second_product.id
    assert data["items"][1]["ordered_qty"] == 40


def test_create_sales_order_without_auth(
    client,
    product,
    warehouse,
):
    response = client.post(
        "/sales/sales_orders",
        json={
            "customer_ref": "UNAUTHORIZED",
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


def test_create_sales_order_audit_log(
    client,
    db_session,
    auth_headers,
    product,
    warehouse,
):
    response = client.post(
        "/sales/sales_orders",
        json={
            "customer_ref": "AUDIT-CUSTOMER",
            "warehouse_id": warehouse.id,
            "items": [
                {
                    "product_id": product.id,
                    "ordered_qty": 25,
                }
            ],
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    audit = (
        db_session.query(AuditLog)
        .filter(
            AuditLog.action == "CREATE_SALES_ORDER",
            AuditLog.entity == "SalesOrder",
        )
        .first()
    )

    assert audit is not None
    assert audit.action == "CREATE_SALES_ORDER"


def test_get_sales_orders(
    client,
    sales_order,
):
    response = client.get("/sales/sales_orders")

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)
    assert len(data) == 1

    assert data[0]["id"] == sales_order.id
    assert data[0]["customer_ref"] == "CUSTOMER-001"
    assert data[0]["status"] == "Draft"


def test_get_sales_order_by_id(
    client,
    sales_order,
    product,
    warehouse,
):
    response = client.get(
        f"/sales/sales_orders/{sales_order.id}"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == sales_order.id
    assert data["customer_ref"] == "CUSTOMER-001"
    assert data["warehouse_id"] == warehouse.id
    assert data["status"] == "Draft"

    assert len(data["items"]) == 1
    assert data["items"][0]["product_id"] == product.id
    assert data["items"][0]["ordered_qty"] == 100
    assert data["items"][0]["shipped_qty"] == 0


def test_get_sales_order_not_found(client):
    response = client.get(
        "/sales/sales_orders/99999"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Sales order not found"


def test_submit_sales_order(
    client,
    db_session,
    auth_headers,
    sales_order,
):
    response = client.patch(
        f"/sales/sales_orders/{sales_order.id}/submit",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == sales_order.id
    assert data["status"] == "Submitted"

    db_session.refresh(sales_order)

    assert sales_order.status == "Submitted"


def test_submit_sales_order_not_found(
    client,
    auth_headers,
):
    response = client.patch(
        "/sales/sales_orders/99999/submit",
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Sales order not found"


def test_submit_already_submitted_sales_order(
    client,
    db_session,
    auth_headers,
    sales_order,
):
    sales_order.status = "Submitted"
    db_session.commit()

    response = client.patch(
        f"/sales/sales_orders/{sales_order.id}/submit",
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert (
        response.json()["detail"]
        == "Only Draft sales orders can be submitted"
    )


def test_submit_sales_order_without_auth(
    client,
    sales_order,
):
    response = client.patch(
        f"/sales/sales_orders/{sales_order.id}/submit"
    )

    assert response.status_code in [401, 403]


def test_submit_sales_order_audit_log(
    client,
    db_session,
    auth_headers,
    sales_order,
):
    response = client.patch(
        f"/sales/sales_orders/{sales_order.id}/submit",
        headers=auth_headers,
    )

    assert response.status_code == 200

    audit = (
        db_session.query(AuditLog)
        .filter(
            AuditLog.action == "SUBMIT_SALES_ORDER",
            AuditLog.entity == "SalesOrder",
        )
        .first()
    )

    assert audit is not None
    assert audit.action == "SUBMIT_SALES_ORDER"


def test_fulfill_sales_order_full(
    client,
    db_session,
    auth_headers,
    submitted_sales_order,
    product,
    stock,
):
    response = client.post(
        f"/sales/sales-orders/{submitted_sales_order.id}/fulfill",
        json={
            "sales_order_id": submitted_sales_order.id,
            "product_id": product.id,
            "shipped_qty": 100,
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == submitted_sales_order.id
    assert data["status"] == "Fulfilled"

    db_session.refresh(submitted_sales_order)
    db_session.refresh(stock)

    assert submitted_sales_order.status == "Fulfilled"
    assert stock.quantity == 100

    item = (
        db_session.query(SalesOrderItem)
        .filter(
            SalesOrderItem.sales_order_id == submitted_sales_order.id,
            SalesOrderItem.product_id == product.id,
        )
        .first()
    )

    assert item.shipped_qty == 100


def test_fulfill_sales_order_partial(
    client,
    db_session,
    auth_headers,
    submitted_sales_order,
    product,
    stock,
):
    response = client.post(
        f"/sales/sales-orders/{submitted_sales_order.id}/fulfill",
        json={
            "sales_order_id": submitted_sales_order.id,
            "product_id": product.id,
            "shipped_qty": 40,
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "Partially Fulfilled"

    db_session.refresh(submitted_sales_order)
    db_session.refresh(stock)

    assert submitted_sales_order.status == "Partially Fulfilled"
    assert stock.quantity == 160

    item = (
        db_session.query(SalesOrderItem)
        .filter(
            SalesOrderItem.sales_order_id == submitted_sales_order.id,
            SalesOrderItem.product_id == product.id,
        )
        .first()
    )

    assert item.shipped_qty == 40


def test_fulfill_sales_order_multiple_shipments(
    client,
    db_session,
    auth_headers,
    submitted_sales_order,
    product,
    stock,
):
    response1 = client.post(
        f"/sales/sales-orders/{submitted_sales_order.id}/fulfill",
        json={
            "sales_order_id": submitted_sales_order.id,
            "product_id": product.id,
            "shipped_qty": 30,
        },
        headers=auth_headers,
    )

    assert response1.status_code == 200
    assert response1.json()["status"] == "Partially Fulfilled"

    response2 = client.post(
        f"/sales/sales-orders/{submitted_sales_order.id}/fulfill",
        json={
            "sales_order_id": submitted_sales_order.id,
            "product_id": product.id,
            "shipped_qty": 70,
        },
        headers=auth_headers,
    )

    assert response2.status_code == 200
    assert response2.json()["status"] == "Fulfilled"

    db_session.refresh(stock)

    assert stock.quantity == 100

    item = (
        db_session.query(SalesOrderItem)
        .filter(
            SalesOrderItem.sales_order_id == submitted_sales_order.id,
            SalesOrderItem.product_id == product.id,
        )
        .first()
    )

    assert item.shipped_qty == 100


def test_fulfill_sales_order_creates_inventory_movement(
    client,
    db_session,
    auth_headers,
    submitted_sales_order,
    product,
    warehouse,
    stock,
):
    response = client.post(
        f"/sales/sales-orders/{submitted_sales_order.id}/fulfill",
        json={
            "sales_order_id": submitted_sales_order.id,
            "product_id": product.id,
            "shipped_qty": 25,
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
    assert movement.movement_type == "OUT"
    assert movement.qty_delta == -25
    assert movement.reference_type == "SalesOrder"
    assert movement.reference_id == submitted_sales_order.id
    assert movement.created_by == "system"


def test_fulfill_sales_order_not_found(
    client,
    auth_headers,
    product,
):
    response = client.post(
        "/sales/sales-orders/99999/fulfill",
        json={
            "sales_order_id": 99999,
            "product_id": product.id,
            "shipped_qty": 10,
        },
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Sales order not found"


def test_fulfill_sales_order_only_submitted(
    client,
    auth_headers,
    sales_order,
    product,
    stock,
):
    response = client.post(
        f"/sales/sales-orders/{sales_order.id}/fulfill",
        json={
            "sales_order_id": sales_order.id,
            "product_id": product.id,
            "shipped_qty": 10,
        },
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert (
        response.json()["detail"]
        == "Only Submitted sales orders can be fulfilled"
    )


def test_fulfill_sales_order_item_not_found(
    client,
    auth_headers,
    submitted_sales_order,
    second_product,
    stock,
):
    response = client.post(
        f"/sales/sales-orders/{submitted_sales_order.id}/fulfill",
        json={
            "sales_order_id": submitted_sales_order.id,
            "product_id": second_product.id,
            "shipped_qty": 10,
        },
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Sales order item not found"


def test_fulfill_sales_order_exceeds_ordered_quantity(
    client,
    auth_headers,
    submitted_sales_order,
    product,
    stock,
):
    response = client.post(
        f"/sales/sales-orders/{submitted_sales_order.id}/fulfill",
        json={
            "sales_order_id": submitted_sales_order.id,
            "product_id": product.id,
            "shipped_qty": 101,
        },
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert (
        response.json()["detail"]
        == "Shipped quantity cannot exceed ordered quantity"
    )


def test_fulfill_sales_order_exceeds_remaining_quantity(
    client,
    db_session,
    auth_headers,
    submitted_sales_order,
    product,
    stock,
):
    item = (
        db_session.query(SalesOrderItem)
        .filter(
            SalesOrderItem.sales_order_id == submitted_sales_order.id,
            SalesOrderItem.product_id == product.id,
        )
        .first()
    )

    item.shipped_qty = 80
    db_session.commit()

    response = client.post(
        f"/sales/sales-orders/{submitted_sales_order.id}/fulfill",
        json={
            "sales_order_id": submitted_sales_order.id,
            "product_id": product.id,
            "shipped_qty": 21,
        },
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert (
        response.json()["detail"]
        == "Shipped quantity cannot exceed ordered quantity"
    )


def test_fulfill_sales_order_insufficient_stock(
    client,
    db_session,
    auth_headers,
    submitted_sales_order,
    product,
):
    stock = StockBalance(
        product_id=product.id,
        warehouse_id=submitted_sales_order.warehouse_id,
        quantity=5,
    )

    db_session.add(stock)
    db_session.commit()

    response = client.post(
        f"/sales/sales-orders/{submitted_sales_order.id}/fulfill",
        json={
            "sales_order_id": submitted_sales_order.id,
            "product_id": product.id,
            "shipped_qty": 10,
        },
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert (
        response.json()["detail"]
        == "Insufficient stock to fulfill the order"
    )


def test_fulfill_sales_order_without_stock(
    client,
    auth_headers,
    submitted_sales_order,
    product,
):
    response = client.post(
        f"/sales/sales-orders/{submitted_sales_order.id}/fulfill",
        json={
            "sales_order_id": submitted_sales_order.id,
            "product_id": product.id,
            "shipped_qty": 10,
        },
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert (
        response.json()["detail"]
        == "Insufficient stock to fulfill the order"
    )


def test_fulfill_sales_order_without_auth(
    client,
    submitted_sales_order,
    product,
    stock,
):
    response = client.post(
        f"/sales/sales-orders/{submitted_sales_order.id}/fulfill",
        json={
            "sales_order_id": submitted_sales_order.id,
            "product_id": product.id,
            "shipped_qty": 10,
        },
    )

    assert response.status_code in [401, 403]


def test_fulfill_sales_order_audit_log(
    client,
    db_session,
    auth_headers,
    submitted_sales_order,
    product,
    stock,
):
    response = client.post(
        f"/sales/sales-orders/{submitted_sales_order.id}/fulfill",
        json={
            "sales_order_id": submitted_sales_order.id,
            "product_id": product.id,
            "shipped_qty": 20,
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    audit = (
        db_session.query(AuditLog)
        .filter(
            AuditLog.action == "FULFILL_SALES_ORDER",
            AuditLog.entity == "SalesOrder",
        )
        .first()
    )

    assert audit is not None
    assert audit.action == "FULFILL_SALES_ORDER"


def test_cancel_draft_sales_order(
    client,
    db_session,
    auth_headers,
    sales_order,
):
    response = client.patch(
        f"/sales/sales_orders/{sales_order.id}/cancel",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == sales_order.id
    assert data["status"] == "Cancelled"

    db_session.refresh(sales_order)

    assert sales_order.status == "Cancelled"


def test_cancel_submitted_sales_order(
    client,
    db_session,
    auth_headers,
    submitted_sales_order,
):
    response = client.patch(
        f"/sales/sales_orders/{submitted_sales_order.id}/cancel",
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["status"] == "Cancelled"

    db_session.refresh(submitted_sales_order)

    assert submitted_sales_order.status == "Cancelled"


def test_cancel_sales_order_not_found(
    client,
    auth_headers,
):
    response = client.patch(
        "/sales/sales_orders/99999/cancel",
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Sales order not found"


def test_cancel_fulfilled_sales_order(
    client,
    db_session,
    auth_headers,
    submitted_sales_order,
):
    submitted_sales_order.status = "Fulfilled"
    db_session.commit()

    response = client.patch(
        f"/sales/sales_orders/{submitted_sales_order.id}/cancel",
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert (
        response.json()["detail"]
        == "Only Draft or Submitted sales orders can be cancelled"
    )


def test_cancel_already_cancelled_sales_order(
    client,
    db_session,
    auth_headers,
    sales_order,
):
    sales_order.status = "Cancelled"
    db_session.commit()

    response = client.patch(
        f"/sales/sales_orders/{sales_order.id}/cancel",
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert (
        response.json()["detail"]
        == "Only Draft or Submitted sales orders can be cancelled"
    )


def test_cancel_sales_order_without_auth(
    client,
    sales_order,
):
    response = client.patch(
        f"/sales/sales_orders/{sales_order.id}/cancel"
    )

    assert response.status_code in [401, 403]


def test_cancel_sales_order_audit_log(
    client,
    db_session,
    auth_headers,
    sales_order,
):
    response = client.patch(
        f"/sales/sales_orders/{sales_order.id}/cancel",
        headers=auth_headers,
    )

    assert response.status_code == 200

    audit = (
        db_session.query(AuditLog)
        .filter(
            AuditLog.action == "CANCEL_SALES_ORDER",
            AuditLog.entity == "SalesOrder",
        )
        .first()
    )

    assert audit is not None
    assert audit.action == "CANCEL_SALES_ORDER"
