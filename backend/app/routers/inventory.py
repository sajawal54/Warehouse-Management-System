from fastapi import Depends, HTTPException, status, APIRouter
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.inventory import StockReceiveCreate
from app.models.tables import InventoryMovement, StockBalance, Warehouse, Product
from app.services.audit_service import create_audit_log

router = APIRouter()

@router.post("/receive", status_code=status.HTTP_201_CREATED)
def receive_stock(
    payload: StockReceiveCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    product = db.query(Product).filter(
        Product.id == payload.product_id,
        Product.is_active == True
    ).first()

    warehouse = db.query(Warehouse).filter(
        Warehouse.id == payload.warehouse_id,
        Warehouse.is_active == True
    ).first()

    if not product or not warehouse:
        raise HTTPException(
            status_code=404,
            detail="Product or Warehouse do not found"
        )

    if payload.quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity should be greater than 0"
        )

    stock_balance = db.query(StockBalance).filter(
        StockBalance.product_id == payload.product_id,
        StockBalance.warehouse_id == payload.warehouse_id
    ).first()

    before_quantity = stock_balance.quantity if stock_balance else 0

    movement = InventoryMovement(
        product_id=payload.product_id,
        warehouse_id=payload.warehouse_id,
        movement_type="RECEIPT",
        qty_delta=payload.quantity,
        reference_type=payload.reference_type,
        reference_id=payload.reference_id,
        created_by=current_user.id
    )

    db.add(movement)

    if stock_balance:
        stock_balance.quantity += payload.quantity
    else:
        stock_balance = StockBalance(
            product_id=payload.product_id,
            warehouse_id=payload.warehouse_id,
            quantity=payload.quantity
        )

        db.add(stock_balance)

    after_quantity = before_quantity + payload.quantity

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="RECEIVE_STOCK",
        entity="StockBalance",
        entity_id=stock_balance.id if stock_balance.id else None,
        before={
            "product_id": payload.product_id,
            "warehouse_id": payload.warehouse_id,
            "quantity": before_quantity
        },
        after={
            "product_id": payload.product_id,
            "warehouse_id": payload.warehouse_id,
            "quantity": after_quantity,
            "received_quantity": payload.quantity
        }
    )

    db.commit()

    return {
        "message": "Stock Successfully Received"
    }