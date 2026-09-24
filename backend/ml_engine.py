"""
KRISHIVAANI ML Decision Engine
Uses risk-aware heuristics and price trajectory models
"""
import numpy as np

def predict_sell_or_wait(
    shelf_life_days: int,
    category: str,
    modal_price: float,
    trend: str,
    rainfall_mm: float,
    forecast_rain_risk: str
):
    is_perishable = shelf_life_days <= 7
    daily_storage = 18.0 if is_perishable else 4.5
    decay_rate = 3.5 if is_perishable else 0.2

    risk_score = 20
    if is_perishable:
        risk_score += 40
    if forecast_rain_risk in ["HIGH", "SEVERE"] or rainfall_mm > 15:
        risk_score += 30
    elif forecast_rain_risk == "MODERATE":
        risk_score += 15

    if trend == "DOWN":
        risk_score += 15
    elif trend == "UP":
        risk_score -= 10

    risk_score = max(5, min(risk_score, 98))

    if is_perishable and (rainfall_mm > 8 or risk_score > 50):
        return {
            "decision": "SELL_NOW",
            "confidence_score": 88,
            "risk_score": risk_score,
            "recommended_holding_days": 0,
            "expected_price_gain": 0.0,
            "storage_cost_daily": daily_storage,
            "decay_rate": decay_rate,
            "rationale_en": f"High spoilage risk: {shelf_life_days}-day shelf life with {rainfall_mm}mm rain. Liquidate now to prevent fungal distress markdown.",
            "rationale_mr": f"मोठी नासाडी जोखीम: अवघ्या {shelf_life_days} दिवसांचे आयुष्य आणि {rainfall_mm} मिमी पाऊस असल्याने माल त्वरित विकणे फायदेशीर ठरेल.",
            "rationale_hi": f"फसल खराब होने का उच्च जोखिम: {shelf_life_days} दिन की शेल्फ-लाइफ व {rainfall_mm} मिमी बारिश से फसल रोकने पर नुकसान होगा। तुरंत बेचें।"
        }

    if (category in ["Oilseed", "Fiber", "Cereal"] or shelf_life_days > 40) and trend == "UP":
        gain = round(modal_price * 0.045, 1)
        return {
            "decision": "WAIT",
            "confidence_score": 84,
            "risk_score": risk_score,
            "recommended_holding_days": 7,
            "expected_price_gain": gain,
            "storage_cost_daily": daily_storage,
            "decay_rate": decay_rate,
            "rationale_en": f"Strong holding opportunity: Durable commodity with rising mandi arrivals suggests ~₹{gain}/Qtl appreciation in 7 days.",
            "rationale_mr": f"थांबणे फायदेशीर: माल टिकाऊ असून पुढील ७ दिवसांत प्रति क्विंटल अंदाजे ₹{gain} भाववाढ अपेक्षित आहे.",
            "rationale_hi": f"रोकना लाभकारी: टिकाऊ फसल होने से अगले 7 दिनों में लगभग ₹{gain}/क्विंटल भाव बढ़ने का अनुमान है।"
        }

    return {
        "decision": "WAIT" if trend == "UP" else "SELL_NOW",
        "confidence_score": 75,
        "risk_score": risk_score,
        "recommended_holding_days": 5 if trend == "UP" else 0,
        "expected_price_gain": round(modal_price * 0.02, 1) if trend == "UP" else 0.0,
        "storage_cost_daily": daily_storage,
        "decay_rate": decay_rate,
        "rationale_en": "Market conditions steady. Optimal freight pooling recommended.",
        "rationale_mr": "बाजार स्थिर आहे. एकत्र माल पाठवणे फायदेशीर ठरेल.",
        "rationale_hi": "बाज़ार स्थिर है। सामूहिक परिवहन से बेहतर लाभ मिलेगा।"
    }
