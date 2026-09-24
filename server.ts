import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDb, queryAll, queryOne, run } from './server/db.ts';
import {
  computeNetRealisation,
  computeSellOrWaitRecommendation,
  computeProduceMatch,
  computeUnifiedNetRealisation,
  computeExplainableSellOrWait,
  computeExplainableCropRescue,
  calculateHaversineKm,
} from './server/engine.ts';
import { runPricePredictionPipeline } from './server/mlPipeline.ts';
import { getLiveOrCachedWeather, getCoordinatesForLocation } from './server/weatherService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'krishivaani_super_secret_jwt_key_2026';
const PORT = Number(process.env.PORT) || 3000;

const app = express();
app.use(express.json());

// Auth Middleware
export interface AuthUser {
  userId: number;
  mobile: string;
  role: 'FARMER' | 'BUYER' | 'ADMIN';
  language: 'en' | 'mr' | 'hi';
  profileId?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user as AuthUser;
    next();
  });
}

function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied for this user role' });
    }
    next();
  };
}

// ----------------------------------------------------
// AUTH ROUTES
// ----------------------------------------------------

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { mobile, password } = req.body;
    if (!mobile || !password) {
      return res.status(400).json({ error: 'Mobile and password are required' });
    }

    const db = await getDb();
    const user = queryOne(db, 'SELECT * FROM users WHERE mobile = ?', [mobile.trim()]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid mobile number or password' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid mobile number or password' });
    }

    let profile: any = null;
    if (user.role === 'FARMER') {
      profile = queryOne(db, 'SELECT * FROM farmer_profiles WHERE user_id = ?', [user.id]);
    } else if (user.role === 'BUYER') {
      profile = queryOne(db, 'SELECT * FROM buyer_profiles WHERE user_id = ?', [user.id]);
    }

    const payload: AuthUser = {
      userId: user.id,
      mobile: user.mobile,
      role: user.role,
      language: user.language,
      profileId: profile ? profile.id : undefined,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      token,
      user: {
        id: user.id,
        mobile: user.mobile,
        email: user.email,
        role: user.role,
        language: user.language,
      },
      profile,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/register/farmer', async (req: Request, res: Response) => {
  try {
    const {
      fullName,
      mobile,
      password,
      state,
      district,
      taluka,
      village,
      preferredLanguage = 'mr',
      email,
      address,
      landArea,
      primaryCrop,
      latitude,
      longitude,
      placeId,
    } = req.body;

    if (!fullName || !mobile || !password || !state || !district || !village) {
      return res.status(400).json({ error: 'Please fill all required farmer fields' });
    }

    if (!/^\d{10}$/.test(mobile.trim())) {
      return res.status(400).json({ error: 'Invalid 10-digit mobile number' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const db = await getDb();
    const existing = queryOne(db, 'SELECT id FROM users WHERE mobile = ?', [mobile.trim()]);
    if (existing) {
      return res.status(400).json({ error: 'This mobile number is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRes = run(
      db,
      `INSERT INTO users (mobile, email, password_hash, role, language) VALUES (?, ?, ?, 'FARMER', ?)`,
      [mobile.trim(), email ? email.trim() : null, passwordHash, preferredLanguage]
    );

    const latVal = typeof latitude === 'number' ? latitude : null;
    const lonVal = typeof longitude === 'number' ? longitude : null;

    const profileRes = run(
      db,
      `INSERT INTO farmer_profiles (user_id, full_name, mobile, state, district, taluka, village, address, land_area, primary_crop, latitude, longitude, place_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userRes.lastId,
        fullName.trim(),
        mobile.trim(),
        state.trim(),
        district.trim(),
        taluka ? taluka.trim() : '',
        village.trim(),
        address ? address.trim() : null,
        landArea ? parseFloat(landArea) : null,
        primaryCrop ? primaryCrop.trim() : null,
        latVal,
        lonVal,
        placeId || null,
      ]
    );

    const profile = queryOne(db, 'SELECT * FROM farmer_profiles WHERE id = ?', [profileRes.lastId]);

    const payload: AuthUser = {
      userId: userRes.lastId,
      mobile: mobile.trim(),
      role: 'FARMER',
      language: preferredLanguage,
      profileId: profileRes.lastId,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      token,
      user: {
        id: userRes.lastId,
        mobile: mobile.trim(),
        email: email || null,
        role: 'FARMER',
        language: preferredLanguage,
      },
      profile,
    });
  } catch (err: any) {
    console.error('Farmer registration error:', err);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/register/buyer', async (req: Request, res: Response) => {
  try {
    const {
      businessName,
      contactPerson,
      mobile,
      password,
      buyerType,
      state,
      district,
      deliveryLocation,
      email,
      gstin,
      address,
      website,
      paymentTerms,
    } = req.body;

    if (!businessName || !contactPerson || !mobile || !password || !buyerType || !state || !district || !deliveryLocation) {
      return res.status(400).json({ error: 'Please fill all required buyer fields' });
    }

    if (!/^\d{10}$/.test(mobile.trim())) {
      return res.status(400).json({ error: 'Invalid 10-digit mobile number' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const db = await getDb();
    const existing = queryOne(db, 'SELECT id FROM users WHERE mobile = ?', [mobile.trim()]);
    if (existing) {
      return res.status(400).json({ error: 'This mobile number is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRes = run(
      db,
      `INSERT INTO users (mobile, email, password_hash, role, language) VALUES (?, ?, ?, 'BUYER', 'en')`,
      [mobile.trim(), email ? email.trim() : null, passwordHash]
    );

    const profileRes = run(
      db,
      `INSERT INTO buyer_profiles (user_id, business_name, contact_person, mobile, buyer_type, state, district, delivery_location, gstin, address, website, payment_terms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userRes.lastId,
        businessName.trim(),
        contactPerson.trim(),
        mobile.trim(),
        buyerType.trim(),
        state.trim(),
        district.trim(),
        deliveryLocation.trim(),
        gstin ? gstin.trim() : null,
        address ? address.trim() : null,
        website ? website.trim() : null,
        paymentTerms ? paymentTerms.trim() : null,
      ]
    );

    const profile = queryOne(db, 'SELECT * FROM buyer_profiles WHERE id = ?', [profileRes.lastId]);

    const payload: AuthUser = {
      userId: userRes.lastId,
      mobile: mobile.trim(),
      role: 'BUYER',
      language: 'en',
      profileId: profileRes.lastId,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      token,
      user: {
        id: userRes.lastId,
        mobile: mobile.trim(),
        email: email || null,
        role: 'BUYER',
        language: 'en',
      },
      profile,
    });
  } catch (err: any) {
    console.error('Buyer registration error:', err);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const user = queryOne(db, 'SELECT id, mobile, email, role, language, created_at FROM users WHERE id = ?', [req.user!.userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let profile: any = null;
    if (user.role === 'FARMER') {
      profile = queryOne(db, 'SELECT * FROM farmer_profiles WHERE user_id = ?', [user.id]);
    } else if (user.role === 'BUYER') {
      profile = queryOne(db, 'SELECT * FROM buyer_profiles WHERE user_id = ?', [user.id]);
    }

    return res.json({ user, profile });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.put('/api/auth/language', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { language } = req.body;
    if (!['en', 'mr', 'hi'].includes(language)) {
      return res.status(400).json({ error: 'Invalid language' });
    }
    const db = await getDb();
    run(db, 'UPDATE users SET language = ? WHERE id = ?', [language, req.user!.userId]);
    return res.json({ success: true, language });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update language' });
  }
});

app.put('/api/auth/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const userId = req.user!.userId;
    const user = queryOne(db, 'SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.role === 'FARMER') {
      const email = req.body.email;
      const language = req.body.language;
      const fullName = req.body.fullName || req.body.full_name;
      const state = req.body.state;
      const district = req.body.district;
      const taluka = req.body.taluka;
      const village = req.body.village;
      const address = req.body.address;
      const landArea = req.body.landArea || req.body.land_area || req.body.land_area_acres;
      const primaryCrop = req.body.primaryCrop || req.body.primary_crop;
      const latitude = req.body.latitude;
      const longitude = req.body.longitude;
      const placeId = req.body.placeId || req.body.place_id;

      if (email !== undefined) run(db, 'UPDATE users SET email = ? WHERE id = ?', [email ? email.trim() : null, userId]);
      if (language && ['en', 'mr', 'hi'].includes(language)) {
        run(db, 'UPDATE users SET language = ? WHERE id = ?', [language, userId]);
      }

      let latVal = typeof latitude === 'number' && !isNaN(latitude) ? latitude : null;
      let lonVal = typeof longitude === 'number' && !isNaN(longitude) ? longitude : null;
      if (latVal === null && district) {
        const coords = getCoordinatesForLocation(district);
        latVal = coords.lat;
        lonVal = coords.lon;
      }

      run(
        db,
        `UPDATE farmer_profiles
         SET full_name = COALESCE(?, full_name),
             state = COALESCE(?, state),
             district = COALESCE(?, district),
             taluka = COALESCE(?, taluka),
             village = COALESCE(?, village),
             address = COALESCE(?, address),
             land_area = COALESCE(?, land_area),
             primary_crop = COALESCE(?, primary_crop),
             latitude = COALESCE(?, latitude),
             longitude = COALESCE(?, longitude),
             place_id = COALESCE(?, place_id)
         WHERE user_id = ?`,
        [
          fullName ? fullName.trim() : null,
          state ? state.trim() : null,
          district ? district.trim() : null,
          taluka ? taluka.trim() : null,
          village ? village.trim() : null,
          address ? address.trim() : null,
          landArea ? parseFloat(String(landArea)) : null,
          primaryCrop ? primaryCrop.trim() : null,
          latVal,
          lonVal,
          placeId ? String(placeId).trim() : null,
          userId,
        ]
      );

      const profile = queryOne(db, 'SELECT * FROM farmer_profiles WHERE user_id = ?', [userId]);
      const updatedUser = queryOne(db, 'SELECT id, mobile, email, role, language FROM users WHERE id = ?', [userId]);
      return res.json({ success: true, user: updatedUser, profile });
    } else if (user.role === 'BUYER') {
      const email = req.body.email;
      const language = req.body.language;
      const businessName = req.body.businessName || req.body.business_name;
      const contactPerson = req.body.contactPerson || req.body.contact_person;
      const buyerType = req.body.buyerType || req.body.buyer_type;
      const state = req.body.state;
      const district = req.body.district;
      const deliveryLocation = req.body.deliveryLocation || req.body.delivery_location;
      const gstin = req.body.gstin;
      const address = req.body.address;
      const website = req.body.website;
      const paymentTerms = req.body.paymentTerms || req.body.payment_terms;
      const latitude = req.body.latitude;
      const longitude = req.body.longitude;
      const placeId = req.body.placeId || req.body.place_id;

      if (email !== undefined) run(db, 'UPDATE users SET email = ? WHERE id = ?', [email ? email.trim() : null, userId]);
      if (language && ['en', 'mr', 'hi'].includes(language)) {
        run(db, 'UPDATE users SET language = ? WHERE id = ?', [language, userId]);
      }

      let latVal = typeof latitude === 'number' && !isNaN(latitude) ? latitude : null;
      let lonVal = typeof longitude === 'number' && !isNaN(longitude) ? longitude : null;
      if (latVal === null && (deliveryLocation || district)) {
        const coords = getCoordinatesForLocation(deliveryLocation || district);
        latVal = coords.lat;
        lonVal = coords.lon;
      }

      run(
        db,
        `UPDATE buyer_profiles
         SET business_name = COALESCE(?, business_name),
             contact_person = COALESCE(?, contact_person),
             buyer_type = COALESCE(?, buyer_type),
             state = COALESCE(?, state),
             district = COALESCE(?, district),
             delivery_location = COALESCE(?, delivery_location),
             gstin = COALESCE(?, gstin),
             address = COALESCE(?, address),
             website = COALESCE(?, website),
             payment_terms = COALESCE(?, payment_terms),
             latitude = COALESCE(?, latitude),
             longitude = COALESCE(?, longitude),
             place_id = COALESCE(?, place_id)
         WHERE user_id = ?`,
        [
          businessName ? businessName.trim() : null,
          contactPerson ? contactPerson.trim() : null,
          buyerType ? buyerType.trim() : null,
          state ? state.trim() : null,
          district ? district.trim() : null,
          deliveryLocation ? deliveryLocation.trim() : null,
          gstin ? gstin.trim() : null,
          address ? address.trim() : null,
          website ? website.trim() : null,
          paymentTerms ? paymentTerms.trim() : null,
          latVal,
          lonVal,
          placeId ? String(placeId).trim() : null,
          userId,
        ]
      );

      const profile = queryOne(db, 'SELECT * FROM buyer_profiles WHERE user_id = ?', [userId]);
      const updatedUser = queryOne(db, 'SELECT id, mobile, email, role, language FROM users WHERE id = ?', [userId]);
      return res.json({ success: true, user: updatedUser, profile });
    }

    return res.status(400).json({ error: 'Cannot update profile for this role' });
  } catch (err: any) {
    console.error('Profile update error:', err);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Profile endpoints aliases for direct role update calls
app.put('/api/farmer/profile', authenticateToken, requireRole('FARMER'), async (req: Request, res: Response) => {
  const db = await getDb();
  const userId = req.user!.userId;
  const {
    fullName,
    email,
    state,
    district,
    taluka,
    village,
    address,
    landArea,
    primaryCrop,
    language,
    latitude,
    longitude,
    placeId,
  } = req.body;

  if (email !== undefined) run(db, 'UPDATE users SET email = ? WHERE id = ?', [email ? email.trim() : null, userId]);
  if (language && ['en', 'mr', 'hi'].includes(language)) {
    run(db, 'UPDATE users SET language = ? WHERE id = ?', [language, userId]);
  }

  let latVal = typeof latitude === 'number' && !isNaN(latitude) ? latitude : null;
  let lonVal = typeof longitude === 'number' && !isNaN(longitude) ? longitude : null;
  if (latVal === null && district) {
    const coords = getCoordinatesForLocation(district);
    latVal = coords.lat;
    lonVal = coords.lon;
  }

  run(
    db,
    `UPDATE farmer_profiles
     SET full_name = COALESCE(?, full_name),
         state = COALESCE(?, state),
         district = COALESCE(?, district),
         taluka = COALESCE(?, taluka),
         village = COALESCE(?, village),
         address = COALESCE(?, address),
         land_area = COALESCE(?, land_area),
         primary_crop = COALESCE(?, primary_crop),
         latitude = COALESCE(?, latitude),
         longitude = COALESCE(?, longitude),
         place_id = COALESCE(?, place_id)
     WHERE user_id = ?`,
    [
      fullName ? fullName.trim() : null,
      state ? state.trim() : null,
      district ? district.trim() : null,
      taluka ? taluka.trim() : null,
      village ? village.trim() : null,
      address ? address.trim() : null,
      landArea ? parseFloat(landArea) : null,
      primaryCrop ? primaryCrop.trim() : null,
      latVal,
      lonVal,
      placeId ? placeId.trim() : null,
      userId,
    ]
  );
  const profile = queryOne(db, 'SELECT * FROM farmer_profiles WHERE user_id = ?', [userId]);
  const updatedUser = queryOne(db, 'SELECT id, mobile, email, role, language FROM users WHERE id = ?', [userId]);
  return res.json({ success: true, user: updatedUser, profile });
});

app.put('/api/buyer/profile', authenticateToken, requireRole('BUYER'), async (req: Request, res: Response) => {
  const db = await getDb();
  const userId = req.user!.userId;
  const {
    businessName,
    contactPerson,
    email,
    buyerType,
    state,
    district,
    deliveryLocation,
    gstin,
    address,
    website,
    paymentTerms,
    language,
    latitude,
    longitude,
    placeId,
  } = req.body;

  if (email !== undefined) run(db, 'UPDATE users SET email = ? WHERE id = ?', [email ? email.trim() : null, userId]);
  if (language && ['en', 'mr', 'hi'].includes(language)) {
    run(db, 'UPDATE users SET language = ? WHERE id = ?', [language, userId]);
  }

  let latVal = typeof latitude === 'number' && !isNaN(latitude) ? latitude : null;
  let lonVal = typeof longitude === 'number' && !isNaN(longitude) ? longitude : null;
  if (latVal === null && (deliveryLocation || district)) {
    const coords = getCoordinatesForLocation(deliveryLocation || district);
    latVal = coords.lat;
    lonVal = coords.lon;
  }

  run(
    db,
    `UPDATE buyer_profiles
     SET business_name = COALESCE(?, business_name),
         contact_person = COALESCE(?, contact_person),
         buyer_type = COALESCE(?, buyer_type),
         state = COALESCE(?, state),
         district = COALESCE(?, district),
         delivery_location = COALESCE(?, delivery_location),
         gstin = COALESCE(?, gstin),
         address = COALESCE(?, address),
         website = COALESCE(?, website),
         payment_terms = COALESCE(?, payment_terms),
         latitude = COALESCE(?, latitude),
         longitude = COALESCE(?, longitude),
         place_id = COALESCE(?, place_id)
     WHERE user_id = ?`,
    [
      businessName ? businessName.trim() : null,
      contactPerson ? contactPerson.trim() : null,
      buyerType ? buyerType.trim() : null,
      state ? state.trim() : null,
      district ? district.trim() : null,
      deliveryLocation ? deliveryLocation.trim() : null,
      gstin ? gstin.trim() : null,
      address ? address.trim() : null,
      website ? website.trim() : null,
      paymentTerms ? paymentTerms.trim() : null,
      latVal,
      lonVal,
      placeId ? placeId.trim() : null,
      userId,
    ]
  );
  const profile = queryOne(db, 'SELECT * FROM buyer_profiles WHERE user_id = ?', [userId]);
  const updatedUser = queryOne(db, 'SELECT id, mobile, email, role, language FROM users WHERE id = ?', [userId]);
  return res.json({ success: true, user: updatedUser, profile });
});

// ----------------------------------------------------
// 1. CROP PRICE & NEARBY MARKET INFORMATION
// ----------------------------------------------------

app.get('/api/crops', async (_req: Request, res: Response) => {
  const db = await getDb();
  const crops = queryAll(db, 'SELECT * FROM crops ORDER BY id ASC');
  return res.json(crops);
});

app.get('/api/markets', async (req: Request, res: Response) => {
  const db = await getDb();
  const { district, lat, lon } = req.query;
  let markets = queryAll(db, 'SELECT * FROM markets ORDER BY id ASC');

  let uLat: number | null = null;
  let uLon: number | null = null;

  if (lat && lon && !isNaN(parseFloat(lat as string)) && !isNaN(parseFloat(lon as string))) {
    uLat = parseFloat(lat as string);
    uLon = parseFloat(lon as string);
  } else if (district) {
    const coords = getCoordinatesForLocation(district as string);
    uLat = coords.lat;
    uLon = coords.lon;
  }

  if (uLat !== null && uLon !== null) {
    markets = markets.map((m: any) => {
      const mLat = m.latitude || getCoordinatesForLocation(m.name || m.district).lat;
      const mLon = m.longitude || getCoordinatesForLocation(m.name || m.district).lon;
      const computedDist = calculateHaversineKm(uLat!, uLon!, mLat, mLon);
      return { ...m, distance_km: computedDist };
    }).sort((a: any, b: any) => a.distance_km - b.distance_km);
  }
  return res.json(markets);
});

app.get('/api/market-prices', async (req: Request, res: Response) => {
  const { crop_id, history, lat, lon, district, radius } = req.query;
  const db = await getDb();

  let sql = `
    SELECT mp.*, m.name as market_name, m.district, m.taluka, m.distance_km, m.latitude as market_lat, m.longitude as market_lon,
           c.name_en as crop_name_en, c.name_mr as crop_name_mr, c.name_hi as crop_name_hi, c.category
    FROM market_prices mp
    JOIN markets m ON mp.market_id = m.id
    JOIN crops c ON mp.crop_id = c.id
  `;
  const params: any[] = [];
  const whereClauses: string[] = [];

  if (crop_id) {
    whereClauses.push('mp.crop_id = ?');
    params.push(Number(crop_id));
  }

  if (history !== 'true') {
    // Only return the latest date recorded for each (market, crop)
    whereClauses.push(`mp.price_date = (
      SELECT MAX(sub.price_date) FROM market_prices sub 
      WHERE sub.market_id = mp.market_id AND sub.crop_id = mp.crop_id
    )`);
  }

  if (whereClauses.length > 0) {
    sql += ' WHERE ' + whereClauses.join(' AND ');
  }

  let prices = queryAll(db, sql, params);

  // Determine user coordinates
  let uLat: number | null = null;
  let uLon: number | null = null;
  if (lat && lon && !isNaN(parseFloat(lat as string)) && !isNaN(parseFloat(lon as string))) {
    uLat = parseFloat(lat as string);
    uLon = parseFloat(lon as string);
  } else if (district) {
    const c = getCoordinatesForLocation(district as string);
    uLat = c.lat;
    uLon = c.lon;
  }

  if (uLat !== null && uLon !== null) {
    prices = prices.map((p: any) => {
      const mLat = p.market_lat || getCoordinatesForLocation(p.market_name || p.district).lat;
      const mLon = p.market_lon || getCoordinatesForLocation(p.market_name || p.district).lon;
      const dist = calculateHaversineKm(uLat!, uLon!, mLat, mLon);
      return { ...p, distance_km: dist };
    });

    const maxRadius = radius ? parseFloat(radius as string) : undefined;
    if (maxRadius && maxRadius > 0) {
      const inRadius = prices.filter((p: any) => p.distance_km <= maxRadius);
      if (inRadius.length > 0) {
        prices = inRadius;
      }
    }

    prices.sort((a: any, b: any) => a.distance_km - b.distance_km);
  } else {
    prices.sort((a: any, b: any) => (a.distance_km || 0) - (b.distance_km || 0));
  }

  return res.json(prices);
});

// ----------------------------------------------------
// 2. NET REALISATION & MARKET RECOMMENDATION
// ----------------------------------------------------

app.post('/api/net-realisation/calculate', async (req: Request, res: Response) => {
  try {
    const { crop_id, quantity_qtl, is_fpo_pooled, district, lat, lon } = req.body;
    if (!crop_id || !quantity_qtl) {
      return res.status(400).json({ error: 'Crop ID and Quantity are required' });
    }

    const db = await getDb();
    const crop = queryOne(db, 'SELECT * FROM crops WHERE id = ?', [Number(crop_id)]);
    if (!crop) return res.status(404).json({ error: 'Crop not found' });

    let marketsWithPrices = queryAll(
      db,
      `SELECT m.id, m.name, m.district, m.distance_km, m.latitude, m.longitude, mp.modal_price,
              m.market_cess_percent, m.commission_percent, m.unloading_rate_per_qtl, m.transport_rate_per_km_ton
       FROM markets m
       JOIN market_prices mp ON m.id = mp.market_id
       WHERE mp.crop_id = ?
         AND mp.price_date = (
           SELECT MAX(sub.price_date) FROM market_prices sub 
           WHERE sub.market_id = m.id AND sub.crop_id = ?
         )
       ORDER BY m.id ASC`,
      [Number(crop_id), Number(crop_id)]
    );

    // Compute dynamic geographic distance if user location is provided
    let uLat: number | null = null;
    let uLon: number | null = null;
    if (lat && lon && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lon))) {
      uLat = parseFloat(lat);
      uLon = parseFloat(lon);
    } else if (district) {
      const uCoord = getCoordinatesForLocation(district);
      uLat = uCoord.lat;
      uLon = uCoord.lon;
    }

    if (uLat !== null && uLon !== null) {
      marketsWithPrices = marketsWithPrices.map((m: any) => {
        const mLat = m.latitude || getCoordinatesForLocation(m.name || m.district).lat;
        const mLon = m.longitude || getCoordinatesForLocation(m.name || m.district).lon;
        return { ...m, distance_km: calculateHaversineKm(uLat!, uLon!, mLat, mLon) };
      }).sort((a: any, b: any) => a.distance_km - b.distance_km);
    }

    const results = computeNetRealisation(
      crop,
      marketsWithPrices,
      Number(quantity_qtl),
      Boolean(is_fpo_pooled),
      28.0
    );

    const topRanking = results[0];
    const explainable = topRanking
      ? computeUnifiedNetRealisation({
          cropNameEn: crop.name_en,
          cropNameMr: crop.name_mr,
          cropNameHi: crop.name_hi,
          marketName: topRanking.marketName,
          quantityQtl: Number(quantity_qtl),
          quotedPricePerQtl: topRanking.grossPricePerQtl,
          distanceKm: topRanking.distanceKm,
          shelfLifeDays: crop.shelf_life_days || 7,
          isFpoPooled: Boolean(is_fpo_pooled),
          fpoDiscountPercent: 28.0,
        })
      : undefined;

    return res.json({
      crop,
      quantityQtl: Number(quantity_qtl),
      isFpoPooled: Boolean(is_fpo_pooled),
      rankings: results,
      explainable,
    });
  } catch (err: any) {
    console.error('Net calculation error:', err);
    return res.status(500).json({ error: 'Failed to calculate net realisation' });
  }
});

// Reusable calculation engine endpoint for any produce / custom parameter input
app.post('/api/engine/net-realisation', async (req: Request, res: Response) => {
  try {
    const {
      crop_id,
      quantity_qtl,
      quoted_price_per_qtl,
      distance_km,
      is_fpo_pooled,
      transport_rate_per_km_ton,
      commission_percent,
      market_cess_percent,
      unloading_rate_per_qtl,
      packaging_cost_per_qtl,
      quality_deduction_per_qtl,
    } = req.body;

    const db = await getDb();
    let crop = null;
    if (crop_id) {
      crop = queryOne(db, 'SELECT * FROM crops WHERE id = ?', [Number(crop_id)]);
    }

    const calc = computeUnifiedNetRealisation({
      cropId: crop?.id,
      cropNameEn: crop?.name_en,
      shelfLifeDays: crop ? crop.shelf_life_days : 7,
      transportLossPercentPer100km: crop ? crop.transport_loss_percent_per_100km : 1.2,
      quantityQtl: Number(quantity_qtl) || 1,
      quotedPricePerQtl: Number(quoted_price_per_qtl) || 2000,
      distanceKm: Number(distance_km) || 30,
      isFpoPooled: Boolean(is_fpo_pooled),
      transportRatePerKmTon: transport_rate_per_km_ton ? Number(transport_rate_per_km_ton) : undefined,
      commissionPercent: commission_percent ? Number(commission_percent) : undefined,
      marketCessPercent: market_cess_percent ? Number(market_cess_percent) : undefined,
      unloadingRatePerQtl: unloading_rate_per_qtl ? Number(unloading_rate_per_qtl) : undefined,
      packagingCostPerQtl: packaging_cost_per_qtl ? Number(packaging_cost_per_qtl) : undefined,
      qualityDeductionPerQtl: quality_deduction_per_qtl ? Number(quality_deduction_per_qtl) : undefined,
    });

    return res.json(calc);
  } catch (err: any) {
    console.error('Unified net calculation error:', err);
    return res.status(500).json({ error: 'Failed to calculate unified net realisation' });
  }
});

// ----------------------------------------------------
// 3. FPO FARMER AGGREGATION
// ----------------------------------------------------

app.get('/api/fpo/lots', async (_req: Request, res: Response) => {
  const db = await getDb();
  const lots = queryAll(
    db,
    `SELECT fl.*, c.name_en as crop_name_en, c.name_mr as crop_name_mr, c.name_hi as crop_name_hi,
            COUNT(flc.id) as contributor_count
     FROM fpo_lots fl
     JOIN crops c ON fl.crop_id = c.id
     LEFT JOIN fpo_lot_contributions flc ON fl.id = flc.lot_id
     GROUP BY fl.id
     ORDER BY fl.created_at DESC`
  );
  return res.json(lots);
});

app.post('/api/fpo/lots', authenticateToken, requireRole('FARMER'), async (req: Request, res: Response) => {
  try {
    const { name, crop_id, target_quantity_qtl, collection_center } = req.body;
    if (!name || !crop_id || !target_quantity_qtl || !collection_center) {
      return res.status(400).json({ error: 'All lot fields are required' });
    }

    const db = await getDb();
    const result = run(
      db,
      `INSERT INTO fpo_lots (name, crop_id, target_quantity_qtl, current_quantity_qtl, collection_center, status)
       VALUES (?, ?, ?, 0, ?, 'OPEN')`,
      [name.trim(), Number(crop_id), parseFloat(target_quantity_qtl), collection_center.trim()]
    );

    const newLot = queryOne(db, 'SELECT * FROM fpo_lots WHERE id = ?', [result.lastId]);
    return res.status(201).json(newLot);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create FPO lot' });
  }
});

app.post('/api/fpo/lots/:id/contribute', authenticateToken, requireRole('FARMER'), async (req: Request, res: Response) => {
  try {
    const lotId = Number(req.params.id);
    const { produce_id, quantity_qtl } = req.body;

    if (!produce_id || !quantity_qtl || Number(quantity_qtl) <= 0) {
      return res.status(400).json({ error: 'Valid produce and quantity required' });
    }

    const db = await getDb();
    const produce = queryOne(db, 'SELECT * FROM farmer_produce WHERE id = ? AND farmer_id = ?', [
      Number(produce_id),
      req.user!.profileId,
    ]);

    if (!produce) {
      return res.status(404).json({ error: 'Produce not found or does not belong to you' });
    }

    if (produce.quantity_qtl < Number(quantity_qtl)) {
      return res.status(400).json({ error: 'Contributed quantity exceeds available produce lot volume' });
    }

    const lot = queryOne(db, 'SELECT * FROM fpo_lots WHERE id = ?', [lotId]);
    if (!lot) return res.status(404).json({ error: 'FPO Lot not found' });
    if (lot.crop_id !== produce.crop_id) {
      return res.status(400).json({ error: 'Produce crop does not match FPO Lot crop' });
    }

    // Insert contribution
    run(
      db,
      `INSERT INTO fpo_lot_contributions (lot_id, farmer_id, produce_id, quantity_qtl, status)
       VALUES (?, ?, ?, ?, 'COMMITTED')`,
      [lotId, req.user!.profileId, Number(produce_id), Number(quantity_qtl)]
    );

    // Update lot current quantity
    const newLotQty = lot.current_quantity_qtl + Number(quantity_qtl);
    const newStatus = newLotQty >= lot.target_quantity_qtl ? 'READY_FOR_SALE' : 'AGGREGATING';
    run(db, 'UPDATE fpo_lots SET current_quantity_qtl = ?, status = ? WHERE id = ?', [newLotQty, newStatus, lotId]);

    // Update produce status
    run(db, 'UPDATE farmer_produce SET status = ? WHERE id = ?', ['IN_FPO_LOT', Number(produce_id)]);

    return res.json({ success: true, newLotQty, status: newStatus });
  } catch (err: any) {
    console.error('FPO contribution error:', err);
    return res.status(500).json({ error: 'Failed to contribute to FPO lot' });
  }
});

app.get('/api/fpo/lots/:id/members', async (req: Request, res: Response) => {
  const db = await getDb();
  const members = queryAll(
    db,
    `SELECT flc.*, fp.full_name as farmer_name, fp.village, fp.mobile
     FROM fpo_lot_contributions flc
     JOIN farmer_profiles fp ON flc.farmer_id = fp.id
     WHERE flc.lot_id = ?
     ORDER BY flc.contribution_date DESC`,
    [Number(req.params.id)]
  );
  return res.json(members);
});

// ----------------------------------------------------
// 4. WEATHER & OPEN-METEO INTEGRATION
// ----------------------------------------------------

app.get('/api/weather', async (req: Request, res: Response) => {
  try {
    const district = (req.query.district as string) || 'Maharashtra';
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lon = req.query.lon ? parseFloat(req.query.lon as string) : undefined;
    const weather = await getLiveOrCachedWeather(district, lat, lon);
    return res.json(weather);
  } catch (err: any) {
    console.error('Weather API error:', err);
    return res.status(500).json({ error: 'Failed to retrieve weather data' });
  }
});

// ----------------------------------------------------
// 4B. EXPLAINABLE ML COMMODITY PRICE PREDICTION PIPELINE
// ----------------------------------------------------

app.get('/api/price-prediction/:cropId', async (req: Request, res: Response) => {
  try {
    const cropId = Number(req.params.cropId);
    const db = await getDb();
    const crop = queryOne(db, 'SELECT * FROM crops WHERE id = ?', [cropId]);
    if (!crop) return res.status(404).json({ error: 'Crop not found' });

    const history = queryAll(
      db,
      `SELECT price_date, min_price, max_price, modal_price, arrivals_qtl 
       FROM market_prices 
       WHERE crop_id = ? 
       ORDER BY price_date ASC`,
      [cropId]
    );

    const forceRetrain = req.query.force === 'true';
    const mlResult = runPricePredictionPipeline(cropId, crop.name_en, history, forceRetrain);
    return res.json(mlResult);
  } catch (err: any) {
    console.error('Price prediction error:', err);
    return res.status(500).json({ error: 'Failed to run price prediction pipeline' });
  }
});

// ----------------------------------------------------
// 4C. EXPLAINABLE SELL OR WAIT RECOMMENDATION ENGINE
// ----------------------------------------------------

app.get('/api/sell-or-wait/evaluate', async (req: Request, res: Response) => {
  try {
    const { crop_id, district } = req.query;
    if (!crop_id) return res.status(400).json({ error: 'Crop ID required' });

    const db = await getDb();
    const crop = queryOne(db, 'SELECT * FROM crops WHERE id = ?', [Number(crop_id)]);
    if (!crop) return res.status(404).json({ error: 'Crop not found' });

    // Grab latest modal price & trend from dataset
    const latestPrice = queryOne(
      db,
      'SELECT modal_price, trend, price_date, data_source, last_updated, is_live FROM market_prices WHERE crop_id = ? ORDER BY price_date DESC, modal_price DESC LIMIT 1',
      [Number(crop_id)]
    );

    // Dynamic Weather integration from Open-Meteo
    const latNum = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lonNum = req.query.lon ? parseFloat(req.query.lon as string) : undefined;
    let targetDistrict = (district as string) || (req.query.district as string);
    if (!targetDistrict && req.user) {
      const p = queryOne(db, 'SELECT district FROM farmer_profiles WHERE user_id = ?', [req.user.userId]);
      if (p && p.district) targetDistrict = p.district;
    }
    const weather = await getLiveOrCachedWeather(targetDistrict || 'pune', latNum, lonNum);

    const currentPrice = latestPrice ? latestPrice.modal_price : 2000;
    const trend = latestPrice ? (latestPrice.trend as 'UP' | 'DOWN' | 'STABLE') : 'STABLE';

    // ML Price Prediction Pipeline
    const history = queryAll(
      db,
      `SELECT price_date, min_price, max_price, modal_price, arrivals_qtl 
       FROM market_prices 
       WHERE crop_id = ? 
       ORDER BY price_date ASC`,
      [Number(crop_id)]
    );
    const mlPipelineResult = runPricePredictionPipeline(Number(crop_id), crop.name_en, history);

    // Compute Explainable Recommendation
    const explainable = computeExplainableSellOrWait({
      crop,
      currentModalPrice: currentPrice,
      currentTrend: trend,
      weather,
      mlForecast: mlPipelineResult.forecast,
    });

    return res.json({
      crop,
      currentPrice,
      trend,
      weather,
      mlPipeline: mlPipelineResult,
      recommendation: explainable.data,
      explainable,
    });
  } catch (err: any) {
    console.error('Sell/wait evaluate error:', err);
    return res.status(500).json({ error: 'Failed to evaluate sell or wait' });
  }
});

// ----------------------------------------------------
// 5. DIRECT BUYER MATCHING & COMPETITIVE BIDDING
// ----------------------------------------------------

// Farmer produce CRUD
app.get('/api/farmer/produce', authenticateToken, async (req: Request, res: Response) => {
  const db = await getDb();
  if (req.user!.role === 'FARMER' && req.query.all !== 'true') {
    const produce = queryAll(
      db,
      `SELECT fp.*, c.name_en as crop_name_en, c.name_mr as crop_name_mr, c.name_hi as crop_name_hi, c.category, c.shelf_life_days
       FROM farmer_produce fp
       JOIN crops c ON fp.crop_id = c.id
       WHERE fp.farmer_id = ?
       ORDER BY fp.created_at DESC`,
      [req.user!.profileId]
    );
    return res.json(produce);
  }

  // Buyer, Admin, or Farmer with all=true: return all available farmer produce
  const produce = queryAll(
    db,
    `SELECT fp.*, c.name_en as crop_name_en, c.name_mr as crop_name_mr, c.name_hi as crop_name_hi, c.category, c.shelf_life_days,
            f.full_name as farmer_name, f.mobile as farmer_mobile, f.district
     FROM farmer_produce fp
     JOIN crops c ON fp.crop_id = c.id
     JOIN farmer_profiles f ON fp.farmer_id = f.id
     WHERE fp.status IN ('AVAILABLE', 'MATCHED')
     ORDER BY fp.created_at DESC`
  );
  return res.json(produce);
});

app.post('/api/farmer/produce', authenticateToken, requireRole('FARMER'), async (req: Request, res: Response) => {
  try {
    const { crop_id, variety, quantity_qtl, harvest_date, quality_grade, expected_price_per_qtl, village } = req.body;
    if (!crop_id || !variety || !quantity_qtl || !harvest_date || !expected_price_per_qtl || !village) {
      return res.status(400).json({ error: 'Please provide all required produce details' });
    }

    const db = await getDb();
    const result = run(
      db,
      `INSERT INTO farmer_produce (farmer_id, crop_id, variety, quantity_qtl, harvest_date, quality_grade, expected_price_per_qtl, village, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'AVAILABLE')`,
      [
        req.user!.profileId,
        Number(crop_id),
        variety.trim(),
        parseFloat(quantity_qtl),
        harvest_date,
        quality_grade || 'Grade A',
        parseFloat(expected_price_per_qtl),
        village.trim(),
      ]
    );

    const newProduce = queryOne(db, 'SELECT * FROM farmer_produce WHERE id = ?', [result.lastId]);
    return res.status(201).json(newProduce);
  } catch (err: any) {
    console.error('Create produce error:', err);
    return res.status(500).json({ error: 'Failed to record produce' });
  }
});

app.delete('/api/farmer/produce/:id', authenticateToken, requireRole('FARMER'), async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    run(db, 'DELETE FROM farmer_produce WHERE id = ? AND farmer_id = ?', [Number(req.params.id), req.user!.profileId]);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to delete produce' });
  }
});

// Buyer Requirements API
app.get('/api/buyer/requirements', authenticateToken, async (req: Request, res: Response) => {
  const db = await getDb();
  const { my_requirements, crop_id, status } = req.query;

  let sql = `
    SELECT br.*, c.name_en as crop_name_en, c.name_mr as crop_name_mr, c.name_hi as crop_name_hi, c.category,
           bp.business_name, bp.buyer_type, bp.contact_person, bp.mobile, bp.district as buyer_district,
           COUNT(bb.id) as bids_count
    FROM buyer_requirements br
    JOIN crops c ON br.crop_id = c.id
    JOIN buyer_profiles bp ON br.buyer_id = bp.id
    LEFT JOIN buyer_bids bb ON br.id = bb.requirement_id
  `;
  const conditions: string[] = [];
  const params: any[] = [];

  if (my_requirements === 'true' && req.user!.role === 'BUYER') {
    conditions.push('br.buyer_id = ?');
    params.push(req.user!.profileId);
  } else if (status) {
    conditions.push('br.status = ?');
    params.push(String(status));
  } else if (req.user!.role === 'FARMER') {
    conditions.push("br.status IN ('OPEN', 'MATCHED')");
  }

  if (crop_id) {
    conditions.push('br.crop_id = ?');
    params.push(Number(crop_id));
  }

  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' GROUP BY br.id ORDER BY br.created_at DESC';

  const requirements = queryAll(db, sql, params);
  return res.json(requirements);
});

app.get('/api/buyer/requirements/:id', authenticateToken, async (req: Request, res: Response) => {
  const db = await getDb();
  const reqItem = queryOne(
    db,
    `SELECT br.*, c.name_en as crop_name_en, c.name_mr as crop_name_mr, c.name_hi as crop_name_hi,
            bp.business_name, bp.buyer_type, bp.contact_person, bp.mobile, bp.delivery_location as buyer_location
     FROM buyer_requirements br
     JOIN crops c ON br.crop_id = c.id
     JOIN buyer_profiles bp ON br.buyer_id = bp.id
     WHERE br.id = ?`,
    [Number(req.params.id)]
  );
  if (!reqItem) return res.status(404).json({ error: 'Requirement not found' });
  return res.json(reqItem);
});

app.post('/api/buyer/requirements', authenticateToken, requireRole('BUYER'), async (req: Request, res: Response) => {
  try {
    const {
      crop_id,
      min_quantity_qtl,
      max_price_per_qtl,
      delivery_location,
      delivery_date,
      quality_grade,
      payment_terms,
      buyer_type,
      variety,
      packaging_preference,
      additional_notes,
      pickup_delivery_preference,
    } = req.body;

    if (!crop_id || !min_quantity_qtl || !max_price_per_qtl || !delivery_location || !delivery_date) {
      return res.status(400).json({
        error: 'Crop, Quantity, Max Price, Delivery Location, and Delivery Date are required fields.',
      });
    }

    if (parseFloat(min_quantity_qtl) <= 0 || parseFloat(max_price_per_qtl) <= 0) {
      return res.status(400).json({ error: 'Quantity and Max Price must be positive values.' });
    }

    const db = await getDb();
    const result = run(
      db,
      `INSERT INTO buyer_requirements (
        buyer_id, crop_id, variety, min_quantity_qtl, quality_grade, max_price_per_qtl,
        delivery_location, delivery_date, payment_terms, buyer_type,
        packaging_preference, additional_notes, pickup_delivery_preference, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN')`,
      [
        req.user!.profileId,
        Number(crop_id),
        variety ? variety.trim() : null,
        parseFloat(min_quantity_qtl),
        quality_grade || 'Grade A',
        parseFloat(max_price_per_qtl),
        delivery_location.trim(),
        delivery_date,
        payment_terms || 'Immediate on Quality Verification',
        buyer_type || 'Wholesaler',
        packaging_preference || 'Standard Crates/Bags',
        additional_notes ? additional_notes.trim() : null,
        pickup_delivery_preference || 'BUYER_PICKUP',
      ]
    );

    const crop = queryOne(db, 'SELECT * FROM crops WHERE id = ?', [Number(crop_id)]);
    const buyer = queryOne(db, 'SELECT * FROM buyer_profiles WHERE id = ?', [req.user!.profileId]);

    // Notify registered farmers with this crop or available lots
    const farmersWithCrop = queryAll(
      db,
      `SELECT DISTINCT u.id as user_id
       FROM farmer_profiles fp
       JOIN users u ON fp.user_id = u.id
       LEFT JOIN farmer_produce prod ON fp.id = prod.farmer_id
       WHERE prod.crop_id = ? OR fp.primary_crop LIKE ?`,
      [Number(crop_id), `%${crop ? crop.name_en : ''}%`]
    );

    for (const f of farmersWithCrop) {
      run(
        db,
        `INSERT INTO notifications (user_id, title_en, title_mr, title_hi, message_en, message_mr, message_hi, type)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'OPPORTUNITY')`,
        [
          f.user_id,
          `New Buyer Requirement for ${crop ? crop.name_en : 'Produce'}!`,
          `${crop ? crop.name_mr : 'पीक'} साठी नवीन खरेदी मागणी!`,
          `${crop ? crop.name_hi : 'फसल'} के लिए नई खरीद मांग!`,
          `${buyer?.business_name || 'Verified Buyer'} is seeking ${min_quantity_qtl} Qtl at up to ₹${max_price_per_qtl}/Qtl. Check matching score and submit offer!`,
          `${buyer?.business_name || 'प्रमाणित खरेदीदार'} यांना ₹${max_price_per_qtl}/क्विंटल दराने ${min_quantity_qtl} क्विंटल शेतमाल हवा आहे. जुळणी तपासा!`,
          `${buyer?.business_name || 'प्रमाणित खरीदार'} को ₹${max_price_per_qtl}/क्विंटल तक ${min_quantity_qtl} क्विंटल चाहिए। मैचिंग देखें!`,
        ]
      );
    }

    const newReq = queryOne(db, 'SELECT * FROM buyer_requirements WHERE id = ?', [result.lastId]);
    return res.status(201).json(newReq);
  } catch (err: any) {
    console.error('Create requirement error:', err);
    return res.status(500).json({ error: 'Failed to post requirement' });
  }
});

// ----------------------------------------------------
// TRANSPARENT MATCHING ENGINE ENDPOINTS
// ----------------------------------------------------

// Match available farmer produce & FPO lots for a specific buyer requirement
app.get('/api/matching/produce-for-requirement/:id', authenticateToken, async (req: Request, res: Response) => {
  const db = await getDb();
  const reqItem = queryOne(
    db,
    `SELECT br.*, c.name_en as crop_name_en, c.name_mr as crop_name_mr, c.name_hi as crop_name_hi
     FROM buyer_requirements br
     JOIN crops c ON br.crop_id = c.id
     WHERE br.id = ?`,
    [Number(req.params.id)]
  );

  if (!reqItem) return res.status(404).json({ error: 'Requirement not found' });

  // Get available farmer produce of this crop
  const produceList = queryAll(
    db,
    `SELECT fp.*, c.name_en as crop_name_en, c.name_mr as crop_name_mr, c.name_hi as crop_name_hi,
            farmer.full_name as farmer_name, farmer.mobile as farmer_mobile, farmer.district, farmer.taluka
     FROM farmer_produce fp
     JOIN crops c ON fp.crop_id = c.id
     JOIN farmer_profiles farmer ON fp.farmer_id = farmer.id
     WHERE fp.status = 'AVAILABLE' AND fp.crop_id = ?
     ORDER BY fp.created_at DESC`,
    [reqItem.crop_id]
  );

  // Get available FPO lots of this crop
  const fpoLots = queryAll(
    db,
    `SELECT fl.*, c.name_en as crop_name_en, c.name_mr as crop_name_mr, c.name_hi as crop_name_hi
     FROM fpo_lots fl
     JOIN crops c ON fl.crop_id = c.id
     WHERE fl.status IN ('OPEN', 'AGGREGATING') AND fl.crop_id = ?
     ORDER BY fl.created_at DESC`,
    [reqItem.crop_id]
  );

  const customWeights = {
    cropWeight: req.query.w_crop ? Number(req.query.w_crop) : 25,
    quantityWeight: req.query.w_qty ? Number(req.query.w_qty) : 20,
    qualityWeight: req.query.w_quality ? Number(req.query.w_quality) : 15,
    priceWeight: req.query.w_price ? Number(req.query.w_price) : 15,
    locationWeight: req.query.w_location ? Number(req.query.w_location) : 15,
    deliveryDateWeight: req.query.w_date ? Number(req.query.w_date) : 10,
  };

  const matches: any[] = [];

  for (const p of produceList) {
    const matchAnalysis = computeProduceMatch(reqItem, {
      id: p.id,
      type: 'PRODUCE',
      crop_id: p.crop_id,
      crop_name_en: p.crop_name_en,
      quantity_qtl: p.quantity_qtl,
      quality_grade: p.quality_grade,
      expected_price_per_qtl: p.expected_price_per_qtl,
      village: p.village,
      harvest_date: p.harvest_date,
    }, customWeights);

    matches.push({
      itemType: 'PRODUCE',
      produce: p,
      matchScore: matchAnalysis.score,
      isEligible: matchAnalysis.isEligible,
      weightsUsed: matchAnalysis.weightsUsed,
      reasons: matchAnalysis.reasons,
      summaryEn: matchAnalysis.summaryEn,
      summaryMr: matchAnalysis.summaryMr,
      summaryHi: matchAnalysis.summaryHi,
      explainable: matchAnalysis.explainable,
    });
  }

  for (const lot of fpoLots) {
    const matchAnalysis = computeProduceMatch(reqItem, {
      id: lot.id,
      type: 'FPO_LOT',
      crop_id: lot.crop_id,
      crop_name_en: lot.crop_name_en,
      quantity_qtl: lot.current_quantity_qtl,
      quality_grade: 'Grade A',
      expected_price_per_qtl: reqItem.max_price_per_qtl * 0.96, // cooperative aggregated wholesale price
      village: lot.collection_center,
    }, customWeights);

    matches.push({
      itemType: 'FPO_LOT',
      lot,
      matchScore: matchAnalysis.score,
      isEligible: matchAnalysis.isEligible,
      weightsUsed: matchAnalysis.weightsUsed,
      reasons: matchAnalysis.reasons,
      summaryEn: matchAnalysis.summaryEn,
      summaryMr: matchAnalysis.summaryMr,
      summaryHi: matchAnalysis.summaryHi,
      explainable: matchAnalysis.explainable,
    });
  }

  // Sort matches by match score descending
  matches.sort((a, b) => b.matchScore - a.matchScore);

  return res.json({
    requirement: reqItem,
    totalMatches: matches.length,
    weightsUsed: customWeights,
    matches,
  });
});

// Match open buyer requirements for a specific farmer produce
app.get('/api/matching/requirements-for-produce/:produce_id', authenticateToken, async (req: Request, res: Response) => {
  const db = await getDb();
  const produce = queryOne(
    db,
    `SELECT fp.*, c.name_en as crop_name_en, c.name_mr as crop_name_mr, c.name_hi as crop_name_hi,
            farmer.full_name as farmer_name
     FROM farmer_produce fp
     JOIN crops c ON fp.crop_id = c.id
     JOIN farmer_profiles farmer ON fp.farmer_id = farmer.id
     WHERE fp.id = ?`,
    [Number(req.params.produce_id)]
  );

  if (!produce) return res.status(404).json({ error: 'Produce lot not found' });

  const customWeights = {
    cropWeight: req.query.w_crop ? Number(req.query.w_crop) : 25,
    quantityWeight: req.query.w_qty ? Number(req.query.w_qty) : 20,
    qualityWeight: req.query.w_quality ? Number(req.query.w_quality) : 15,
    priceWeight: req.query.w_price ? Number(req.query.w_price) : 15,
    locationWeight: req.query.w_location ? Number(req.query.w_location) : 15,
    deliveryDateWeight: req.query.w_date ? Number(req.query.w_date) : 10,
  };

  const openReqs = queryAll(
    db,
    `SELECT br.*, c.name_en as crop_name_en, c.name_mr as crop_name_mr, c.name_hi as crop_name_hi,
            bp.business_name, bp.buyer_type, bp.contact_person, bp.mobile
     FROM buyer_requirements br
     JOIN crops c ON br.crop_id = c.id
     JOIN buyer_profiles bp ON br.buyer_id = bp.id
     WHERE br.status = 'OPEN' AND br.crop_id = ?
     ORDER BY br.created_at DESC`,
    [produce.crop_id]
  );

  const matches = openReqs.map((reqItem) => {
    const matchAnalysis = computeProduceMatch(reqItem, {
      id: produce.id,
      type: 'PRODUCE',
      crop_id: produce.crop_id,
      crop_name_en: produce.crop_name_en,
      quantity_qtl: produce.quantity_qtl,
      quality_grade: produce.quality_grade,
      expected_price_per_qtl: produce.expected_price_per_qtl,
      village: produce.village,
      harvest_date: produce.harvest_date,
    }, customWeights);

    return {
      requirement: reqItem,
      matchScore: matchAnalysis.score,
      isEligible: matchAnalysis.isEligible,
      weightsUsed: matchAnalysis.weightsUsed,
      reasons: matchAnalysis.reasons,
      summaryEn: matchAnalysis.summaryEn,
      summaryMr: matchAnalysis.summaryMr,
      summaryHi: matchAnalysis.summaryHi,
      explainable: matchAnalysis.explainable,
    };
  });

  matches.sort((a, b) => b.matchScore - a.matchScore);

  return res.json({
    produce,
    totalMatches: matches.length,
    weightsUsed: customWeights,
    matches,
  });
});

// Alias for matching produce for requirement
app.get('/api/matching/buyer-requirements/:id', authenticateToken, async (req: Request, res: Response) => {
  const db = await getDb();
  const reqItem = queryOne(
    db,
    `SELECT br.*, c.name_en as crop_name_en, c.name_mr as crop_name_mr, c.name_hi as crop_name_hi
     FROM buyer_requirements br
     JOIN crops c ON br.crop_id = c.id
     WHERE br.id = ?`,
    [Number(req.params.id)]
  );

  if (!reqItem) return res.status(404).json({ error: 'Requirement not found' });

  const produceList = queryAll(
    db,
    `SELECT fp.*, c.name_en as crop_name_en, c.name_mr as crop_name_mr, c.name_hi as crop_name_hi,
            farmer.full_name as farmer_name, farmer.mobile as farmer_mobile, farmer.district, farmer.taluka
     FROM farmer_produce fp
     JOIN crops c ON fp.crop_id = c.id
     JOIN farmer_profiles farmer ON fp.farmer_id = farmer.id
     WHERE fp.status = 'AVAILABLE' AND fp.crop_id = ?
     ORDER BY fp.created_at DESC`,
    [reqItem.crop_id]
  );

  const fpoLots = queryAll(
    db,
    `SELECT fl.*, c.name_en as crop_name_en, c.name_mr as crop_name_mr, c.name_hi as crop_name_hi
     FROM fpo_lots fl
     JOIN crops c ON fl.crop_id = c.id
     WHERE fl.status IN ('OPEN', 'AGGREGATING') AND fl.crop_id = ?
     ORDER BY fl.created_at DESC`,
    [reqItem.crop_id]
  );

  const matches: any[] = [];

  for (const p of produceList) {
    const matchAnalysis = computeProduceMatch(reqItem, {
      id: p.id,
      type: 'PRODUCE',
      crop_id: p.crop_id,
      crop_name_en: p.crop_name_en,
      quantity_qtl: p.quantity_qtl,
      quality_grade: p.quality_grade,
      expected_price_per_qtl: p.expected_price_per_qtl,
      village: p.village,
      harvest_date: p.harvest_date,
    });

    matches.push({
      itemType: 'PRODUCE',
      produce: p,
      matchScore: matchAnalysis.score,
      isEligible: matchAnalysis.isEligible,
      reasons: matchAnalysis.reasons,
      summaryEn: matchAnalysis.summaryEn,
      summaryMr: matchAnalysis.summaryMr,
      summaryHi: matchAnalysis.summaryHi,
    });
  }

  for (const lot of fpoLots) {
    const matchAnalysis = computeProduceMatch(reqItem, {
      id: lot.id,
      type: 'FPO_LOT',
      crop_id: lot.crop_id,
      crop_name_en: lot.crop_name_en,
      quantity_qtl: lot.current_quantity_qtl,
      quality_grade: 'Grade A',
      expected_price_per_qtl: reqItem.max_price_per_qtl * 0.96,
      village: lot.collection_center,
    });

    matches.push({
      itemType: 'FPO_LOT',
      lot,
      matchScore: matchAnalysis.score,
      isEligible: matchAnalysis.isEligible,
      reasons: matchAnalysis.reasons,
      summaryEn: matchAnalysis.summaryEn,
      summaryMr: matchAnalysis.summaryMr,
      summaryHi: matchAnalysis.summaryHi,
    });
  }

  matches.sort((a, b) => b.matchScore - a.matchScore);
  return res.json(matches);
});

// Matching requirements for farmer
app.get('/api/matching/for-farmer', authenticateToken, requireRole('FARMER'), async (req: Request, res: Response) => {
  const db = await getDb();
  const farmerProduce = queryAll(
    db,
    `SELECT fp.*, c.name_en as crop_name_en, c.name_mr as crop_name_mr, c.name_hi as crop_name_hi
     FROM farmer_produce fp
     JOIN crops c ON fp.crop_id = c.id
     WHERE fp.farmer_id = ? AND fp.status = 'AVAILABLE'`,
    [req.user!.profileId]
  );

  const openReqs = queryAll(
    db,
    `SELECT br.*, c.name_en as crop_name_en, c.name_mr as crop_name_mr, c.name_hi as crop_name_hi,
            bp.business_name, bp.buyer_type, bp.contact_person, bp.mobile
     FROM buyer_requirements br
     JOIN crops c ON br.crop_id = c.id
     JOIN buyer_profiles bp ON br.buyer_id = bp.id
     WHERE br.status = 'OPEN'
     ORDER BY br.created_at DESC`
  );

  const matches: any[] = [];
  for (const prod of farmerProduce) {
    for (const reqItem of openReqs) {
      if (reqItem.crop_id === prod.crop_id) {
        const matchAnalysis = computeProduceMatch(reqItem, {
          id: prod.id,
          type: 'PRODUCE',
          crop_id: prod.crop_id,
          crop_name_en: prod.crop_name_en,
          quantity_qtl: prod.quantity_qtl,
          quality_grade: prod.quality_grade,
          expected_price_per_qtl: prod.expected_price_per_qtl,
          village: prod.village,
          harvest_date: prod.harvest_date,
        });

        matches.push({
          produce: prod,
          requirement: reqItem,
          matchScore: matchAnalysis.score,
          isEligible: matchAnalysis.isEligible,
          reasons: matchAnalysis.reasons,
          summaryEn: matchAnalysis.summaryEn,
          summaryMr: matchAnalysis.summaryMr,
          summaryHi: matchAnalysis.summaryHi,
        });
      }
    }
  }

  matches.sort((a, b) => b.matchScore - a.matchScore);
  return res.json(matches);
});

// ----------------------------------------------------
// COMPETITIVE BIDDING WORKFLOW
// ----------------------------------------------------

app.get('/api/bids', authenticateToken, async (req: Request, res: Response) => {
  const db = await getDb();
  let sql = `
    SELECT bb.*,
           c.name_en as crop_name_en, c.name_mr as crop_name_mr, c.name_hi as crop_name_hi,
           fp.variety, fp.village as produce_village, fp.quality_grade, fp.expected_price_per_qtl,
           bp.business_name, bp.buyer_type, bp.contact_person, bp.mobile as buyer_mobile,
           farmer.full_name as farmer_name, farmer.mobile as farmer_mobile, farmer.id as farmer_profile_id,
           farmer.user_id as farmer_user_id,
           br.delivery_location, br.max_price_per_qtl as req_max_price
    FROM buyer_bids bb
    LEFT JOIN farmer_produce fp ON bb.produce_id = fp.id
    LEFT JOIN crops c ON fp.crop_id = c.id
    LEFT JOIN buyer_profiles bp ON bb.buyer_id = bp.id
    LEFT JOIN farmer_profiles farmer ON fp.farmer_id = farmer.id
    LEFT JOIN buyer_requirements br ON bb.requirement_id = br.id
  `;
  const params: any[] = [];

  if (req.user!.role === 'FARMER') {
    sql += ' WHERE fp.farmer_id = ?';
    params.push(req.user!.profileId);
  } else if (req.user!.role === 'BUYER') {
    sql += ' WHERE bb.buyer_id = ?';
    params.push(req.user!.profileId);
  }

  sql += ' ORDER BY bb.created_at DESC';
  const bids = queryAll(db, sql, params);
  return res.json(bids);
});

// Submit a new bid
app.post('/api/bids', authenticateToken, requireRole('BUYER'), async (req: Request, res: Response) => {
  try {
    const {
      produce_id,
      lot_id,
      bid_price_per_qtl,
      quantity_qtl,
      proposed_pickup_date,
      requirement_id,
      payment_terms,
      validity_date,
      notes,
    } = req.body;

    if (!bid_price_per_qtl || !quantity_qtl || !proposed_pickup_date) {
      return res.status(400).json({ error: 'Bid price, quantity and proposed pickup date are required' });
    }

    if (parseFloat(bid_price_per_qtl) <= 0 || parseFloat(quantity_qtl) <= 0) {
      return res.status(400).json({ error: 'Price and quantity must be positive numbers' });
    }

    const db = await getDb();
    const result = run(
      db,
      `INSERT INTO buyer_bids (
        requirement_id, buyer_id, produce_id, lot_id, bid_price_per_qtl, quantity_qtl,
        proposed_pickup_date, payment_terms, validity_date, notes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
      [
        requirement_id ? Number(requirement_id) : null,
        req.user!.profileId,
        produce_id ? Number(produce_id) : null,
        lot_id ? Number(lot_id) : null,
        parseFloat(bid_price_per_qtl),
        parseFloat(quantity_qtl),
        proposed_pickup_date,
        payment_terms || 'Immediate on Quality Verification',
        validity_date || null,
        notes ? notes.trim() : null,
      ]
    );

    // Notify farmer of incoming competitive bid
    if (produce_id) {
      const prod = queryOne(
        db,
        `SELECT fp.farmer_id, f.user_id, c.name_en, c.name_mr, c.name_hi, bp.business_name
         FROM farmer_produce fp
         JOIN farmer_profiles f ON fp.farmer_id = f.id
         JOIN crops c ON fp.crop_id = c.id
         LEFT JOIN buyer_profiles bp ON bp.id = ?
         WHERE fp.id = ?`,
        [req.user!.profileId, Number(produce_id)]
      );
      if (prod) {
        run(
          db,
          `INSERT INTO notifications (user_id, title_en, title_mr, title_hi, message_en, message_mr, message_hi, type)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'BID')`,
          [
            prod.user_id,
            'New Direct Buyer Bid Received!',
            'नवीन खरेदीदार बोली प्राप्त झाली!',
            'नई खरीदार बोली प्राप्त हुई!',
            `${prod.business_name || 'A Verified Buyer'} bid ₹${bid_price_per_qtl}/Qtl for your ${quantity_qtl} Qtl ${prod.name_en} produce. Review in Bidding desk!`,
            `${prod.business_name || 'प्रमाणित खरेदीदार'} यांनी तुमच्या ${quantity_qtl} क्विंटल ${prod.name_mr} साठी प्रति क्विंटल ₹${bid_price_per_qtl} ची बोली दिली आहे.`,
            `${prod.business_name || 'प्रमाणित खरीदार'} ने आपके ${quantity_qtl} क्विंटल ${prod.name_hi} के लिए ₹${bid_price_per_qtl}/क्विंटल की बोली लगाई है।`,
          ]
        );
      }
    }

    const newBid = queryOne(db, 'SELECT * FROM buyer_bids WHERE id = ?', [result.lastId]);
    return res.status(201).json(newBid);
  } catch (err: any) {
    console.error('Bid creation error:', err);
    return res.status(500).json({ error: 'Failed to place bid' });
  }
});

// Update active bid (prevents modifying another buyer's bid)
app.put('/api/bids/:id', authenticateToken, requireRole('BUYER'), async (req: Request, res: Response) => {
  try {
    const bidId = Number(req.params.id);
    const { bid_price_per_qtl, quantity_qtl, proposed_pickup_date, payment_terms, validity_date, notes } = req.body;

    const db = await getDb();
    const bid = queryOne(db, 'SELECT * FROM buyer_bids WHERE id = ?', [bidId]);
    if (!bid) return res.status(404).json({ error: 'Bid not found' });

    if (bid.buyer_id !== req.user!.profileId) {
      return res.status(403).json({ error: 'Unauthorized: You cannot edit another buyer’s bid.' });
    }

    if (['ACCEPTED', 'REJECTED', 'CLOSED'].includes(bid.status)) {
      return res.status(400).json({ error: `Cannot modify a bid that is already ${bid.status}.` });
    }

    run(
      db,
      `UPDATE buyer_bids
       SET bid_price_per_qtl = COALESCE(?, bid_price_per_qtl),
           quantity_qtl = COALESCE(?, quantity_qtl),
           proposed_pickup_date = COALESCE(?, proposed_pickup_date),
           payment_terms = COALESCE(?, payment_terms),
           validity_date = COALESCE(?, validity_date),
           notes = COALESCE(?, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        bid_price_per_qtl ? parseFloat(bid_price_per_qtl) : null,
        quantity_qtl ? parseFloat(quantity_qtl) : null,
        proposed_pickup_date || null,
        payment_terms || null,
        validity_date || null,
        notes || null,
        bidId,
      ]
    );

    // Notify farmer of bid update
    if (bid.produce_id) {
      const prod = queryOne(
        db,
        `SELECT fp.farmer_id, f.user_id, c.name_en, c.name_mr, c.name_hi
         FROM farmer_produce fp
         JOIN farmer_profiles f ON fp.farmer_id = f.id
         JOIN crops c ON fp.crop_id = c.id
         WHERE fp.id = ?`,
        [bid.produce_id]
      );
      if (prod) {
        run(
          db,
          `INSERT INTO notifications (user_id, title_en, title_mr, title_hi, message_en, message_mr, message_hi, type)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'BID_UPDATED')`,
          [
            prod.user_id,
            'Buyer Bid Updated!',
            'खरेदीदाराने बोली अद्यतनित केली!',
            'खरीदार ने बोली अपडेट की!',
            `The buyer has revised their offer to ₹${bid_price_per_qtl || bid.bid_price_per_qtl}/Qtl for your ${prod.name_en}.`,
            `खरेदीदाराने तुमच्या ${prod.name_mr} पिकासाठी प्रति क्विंटल ₹${bid_price_per_qtl || bid.bid_price_per_qtl} अशी नवीन बोली दिली आहे.`,
            `खरीदार ने आपकी ${prod.name_hi} फसल के लिए ₹${bid_price_per_qtl || bid.bid_price_per_qtl}/क्विंटल की संशोधित बोली लगाई है।`,
          ]
        );
      }
    }

    const updated = queryOne(db, 'SELECT * FROM buyer_bids WHERE id = ?', [bidId]);
    return res.json(updated);
  } catch (err: any) {
    console.error('Bid update error:', err);
    return res.status(500).json({ error: 'Failed to update bid' });
  }
});

// Close bidding / Lock final offer
app.put('/api/bids/:id/close', authenticateToken, async (req: Request, res: Response) => {
  try {
    const bidId = Number(req.params.id);
    const db = await getDb();
    const bid = queryOne(db, 'SELECT * FROM buyer_bids WHERE id = ?', [bidId]);
    if (!bid) return res.status(404).json({ error: 'Bid not found' });

    run(db, "UPDATE buyer_bids SET status = 'FINAL_OFFER', is_closed = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [bidId]);

    // Notify farmer to view in Net Realisation (Module 2)
    if (bid.produce_id) {
      const prod = queryOne(
        db,
        `SELECT fp.farmer_id, f.user_id, c.name_en, c.name_mr, c.name_hi
         FROM farmer_produce fp
         JOIN farmer_profiles f ON fp.farmer_id = f.id
         JOIN crops c ON fp.crop_id = c.id
         WHERE fp.id = ?`,
        [bid.produce_id]
      );
      if (prod) {
        run(
          db,
          `INSERT INTO notifications (user_id, title_en, title_mr, title_hi, message_en, message_mr, message_hi, type)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'FINAL_OFFER')`,
          [
            prod.user_id,
            'Final Offer Locked!',
            'अंतिम खरेदी प्रस्ताव निश्चित!',
            'अंतिम खरीद प्रस्ताव लॉक!',
            `Bidding has closed and a Final Offer of ₹${bid.bid_price_per_qtl}/Qtl is ready for comparison in Module 2 (Net Realisation).`,
            `बोली बंद झाली असून प्रति क्विंटल ₹${bid.bid_price_per_qtl} चा अंतिम प्रस्ताव मॉड्यूल २ (निव्वळ नफा तुलना) मध्ये पडताळणीसाठी उपलब्ध आहे.`,
            `बोली समाप्त हो गई है और ₹${bid.bid_price_per_qtl}/क्विंटल का अंतिम प्रस्ताव मॉड्यूल 2 (शुद्ध लाभ तुलना) में विश्लेषण के लिए तैयार है।`,
          ]
        );
      }
    }

    return res.json({ success: true, status: 'FINAL_OFFER' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to close bidding' });
  }
});

// Evaluate final offer in Module 2 Net Realisation
app.post('/api/bids/:id/send-to-module2', authenticateToken, async (req: Request, res: Response) => {
  try {
    const bidId = Number(req.params.id);
    const db = await getDb();
    const bid = queryOne(
      db,
      `SELECT bb.*, fp.crop_id, fp.quantity_qtl as produce_quantity, fp.village,
              c.name_en as crop_name_en, c.name_mr as crop_name_mr, c.name_hi as crop_name_hi,
              bp.business_name, bp.delivery_location
       FROM buyer_bids bb
       LEFT JOIN farmer_produce fp ON bb.produce_id = fp.id
       LEFT JOIN crops c ON fp.crop_id = c.id
       LEFT JOIN buyer_profiles bp ON bb.buyer_id = bp.id
       WHERE bb.id = ?`,
      [bidId]
    );

    if (!bid) return res.status(404).json({ error: 'Bid not found' });
    const crop = queryOne(db, 'SELECT * FROM crops WHERE id = ?', [bid.crop_id]);
    if (!crop) return res.status(404).json({ error: 'Crop not found' });

    const markets = queryAll(
      db,
      `SELECT m.id, m.name, m.district, m.distance_km, mp.modal_price,
              m.market_cess_percent, m.commission_percent, m.unloading_rate_per_qtl, m.transport_rate_per_km_ton
       FROM markets m
       JOIN market_prices mp ON m.id = mp.market_id
       WHERE mp.crop_id = ?
       ORDER BY m.distance_km ASC`,
      [crop.id]
    );

    const mandiRankings = computeNetRealisation(crop, markets, bid.quantity_qtl, false, 28.0);
    const bestMandi = mandiRankings.length > 0 ? mandiRankings[0] : null;

    const farmerTransportCost = 0; // farmgate buyer pickup
    const grossRevenue = bid.bid_price_per_qtl * bid.quantity_qtl;
    const netRevenue = grossRevenue - farmerTransportCost;
    const netPerQtl = netRevenue / bid.quantity_qtl;
    const diffVsBestMandi = bestMandi ? Math.round((netPerQtl - bestMandi.netRealisationPerQtl) * 10) / 10 : 0;

    return res.json({
      bid,
      crop,
      quantityQtl: bid.quantity_qtl,
      bidPricePerQtl: bid.bid_price_per_qtl,
      logisticsMode: 'Buyer Farmgate Pickup (Zero Freight for Farmer)',
      farmerTransportCost,
      farmerNetRealisationPerQtl: netPerQtl,
      totalNetRevenue: netRevenue,
      mandiComparison: mandiRankings,
      profitDifferenceVsBestMandi: diffVsBestMandi,
    });
  } catch (err: any) {
    console.error('Send to Module 2 error:', err);
    return res.status(500).json({ error: 'Failed to evaluate bid in Module 2' });
  }
});

// Explicit transaction creation from accepted bid
app.post('/api/transactions/create-from-bid', authenticateToken, async (req: Request, res: Response) => {
  try {
    const rawBidId = req.body.bidId ?? req.body.bid_id;
    const db = await getDb();
    const bid = queryOne(db, 'SELECT * FROM buyer_bids WHERE id = ?', [Number(rawBidId)]);
    if (!bid) return res.status(404).json({ error: 'Bid not found' });

    run(db, "UPDATE buyer_bids SET status = 'ACCEPTED', is_closed = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [bid.id]);

    let transactionRef = 'KV-TXN-' + Date.now().toString(36).toUpperCase();
    let cropId = 1;
    let sellerId = 1;

    if (bid.produce_id) {
      const prod = queryOne(db, 'SELECT * FROM farmer_produce WHERE id = ?', [bid.produce_id]);
      if (prod) {
        cropId = prod.crop_id;
        sellerId = prod.farmer_id;
        run(db, "UPDATE farmer_produce SET status = 'MATCHED' WHERE id = ?", [bid.produce_id]);
      }
    }

    const gross = bid.bid_price_per_qtl * bid.quantity_qtl;
    const txRes = run(
      db,
      `INSERT INTO transactions (
        transaction_ref, seller_type, seller_id, buyer_id, crop_id, produce_id, bid_id, requirement_id,
        quantity_qtl, rate_per_qtl, gross_amount, transport_cost, net_amount,
        status, payment_status, delivery_status, pickup_delivery_mode
      ) VALUES (?, 'FARMER', ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'ORDER_CREATED', 'PENDING', 'PENDING', 'BUYER_PICKUP')`,
      [
        transactionRef,
        sellerId,
        bid.buyer_id,
        cropId,
        bid.produce_id || null,
        bid.id,
        bid.requirement_id || null,
        bid.quantity_qtl,
        bid.bid_price_per_qtl,
        gross,
        gross,
      ]
    );

    const newTx = queryOne(db, 'SELECT * FROM transactions WHERE id = ?', [txRes.lastId]);
    return res.status(201).json(newTx);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to create transaction from bid' });
  }
});

// Respond to bid: ACCEPT, REJECT, COUNTER
app.post('/api/bids/:id/respond', authenticateToken, async (req: Request, res: Response) => {
  try {
    const bidId = Number(req.params.id);
    const { action, counter_price } = req.body;

    const db = await getDb();
    const bid = queryOne(db, 'SELECT * FROM buyer_bids WHERE id = ?', [bidId]);
    if (!bid) return res.status(404).json({ error: 'Bid not found' });

    if (action === 'ACCEPT') {
      run(db, "UPDATE buyer_bids SET status = 'ACCEPTED', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [bidId]);

      let transactionRef = '';
      if (bid.produce_id) {
        const prod = queryOne(db, 'SELECT * FROM farmer_produce WHERE id = ?', [bid.produce_id]);
        if (prod) {
          run(db, "UPDATE farmer_produce SET status = 'MATCHED' WHERE id = ?", [bid.produce_id]);
          const gross = bid.bid_price_per_qtl * bid.quantity_qtl;
          const transportCost = 0; // farmgate buyer pickup
          const net = gross - transportCost;
          transactionRef = 'KV-TXN-' + Date.now().toString(36).toUpperCase();

          const txRes = run(
            db,
            `INSERT INTO transactions (
              transaction_ref, seller_type, seller_id, buyer_id, crop_id, produce_id, bid_id, requirement_id,
              quantity_qtl, rate_per_qtl, gross_amount, transport_cost, net_amount,
              status, payment_status, delivery_status, pickup_delivery_mode
            ) VALUES (?, 'FARMER', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ORDER_CREATED', 'PENDING', 'PENDING', 'BUYER_PICKUP')`,
            [
              transactionRef,
              prod.farmer_id,
              bid.buyer_id,
              prod.crop_id,
              prod.id,
              bid.id,
              bid.requirement_id || null,
              bid.quantity_qtl,
              bid.bid_price_per_qtl,
              gross,
              transportCost,
              net,
            ]
          );

          // Notify buyer of acceptance
          const buyer = queryOne(db, 'SELECT user_id, business_name FROM buyer_profiles WHERE id = ?', [bid.buyer_id]);
          if (buyer) {
            run(
              db,
              `INSERT INTO notifications (user_id, title_en, title_mr, title_hi, message_en, message_mr, message_hi, type)
               VALUES (?, ?, ?, ?, ?, ?, ?, 'TXN_ACCEPTED')`,
              [
                buyer.user_id,
                'Offer Accepted! Order Created',
                'प्रस्ताव स्वीकारला! ऑर्डर तयार झाली',
                'प्रस्ताव स्वीकृत! ऑर्डर बनाई गई',
                `Farmer has accepted your bid of ₹${bid.bid_price_per_qtl}/Qtl. Order ref ${transactionRef} is ready for Quality Verification.`,
                `शेतकऱ्याने ₹${bid.bid_price_per_qtl}/क्विंटलचा प्रस्ताव स्वीकारला आहे. संदर्भ ${transactionRef} गुणवत्तेच्या तपासणीसाठी सज्ज आहे.`,
                `किसान ने आपका ₹${bid.bid_price_per_qtl}/क्विंटल का प्रस्ताव स्वीकार कर लिया है। आर्डर ${transactionRef} गुणवत्ता सत्यापन के लिए तैयार है।`,
              ]
            );
          }
        }
      }

      return res.json({ success: true, status: 'ACCEPTED', transactionRef });
    } else if (action === 'REJECT') {
      run(db, "UPDATE buyer_bids SET status = 'REJECTED', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [bidId]);

      // Notify buyer of rejection
      const buyer = queryOne(db, 'SELECT user_id FROM buyer_profiles WHERE id = ?', [bid.buyer_id]);
      if (buyer) {
        run(
          db,
          `INSERT INTO notifications (user_id, title_en, title_mr, title_hi, message_en, message_mr, message_hi, type)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'BID_REJECTED')`,
          [
            buyer.user_id,
            'Bid Declined by Farmer',
            'शेतकऱ्याने बोली नाकारली',
            'किसान ने बोली अस्वीकार की',
            `Your bid of ₹${bid.bid_price_per_qtl}/Qtl was declined by the farmer. You can place a revised bid.`,
            `तुमची ₹${bid.bid_price_per_qtl}/क्विंटल ची बोली शेतकऱ्याने नाकारली आहे. तुम्ही सुधारित बोली लावू शकता.`,
            `आपकी ₹${bid.bid_price_per_qtl}/क्विंटल की बोली किसान ने अस्वीकार कर दी है। आप संशोधित बोली लगा सकते हैं।`,
          ]
        );
      }
      return res.json({ success: true, status: 'REJECTED' });
    } else if (action === 'COUNTER') {
      if (!counter_price) return res.status(400).json({ error: 'Counter price is required' });
      run(db, "UPDATE buyer_bids SET status = 'COUNTERED', counter_price_per_qtl = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [
        parseFloat(counter_price),
        bidId,
      ]);

      // Notify buyer of counter offer
      const buyer = queryOne(db, 'SELECT user_id FROM buyer_profiles WHERE id = ?', [bid.buyer_id]);
      if (buyer) {
        run(
          db,
          `INSERT INTO notifications (user_id, title_en, title_mr, title_hi, message_en, message_mr, message_hi, type)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'COUNTER_OFFER')`,
          [
            buyer.user_id,
            'Counter-Offer Received from Farmer!',
            'शेतकऱ्याकडून प्रति-प्रस्ताव प्राप्त!',
            'किसान से काउंटर-ऑफर प्राप्त हुआ!',
            `Farmer has proposed a counter-rate of ₹${counter_price}/Qtl for the lot.`,
            `शेतकऱ्याने या मालासाठी प्रति क्विंटल ₹${counter_price} चा प्रति-दर सुचवला आहे.`,
            `किसान ने इस लॉट के लिए ₹${counter_price}/क्विंटल का काउंटर भाव प्रस्तावित किया है।`,
          ]
        );
      }
      return res.json({ success: true, status: 'COUNTERED', counter_price });
    }

    return res.status(400).json({ error: 'Invalid response action' });
  } catch (err: any) {
    console.error('Bid respond error:', err);
    return res.status(500).json({ error: 'Failed to respond to bid', details: err?.message || String(err) });
  }
});

// ----------------------------------------------------
// FULL TRANSACTION & SETTLEMENT LIFECYCLE
// ----------------------------------------------------

app.get('/api/transactions', authenticateToken, async (req: Request, res: Response) => {
  const db = await getDb();
  let sql = `
    SELECT t.*, c.name_en as crop_name_en, c.name_mr as crop_name_mr, c.name_hi as crop_name_hi,
           bp.business_name as buyer_name, bp.contact_person as buyer_contact, bp.mobile as buyer_mobile,
           fp.full_name as farmer_name, fp.mobile as farmer_mobile, fp.village as farmer_village
    FROM transactions t
    JOIN crops c ON t.crop_id = c.id
    JOIN buyer_profiles bp ON t.buyer_id = bp.id
    LEFT JOIN farmer_profiles fp ON t.seller_id = fp.id
  `;
  const params: any[] = [];

  if (req.user!.role === 'FARMER') {
    sql += ' WHERE t.seller_type = "FARMER" AND t.seller_id = ?';
    params.push(req.user!.profileId);
  } else if (req.user!.role === 'BUYER') {
    sql += ' WHERE t.buyer_id = ?';
    params.push(req.user!.profileId);
  }

  sql += ' ORDER BY t.created_at DESC';
  const txs = queryAll(db, sql, params);
  const enriched = txs.map((tx: any) => {
    const qv = queryOne(
      db,
      'SELECT * FROM quality_verifications WHERE transaction_id = ? ORDER BY verification_date DESC LIMIT 1',
      [tx.id]
    );
    const pay = queryOne(
      db,
      'SELECT * FROM payment_records WHERE transaction_id = ? ORDER BY payment_date DESC LIMIT 1',
      [tx.id]
    );
    return {
      ...tx,
      quality_verification: qv || null,
      payment_record: pay || null,
    };
  });
  return res.json(enriched);
});

app.get('/api/transactions/:id/details', authenticateToken, async (req: Request, res: Response) => {
  const db = await getDb();
  const txId = Number(req.params.id);

  const tx = queryOne(
    db,
    `SELECT t.*, c.name_en as crop_name_en, c.name_mr as crop_name_mr, c.name_hi as crop_name_hi,
            bp.business_name as buyer_name, bp.contact_person as buyer_contact, bp.mobile as buyer_mobile, bp.delivery_location as buyer_location,
            fp.full_name as farmer_name, fp.mobile as farmer_mobile, fp.village as farmer_village
     FROM transactions t
     JOIN crops c ON t.crop_id = c.id
     JOIN buyer_profiles bp ON t.buyer_id = bp.id
     LEFT JOIN farmer_profiles fp ON t.seller_id = fp.id
     WHERE t.id = ?`,
    [txId]
  );

  if (!tx) return res.status(404).json({ error: 'Transaction not found' });

  const verifications = queryAll(
    db,
    'SELECT * FROM quality_verifications WHERE transaction_id = ? ORDER BY verification_date DESC',
    [txId]
  );

  const payments = queryAll(
    db,
    'SELECT * FROM payment_records WHERE transaction_id = ? ORDER BY payment_date DESC',
    [txId]
  );

  return res.json({ transaction: tx, verifications, payments });
});

// Quality Verification Record Submission
app.post('/api/transactions/:id/quality-verify', authenticateToken, async (req: Request, res: Response) => {
  try {
    const txId = Number(req.params.id);
    const { verified_grade, is_accepted, quantity_verified_qtl, quality_notes, verifier_name } = req.body;

    if (!verified_grade || quantity_verified_qtl === undefined) {
      return res.status(400).json({ error: 'Verified grade and verified quantity are required.' });
    }

    const db = await getDb();
    const tx = queryOne(db, 'SELECT * FROM transactions WHERE id = ?', [txId]);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });

    const accepted = Boolean(is_accepted);

    run(
      db,
      `INSERT INTO quality_verifications (
        transaction_id, verified_grade, is_accepted, quantity_verified_qtl, quality_notes, verifier_name
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        txId,
        verified_grade,
        accepted ? 1 : 0,
        parseFloat(quantity_verified_qtl),
        quality_notes ? quality_notes.trim() : null,
        verifier_name ? verifier_name.trim() : 'Chief Quality Inspector',
      ]
    );

    if (accepted) {
      run(db, "UPDATE transactions SET status = 'READY_FOR_DELIVERY', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [txId]);

      // Notify farmer & buyer
      const farmer = queryOne(db, 'SELECT user_id FROM farmer_profiles WHERE id = ?', [tx.seller_id]);
      if (farmer) {
        run(
          db,
          `INSERT INTO notifications (user_id, title_en, title_mr, title_hi, message_en, message_mr, message_hi, type)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'QUALITY_PASSED')`,
          [
            farmer.user_id,
            'Quality Inspection Passed!',
            'गुणवत्ता तपासणी यशस्वी!',
            'गुणवत्ता निरीक्षण सफल!',
            `Your produce passed inspection as ${verified_grade}. Lot is marked Ready for Dispatch.`,
            `तुमच्या शेतमालाने ${verified_grade} नुसार तपासणी उत्तीर्ण केली आहे. माल वितरणासाठी सज्ज आहे.`,
            `आपकी उपज ने ${verified_grade} के रूप में निरीक्षण पास कर लिया है। लॉट रवानगी के लिए तैयार है।`,
          ]
        );
      }
    } else {
      run(db, "UPDATE transactions SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [txId]);

      // If quality rejected, release produce or make eligible for Rescue Network
      if (tx.produce_id) {
        run(db, "UPDATE farmer_produce SET status = 'AVAILABLE' WHERE id = ?", [tx.produce_id]);
      }

      const farmer = queryOne(db, 'SELECT user_id FROM farmer_profiles WHERE id = ?', [tx.seller_id]);
      if (farmer) {
        run(
          db,
          `INSERT INTO notifications (user_id, title_en, title_mr, title_hi, message_en, message_mr, message_hi, type)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'RESCUE_ALERT')`,
          [
            farmer.user_id,
            'Quality Inspection Failed — Rescue Option Available',
            'गुणवत्ता तपासणी अपयशी — संकटकालीन विल्हेवाट पर्याय उपलब्ध',
            'गुणवत्ता निरीक्षण विफल — आपातकालीन बचाव विकल्प उपलब्ध',
            `Buyer quality check failed. Deal cancelled. You can liquidate immediately via Module 6 (Crop Rescue Network).`,
            `खरेदीदाराच्या तपासणीत प्रत नाकारली गेली. मॉड्यूल ६ (पीक बचाव नेटवर्क) द्वारे त्वरित पर्यायी विल्हेवाट लावा.`,
            `खरीदार की गुणवत्ता जांच विफल रही। मॉड्यूल 6 (फसल बचाव नेटवर्क) के जरिए तुरंत वैकल्पिक निपटान करें।`,
          ]
        );
      }
    }

    return res.json({ success: true, accepted, newStatus: accepted ? 'READY_FOR_DELIVERY' : 'CANCELLED' });
  } catch (err: any) {
    console.error('Quality verification error:', err);
    return res.status(500).json({ error: 'Failed to record quality verification' });
  }
});

// Advance delivery status: READY_FOR_DELIVERY -> IN_TRANSIT -> DELIVERED
app.put('/api/transactions/:id/advance-delivery', authenticateToken, async (req: Request, res: Response) => {
  try {
    const txId = Number(req.params.id);
    const { target_status } = req.body; // 'IN_TRANSIT' | 'DELIVERED'

    if (!['IN_TRANSIT', 'DELIVERED'].includes(target_status)) {
      return res.status(400).json({ error: 'Invalid delivery status transition.' });
    }

    const db = await getDb();
    const tx = queryOne(db, 'SELECT * FROM transactions WHERE id = ?', [txId]);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });

    if (target_status === 'IN_TRANSIT') {
      run(
        db,
        `UPDATE transactions
         SET status = 'IN_TRANSIT', delivery_status = 'IN_TRANSIT', updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [txId]
      );

      // Notify buyer of shipment
      const buyer = queryOne(db, 'SELECT user_id FROM buyer_profiles WHERE id = ?', [tx.buyer_id]);
      if (buyer) {
        run(
          db,
          `INSERT INTO notifications (user_id, title_en, title_mr, title_hi, message_en, message_mr, message_hi, type)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'SHIPMENT')`,
          [
            buyer.user_id,
            'Produce In Transit!',
            'शेतमाल मार्गावर आहे!',
            'उपज रास्ते में है!',
            `Consignment for Transaction ${tx.transaction_ref} has been dispatched and is currently in transit.`,
            `व्यवहार ${tx.transaction_ref} साठीचा माल पाठवला असून सध्या वाहतुकीत आहे.`,
            `लेनदेन ${tx.transaction_ref} का माल रवाना हो चुका है और वर्तमान में पारगमन में है।`,
          ]
        );
      }
    } else if (target_status === 'DELIVERED') {
      run(
        db,
        `UPDATE transactions
         SET status = 'PAYMENT_PENDING', delivery_status = 'DELIVERED', updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [txId]
      );

      // Notify both parties of arrival
      const farmer = queryOne(db, 'SELECT user_id FROM farmer_profiles WHERE id = ?', [tx.seller_id]);
      if (farmer) {
        run(
          db,
          `INSERT INTO notifications (user_id, title_en, title_mr, title_hi, message_en, message_mr, message_hi, type)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'DELIVERED')`,
          [
            farmer.user_id,
            'Produce Delivered Successfully!',
            'शेतमाल सुरक्षितपणे पोहोचला!',
            'उपज सफलतापूर्वक पहुंच गई!',
            `Buyer has confirmed delivery of ${tx.quantity_qtl} Qtl. Settlement payment is now being processed.`,
            `खरेदीदाराने ${tx.quantity_qtl} क्विंटल माल पोहोचल्याची पुष्टी केली आहे. रक्कम जमा होण्याची प्रक्रिया सुरू आहे.`,
            `खरीदार ने ${tx.quantity_qtl} क्विंटल माल प्राप्ति की पुष्टि की है। भुगतान प्रक्रियाधीन है।`,
          ]
        );
      }
    }

    return res.json({ success: true, target_status });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to advance delivery status' });
  }
});

// Process demo/prototype payment settlement
app.post('/api/transactions/:id/payment', authenticateToken, async (req: Request, res: Response) => {
  try {
    const txId = Number(req.params.id);
    const { payment_method, notes } = req.body;

    const db = await getDb();
    const tx = queryOne(db, 'SELECT * FROM transactions WHERE id = ?', [txId]);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });

    const demoRef = `DEMO-PAY-${Date.now().toString(36).toUpperCase()}`;
    const method = payment_method || 'DEMO_NEFT_DIRECT';

    run(
      db,
      `INSERT INTO payment_records (
        transaction_id, payment_status, amount, payment_method, payment_reference, is_demo
      ) VALUES (?, 'COMPLETED', ?, ?, ?, 1)`,
      [txId, tx.net_amount, method, demoRef]
    );

    run(
      db,
      `UPDATE transactions
       SET payment_status = 'PAID', status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [txId]
    );

    if (tx.produce_id) {
      run(db, "UPDATE farmer_produce SET status = 'SOLD' WHERE id = ?", [tx.produce_id]);
    }

    // Notify farmer of payment credit
    const farmer = queryOne(db, 'SELECT user_id FROM farmer_profiles WHERE id = ?', [tx.seller_id]);
    if (farmer) {
      run(
        db,
        `INSERT INTO notifications (user_id, title_en, title_mr, title_hi, message_en, message_mr, message_hi, type)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'PAYMENT_RECEIVED')`,
        [
          farmer.user_id,
          `Payment Received: ₹${tx.net_amount.toLocaleString('en-IN')} (DEMO)`,
          `पेमेंट जमा झाले: ₹${tx.net_amount.toLocaleString('en-IN')} (डेमो)`,
          `भुगतान प्राप्त: ₹${tx.net_amount.toLocaleString('en-IN')} (डेमो)`,
          `Settlement for ${tx.quantity_qtl} Qtl produce credited via ${method}. Transaction ref: ${tx.transaction_ref}. [DEMO MODE: No real funds moved]`,
          `${tx.quantity_qtl} क्विंटल मालाची पूर्ण रक्कम ${method} द्वारे जमा करण्यात आली. संदर्भ: ${tx.transaction_ref}। [डेमो मोड]`,
          `${tx.quantity_qtl} क्विंटल उपज की राशि ${method} से क्रेडिट हो गई है। लेनदेन संदर्भ: ${tx.transaction_ref}। [डेमो मोड]`,
        ]
      );
    }

    return res.json({ success: true, payment_reference: demoRef, status: 'COMPLETED' });
  } catch (err: any) {
    console.error('Payment record error:', err);
    return res.status(500).json({ error: 'Failed to record payment' });
  }
});

// Update transaction status progression
app.put('/api/transactions/:id/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const txId = Number(req.params.id);
    const { status, notes } = req.body;
    const db = await getDb();
    const tx = queryOne(db, 'SELECT * FROM transactions WHERE id = ?', [txId]);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });

    let deliveryStatus = tx.delivery_status;
    if (status === 'IN_TRANSIT') deliveryStatus = 'IN_TRANSIT';
    else if (status === 'DELIVERED' || status === 'COMPLETED') deliveryStatus = 'DELIVERED';

    let paymentStatus = tx.payment_status;
    if (status === 'COMPLETED') paymentStatus = 'PAID';

    run(
      db,
      'UPDATE transactions SET status = ?, delivery_status = ?, payment_status = ?, delivery_notes = COALESCE(?, delivery_notes), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, deliveryStatus, paymentStatus, notes || null, txId]
    );

    const updated = queryOne(db, 'SELECT * FROM transactions WHERE id = ?', [txId]);
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update transaction status' });
  }
});

