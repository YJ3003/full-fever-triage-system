"""
NIDAN-AI API Wrapper
=====================
FastAPI server exposing the two trained Random Forest models.

Run:
    uvicorn nidan_api:app --reload --port 8000

Then open:
    http://localhost:8000/docs   (Swagger UI)
    http://localhost:8000/redoc  (ReDoc UI)
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List
import joblib
import numpy as np
import pandas as pd
import os
import traceback
from fastapi.middleware.cors import CORSMiddleware
import motor.motor_asyncio
import google.generativeai as genai
from dotenv import load_dotenv
import asyncio

load_dotenv()

# ─── APP SETUP ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="NIDAN-AI Triage API",
    description=(
        "Portable fever triage system. "
        "Takes sensor readings + symptom questionnaire. "
        "Returns risk level and infection pattern."
    ),
    version="1.0.0",
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Setup
mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
client = motor.motor_asyncio.AsyncIOMotorClient(mongo_uri)
db = client.nidan_ai

# Gemini Setup
gemini_key = os.getenv("GEMINI_API_KEY")
if gemini_key:
    genai.configure(api_key=gemini_key)
    gemini_model = genai.GenerativeModel('gemini-1.5-flash')
else:
    gemini_model = None

# ─── MODEL LOADING ────────────────────────────────────────────────────────────

MODEL_FILES = {
    "risk_model":       "nidan_risk_model.pkl",
    "pattern_model":    "nidan_pattern_model.pkl",
    "risk_encoder":     "nidan_risk_encoder.pkl",
    "pattern_encoder":  "nidan_pattern_encoder.pkl",
    "feature_list":     "nidan_feature_list.pkl",
}

models = {}

def load_models():
    missing = [v for v in MODEL_FILES.values() if not os.path.exists(v)]
    if missing:
        print(f"WARNING: Model files not found: {missing}")
        print("Run nidan_train.py first to generate the models.")
        return False
    for key, path in MODEL_FILES.items():
        models[key] = joblib.load(path)
    print("Models loaded successfully.")
    return True

models_loaded = load_models()

# ─── RECOMMENDATIONS ──────────────────────────────────────────────────────────

RECOMMENDATIONS = {
    "Low":      "Rest at home, stay hydrated, and monitor your symptoms. Re-assess if symptoms worsen or persist beyond 48 hours.",
    "Moderate": "Consult a doctor within 24 hours. Keep monitoring your temperature. Avoid strenuous activity.",
    "High":     "See a doctor today. Do not delay. Bring this report with you.",
    "Critical": "Go to the emergency department immediately. This is urgent.",
}

# ─── INPUT SCHEMA ─────────────────────────────────────────────────────────────

class TriageInput(BaseModel):
    # Sensor inputs
    temperature_c:  float = Field(..., ge=35.0, le=43.0, description="Body temperature in Celsius (MLX90614)")
    heart_rate:     int   = Field(..., ge=30, le=220,    description="Heart rate in bpm (MAX30102)")
    spo2:           int   = Field(..., ge=70, le=100,    description="Blood oxygen saturation % (MAX30102)")
    hrv:            Optional[float] = Field(None, description="Heart rate variability in ms (PPG-derived). Auto-computed if omitted.")
    humidity:       Optional[float] = Field(50.0, ge=0, le=100, description="Ambient humidity % from env sensor. Default 50.")

    # Questionnaire inputs
    age:            int   = Field(..., ge=0, le=120,  description="Patient age in years")
    fever_days:     int   = Field(..., ge=0, le=60,   description="Number of days with fever")

    # Symptom flags (0 = No, 1 = Yes)
    headache:       int = Field(0, ge=0, le=1, description="Headache present")
    cough:          int = Field(0, ge=0, le=1, description="Cough present")
    vomiting:       int = Field(0, ge=0, le=1, description="Vomiting present")
    myalgia:        int = Field(0, ge=0, le=1, description="Muscle aches (myalgia)")
    rash:           int = Field(0, ge=0, le=1, description="Rash present")
    rigors:         int = Field(0, ge=0, le=1, description="Chills / rigors present")
    sweating:       int = Field(0, ge=0, le=1, description="Heavy sweating")
    travel_history: int = Field(0, ge=0, le=1, description="Recent travel outside home region")

    model_config = {
        "json_schema_extra": {
            "examples": [{
                "temperature_c": 39.2,
                "heart_rate": 110,
                "spo2": 96,
                "hrv": 15.0,
                "humidity": 65.0,
                "age": 30,
                "fever_days": 3,
                "headache": 1,
                "cough": 0,
                "vomiting": 0,
                "myalgia": 1,
                "rash": 0,
                "rigors": 1,
                "sweating": 1,
                "travel_history": 0
            }]
        }
    }


class TriageOutput(BaseModel):
    risk_level:          str
    risk_confidence:     dict
    infection_pattern:   str
    pattern_confidence:  dict
    top_risk_features:   List[str]
    recommendation:      str
    ai_explanation:      Optional[str] = None
    input_summary:       dict

# ─── HELPERS ──────────────────────────────────────────────────────────────────

def build_feature_row(inp: TriageInput, feature_list: list) -> pd.DataFrame:
    hrv = inp.hrv if inp.hrv is not None else (1.0 / max(inp.heart_rate, 40)) * 1000
    raw = {
        "Temperature_C":       inp.temperature_c,
        "HR_bpm":              inp.heart_rate,
        "SpO2_%":              inp.spo2,
        "HRV_proxy":           hrv,
        "Humidity":            inp.humidity if inp.humidity is not None else 50.0,
        "Age":                 inp.age,
        "Fever_Duration_days": inp.fever_days,
        "Headache":            inp.headache,
        "Cough":               inp.cough,
        "Vomiting":            inp.vomiting,
        "Myalgia":             inp.myalgia,
        "Rash":                inp.rash,
        "Rigors":              inp.rigors,
        "Sweating":            inp.sweating,
        "Travel_History":      inp.travel_history,
    }
    return pd.DataFrame([raw], columns=feature_list)

def top_features(model, feature_list: list, n: int = 3) -> list:
    importances = model.feature_importances_
    top_idx = np.argsort(importances)[::-1][:n]
    return [feature_list[i] for i in top_idx]

# ─── CORE PREDICTION LOGIC ────────────────────────────────────────────────────

async def generate_ai_explanation(inp: TriageInput, risk_label: str, pat_label: str) -> str:
    if not gemini_model:
        return "AI reasoning unavailable. Please consult a doctor."
    prompt = f"""
    Act as a professional medical triage AI for a system called NIDAN-AI.
    Patient details: Age {inp.age}, Fever for {inp.fever_days} days.
    Vitals: Temp {inp.temperature_c}C, HR {inp.heart_rate}bpm, SpO2 {inp.spo2}%.
    Symptoms: Headache({inp.headache}), Cough({inp.cough}), Vomiting({inp.vomiting}), Myalgia({inp.myalgia}), Rash({inp.rash}), Rigors({inp.rigors}), Sweating({inp.sweating}), Travel({inp.travel_history}).
    The ML model has classified the risk level as '{risk_label}' and pattern as '{pat_label}'.
    Provide a professional, clinical-sounding natural language explanation of these results in 2-3 short sentences. 
    Do not mention you are Gemini or AI. Just explain the triage reasoning clearly. Do not give direct disease diagnosis.
    """
    try:
        # Run synchronous generate_content in thread pool
        response = await asyncio.to_thread(gemini_model.generate_content, prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Gemini error: {e}")
        return "Explanation could not be generated."

async def run_prediction(inp: TriageInput) -> TriageOutput:
    feature_list  = models["feature_list"]
    risk_model    = models["risk_model"]
    pattern_model = models["pattern_model"]
    risk_enc      = models["risk_encoder"]
    pattern_enc   = models["pattern_encoder"]

    row = build_feature_row(inp, feature_list)

    # Model 1 — risk level
    risk_pred_idx   = risk_model.predict(row)[0]
    risk_label      = risk_enc.inverse_transform([risk_pred_idx])[0]
    risk_proba      = risk_model.predict_proba(row)[0]
    risk_confidence = {risk_enc.classes_[i]: round(float(p), 3) for i, p in enumerate(risk_proba)}

    # Model 2 — infection pattern
    pat_pred_idx   = pattern_model.predict(row)[0]
    pat_label      = pattern_enc.inverse_transform([pat_pred_idx])[0]
    pat_proba      = pattern_model.predict_proba(row)[0]
    pat_confidence = {pattern_enc.classes_[i]: round(float(p), 3) for i, p in enumerate(pat_proba)}

    top_feats = top_features(risk_model, feature_list, n=3)
    
    ai_explanation = await generate_ai_explanation(inp, risk_label, pat_label)
    
    output = TriageOutput(
        risk_level         = risk_label,
        risk_confidence    = risk_confidence,
        infection_pattern  = pat_label,
        pattern_confidence = pat_confidence,
        top_risk_features  = top_feats,
        recommendation     = RECOMMENDATIONS.get(risk_label, "Please consult a doctor."),
        ai_explanation     = ai_explanation,
        input_summary      = {
            "temperature_c": inp.temperature_c,
            "heart_rate":    inp.heart_rate,
            "spo2":          inp.spo2,
            "fever_days":    inp.fever_days,
            "symptom_flags": {
                "headache": inp.headache, "cough": inp.cough,
                "vomiting": inp.vomiting, "myalgia": inp.myalgia,
                "rash": inp.rash, "rigors": inp.rigors,
                "sweating": inp.sweating, "travel": inp.travel_history
            }
        }
    )
    
    try:
        # Save to DB
        await db.reports.insert_one(output.model_dump())
    except Exception as e:
        print(f"MongoDB save error: {e}")

    return output

# ─── ROUTES ───────────────────────────────────────────────────────────────────

@app.get("/health", summary="Model health check")
def health():
    if not models_loaded:
        return JSONResponse(status_code=503, content={
            "status": "unavailable",
            "message": "Models not loaded. Run nidan_train.py first."
        })
    return {
        "status": "ok",
        "models_loaded": list(MODEL_FILES.keys()),
        "feature_count": len(models.get("feature_list", [])),
    }


@app.get("/features", summary="List expected input features")
def features():
    if not models_loaded:
        raise HTTPException(status_code=503, detail="Models not loaded.")
    fl = models["feature_list"]
    sensor_cols = {"Temperature_C", "HR_bpm", "SpO2_%", "HRV_proxy", "Humidity"}
    return {
        "feature_count":          len(fl),
        "features":               fl,
        "sensor_features":        [f for f in fl if f in sensor_cols],
        "questionnaire_features": [f for f in fl if f not in sensor_cols],
    }


@app.post("/predict", response_model=TriageOutput, summary="Run triage prediction")
async def predict(inp: TriageInput):
    if not models_loaded:
        raise HTTPException(status_code=503, detail="Models not loaded. Run nidan_train.py first.")
    try:
        return await run_prediction(inp)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}\n{traceback.format_exc()}")


@app.post("/predict/batch", summary="Batch predict — list of patient inputs")
async def predict_batch(inputs: List[TriageInput]):
    """Run predictions on multiple patients at once."""
    if not models_loaded:
        raise HTTPException(status_code=503, detail="Models not loaded.")
    try:
        return await asyncio.gather(*(run_prediction(inp) for inp in inputs))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch prediction error: {str(e)}")


# ─── DEV RUN ──────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("nidan_api:app", host="0.0.0.0", port=8000, reload=True)
