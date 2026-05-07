# NIDAN-AI Triage System: Comprehensive Feature Report & Deployment Guide

## Part 1: Deployment Guide (Step-by-Step)

The NIDAN-AI platform consists of two main components: a React (Vite) frontend and a Python (FastAPI) backend. Because they run as separate services, each requires its own `.env` file configuration and deployment process.

### Step 1: Prepare the Source Code
Ensure your code is pushed to a Git repository (like GitHub). The repository should contain both the `frontend/` directory and the Python backend files (e.g., `nidan_api.py`, `requirements.txt`).

### Step 2: Backend Deployment (Render / Railway / Heroku)
The backend requires a Python environment to run the Machine Learning models via FastAPI. We recommend **Render** or **Railway** for easy deployment.

1. **Create a New Web Service:** Connect your GitHub repository to Render/Railway.
2. **Set the Root Directory:** Leave it as the root directory where `requirements.txt` and `nidan_api.py` are located.
3. **Build Command:** `pip install -r requirements.txt`
4. **Start Command:** `uvicorn nidan_api:app --host 0.0.0.0 --port $PORT`
5. **Backend `.env` Variables:**
   - In your deployment platform's Environment Variables settings, configure any required keys (if your backend connects to an external DB or requires specific CORS settings). For a standard setup, ensure the `CORS_ORIGINS` allows your upcoming frontend URL.
6. **Deploy:** Wait for the backend to build and start. Once live, copy the public backend URL (e.g., `https://nidan-backend.onrender.com`).

### Step 3: Frontend Deployment (Vercel / Netlify)
The frontend is a static React application built with Vite. We recommend **Vercel** for optimal performance.

1. **Create a New Project on Vercel:** Connect the same GitHub repository.
2. **Framework Preset:** Select **Vite**.
3. **Root Directory:** Set this to `frontend`.
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist`
6. **Frontend `.env` Variables:** You MUST add the contents of your frontend `.env` file into the Vercel Environment Variables section.
   - `VITE_SUPABASE_URL`: Your Supabase project URL.
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase public anonymous key.
   - `VITE_GOOGLE_MAPS_API_KEY`: Your Google Maps API key (with Places API and Maps JavaScript API enabled).
   - `VITE_BACKEND_API_URL`: **Set this to the public URL of your deployed backend** (e.g., `https://nidan-backend.onrender.com`).
7. **Deploy:** Click deploy. Once finished, Vercel will provide a public URL for your frontend application.

### Step 4: Final Configuration Updates
1. **Supabase Redirects:** Go to your Supabase Dashboard -> Authentication -> URL Configuration. Add your new Vercel frontend URL to the **Site URL** and **Redirect URLs** so Google OAuth works in production.
2. **Google Maps API Restrictions:** Go to Google Cloud Console and restrict your Maps API key to only accept requests from your new Vercel frontend URL.

---

## Part 2: Comprehensive Feature Report

NIDAN-AI is a state-of-the-art, web-based clinical triage system. It leverages cutting-edge Machine Learning and computer vision to assess patient symptoms and vitals autonomously. Below is a detailed breakdown of all features integrated into the platform.

### 1. User Authentication & Profile Management
- **Secure Google OAuth:** Seamless one-click login using Google accounts, securely managed via Supabase Auth.
- **Persistent Sessions:** User sessions are maintained locally, allowing patients to return to their history without repeated logins.
- **Profile Dashboard:** A dedicated space showing the user's avatar, account details, and quick links to their health records.

### 2. Intelligent Data Collection Workflow
The application guides patients through a medically structured data collection flow:
- **Medical History Questionnaire:** Captures baseline demographic data (Age, Gender) and pre-existing chronic conditions (e.g., Diabetes, Hypertension).
- **Dynamic Symptom Assessment:** A multi-step, intuitive interface collecting detailed symptom data including fever duration, headache intensity, cough, vomiting, myalgia, and travel history (crucial for endemic diseases).
- **Vitals Input Modality:** Users can choose between manually entering clinical vitals (Temperature, SpO2, Heart Rate) or using the experimental Hardware/Camera sensors.

