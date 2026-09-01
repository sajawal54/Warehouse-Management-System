from pydantic import BaseModel
from typing import Optional, List


class StockTransferItemCreate(BaseModel):
    product_id: int
    qty: int
    
class StockTransferItemResponse(BaseModel):
    id: int
    product_id: int
    qty: int

    class Config:
        from_attributes = True
        
class StockTransferCreate(BaseModel):
    source_warehouse_id: int
    dest_warehouse_id: int
    items: List[StockTransferItemCreate]
    
class StockTransferResponse(BaseModel):
    id: int
    source_warehouse_id: int
    dest_warehouse_id: int
    status: str
    items: List[StockTransferItemResponse]

    class Config:
        from_attributes = True