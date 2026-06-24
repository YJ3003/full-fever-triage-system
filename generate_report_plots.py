import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, roc_curve, auc
from sklearn.preprocessing import label_binarize
import joblib
import os
import warnings
warnings.filterwarnings('ignore')

os.makedirs('report_plots', exist_ok=True)

# 1. Load Data (Simplified loading matching nidan_train.py logic)
DS2_PATH = "datasets/fever_triage_clinical_6000.csv"
DS3_PATH = "datasets/fever_dataset_5000.csv"

def load_and_harmonise():
    ds2 = pd.read_csv(DS2_PATH).rename(columns={
        "Age_years": "Age", "Fever_Duration_days": "Fever_Duration_days",
        "HR_bpm": "HR_bpm", "SpO2_%": "SpO2_%", "Temperature_C": "Temperature_C", "Travel_History": "Travel_History"
    })
    ds3 = pd.read_csv(DS3_PATH).rename(columns={
        "Duration_of_Fever_days": "Fever_Duration_days", "HR_bpm": "HR_bpm",
        "SpO2_%": "SpO2_%", "Temperature_C": "Temperature_C", "Travel_History": "Travel_History"
    })
    
    binary_cols = ["Headache","Cough","Vomiting","Myalgia","Rash","Rigors","Sweating","Travel_History"]
    for df in [ds2, ds3]:
        for col in binary_cols:
            if col in df.columns:
                df[col] = df[col].map({"Yes": 1, "No": 0, "yes": 1, "no": 0, True: 1, False: 0, 1: 1, 0: 0})
        new_cols = ["Petechiae", "Retroorbital_Pain", "Cyclical_Fever", "Dark_Urine", "Stomach_Pain", "Bleeding_Tendency"]
        for col in new_cols:
            df[col] = 0

    merged = pd.concat([ds2, ds3], ignore_index=True)
    
    RISK_MAP = {"GREEN – Non-Urgent": "Low", "YELLOW – Less Urgent": "Moderate", "ORANGE – Urgent": "High", "RED – Immediate": "Critical",
                "GREEN - Non-Urgent": "Low", "YELLOW - Less Urgent": "Moderate", "ORANGE - Urgent": "High", "RED - Immediate": "Critical"}
    PATTERN_MAP = {
        "Dengue Fever": "Viral-like", "Dengue (Warning Signs)": "Viral-like", "Dengue Hemorrhagic Fever": "Viral-like",
        "Chickenpox (Varicella)": "Viral-like", "Influenza": "Viral-like", "Viral Fever": "Viral-like", "COVID-19": "Viral-like",
        "Viral Hepatitis": "Viral-like", "Measles (Rubeola)": "Viral-like", "Rubella": "Viral-like", "Mumps": "Viral-like",
        "Chikungunya": "Viral-like", "Zika Fever": "Viral-like", "EBV Mononucleosis": "Viral-like", "Low-Grade Viral Illness": "Viral-like",
        "Common Cold": "Viral-like", "Viral Gastroenteritis": "Viral-like", "Sepsis (Bacterial)": "Bacterial-like",
        "Typhoid Fever": "Bacterial-like", "Meningitis (Bacterial)": "Bacterial-like", "Urinary Tract Infection (UTI)": "Bacterial-like",
        "Pyelonephritis": "Bacterial-like", "Cellulitis": "Bacterial-like", "Cellulitis with SIRS": "Bacterial-like",
        "Leptospirosis": "Bacterial-like", "Rickettsial Fever": "Bacterial-like", "Bacterial Meningitis": "Bacterial-like",
        "Bacterial Gastroenteritis": "Bacterial-like", "Abscess / Localized Infection": "Bacterial-like", "Pneumonia (Bacterial)": "Respiratory-risk",
        "Pneumonia (Viral)": "Respiratory-risk", "Tuberculosis (TB)": "Respiratory-risk", "COVID Pneumonia": "Respiratory-risk",
        "Bronchitis": "Respiratory-risk", "Acute Respiratory Infection": "Respiratory-risk", "Respiratory Syncytial Virus (RSV)": "Respiratory-risk",
        "Heat Exhaustion": "Heat-stress risk", "Heat Stroke": "Heat-stress risk", "Malaria": "Heat-stress risk",
        "Plasmodium Falciparum Malaria": "Heat-stress risk", "Scrub Typhus": "Heat-stress risk",
    }
    merged["risk_label"] = merged["Triage_Priority"].map(RISK_MAP)
    merged["pattern_raw"] = merged["Fever_Type"].fillna(merged.get("Provisional_Diagnosis", pd.Series()))
    if "Provisional_Diagnosis" in merged.columns:
        merged["pattern_raw"] = merged["pattern_raw"].fillna(merged["Provisional_Diagnosis"])
    merged["pattern_label"] = merged["pattern_raw"].map(PATTERN_MAP)
    
    # Missing features handling from training logic
    merged["HRV_proxy"] = (1.0 / merged["HR_bpm"].clip(lower=40)) * 1000
    merged["Humidity"] = 50.0
    
    return merged

merged_data = load_and_harmonise()

# 2. Load Models & Features
rf_risk = joblib.load("models/nidan_risk_model.pkl")
rf_pattern = joblib.load("models/nidan_pattern_model.pkl")
le_risk = joblib.load("models/nidan_risk_encoder.pkl")
le_pattern = joblib.load("models/nidan_pattern_encoder.pkl")
features = joblib.load("models/nidan_feature_list.pkl")

# Filter data
data = merged_data[features + ["risk_label", "pattern_label"]].dropna(subset=features)
X = data[features]

