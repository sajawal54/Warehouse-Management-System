from pydantic import BaseModel
from typing import Optional
class UserCreate(BaseModel):
  username:str
  email:str
  password:str
  
class UserResponse(BaseModel):
  id:int
  username:str
  email:str
  role:str

  class Config:
        from_attributes = True

class Token(BaseModel):
  access_token:str
  refresh_token:str
  token_type:str
  
class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str
    
