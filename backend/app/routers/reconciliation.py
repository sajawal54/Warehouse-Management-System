from fastapi import APIRouter, Depends , HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.reconciliation import run_reconciliation

router = APIRouter()

@router.post("/run-reconciliation", summary="Run Reconciliation Engine")
def run_reconciliation_endpoint(db: Session = Depends(get_db)):
    try:
        run_reconciliation(db)
        return {"message": "Reconciliation process completed successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    
    