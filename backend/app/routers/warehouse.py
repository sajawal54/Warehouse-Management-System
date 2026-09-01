from fastapi import HTTPException , status , Depends , APIRouter
from sqlalchemy.orm import Session
from app.models.tables import Warehouse
from app.schemas.warehouse import WarehouseCreate , WarehouseResponse , WarehouseUpdate
from app.core.database import get_db
from app.core.security import get_current_user


router = APIRouter()

@router.post("/create" , response_model=WarehouseResponse)
def create_warehouse(warehouse : WarehouseCreate , db : Session = Depends(get_db) , current_user=Depends(get_current_user)):
  existing_warehouse = db.query(Warehouse).filter(Warehouse.name == warehouse.name).first()
  if existing_warehouse:
    raise HTTPException(status_code=400 , detail="This name already taken: Try some other name")
  
  new_warehouse = Warehouse(
    name = warehouse.name,
    location = warehouse.location
  )
  
  db.add(new_warehouse)
  db.commit()
  db.refresh(new_warehouse)
  
  return new_warehouse


@router.get("/get" , response_model=list[WarehouseResponse])
def get_warehouse(db : Session = Depends(get_db)) :
  warehouses = db.query(Warehouse).filter(Warehouse.is_active == True).all()   
  return warehouses    

@router.get("/get/{warehouse_id}" , response_model=WarehouseResponse)
def get_warehouse_by_id(warehouse_id , db : Session = Depends(get_db)):
  warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id , Warehouse.is_active == True).first()
  if not warehouse:
    raise HTTPException(status_code=404 , detail="Warehouse Not Found")
  return warehouse

@router.put("/update/{warehouse_id}" , response_model=WarehouseResponse)
def update_warehouse(warehouse_id : int , warehouse : WarehouseUpdate , db : Session = Depends(get_db), current_user=Depends(get_current_user)):
  find_warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id , Warehouse.is_active == True).first()
  if not find_warehouse:
    raise HTTPException(status_code=404 , detail="Warehouse Not Found")
  
  if warehouse.name is not None:
    find_warehouse.name = warehouse.name
  elif warehouse.location is not None:
    find_warehouse.location = warehouse.location
  
  db.commit()
  db.refresh(find_warehouse)
  
  return find_warehouse


@router.delete("/delete/{warehouse_id}" , status_code=status.HTTP_204_NO_CONTENT)
def delete_warehouse(warehouse_id : int , db : Session = Depends(get_db) , current_user=Depends(get_current_user)):
  warehouse = db.query(Warehouse).filter(Warehouse.id == warehouse_id , Warehouse.is_active == True).first()
  
  if not warehouse:
    raise HTTPException(status_code=404 , detail="Warehouse NOT FOUND")
  warehouse.is_active = False
  
  db.commit()
  return None