from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    mobile = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False) # 'FARMER', 'BUYER', 'ADMIN'
    language = Column(String, default="mr") # 'en', 'mr', 'hi'
    created_at = Column(DateTime, default=datetime.utcnow)

    farmer_profile = relationship("FarmerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    buyer_profile = relationship("BuyerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class FarmerProfile(Base):
    __tablename__ = "farmer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    full_name = Column(String, nullable=False)
    mobile = Column(String, nullable=False)
    state = Column(String, nullable=False)
    district = Column(String, nullable=False)
    taluka = Column(String, nullable=False)
    village = Column(String, nullable=False)
    address = Column(String, nullable=True)
    land_area = Column(Float, nullable=True)
    primary_crop = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="farmer_profile")
    produce_lots = relationship("FarmerProduce", back_populates="farmer", cascade="all, delete-orphan")
    fpo_contributions = relationship("FPOLotContribution", back_populates="farmer")
    rescue_plans = relationship("RescuePlan", back_populates="farmer")


class BuyerProfile(Base):
    __tablename__ = "buyer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    business_name = Column(String, nullable=False)
    contact_person = Column(String, nullable=False)
    mobile = Column(String, nullable=False)
    buyer_type = Column(String, nullable=False) # 'Wholesaler', 'Retailer', 'Processor', etc.
    state = Column(String, nullable=False)
    district = Column(String, nullable=False)
    delivery_location = Column(String, nullable=False)
    gstin = Column(String, nullable=True)
    address = Column(String, nullable=True)
    website = Column(String, nullable=True)
    payment_terms = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="buyer_profile")
    requirements = relationship("BuyerRequirement", back_populates="buyer", cascade="all, delete-orphan")
    bids = relationship("BuyerBid", back_populates="buyer", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="buyer")


class Crop(Base):
    __tablename__ = "crops"

    id = Column(Integer, primary_key=True, index=True)
    name_en = Column(String, nullable=False)
    name_mr = Column(String, nullable=False)
    name_hi = Column(String, nullable=False)
    category = Column(String, nullable=False)
    shelf_life_days = Column(Integer, nullable=False)
    standard_bag_size_kg = Column(Integer, default=50)
    transport_loss_percent_per_100km = Column(Float, default=1.2)

    market_prices = relationship("MarketPrice", back_populates="crop")
    produce_lots = relationship("FarmerProduce", back_populates="crop")
    fpo_lots = relationship("FPOLot", back_populates="crop")


class Market(Base):
    __tablename__ = "markets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    state = Column(String, nullable=False)
    district = Column(String, nullable=False)
    taluka = Column(String, nullable=False)
    distance_km = Column(Float, nullable=False)
    market_cess_percent = Column(Float, default=1.05)
    commission_percent = Column(Float, default=4.0)
    unloading_rate_per_qtl = Column(Float, default=15.0)
    transport_rate_per_km_ton = Column(Float, default=4.5)

    prices = relationship("MarketPrice", back_populates="market")


class MarketPrice(Base):
    __tablename__ = "market_prices"

    id = Column(Integer, primary_key=True, index=True)
    market_id = Column(Integer, ForeignKey("markets.id"), nullable=False)
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=False)
    price_date = Column(Date, nullable=False)
    min_price = Column(Float, nullable=False)
    max_price = Column(Float, nullable=False)
    modal_price = Column(Float, nullable=False)
    arrivals_qtl = Column(Float, nullable=False)
    trend = Column(String, default="STABLE")

    market = relationship("Market", back_populates="prices")
    crop = relationship("Crop", back_populates="market_prices")


class FarmerProduce(Base):
    __tablename__ = "farmer_produce"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmer_profiles.id"), nullable=False)
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=False)
    variety = Column(String, nullable=False)
    quantity_qtl = Column(Float, nullable=False)
    harvest_date = Column(Date, nullable=False)
    quality_grade = Column(String, default="Grade A")
    expected_price_per_qtl = Column(Float, nullable=False)
    village = Column(String, nullable=False)
    status = Column(String, default="AVAILABLE") # AVAILABLE, IN_FPO_LOT, MATCHED, SOLD, RESCUE
    created_at = Column(DateTime, default=datetime.utcnow)

    farmer = relationship("FarmerProfile", back_populates="produce_lots")
    crop = relationship("Crop", back_populates="produce_lots")
    bids = relationship("BuyerBid", back_populates="produce")


class FPOLot(Base):
    __tablename__ = "fpo_lots"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=False)
    target_quantity_qtl = Column(Float, nullable=False)
    current_quantity_qtl = Column(Float, default=0.0)
    collection_center = Column(String, nullable=False)
    transport_rate_discount_percent = Column(Float, default=28.0)
    status = Column(String, default="OPEN") # OPEN, AGGREGATING, READY_FOR_SALE, SOLD
    created_at = Column(DateTime, default=datetime.utcnow)

    crop = relationship("Crop", back_populates="fpo_lots")
    contributions = relationship("FPOLotContribution", back_populates="lot", cascade="all, delete-orphan")


class FPOLotContribution(Base):
    __tablename__ = "fpo_lot_contributions"

    id = Column(Integer, primary_key=True, index=True)
    lot_id = Column(Integer, ForeignKey("fpo_lots.id"), nullable=False)
    farmer_id = Column(Integer, ForeignKey("farmer_profiles.id"), nullable=False)
    produce_id = Column(Integer, ForeignKey("farmer_produce.id"), nullable=False)
    quantity_qtl = Column(Float, nullable=False)
    contribution_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="COMMITTED")

    lot = relationship("FPOLot", back_populates="contributions")
    farmer = relationship("FarmerProfile", back_populates="fpo_contributions")


