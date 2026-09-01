from  pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    entity: str
    entity_id: Optional[int] = None
    before: Optional[str] = None
    after: Optional[str] = None   
    created_at: datetime
    
    class Config:
      from_attributes = True