// Record demo payment alias
app.post('/api/transactions/:id/record-demo-payment', authenticateToken, async (req: Request, res: Response) => {
  try {
    const txId = Number(req.params.id);
    const { amount, payment_method, payment_reference } = req.body;
    const db = await getDb();
    const tx = queryOne(db, 'SELECT * FROM transactions WHERE id = ?', [txId]);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });

    const demoRef = payment_reference || `DEMO-PAY-${Date.now().toString(36).toUpperCase()}`;
    const method = payment_method || 'DEMO Direct Bank Transfer';
    const payAmount = amount || tx.net_amount;

    run(
      db,
      `INSERT INTO payment_records (
        transaction_id, payment_status, amount, payment_method, payment_reference, is_demo
      ) VALUES (?, 'COMPLETED', ?, ?, ?, 1)`,
      [txId, payAmount, method, demoRef]
    );

    run(
      db,
      `UPDATE transactions
       SET payment_status = 'PAID', status = 'COMPLETED', updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [txId]
    );

    if (tx.produce_id) {
      run(db, "UPDATE farmer_produce SET status = 'SOLD' WHERE id = ?", [tx.produce_id]);
    }

    // Notify farmer
    const farmer = queryOne(db, 'SELECT user_id FROM farmer_profiles WHERE id = ?', [tx.seller_id]);
    if (farmer) {
      run(
        db,
        `INSERT INTO notifications (user_id, title_en, title_mr, title_hi, message_en, message_mr, message_hi, type)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'PAYMENT_RECEIVED')`,
        [
          farmer.user_id,
          `Payment Received: ₹${payAmount.toLocaleString('en-IN')} (DEMO)`,
          `पेमेंट जमा झाले: ₹${payAmount.toLocaleString('en-IN')} (डेमो)`,
          `भुगतान प्राप्त: ₹${payAmount.toLocaleString('en-IN')} (डेमो)`,
          `Settlement for ${tx.quantity_qtl} Qtl produce credited via ${method}. Transaction ref: ${tx.transaction_ref}. [DEMO MODE: No real funds moved]`,
          `${tx.quantity_qtl} क्विंटल मालाची पूर्ण रक्कम ${method} द्वारे जमा करण्यात आली. संदर्भ: ${tx.transaction_ref}। [डेमो मोड]`,
          `${tx.quantity_qtl} क्विंटल उपज की राशि ${method} से क्रेडिट हो गई है। लेनदेन संदर्भ: ${tx.transaction_ref}। [डेमो मोड]`,
        ]
      );
    }

    const updated = queryOne(db, 'SELECT * FROM transactions WHERE id = ?', [txId]);
    const payRec = queryOne(db, 'SELECT * FROM payment_records WHERE transaction_id = ? ORDER BY id DESC LIMIT 1', [txId]);
    return res.json({ success: true, transaction: updated, payment_record: payRec, payment_reference: demoRef });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to record demo payment' });
  }
});

// Cancel Transaction & route to Rescue option
app.put('/api/transactions/:id/cancel', authenticateToken, async (req: Request, res: Response) => {
  try {
    const txId = Number(req.params.id);
    const db = await getDb();
    const tx = queryOne(db, 'SELECT * FROM transactions WHERE id = ?', [txId]);
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });

    run(db, "UPDATE transactions SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = ?", [txId]);
    if (tx.produce_id) {
      run(db, "UPDATE farmer_produce SET status = 'AVAILABLE' WHERE id = ?", [tx.produce_id]);
    }

    return res.json({
      success: true,
      status: 'CANCELLED',
      rescueRecommended: true,
      produceId: tx.produce_id,
    });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to cancel transaction' });
  }
});

// Single notification read
app.put('/api/notifications/:id/read', authenticateToken, async (req: Request, res: Response) => {
  const db = await getDb();
  run(db, 'UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?', [Number(req.params.id), req.user!.userId]);
  return res.json({ success: true });
});

// ----------------------------------------------------
// 6. CROP RESCUE & EMERGENCY RESPONSE NETWORK
// ----------------------------------------------------

app.get('/api/rescue/options', async (_req: Request, res: Response) => {
  const db = await getDb();
  const options = queryAll(db, 'SELECT * FROM rescue_options WHERE status = "ACTIVE" ORDER BY price_offered_per_qtl DESC');
  return res.json(options);
});

app.post('/api/rescue/requests', authenticateToken, requireRole('FARMER'), async (req: Request, res: Response) => {
  try {
    const { produce_id, rescue_option_id, reason, quantity_qtl } = req.body;
    if (!produce_id || !rescue_option_id || !reason || !quantity_qtl) {
      return res.status(400).json({ error: 'All rescue request fields are required' });
    }

    const db = await getDb();
    const facility = queryOne(db, 'SELECT * FROM rescue_options WHERE id = ?', [Number(rescue_option_id)]);
    if (!facility) return res.status(404).json({ error: 'Rescue facility not found' });

    const result = run(
      db,
      `INSERT INTO rescue_plans (produce_id, farmer_id, rescue_option_id, reason, quantity_qtl, agreed_price_per_qtl, status)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
      [
        Number(produce_id),
        req.user!.profileId,
        Number(rescue_option_id),
        reason.trim(),
        parseFloat(quantity_qtl),
        facility.price_offered_per_qtl,
      ]
    );

    // Update produce state to RESCUE
    run(db, "UPDATE farmer_produce SET status = 'RESCUE' WHERE id = ?", [Number(produce_id)]);

    const newPlan = queryOne(db, 'SELECT * FROM rescue_plans WHERE id = ?', [result.lastId]);
    return res.status(201).json(newPlan);
  } catch (err: any) {
    console.error('Rescue request error:', err);
    return res.status(500).json({ error: 'Failed to initiate rescue request' });
  }
});

