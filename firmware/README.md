# ⚡ Firmware — Smart Bijuka IoT Controller

This directory contains the embedded firmware for the **ESP8266 NodeMCU** field microcontroller, responsible for sensor monitoring, physical scarecrow actuator control, audio generation, and wireless cloud telemetry.

---

## 📋 System Architecture

```text
               +-----------------------------+
               | PIR Motion Sensor (HC-SR501)|
               +--------------+--------------+
                              | Digital Trigger (Pin D5)
                              v
               +-----------------------------+
               |     ESP8266 NodeMCU Unit    |
               +--+-----------+-----------+--+
                  |           |           |
       PWM (D6)   |    UART   |   Wi-Fi   |  Blynk IoT Cloud
  +---------------+   (D1/D2) |   TCP/IP  |
  |                           |           +-----------------> Farmer's Phone
  v                           v                                (Push Alert)
+-------------------+   +--------------------+
| MG996R 180° Servo |   | DFPlayer Mini (MP3)|
| Actuator Sweep    |   | + 3W Loudspeaker   |
+-------------------+   +--------------------+
```

---

## 🛠 Required Libraries

Install these via the **Arduino IDE Library Manager** (`Sketch -> Include Library -> Manage Libraries`):

| Library Name | Author / Source | Purpose |
|--------------|-----------------|---------|
| **Blynk** | Volodymyr Shymanskyy | Cloud telemetry & smartphone push notifications |
| **ESP8266WiFi** | ESP8266 Community | Embedded Wi-Fi stack |
| **Servo** | Arduino / ESP8266 Community | PWM servo control |
| **SoftwareSerial** | ESP8266 Community | UART communication for audio module |
| **DFRobotDFPlayerMini** | DFRobot | MP3 playback control over serial |

---

## ⚙️ Configuration (`config.h`)

Before flashing the firmware, configure your network and device parameters in [`config.h`](config.h):

```cpp
/* Wi-Fi & Blynk IoT Credentials */
#define WIFI_SSID         "YOUR_WIFI_SSID"
#define WIFI_PASSWORD     "YOUR_WIFI_PASSWORD"
#define BLYNK_AUTH_TOKEN  "YOUR_BLYNK_AUTH_TOKEN"

/* Hardware Pin Mapping (NodeMCU v2/v3) */
#define PIR_PIN           D5      // Motion sensor digital out
#define SERVO_PIN         D6      // MG996R servo signal
#define DFPLAYER_RX_PIN   D1      // ESP TX -> DFPlayer RX (via 1kΩ resistor)
#define DFPLAYER_TX_PIN   D2      // ESP RX <- DFPlayer TX

/* Operational Parameters */
#define AUDIO_VOLUME      20      // 0 to 30
#define SYSTEM_COOLDOWN   10000   // 10s cooldown between alarms (prevents spam)
```

---

## 🚀 Flashing Instructions

1. Connect the ESP8266 NodeMCU to your computer via micro-USB.
2. Open [`SmartBijuka.ino`](SmartBijuka.ino) in Arduino IDE.
3. Select Board: **NodeMCU 1.0 (ESP-12E Module)**.
4. Set Upload Speed: **115200 baud**; CPU Frequency: **80 MHz**.
5. Select the corresponding **COM Port**.
6. Click **Upload** (Ctrl + U).
7. Open the Serial Monitor (9600 baud) to monitor startup logs and Wi-Fi connection status.
