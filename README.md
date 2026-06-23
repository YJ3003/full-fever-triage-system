# 🩺 NIDAN-AI: The Full Fever Triage System

NIDAN-AI is an advanced, hardware-integrated, AI-driven fever triage system designed for homes, clinics, and remote healthcare. It securely bridges real-time Internet of Things (IoT) sensor data with sophisticated Machine Learning models to accurately predict infection patterns (e.g., Dengue, Malaria, Typhoid) while maintaining a strict deterministic safety net for pediatric and geriatric patients.

---

## 🌟 What Makes NIDAN-AI Unique? (The "Secret Sauce")

This isn't just a simple symptom checker. NIDAN-AI implements several highly advanced clinical paradigms to ensure accuracy and safety:

1. **Geo-Aware Baseline Calibration 🌍**
   * *The Problem:* A body temperature of 37.5°C in freezing winter is a fever, but in a 40°C tropical summer, it might just be normal ambient heat absorption.
   * *The Solution:* The system automatically detects the user's location via a robust 3-tier IP Geolocation fallback chain (`ipapi.co` -> `ipwho.is` -> `geojs.io`). It then pings the **Open-Meteo API** to get the exact real-time ambient temperature and humidity for their city. The Python backend then mathematically normalizes the patient's body temperature before feeding it to the ML model, drastically reducing false positives in tropical regions.

2. **Age-Stratified Deterministic Safety Net 🛡️**
   * Machine Learning models are probabilistic and can sometimes miss rare but critical edge cases. NIDAN-AI uses a hard-coded deterministic rules engine (based on the gold-standard Schmitt-Thompson red flag protocols) that acts as a gatekeeper. 
   * *Example:* If an infant (< 2 years) has a heart rate over 180 bpm, or a geriatric patient (> 65 years) has a temperature below 35.5°C ("cold sepsis"), the deterministic engine instantly overrides the ML model and flags the patient as **Critical**, bypassing standard AI triage.

3. **Explainable AI (XAI) Clinical Reports 🤖**
   * Instead of just spitting out "High Risk: Dengue", NIDAN-AI leverages the **Google Gemini 2.5 Flash** LLM to act as a clinical reasoning engine. It takes the patient's vitals, geo-context, and ML predictions, and generates a structured, punchy, and highly insightful Markdown report explaining *exactly why* the model reached its conclusion.

4. **Wireless Edge IoT Integration 📡**
   * Supports seamless wireless integration with a custom-built ESP8266/ESP32 sensor array. Patients just clip on the sensor, and the data is beamed securely to the backend and pulled live into the React frontend.

---

## 🚀 Comprehensive Feature List

### 🏥 Patient Experience
*   **Authentication & Security:** Supabase-powered OAuth (Google) and Email login to securely store patient histories.
*   **Intelligent Questionnaire:** Collects medical history, pediatric vaccination statuses, core symptoms, and highly specific differential symptoms (like retroorbital pain for Dengue or step-ladder fever for Typhoid).
*   **Live Sensor Fetching OR Manual Entry:** Patients can pull data directly from their IoT device, or manually type it in. Features a live Celsius (C) / Fahrenheit (F) toggle that converts data gracefully.
*   **Historical Trends Page:** A beautiful, Recharts-powered dashboard allowing users to track their SpO2, Heart Rate, and Temperature trends over time.
*   **Nearby Doctors Locator:** Automatically finds relevant healthcare professionals in the user's vicinity based on their detected geolocation.

### 👨‍⚕️ Clinical Tools
*   **Doctor Dashboard:** A dedicated interface for healthcare professionals to review incoming patient triage scans, risk levels, and AI reasoning reports.

---

## 🛠 Technology Stack

**Frontend (The Interface)**
*   **React + Vite:** Lightning-fast frontend tooling.
*   **Framer Motion:** Smooth, premium micro-animations and page transitions.
*   **Tailwind CSS & Custom Glassmorphism:** A stunning, modern, and trustworthy aesthetic.
*   **Supabase:** PostgreSQL database and Authentication.
*   **React-Markdown:** For rendering the Gemini XAI clinical reports.

**Backend (The Brains)**
*   **FastAPI (Python):** High-performance, asynchronous backend API.
*   **Scikit-Learn:** Random Forest classifiers trained on robust clinical datasets to predict both `Risk Level` and `Infection Pattern`.
*   **Google GenAI SDK:** Interfacing with Gemini models for Explainable AI generation.
*   **Pandas & NumPy:** Real-time feature engineering and data manipulation.

**Hardware (The Sensors)**
*   **ESP8266 / NodeMCU:** WiFi-enabled microcontroller.
*   **MLX90614:** Medical-grade contactless IR temperature sensor (I2C).
*   **MAX30102:** High-precision pulse oximeter and heart-rate sensor (I2C).

---

## 🏗️ System Architecture Pipeline

1. **Acquisition:** The user submits a questionnaire and vitals (either manually or via the ESP8266 hardware pinging the `/sensors/update` endpoint).
2. **Contextualization:** The frontend fetches real-time weather and geolocation data and bundles it with the payload.
3. **Safety Check:** The FastAPI `/predict` endpoint runs the payload through the Deterministic Rules Engine.
4. **ML Inference:** If no critical red flags are triggered, the payload is normalized (temp adjusted for climate) and passed through two separate Random Forest models (Risk Model & Pattern Model).
5. **Reasoning:** The predictions and raw data are sent to Gemini, which generates a brief, punchy XAI report.
6. **Storage:** The frontend saves the complete result set to Supabase for historical tracking.

---

## 💻 Running the Project Locally

### 1. Backend Setup
1. Open a terminal in the root directory and create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create a `.env` file and add your Google Gemini API key:
   ```env
   GEMINI_API_KEY=your_actual_key_here
   ```
4. **Generate the ML Models:** You MUST run the training script first to generate the `.pkl` model files:
   ```bash
   python nidan_train.py
   ```
5. Start the server (binds to `0.0.0.0` so your IoT device can reach it):
   ```bash
   uvicorn nidan_api:app --host 0.0.0.0 --port 8000 --reload
   ```

### 2. Frontend Setup
1. Open a new terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   npm install
   ```
2. Set up your Supabase keys in `frontend/.env`:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```

### 3. Hardware Setup
Read the `hardware_setup_guide.md` file for exact wiring diagrams and the C++ code to flash onto your ESP8266 using the Arduino IDE.

---


## 📝 Disclaimer
*This project is built for educational, prototyping, and hackathon purposes. It is NOT intended to replace professional medical advice, diagnosis, or treatment. Always consult a certified healthcare professional.*
