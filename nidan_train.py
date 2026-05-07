"""
NIDAN-AI Model Training Script
================================
Trains two Random Forest classifiers:
  Model 1 — Risk Level        : Low | Moderate | High | Critical
  Model 2 — Infection Pattern : Viral-like | Bacterial-like | Respiratory-risk | Heat-stress risk

Datasets required:
  - fever_triage_clinical_6000.csv   (DS2)  <-- primary
  - fever_dataset_5000.csv           (DS3)  <-- merged with DS2

DS1 (vital_signs) is NOT used — it has no symptom data needed for these models.

All features are restricted to what the app can collect:
  Sensors  : body temp, heart rate, SpO2, HRV (derived from PPG)
  App input: age, fever duration, humidity, and 8 symptom flags
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix
import joblib
import shap
import matplotlib.pyplot as plt
import warnings
warnings.filterwarnings("ignore")

# ─── 0. CONFIG ────────────────────────────────────────────────────────────────

DS2_PATH = "fever_triage_clinical_6000.csv"   # update path if needed
DS3_PATH = "fever_dataset_5000.csv"

OUTPUT_MODEL1 = "models/nidan_risk_model.pkl"
OUTPUT_MODEL2 = "models/nidan_pattern_model.pkl"
OUTPUT_ENCODER1 = "models/nidan_risk_encoder.pkl"
OUTPUT_ENCODER2 = "models/nidan_pattern_encoder.pkl"
OUTPUT_FEATURES = "models/nidan_feature_list.pkl"

RANDOM_STATE = 42

# ─── 1. FEATURE COLUMNS ───────────────────────────────────────────────────────
# Only features collectible via sensors or questionnaire

SENSOR_FEATURES = [
    "Temperature_C",      # MLX90614 infrared sensor
    "HR_bpm",             # MAX30102
    "SpO2_%",             # MAX30102
    # HRV is derived from PPG; not in DS2/DS3 directly — added as synthetic proxy below
]

QUESTIONNAIRE_FEATURES = [
    "Age",                # asked in app  (DS3 col name; DS2 = Age_years → renamed)
    "Fever_Duration_days",# asked in app  (DS3: Duration_of_Fever_days → renamed)
    "Headache",           # Y/N symptom
    "Cough",              # Y/N symptom
    "Vomiting",           # Y/N symptom
    "Myalgia",            # Y/N symptom
    "Rash",               # Y/N symptom
    "Rigors",             # Y/N symptom
    "Sweating",           # Y/N symptom
    "Travel_History",     # Y/N context
    # Humidity: not in datasets — will be added as feature at inference time
    # For training we generate a neutral placeholder (50%) so the model learns the slot
]

ALL_FEATURES = SENSOR_FEATURES + QUESTIONNAIRE_FEATURES

# ─── 2. INFECTION PATTERN MAPPING ─────────────────────────────────────────────
# Maps DS2 Fever_Type / DS3 Provisional_Diagnosis → safe 4-class output

PATTERN_MAP = {
    # Viral-like
    "Dengue Fever": "Viral-like",
    "Dengue (Warning Signs)": "Viral-like",
    "Dengue Hemorrhagic Fever": "Viral-like",
    "Chickenpox (Varicella)": "Viral-like",
    "Influenza": "Viral-like",
    "Viral Fever": "Viral-like",
    "COVID-19": "Viral-like",
    "Viral Hepatitis": "Viral-like",
    "Measles (Rubeola)": "Viral-like",
    "Rubella": "Viral-like",
    "Mumps": "Viral-like",
    "Chikungunya": "Viral-like",
    "Zika Fever": "Viral-like",
    "EBV Mononucleosis": "Viral-like",
    "Low-Grade Viral Illness": "Viral-like",
    "Common Cold": "Viral-like",
    "Viral Gastroenteritis": "Viral-like",

    # Bacterial-like
    "Sepsis (Bacterial)": "Bacterial-like",
    "Typhoid Fever": "Bacterial-like",
    "Meningitis (Bacterial)": "Bacterial-like",
    "Urinary Tract Infection (UTI)": "Bacterial-like",
    "Pyelonephritis": "Bacterial-like",
    "Cellulitis": "Bacterial-like",
    "Cellulitis with SIRS": "Bacterial-like",
    "Leptospirosis": "Bacterial-like",
    "Rickettsial Fever": "Bacterial-like",
    "Bacterial Meningitis": "Bacterial-like",
    "Bacterial Gastroenteritis": "Bacterial-like",
    "Abscess / Localized Infection": "Bacterial-like",

    # Respiratory-risk
    "Pneumonia (Bacterial)": "Respiratory-risk",
    "Pneumonia (Viral)": "Respiratory-risk",
    "Tuberculosis (TB)": "Respiratory-risk",
    "COVID Pneumonia": "Respiratory-risk",
    "Bronchitis": "Respiratory-risk",
    "Acute Respiratory Infection": "Respiratory-risk",
    "Respiratory Syncytial Virus (RSV)": "Respiratory-risk",

    # Heat-stress risk
    "Heat Exhaustion": "Heat-stress risk",
    "Heat Stroke": "Heat-stress risk",
    "Malaria": "Heat-stress risk",      # env/vector-borne — grouped here
    "Plasmodium Falciparum Malaria": "Heat-stress risk",
    "Scrub Typhus": "Heat-stress risk",
}

# ─── 3. RISK LEVEL MAPPING ────────────────────────────────────────────────────
# Maps DS2/DS3 Triage_Priority → 4-class risk output

RISK_MAP = {
    "GREEN – Non-Urgent":   "Low",
    "YELLOW – Less Urgent": "Moderate",
    "ORANGE – Urgent":      "High",
    "RED – Immediate":      "Critical",
    # DS3 variants
    "GREEN - Non-Urgent":   "Low",
    "YELLOW - Less Urgent": "Moderate",
    "ORANGE - Urgent":      "High",
    "RED - Immediate":      "Critical",
}

# ─── 4. LOAD & HARMONISE DATASETS ─────────────────────────────────────────────

def load_ds2(path):
    df = pd.read_csv(path)
    df = df.rename(columns={
        "Age_years": "Age",
        "Fever_Duration_days": "Fever_Duration_days",
        "HR_bpm": "HR_bpm",
        "SpO2_%": "SpO2_%",
        "Temperature_C": "Temperature_C",
        "Travel_History": "Travel_History",
    })
    df["source"] = "DS2"
    return df

def load_ds3(path):
    df = pd.read_csv(path)
    df = df.rename(columns={
        "Duration_of_Fever_days": "Fever_Duration_days",
        "HR_bpm": "HR_bpm",
        "SpO2_%": "SpO2_%",
        "Temperature_C": "Temperature_C",
        "Travel_History": "Travel_History",
    })
    df["source"] = "DS3"
    return df

def harmonise(df):
    """Standardise binary symptom columns to 1/0."""
    binary_cols = ["Headache","Cough","Vomiting","Myalgia","Rash",
                   "Rigors","Sweating","Travel_History"]
    for col in binary_cols:
        if col in df.columns:
            df[col] = df[col].map({"Yes": 1, "No": 0, "yes": 1, "no": 0,
                                   True: 1, False: 0, 1: 1, 0: 0})
    return df

print("Loading datasets...")
ds2 = load_ds2(DS2_PATH)
ds3 = load_ds3(DS3_PATH)

ds2 = harmonise(ds2)
ds3 = harmonise(ds3)

merged = pd.concat([ds2, ds3], ignore_index=True)
print(f"  DS2: {len(ds2)} rows | DS3: {len(ds3)} rows | Merged: {len(merged)} rows")

# ─── 5. BUILD LABELS ──────────────────────────────────────────────────────────

# Label 1: Risk level (from Triage_Priority)
merged["risk_label"] = merged["Triage_Priority"].map(RISK_MAP)

# Label 2: Infection pattern (from Fever_Type in DS2, Provisional_Diagnosis in DS3)
merged["pattern_raw"] = merged["Fever_Type"].fillna(merged.get("Provisional_Diagnosis", pd.Series()))
if "Provisional_Diagnosis" in merged.columns:
    merged["pattern_raw"] = merged["pattern_raw"].fillna(merged["Provisional_Diagnosis"])
merged["pattern_label"] = merged["pattern_raw"].map(PATTERN_MAP)

print(f"\nRisk label distribution:\n{merged['risk_label'].value_counts()}")
print(f"\nInfection pattern distribution:\n{merged['pattern_label'].value_counts()}")

# ─── 6. FEATURE ENGINEERING ───────────────────────────────────────────────────

# Add synthetic HRV proxy (not in DS2/DS3; will come from PPG at inference)
# For training: estimate as 1/HR scaled — crude but keeps the feature slot alive
merged["HRV_proxy"] = (1.0 / merged["HR_bpm"].clip(lower=40)) * 1000  # ms proxy

# Add humidity placeholder (50 = neutral; real value comes from sensor at inference)
merged["Humidity"] = 50.0

TRAIN_FEATURES = SENSOR_FEATURES + ["HRV_proxy", "Humidity"] + QUESTIONNAIRE_FEATURES

# Clean feature set
data = merged[TRAIN_FEATURES + ["risk_label", "pattern_label"]].copy()
data = data.dropna(subset=TRAIN_FEATURES)

print(f"\nClean rows after dropping NaN in features: {len(data)}")

# ─── 7. TRAIN MODEL 1 — RISK LEVEL ───────────────────────────────────────────

print("\n" + "="*50)
print("Training Model 1: Risk Level Classifier")
print("="*50)

data_m1 = data.dropna(subset=["risk_label"])
X1 = data_m1[TRAIN_FEATURES]
y1_raw = data_m1["risk_label"]

le1 = LabelEncoder()
y1 = le1.fit_transform(y1_raw)

X1_train, X1_test, y1_train, y1_test = train_test_split(
    X1, y1, test_size=0.2, random_state=RANDOM_STATE, stratify=y1
)

rf1 = RandomForestClassifier(
    n_estimators=200,
    max_depth=12,
    min_samples_leaf=5,
    class_weight="balanced",
    random_state=RANDOM_STATE,
    n_jobs=-1
)
rf1.fit(X1_train, y1_train)

y1_pred = rf1.predict(X1_test)
print(f"\nTest accuracy: {(y1_pred == y1_test).mean():.3f}")
print("\nClassification report:")
print(classification_report(y1_test, y1_pred, target_names=le1.classes_))

joblib.dump(rf1, OUTPUT_MODEL1)
joblib.dump(le1, OUTPUT_ENCODER1)
print(f"Saved: {OUTPUT_MODEL1}, {OUTPUT_ENCODER1}")

# ─── 8. TRAIN MODEL 2 — INFECTION PATTERN ────────────────────────────────────

print("\n" + "="*50)
print("Training Model 2: Infection Pattern Classifier")
print("="*50)

data_m2 = data.dropna(subset=["pattern_label"])
X2 = data_m2[TRAIN_FEATURES]
y2_raw = data_m2["pattern_label"]

le2 = LabelEncoder()
y2 = le2.fit_transform(y2_raw)

X2_train, X2_test, y2_train, y2_test = train_test_split(
    X2, y2, test_size=0.2, random_state=RANDOM_STATE, stratify=y2
)

rf2 = RandomForestClassifier(
    n_estimators=200,
    max_depth=12,
    min_samples_leaf=5,
    class_weight="balanced",
    random_state=RANDOM_STATE,
    n_jobs=-1
)
rf2.fit(X2_train, y2_train)

y2_pred = rf2.predict(X2_test)
print(f"\nTest accuracy: {(y2_pred == y2_test).mean():.3f}")
print("\nClassification report:")
print(classification_report(y2_test, y2_pred, target_names=le2.classes_))

joblib.dump(rf2, OUTPUT_MODEL2)
joblib.dump(le2, OUTPUT_ENCODER2)
print(f"Saved: {OUTPUT_MODEL2}, {OUTPUT_ENCODER2}")

# ─── 9. SAVE FEATURE LIST ─────────────────────────────────────────────────────

joblib.dump(TRAIN_FEATURES, OUTPUT_FEATURES)
print(f"\nFeature order saved: {OUTPUT_FEATURES}")
print(f"Features: {TRAIN_FEATURES}")

# ─── 10. SHAP FEATURE IMPORTANCE ─────────────────────────────────────────────

print("\nGenerating SHAP plots...")

def plot_shap(model, X_sample, label_encoder, title, filename):
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_sample)
    plt.figure(figsize=(10, 6))
    # For multi-class, plot mean absolute SHAP across all classes
    if isinstance(shap_values, list):
        mean_abs = np.mean([np.abs(sv) for sv in shap_values], axis=0)
        shap.summary_plot(mean_abs, X_sample, plot_type="bar",
                          class_names=label_encoder.classes_,
                          show=False)
    else:
        shap.summary_plot(shap_values, X_sample, show=False)
    plt.title(title)
    plt.tight_layout()
    plt.savefig(filename, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"  Saved: {filename}")

sample1 = X1_test.sample(min(200, len(X1_test)), random_state=RANDOM_STATE)
sample2 = X2_test.sample(min(200, len(X2_test)), random_state=RANDOM_STATE)

plot_shap(rf1, sample1, le1, "Model 1 — Feature Importance (Risk Level)",
          "shap_risk_model.png")
plot_shap(rf2, sample2, le2, "Model 2 — Feature Importance (Infection Pattern)",
          "shap_pattern_model.png")

# ─── 11. QUICK INFERENCE TEST ─────────────────────────────────────────────────

print("\n" + "="*50)
print("Quick inference test")
print("="*50)

def predict(temp_c, hr, spo2, age, fever_days,
            headache=0, cough=0, vomiting=0, myalgia=0,
            rash=0, rigors=0, sweating=0, travel=0,
            humidity=50):
    hrv_proxy = (1.0 / max(hr, 40)) * 1000
    row = pd.DataFrame([[
        temp_c, hr, spo2,
        hrv_proxy, humidity,
        age, fever_days,
        headache, cough, vomiting, myalgia,
        rash, rigors, sweating, travel
    ]], columns=TRAIN_FEATURES)

    risk_pred = le1.inverse_transform(rf1.predict(row))[0]
    risk_prob = rf1.predict_proba(row)[0]
    risk_conf = {le1.classes_[i]: round(float(p), 3) for i, p in enumerate(risk_prob)}

    pat_pred = le2.inverse_transform(rf2.predict(row))[0]
    pat_prob = rf2.predict_proba(row)[0]
    pat_conf = {le2.classes_[i]: round(float(p), 3) for i, p in enumerate(pat_prob)}

    print(f"\nInput: Temp={temp_c}°C  HR={hr}bpm  SpO2={spo2}%  Age={age}  "
          f"Fever={fever_days}d  Humidity={humidity}%")
    print(f"  Risk level   : {risk_pred}")
    print(f"  Confidence   : {risk_conf}")
    print(f"  Inf. pattern : {pat_pred}")
    print(f"  Confidence   : {pat_conf}")

# Test case 1: mild fever, no red flags
predict(temp_c=37.9, hr=88, spo2=98, age=28, fever_days=2,
        headache=1, cough=1, humidity=60)

# Test case 2: high fever, dengue-like
predict(temp_c=39.6, hr=110, spo2=95, age=35, fever_days=5,
        headache=1, myalgia=1, rash=1, rigors=1, travel=1, humidity=80)

# Test case 3: critical — low BP signs, high temp
predict(temp_c=40.2, hr=145, spo2=88, age=64, fever_days=4,
        vomiting=1, sweating=1, rigors=1, humidity=55)

print("\nAll done. Files saved:")
for f in [OUTPUT_MODEL1, OUTPUT_MODEL2, OUTPUT_ENCODER1,
          OUTPUT_ENCODER2, OUTPUT_FEATURES,
          "shap_risk_model.png", "shap_pattern_model.png"]:
    print(f"  {f}")
