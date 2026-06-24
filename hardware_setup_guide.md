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
#include "spo2_algorithm.h"

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

// SpO2 calculation variables
uint32_t irBuffer[100]; // infrared LED sensor data
uint32_t redBuffer[100];  // red LED sensor data
int32_t bufferLength = 100; // data length
int32_t spo2; // SPO2 value
int8_t validSPO2; // indicator to show if the SPO2 calculation is valid
int32_t heartRate; // heart rate value
int8_t validHeartRate; // indicator to show if the heart rate calculation is valid

bool initialized = false;

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

  // Setup to sense up to 18 inches, max LED brightness
  byte ledBrightness = 60; //Options: 0=Off to 255=50mA
  byte sampleAverage = 4; //Options: 1, 2, 4, 8, 16, 32
  byte ledMode = 2; //Options: 1 = Red only, 2 = Red + IR, 3 = Red + IR + Green
  byte sampleRate = 100; //Options: 50, 100, 200, 400, 800, 1000, 1600, 3200
  int pulseWidth = 411; //Options: 69, 118, 215, 411
  int adcRange = 4096; //Options: 2048, 4096, 8192, 16384
  
  particleSensor.setup(ledBrightness, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange);
}

void loop() {
  // Yield to ESP8266 background processes to prevent Watchdog Timer (WDT) reset
  yield();
  
  if (!initialized) {
    // Read the first 100 samples (approx 4 seconds) to populate the buffer
    for (byte i = 0 ; i < bufferLength ; i++) {
      while (particleSensor.available() == false) {
        particleSensor.check(); 
        yield();
      }
      redBuffer[i] = particleSensor.getRed();
      irBuffer[i] = particleSensor.getIR();
      particleSensor.nextSample();
    }
    // Calculate initial HR & SpO2
    maxim_heart_rate_and_oxygen_saturation(irBuffer, bufferLength, redBuffer, &spo2, &validSPO2, &heartRate, &validHeartRate);
    initialized = true;
  }

  // Once initialized, continuously update by shifting the buffer
  // Dump the first 25 sets of samples and shift the last 75 to the top
  for (byte i = 25; i < 100; i++) {
    redBuffer[i - 25] = redBuffer[i];
    irBuffer[i - 25] = irBuffer[i];
  }

  // Take 25 new samples (takes approx 1 second)
  for (byte i = 75; i < 100; i++) {
    while (particleSensor.available() == false) {
      particleSensor.check();
      yield();
    }
    redBuffer[i] = particleSensor.getRed();
    irBuffer[i] = particleSensor.getIR();
    particleSensor.nextSample();
  }

  // Recalculate HR and SpO2 based on the updated buffer
  maxim_heart_rate_and_oxygen_saturation(irBuffer, bufferLength, redBuffer, &spo2, &validSPO2, &heartRate, &validHeartRate);

  // Read Temperature
  float tempC = mlx.readObjectTempC();

  // Validate readings and check if finger is present
  int final_spo2 = 0;
  int final_hr = 0;
  
  if (irBuffer[50] < 50000) {
    Serial.println("No finger detected. Waiting...");
  } else {
    // Only use values if the algorithm flagged them as valid, and they fall into human limits
    if (validSPO2 && spo2 >= 50 && spo2 <= 100) final_spo2 = spo2;
    if (validHeartRate && heartRate >= 30 && heartRate <= 220) final_hr = heartRate;
  }

  // Send data to the backend
  sendDataToServer(tempC, final_spo2, final_hr);
}

void sendDataToServer(float temp, int spo2_val, int hr) {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    WiFiClientSecure clientSecure;
    HTTPClient http;
    
    String url = String(backend_url);
    if (url.startsWith("https")) {
      clientSecure.setInsecure(); // Bypass strict SSL checks for ESP8266
      http.begin(clientSecure, url);
    } else {
      http.begin(client, url);
    }
    
    http.addHeader("Content-Type", "application/json");

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
