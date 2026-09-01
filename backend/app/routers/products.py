from fastapi import Depends, status, HTTPException, APIRouter
from app.schemas.products import ProductCreate, ProductResponse, ProductUpdate
from sqlalchemy.orm import Session
from app.models.tables import Product
from app.core.database import get_db
from app.core.security import get_current_user
from app.services.audit_service import create_audit_log


router = APIRouter()


@router.post("/create", response_model=ProductResponse)
def create_products(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    existing_product = db.query(Product).filter(
        Product.sku == product.sku
    ).first()

    if existing_product:
        raise HTTPException(
            status_code=400,
            detail="Product SKU ALREADY EXISTED"
        )

    new_product = Product(
        sku=product.sku,
        name=product.name,
        category=product.category,
        unit=product.unit,
        reorder_point=product.reorder_point,
        unit_cost=product.unit_cost
    )

    db.add(new_product)
    db.flush()

    after = {
        "sku": new_product.sku,
        "name": new_product.name,
        "category": new_product.category,
        "unit": new_product.unit,
        "reorder_point": new_product.reorder_point,
        "unit_cost": new_product.unit_cost
    }

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="CREATE_PRODUCT",
        entity="Product",
        entity_id=new_product.id,
        before=None,
        after=after
    )

    db.commit()
    db.refresh(new_product)

    return new_product


@router.get("/get", response_model=list[ProductResponse])
def get_products(db: Session = Depends(get_db)):
    products = db.query(Product).filter(
        Product.is_active == True
    ).all()

    return products


@router.get("/get/{product_id:int}", response_model=ProductResponse)
def get_by_id(
    product_id: int,
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.is_active == True
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product Not Found"
        )

    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product: ProductUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    find_product = db.query(Product).filter(
        Product.id == product_id,
        Product.is_active == True
    ).first()

    if not find_product:
        raise HTTPException(
            status_code=404,
            detail="Product Not Found"
        )

    if product.sku is not None and product.sku != find_product.sku:
        existing_sku = db.query(Product).filter(
            Product.sku == product.sku,
            Product.id != product_id
        ).first()

        if existing_sku:
            raise HTTPException(
                status_code=400,
                detail="PRODUCT SKU ALREADY EXISTED"
            )

    before = {
        "sku": find_product.sku,
        "name": find_product.name,
        "category": find_product.category,
        "unit": find_product.unit,
        "reorder_point": find_product.reorder_point,
        "unit_cost": find_product.unit_cost
    }

    if product.sku is not None:
        find_product.sku = product.sku

    if product.name is not None:
        find_product.name = product.name

    if product.category is not None:
        find_product.category = product.category

    if product.unit is not None:
        find_product.unit = product.unit

    if product.reorder_point is not None:
        find_product.reorder_point = product.reorder_point

    if product.unit_cost is not None:
        find_product.unit_cost = product.unit_cost

    after = {
        "sku": find_product.sku,
        "name": find_product.name,
        "category": find_product.category,
        "unit": find_product.unit,
        "reorder_point": find_product.reorder_point,
        "unit_cost": find_product.unit_cost
    }

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="UPDATE_PRODUCT",
        entity="Product",
        entity_id=find_product.id,
        before=before,
        after=after
    )

    db.commit()
    db.refresh(find_product)

    return find_product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.is_active == True
    ).first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    before = {
        "sku": product.sku,
        "name": product.name,
        "category": product.category,
        "unit": product.unit,
        "reorder_point": product.reorder_point,
        "unit_cost": product.unit_cost,
        "is_active": product.is_active
    }

    product.is_active = False

    after = {
        "sku": product.sku,
        "name": product.name,
        "category": product.category,
        "unit": product.unit,
        "reorder_point": product.reorder_point,
        "unit_cost": product.unit_cost,
        "is_active": product.is_active
    }

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="DELETE_PRODUCT",
        entity="Product",
        entity_id=product.id,
        before=before,
        after=after
    )

    db.commit()

    return None