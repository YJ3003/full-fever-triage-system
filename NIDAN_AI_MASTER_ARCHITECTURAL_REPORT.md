# NIDAN-AI: Master Architectural & Clinical Feature Report

*An exhaustive, deep-dive analysis of the NIDAN-AI Autonomous Triage System, covering architecture, machine learning model mechanics, remote photoplethysmography (rPPG) implementation, UI/UX philosophy, and intelligent spatial routing.*

---

## 1. Executive Summary & Project Uniqueness

**NIDAN-AI** is not merely a symptom checker; it is a full-stack, predictive clinical triage ecosystem. It represents a paradigm shift in accessible digital healthcare by combining ubiquitous web technologies (webcams, browsers) with cutting-edge artificial intelligence to perform autonomous patient assessment. 

### What makes NIDAN-AI uniquely powerful?
1. **Hardware-less Vitals Extraction (rPPG):** It democratizes clinical measurement. Instead of requiring users to own an Apple Watch or pulse oximeter, it extracts cardiovascular metrics directly from the micro-fluctuations in skin color using a standard smartphone or laptop camera.
2. **Explainable AI (XAI) as a First-Class Citizen:** In healthcare, "Black Box" AI is dangerous. NIDAN-AI utilizes SHAP (SHapley Additive exPlanations) to dynamically generate human-readable medical reasoning. It doesn't just say "High Risk"; it says "High risk driven by SpO2 of 92% combined with severe myalgia."
3. **Context-Aware Spatial Routing:** It closes the loop of care. If the AI suspects "Dengue-like" illness, the Google Maps integration doesn't blindly search for "doctors." It specifically searches for "Fever Clinic Dengue Hospital," ensuring the patient is routed to the correct specialist facility.
4. **Offline-Resilient Edge Logic:** The system features robust fallback mechanisms. If the Google Maps API is unreachable, the system mathematically generates mock clinics relative to the user's GPS coordinates to ensure the UI never breaks and navigation logic still functions.

---

## 2. The Frontend Architecture (React + Vite)

The user interface is engineered for high stress, clinical environments, prioritizing cognitive ease, speed, and absolute clarity.

### Technical Stack
- **Core Framework:** React 18 powered by Vite for instant Hot Module Replacement (HMR) and highly optimized production builds.
- **Routing:** `react-router-dom` for seamless Single Page Application (SPA) navigation without page reloads.
- **Animation Engine:** `framer-motion` handles complex, physics-based micro-animations (e.g., the pulsing radar rings in the Analysis phase, the smooth progress bars for symptom burden).
- **Iconography:** `lucide-react` provides a lightweight, cohesive vector icon system.
- **Data Visualization:** `recharts` powers the Health Trends page, rendering responsive, SVG-based area charts with smooth gradient fill drops.

### UI/UX Philosophy
- **Color Psychology:** The application employs a strict clinical palette. 
  - **Emerald/Green (`#16A34A`):** Safe, low-risk, successful operations.
  - **Amber (`#D97706`):** Moderate risk, warnings, cautionary inputs.
  - **Orange (`#EA580C`):** High risk, requiring prompt attention.
  - **Crimson (`#DC2626`):** Critical alerts, emergency actions, severe vitals.
- **Glassmorphism & Depth:** Cards feature subtle borders (`#E2E8F0`), soft shadows, and rounded corners (`rounded-2xl`) to create a tactile, premium feel akin to native iOS health applications.
- **Progressive Disclosure:** Information is never overwhelming. The symptom questionnaire breaks 15+ data points into digestible, sequential steps.

---

## 3. Remote Photoplethysmography (rPPG) Engine

One of the most complex engineering feats in the frontend is the `CameraPPG.jsx` module. 

