from fastapi import Depends , HTTPException , status , APIRouter
from  sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.inventory import StockReceiveCreate
from app.models.tables import InventoryMovement , StockBalance , Warehouse , Product

router = APIRouter()

@router.post("/receive" , status_code=status.HTTP_201_CREATED)
def receive_stock(payload : StockReceiveCreate , db : Session = Depends(get_db)):
  product = db.query(Product).filter(Product.id == payload.product_id , Product.is_active == True).first()
  warehouse = db.query(Warehouse).filter(Warehouse.id == payload.warehouse_id , Warehouse.is_active == True).first()
  
  if not product or not warehouse:
    raise HTTPException(status_code=404 , detail="Product or Warehouse do not found")
  
  if payload.quantity <= 0:
    raise HTTPException(status_code=400 , detail="Qantity Should be greater than 0")

  movement = InventoryMovement(
    product_id = payload.product_id,
    warehouse_id = payload.warehouse_id,
    movement_type = "RECEIPT",
    qty_delta = payload.quantity,
    reference_type = payload.reference_type,
    reference_id = payload.reference_id,
    created_by = payload.created_by
  )
  
  db.add(movement)
  
  
  # Stock Balance Updater
  
  stock_balance = db.query(StockBalance).filter(StockBalance.product_id == payload.product_id , StockBalance.warehouse_id == payload.warehouse_id).first()
  
  if stock_balance:
    stock_balance.quantity += payload.quantity
    
  else:
    new_balance = StockBalance(
      product_id =  payload.product_id,
      warehouse_id = payload.warehouse_id,
      quantity = payload.quantity
      
    )
    
    db.add(new_balance)
    

  db.commit()
  
  return {"message" : "Stock Succesfully Received"}
  
  