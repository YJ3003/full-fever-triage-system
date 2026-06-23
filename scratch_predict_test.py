import requests
import json

payload = {
  "temperature_c": 38.5,
  "heart_rate": 110,
  "spo2": 96,
  "humidity": 65.0,
  "ambient_temp_c": 32.0,
  "location_zone": "tropical (Mumbai)",
  "hrv": 15.0,
  "age": 10,
  "gender": "Male",
  "fever_days": 3,
  "medical_history": "",
  "headache": 1,
  "cough": 0,
  "vomiting": 0,
  "myalgia": 1,
  "rash": 0,
  "rigors": 1,
  "sweating": 1,
  "travel_history": 0,
  "petechiae": 0,
  "retroorbital_pain": 0,
  "cyclical_fever": 1,
  "dark_urine": 0,
  "stomach_pain": 0,
  "bleeding_tendency": 0,
  "recent_vaccination": True
}

try:
    res = requests.post("http://localhost:8000/predict", json=payload)
    print("Status:", res.status_code)
    data = res.json()
    print("Explanation:")
    print(data.get('ai_explanation', 'MISSING'))
except Exception as e:
    print("Error:", e)
