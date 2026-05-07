# NIDAN-AI: Multi-Modal Intelligent Fever Triage System
**Project Report & Technical Overview**

## 1. Project Abstract
NIDAN-AI is a portable, intelligent, multi-modal fever triage system designed to bridge the gap between preliminary symptom tracking and professional medical diagnosis. By combining hardware sensor telemetry, smartphone-based physiological analysis, and a sophisticated dual-stage Machine Learning diagnostic engine, NIDAN-AI rapidly categorizes patients into risk tiers and predicts likely infection patterns (e.g., Dengue, Malaria, Typhoid). 

## 2. Technical Novelty & Innovation
The primary novelty of NIDAN-AI lies in its holistic, multi-modal approach to patient triage:

1.  **Hybrid Hardware-Software Vitals Collection**:
    *   **Hardware Sensors**: Direct integration with ESP32 microcontrollers attached to MAX30102 (SpO2/Heart Rate) and MLX90614 (Temperature) sensors allows for clinical-grade vital sign fetching.
    *   **Smartphone rPPG (Photoplethysmography)**: In the absence of hardware sensors, the system leverages the user's smartphone camera to capture micro-fluctuations in skin color (green channel) to accurately estimate Heart Rate and Heart Rate Variability (HRV) — a strong proxy for autonomic nervous system stress during febrile illness.
2.  **Symptom Burden Indexing**: A dynamic scoring system that quantifies subjective symptoms (rigors, myalgia, sweating) into a normalized mathematical vector.
3.  **Smart Location Triage**: Based on the predicted infection pattern, the system automatically queries geographic databases to route the patient to specialized care (e.g., routing suspected Dengue cases to fever clinics).

## 3. The Core Diagnostic Engine (Machine Learning Model)
At the heart of NIDAN-AI is a custom-trained **Dual-Stage Random Forest** classification model. This architecture was explicitly chosen over deep learning alternatives for several critical advantages:

### Pros of the Custom ML Model:
*   **Decoupled Architecture**: The engine runs two independent models simultaneously. Model A predicts the strict **Risk Level** (Low, Moderate, High, Critical) based heavily on vital thresholds, while Model B predicts the **Infection Pattern** based heavily on symptom combinations and fever duration.
*   **Extreme Low Latency**: Tree-based algorithms offer near-instantaneous inference times, allowing the system to run on constrained edge environments or lightweight cloud instances without expensive GPU acceleration.
*   **High Interpretability & Feature Importance**: Unlike "black box" neural networks, the Random Forest model allows us to extract exact feature importance matrices. We know precisely *why* a prediction was made (e.g., "High Risk was flagged primarily due to SpO2 < 92% combined with > 5 days of fever").
*   **Robustness to Missing Data**: The algorithm gracefully handles missing or "skipped" questionnaire inputs by relying on non-linear decision boundaries formed by the physical vitals.

## 4. Explainable AI (XAI) & Clinical Reasoning Layer
A significant challenge in medical AI is the "black box" problem—patients and doctors are often given a probability score with no context. 

NIDAN-AI solves this through an advanced **Explainable AI (XAI) Clinical Reasoning Layer**. 
Once the Random Forest engine outputs its mathematical probabilities, the data (vitals, symptoms, and statistical confidence scores) is fed into our proprietary Natural Language Processing (NLP) module. 

This NLP module acts as a "digital doctor", translating raw statistical vectors into human-readable clinical insights. Instead of telling a patient they have a "78% probability of Class 3 severity", the Explainable AI layer generates a professional, contextual explanation: *"Based on your elevated temperature and prolonged fever duration, combined with significant muscle aches, your risk profile is currently elevated. Immediate consultation is advised."*

This approach ensures absolute transparency, increases patient trust, and ensures the AI is acting as a triage assistant rather than attempting definitive diagnosis.

## 5. Security & Data Architecture
*   **Row-Level Security (RLS)**: Patient profiles and longitudinal scan histories are stored in a secure Postgres database utilizing strict RLS policies. Health data is cryptographically tied to the user's OAuth identity, ensuring zero cross-tenant data leakage.
*   **Longitudinal Tracking**: The application automatically graphs the patient's vitals (Temperature, SpO2, HRV) across multiple days, providing doctors with a crucial "fever curve" that aids in differentiating viral from bacterial infections.
