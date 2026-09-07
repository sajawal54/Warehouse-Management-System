from pydantic import BaseModel
from typing import Optional
from datetime import datetime
class StockReceiveCreate(BaseModel):
  product_id:int
  warehouse_id:int
  quantity:int
  reference_type:Optional[str] = "Purchase Order"
  reference_id : Optional[int] = None
  created_by : Optional[str] = "System User"
  
  
class InventoryMovementResponse(BaseModel):
    id: int
    product_id: int
    warehouse_id: int
    movement_type: str
    qty_delta: int
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None
    created_by: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True