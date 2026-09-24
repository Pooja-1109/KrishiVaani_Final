export type UserRole = 'FARMER' | 'BUYER' | 'ADMIN';
export type SupportedLanguage = 'en' | 'mr' | 'hi';

export interface User {
  id: number;
  mobile: string;
  email?: string | null;
  role: UserRole;
  language: SupportedLanguage;
  created_at?: string;
}

export interface FarmerProfile {
  id: number;
  user_id: number;
  full_name: string;
  mobile: string;
  state: string;
  district: string;
  taluka: string;
  village: string;
  address?: string | null;
  land_area?: number | null;
  land_area_acres?: number | null;
  primary_crop?: string | null;
  created_at?: string;
}

export interface BuyerProfile {
  id: number;
  user_id: number;
  business_name: string;
  contact_person: string;
  mobile: string;
  buyer_type: string;
  state: string;
  district: string;
  delivery_location: string;
  gstin?: string | null;
  address?: string | null;
  website?: string | null;
  payment_terms?: string | null;
  created_at?: string;
}

export interface Crop {
  id: number;
  name_en: string;
  name_mr: string;
  name_hi: string;
  category: string;
  shelf_life_days: number;
  standard_bag_size_kg: number;
  transport_loss_percent_per_100km: number;
}

export interface Market {
  id: number;
  name: string;
  state: string;
  district: string;
  taluka: string;
  distance_km: number;
  market_cess_percent: number;
  commission_percent: number;
  unloading_rate_per_qtl: number;
  transport_rate_per_km_ton: number;
}

export interface MarketPrice {
  id: number;
  market_id: number;
  crop_id: number;
  price_date: string;
  min_price: number;
  max_price: number;
  modal_price: number;
  arrivals_qtl: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  market_name?: string;
  district?: string;
  taluka?: string;
  distance_km?: number;
  crop_name_en?: string;
  crop_name_mr?: string;
  crop_name_hi?: string;
  category?: string;
  data_source?: string;
  last_updated?: string;
  is_live?: number | boolean;
}

export interface FarmerProduce {
  id: number;
  farmer_id: number;
  crop_id: number;
  variety: string;
  quantity_qtl: number;
  harvest_date: string;
  quality_grade: string;
  expected_price_per_qtl: number;
  village: string;
  status: 'AVAILABLE' | 'IN_FPO_LOT' | 'MATCHED' | 'SOLD' | 'RESCUE';
  created_at?: string;
  crop_name_en?: string;
  crop_name_mr?: string;
  crop_name_hi?: string;
  category?: string;
  shelf_life_days?: number;
  farmer_name?: string;
  farmer_mobile?: string;
  district?: string;
}

export interface FPOLot {
  id: number;
  name: string;
  crop_id: number;
  target_quantity_qtl: number;
  current_quantity_qtl: number;
  collection_center: string;
  transport_rate_discount_percent: number;
  status: 'OPEN' | 'AGGREGATING' | 'READY_FOR_SALE' | 'SOLD';
  created_at?: string;
  crop_name_en?: string;
  crop_name_mr?: string;
  crop_name_hi?: string;
  contributor_count?: number;
}

export interface FPOLotContribution {
  id: number;
  lot_id: number;
  farmer_id: number;
  produce_id: number;
  quantity_qtl: number;
  contribution_date: string;
  status: string;
  farmer_name?: string;
  village?: string;
  mobile?: string;
}

export interface BuyerRequirement {
  id: number;
  buyer_id: number;
  crop_id: number;
  variety?: string | null;
  min_quantity_qtl: number;
  max_price_per_qtl: number;
  quality_grade?: string;
  delivery_location: string;
  delivery_date?: string;
  payment_terms?: string;
  buyer_type?: string;
  packaging_preference?: string;
  additional_notes?: string;
  pickup_delivery_preference?: string;
  status: 'OPEN' | 'MATCHED' | 'FULFILLED' | 'CANCELLED';
  created_at?: string;
  crop_name_en?: string;
  crop_name_mr?: string;
  crop_name_hi?: string;
  business_name?: string;
  contact_person?: string;
  mobile?: string;
}

export interface BuyerBid {
  id: number;
  requirement_id?: number | null;
  buyer_id: number;
  produce_id?: number | null;
  lot_id?: number | null;
  bid_price_per_qtl: number;
  quantity_qtl: number;
  proposed_pickup_date: string;
  payment_terms?: string;
  validity_date?: string;
  notes?: string;
  logistics_preference?: string;
  is_closed?: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED' | 'FINAL_OFFER' | 'CLOSED';
  counter_price_per_qtl?: number | null;
  created_at?: string;
  crop_name_en?: string;
  crop_name_mr?: string;
  crop_name_hi?: string;
  variety?: string;
  produce_village?: string;
  business_name?: string;
  buyer_type?: string;
  contact_person?: string;
  buyer_mobile?: string;
  farmer_name?: string;
  farmer_mobile?: string;
}

