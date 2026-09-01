from pydantic import BaseModel
from typing import Optional


class StockAdjustmentCreate(BaseModel):
    product_id: int
    warehouse_id: int
    qty_delta: int
    reason: str
    approved_by: Optional[str] = None
    
class StockAdjustmentResponse(BaseModel):
    id: int
    product_id: int
    warehouse_id: int
    qty_delta: int
    reason: str
    approved_by: Optional[str] = None

    class Config:
        from_attributes = True