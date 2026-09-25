"""
KRISHIVAANI — FastAPI Backend Server
Risk-Aware Market Linkage and Net Realisation Platform for Farmers
"""

import os
from typing import Optional, List
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt

from .database import engine, get_db, Base
from .models import (
    User, FarmerProfile, BuyerProfile, Crop, Market, MarketPrice,
    FarmerProduce, FPOLot, FPOLotContribution, BuyerRequirement,
    BuyerBid, Transaction, RescueOption, RescuePlan, Notification
)
from .ml_engine import predict_sell_or_wait

# Create database tables if they do not exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="KRISHIVAANI API",
    description="Risk-Aware Market Linkage & Net Realisation Engine",
    version="1.0.0"
)

# CORS configuration
frontend_url_env = os.environ.get("FRONTEND_URL", "")
allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:4173",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]
if frontend_url_env:
    for url in frontend_url_env.split(","):
        cleaned = url.strip().rstrip("/")
        if cleaned and cleaned not in allowed_origins:
            allowed_origins.append(cleaned)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if frontend_url_env else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "krishivaani-python-backend"}

SECRET_KEY = os.environ.get("JWT_SECRET", "krishivaani_super_secret_jwt_key_2026")
ALGORITHM = "HS256"
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ----------------------------------------------------
# Pydantic Schemas
# ----------------------------------------------------

class LoginRequest(BaseModel):
    mobile: str
    password: str

class FarmerRegisterRequest(BaseModel):
    fullName: str
    mobile: str
    password: str
    state: str
    district: str
    taluka: str
    village: str
    preferredLanguage: Optional[str] = "mr"
    email: Optional[str] = None
    address: Optional[str] = None
    landArea: Optional[float] = None
    primaryCrop: Optional[str] = None

class BuyerRegisterRequest(BaseModel):
    businessName: str
    contactPerson: str
    mobile: str
    password: str
    buyerType: str
    state: str
    district: str
    deliveryLocation: str
    email: Optional[str] = None
    gstin: Optional[str] = None
    address: Optional[str] = None
    website: Optional[str] = None
    paymentTerms: Optional[str] = None

class NetCalcRequest(BaseModel):
    crop_id: int
    quantity_qtl: float
    is_fpo_pooled: Optional[bool] = False

class CreateProduceRequest(BaseModel):
    crop_id: int
    variety: Optional[str] = None
    quantity_qtl: float
    harvest_date: str
    quality_grade: Optional[str] = "A"
    expected_price_per_qtl: float
    village_location: str

class CreateFPOLotRequest(BaseModel):
    name: str
    crop_id: int
    target_quantity_qtl: float
    collection_center: str

class ContributeFPOLotRequest(BaseModel):
    lot_id: int
    produce_id: Optional[int] = None
    quantity_qtl: float

class CreateBuyerReqRequest(BaseModel):
    crop_id: int
    min_quantity_qtl: float
    max_price_per_qtl: float
    variety: Optional[str] = None
    delivery_location: str

class PlaceBidRequest(BaseModel):
    produce_id: int
    bid_amount_per_qtl: float
    notes: Optional[str] = None
    proposed_pickup_date: Optional[str] = None

class BidStatusUpdate(BaseModel):
    status: str
    counter_amount_per_qtl: Optional[float] = None

class InitiateRescueRequest(BaseModel):
    produce_id: int
    rescue_option_id: int
    allocated_quantity_qtl: float
    agreed_price_per_qtl: float
    dispatch_notes: Optional[str] = None

# ----------------------------------------------------
# Auth Helpers
# ----------------------------------------------------

def create_access_token(data: dict):
    to_encode = data.copy()
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ----------------------------------------------------
# 1. AUTHENTICATION
# ----------------------------------------------------

