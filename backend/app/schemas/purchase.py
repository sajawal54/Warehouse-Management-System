from pydantic import BaseModel
from typing import List
from datetime import datetime

class PurchaseOrderItemCreate(BaseModel):
    product_id: int
    ordered_qty: int

class PurchaseOrderCreate(BaseModel):
    vendor_id: int
    warehouse_id: int
    items: List[PurchaseOrderItemCreate]

class PurchaseOrderItemResponse(BaseModel):
    id: int
    product_id: int
    ordered_qty: int
    received_qty: int

    class Config:
        from_attributes = True

class PurchaseOrderResponse(BaseModel):
    id: int
    vendor_id: int
    warehouse_id: int
    status: str
    created_at: datetime
    items: List[PurchaseOrderItemResponse]

    class Config:
        from_attributes = True
        
        
class ReceivedProductItem(BaseModel):
    product_id: int
    receive_qty: int

class ReceivePurchaseOrderRequest(BaseModel):
    items: List[ReceivedProductItem]