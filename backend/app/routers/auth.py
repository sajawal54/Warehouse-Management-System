from fastapi import APIRouter, Depends, HTTPException, status  
from sqlalchemy.orm import Session 
from fastapi.security import OAuth2PasswordRequestForm 
from app.core.database import get_db
from app.models.tables import User
from app.core.security import verify_password, create_access_token, create_refresh_token, hash_password
from app.schemas.auth import UserCreate, UserResponse, Token

router = APIRouter()

@router.post("/register", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)): 
  existing_user = db.query(User).filter(User.email == user.email).first()
  
  if existing_user:
    raise HTTPException(status_code=400, detail="User Already Existed")
  
  hashed_password = hash_password(user.password)
  
  new_user = User(
    username = user.username,
    email=user.email,
    role="staff",
    password_hash=hashed_password
  )
  
  db.add(new_user)
  db.commit()
  db.refresh(new_user)
  return new_user


@router.post("/login", response_model=Token)
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
  user = db.query(User).filter(User.email == form_data.username).first()
  
  if not user or not verify_password(form_data.password, user.password_hash):
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Credentials")

  access_token = create_access_token(data={"sub": user.email, "role": user.role})
  refresh_token = create_refresh_token(data={"sub": user.email})

  return {
    "access_token": access_token,
    "refresh_token": refresh_token,
    "token_type": "bearer"
  }