### 3. Contactless Vitals Estimation (Camera PPG)
One of the most advanced frontend features is the integration of **Photoplethysmography (PPG)** via standard webcams.
- **Real-Time Face Tracking:** Uses the user's camera feed to isolate regions of interest (ROI) on the face (forehead/cheeks).
- **Micro-Color Variance Detection:** Analyzes the subtle red-channel color changes in the skin caused by blood volumetric pulses.
- **Heart Rate & HRV Calculation:** Processes the optical signal to estimate Heart Rate (BPM) and Heart Rate Variability (HRV) entirely client-side, reducing the need for external hardware sensors.

### 4. Advanced AI Analytics & Modeling (The "Model Work")
The core intelligence of NIDAN-AI resides in its Python FastAPI backend, which houses the Machine Learning models. The "Model Work" is characterized by the following highlights:
- **Multi-Factor Predictive Risk Assessment:** The model takes 15+ features (vitals, symptoms, demographics) and processes them through an ensemble model (e.g., Random Forest / XGBoost) to classify the patient's immediate triage risk into four categories: `Low`, `Moderate`, `High`, and `Critical`.
- **Infection Pattern Recognition:** Beyond simple risk, a secondary classifier maps the specific constellation of symptoms against known epidemiological patterns to predict the likely vector, returning probabilities for `Dengue-like`, `Malaria-like`, `Typhoid-like`, `Viral`, and `Bacterial` infections.
- **Explainable AI (XAI) Integration:** A critical component for clinical trust. The backend utilizes SHAP (SHapley Additive exPlanations) to dynamically generate human-readable medical insights. The AI literally explains *why* it made a specific prediction (e.g., "The combination of severe myalgia and low SpO2 heavily influenced the High Risk classification").
- **Symptom Burden Indexing:** An algorithm that weights symptom severity into a singular "Burden Score," providing a standardized metric for physical distress.

### 5. Detailed Results & Triage Reporting
Upon completion of the analysis, the user is presented with a highly detailed, clinical-grade report:
- **Emergency Alerts:** Immediate, highly visible warnings for dangerous vitals (e.g., SpO2 < 90%).
- **Triage Status Card:** A color-coded display indicating the overall Risk Level and immediate recommended action.
- **Confidence Intervals:** Visual progress bars displaying the statistical probability of various infection patterns.
- **AI Health Reasoning:** The direct textual output from the Explainable AI model, translating complex data into understandable insights.
- **Vitals Summary Grid:** A clear presentation of recorded vitals juxtaposed against normal clinical ranges.

### 6. Health Trends & Historical Tracking
The **Reports Page (Trends)** transforms single-point data into longitudinal health intelligence.
- **Time-Series Interactive Charts:** Beautiful, animated area charts using Recharts that visualize Temperature, SpO2, Heart Rate, and Symptom Burden over time.
- **Metric Analytics:** Automatic calculation of Averages, Peaks, and Lows for the selected timeframe.
- **Latest Scan Analysis Summary:** (Newly added feature) Displays a dedicated summary card of the absolute latest triage result at the top of the trends page. This allows users to instantly review their most recent risk level, pattern, and access the full detailed report without navigating back through the scan process.
- **Historical Scan Log:** A scrollable ledger of all past scans, stamped with date, time, predicted pattern, and risk level.

### 7. Smart Routing & Google Maps Integration
NIDAN-AI closes the loop between diagnosis and treatment via the **Nearby Doctors** feature.
- **Geolocation:** Automatically requests and utilizes the user's GPS coordinates.
- **Context-Aware Smart Search:** The map doesn't just search for "hospitals." It dynamically alters its Google Maps Places API search query based on the AI's predicted infection pattern (e.g., if the AI predicts Dengue, it searches for `fever clinic dengue hospital`).
- **Interactive Map & Nearby List:** Displays an embedded, styled Google Map with custom markers for medical facilities.
- **Direct Navigation Integration:** (Newly enhanced feature) Below the map, a scrollable list of nearby hospitals is generated. When a user taps a specific hospital card, they are immediately redirected to the native Google Maps application or website with turn-by-turn navigation already pre-configured from their current location to the hospital's exact coordinates.

### Conclusion
NIDAN-AI represents a cohesive fusion of modern web design, client-side sensor extraction, and advanced explainable machine learning. It provides a complete, end-to-end pipeline from symptom collection to actionable medical routing, serving as a powerful demonstration of accessible digital health triage.