export type TransactionStatus =
  | 'OFFER_PENDING'
  | 'OFFER_ACCEPTED'
  | 'ORDER_CREATED'
  | 'QUALITY_VERIFICATION'
  | 'READY_FOR_DELIVERY'
  | 'IN_TRANSIT'
  | 'DELIVERED'
  | 'PAYMENT_PENDING'
  | 'COMPLETED'
  | 'CANCELLED';

export interface QualityVerification {
  id: number;
  transaction_id: number;
  verified_grade: string;
  is_accepted: boolean | number;
  quantity_verified_qtl: number;
  quality_notes?: string;
  verification_date: string;
  verifier_name?: string;
}

export interface PaymentRecord {
  id: number;
  transaction_id: number;
  payment_status: 'PENDING' | 'COMPLETED' | 'FAILED';
  amount: number;
  payment_method: string;
  payment_reference: string;
  is_demo: boolean | number;
  payment_date: string;
}

export interface Transaction {
  id: number;
  transaction_ref: string;
  seller_type: 'FARMER' | 'FPO';
  seller_id: number;
  buyer_id: number;
  crop_id: number;
  produce_id?: number | null;
  lot_id?: number | null;
  quantity_qtl: number;
  rate_per_qtl: number;
  gross_amount: number;
  transport_cost: number;
  net_amount: number;
  status: TransactionStatus;
  payment_status: 'PAID' | 'PENDING' | 'IN_ESCROW';
  delivery_status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED';
  pickup_delivery_mode?: string;
  delivery_address?: string;
  quality_verification?: QualityVerification | null;
  payment_record?: PaymentRecord | null;
  created_at: string;
  updated_at?: string;
  crop_name_en?: string;
  crop_name_mr?: string;
  crop_name_hi?: string;
  buyer_name?: string;
  buyer_contact?: string;
  farmer_name?: string;
  farmer_mobile?: string;
}

export interface MatchFactorItem {
  score: number;
  weight: number;
  labelEn: string;
  labelMr: string;
  labelHi: string;
  passed: boolean;
}

export interface MatchDetail {
  score: number;
  isEligible: boolean;
  reasons: {
    crop: MatchFactorItem;
    quantity: MatchFactorItem;
    quality: MatchFactorItem;
    location: MatchFactorItem;
    deliveryDate: MatchFactorItem;
    price: MatchFactorItem;
  };
  summaryEn: string;
  summaryMr: string;
  summaryHi: string;
}

export interface RescueOption {
  id: number;
  facility_name: string;
  facility_type: 'PROCESSING' | 'DEHYDRATION' | 'COLD_STORAGE' | 'CATTLE_FEED' | 'DISTRESS_PROCUREMENT';
  district: string;
  contact_phone: string;
  capacity_qtl: number;
  price_offered_per_qtl: number;
  turnaround_hours: number;
  status: string;
}

export interface RescuePlan {
  id: number;
  produce_id: number;
  farmer_id: number;
  rescue_option_id: number;
  reason: string;
  quantity_qtl: number;
  agreed_price_per_qtl: number;
  status: 'PENDING' | 'ACCEPTED' | 'DISPATCHED' | 'RESOLVED';
  created_at: string;
  facility_name?: string;
  facility_type?: string;
  contact_phone?: string;
  facility_district?: string;
  variety?: string;
  crop_name_en?: string;
  crop_name_mr?: string;
  crop_name_hi?: string;
  farmer_name?: string;
  farmer_mobile?: string;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title_en: string;
  title_mr: string;
  title_hi: string;
  message_en: string;
  message_mr: string;
  message_hi: string;
  type: string;
  read: number | boolean;
  created_at: string;
}

export interface NetRealisationCalculation {
  crop: Crop;
  quantityQtl: number;
  isFpoPooled: boolean;
  explainable?: ExplainablePayload;
  rankings: Array<{
    marketId: number;
    marketName: string;
    district: string;
    distanceKm: number;
    grossPricePerQtl: number;
    transportCostPerQtl: number;
    loadingHandlingPerQtl: number;
    cessAndCommissionPerQtl: number;
    transitLossPerQtl: number;
    netRealisationPerQtl: number;
    totalNetRevenue: number;
    differenceFromNearestPerQtl: number;
    isBestMarket: boolean;
    recommendationNoteEn: string;
    recommendationNoteMr: string;
    recommendationNoteHi: string;
  }>;
}

