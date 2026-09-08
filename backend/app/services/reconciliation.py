from sqlalchemy.orm import Session
from app.models.tables import StockBalance, Product, InventoryMovement, AIAnalysisResult
from datetime import datetime

def run_reconciliation(db: Session):
    stock_pairs = db.query(StockBalance.product_id, StockBalance.warehouse_id).all()
    
    for product_id, warehouse_id in stock_pairs:
        stock_balance = db.query(StockBalance).filter_by(product_id=product_id, warehouse_id=warehouse_id).first()
        product = db.query(Product).filter_by(id=product_id).first()
        
        if not stock_balance or not product:
            continue
        
        movements = db.query(InventoryMovement).filter_by(product_id=product_id, warehouse_id=warehouse_id).all()
        
        expected_balance = sum(movement.qty_delta for movement in movements)
        actual_balance = stock_balance.quantity
        
        issues = []
        
        if expected_balance != actual_balance:
            issues.append({
                "issue_type": "MISMATCH",
                "severity": "HIGH",
                "description": f"Expected stock ({expected_balance}) does not match actual stock ({actual_balance})."
            })
            
        if actual_balance < 0:
            issues.append({
                "issue_type": "NEGATIVE_INVENTORY",
                "severity": "HIGH",
                "description": f"Actual stock has dropped below zero ({actual_balance})."
            })
            
        if actual_balance <= product.reorder_point:
            issues.append({
                "issue_type": "LOW_STOCK",
                "severity": "MEDIUM",
                "description": f"Actual stock ({actual_balance}) is at or below the reorder point ({product.reorder_point})."
            })
        
        if issues:
            # ✅ SAVE TO DATABASE instead of just printing
            for issue in issues:
                # Check if this issue already exists (avoid duplicates)
                existing = db.query(AIAnalysisResult).filter(
                    AIAnalysisResult.scope == f"reconciliation:{product_id}:{warehouse_id}",
                    AIAnalysisResult.issue == issue["description"]
                ).first()
                
                if not existing:
                    analysis_result = AIAnalysisResult(
                        scope=f"reconciliation:{product_id}:{warehouse_id}",
                        issue=issue["description"],
                        severity=issue["severity"],
                        explanation=f"Reconciliation detected: {issue['description']}",
                        possible_cause="Stock movement mismatch or data inconsistency.",
                        recommendation="Review stock movements and adjust balances if needed."
                    )
                    db.add(analysis_result)
            
            db.commit()
            
            print(f"Reconciliation Issues for Product ID {product_id} in Warehouse ID {warehouse_id}:")
            for issue in issues:
                print(f" -> [{issue['issue_type']}] Severity: {issue['severity']} | {issue['description']}")