# ==========================================
# PLOT 1: Class Distributions
# ==========================================
plt.figure(figsize=(12, 5))
plt.subplot(1, 2, 1)
sns.countplot(data=merged_data, x='risk_label', order=le_risk.classes_, palette='viridis')
plt.title('Risk Level Class Distribution')
plt.ylabel('Count')

plt.subplot(1, 2, 2)
sns.countplot(data=merged_data, y='pattern_label', order=merged_data['pattern_label'].value_counts().index, palette='magma')
plt.title('Infection Pattern Distribution')
plt.xlabel('Count')
plt.ylabel('')
plt.tight_layout()
plt.savefig('report_plots/class_distributions.png', dpi=150)
plt.close()
print("Saved: report_plots/class_distributions.png")

# ==========================================
# PLOT 2 & 3: Confusion Matrices
# ==========================================
def plot_cm(model, le, label_col, filename, title):
    df_clean = data.dropna(subset=[label_col])
    X_clean = df_clean[features]
    y_true = df_clean[label_col]
    y_pred = le.inverse_transform(model.predict(X_clean))
    
    cm = confusion_matrix(y_true, y_pred, labels=le.classes_)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=le.classes_, yticklabels=le.classes_)
    plt.title(title)
    plt.xlabel('Predicted Label')
    plt.ylabel('True Label')
    plt.tight_layout()
    plt.savefig(filename, dpi=150)
    plt.close()
    print(f"Saved: {filename}")

plot_cm(rf_risk, le_risk, "risk_label", "report_plots/cm_risk.png", "Confusion Matrix - Risk Level")
plot_cm(rf_pattern, le_pattern, "pattern_label", "report_plots/cm_pattern.png", "Confusion Matrix - Infection Pattern")

# ==========================================
# PLOT 4: Random Forest Feature Importances
# ==========================================
def plot_feature_importance(model, title, filename):
    importances = model.feature_importances_
    indices = np.argsort(importances)[::-1]
    
    plt.figure(figsize=(10, 6))
    plt.title(title)
    sns.barplot(x=importances[indices], y=[features[i] for i in indices], palette='rocket')
    plt.xlabel('Relative Importance')
    plt.tight_layout()
    plt.savefig(filename, dpi=150)
    plt.close()
    print(f"Saved: {filename}")

plot_feature_importance(rf_risk, "RF Feature Importances - Risk Level", "report_plots/feat_imp_risk.png")
plot_feature_importance(rf_pattern, "RF Feature Importances - Infection Pattern", "report_plots/feat_imp_pattern.png")

# ==========================================
# PLOT 5: Correlation Heatmap of Features
# ==========================================
plt.figure(figsize=(12, 10))
corr = X.corr()
mask = np.triu(np.ones_like(corr, dtype=bool))
sns.heatmap(corr, mask=mask, cmap='coolwarm', vmax=1, center=0,
            square=True, linewidths=.5, cbar_kws={"shrink": .5})
plt.title('Feature Correlation Matrix')
plt.tight_layout()
plt.savefig('report_plots/feature_correlation.png', dpi=150)
plt.close()
print("Saved: report_plots/feature_correlation.png")

# ==========================================
# PLOT 6: ROC Curve for Risk Model (Multiclass)
# ==========================================
def plot_roc_multiclass(model, le, label_col, title, filename):
    df_clean = data.dropna(subset=[label_col])
    X_clean = df_clean[features]
    y_true = df_clean[label_col]
    
    # Binarize labels
    y_bin = label_binarize(y_true, classes=le.classes_)
    n_classes = y_bin.shape[1]
    
    if n_classes == 1:
        print(f"Skipping ROC for {label_col} - not enough classes.")
        return

    # Predict probabilities
    y_score = model.predict_proba(X_clean)
    
    fpr = dict()
    tpr = dict()
    roc_auc = dict()
    
    plt.figure(figsize=(8, 6))
    for i in range(n_classes):
        # some classes might not be present in y_true, which raises UndefinedMetricWarning
        if sum(y_bin[:, i]) > 0: 
            fpr[i], tpr[i], _ = roc_curve(y_bin[:, i], y_score[:, i])
            roc_auc[i] = auc(fpr[i], tpr[i])
            plt.plot(fpr[i], tpr[i], lw=2, label=f'{le.classes_[i]} (area = {roc_auc[i]:.2f})')

    plt.plot([0, 1], [0, 1], 'k--', lw=2)
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title(title)
    plt.legend(loc="lower right")
    plt.tight_layout()
    plt.savefig(filename, dpi=150)
    plt.close()
    print(f"Saved: {filename}")

plot_roc_multiclass(rf_risk, le_risk, "risk_label", "ROC Curve - Risk Level", "report_plots/roc_risk.png")
# Note: Infection Pattern only has 2 classes in this dataset slice after dropna
df_pat = data.dropna(subset=["pattern_label"])
if len(df_pat["pattern_label"].unique()) > 2:
    plot_roc_multiclass(rf_pattern, le_pattern, "pattern_label", "ROC Curve - Infection Pattern", "report_plots/roc_pattern.png")
else:
    # binary ROC
    X_clean = df_pat[features]
    y_true = df_pat["pattern_label"]
    y_bin = (y_true == le_pattern.classes_[1]).astype(int)
    y_score = rf_pattern.predict_proba(X_clean)[:, 1]
    fpr, tpr, _ = roc_curve(y_bin, y_score)
    roc_auc = auc(fpr, tpr)
    plt.figure(figsize=(8, 6))
    plt.plot(fpr, tpr, color='darkorange', lw=2, label=f'{le_pattern.classes_[1]} (area = {roc_auc:.2f})')
    plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('ROC Curve - Infection Pattern')
    plt.legend(loc="lower right")
    plt.tight_layout()
    plt.savefig('report_plots/roc_pattern.png', dpi=150)
    plt.close()
    print("Saved: report_plots/roc_pattern.png")
