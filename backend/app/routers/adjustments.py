from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.tables import StockAdjustment, Warehouse, StockBalance, InventoryMovement , Product
from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.adjustments import StockAdjustmentCreate , StockAdjustmentResponse
from app.services.audit_service import create_audit_log


router = APIRouter()


@router.post("/stock_adjustments/", response_model=StockAdjustmentResponse)
def create_stock_adjustment(
    stock_adjustment: StockAdjustmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    warehouse = db.query(Warehouse).filter(
        Warehouse.id == stock_adjustment.warehouse_id
    ).first()
    product = db.query(Product).filter(
        Product.id == stock_adjustment.product_id
    ).first()

    if not warehouse:
        raise HTTPException(
            status_code=404,
            detail="Warehouse Not Found"
        )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product Not Found"
        )

    new_stock_adjustment = StockAdjustment(
        product_id=stock_adjustment.product_id,
        warehouse_id=stock_adjustment.warehouse_id,
        qty_delta=stock_adjustment.qty_delta,
        reason=stock_adjustment.reason,
        approved_by=stock_adjustment.approved_by
    )

    db.add(new_stock_adjustment)
    db.flush()

    stock_balance = db.query(StockBalance).filter(
        StockBalance.product_id == stock_adjustment.product_id,
        StockBalance.warehouse_id == stock_adjustment.warehouse_id
    ).first()

    if not stock_balance:
        stock_balance = StockBalance(
            product_id=stock_adjustment.product_id,
            warehouse_id=stock_adjustment.warehouse_id,
            quantity=0
        )
        db.add(stock_balance)
        db.flush()

    before_quantity = stock_balance.quantity

    stock_balance.quantity += stock_adjustment.qty_delta

    after_quantity = stock_balance.quantity

    movement = InventoryMovement(
        product_id=stock_adjustment.product_id,
        warehouse_id=stock_adjustment.warehouse_id,
        movement_type="ADJUSTMENT",
        qty_delta=stock_adjustment.qty_delta,
        reference_type="StockAdjustment",
        reference_id=new_stock_adjustment.id,
        created_by=current_user.id
    )

    db.add(movement)

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="CREATE_STOCK_ADJUSTMENT",
        entity="StockAdjustment",
        entity_id=new_stock_adjustment.id,
        before={
            "quantity": before_quantity
        },
        after={
            "quantity": after_quantity,
            "qty_delta": stock_adjustment.qty_delta,
            "reason": stock_adjustment.reason,
            "product_id": stock_adjustment.product_id,
            "warehouse_id": stock_adjustment.warehouse_id
        }
    )

    db.commit()
    db.refresh(new_stock_adjustment)

    return new_stock_adjustment
