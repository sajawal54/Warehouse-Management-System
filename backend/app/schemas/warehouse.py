from pydantic import BaseModel
from typing import Optional


class WarehouseCreate(BaseModel):
  name:str
  location:str
  
class WarehouseResponse(BaseModel):
  id:int
  name:str
  location:str
  is_active:bool = True
  
  class Config:
    from_attributes = True
    
class WarehouseUpdate(BaseModel):
  name: Optional[str] = None
  location: Optional[str] = None