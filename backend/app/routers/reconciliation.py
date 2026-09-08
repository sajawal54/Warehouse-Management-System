from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.reconciliation import run_reconciliation
from app.core.security import require_manager
from app.models.tables import AIAnalysisResult

router = APIRouter()

@router.post("/run-reconciliation", summary="Run Reconciliation Engine")
def run_reconciliation_endpoint(
    db: Session = Depends(get_db),
    current_user=Depends(require_manager)
):
    try:
        run_reconciliation(db)
        return {
            "message": "Reconciliation completed successfully.",
            "status": "success",
            "issues_found": True
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/results", summary="Get Reconciliation Results")
def get_reconciliation_results(
    db: Session = Depends(get_db),
    current_user=Depends(require_manager)
):
    results = db.query(AIAnalysisResult).filter(
        AIAnalysisResult.scope.like("reconciliation:%")
    ).order_by(AIAnalysisResult.created_at.desc()).all()
    return results