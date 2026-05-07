# NIDAN-AI — COMPLETE PROJECT GENERATION JSON PROMPT

## PROJECT TITLE
NIDAN-AI: Portable Multi-Modal AI-Based Fever Triage and Explainable Health Risk Assessment Platform

---

# CORE PROJECT OBJECTIVE
Build a clean, professional, mobile-first AI-powered healthcare triage platform that combines:

- Medical questionnaire analysis
- Sensor-based physiological monitoring
- Smartphone camera PPG analysis
- Machine learning risk prediction
- Explainable AI reasoning
- Daily fever trend tracking
- Smart healthcare recommendations
- Emergency alert system

The platform must look like a real healthcare startup product and NOT like an AI-generated dashboard.

The system should act as a first-level health triage assistant and NOT a medical diagnosis system.

---

# MAIN GOAL OF THE PLATFORM
The platform should:

1. Collect user medical information and symptoms
2. Collect hardware sensor data from ESP32
3. Collect optional PPG pulse signal from mobile camera
4. Send all collected data to backend ML models
5. Predict:
   - Fever triage level
   - Infection probability patterns
6. Generate explainable AI reasoning internally
7. Display risk analysis in a clean medical dashboard
8. Store all readings for daily trend analysis
9. Trigger emergency alerts when thresholds are crossed
10. Work smoothly on both mobile and desktop

---

# TECH STACK

## FRONTEND
- React.js
- Tailwind CSS
- React Router
- Axios
- Recharts for graphs
- Framer Motion for animations

## BACKEND
- FastAPI
- Python
- Uvicorn

## DATABASE
- MongoDB

## MACHINE LEARNING
- Random Forest Model 1 → Risk Level Prediction
- Random Forest Model 2 → Infection Pattern Prediction

## AI REASONING LAYER
- Gemini API (internal only)
- API key hidden completely in backend
- Users should NEVER know Gemini is used

## HARDWARE
- ESP32
- MLX90614 → Temperature
- MAX30102 → SpO2
- DHT11/DHT22 → Humidity
- Smartphone Camera → PPG / HRV Proxy

---

# UI/UX DESIGN REQUIREMENTS

## GENERAL DESIGN
The interface should look:
- professional
- medical
- modern
- clean
- minimal
- user friendly
- smooth on mobile

## STRICTLY AVOID
- purple colors
- neon gradients
- cyberpunk look
- flashy AI designs
- overloaded dashboards

## COLOR PALETTE
Use:
- white backgrounds
- soft teal accents
- medical blue
- cyan highlights
- gray cards
- subtle shadows

## TYPOGRAPHY
- clean sans-serif fonts
- modern healthcare dashboard appearance

## RESPONSIVENESS
The website MUST be mobile-first and fully responsive.
The mobile experience should feel like a real healthcare app.

---

# USER FLOW

## STEP 1
User opens the website.

## STEP 2
User logs in or registers.

## STEP 3
User fills medical history and symptom questionnaire.

## STEP 4
Website fetches sensor data from ESP32.

## STEP 5
User optionally performs camera PPG scan.

## STEP 6
Frontend sends all data to backend.

## STEP 7
Backend loads:
- Risk prediction model
- Infection pattern model

## STEP 8
Models generate:
- Triage level
- Infection probability outputs

## STEP 9
Gemini internally converts outputs into:
- explainable reasoning
- health recommendations
- human-readable medical interpretation

## STEP 10
MongoDB stores scan history.

## STEP 11
Dashboard displays:
- risk level
- infection probabilities
- explainable AI reasoning
- emergency alerts
- daily fever trends
- recommendations
- nearby hospitals

---

# AUTHENTICATION PAGES

## LOGIN PAGE
Features:
- patient login
- doctor login
- clean minimal UI
- mobile responsive

## REGISTER PAGE
Fields:
- full name
- email
- password
- age
- gender

---

# MAIN DASHBOARD

The dashboard should contain:

## TOP SECTION
Live health overview cards:
- body temperature
- SpO2
- humidity
- heart rate / HRV
- current risk level

Each card should:
- animate smoothly
- update dynamically
- have clean icons
- show medical color indicators

---

# QUESTIONNAIRE PAGE

## SECTION 1 — MEDICAL HISTORY

Add a large text area:

Question:
"Please describe any existing medical conditions, allergies, medications, or relevant health history."

Examples shown:
- diabetes
- asthma
- hypertension
- previous dengue
- ongoing medications

