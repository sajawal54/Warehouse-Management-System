from pydantic import BaseModel
from typing import Optional

class VendorCreate(BaseModel):
  name:str
  contact_info:str
  address:str
  

class VendorResponse(BaseModel):
  id:int
  name:str
  contact_info:str
  address:str
  is_active:bool = True
  
  class Config:
    from_attributes = True
    
class VendorUpdate(BaseModel):
  name : Optional[str] = None
  contact_info : Optional[str] = None
  address : Optional[str] = None
  
  