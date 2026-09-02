import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db
from app.models.tables import Product, User
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
        username="producttestuser",
        email="producttest@example.com",
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
        sku="SKU-001",
        name="Test Product",
        category="Electronics",
        unit="pcs",
        reorder_point=10,
        unit_cost=100.0,
        is_active=True,
    )

    db_session.add(product)
    db_session.commit()
    db_session.refresh(product)

    return product


def test_create_product(client, db_session, auth_headers):
    response = client.post(
        "/products/create",
        json={
            "sku": "SKU-100",
            "name": "New Product",
            "category": "Electronics",
            "unit": "pcs",
            "reorder_point": 15,
            "unit_cost": 250.0,
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["sku"] == "SKU-100"
    assert data["name"] == "New Product"
    assert data["category"] == "Electronics"
    assert data["unit"] == "pcs"
    assert data["reorder_point"] == 15
    assert data["unit_cost"] == 250.0
    assert data["is_active"] is True

    saved_product = (
        db_session.query(Product)
        .filter(Product.sku == "SKU-100")
        .first()
    )

    assert saved_product is not None


def test_create_product_default_values(client, db_session, auth_headers):
    response = client.post(
        "/products/create",
        json={
            "sku": "SKU-101",
            "name": "Default Product",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["sku"] == "SKU-101"
    assert data["name"] == "Default Product"
    assert data["reorder_point"] == 10
    assert data["unit_cost"] == 0.0


def test_create_duplicate_product(client, auth_headers, product):
    response = client.post(
        "/products/create",
        json={
            "sku": "SKU-001",
            "name": "Duplicate Product",
            "category": "Electronics",
            "unit": "pcs",
            "reorder_point": 5,
            "unit_cost": 150.0,
        },
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Product SKU ALREADY EXISTED"


def test_create_product_without_auth(client):
    response = client.post(
        "/products/create",
        json={
            "sku": "SKU-102",
            "name": "Unauthorized Product",
        },
    )

    assert response.status_code in [401, 403]


def test_get_products(client, product):
    response = client.get("/products/get")

    assert response.status_code == 200

    data = response.json()

    assert isinstance(data, list)
    assert len(data) == 1
    assert data[0]["id"] == product.id
    assert data[0]["sku"] == "SKU-001"
    assert data[0]["name"] == "Test Product"


def test_get_products_only_active(client, db_session):
    active_product = Product(
        sku="SKU-003",
        name="Active Product",
        category="General",
        unit="pcs",
        reorder_point=10,
        unit_cost=50.0,
        is_active=True,
    )

    inactive_product = Product(
        sku="SKU-004",
        name="Inactive Product",
        category="General",
        unit="pcs",
        reorder_point=10,
        unit_cost=50.0,
        is_active=False,
    )

    db_session.add_all([active_product, inactive_product])
    db_session.commit()

    response = client.get("/products/get")

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["sku"] == "SKU-003"


def test_get_product_by_id(client, product):
    response = client.get(f"/products/get/{product.id}")

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == product.id
    assert data["sku"] == "SKU-001"
    assert data["name"] == "Test Product"
    assert data["category"] == "Electronics"
    assert data["unit"] == "pcs"
    assert data["reorder_point"] == 10
    assert data["unit_cost"] == 100.0
    assert data["is_active"] is True


def test_get_product_not_found(client):
    response = client.get("/products/get/99999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Product Not Found"


def test_get_inactive_product_by_id(client, db_session):
    product = Product(
        sku="SKU-005",
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

    response = client.get(f"/products/get/{product.id}")

    assert response.status_code == 404
    assert response.json()["detail"] == "Product Not Found"


def test_update_product(client, db_session, auth_headers, product):
    response = client.put(
        f"/products/{product.id}",
        json={
            "name": "Updated Product",
            "category": "Updated Category",
            "unit": "box",
            "reorder_point": 20,
            "unit_cost": 175.5,
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["sku"] == "SKU-001"
    assert data["name"] == "Updated Product"
    assert data["category"] == "Updated Category"
    assert data["unit"] == "box"
    assert data["reorder_point"] == 20
    assert data["unit_cost"] == 175.5

    db_session.refresh(product)

    assert product.name == "Updated Product"
    assert product.category == "Updated Category"
    assert product.unit == "box"
    assert product.reorder_point == 20
    assert product.unit_cost == 175.5


def test_update_product_sku(client, db_session, auth_headers, product):
    response = client.put(
        f"/products/{product.id}",
        json={
            "sku": "SKU-UPDATED",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200

    data = response.json()

    assert data["sku"] == "SKU-UPDATED"

    db_session.refresh(product)

    assert product.sku == "SKU-UPDATED"


def test_update_product_duplicate_sku(
    client,
    db_session,
    auth_headers,
    product,
):
    second_product = Product(
        sku="SKU-002",
        name="Second Product",
        category="Electronics",
        unit="pcs",
        reorder_point=10,
        unit_cost=200.0,
        is_active=True,
    )

    db_session.add(second_product)
    db_session.commit()

    response = client.put(
        f"/products/{product.id}",
        json={
            "sku": "SKU-002",
        },
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "PRODUCT SKU ALREADY EXISTED"


def test_update_product_not_found(client, auth_headers):
    response = client.put(
        "/products/99999",
        json={
            "name": "Updated Product",
        },
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Product Not Found"


def test_update_product_without_auth(client, product):
    response = client.put(
        f"/products/{product.id}",
        json={
            "name": "Unauthorized Update",
        },
    )

    assert response.status_code in [401, 403]


def test_delete_product(client, db_session, auth_headers, product):
    response = client.delete(
        f"/products/{product.id}",
        headers=auth_headers,
    )

    assert response.status_code == 204

    db_session.refresh(product)

    assert product.is_active is False


def test_delete_product_not_found(client, auth_headers):
    response = client.delete(
        "/products/99999",
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Product not found"


def test_delete_product_without_auth(client, product):
    response = client.delete(
        f"/products/{product.id}",
    )

    assert response.status_code in [401, 403]


def test_deleted_product_not_returned(
    client,
    db_session,
    auth_headers,
    product,
):
    product.is_active = False
    db_session.commit()

    response = client.get("/products/get")

    assert response.status_code == 200
    assert response.json() == []

    response = client.get(f"/products/get/{product.id}")

    assert response.status_code == 404
    assert response.json()["detail"] == "Product Not Found"

