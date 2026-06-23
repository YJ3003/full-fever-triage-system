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
from google import genai
from dotenv import load_dotenv
import asyncio

load_dotenv(override=True)

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
    gemini_client = genai.Client(api_key=gemini_key.strip())
else:
    gemini_client = None

# ─── MODEL LOADING ────────────────────────────────────────────────────────────

MODEL_FILES = {
    "risk_model":       "models/nidan_risk_model.pkl",
    "pattern_model":    "models/nidan_pattern_model.pkl",
    "risk_encoder":     "models/nidan_risk_encoder.pkl",
    "pattern_encoder":  "models/nidan_pattern_encoder.pkl",
    "feature_list":     "models/nidan_feature_list.pkl",
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
    gender:         Optional[str] = Field(None, description="Patient gender")
    fever_days:     int   = Field(..., ge=0, le=60,   description="Number of days with fever")
    medical_history: Optional[str] = Field(None, description="Pre-existing medical conditions")

    # Symptom flags (0-3 severity)
    headache:       int = Field(0, ge=0, le=3, description="Headache severity")
    cough:          int = Field(0, ge=0, le=3, description="Cough severity")
    vomiting:       int = Field(0, ge=0, le=3, description="Vomiting severity")
    myalgia:        int = Field(0, ge=0, le=3, description="Muscle aches (myalgia) severity")
    rash:           int = Field(0, ge=0, le=3, description="Rash severity")
    rigors:         int = Field(0, ge=0, le=3, description="Chills / rigors severity")
    sweating:       int = Field(0, ge=0, le=3, description="Heavy sweating severity")
    travel_history: int = Field(0, ge=0, le=3, description="Recent travel outside home region")

    # New differential symptom flags (0-3 severity)
    petechiae:         int = Field(0, ge=0, le=3, description="Tiny red/purple spots on skin")
    retroorbital_pain: int = Field(0, ge=0, le=3, description="Pain behind the eyes")
    cyclical_fever:    int = Field(0, ge=0, le=3, description="Fever coming in regular waves")
    dark_urine:        int = Field(0, ge=0, le=3, description="Dark or less frequent urine")
    stomach_pain:      int = Field(0, ge=0, le=3, description="Stomach pain or nausea")
    bleeding_tendency: int = Field(0, ge=0, le=3, description="Bleeding gums, nose bleeds, easy bruising")

    # Geo-aware fields
    ambient_temp_c: Optional[float] = Field(None, description="Ambient temperature in Celsius")
    location_zone:  Optional[str]   = Field("tropical", description="Climate zone (e.g., tropical, temperate)")

    # Pediatric fields
    recent_vaccination: bool = Field(False, description="Whether the pediatric patient had a recent vaccination")

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
        "Headache":            1 if inp.headache > 0 else 0,
        "Cough":               1 if inp.cough > 0 else 0,
        "Vomiting":            1 if inp.vomiting > 0 else 0,
        "Myalgia":             1 if inp.myalgia > 0 else 0,
        "Rash":                1 if inp.rash > 0 else 0,
        "Rigors":              1 if inp.rigors > 0 else 0,
        "Sweating":            1 if inp.sweating > 0 else 0,
        "Travel_History":      1 if inp.travel_history > 0 else 0,
    }
    return pd.DataFrame([raw], columns=feature_list)

def top_features(model, feature_list: list, n: int = 3) -> list:
    importances = model.feature_importances_
    top_idx = np.argsort(importances)[::-1][:n]
    return [feature_list[i] for i in top_idx]

# ─── CORE PREDICTION LOGIC ────────────────────────────────────────────────────

