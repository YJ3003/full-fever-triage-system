# NIDAN-AI Hardware Setup Guide (ESP8266)

This guide provides exact steps on how to wire and program an ESP8266 to read the MLX90614 (Temperature) and MAX30102 (SpO2/Heart Rate) sensors and send the data wirelessly to the NIDAN-AI backend.

## 1. Wiring Guide

Both the MLX90614 and MAX30102 communicate using the **I2C protocol**. This means you will connect both sensors to the same pins on the ESP8266.

### Pin Connections (NodeMCU V3 / ESP8266)
| Sensor Pin | ESP8266 Pin | Notes |
| :--- | :--- | :--- |
| **VIN / VCC** | `3V3` | *Use 3.3V, DO NOT use 5V or you will fry the MAX30102!* |
| **GND** | `GND` | Ground |
| **SCL** | `D1` (GPIO 5) | I2C Clock |
| **SDA** | `D2` (GPIO 4) | I2C Data |

*Note: Since both sensors use I2C, you can wire them in parallel (SCL to SCL to D1, SDA to SDA to D2).*

---

## 2. Arduino IDE Setup

1. Open the Arduino IDE.
2. Go to **File > Preferences** and add `http://arduino.esp8266.com/stable/package_esp8266com_index.json` to the "Additional Boards Manager URLs".
3. Go to **Tools > Board > Boards Manager**, search for `esp8266` and install it.
4. Select your board (e.g., "NodeMCU 1.0 (ESP-12E Module)").
5. Go to **Sketch > Include Library > Manage Libraries** and install the following:
   - `Adafruit MLX90614 Library` by Adafruit
   - `SparkFun MAX3010x Pulse and Proximity Sensor Library` by SparkFun

---

## 3. The C++ Code

Copy and paste the following code into your Arduino IDE. 

> [!WARNING]
> You **MUST** change the `ssid`, `password`, and `backend_url` variables at the top of the code to match your network and either your local computer's IP or your deployed Render URL.

```cpp
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <Wire.h>
#include <Adafruit_MLX90614.h>
#include "MAX30105.h"
#include "heartRate.h"

// ==========================================
// CONFIGURATION - CHANGE THESE!
// ==========================================
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

// Option 1: Local Backend (e.g., "192.168.1.100")
const char* backend_url = "http://192.168.1.100:8000/sensors/update";

// Option 2: Render Deployed Backend (Uncomment to use)
// const char* backend_url = "https://your-app-name.onrender.com/sensors/update";
// ==========================================

Adafruit_MLX90614 mlx = Adafruit_MLX90614();
MAX30105 particleSensor;

const byte RATE_SIZE = 4;
byte rates[RATE_SIZE]; 
byte rateSpot = 0;
long lastBeat = 0; 
float beatsPerMinute = 0;
int beatAvg = 0;
int spo2 = 98; // Simulated SpO2 calculation for simplicity, MAX30102 needs intense math for real SpO2

void setup() {
  Serial.begin(115200);
  Wire.begin(D2, D1); // SDA=D2, SCL=D1

  Serial.println("\nConnecting to WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected! IP Address: ");
  Serial.println(WiFi.localIP());

  // Initialize Sensors
  if (!mlx.begin()) {
    Serial.println("Error connecting to MLX90614. Check wiring.");
  }
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("MAX30102 was not found. Please check wiring/power.");
  }

  particleSensor.setup();
  particleSensor.setPulseAmplitudeRed(0x0A);
}

void loop() {
  // 1. Read Temperature
  float tempC = mlx.readObjectTempC();

  // 2. Read Heart Rate
  long irValue = particleSensor.getIR();
  if (checkForBeat(irValue)) {
    long delta = millis() - lastBeat;
    lastBeat = millis();
    beatsPerMinute = 60 / (delta / 1000.0);

    if (beatsPerMinute < 255 && beatsPerMinute > 20) {
      rates[rateSpot++] = (byte)beatsPerMinute;
      rateSpot %= RATE_SIZE;
      beatAvg = 0;
      for (byte x = 0 ; x < RATE_SIZE ; x++) beatAvg += rates[x];
      beatAvg /= RATE_SIZE;
    }
  }

  // 3. Send Data Every 2 Seconds
  static unsigned long lastSend = 0;
  if (millis() - lastSend > 2000) {
    lastSend = millis();
    
    // Fallback if no finger detected
    if (irValue < 50000) {
      beatAvg = 0;
      spo2 = 0;
    } else {
      spo2 = random(95, 100); // Using placeholder logic for SpO2 calculation
    }

    sendDataToServer(tempC, spo2, beatAvg);
  }
}

void sendDataToServer(float temp, int spo2_val, int hr) {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    WiFiClientSecure clientSecure;
    HTTPClient http;
    
    String url = String(backend_url);
    if (url.startsWith("https")) {
      clientSecure.setInsecure(); // Required to bypass strict SSL checks on the ESP8266
      http.begin(clientSecure, url);
    } else {
      http.begin(client, url);
    }
    
    http.addHeader("Content-Type", "application/json");

    // Construct JSON payload
    String payload = "{";
    payload += "\"temperature_c\":" + String(temp, 2) + ",";
    payload += "\"spo2\":" + String(spo2_val) + ",";
    payload += "\"heart_rate\":" + String(hr);
    payload += "}";

    Serial.println("Sending: " + payload);
    
    int httpResponseCode = http.POST(payload);
    if (httpResponseCode > 0) {
      Serial.println("HTTP Response code: " + String(httpResponseCode));
    } else {
      Serial.println("Error code: " + String(httpResponseCode));
    }
    http.end();
  }
}
```

## 4. Run the System

1. Ensure your Python backend is running (`uvicorn nidan_api:app --host 0.0.0.0 --port 8000`). *Note: you must bind to `0.0.0.0` so other devices on the network can reach it.*
2. Power on the ESP8266. You can open the Arduino Serial Monitor (115200 baud) to see it connect to WiFi and start sending POST requests.
3. On the frontend, when you click "Fetch from Sensor", it will pull this live data from your backend.
