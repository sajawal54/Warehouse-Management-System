from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.tables import (
    AIAnalysisResult,
    InventoryMovement,
    Product,
    StockBalance,
)
from app.services.ai_service import (
    analyze_and_persist_issue,
    analyze_chat_question,
)

router = APIRouter()


class ChatRequest(BaseModel):
    question: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="Natural-language inventory question",
    )
    warehouse_id: int | None = Field(
        default=None,
        description="Optional warehouse filter",
    )


@router.get(
    "/dashboard/summary",
    summary="AI Dashboard Inventory Health Summary",
)
def get_ai_dashboard_summary(
    severity: str | None = Query(
        default=None,
        description="Filter findings by severity",
    ),
    warehouse_id: int | None = Query(
        default=None,
        description="Filter low-stock items by warehouse",
    ),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    low_stock_query = db.query(StockBalance)

    if warehouse_id is not None:
        low_stock_query = low_stock_query.filter(
            StockBalance.warehouse_id == warehouse_id
        )

    stock_balances = low_stock_query.all()

    product_ids = {balance.product_id for balance in stock_balances}

    products = (
        db.query(Product)
        .filter(Product.id.in_(product_ids))
        .all()
        if product_ids
        else []
    )

    products_by_id = {product.id: product for product in products}

    low_stock_items = []

    for balance in stock_balances:
        product = products_by_id.get(balance.product_id)

        if not product:
            continue

        if balance.quantity <= product.reorder_point:
            low_stock_items.append(
                {
                    "product_id": product.id,
                    "sku": product.sku,
                    "name": product.name,
                    "warehouse_id": balance.warehouse_id,
                    "current_quantity": balance.quantity,
                    "reorder_point": product.reorder_point,
                }
            )

    low_stock_items.sort(
        key=lambda item: item["current_quantity"] - item["reorder_point"]
    )

    findings_query = db.query(AIAnalysisResult)

    if severity:
        normalized_severity = severity.strip().upper()
        allowed_severities = {
            "LOW",
            "MEDIUM",
            "HIGH",
            "CRITICAL",
        }

        if normalized_severity not in allowed_severities:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Invalid severity. Allowed values: "
                    "LOW, MEDIUM, HIGH, CRITICAL."
                ),
            )

        findings_query = findings_query.filter(
            AIAnalysisResult.severity == normalized_severity
        )

    findings = (
        findings_query
        .order_by(AIAnalysisResult.created_at.desc())
        .all()
    )

    total_products = db.query(Product).count()

    negative_inventory_count = (
        db.query(StockBalance)
        .filter(StockBalance.quantity < 0)
        .count()
    )

    return {
        "kpis": {
            "total_tracked_items": total_products,
            "low_stock_count": len(low_stock_items),
            "negative_inventory_count": negative_inventory_count,
            "total_ai_findings": len(findings),
        },
        "low_stock_panel": low_stock_items,
        "ai_findings_feed": findings,
    }


@router.post(
    "/reconciliation/run",
    summary="Trigger Deterministic Reconciliation & AI Analysis Engine",
)
def run_inventory_reconciliation(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    stock_pairs = db.query(StockBalance).all()
    analyzed_count = 0

    product_ids = {balance.product_id for balance in stock_pairs}

    products = (
        db.query(Product)
        .filter(Product.id.in_(product_ids))
        .all()
        if product_ids
        else []
    )

    products_by_id = {
        product.id: product for product in products
    }

    for balance in stock_pairs:
        product_id = balance.product_id
        warehouse_id = balance.warehouse_id

        ledger_sum = (
            db.query(func.sum(InventoryMovement.qty_delta))
            .filter(
                InventoryMovement.product_id == product_id,
                InventoryMovement.warehouse_id == warehouse_id,
            )
            .scalar()
            or 0
        )

        actual_stock = balance.quantity
        issues = []

        if ledger_sum != actual_stock:
            issues.append(
                f"Stock mismatch: expected ledger sum {ledger_sum}, "
                f"found actual balance {actual_stock}."
            )

        if actual_stock < 0:
            issues.append(
                f"Negative inventory detected: actual balance is {actual_stock}."
            )

        product = products_by_id.get(product_id)

        if product and actual_stock <= product.reorder_point:
            issues.append(
                f"Low stock condition: balance {actual_stock} "
                f"is at or below reorder point {product.reorder_point}."
            )

        if not issues:
            continue

        context_data = {
            "product_id": product_id,
            "warehouse_id": warehouse_id,
            "expected_stock": ledger_sum,
            "actual_stock": actual_stock,
            "reorder_point": (
                product.reorder_point
                if product
                else None
            ),
            "detected_issues": issues,
        }

        scope = f"reconciliation:{product_id}:{warehouse_id}"

        result = analyze_and_persist_issue(
            db=db,
            context_data=context_data,
            scope=scope,
        )

        if result:
            analyzed_count += 1

    return {
        "status": "success",
        "message": (
            f"Reconciliation completed successfully. "
            f"Processed {len(stock_pairs)} stock pairs, "
            f"generated {analyzed_count} AI analysis findings."
        ),
    }


@router.post(
    "/chat",
    summary="Conversational AI Chat Interface",
)
def ai_chat_endpoint(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        product_query = db.query(Product)
        stock_query = db.query(StockBalance)

        movement_query = (
            db.query(InventoryMovement)
            .order_by(InventoryMovement.created_at.desc())
        )

        recent_issues_query = (
            db.query(AIAnalysisResult)
            .order_by(AIAnalysisResult.created_at.desc())
        )

        if payload.warehouse_id is not None:
            stock_query = stock_query.filter(
                StockBalance.warehouse_id == payload.warehouse_id
            )

            movement_query = movement_query.filter(
                InventoryMovement.warehouse_id == payload.warehouse_id
            )

        products = product_query.limit(50).all()
        stock_balances = stock_query.limit(100).all()
        recent_movements = movement_query.limit(50).all()
        recent_issues = recent_issues_query.limit(10).all()

        context = {
            "warehouse_filter": payload.warehouse_id,
            "products": [
                {
                    "id": product.id,
                    "sku": product.sku,
                    "name": product.name,
                    "reorder_point": product.reorder_point,
                }
                for product in products
            ],
            "stock_balances": [
                {
                    "product_id": balance.product_id,
                    "warehouse_id": balance.warehouse_id,
                    "quantity": balance.quantity,
                }
                for balance in stock_balances
            ],
            "recent_movements": [
                {
                    "product_id": movement.product_id,
                    "warehouse_id": movement.warehouse_id,
                    "type": movement.movement_type,
                    "delta": movement.qty_delta,
                    "time": str(movement.created_at),
                }
                for movement in recent_movements
            ],
            "recent_ai_findings": [
                {
                    "issue": issue.issue,
                    "severity": issue.severity,
                    "explanation": issue.explanation,
                    "possible_cause": issue.possible_cause,
                    "recommendation": issue.recommendation,
                }
                for issue in recent_issues
            ],
        }

        answer = analyze_chat_question(
            question=payload.question,
            context_data=context,
        )

        if answer is None:
            raise HTTPException(
                status_code=503,
                detail=(
                    "AI analysis service is temporarily unavailable "
                    "or the Gemini API key is not configured."
                ),
            )

        return {
            "question": payload.question,
            "answer": answer,
            "status": "success",
        }

    except HTTPException:
        raise

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to process AI chat request.",
        ) 