This field is stored in database.
This field is NOT directly used in ML prediction.

---

# SECTION 2 — BASIC INFO

## Age
Numeric input.

## Gender
Dropdown.

## Fever Duration
Options:
- Less than 1 day
- 1–3 days
- 4–7 days
- More than 7 days

Map internally to numerical values.

---

# SECTION 3 — SYMPTOM QUESTIONNAIRE

Each symptom should use:

| UI Option | Binary Model Value | Severity Score |
|-----------|-------------------|----------------|
| None | 0 | 0 |
| Mild | 1 | 1 |
| Moderate | 1 | 2 |
| Severe | 1 | 3 |

The backend ML model should ONLY receive binary values.
Severity scores should be stored separately for analytics and trend visualization.

---

# SYMPTOMS

## Headache
Question:
"How severe is your headache?"

Options:
- None
- Mild
- Moderate
- Severe

---

## Cough
Question:
"How severe is your cough?"

Options:
- None
- Mild
- Moderate
- Severe

---

## Vomiting
Question:
"Have you experienced vomiting?"

Options:
- None
- Mild
- Moderate
- Severe

---

## Muscle Pain
Question:
"Are you experiencing body or muscle pain?"

Options:
- None
- Mild
- Moderate
- Severe

---

## Rash
Question:
"Have you noticed skin rash or red spots?"

Options:
- None
- Mild
- Moderate
- Severe

---

## Chills/Shivering
Question:
"Have you experienced chills or shivering?"

Options:
- None
- Mild
- Moderate
- Severe

---

## Sweating
Question:
"Are you experiencing unusual sweating?"

Options:
- None
- Mild
- Moderate
- Severe

---

## Travel History
Question:
"Have you recently traveled to high-risk or unfamiliar areas?"

Options:
- No travel
- Nearby travel
- Intercity travel
- International/high-risk travel

Any travel option maps to binary 1.

---

# SENSOR INTEGRATION PAGE

## SENSOR DATA TO FETCH

### Temperature
Source:
MLX90614 via ESP32.

### SpO2
Source:
MAX30102 via ESP32.

### Humidity
Source:
DHT11/DHT22 via ESP32.

### HRV Proxy
Source:
Camera PPG analysis.

---

# HARDWARE FLOW

Flow:

Sensors → ESP32 → WiFi → FastAPI Backend → MongoDB → React Dashboard

Use placeholder endpoint variables for:
- ESP32 IP
- backend API URL
- hardware endpoints

DO NOT hardcode them.

---

# CAMERA PPG PAGE

Add:
"Advanced Pulse Scan"

When clicked:
- request camera access
- activate flash if possible
- ask user to place finger on camera
- analyze pulse intensity changes
- generate HRV proxy

Use mobile camera APIs.

This feature should feel futuristic but clean.

---

# MACHINE LEARNING FLOW

## MODEL 1
Risk Level Prediction.

Outputs:
- Low
- Moderate
- High
- Critical

---

## MODEL 2
Infection Pattern Prediction.

Outputs:
- Viral-like
- Bacterial-like
- Respiratory-risk
- Heat-stress risk

Use placeholders for:
- model endpoint URLs
- inference endpoints

---

# GEMINI INTERNAL REASONING FLOW

Gemini should ONLY be used internally.

It should:
- explain predictions
- generate recommendation text
- generate natural-language reasoning

It should NOT:
- appear as chatbot
- appear as assistant
- show Gemini branding
- expose API usage

---

# OUTPUT SCREEN

This is the most important page.

---

# SECTION 1 — TRIAGE LEVEL

Display:
- Low
- Moderate
- High
- Critical

Use:
- severity gauge
- clean medical cards
- animated indicators

---

# SECTION 2 — INFECTION PROBABILITY ANALYSIS

Display probabilities like:

| Infection Pattern | Probability |
|------------------|-------------|
| Malaria-like Pattern | 0.80 |
| Typhoid-like Pattern | 0.10 |
| Normal Viral Fever | 0.10 |

Use:
- progress bars
- charts
- confidence meters

DO NOT directly diagnose diseases.

---

# SECTION 3 — EXPLAINABLE AI REASONING

Display explanations like:

"Malaria-like risk increased due to prolonged fever duration, elevated temperature, travel history, and sweating symptoms."

"Respiratory risk remained low because SpO2 levels were stable."

This explanation should:
- sound professional
- sound medical
- be concise
- be user friendly