async def generate_ai_explanation(inp: TriageInput, risk_label: str, pat_label: str) -> str:
    if not gemini_client:
        return "AI reasoning unavailable. Please consult a doctor."
    prompt = f"""
    Act as a professional medical triage AI for a system called NIDAN-AI.
    Patient details: Age {inp.age}, Fever for {inp.fever_days} days. Climate Zone: {inp.location_zone}.
    Pediatric Vaccination Status: {'Yes (Within 48hrs)' if inp.recent_vaccination else 'No/Not Applicable'}.
    Medical History: {inp.medical_history or 'None provided'}.
    Vitals: Temp {inp.temperature_c}C (ambient: {inp.ambient_temp_c or 'unknown'}C), HR {inp.heart_rate}bpm, SpO2 {inp.spo2}%.
    Core Symptoms severity (0-3): Headache({inp.headache}), Cough({inp.cough}), Vomiting({inp.vomiting}), Myalgia({inp.myalgia}), Rash({inp.rash}), Rigors({inp.rigors}), Sweating({inp.sweating}), Travel({inp.travel_history}).
    Differential Symptoms (0-3): Petechiae({inp.petechiae}), Retroorbital Pain({inp.retroorbital_pain}), Cyclical Fever({inp.cyclical_fever}), Dark Urine({inp.dark_urine}), Stomach Pain({inp.stomach_pain}), Bleeding Tendency({inp.bleeding_tendency}).
    
    The ML model has classified the risk level as '{risk_label}' and the suspected infection pattern as '{pat_label}'.
    
    Task: Write a highly detailed, professional clinical reasoning report (Explainable AI Analysis) explaining exactly *why* this classification was reached. Format the response in Markdown.
    Include the following sections:
    1. **Primary Clinical Assessment**: A summary of the risk level ({risk_label}) and the primary suspected fever pattern ({pat_label}).
    2. **Vital Signs & Geo-Calibration**: Deeply analyze the provided vitals. Note that the patient is in a {inp.location_zone} climate with an ambient temperature of {inp.ambient_temp_c}C. Explicitly explain how this geographic location and ambient heat alters their baseline fever expectation (e.g., in tropical climates, core temperatures naturally run slightly higher, preventing false alarms). If the patient had a recent pediatric vaccination, explicitly weigh this as a highly likely cause for the fever.
    3. **Symptomatic Evidence**: Analyze the specific combination of symptoms. Deeply analyze the 'Differential Symptoms' which are highly specific markers for tropical diseases (e.g., retroorbital pain/petechiae/bleeding for Dengue, cyclical fever/rigors/dark urine for Malaria, step-ladder fever for Typhoid). Link these precisely to the suspected pattern.
    4. **Recommendations & Precautions**: Actionable medical advice based on this specific profile.
    
    Be thorough, clinical, but accessible. Do not mention that you are an AI or Gemini. Act as the clinical reasoning engine. Do not provide a definitive medical diagnosis, refer to it as a "probabilistic triage assessment".
    """
    try:
        def call_gemini():
            return gemini_client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
        # Run synchronous generate_content in thread pool with a long timeout to allow for Google rate limiting delays
        response = await asyncio.wait_for(asyncio.to_thread(call_gemini), timeout=90.0)
        return response.text.strip()
    except asyncio.TimeoutError:
        print("Gemini error: Timeout exceeded (90s). Rate limit or high load.")
        return "AI Analysis timed out due to high API load or rate limits. Please try running another scan in a few minutes."
    except Exception as e:
        print(f"Gemini error: {e}")
        return "Explanation could not be generated due to an API error. Please try again."

def normalize_body_temperature(body_temp_c: float, ambient_temp_c: Optional[float], location_zone: str) -> float:
    ZONE_BASELINE_OFFSET = {
        "tropical": 0.3,
        "subtropical": 0.15,
        "temperate": 0.0,
        "arid": 0.2
    }
    baseline_offset = ZONE_BASELINE_OFFSET.get((location_zone or "").lower(), 0.15)
    ambient_offset = 0.1 if ambient_temp_c is not None and ambient_temp_c > 35 else 0.0
    total_offset = baseline_offset + ambient_offset
    normalized_temp = body_temp_c - total_offset
    return max(35.0, normalized_temp)

async def run_prediction(inp: TriageInput) -> TriageOutput:
    feature_list  = models["feature_list"]
    risk_model    = models["risk_model"]
    pattern_model = models["pattern_model"]
    risk_enc      = models["risk_encoder"]
    pattern_enc   = models["pattern_encoder"]

    # Normalize temperature for the ML model based on geo-context
    normalized_temp = normalize_body_temperature(inp.temperature_c, inp.ambient_temp_c, inp.location_zone)
    inp_for_model = inp.model_copy(update={"temperature_c": normalized_temp})

    row = build_feature_row(inp_for_model, feature_list)

    # Model 1 — risk level
    risk_pred_idx   = risk_model.predict(row)[0]
    risk_label      = risk_enc.inverse_transform([risk_pred_idx])[0]
    risk_proba      = risk_model.predict_proba(row)[0]
    risk_confidence = {risk_enc.classes_[i]: round(float(p), 3) for i, p in enumerate(risk_proba)}

    # Pediatric Vaccination Override
    if inp.recent_vaccination and inp.age <= 12:
        if risk_label in ["High", "Moderate"]:
            risk_label = "Low" if risk_label == "Moderate" else "Moderate"
            if risk_label in risk_confidence:
                risk_confidence[risk_label] = 0.85

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
            "gender":        inp.gender,
            "medical_history": inp.medical_history,
            "symptom_flags": {
                "headache": inp.headache, "cough": inp.cough,
                "vomiting": inp.vomiting, "myalgia": inp.myalgia,
                "rash": inp.rash, "rigors": inp.rigors,
                "sweating": inp.sweating, "travel": inp.travel_history,
                "petechiae": inp.petechiae, "retroorbital_pain": inp.retroorbital_pain,
                "cyclical_fever": inp.cyclical_fever, "dark_urine": inp.dark_urine,
                "stomach_pain": inp.stomach_pain, "bleeding_tendency": inp.bleeding_tendency
            },
            "geo_context": {
                "ambient_temp_c": inp.ambient_temp_c,
                "location_zone": inp.location_zone
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

class GeminiKeyInput(BaseModel):
    api_key: str

@app.post("/config/gemini_key", summary="Update Gemini API Key for Explainable AI")
def update_gemini_key(req: GeminiKeyInput):
    global gemini_client
    try:
        gemini_client = genai.Client(api_key=req.api_key)
        return {"status": "success", "message": "Gemini API key updated successfully."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


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