export interface DailyForecastItem {
  date: string;
  tempMax: number;
  tempMin: number;
  rainfallMm: number;
  rainProbabilityPercent: number;
}

export interface WeatherData {
  district: string;
  latitude: number;
  longitude: number;
  currentTemp: number;
  currentHumidity: number;
  currentPrecipitation: number;
  dailyForecast: DailyForecastItem[];
  rainRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
  maxRainNext48hMm: number;
  source: string;
  isLive: boolean;
  retrievedAt: string;
  weatherDate: string;
  summaryEn: string;
  summaryMr: string;
  summaryHi: string;
}

export interface MLMetrics {
  mae: number;
  rmse: number;
  r2: number;
  trainSampleSize: number;
  testSampleSize: number;
  meanActualTestPrice: number;
  meanPredictedTestPrice: number;
}

export interface DayForecast {
  dayOffset: number;
  targetDate: string;
  predictedPrice: number;
  priceRangeMin: number;
  priceRangeMax: number;
  projectedTrend: 'UP' | 'DOWN' | 'STABLE';
  confidenceIntervalPercent: number;
}

export interface MLPipelineResult {
  status: 'TRAINED_AND_EVALUATED' | 'INSUFFICIENT_DATA';
  algorithm: string;
  cropId: number;
  cropName: string;
  trainTestSplitDescription: string;
  metrics: MLMetrics | null;
  forecast: DayForecast[] | null;
  messageEn: string;
  messageMr: string;
  messageHi: string;
  contributingFeatures: Array<{
    feature: string;
    importanceScore: number;
    explanationEn: string;
    explanationMr: string;
    explanationHi: string;
  }>;
  dataSource: {
    sourceType: 'LOCAL_DATASET' | 'EXTERNAL_API';
    name: string;
    recordCount: number;
    dateRange: string;
    retrievedAt: string;
    isLive: boolean;
  };
}

export interface CalculationStep {
  labelEn: string;
  labelMr: string;
  labelHi: string;
  value: number;
  unit: string;
  isDeduction?: boolean;
}

export interface ExplainingFactor {
  nameEn: string;
  nameMr: string;
  nameHi: string;
  weightPercent?: number;
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  valueDisplay: string;
  rationaleEn: string;
  rationaleMr: string;
  rationaleHi: string;
}

export interface ExplainablePayload<T = any> {
  recommendationTitleEn: string;
  recommendationTitleMr: string;
  recommendationTitleHi: string;
  recommendation?: {
    type?: string;
    decisionEn?: string;
    decisionMr?: string;
    decisionHi?: string;
    confidenceScore?: number;
    riskScore?: number;
    actionableSummaryEn?: string;
    actionableSummaryMr?: string;
    actionableSummaryHi?: string;
  };
  dataSource: {
    sourceName: string;
    retrievedAt: string;
    recordDate: string;
    isLive: boolean;
    sourceType: 'LIVE_API' | 'LOCAL_DATASET';
  };
  calculation: {
    formulaEn: string;
    formulaMr: string;
    formulaHi: string;
    steps: CalculationStep[];
  };
  factors: ExplainingFactor[];
  assumptions: {
    en: string[];
    mr: string[];
    hi: string[];
  };
  alternativeOptions: Array<{
    titleEn: string;
    titleMr: string;
    titleHi: string;
    expectedOutcomeEn: string;
    expectedOutcomeMr: string;
    expectedOutcomeHi: string;
  }>;
  farmerDisclaimer: {
    en: string;
    mr: string;
    hi: string;
  };
  data: T;
}

export interface MatchFactorBreakdown {
  rawScore: number;
  weightPercent: number;
  contributionPoints: number;
  labelEn: string;
  labelMr: string;
  labelHi: string;
  passed: boolean;
}

export interface SellOrWaitEvaluation {
  crop: Crop;
  currentPrice: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  weather?: WeatherData | {
    rainfall_mm: number;
    forecast_rain_risk: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
    temp_max: number;
    humidity_percent: number;
  };
  mlPipeline?: MLPipelineResult;
  explainable?: ExplainablePayload;
  recommendation: {
    decision: 'SELL_NOW' | 'WAIT';
    confidenceScore: number;
    riskScore: number;
    recommendedHoldingDays: number;
    expectedPriceGainPerQtl?: number;
    expectedSellNowValuePerQtl?: number;
    expectedWaitValuePerQtl?: number;
    netGainLossPerQtl?: number;
    predictedFuturePricePerQtl?: number;
    storageCostPerQtlDaily?: number;
    totalStorageCostPerQtl?: number;
    holdingDecayRiskPercent?: number;
    totalWastageLossPerQtl?: number;
    rationaleEn: string;
    rationaleMr: string;
    rationaleHi: string;
    weatherRiskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
  };
}