app.get('/api/rescue/requests', authenticateToken, async (req: Request, res: Response) => {
  const db = await getDb();
  let sql = `
    SELECT rp.*, ro.facility_name, ro.facility_type, ro.contact_phone, ro.district as facility_district,
           fp.variety, c.name_en as crop_name_en, c.name_mr as crop_name_mr, c.name_hi as crop_name_hi,
           farmer.full_name as farmer_name, farmer.mobile as farmer_mobile
    FROM rescue_plans rp
    JOIN rescue_options ro ON rp.rescue_option_id = ro.id
    JOIN farmer_produce fp ON rp.produce_id = fp.id
    JOIN crops c ON fp.crop_id = c.id
    JOIN farmer_profiles farmer ON rp.farmer_id = farmer.id
  `;
  const params: any[] = [];
  if (req.user!.role === 'FARMER') {
    sql += ' WHERE rp.farmer_id = ?';
    params.push(req.user!.profileId);
  }
  sql += ' ORDER BY rp.created_at DESC';

  const plans = queryAll(db, sql, params);
  return res.json(plans);
});

// Explain-Before-Recommend Crop Rescue Plan (Requirement 7 & 8)
app.get('/api/crop-rescue/recommend-plan', async (req: Request, res: Response) => {
  try {
    const produceId = req.query.produce_id ? Number(req.query.produce_id) : undefined;
    const db = await getDb();

    let produce: any = null;
    if (produceId) {
      produce = queryOne(
        db,
        `SELECT fp.*, c.name_en as crop_name_en, c.category, c.shelf_life_days
         FROM farmer_produce fp
         JOIN crops c ON fp.crop_id = c.id
         WHERE fp.id = ?`,
        [produceId]
      );
    }

    if (!produce) {
      produce = queryOne(
        db,
        `SELECT fp.*, c.name_en as crop_name_en, c.category, c.shelf_life_days
         FROM farmer_produce fp
         JOIN crops c ON fp.crop_id = c.id
         WHERE fp.status IN ('AVAILABLE', 'RESCUE')
         ORDER BY fp.id DESC LIMIT 1`
      );
    }

    if (!produce) {
      // Default baseline tomato lot for rescue demonstration
      produce = {
        id: 1,
        variety: 'Vaishali Tomato',
        quantity_qtl: 45,
        harvest_date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
        shelf_life_days: 5,
        crop_name_en: 'Tomato',
        category: 'VEGETABLE',
        village: 'Pimpalgaon, Nashik',
      };
    }

    const options = queryAll(db, 'SELECT * FROM rescue_options WHERE status = "ACTIVE" ORDER BY price_offered_per_qtl DESC');
    let district = produce.storage_location_district || produce.district;
    if (!district && req.user) {
      const fp = queryOne(db, 'SELECT district FROM farmer_profiles WHERE user_id = ?', [req.user.userId]);
      if (fp && fp.district) district = fp.district;
    }
    const weather = await getLiveOrCachedWeather(district || 'pune', produce.latitude, produce.longitude);

    const explainable = computeExplainableCropRescue({
      produce,
      weather,
      options,
    });

    return res.json({
      produce,
      weather,
      explainable,
    });
  } catch (err: any) {
    console.error('Crop rescue recommendation error:', err);
    return res.status(500).json({ error: 'Failed to generate crop rescue recommendation' });
  }
});

