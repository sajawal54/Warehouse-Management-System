from pydantic import BaseModel


class UserCreate(BaseModel):
  username:str
  email:str
  password:str
  role:str
  
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