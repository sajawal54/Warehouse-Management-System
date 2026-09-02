from fastapi import HTTPException, status, Depends, APIRouter
from sqlalchemy.orm import Session
from app.models.tables import Vendor
from app.schemas.vendors import VendorCreate, VendorResponse, VendorUpdate
from app.core.database import get_db
from app.core.security import get_current_user
from app.services.audit_service import create_audit_log

router = APIRouter()


@router.post("/create", response_model=VendorResponse)
def create_vendor(
    vendor: VendorCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    existing_vendor = db.query(Vendor).filter(Vendor.name == vendor.name).first()

    if existing_vendor:
        raise HTTPException(status_code=400, detail="This name already taken: Try some other name")

    new_vendor = Vendor(
        name=vendor.name,
        contact_info=vendor.contact_info,
        address=vendor.address
    )

    db.add(new_vendor)
    db.flush()

    after = {
        "name": new_vendor.name,
        "contact_info": new_vendor.contact_info,
        "address": new_vendor.address
    }

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="CREATE_VENDOR",
        entity="Vendor",
        entity_id=new_vendor.id,
        before=None,
        after=after
    )

    db.commit()
    db.refresh(new_vendor)

    return new_vendor


@router.get("/get", response_model=list[VendorResponse])
def get_vendors(db: Session = Depends(get_db)):
    vendors = db.query(Vendor).filter(Vendor.is_active == True).all()

    return vendors


@router.get("/get/{vendor_id}", response_model=VendorResponse)
def get_vendor_by_id(vendor_id, db: Session = Depends(get_db)):
    vendor = db.query(Vendor).filter(
        Vendor.id == vendor_id,
        Vendor.is_active == True
    ).first()

    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor Not Found")

    return vendor


@router.put("/update/{vendor_id}", response_model=VendorResponse)
def update_vendor(
    vendor_id: int,
    vendor: VendorUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    find_vendor = db.query(Vendor).filter(
        Vendor.id == vendor_id,
        Vendor.is_active == True
    ).first()

    if not find_vendor:
        raise HTTPException(status_code=404, detail="Vendor Not Found")

    before = {
        "name": find_vendor.name,
        "contact_info": find_vendor.contact_info,
        "address": find_vendor.address
    }

    if vendor.name is not None:
        find_vendor.name = vendor.name

    if vendor.contact_info is not None:
        find_vendor.contact_info = vendor.contact_info

    if vendor.address is not None:
        find_vendor.address = vendor.address

    after = {
        "name": find_vendor.name,
        "contact_info": find_vendor.contact_info,
        "address": find_vendor.address
    }

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="UPDATE_VENDOR",
        entity="Vendor",
        entity_id=find_vendor.id,
        before=before,
        after=after
    )

    db.commit()
    db.refresh(find_vendor)

    return find_vendor


@router.delete("/delete/{vendor_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vendor(
    vendor_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    vendor = db.query(Vendor).filter(
        Vendor.id == vendor_id,
        Vendor.is_active == True
    ).first()

    if not vendor:
        raise HTTPException(status_code=404, detail="VENDOR NOT FOUND")

    before = {
        "name": vendor.name,
        "contact_info": vendor.contact_info,
        "address": vendor.address,
        "is_active": vendor.is_active
    }

    vendor.is_active = False

    after = {
        "name": vendor.name,
        "contact_info": vendor.contact_info,
        "address": vendor.address,
        "is_active": vendor.is_active
    }

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="DELETE_VENDOR",
        entity="Vendor",
        entity_id=vendor.id,
        before=before,
        after=after
    )

    db.commit()

    return None