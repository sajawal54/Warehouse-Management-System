from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.sales import SalesOrderCreate, SalesOrderResponse, FulfillSalesOrderRequest
from app.models.tables import SalesOrder, SalesOrderItem, StockBalance, InventoryMovement
from app.services.audit_service import create_audit_log

router = APIRouter()

@router.post("/sales_orders", response_model=SalesOrderResponse)
def create_sales_order(
    sales_order: SalesOrderCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    new_sales_order = SalesOrder(
        customer_ref=sales_order.customer_ref,
        warehouse_id=sales_order.warehouse_id,
        status=sales_order.status
    )

    db.add(new_sales_order)
    db.flush()

    for item in sales_order.items:
        new_item = SalesOrderItem(
            sales_order_id=new_sales_order.id,
            product_id=item.product_id,
            ordered_qty=item.ordered_qty
        )

        db.add(new_item)

    after = {
        "customer_ref": new_sales_order.customer_ref,
        "warehouse_id": new_sales_order.warehouse_id,
        "status": new_sales_order.status,
        "items": [
            {
                "product_id": item.product_id,
                "ordered_qty": item.ordered_qty
            }
            for item in sales_order.items
        ]
    }

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="CREATE_SALES_ORDER",
        entity="SalesOrder",
        entity_id=new_sales_order.id,
        before=None,
        after=after
    )

    db.commit()
    db.refresh(new_sales_order)

    return new_sales_order


@router.post("/sales-orders/{sales_id}/fulfill", response_model=SalesOrderResponse)
def fulfill_sales_order(
    sales_id: int,
    fulfill_request: FulfillSalesOrderRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    sales_order = db.query(SalesOrder).filter(
        SalesOrder.id == sales_id
    ).first()

    if not sales_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sales order not found"
        )

    if sales_order.status not in ["Submitted", "Partially Fulfilled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Submitted sales orders can be fulfilled"
        )

    item = db.query(SalesOrderItem).filter(
        SalesOrderItem.sales_order_id == sales_id,
        SalesOrderItem.product_id == fulfill_request.product_id
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sales order item not found"
        )

    new_shipped_qty = item.shipped_qty + fulfill_request.shipped_qty

    if new_shipped_qty > item.ordered_qty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Shipped quantity cannot exceed ordered quantity"
        )

    stock_balance = db.query(StockBalance).filter(
        StockBalance.product_id == fulfill_request.product_id,
        StockBalance.warehouse_id == sales_order.warehouse_id
    ).first()

    if not stock_balance or stock_balance.quantity < fulfill_request.shipped_qty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient stock to fulfill the order"
        )

    before = {
        "order_status": sales_order.status,
        "product_id": item.product_id,
        "ordered_qty": item.ordered_qty,
        "shipped_qty": item.shipped_qty,
        "stock_quantity": stock_balance.quantity
    }

    item.shipped_qty = new_shipped_qty
    stock_balance.quantity -= fulfill_request.shipped_qty

    movement = InventoryMovement(
        product_id=fulfill_request.product_id,
        warehouse_id=sales_order.warehouse_id,
        movement_type="OUT",
        qty_delta=-fulfill_request.shipped_qty,
        reference_type="SalesOrder",
        reference_id=sales_order.id,
        created_by="system"
    )

    db.add(movement)

    if all(order.ordered_qty == order.shipped_qty for order in sales_order.items):
        sales_order.status = "Fulfilled"
    else:
        sales_order.status = "Partially Fulfilled"

    after = {
        "order_status": sales_order.status,
        "product_id": item.product_id,
        "ordered_qty": item.ordered_qty,
        "shipped_qty": item.shipped_qty,
        "stock_quantity": stock_balance.quantity
    }

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="FULFILL_SALES_ORDER",
        entity="SalesOrder",
        entity_id=sales_order.id,
        before=before,
        after=after
    )

    db.commit()
    db.refresh(sales_order)

    return sales_order


@router.get("/sales_orders", response_model=list[SalesOrderResponse])
def get_sales_orders(db: Session = Depends(get_db)):
    sales_orders = db.query(SalesOrder).all()

    return sales_orders


@router.get("/sales_orders/{sales_id}", response_model=SalesOrderResponse)
def get_sales_order(
    sales_id: int,
    db: Session = Depends(get_db)
):
    sales_order = db.query(SalesOrder).filter(
        SalesOrder.id == sales_id
    ).first()

    if not sales_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sales order not found"
        )

    return sales_order


@router.patch("/sales_orders/{sales_id}/submit", response_model=SalesOrderResponse)
def submit_sales_order(
    sales_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    sales_order = db.query(SalesOrder).filter(
        SalesOrder.id == sales_id
    ).first()

    if not sales_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sales order not found"
        )

    if sales_order.status != "Draft":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Draft sales orders can be submitted"
        )

    before = {
        "status": sales_order.status
    }

    sales_order.status = "Submitted"

    after = {
        "status": sales_order.status
    }

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="SUBMIT_SALES_ORDER",
        entity="SalesOrder",
        entity_id=sales_order.id,
        before=before,
        after=after
    )

    db.commit()
    db.refresh(sales_order)

    return sales_order


@router.patch("/sales_orders/{sales_id}/cancel", response_model=SalesOrderResponse)
def cancel_sales_order(
    sales_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    sales_order = db.query(SalesOrder).filter(
        SalesOrder.id == sales_id
    ).first()

    if not sales_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sales order not found"
        )

    if sales_order.status not in ["Draft", "Submitted"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only Draft or Submitted sales orders can be cancelled"
        )

    before = {
        "status": sales_order.status
    }

    sales_order.status = "Cancelled"

    after = {
        "status": sales_order.status
    }

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="CANCEL_SALES_ORDER",
        entity="SalesOrder",
        entity_id=sales_order.id,
        before=before,
        after=after
    )

    db.commit()
    db.refresh(sales_order)

    return sales_order