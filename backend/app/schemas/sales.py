from pydantic import BaseModel
from typing import Optional , List

class SalesOrderItemCreate(BaseModel):
    product_id: int
    ordered_qty: int
    
class SalesOrderItemResponse(BaseModel):
    id: int
    product_id: int
    ordered_qty: int
    shipped_qty: int

    class Config:
        from_attributes = True
        
class SalesOrderCreate(BaseModel):
  customer_ref:str
  warehouse_id:int
  status: Optional[str] = "Draft"
  items: List[SalesOrderItemCreate]
  
  
class SalesOrderResponse(BaseModel):
  id:int
  customer_ref:str
  warehouse_id:int
  status:str
  items: List[SalesOrderItemResponse]
  class Config:
    from_attributes = True
    
class FulfillSalesOrderRequest(BaseModel):
    sales_order_id: int
    product_id: int
    shipped_qty: int
    