class BuyerRequirement(Base):
    __tablename__ = "buyer_requirements"

    id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, ForeignKey("buyer_profiles.id"), nullable=False)
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=False)
    variety = Column(String, nullable=True)
    min_quantity_qtl = Column(Float, nullable=False)
    max_price_per_qtl = Column(Float, nullable=False)
    delivery_location = Column(String, nullable=False)
    status = Column(String, default="OPEN") # OPEN, MATCHED, FULFILLED
    created_at = Column(DateTime, default=datetime.utcnow)

    buyer = relationship("BuyerProfile", back_populates="requirements")


class BuyerBid(Base):
    __tablename__ = "buyer_bids"

    id = Column(Integer, primary_key=True, index=True)
    requirement_id = Column(Integer, ForeignKey("buyer_requirements.id"), nullable=True)
    buyer_id = Column(Integer, ForeignKey("buyer_profiles.id"), nullable=False)
    produce_id = Column(Integer, ForeignKey("farmer_produce.id"), nullable=True)
    lot_id = Column(Integer, ForeignKey("fpo_lots.id"), nullable=True)
    bid_price_per_qtl = Column(Float, nullable=False)
    quantity_qtl = Column(Float, nullable=False)
    proposed_pickup_date = Column(Date, nullable=False)
    status = Column(String, default="PENDING") # PENDING, ACCEPTED, REJECTED, COUNTERED
    counter_price_per_qtl = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    buyer = relationship("BuyerProfile", back_populates="bids")
    produce = relationship("FarmerProduce", back_populates="bids")


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    produce_id = Column(Integer, ForeignKey("farmer_produce.id"), nullable=True)
    lot_id = Column(Integer, ForeignKey("fpo_lots.id"), nullable=True)
    requirement_id = Column(Integer, ForeignKey("buyer_requirements.id"), nullable=False)
    match_score = Column(Float, nullable=False)
    estimated_transport_cost = Column(Float, nullable=False)
    net_realisation = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_ref = Column(String, unique=True, nullable=False)
    seller_type = Column(String, nullable=False) # 'FARMER', 'FPO'
    seller_id = Column(Integer, nullable=False)
    buyer_id = Column(Integer, ForeignKey("buyer_profiles.id"), nullable=False)
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=False)
    produce_id = Column(Integer, nullable=True)
    lot_id = Column(Integer, nullable=True)
    quantity_qtl = Column(Float, nullable=False)
    rate_per_qtl = Column(Float, nullable=False)
    gross_amount = Column(Float, nullable=False)
    transport_cost = Column(Float, nullable=False)
    net_amount = Column(Float, nullable=False)
    payment_status = Column(String, default="PAID")
    delivery_status = Column(String, default="DELIVERED")
    created_at = Column(DateTime, default=datetime.utcnow)

    buyer = relationship("BuyerProfile", back_populates="transactions")


class WeatherRecord(Base):
    __tablename__ = "weather_records"

    id = Column(Integer, primary_key=True, index=True)
    location_district = Column(String, nullable=False)
    forecast_date = Column(Date, nullable=False)
    temp_max = Column(Float, nullable=False)
    temp_min = Column(Float, nullable=False)
    rainfall_mm = Column(Float, nullable=False)
    humidity_percent = Column(Float, nullable=False)
    forecast_rain_risk = Column(String, nullable=False) # LOW, MODERATE, HIGH, SEVERE


class RescueOption(Base):
    __tablename__ = "rescue_options"

    id = Column(Integer, primary_key=True, index=True)
    facility_name = Column(String, nullable=False)
    facility_type = Column(String, nullable=False) # PROCESSING, DEHYDRATION, COLD_STORAGE, CATTLE_FEED, DISTRESS_PROCUREMENT
    district = Column(String, nullable=False)
    contact_phone = Column(String, nullable=False)
    capacity_qtl = Column(Float, nullable=False)
    price_offered_per_qtl = Column(Float, nullable=False)
    turnaround_hours = Column(Integer, nullable=False)
    status = Column(String, default="ACTIVE")

    rescue_plans = relationship("RescuePlan", back_populates="facility")


class RescuePlan(Base):
    __tablename__ = "rescue_plans"

    id = Column(Integer, primary_key=True, index=True)
    produce_id = Column(Integer, ForeignKey("farmer_produce.id"), nullable=False)
    farmer_id = Column(Integer, ForeignKey("farmer_profiles.id"), nullable=False)
    rescue_option_id = Column(Integer, ForeignKey("rescue_options.id"), nullable=False)
    reason = Column(String, nullable=False)
    quantity_qtl = Column(Float, nullable=False)
    agreed_price_per_qtl = Column(Float, nullable=False)
    status = Column(String, default="PENDING")
    created_at = Column(DateTime, default=datetime.utcnow)

    facility = relationship("RescueOption", back_populates="rescue_plans")
    farmer = relationship("FarmerProfile", back_populates="rescue_plans")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title_en = Column(String, nullable=False)
    title_mr = Column(String, nullable=False)
    title_hi = Column(String, nullable=False)
    message_en = Column(String, nullable=False)
    message_mr = Column(String, nullable=False)
    message_hi = Column(String, nullable=False)
    type = Column(String, default="INFO")
    read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")


class RecommendationRecord(Base):
    __tablename__ = "recommendation_records"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmer_profiles.id"), nullable=False)
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=False)
    recommended_market_id = Column(Integer, ForeignKey("markets.id"), nullable=False)
    decision = Column(String, nullable=False) # SELL_NOW, WAIT
    holding_days = Column(Integer, nullable=False)
    expected_price_gain = Column(Float, nullable=False)
    risk_score = Column(Float, nullable=False)
    rationale_en = Column(String, nullable=False)
    rationale_mr = Column(String, nullable=False)
    rationale_hi = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
