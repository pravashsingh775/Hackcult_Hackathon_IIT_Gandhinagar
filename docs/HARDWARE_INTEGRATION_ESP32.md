# 🔌 ESP32 Physical Hardware Integration Guide — Smart Bijuka

> **Integration status:** This is a reference design, not proof of a tested end-to-end hardware installation. The checked-in `firmware/SmartBijuka.ino` targets ESP8266, while the example below targets ESP32. Verify the actual board, libraries, pin mapping, power design, and firmware together before using any wiring or enabling physical actuation.

This document provides complete schematics, network protocol documentation, and Arduino/ESP32 C++ firmware for connecting physical hardware (servo motors, MP3 audio boards, and relays) to the **Smart Bijuka AI Backend**.

---

## 1. Physical Hardware Safety Guarantee

By default, Smart Bijuka operates in **Safe Simulation Mode**:
- Physical actuator network calls and serial writes are **disabled**.
- The dashboard visually animates the scarecrow arms and previews audio safely in software.
- Physical actuation is enabled **only** when an operator explicitly toggles `Physical ESP32 & Servo Link` to `ON` in the dashboard settings or `.env`.

---

## 2. Hardware Architecture & Wiring

```
                         [12V 7Ah Battery + 20W Solar Panel]
                                          │
                                          ▼
                         [LM2596 DC-DC Buck Converter]
                                          │
                   ┌──────────────────────┴──────────────────────┐
                   │ 5V (3A max Rail)                            │
                   ▼                                             ▼
          ┌───────────────────┐                         ┌───────────────────┐
          │  ESP32 Controller │                         │ MG996R High-Torque│
          │  NodeMCU / DevKit │                         │ Metal-Gear Servo  │
          └─────────┬─────────┘                         └─────────▲─────────┘
                    │                                             │
                    ├───── PWM Pin (GPIO 18) ─────────────────────┤
                    │
                    ├───── UART TX (GPIO 17 via 1kΩ) ─────────────┐
                    │                                             ▼
                    │                                   ┌───────────────────┐
                    │                                   │ DFPlayer Mini MP3 │
                    │                                   │ + 3W Loudspeaker  │
                    │                                   └───────────────────┘
                    ▼
          [Wi-Fi / Serial link to Smart Bijuka Backend]
```

### Pin Mapping (ESP32 DevKit v1)
| Component | ESP32 Pin | Function | Notes |
|:---|:---:|:---|:---|
| **MG996R Servo** | `GPIO 18` | PWM Servo Signal | Power directly from 5V LM2596 rail (not ESP32 3.3V) |
| **DFPlayer Mini TX** | `GPIO 16` | SoftwareSerial RX | Receives MP3 player status |
| **DFPlayer Mini RX** | `GPIO 17` | SoftwareSerial TX | 1 kΩ inline resistor prevents 5V/3.3V logic hum |
| **HC-SR501 PIR** | `GPIO 19` | Digital Motion Input | Perimeter tripwire interrupt |
| **Common Ground** | `GND` | Ground Reference | Tie all component GNDs to ESP32 GND |

---

## 3. Communication Protocols

Smart Bijuka supports two robust communication interfaces:

### A. Wi-Fi REST Endpoint (Default Network Mode)
The ESP32 runs a lightweight HTTP server on the farm's local Wi-Fi or router hotspot.
- **Method:** `POST`
- **URL:** `http://<ESP32_IP>:80/trigger`
- **Headers:** `Content-Type: application/json`
- **Payload:**
  ```json
  {
    "action": "scare_cycle",
    "servo_angle": 180
  }
  ```
- **Response:**
  ```json
  {
    "status": "success",
    "servo_moved": true,
    "angle": 180,
    "audio_track": 1
  }
  ```

### B. USB Serial Protocol (Direct Wired Laptop Mode)
For offline demonstrations without Wi-Fi, connect the ESP32 directly via USB:
- **Baud Rate:** `115200`
- **Command Syntax:** `TRIGGER:scare_cycle:180\n`
- **Acknowledgment:** `OK:ACTUATED:180\n`

---

## 4. Complete ESP32 Arduino C++ Firmware

Save the following sketch as `SmartBijuka_ESP32_Actuator.ino` and flash using the **Arduino IDE** (Board: *DOIT ESP32 DEVKIT V1*):

```cpp
/*
 * Smart Bijuka — ESP32 Physical Actuator Node
 * Receives REST / Serial commands from Smart Bijuka AI Backend
 */
#include <WiFi.h>
#include <WebServer.h>
#include <ESP32Servo.h>

const char* ssid     = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

#define SERVO_PIN 18
Servo scarecrowServo;
WebServer server(80);

void handleTrigger() {
  if (server.method() != HTTP_POST) {
    server.send(405, "application/json", "{\"error\":\"Method Not Allowed\"}");
    return;
  }

  Serial.println("[ACTUATOR] Authorized animal deterrent received! Actuating 180° sweep...");
  
  // Non-blocking bidirectional servo sweep
  scarecrowServo.write(180);
  delay(1200);
  scarecrowServo.write(0);

  server.send(200, "application/json", "{\"status\":\"success\",\"servo_moved\":true}");
}

void setup() {
  Serial.begin(115200);
  scarecrowServo.attach(SERVO_PIN);
  scarecrowServo.write(0); // Home position

  WiFi.begin(ssid, password);
  Serial.print("Connecting to Wi-Fi");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[OK] Connected! ESP32 IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[WARN] Wi-Fi connection timed out. Listening on Serial USB.");
  }

  server.on("/trigger", handleTrigger);
  server.begin();
  Serial.println("[OK] Smart Bijuka Actuator Server Listening.");
}

void loop() {
  server.handleClient();

  // Also support USB Serial direct triggers
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd.startsWith("TRIGGER")) {
      scarecrowServo.write(180);
      delay(1200);
      scarecrowServo.write(0);
      Serial.println("OK:ACTUATED:180");
    }
  }
}
```

---

## 5. Dashboard Configuration Step-by-Step

1. Find the ESP32 IP address from the Arduino Serial Monitor (e.g., `192.168.1.150`).
2. Open the **Smart Bijuka Dashboard** at `http://localhost:4321`.
3. In the right-hand panel under **Deterrence Tuning & Hardware**:
   - Toggle **Physical ESP32 & Servo Link** to `ON`.
   - Enter your `ESP32 IP` into the input box.
4. Click **Test Arm Motion** to verify physical servo movement.
