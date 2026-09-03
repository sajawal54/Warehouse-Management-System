from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.tables import PurchaseOrder, PurchaseOrderItem, InventoryMovement, StockBalance
from app.schemas.purchase import PurchaseOrderCreate, PurchaseOrderResponse, ReceivedProductItem, ReceivePurchaseOrderRequest
from app.services.audit_service import create_audit_log

router = APIRouter()

@router.post("/", response_model=PurchaseOrderResponse)
def create_purchase_order(
    purchase: PurchaseOrderCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    new_order = PurchaseOrder(
        vendor_id=purchase.vendor_id,
        warehouse_id=purchase.warehouse_id,
        status="Draft"
    )

    db.add(new_order)
    db.flush()

    for requested_item in purchase.items:
        order_items = PurchaseOrderItem(
            purchase_order_id=new_order.id,
            product_id=requested_item.product_id,
            ordered_qty=requested_item.ordered_qty,
            received_qty=0
        )

        db.add(order_items)

    after = {
        "vendor_id": new_order.vendor_id,
        "warehouse_id": new_order.warehouse_id,
        "status": new_order.status,
        "items": [
            {
                "product_id": item.product_id,
                "ordered_qty": item.ordered_qty,
                "received_qty": 0
            }
            for item in purchase.items
        ]
    }

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="CREATE_PURCHASE_ORDER",
        entity="PurchaseOrder",
        entity_id=new_order.id,
        before=None,
        after=after
    )

    db.commit()
    db.refresh(new_order)

    return new_order


@router.post("/{purchase_order_id}/receive", status_code=status.HTTP_200_OK)
def receive_purchase_order(
    purchase_order_id: int,
    receive_data: ReceivePurchaseOrderRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    order = db.query(PurchaseOrder).filter(
        PurchaseOrder.id == purchase_order_id
    ).first()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Purchase Order not found"
        )

    if order.status in ["Received", "Closed"]:
        raise HTTPException(
            status_code=400,
            detail="Order is already received or closed"
        )

    before = {
        "status": order.status,
        "items": [
            {
                "product_id": item.product_id,
                "ordered_qty": item.ordered_qty,
                "received_qty": item.received_qty
            }
            for item in order.items
        ]
    }

    complete_received = True

    for item in receive_data.items:
        order_item = db.query(PurchaseOrderItem).filter(
            PurchaseOrderItem.purchase_order_id == purchase_order_id,
            PurchaseOrderItem.product_id == item.product_id
        ).first()

        if not order_item:
            raise HTTPException(
                status_code=400,
                detail=f"Product {item.product_id} not in this order"
            )

        new_total_received = order_item.received_qty + item.receive_qty

        if new_total_received > order_item.ordered_qty:
            raise HTTPException(
                status_code=400,
                detail=f"Received quantity exceeds ordered quantity for product {item.product_id}"
            )

        order_item.received_qty = new_total_received

        movement = InventoryMovement(
            product_id=item.product_id,
            warehouse_id=order.warehouse_id,
            movement_type="RECEIPT",
            qty_delta=item.receive_qty,
            reference_type="PURCHASE_ORDER",
            reference_id=order.id
        )

        db.add(movement)

        stock = db.query(StockBalance).filter(
            StockBalance.product_id == item.product_id,
            StockBalance.warehouse_id == order.warehouse_id
        ).first()

        if stock:
            stock.quantity += item.receive_qty
        else:
            new_stock = StockBalance(
                product_id=item.product_id,
                warehouse_id=order.warehouse_id,
                quantity=item.receive_qty
            )

            db.add(new_stock)

        if order_item.received_qty < order_item.ordered_qty:
            complete_received = False

    order.status = "Received" if complete_received else "Partially Received"

    after = {
        "status": order.status,
        "items": [
            {
                "product_id": item.product_id,
                "ordered_qty": item.ordered_qty,
                "received_qty": item.received_qty
            }
            for item in order.items
        ]
    }

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="RECEIVE_PURCHASE_ORDER",
        entity="PurchaseOrder",
        entity_id=order.id,
        before=before,
        after=after
    )

    db.commit()

    return {
        "message": "Stock received successfully",
        "order_id": order.id,
        "status": order.status
    }


@router.get("/", response_model=list[PurchaseOrderResponse])
def get_all_orders(db: Session = Depends(get_db)):
    orders = db.query(PurchaseOrder).all()

    return orders


@router.get("/{purchase_order_id}", response_model=PurchaseOrderResponse)
def get_order_by_id(
    purchase_order_id: int,
    db: Session = Depends(get_db)
):
    order = db.query(PurchaseOrder).filter(
        PurchaseOrder.id == purchase_order_id
    ).first()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Purchase Order Not Found"
        )

    return order


@router.patch("/{purchase_order_id}/submit", status_code=status.HTTP_200_OK)
def submit_purchase_order(
    purchase_order_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    order = db.query(PurchaseOrder).filter(
        PurchaseOrder.id == purchase_order_id
    ).first()

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Purchase order not found"
        )

    if order.status != "Draft":
        raise HTTPException(
            status_code=400,
            detail="Only draft orders can be submitted"
        )

    before = {
        "status": order.status
    }

    order.status = "Submitted"

    after = {
        "status": order.status
    }

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="SUBMIT_PURCHASE_ORDER",
        entity="PurchaseOrder",
        entity_id=order.id,
        before=before,
        after=after
    )

    db.commit()

    return {
        "message": "Purchase order submitted successfully",
        "order_id": order.id,
        "status": order.status
    }
    