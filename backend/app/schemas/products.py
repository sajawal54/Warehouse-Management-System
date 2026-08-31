from pydantic import BaseModel
from typing import Optional

class ProductCreate(BaseModel):
  sku:str
  name:str
  category:Optional[str] = None
  unit:Optional[str] = None
  reorder_point:int = 10
  unit_cost:float = 0.0
  

class ProductResponse(BaseModel):
  id: int
  sku:str
  name:str
  category:str
  unit:str
  reorder_point:int
  unit_cost:float
  is_active:bool = True
  
  class Config:
    from_attributes = True
    
class ProductUpdate(BaseModel):
  sku: Optional[str]  = None
  name: Optional[str] = None
  category: Optional[str] = None
  unit: Optional[str] = None
  reorder_point: Optional[int] = None
  unit_cost: Optional[float] = None