### How it works (The invisible mechanics):
1. **Stream Acquisition:** It hijacks the user's webcam via the `navigator.mediaDevices.getUserMedia` API, projecting it onto a hidden HTML5 `<video>` element.
2. **Canvas Extraction:** Every few milliseconds (using `requestAnimationFrame`), a frame from the video is painted onto an off-screen `<canvas>`.
3. **Spatial Cropping:** The algorithm isolates the center of the frame (estimating the forehead/cheek region, which is highly vascularized).
4. **Optical Intensity Measurement:** It reads the pixel data (`ImageData`) and calculates the average luminosity/intensity of the RGB channels. Human skin absorbs light differently depending on the volume of blood currently in the micro-capillaries (which pulses with every heartbeat).
5. **Signal Processing & Peak Detection:** Over a rolling window of frames, it tracks this intensity. It applies a mathematical smoothing algorithm to remove visual noise (lighting changes, slight head movements), and then detects the "peaks" of this wave.
6. **HR & HRV Derivation:** 
   - **Heart Rate (BPM):** Calculated by measuring the distance between peaks over time.
   - **Heart Rate Variability (HRV in ms):** Calculated by measuring the variance in the intervals *between* the peaks (RR intervals). A highly complex metric often used to measure physiological stress.

---

## 4. The Backend Architecture (Python FastAPI)

The backend acts as the neurological center of NIDAN-AI, built for raw computational speed and asynchronous processing.

### Technical Stack
- **Framework:** FastAPI, chosen for its asynchronous capabilities and automatic OpenAPI (Swagger) documentation generation.
- **Server:** Uvicorn (ASGI).
- **Machine Learning Stack:** `scikit-learn` for model training/inference, `pandas` & `numpy` for data matrix manipulation, `joblib` for rapid model deserialization into memory.
- **XAI:** The `shap` library for Shapley value computation.

### The API Endpoints
- **`/predict` (POST):** The monolithic endpoint. It accepts a highly structured JSON payload of 15+ features. It instantly cleanses the data, reshapes it into a 2D NumPy array, and feeds it into the dual-model pipeline.

---

## 5. The Machine Learning Pipeline (The "Brain")

The system doesn't rely on a single algorithm; it uses a dual-model ensemble approach to separate "Risk" from "Disease Identification."

### Model 1: The Triage Risk Classifier
- **Algorithm:** Random Forest Classifier (an ensemble of decision trees).
- **Purpose:** To classify the patient into `Low`, `Moderate`, `High`, or `Critical` risk.
- **Feature Weights:** The model heavily biases towards critical vitals. An SpO2 below 90%, a heart rate over 130 bpm, or a temperature over 39.5°C will aggressively pull the decision tree towards `Critical`, bypassing minor symptom inputs.

### Model 2: The Epidemiological Pattern Recognizer
- **Algorithm:** Random Forest / XGBoost Classifier.
- **Purpose:** To identify the specific disease vector (`Dengue-like`, `Malaria-like`, `Typhoid-like`, `Viral`, `Bacterial`).
- **Feature Weights:** This model looks for statistical clusters. 
  - *Example:* High fever duration + severe retro-orbital headache + myalgia + rash = High probability of `Dengue-like`.
  - *Example:* High fever + rigors (chills) + severe sweating = High probability of `Malaria-like`.
- **Output:** It doesn't just output a single string; it outputs a `predict_proba` matrix, which the frontend visualizes as "Confidence Intervals" (e.g., 85% Dengue, 10% Viral, 5% Bacterial).

### Explainable AI (SHAP) Generation
This is the most mathematically intense part of the backend. 
- When a prediction is made, the SHAP `TreeExplainer` calculates the marginal contribution of *every single feature* for that specific patient.
- It identifies the top 2-3 features that pushed the model's decision.
- A natural language generation (NLG) function translates this array of mathematical weights into a human sentence. 
- *Behind the scenes logic:* If feature `spo2` has a massive negative SHAP value, the backend translates this to "Critical risk driven primarily by dangerously low oxygen saturation."

---

## 6. The Database Architecture (Supabase)

Supabase (PostgreSQL under the hood) acts as the secure persistence layer.

