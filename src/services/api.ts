import {
  User,
  FarmerProfile,
  BuyerProfile,
  Crop,
  Market,
  MarketPrice,
  FarmerProduce,
  FPOLot,
  FPOLotContribution,
  BuyerRequirement,
  BuyerBid,
  Transaction,
  RescueOption,
  RescuePlan,
  NotificationItem,
  NetRealisationCalculation,
  SellOrWaitEvaluation,
  ExplainablePayload,
} from '../types';

const RAW_API_BASE = import.meta.env.VITE_API_BASE_URL || '';
const API_BASE = RAW_API_BASE ? `${RAW_API_BASE.replace(/\/$/, '')}/api` : '/api';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('krishivaani_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data as T;
}

export const api = {
  // Auth
  login: (mobile: string, password: string) =>
    request<{ token: string; user: User; profile: FarmerProfile | BuyerProfile | null }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ mobile, password }),
    }),

  registerFarmer: (payload: any) =>
    request<{ token: string; user: User; profile: FarmerProfile }>('/auth/register/farmer', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  registerBuyer: (payload: any) =>
    request<{ token: string; user: User; profile: BuyerProfile }>('/auth/register/buyer', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () =>
    request<{ user: User; profile: FarmerProfile | BuyerProfile | null }>('/auth/me'),

  updateLanguage: (language: string) =>
    request<{ success: boolean; language: string }>('/auth/language', {
      method: 'PUT',
      body: JSON.stringify({ language }),
    }),

  // Module 1
  getCrops: () => request<Crop[]>('/crops'),
  getMarkets: (params?: { lat?: number; lon?: number; district?: string }) => {
    const q = new URLSearchParams();
    if (params?.lat !== undefined) q.set('lat', String(params.lat));
    if (params?.lon !== undefined) q.set('lon', String(params.lon));
    if (params?.district) q.set('district', params.district);
    const qs = q.toString();
    return request<Market[]>(qs ? `/markets?${qs}` : '/markets');
  },
  getMarketPrices: (params?: number | { cropId?: number; lat?: number; lon?: number; district?: string; radius?: number }) => {
    const q = new URLSearchParams();
    if (typeof params === 'number') {
      q.set('crop_id', String(params));
    } else if (params) {
      if (params.cropId) q.set('crop_id', String(params.cropId));
      if (params.lat !== undefined) q.set('lat', String(params.lat));
      if (params.lon !== undefined) q.set('lon', String(params.lon));
      if (params.district) q.set('district', params.district);
      if (params.radius) q.set('radius', String(params.radius));
    }
    const qs = q.toString();
    return request<MarketPrice[]>(qs ? `/market-prices?${qs}` : '/market-prices');
  },

  // Module 2
  calculateNetRealisation: (
    cropId: number,
    quantityQtl: number,
    isFpoPooled: boolean = false,
    district?: string,
    latitude?: number,
    longitude?: number
  ) =>
    request<NetRealisationCalculation>('/net-realisation/calculate', {
      method: 'POST',
      body: JSON.stringify({
        crop_id: cropId,
        quantity_qtl: quantityQtl,
        is_fpo_pooled: isFpoPooled,
        district,
        lat: latitude,
        lon: longitude,
      }),
    }),

  // Module 3
  getFpoLots: () => request<FPOLot[]>('/fpo/lots'),
  createFpoLot: (payload: { name: string; crop_id: number; target_quantity_qtl: number; collection_center: string }) =>
    request<FPOLot>('/fpo/lots', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  contributeToFpoLot: (lotId: number, produceId: number, quantityQtl: number) =>
    request<{ success: boolean; newLotQty: number; status: string }>(`/fpo/lots/${lotId}/contribute`, {
      method: 'POST',
      body: JSON.stringify({ produce_id: produceId, quantity_qtl: quantityQtl }),
    }),
  getFpoMembers: (lotId: number) => request<FPOLotContribution[]>(`/fpo/lots/${lotId}/members`),

  // Module 4
  evaluateSellOrWait: (cropId: number, params?: { lat?: number; lon?: number; district?: string }) => {
    const q = new URLSearchParams();
    q.set('crop_id', String(cropId));
    if (params?.lat !== undefined) q.set('lat', String(params.lat));
    if (params?.lon !== undefined) q.set('lon', String(params.lon));
    if (params?.district) q.set('district', params.district);
    return request<SellOrWaitEvaluation>(`/sell-or-wait/evaluate?${q.toString()}`);
  },

  // Module 5
  getFarmerProduce: () => request<FarmerProduce[]>('/farmer/produce'),
  createFarmerProduce: (payload: any) =>
    request<FarmerProduce>('/farmer/produce', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteFarmerProduce: (id: number) =>
    request<{ success: boolean }>(`/farmer/produce/${id}`, {
      method: 'DELETE',
    }),

  getBuyerRequirements: (params?: { my_requirements?: boolean; crop_id?: number }) => {
    let url = '/buyer/requirements';
    const q: string[] = [];
    if (params?.my_requirements) q.push('my_requirements=true');
    if (params?.crop_id) q.push(`crop_id=${params.crop_id}`);
    if (q.length > 0) url += `?${q.join('&')}`;
    return request<BuyerRequirement[]>(url);
  },
  createBuyerRequirement: (payload: any) =>
    request<BuyerRequirement>('/buyer/requirements', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Transparent Matching Engine
  getMatchingProduceForRequirement: (requirementId: number) =>
    request<{ requirement: BuyerRequirement; totalMatches: number; matches: any[] }>(
      `/matching/produce-for-requirement/${requirementId}`
    ),

  getProduceForRequirement: async (
    requirementId: number,
    customWeights?: {
      cropWeight?: number;
      quantityWeight?: number;
      qualityWeight?: number;
      priceWeight?: number;
      locationWeight?: number;
      deliveryDateWeight?: number;
    }
  ) => {
    let url = `/matching/produce-for-requirement/${requirementId}`;
    if (customWeights) {
      const q = new URLSearchParams();
      if (customWeights.cropWeight !== undefined) q.set('w_crop', String(customWeights.cropWeight));
      if (customWeights.quantityWeight !== undefined) q.set('w_qty', String(customWeights.quantityWeight));
      if (customWeights.qualityWeight !== undefined) q.set('w_quality', String(customWeights.qualityWeight));
      if (customWeights.priceWeight !== undefined) q.set('w_price', String(customWeights.priceWeight));
      if (customWeights.locationWeight !== undefined) q.set('w_location', String(customWeights.locationWeight));
      if (customWeights.deliveryDateWeight !== undefined) q.set('w_date', String(customWeights.deliveryDateWeight));
      url += `?${q.toString()}`;
    }
    const res = await request<{ requirement: BuyerRequirement; totalMatches: number; matches: any[] }>(url);
    return res.matches || [];
  },

  getMatchingRequirementsForProduce: (produceId: number) =>
    request<{ produce: FarmerProduce; totalMatches: number; matches: any[] }>(
      `/matching/requirements-for-produce/${produceId}`
    ),

  getFarmerMatchedRequirements: async () => {
    // Queries all matching requirements for the farmer's produce
    const produceList = await request<FarmerProduce[]>('/farmer/produce');
    const matchedResults: any[] = [];
    for (const p of produceList) {
      try {
        const res = await request<{ produce: FarmerProduce; totalMatches: number; matches: any[] }>(
          `/matching/requirements-for-produce/${p.id}`
        );
        if (res.matches && res.matches.length > 0) {
          for (const m of res.matches) {
            matchedResults.push({
              produce: p,
              requirement: m.requirement || m,
              score: m.score,
              reasons: m.reasons,
              score_breakdown: m.score_breakdown,
            });
          }
        }
      } catch (err) {
        // continue
      }
    }
    return matchedResults;
  },

  getMatchedProduceForBuyer: () => request<FarmerProduce[]>('/farmer/produce'),

  getBids: (produceId?: number, lotId?: number) => {
    let url = '/bids';
    if (produceId) url += `?produce_id=${produceId}`;
    else if (lotId) url += `?lot_id=${lotId}`;
    return request<BuyerBid[]>(url);
  },
  createBid: (payload: {
    produce_id?: number;
    lot_id?: number;
    bid_price_per_qtl: number;
    quantity_qtl: number;
    proposed_pickup_date: string;
    requirement_id?: number;
    payment_terms?: string;
    validity_date?: string;
    notes?: string;
  }) =>
    request<BuyerBid>('/bids', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateBid: (
    bidId: number,
    payload: {
      bid_price_per_qtl?: number;
      quantity_qtl?: number;
      proposed_pickup_date?: string;
      payment_terms?: string;
      validity_date?: string;
      notes?: string;
    }
  ) =>
    request<BuyerBid>(`/bids/${bidId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  closeBid: (bidId: number) =>
    request<{ success: boolean; status: string }>(`/bids/${bidId}/close`, {
      method: 'PUT',
    }),
  sendBidToModule2: (bidId: number) =>
    request<any>(`/bids/${bidId}/send-to-module2`, {
      method: 'POST',
    }),
  createTransactionFromBid: (bidId: number) =>
    request<Transaction>('/transactions/create-from-bid', {
      method: 'POST',
      body: JSON.stringify({ bidId }),
    }),
  respondToBid: (bidId: number, action: 'ACCEPT' | 'REJECT' | 'COUNTER', counterPrice?: number) =>
    request<{ success: boolean; status: string; transactionRef?: string }>(`/bids/${bidId}/respond`, {
      method: 'POST',
      body: JSON.stringify({ action, counter_price: counterPrice }),
    }),

  // Transaction Workflow
  getTransactions: () => request<Transaction[]>('/transactions'),
  getTransactionDetails: (txId: number) =>
    request<{ transaction: Transaction; verifications: any[]; payments: any[] }>(`/transactions/${txId}/details`),
  verifyTransactionQuality: (
    txId: number,
    payload: {
      verified_grade: string;
      is_accepted: boolean;
      quantity_verified_qtl: number;
      quality_notes?: string;
      verifier_name?: string;
    }
  ) =>
    request<{ success: boolean; accepted: boolean; newStatus: string }>(`/transactions/${txId}/quality-verify`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  advanceDelivery: (txId: number, target_status: 'IN_TRANSIT' | 'DELIVERED') =>
    request<{ success: boolean; target_status: string }>(`/transactions/${txId}/advance-delivery`, {
      method: 'PUT',
      body: JSON.stringify({ target_status }),
    }),
  updateTransactionStatus: (txId: number, target_status: 'IN_TRANSIT' | 'DELIVERED', notes?: string) =>
    request<{ success: boolean; target_status: string }>(`/transactions/${txId}/advance-delivery`, {
      method: 'PUT',
      body: JSON.stringify({ target_status, notes }),
    }),
  processPayment: (
    txId: number,
    payload: {
      payment_method: string;
      notes?: string;
    }
  ) =>
    request<{ success: boolean; payment_reference: string; status: string }>(`/transactions/${txId}/payment`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  recordDemoPayment: (
    txId: number,
    payload: {
      amount?: number;
      payment_method: string;
      payment_reference?: string;
      notes?: string;
    }
  ) =>
    request<{ success: boolean; payment_reference: string; status: string }>(`/transactions/${txId}/payment`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  cancelTransaction: (txId: number) =>
    request<{ success: boolean; status: string; rescueRecommended: boolean; produceId?: number }>(
      `/transactions/${txId}/cancel`,
      { method: 'PUT' }
    ),

  // Profiles
  updateProfile: (payload: any) =>
    request<{ success: boolean; user: User; profile: FarmerProfile | BuyerProfile }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  updateFarmerProfile: (payload: any) =>
    request<{ success: boolean; user: User; profile: FarmerProfile }>('/farmer/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  updateBuyerProfile: (payload: any) =>
    request<{ success: boolean; user: User; profile: BuyerProfile }>('/buyer/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Module 6
  getRescueOptions: () => request<RescueOption[]>('/rescue/options'),
  getRescueRecommendationPlan: (produceId?: number) =>
    request<{
      produce: any;
      weather: any;
      explainable: ExplainablePayload;
    }>(produceId ? `/crop-rescue/recommend-plan?produce_id=${produceId}` : '/crop-rescue/recommend-plan'),
  createRescueRequest: (payload: { produce_id: number; rescue_option_id: number; reason: string; quantity_qtl: number }) =>
    request<RescuePlan>('/rescue/requests', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getRescueRequests: () => request<RescuePlan[]>('/rescue/requests'),

  // Weather
  getWeather: (district?: string, lat?: number, lon?: number) => {
    const params = new URLSearchParams();
    if (district) params.append('district', district);
    if (lat !== undefined) params.append('lat', String(lat));
    if (lon !== undefined) params.append('lon', String(lon));
    const qs = params.toString();
    return request<any>(qs ? `/weather?${qs}` : '/weather');
  },

  // Notifications
  getNotifications: () => request<NotificationItem[]>('/notifications'),
  markNotificationRead: (id: number) =>
    request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PUT' }),
  markNotificationsRead: () => request<{ success: boolean }>('/notifications/read-all', { method: 'PUT' }),

  // Admin
  getAdminStats: () => request<any>('/admin/stats'),
  getAdminUsers: () => request<any[]>('/admin/users'),
  getAdminFarmers: () => request<any[]>('/admin/farmers'),
  getAdminBuyers: () => request<any[]>('/admin/buyers'),

  // ML Price Prediction
  getPricePrediction: (cropId: number) => request<any>(`/price-prediction/${cropId}`),

  // Health
  getHealth: () => request<{ status: string; service: string }>('/health'),
};