// ----------------------------------------------------
// NOTIFICATIONS
// ----------------------------------------------------

app.get('/api/notifications', authenticateToken, async (req: Request, res: Response) => {
  const db = await getDb();
  const notifs = queryAll(
    db,
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
    [req.user!.userId]
  );
  return res.json(notifs);
});

app.put('/api/notifications/read-all', authenticateToken, async (req: Request, res: Response) => {
  const db = await getDb();
  run(db, 'UPDATE notifications SET read = 1 WHERE user_id = ?', [req.user!.userId]);
  return res.json({ success: true });
});

// ----------------------------------------------------
// ADMIN DASHBOARD & MANAGEMENT
// ----------------------------------------------------

app.get('/api/admin/stats', authenticateToken, requireRole('ADMIN'), async (_req: Request, res: Response) => {
  const db = await getDb();
  const usersCount = queryOne(db, 'SELECT COUNT(*) as count FROM users');
  const farmersCount = queryOne(db, 'SELECT COUNT(*) as count FROM farmer_profiles');
  const buyersCount = queryOne(db, 'SELECT COUNT(*) as count FROM buyer_profiles');
  const marketsCount = queryOne(db, 'SELECT COUNT(*) as count FROM markets');
  const txCount = queryOne(db, 'SELECT COUNT(*) as count, COALESCE(SUM(gross_amount), 0) as total_volume FROM transactions');
  const rescueCount = queryOne(db, 'SELECT COUNT(*) as count FROM rescue_options');

  return res.json({
    totalUsers: usersCount ? usersCount.count : 0,
    totalFarmers: farmersCount ? farmersCount.count : 0,
    totalBuyers: buyersCount ? buyersCount.count : 0,
    totalMarkets: marketsCount ? marketsCount.count : 0,
    totalTransactions: txCount ? txCount.count : 0,
    totalVolumeRupees: txCount ? txCount.total_volume : 0,
    totalRescueOptions: rescueCount ? rescueCount.count : 0,
  });
});

app.get('/api/admin/users', authenticateToken, requireRole('ADMIN'), async (_req: Request, res: Response) => {
  const db = await getDb();
  const users = queryAll(db, 'SELECT id, mobile, email, role, language, created_at FROM users ORDER BY id ASC');
  return res.json(users);
});

app.get('/api/admin/farmers', authenticateToken, requireRole('ADMIN'), async (_req: Request, res: Response) => {
  const db = await getDb();
  const farmers = queryAll(db, 'SELECT * FROM farmer_profiles ORDER BY id ASC');
  return res.json(farmers);
});

app.get('/api/admin/buyers', authenticateToken, requireRole('ADMIN'), async (_req: Request, res: Response) => {
  const db = await getDb();
  const buyers = queryAll(db, 'SELECT * FROM buyer_profiles ORDER BY id ASC');
  return res.json(buyers);
});

// ----------------------------------------------------
// VITE MIDDLEWARE OR STATIC SERVING
// ----------------------------------------------------

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KRISHIVAANI Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
