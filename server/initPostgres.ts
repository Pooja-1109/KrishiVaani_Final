/**
 * PostgreSQL Schema Initializer & Migration Runner for Supabase / Render
 * Run via: npx tsx server/initPostgres.ts
 */

import pg from 'pg';
import bcrypt from 'bcryptjs';
import { MAHARASHTRA_APMC_MANDIS } from './db';

const { Pool } = pg;

export async function initializePostgres(connectionUrl?: string) {
  const connString = connectionUrl || process.env.DATABASE_URL;
  if (!connString) {
    console.log('No DATABASE_URL provided. Skipping PostgreSQL initialization.');
    return;
  }

  let formattedUrl = connString;
  if (formattedUrl.startsWith('postgres://')) {
    formattedUrl = formattedUrl.replace('postgres://', 'postgresql://');
  }

  const pool = new Pool({
    connectionString: formattedUrl,
    ssl: formattedUrl.includes('localhost') ? false : { rejectUnauthorized: false },
  });

  console.log('--- Initializing Supabase / PostgreSQL Tables ---');

  const client = await pool.connect();
  try {
    // 1. Create Core Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        mobile TEXT UNIQUE NOT NULL,
        email TEXT,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('FARMER', 'BUYER', 'ADMIN')),
        language TEXT NOT NULL DEFAULT 'mr' CHECK(language IN ('en', 'mr', 'hi')),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS farmer_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        full_name TEXT NOT NULL,
        mobile TEXT NOT NULL,
        state TEXT NOT NULL,
        district TEXT NOT NULL,
        taluka TEXT NOT NULL,
        village TEXT NOT NULL,
        address TEXT,
        land_area REAL,
        primary_crop TEXT,
        latitude REAL,
        longitude REAL,
        place_id TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS buyer_profiles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        business_name TEXT NOT NULL,
        contact_person TEXT NOT NULL,
        mobile TEXT NOT NULL,
        buyer_type TEXT NOT NULL,
        state TEXT NOT NULL,
        district TEXT NOT NULL,
        delivery_location TEXT NOT NULL,
        gstin TEXT,
        address TEXT,
        website TEXT,
        payment_terms TEXT,
        latitude REAL,
        longitude REAL,
        place_id TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS crops (
        id SERIAL PRIMARY KEY,
        name_en TEXT NOT NULL,
        name_mr TEXT NOT NULL,
        name_hi TEXT NOT NULL,
        category TEXT NOT NULL,
        shelf_life_days INTEGER NOT NULL,
        standard_bag_size_kg INTEGER NOT NULL DEFAULT 50,
        transport_loss_percent_per_100km REAL NOT NULL DEFAULT 1.2
      );

      CREATE TABLE IF NOT EXISTS markets (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        state TEXT NOT NULL,
        district TEXT NOT NULL,
        taluka TEXT NOT NULL,
        distance_km REAL NOT NULL DEFAULT 25.0,
        market_cess_percent REAL NOT NULL DEFAULT 1.05,
        commission_percent REAL NOT NULL DEFAULT 4.0,
        unloading_rate_per_qtl REAL NOT NULL DEFAULT 15.0,
        transport_rate_per_km_ton REAL NOT NULL DEFAULT 4.5,
        latitude REAL,
        longitude REAL
      );

      CREATE TABLE IF NOT EXISTS market_prices (
        id SERIAL PRIMARY KEY,
        market_id INTEGER NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
        crop_id INTEGER NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
        price_date DATE NOT NULL,
        min_price REAL NOT NULL,
        max_price REAL NOT NULL,
        modal_price REAL NOT NULL,
        arrivals_qtl REAL NOT NULL,
        trend TEXT DEFAULT 'STABLE',
        data_source TEXT DEFAULT 'Agmarknet APMC Historical Dataset (MSAMB / MoA&FW)',
        last_updated TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        is_live INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS farmer_produce (
        id SERIAL PRIMARY KEY,
        farmer_id INTEGER NOT NULL REFERENCES farmer_profiles(id) ON DELETE CASCADE,
        crop_id INTEGER NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
        variety TEXT NOT NULL,
        quantity_qtl REAL NOT NULL,
        harvest_date DATE NOT NULL,
        quality_grade TEXT NOT NULL DEFAULT 'Grade A',
        expected_price_per_qtl REAL NOT NULL,
        village TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        status TEXT NOT NULL DEFAULT 'AVAILABLE',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS fpo_lots (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        crop_id INTEGER NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
        target_quantity_qtl REAL NOT NULL,
        current_quantity_qtl REAL NOT NULL DEFAULT 0,
        collection_center TEXT NOT NULL,
        transport_rate_discount_percent REAL NOT NULL DEFAULT 28.0,
        status TEXT NOT NULL DEFAULT 'OPEN',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS fpo_lot_contributions (
        id SERIAL PRIMARY KEY,
        lot_id INTEGER NOT NULL REFERENCES fpo_lots(id) ON DELETE CASCADE,
        farmer_id INTEGER NOT NULL REFERENCES farmer_profiles(id) ON DELETE CASCADE,
        produce_id INTEGER NOT NULL REFERENCES farmer_produce(id) ON DELETE CASCADE,
        quantity_qtl REAL NOT NULL,
        contribution_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        status TEXT NOT NULL DEFAULT 'COMMITTED'
      );

      CREATE TABLE IF NOT EXISTS buyer_requirements (
        id SERIAL PRIMARY KEY,
        buyer_id INTEGER NOT NULL REFERENCES buyer_profiles(id) ON DELETE CASCADE,
        crop_id INTEGER NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
        variety TEXT,
        min_quantity_qtl REAL NOT NULL,
        max_price_per_qtl REAL NOT NULL,
        delivery_location TEXT NOT NULL,
        quality_grade TEXT DEFAULT 'Grade A',
        delivery_date DATE,
        payment_terms TEXT DEFAULT 'Immediate on Quality Verification',
        buyer_type TEXT DEFAULT 'Wholesaler',
        packaging_preference TEXT DEFAULT 'Standard 50kg Crates/Bags',
        additional_notes TEXT,
        pickup_delivery_preference TEXT DEFAULT 'BUYER_PICKUP',
        status TEXT NOT NULL DEFAULT 'OPEN',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS buyer_bids (
        id SERIAL PRIMARY KEY,
        requirement_id INTEGER REFERENCES buyer_requirements(id) ON DELETE SET NULL,
        buyer_id INTEGER NOT NULL REFERENCES buyer_profiles(id) ON DELETE CASCADE,
        produce_id INTEGER REFERENCES farmer_produce(id) ON DELETE CASCADE,
        lot_id INTEGER REFERENCES fpo_lots(id) ON DELETE CASCADE,
        bid_price_per_qtl REAL NOT NULL,
        quantity_qtl REAL NOT NULL,
        proposed_pickup_date DATE NOT NULL,
        payment_terms TEXT DEFAULT 'Immediate on Quality Verification',
        validity_date DATE,
        notes TEXT,
        is_closed INTEGER DEFAULT 0,
        updated_at TIMESTAMPTZ,
        status TEXT NOT NULL DEFAULT 'PENDING',
        counter_price_per_qtl REAL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS matches (
        id SERIAL PRIMARY KEY,
        produce_id INTEGER REFERENCES farmer_produce(id) ON DELETE CASCADE,
        lot_id INTEGER REFERENCES fpo_lots(id) ON DELETE CASCADE,
        requirement_id INTEGER NOT NULL REFERENCES buyer_requirements(id) ON DELETE CASCADE,
        match_score REAL NOT NULL,
        estimated_transport_cost REAL NOT NULL,
        net_realisation REAL NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        transaction_ref TEXT UNIQUE NOT NULL,
        seller_type TEXT NOT NULL,
        seller_id INTEGER NOT NULL,
        buyer_id INTEGER NOT NULL REFERENCES buyer_profiles(id),
        crop_id INTEGER NOT NULL REFERENCES crops(id),
        produce_id INTEGER,
        lot_id INTEGER,
        quantity_qtl REAL NOT NULL,
        rate_per_qtl REAL NOT NULL,
        gross_amount REAL NOT NULL,
        transport_cost REAL NOT NULL,
        net_amount REAL NOT NULL,
        payment_status TEXT NOT NULL DEFAULT 'PAID',
        delivery_status TEXT NOT NULL DEFAULT 'DELIVERED',
        status TEXT NOT NULL DEFAULT 'ORDER_CREATED',
        bid_id INTEGER,
        requirement_id INTEGER,
        pickup_delivery_mode TEXT DEFAULT 'BUYER_PICKUP',
        delivery_address TEXT,
        delivery_notes TEXT,
        updated_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS quality_verifications (
        id SERIAL PRIMARY KEY,
        transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
        verified_grade TEXT NOT NULL,
        is_accepted INTEGER NOT NULL DEFAULT 1,
        quantity_verified_qtl REAL NOT NULL,
        quality_notes TEXT,
        verification_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        verifier_name TEXT
      );

      CREATE TABLE IF NOT EXISTS payment_records (
        id SERIAL PRIMARY KEY,
        transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
        payment_status TEXT NOT NULL DEFAULT 'COMPLETED',
        amount REAL NOT NULL,
        payment_method TEXT NOT NULL,
        payment_reference TEXT NOT NULL,
        is_demo INTEGER NOT NULL DEFAULT 0,
        payment_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS weather_records (
        id SERIAL PRIMARY KEY,
        location_district TEXT NOT NULL,
        forecast_date DATE NOT NULL,
        temp_max REAL NOT NULL,
        temp_min REAL NOT NULL,
        rainfall_mm REAL NOT NULL,
        humidity_percent REAL NOT NULL,
        forecast_rain_risk TEXT NOT NULL,
        source TEXT DEFAULT 'Open-Meteo Weather API',
        is_live INTEGER DEFAULT 1,
        retrieved_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS rescue_options (
        id SERIAL PRIMARY KEY,
        facility_name TEXT NOT NULL,
        facility_type TEXT NOT NULL,
        district TEXT NOT NULL,
        contact_phone TEXT NOT NULL,
        capacity_qtl REAL NOT NULL,
        price_offered_per_qtl REAL NOT NULL,
        turnaround_hours INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'ACTIVE'
      );

      CREATE TABLE IF NOT EXISTS rescue_plans (
        id SERIAL PRIMARY KEY,
        produce_id INTEGER NOT NULL REFERENCES farmer_produce(id) ON DELETE CASCADE,
        farmer_id INTEGER NOT NULL REFERENCES farmer_profiles(id) ON DELETE CASCADE,
        rescue_option_id INTEGER NOT NULL REFERENCES rescue_options(id) ON DELETE CASCADE,
        reason TEXT NOT NULL,
        quantity_qtl REAL NOT NULL,
        agreed_price_per_qtl REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title_en TEXT NOT NULL,
        title_mr TEXT NOT NULL,
        title_hi TEXT NOT NULL,
        message_en TEXT NOT NULL,
        message_mr TEXT NOT NULL,
        message_hi TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'INFO',
        read INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS recommendation_records (
        id SERIAL PRIMARY KEY,
        farmer_id INTEGER NOT NULL REFERENCES farmer_profiles(id) ON DELETE CASCADE,
        crop_id INTEGER NOT NULL REFERENCES crops(id) ON DELETE CASCADE,
        recommended_market_id INTEGER NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
        decision TEXT NOT NULL,
        holding_days INTEGER NOT NULL,
        expected_price_gain REAL NOT NULL,
        risk_score REAL NOT NULL,
        rationale_en TEXT NOT NULL,
        rationale_mr TEXT NOT NULL,
        rationale_hi TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Check and Seed Baseline Data
    const cropsCheck = await client.query('SELECT COUNT(*) FROM crops');
    if (parseInt(cropsCheck.rows[0].count, 10) === 0) {
      console.log('Seeding Crops to PostgreSQL...');
      const crops = [
        { en: 'Tomato', mr: 'टोमॅटो', hi: 'टमाटर', cat: 'Vegetable', shelf: 4, bag: 25, loss: 2.2 },
        { en: 'Onion', mr: 'कांदा', hi: 'प्याज', cat: 'Vegetable', shelf: 45, bag: 50, loss: 0.8 },
        { en: 'Soybean', mr: 'सोयाबीन', hi: 'सोयाबीन', cat: 'Oilseed', shelf: 180, bag: 50, loss: 0.2 },
        { en: 'Cotton', mr: 'कापूस', hi: 'कपास', cat: 'Fiber', shelf: 240, bag: 100, loss: 0.1 },
        { en: 'Pomegranate', mr: 'डाळिंब', hi: 'अनार', cat: 'Fruit', shelf: 14, bag: 20, loss: 1.5 },
        { en: 'Grapes', mr: 'द्राक्षे', hi: 'अंगूर', cat: 'Fruit', shelf: 6, bag: 10, loss: 2.5 },
        { en: 'Wheat', mr: 'गहू', hi: 'गेहूं', cat: 'Cereal', shelf: 300, bag: 50, loss: 0.1 },
        { en: 'Dragon Fruit', mr: 'ड्रॅगन फ्रूट', hi: 'ड्रैगन फ्रूट', cat: 'Exotic Fruit', shelf: 10, bag: 20, loss: 2.0 },
      ];
      for (const c of crops) {
        await client.query(
          `INSERT INTO crops (name_en, name_mr, name_hi, category, shelf_life_days, standard_bag_size_kg, transport_loss_percent_per_100km)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [c.en, c.mr, c.hi, c.cat, c.shelf, c.bag, c.loss]
        );
      }
    }

    const marketsCheck = await client.query('SELECT COUNT(*) FROM markets');
    if (parseInt(marketsCheck.rows[0].count, 10) === 0) {
      console.log('Seeding Maharashtra APMC Markets to PostgreSQL...');
      for (const m of MAHARASHTRA_APMC_MANDIS) {
        await client.query(
          `INSERT INTO markets (name, state, district, taluka, distance_km, market_cess_percent, commission_percent, unloading_rate_per_qtl, transport_rate_per_km_ton, latitude, longitude)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [m.name, m.state, m.district, m.taluka, 25.0, m.cess, m.comm, m.unload, m.trans, m.lat, m.lon]
        );
      }
    }

    const usersCheck = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(usersCheck.rows[0].count, 10) === 0) {
      console.log('Seeding Baseline Demo Accounts to PostgreSQL...');
      const farmerPass = await bcrypt.hash('farmer123', 10);
      const buyerPass = await bcrypt.hash('buyer123', 10);
      const adminPass = await bcrypt.hash('admin123', 10);

      // Farmer
      const farmerRes = await client.query(
        `INSERT INTO users (mobile, email, password_hash, role, language) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        ['9876543210', 'ramesh.patil@krishivaani.in', farmerPass, 'FARMER', 'mr']
      );
      const fUserId = farmerRes.rows[0].id;
      const fProfRes = await client.query(
        `INSERT INTO farmer_profiles (user_id, full_name, mobile, state, district, taluka, village, address, land_area, primary_crop, latitude, longitude)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
        [fUserId, 'रमेश बाबुराव पाटील (Ramesh Patil)', '9876543210', 'Maharashtra', 'Nashik', 'Niphad', 'Pimpalgaon Baswant', 'Gat No. 142, Old Agra Road', 4.5, 'Tomato, Onion', 20.1706, 73.9856]
      );
      const fProfId = fProfRes.rows[0].id;

      // Buyer
      const buyerRes = await client.query(
        `INSERT INTO users (mobile, email, password_hash, role, language) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        ['9822012345', 'anand@sahyadriagro.com', buyerPass, 'BUYER', 'en']
      );
      const bUserId = buyerRes.rows[0].id;
      await client.query(
        `INSERT INTO buyer_profiles (user_id, business_name, contact_person, mobile, buyer_type, state, district, delivery_location, gstin, address, website, payment_terms, latitude, longitude)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [bUserId, 'Sahyadri Agro Processing & Cold Logistics Ltd.', 'Anand Deshmukh', '9822012345', 'Processor', 'Maharashtra', 'Nashik', 'Plot 45, MIDC Mohadi, Dindori Road', '27AAACS1234F1Z5', 'MIDC Phase 2, Nashik', 'https://sahyadriagro.in', 'Immediate via RTGS / NEFT', 20.0215, 73.7928]
      );

      // Admin
      await client.query(
        `INSERT INTO users (mobile, email, password_hash, role, language) VALUES ($1, $2, $3, $4, $5)`,
        ['9999999999', 'admin@krishivaani.gov.in', adminPass, 'ADMIN', 'en']
      );

      // Produce
      const today = new Date().toISOString().split('T')[0];
      await client.query(
        `INSERT INTO farmer_produce (farmer_id, crop_id, variety, quantity_qtl, harvest_date, quality_grade, expected_price_per_qtl, village, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [fProfId, 1, 'Abhinav Hybrid Red', 45.0, today, 'Grade A (Table)', 1600.0, 'Pimpalgaon Baswant', 'AVAILABLE']
      );
      await client.query(
        `INSERT INTO farmer_produce (farmer_id, crop_id, variety, quantity_qtl, harvest_date, quality_grade, expected_price_per_qtl, village, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [fProfId, 2, 'Gavran Red Onion (Garva)', 110.0, today, 'Grade A Export Quality', 2200.0, 'Pimpalgaon Baswant', 'AVAILABLE']
      );
    }

    console.log('✓ PostgreSQL database schema and seed setup completed.');
  } finally {
    client.release();
    await pool.end();
  }
}

if (process.argv[1]?.includes('initPostgres')) {
  initializePostgres().catch((err) => {
    console.error('Failed to initialize PostgreSQL:', err);
    process.exit(1);
  });
}
