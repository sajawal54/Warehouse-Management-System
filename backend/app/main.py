from fastapi import FastAPI
from app.core.database import engine
from fastapi.middleware.cors import CORSMiddleware
from app.models.tables import Base
from app.routers import auth, products, vendors, warehouse, inventory, purchase, sales, adjustments, audit, stock_transfer, reconciliation, ai_router

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
Base.metadata.create_all(bind=engine)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(products.router, prefix="/products", tags=["Products"])
app.include_router(vendors.router, prefix="/vendors", tags=["Vendors"])
app.include_router(warehouse.router, prefix="/warehouses", tags=["Warehouses"])
app.include_router(inventory.router, prefix="/inventory", tags=["Inventory"])
app.include_router(purchase.router, prefix="/purchase", tags=["Purchase"])
app.include_router(sales.router, prefix="/sales", tags=["Sales"])
app.include_router(adjustments.router, prefix="/adjustments", tags=["Stock Adjustments"])
app.include_router(audit.router, prefix="/audit", tags=["Audit Logs"])
app.include_router(stock_transfer.router, prefix="/stock_transfer", tags=["Stock Transfer"])
app.include_router(reconciliation.router, prefix="/reconciliation", tags=["Reconciliation"])
app.include_router(ai_router.router, prefix="/ai", tags=["AI Dashboard & Chat"])