@app.post("/api/auth/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.mobile == payload.mobile.strip()).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid mobile number or password")
    
    # Check password
    if not pwd_context.verify(payload.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid mobile number or password")

    profile_data = None
    if user.role == "FARMER" and user.farmer_profile:
        profile_data = {
            "id": user.farmer_profile.id,
            "full_name": user.farmer_profile.full_name,
            "state": user.farmer_profile.state,
            "district": user.farmer_profile.district,
            "taluka": user.farmer_profile.taluka,
            "village": user.farmer_profile.village,
            "primary_crop": user.farmer_profile.primary_crop,
        }
    elif user.role == "BUYER" and user.buyer_profile:
        profile_data = {
            "id": user.buyer_profile.id,
            "business_name": user.buyer_profile.business_name,
            "contact_person": user.buyer_profile.contact_person,
            "buyer_type": user.buyer_profile.buyer_type,
            "state": user.buyer_profile.state,
            "district": user.buyer_profile.district,
            "delivery_location": user.buyer_profile.delivery_location,
        }

    token = create_access_token({
        "userId": user.id,
        "mobile": user.mobile,
        "role": user.role,
        "language": user.language,
        "profileId": profile_data["id"] if profile_data else None
    })

    return {
        "token": token,
        "user": {
            "id": user.id,
            "mobile": user.mobile,
            "email": user.email,
            "role": user.role,
            "language": user.language
        },
        "profile": profile_data
    }

@app.post("/api/auth/register/farmer")
def register_farmer(payload: FarmerRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.mobile == payload.mobile.strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Mobile already registered")

    pwd_hash = pwd_context.hash(payload.password)
    user = User(
        mobile=payload.mobile.strip(),
        email=payload.email.strip() if payload.email else None,
        password_hash=pwd_hash,
        role="FARMER",
        language=payload.preferredLanguage or "mr"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    profile = FarmerProfile(
        user_id=user.id,
        full_name=payload.fullName.strip(),
        mobile=payload.mobile.strip(),
        state=payload.state.strip(),
        district=payload.district.strip(),
        taluka=payload.taluka.strip(),
        village=payload.village.strip(),
        address=payload.address,
        land_area=payload.landArea,
        primary_crop=payload.primaryCrop
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    token = create_access_token({
        "userId": user.id,
        "mobile": user.mobile,
        "role": "FARMER",
        "language": user.language,
        "profileId": profile.id
    })

    return {
        "token": token,
        "user": {"id": user.id, "mobile": user.mobile, "email": user.email, "role": "FARMER", "language": user.language},
        "profile": profile
    }

# ----------------------------------------------------
# 2. CROP & MARKET PRICING
# ----------------------------------------------------

@app.get("/api/crops")
def get_crops(db: Session = Depends(get_db)):
    return db.query(Crop).order_by(Crop.id.asc()).all()

@app.get("/api/markets")
def get_markets(db: Session = Depends(get_db)):
    return db.query(Market).order_by(Market.distance_km.asc()).all()

@app.get("/api/market-prices")
def get_market_prices(crop_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(MarketPrice)
    if crop_id:
        query = query.filter(MarketPrice.crop_id == crop_id)
    return query.all()

# ----------------------------------------------------
# 3. NET REALISATION CALCULATOR
# ----------------------------------------------------

@app.post("/api/net-realisation/calculate")
def calculate_net_realisation(payload: NetCalcRequest, db: Session = Depends(get_db)):
    crop = db.query(Crop).filter(Crop.id == payload.crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")

    markets = db.query(Market).order_by(Market.distance_km.asc()).all()
    rankings = []

    discount = 0.28 if payload.is_fpo_pooled else 0.0

    for m in markets:
        mp = db.query(MarketPrice).filter(MarketPrice.market_id == m.id, MarketPrice.crop_id == crop.id).first()
        if not mp:
            continue

        modal_price = mp.modal_price
        gross_value = round(modal_price * payload.quantity_qtl, 2)

        # Transport cost: base ton-km rate with FPO bulk discount
        effective_rate = m.transport_rate_per_km_ton * (1.0 - discount)
        tonnage = payload.quantity_qtl / 10.0
        transport_cost = round(m.distance_km * effective_rate * tonnage * 2.0, 2)

        # Mandi charges
        unloading_cost = round(m.unloading_rate_per_qtl * payload.quantity_qtl, 2)
        cess_commission = round(gross_value * ((m.market_cess_percent + m.commission_percent) / 100.0), 2)

        # Perishability transit loss
        transit_loss_pct = (m.distance_km / 100.0) * crop.transport_loss_percent_per_100km
        transit_loss_cost = round(gross_value * (transit_loss_pct / 100.0), 2)

        total_deductions = round(transport_cost + unloading_cost + cess_commission + transit_loss_cost, 2)
        net_earning = round(gross_value - total_deductions, 2)
        net_in_hand_per_qtl = round(net_earning / payload.quantity_qtl, 2)

        rankings.append({
            "marketId": m.id,
            "marketName": m.name,
            "district": m.district,
            "distanceKm": m.distance_km,
            "modalPrice": modal_price,
            "grossValue": gross_value,
            "transportCost": transport_cost,
            "unloadingCost": unloading_cost,
            "cessCommission": cess_commission,
            "transitLossCost": transit_loss_cost,
            "totalDeductions": total_deductions,
            "netInHandPerQtl": net_in_hand_per_qtl,
            "totalNetEarning": net_earning,
            "isBestNet": False,
            "diffFromNearest": 0.0,
            "fpoFreightSavings": round(transport_cost * 0.38, 2) if payload.is_fpo_pooled else 0.0
        })

    # Sort descending by netInHandPerQtl
    rankings.sort(key=lambda x: x["netInHandPerQtl"], reverse=True)
    if rankings:
        rankings[0]["isBestNet"] = True

    return {
        "crop": crop,
        "quantityQtl": payload.quantity_qtl,
        "isFpoPooled": payload.is_fpo_pooled,
        "rankings": rankings
    }

# ----------------------------------------------------
# 4. FPO AGGREGATION
# ----------------------------------------------------

@app.get("/api/fpo/lots")
def get_fpo_lots(db: Session = Depends(get_db)):
    return db.query(FPOLot).order_by(FPOLot.created_at.desc()).all()

# ----------------------------------------------------
# 5. SELL OR WAIT RECOMMENDATION ENGINE
# ----------------------------------------------------

@app.get("/api/sell-or-wait/evaluate")
def evaluate_sell_or_wait(crop_id: int, db: Session = Depends(get_db)):
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found")

    # In production, this pulls live Open-Meteo weather and APMC modal prices
    modal_price = 2550.0 if crop.id == 1 else 1850.0
    trend = "UP" if crop.category != "Vegetable" else "DOWN"
    rainfall_mm = 18.4 if crop.category == "Vegetable" else 2.1
    rain_risk = "HIGH" if rainfall_mm > 15 else "LOW"

    ml_result = predict_sell_or_wait(
        shelf_life_days=crop.shelf_life_days,
        category=crop.category,
        modal_price=modal_price,
        trend=trend,
        rainfall_mm=rainfall_mm,
        forecast_rain_risk=rain_risk
    )

    return {
        "crop": crop,
        "currentPrice": modal_price,
        "trend": trend,
        "weather": {
            "rainfallMm": rainfall_mm,
            "temperatureC": 29.5,
            "humidityPercent": 76,
            "riskLevel": rain_risk
        },
        "recommendation": ml_result
    }

# ----------------------------------------------------
# 6. CROP RESCUE EMERGENCY NETWORK
# ----------------------------------------------------

@app.get("/api/rescue/options")
def get_rescue_options(db: Session = Depends(get_db)):
    return db.query(RescueOption).order_by(RescueOption.price_offered_per_qtl.desc()).all()

@app.get("/api/rescue/plans")
def get_rescue_plans(db: Session = Depends(get_db)):
    return db.query(RescuePlan).order_by(RescuePlan.created_at.desc()).all()
