from datetime import datetime
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Float 
from app.core.database import Base 
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="staff") 
    is_active = Column(Boolean, default=True)

class Vendor(Base):
    __tablename__ = "vendors"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    contact_info = Column(String)
    address = Column(String)
    is_active = Column(Boolean, default=True)

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String)
    unit = Column(String) 
    reorder_point = Column(Integer, default=10)
    unit_cost = Column(Float, default=0.0)
    is_active = Column(Boolean , default=True)

class Warehouse(Base):
    __tablename__ = "warehouses"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String)
    is_active = Column(Boolean, default=True)

class StockBalance(Base):
    __tablename__ = "stock_balances"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"))
    quantity = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    status = Column(String, default="Draft")  
    created_at = Column(DateTime, default=datetime.utcnow)
    items = relationship("PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan")

class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"
    id = Column(Integer, primary_key=True, index=True)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    ordered_qty = Column(Integer, nullable=False)
    received_qty = Column(Integer, default=0)
    purchase_order = relationship("PurchaseOrder", back_populates="items")

class SalesOrder(Base):
    __tablename__ = "sales_orders"
    id = Column(Integer, primary_key=True, index=True)
    customer_ref = Column(String)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"))
    status = Column(String, default="Draft") 
    items = relationship("SalesOrderItem", back_populates="sales_order", cascade="all, delete-orphan")

class SalesOrderItem(Base):
    __tablename__ = "sales_order_items"
    id = Column(Integer, primary_key=True, index=True)
    sales_order_id = Column(Integer, ForeignKey("sales_orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    ordered_qty = Column(Integer, nullable=False)
    shipped_qty = Column(Integer, default=0)
    sales_order = relationship("SalesOrder", back_populates="items")

class StockTransfer(Base):
    __tablename__ = "stock_transfers"
    id = Column(Integer, primary_key=True, index=True)
    source_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    dest_warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    status = Column(String, default="Draft")
    
    items = relationship("StockTransferItem", back_populates="stock_transfer")

class StockTransferItem(Base):
    __tablename__ = "stock_transfer_items"
    id = Column(Integer, primary_key=True, index=True)
    transfer_id = Column(Integer, ForeignKey("stock_transfers.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    qty = Column(Integer, nullable=False)
    
    stock_transfer = relationship("StockTransfer", back_populates="items")
    
class StockAdjustment(Base):
    __tablename__ = "stock_adjustments"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"))
    qty_delta = Column(Integer, nullable=False)
    reason = Column(String, nullable=False)
    approved_by = Column(String)

class InventoryMovement(Base):
    __tablename__ = "inventory_movements"
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"))
    movement_type = Column(String, nullable=False)   
    qty_delta = Column(Integer, nullable=False)
    reference_type = Column(String)
    reference_id = Column(Integer)
    created_by = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String, nullable=False)
    entity = Column(String)
    entity_id = Column(Integer)
    before = Column(String)
    after = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class AIAnalysisResult(Base):
    __tablename__ = "ai_analysis_results"
    id = Column(Integer, primary_key=True, index=True)
    scope = Column(String)
    issue = Column(String)
    severity = Column(String)
    explanation = Column(String)
    possible_cause = Column(String)
    recommendation = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)