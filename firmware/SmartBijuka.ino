/* ============================================================
 * Smart Bijuka — AI-Powered Intelligent Crop Protection System
 * SmartBijuka.ino | Author: Pravash Singh | Version 2.0 | MIT
 * ------------------------------------------------------------
 * Motion (PIR)  ->  Servo scare  +  DFPlayer audio alarm
 *               ->  Blynk IoT mobile notification
 *
 * Libraries (Arduino Library Manager):
 *   Blynk, ESP8266 Servo, DFRobotDFPlayerMini
 * ============================================================ */

#include "config.h"

#include <ESP8266WiFi.h>
#include <BlynkSimpleEsp8266.h>
#include <Servo.h>
#include <SoftwareSerial.h>
#include <DFRobotDFPlayerMini.h>

SoftwareSerial dfSerial(DFPLAYER_TX_PIN, DFPLAYER_RX_PIN);
DFRobotDFPlayerMini dfPlayer;
Servo scareServo;

// Non-blocking scare sequence state machine
enum ScareState : uint8_t { IDLE, SERVO_ACTIVE, SERVO_RETURN, AUDIO_PLAY };
ScareState scareState = IDLE;
unsigned long stateStart = 0;
bool coolingDown = false;
unsigned long cooldownStart = 0;

void enterState(ScareState next) {
  scareState = next;
  stateStart = millis();
}

/* ---------------------------------------------------------- */
void updateScareSequence()
{
  switch (scareState)
  {
  case IDLE:
    return;

  case SERVO_ACTIVE: // servo swung to scare position
    if (millis() - stateStart >= SERVO_MOVE_DELAY)
    {
      scareServo.write(SERVO_HOME_POS);
      enterState(SERVO_RETURN);
    }
    break;

  case SERVO_RETURN: // servo back home -> start audio
    if (millis() - stateStart >= SERVO_MOVE_DELAY)
    {
      dfPlayer.play(AUDIO_TRACK);
      enterState(AUDIO_PLAY);
    }
    break;

  case AUDIO_PLAY: // let the deterrent sound play, then stop
    if (millis() - stateStart >= AUDIO_START_DELAY)
    {
      dfPlayer.stop();
      scareState = IDLE;
      Serial.println("[INFO] Scare sequence complete.");
    }
    break;
  }
}

/* ---------------------------------------------------------- */
void setup()
{
  Serial.begin(9600);
  dfSerial.begin(9600);
  pinMode(PIR_PIN, INPUT);

  Serial.printf("\n[%s v%s] starting...\n", PROJECT_NAME, PROJECT_VERSION);

  scareServo.attach(SERVO_PIN);
  scareServo.write(SERVO_HOME_POS);

  if (dfPlayer.begin(dfSerial))
  {
    dfPlayer.volume(AUDIO_VOLUME);
    Serial.println("[INFO] DFPlayer ready.");
  }
  else
  {
    Serial.println("[ERROR] DFPlayer not found — check wiring/SD card.");
  }

  Blynk.begin(BLYNK_AUTH_TOKEN, WIFI_SSID, WIFI_PASSWORD);
  Serial.println("[INFO] Blynk connected. System armed.\n");
}

/* ---------------------------------------------------------- */
void loop()
{
  Blynk.run();

  // Enter cooldown: skip motion while the scare sequence is busy.
  if (coolingDown && millis() - cooldownStart >= SYSTEM_COOLDOWN)
  {
    coolingDown = false;
    Serial.println("[INFO] System re-armed.");
  }

  updateScareSequence();

  if (!coolingDown && scareState == IDLE && digitalRead(PIR_PIN) == HIGH)
  {
    coolingDown = true;
    cooldownStart = millis();
    triggerScare();
  }
}

/* ---------------------------------------------------------- */
void triggerScare()
{
  Serial.println("[EVENT] Motion detected — activating deterrents.");

  // 1. Servo scare sweep (non-blocking, driven by updateScareSequence)
  scareServo.write(SERVO_ACTIVE_POS);
  enterState(SERVO_ACTIVE);

  // 2. Mobile notification — sent immediately so Wi-Fi hiccups
  //    never delay the alert to the farmer.
  Blynk.logEvent("animal_alert", "⚠ Animal detected near crops!");
}
