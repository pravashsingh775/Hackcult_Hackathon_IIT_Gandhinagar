/* ============================================================
 * Smart Bijuka — AI-Powered Intelligent Crop Protection System
 * config.h | Author: Pravash Singh | License: MIT
 * ------------------------------------------------------------
 * Central configuration: Wi-Fi, Blynk, pins, servo, audio, timing.
 * NOTE: never commit real credentials to a public repository.
 * ============================================================ */

#ifndef CONFIG_H
#define CONFIG_H

#define PROJECT_NAME "Smart Bijuka"
#define PROJECT_VERSION "1.0.0"

/* ---- Wi-Fi & Blynk IoT ------------------------------------- */
#define WIFI_SSID "YOUR_WIFI_NAME"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
#define BLYNK_AUTH_TOKEN "YOUR_AUTH_TOKEN"

/* ---- Pin mapping (ESP8266 NodeMCU) ------------------------- */
#define PIR_PIN D5         // PIR motion sensor OUT
#define SERVO_PIN D6       // MG996R signal
#define DFPLAYER_RX_PIN D1 // ESP  -> DFPlayer (1000Ω series)
#define DFPLAYER_TX_PIN D2 // DFPlayer -> ESP

/* ---- Servo -------------------------------------------------- */
#define SERVO_HOME_POS 0     // idle angle (degrees)
#define SERVO_ACTIVE_POS 180 // scare angle (degrees)

/* ---- Audio (DFPlayer Mini) ---------------------------------- */
#define AUDIO_TRACK 1   // track 0001.mp3 on SD card
#define AUDIO_VOLUME 20 // 0–30

/* ---- Timing (ms) -------------------------------------------- */
#define AUDIO_START_DELAY 3000
#define SERVO_MOVE_DELAY 1500
#define SYSTEM_COOLDOWN 10000 // ignore motion after an alert

#endif