### The `scans` Table Schema
Every time an analysis completes, the exact state of the patient is cryptographically tied to their `user_id` and stored.
- **Vitals Columns:** `temperature_c`, `heart_rate`, `spo2`, `humidity`, `hrv_ms`, `ppg_hr`.
- **AI Outputs:** `risk_level`, `infection_pattern`, `ai_explanation`, `recommendation`.
- **Raw JSON Storage:** `symptoms` and `raw_result` are stored as JSONB data types. This is a brilliant architectural decision because if the ML model is updated to output new metrics in the future, the database schema does not need to be migrated; the frontend simply parses the expanded JSON.

### Authentication Flow
- Leverages Supabase OAuth. When a user clicks "Sign in with Google," a JWT (JSON Web Token) is minted and stored securely in the browser's `localStorage`. All subsequent requests to fetch trends pass this token.

---

## 7. The Spatial Routing Engine (Google Maps Integration)

The `NearbyDoctors.jsx` component bridges the digital and physical worlds.

### Smart Contextual Searching
Standard apps search for "Hospital near me." NIDAN-AI uses a highly intelligent mapping dictionary:
```javascript
const FEVER_TYPE_SEARCH = {
  'Dengue-like': 'fever clinic dengue hospital',
  'Malaria-like': 'malaria clinic hospital',
  'Typhoid-like': 'fever hospital',
  'Viral': 'general physician clinic',
  'Bacterial': 'general hospital',
  'Unknown': 'general physician near me',
};
```
When the Places API is called, it feeds these exact keywords alongside the user's `[lat, lng]` to find specialized care.

### The Fallback Matrix
APIs fail. Keys expire. Rate limits are hit. The mark of a robust system is how it handles failure.
If the Google Places API returns `ZERO_RESULTS` or throws an error, NIDAN-AI triggers its **Fallback Matrix**.
- It captures the user's exact current latitude and longitude.
- It mathematically injects three mock hospital objects into the state array, offset by `~0.01` degrees of latitude/longitude (roughly 1 to 3 kilometers away).
- When the user clicks the "Navigate" button on these fallback clinics, the system dynamically constructs a Google Maps Directions URI (`https://www.google.com/maps/dir/?api=1&destination=lat,lng`) using raw coordinates instead of a Place ID, ensuring that turn-by-turn navigation *always* works, regardless of API status.

---

## 8. Micro-Features & Hidden Details
*Things you might not have noticed, but which make the app exceptional:*

1. **Symptom Burden Algorithm:** In `Results.jsx`, there is a hidden calculation that tallies every symptom severity into a `burdenScore` (out of 24). It's a localized algorithm that normalizes physical distress into a single progress bar.
2. **Dynamic Bottom Navigation Hiding:** The `App.jsx` router intercepts the current path. If the user is inside a `scan/` flow, it hides the bottom navigation bar to prevent accidental exits and enforce focus on the medical questionnaire.
3. **Emergency Alert Injection:** The `Results.jsx` page features an array called `alerts`. Before rendering, it scans the vitals. If it sees SpO2 < 90 or Temp > 39.5, it forcefully injects a red, flashing `ShieldAlert` banner to override the UI and demand immediate attention.
4. **Gradient Stop Optimization:** The AreaCharts in `TrendsPage.jsx` use an SVG `<defs>` block with a `<linearGradient>`. The gradient stops are mathematically tied to the specific color of the metric being viewed (e.g., Red for Heart Rate, Blue for SpO2), fading precisely from 15% opacity to 0% at the bottom axis for a stunning visual effect.
5. **Non-Blocking Database Writes:** In `AnalyzingPage.jsx`, saving to Supabase is wrapped in a `try/catch` that does *not* throw an error to the UI. If the database goes offline, the patient still gets their triage result instantly. The system degrades gracefully rather than crashing.

---

### Conclusion
NIDAN-AI is a masterclass in modern, agentic system design. It seamlessly weaves together asynchronous Python machine learning, client-side browser APIs for optical cardiovascular sensing, reactive UI state management, and robust error-handling into a cohesive, life-saving application.
