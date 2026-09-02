from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.tables import AuditLog
from app.schemas.audit import AuditLogResponse

router = APIRouter()

@router.get("/", response_model=list[AuditLogResponse])
def get_audit_logs(
    entity: Optional[str] = Query(None),
    entity_id: Optional[int] = Query(None),
    user_id: Optional[int] = Query(None),
    limit: int = Query(50),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    query = db.query(AuditLog)

    if entity:
        query = query.filter(AuditLog.entity == entity)

    if entity_id:
        query = query.filter(AuditLog.entity_id == entity_id)

    if user_id:
        query = query.filter(AuditLog.user_id == user_id)

    logs = query.order_by(
        AuditLog.created_at.desc()
    ).limit(limit).all()

    return logs

