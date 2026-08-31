from fastapi import Depends , status , HTTPException , APIRouter
from app.schemas.products import ProductCreate , ProductResponse , ProductUpdate
from sqlalchemy.orm import Session
from app.models.tables import Product
from app.core.database import get_db

router = APIRouter()

@router.post("/create" , response_model=ProductResponse)
def create_products(product : ProductCreate  , db : Session = Depends(get_db)):
  existing_product = db.query(Product).filter(Product.sku == product.sku).first()
  if existing_product:
    raise HTTPException(status_code = 400 , detail="Product SKU ALREADY EXISTED")
  
  new_product = Product(
    sku=product.sku,
    name=product.name,
    category=product.category,
    unit = product.unit,
    reorder_point=product.reorder_point,
    unit_cost = product.unit_cost,
  )
  
  db.add(new_product)
  db.commit()
  db.refresh(new_product)
  
  
  return new_product


@router.get("/get" , response_model=list[ProductResponse])
def get_products(db : Session = Depends(get_db)):
  products = db.query(Product).filter(Product.is_active == True).all()
  return products


@router.get("/get/{product_id:int}" , response_model=ProductResponse)
def get_by_id(product_id : int , db : Session = Depends(get_db)):
  product = db.query(Product).filter(Product.id == product_id , Product.is_active == True).first()
  if not product:
    raise HTTPException(
      status_code = 404 ,
      detail = "Product Not Found"
    )
  return product

@router.put("/{product_id}" , response_model=ProductResponse)
def update_product(product_id : int , product : ProductUpdate , db : Session = Depends(get_db) ):
  
  find_product = db.query(Product).filter(Product.id == product_id , Product.is_active == True).first()
  
  if not find_product:
    raise HTTPException(status_code = 404 , 
                        detail = "Product Not Found")
  if product.sku is not None and product.sku != find_product.sku:
    existing_sku = db.query(Product).filter(Product.sku == product.sku , Product.id != product_id).first()
    if existing_sku:
      raise HTTPException(status_code = 400,
                          detail = "PRODUCT SKU ALREADY EXISTED")
      
  if product.sku is not None:
        find_product.sku = product.sku
  if product.name is not None:
        find_product.name = product.name
  if product.category is not None:
        find_product.category = product.category
  if product.unit is not None:
        find_product.unit = product.unit
  if product.reorder_point is not None:
        find_product.reorder_point = product.reorder_point
  if product.unit_cost is not None:
        find_product.unit_cost = product.unit_cost
  
 
  
  db.commit()
  db.refresh(find_product)
  return find_product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
      
    product.is_active = False
    db.commit()
    return None
