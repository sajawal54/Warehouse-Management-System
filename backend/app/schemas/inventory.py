from pydantic import BaseModel
from typing import Optional



class StockReceiveCreate(BaseModel):
  product_id:int
  warehouse_id:int
  quantity:int
  reference_type:Optional[str] = "Purchase Order"
  reference_id : Optional[int] = None
  created_by : Optional[str] = "System User"