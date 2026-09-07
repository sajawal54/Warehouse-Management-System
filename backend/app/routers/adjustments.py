from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.tables import StockAdjustment, Warehouse, StockBalance, InventoryMovement , Product
from app.core.database import get_db
from app.core.security import require_staff , require_viewer
from app.schemas.adjustments import StockAdjustmentCreate , StockAdjustmentResponse
from app.services.audit_service import create_audit_log


router = APIRouter()


@router.post("/stock_adjustments/", response_model=StockAdjustmentResponse)
def create_stock_adjustment(
    stock_adjustment: StockAdjustmentCreate,
    db: Session = Depends(get_db),
    current_user=Depends(require_staff)
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




@router.get("/stock_adjustments/", response_model=list[StockAdjustmentResponse])
def get_stock_adjustments(
    db: Session = Depends(get_db),
    current_user=Depends(require_viewer)
):
    adjustments = db.query(StockAdjustment).all()
    return adjustments


@router.get("/stock_adjustments/{adjustment_id}", response_model=StockAdjustmentResponse)
def get_stock_adjustment_by_id(
    adjustment_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(require_viewer)
):
    adjustment = db.query(StockAdjustment).filter(
        StockAdjustment.id == adjustment_id
    ).first()
    
    if not adjustment:
        raise HTTPException(
            status_code=404,
            detail="Stock adjustment not found"
        )
    
    return adjustment