---

# SECTION 4 — SENSOR ANALYSIS

Display live cards for:
- temperature
- humidity
- SpO2
- HRV

Use:
- subtle animations
- medical icons
- clean charts

---

# SECTION 5 — DAILY FEVER TREND ANALYSIS

IMPORTANT FEATURE.

Store all daily readings in MongoDB.

Create trend analysis graphs for:
- daily body temperature
- SpO2 changes
- symptom burden score
- fever duration progression
- HRV trend

Use Recharts.

Graphs should:
- be clean
- interactive
- mobile responsive
- visually smooth

Add:
"Health Trend Analysis"
section.

Show:
- last 7 days
- last 14 days
- last 30 days

Include:
- symptom severity trend
- recovery trend
- worsening trend indicators

This feature should make the platform feel intelligent and longitudinal.

---

# SECTION 6 — SYMPTOM BURDEN INDEX

Calculate:
Total symptom severity score.

Example:
- headache severity
- cough severity
- vomiting severity
- muscle pain severity

Generate:
- Mild Burden
- Moderate Burden
- Severe Burden

Display:
- colored health meter
- wellness indicator

This should be separate from ML prediction.

---

# SECTION 7 — ALERT SYSTEM

## CRITICAL ALERTS

Trigger alerts when:
- SpO2 < 90
- temperature > 103°F
- HR > 130

Display:
"Immediate medical attention recommended."

---

## MODERATE ALERTS

Trigger alerts when:
- fever duration > 3 days
- moderate oxygen drop

Display:
"Doctor consultation advised."

---

# SECTION 8 — SMART RECOMMENDATIONS

Generate:
- hydration reminders
- isolation recommendations
- doctor consultation guidance
- monitoring instructions

Recommendations should:
- sound human
- be short
- be medically styled
- not mention Gemini

---

# SECTION 9 — NEARBY HOSPITALS

Integrate Google Maps.

Display:
- nearby hospitals
- clinics
- emergency care centers

DO NOT implement full appointment booking.

---

# DOCTOR DASHBOARD

Doctor dashboard should contain:
- patient reports
- daily fever trends
- symptom trends
- previous scan history
- AI-generated summaries

Clean medical dashboard style.

---

# DATABASE COLLECTIONS

## users
- profile
- authentication
- demographics

## scans
- sensor data
- questionnaire data
- prediction outputs

## reports
- AI explanations
- recommendations
- probability outputs

## trends
- daily readings
- symptom progression
- fever trends

## devices
- ESP32 metadata

---

# API PLACEHOLDERS

Leave placeholders for:

- BACKEND_API_URL
- ESP32_ENDPOINT
- MODEL_1_ENDPOINT
- MODEL_2_ENDPOINT
- GEMINI_API_KEY
- GOOGLE_MAPS_API_KEY

Do NOT hardcode them.

---

# SECURITY REQUIREMENTS

- Gemini API key must remain backend-only
- ML models must remain backend-only
- Hardware endpoints should not be exposed publicly
- Use environment variables for all keys

---

# FINAL PROJECT FEEL

The final platform should feel like:
- a real healthcare startup product
- a modern AI-assisted medical dashboard
- a production-grade healthcare platform

It should NOT feel like:
- a college mini-project
- a chatbot website
- a flashy AI demo
- a generic template

The entire experience should feel:
- trustworthy
- minimal
- medically professional
- smooth
- intelligent
- practical

---

# FINAL OUTPUT EXPECTATIONS

Generate:

1. Full React frontend
2. Full FastAPI backend structure
3. MongoDB integration
4. Mobile responsive UI
5. Placeholder APIs
6. Hardware integration architecture
7. ML inference flow
8. Camera PPG integration flow
9. Trend analysis graphs
10. Explainable AI interface
11. Clean healthcare dashboard
12. Doctor dashboard
13. Emergency alert system
14. Daily fever trend tracking
15. Smart recommendation system
16. Clean reusable component architecture
17. Professional folder structure
18. Environment variable support
19. Tailwind styling
20. Production-style healthcare UI

---

# FINAL DEVELOPMENT GOAL

Build a polished, industry-style, AI-assisted healthcare triage platform that combines:

- physiological sensing
- symptom analysis
- explainable AI
- machine learning
- longitudinal health trend monitoring
- mobile accessibility
- clean healthcare UX

while maintaining:
- simplicity
- scalability
- modular architecture
- professional UI
- practical usability.

