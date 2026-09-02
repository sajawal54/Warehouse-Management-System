from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.tables import StockTransfer, StockTransferItem, Product, Warehouse, StockBalance,InventoryMovement
from app.schemas.stock_transfer import StockTransferCreate, StockTransferResponse
from app.core.database import get_db
from app.core.security import get_current_user
from app.services.audit_service import create_audit_log

router = APIRouter()

@router.post("/stock_transfers/", response_model=StockTransferResponse)
def create_stock_transfer(
    stock_transfer: StockTransferCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    source_warehouse = db.query(Warehouse).filter(
        Warehouse.id == stock_transfer.source_warehouse_id
    ).first()

    dest_warehouse = db.query(Warehouse).filter(
        Warehouse.id == stock_transfer.dest_warehouse_id
    ).first()

    if not source_warehouse or not dest_warehouse:
        raise HTTPException(
            status_code=404,
            detail="Source or destination warehouse not found"
        )

    new_stock_transfer = StockTransfer(
        source_warehouse_id=stock_transfer.source_warehouse_id,
        dest_warehouse_id=stock_transfer.dest_warehouse_id,
        status="Pending"
    )

    db.add(new_stock_transfer)
    db.flush()

    for item in stock_transfer.items:
        product = db.query(Product).filter(
            Product.id == item.product_id
        ).first()

        if not product:
            raise HTTPException(
                status_code=404,
                detail=f"Product with ID {item.product_id} not found"
            )

        new_item = StockTransferItem(
            transfer_id=new_stock_transfer.id,
            product_id=item.product_id,
            qty=item.qty
        )

        db.add(new_item)

    after = {
        "source_warehouse_id": new_stock_transfer.source_warehouse_id,
        "dest_warehouse_id": new_stock_transfer.dest_warehouse_id,
        "status": new_stock_transfer.status,
        "items": [
            {
                "product_id": item.product_id,
                "qty": item.qty
            }
            for item in stock_transfer.items
        ]
    }

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="CREATE_STOCK_TRANSFER",
        entity="StockTransfer",
        entity_id=new_stock_transfer.id,
        before=None,
        after=after
    )

    db.commit()
    return new_stock_transfer

@router.post("/stock_transfers/{transfer_id}/complete")
def complete_stock_transfer(
    transfer_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    stock_transfer = db.query(StockTransfer).filter(
        StockTransfer.id == transfer_id
    ).first()

    if not stock_transfer:
        raise HTTPException(
            status_code=404,
            detail="Stock transfer not found"
        )

    if stock_transfer.status == "Completed":
        raise HTTPException(
            status_code=400,
            detail="Transfer is already completed"
        )

    before = {
        "status": stock_transfer.status
    }

    for item in stock_transfer.items:
        source_stock = db.query(StockBalance).filter(
            StockBalance.product_id == item.product_id,
            StockBalance.warehouse_id == stock_transfer.source_warehouse_id
        ).first()

        if not source_stock or source_stock.quantity < item.qty:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock in source warehouse for product ID {item.product_id}"
            )

        source_stock.quantity -= item.qty

        out_movement = InventoryMovement(
            product_id=item.product_id,
            warehouse_id=stock_transfer.source_warehouse_id,
            movement_type="TRANSFER_OUT",
            qty_delta=-item.qty,
            reference_type="StockTransfer",
            reference_id=stock_transfer.id,
            created_by="system"
        )

        db.add(out_movement)

        dest_stock = db.query(StockBalance).filter(
            StockBalance.product_id == item.product_id,
            StockBalance.warehouse_id == stock_transfer.dest_warehouse_id
        ).first()

        if dest_stock:
            dest_stock.quantity += item.qty
        else:
            dest_stock = StockBalance(
                product_id=item.product_id,
                warehouse_id=stock_transfer.dest_warehouse_id,
                quantity=item.qty
            )

            db.add(dest_stock)

        in_movement = InventoryMovement(
            product_id=item.product_id,
            warehouse_id=stock_transfer.dest_warehouse_id,
            movement_type="TRANSFER_IN",
            qty_delta=item.qty,
            reference_type="StockTransfer",
            reference_id=stock_transfer.id,
            created_by="system"
        )

        db.add(in_movement)

    stock_transfer.status = "Completed"

    after = {
        "status": stock_transfer.status
    }

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="COMPLETE_STOCK_TRANSFER",
        entity="StockTransfer",
        entity_id=stock_transfer.id,
        before=before,
        after=after
    )

    db.commit()
    db.refresh(stock_transfer)

    return stock_transfer


@router.get("/stock_transfers/{transfer_id}", response_model=StockTransferResponse)
def get_stock_transfer(
    transfer_id: int,
    db: Session = Depends(get_db)
):
    stock_transfer = db.query(StockTransfer).filter(
        StockTransfer.id == transfer_id
    ).first()

    if not stock_transfer:
        raise HTTPException(
            status_code=404,
            detail="Stock transfer not found"
        )

    return stock_transfer


@router.get("/stock_transfers", response_model=list[StockTransferResponse])
def list_stock_transfers(db: Session = Depends(get_db)):
    stock_transfers = db.query(StockTransfer).all()

    return stock_transfers