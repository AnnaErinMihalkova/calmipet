// ============================================================
//  CalmIPet — ESP32-C3 Super Mini  (BLE + Sensor + LCD + Motor)
//  Hardware : MAX30102 + LCD1602 (I2C/PCF8574) + Vibration Motor
//  Wiring   : SDA → GPIO8 | SCL → GPIO9 | Motor → GPIO2
//
//  Libraries needed (Arduino Library Manager):
//    "SparkFun MAX3010x Pulse and Proximity Sensor Library"
//    "LiquidCrystal I2C" (Frank de Brabander)
//    Built-in ESP32 BLE libraries (come with esp32 board package)
//
//  Board: ESP32C3 Dev Module
//    → USB CDC on Boot: Enabled
//    → Partition Scheme: Default (no OTA) — BLE needs ~1.5 MB
//
//  BLE UUIDs (must match frontend ble-device.ts exactly):
//    Service  : a7b3c4d0-1234-5678-9abc-def012345678
//    Char(Rx) : a7b3c4d0-1234-5678-9abc-def012345679
// ============================================================

#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include "MAX30105.h"
#include "heartRate.h"
#include "spo2_algorithm.h"

// ── BLE ──────────────────────────────────────────────────────
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

#define SERVICE_UUID        "a7b3c4d0-1234-5678-9abc-def012345678"
#define CHARACTERISTIC_UUID "a7b3c4d0-1234-5678-9abc-def012345679"

BLEServer*         pServer     = nullptr;
BLECharacteristic* pReadingChar = nullptr;
bool bleConnected   = false;
bool bleWasConnected = false;

// BLE connection callbacks
class ServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* s) override {
    bleConnected = true;
    Serial.println("BLE: Client connected");
  }
  void onDisconnect(BLEServer* s) override {
    bleConnected    = false;
    bleWasConnected = true;       // triggers re-advertise below
    Serial.println("BLE: Client disconnected — re-advertising");
  }
};

// ── Pin definitions ─────────────────────────────────────────
#define I2C_SDA       8
#define I2C_SCL       9
#define MOTOR_PIN     2

// ── LCD ──────────────────────────────────────────────────────
LiquidCrystal_I2C lcd(0x27, 16, 2);

// ── MAX30102 ─────────────────────────────────────────────────
MAX30105 sensor;

// ── SpO2 / HR buffers ────────────────────────────────────────
#define BUFFER_LEN 100
uint32_t irBuffer[BUFFER_LEN];
uint32_t redBuffer[BUFFER_LEN];
int32_t  spo2Value;
int8_t   spo2Valid;
int32_t  hrValue;
int8_t   hrValid;

// ── Beat-by-beat HR ──────────────────────────────────────────
const byte BEAT_SAMPLES = 4;
byte  beatHistory[BEAT_SAMPLES];
byte  beatIdx = 0;
float beatsPerMinute = 0;
int   bpmAvg = 0;
long  lastBeat = 0;

// ── Stress thresholds ────────────────────────────────────────
#define BASELINE_HR   65
#define USER_AGE      25
#define STRESS_LOW    30
#define STRESS_MED    55
#define STRESS_HIGH   75

// ── Motor buzz patterns ──────────────────────────────────────
struct BuzzPattern { int on; int off; int reps; };
BuzzPattern motorPattern = {0, 0, 0};
int         motorRep     = 0;
bool        motorOn      = false;
unsigned long motorTimer  = 0;

// ── Custom LCD characters ────────────────────────────────────
byte CHR_HEART[8] = {
  0b00000, 0b01010, 0b11111,
  0b11111, 0b01110, 0b00100, 0b00000, 0b00000
};
byte CHR_WAVE[8] = {
  0b00000, 0b00100, 0b01110,
  0b11111, 0b00100, 0b00100, 0b00000, 0b00000
};
byte CHR_BAR[8] = {
  0b11111, 0b11111, 0b11111,
  0b11111, 0b11111, 0b11111, 0b11111, 0b11111
};
byte CHR_HALF[8] = {
  0b10000, 0b10000, 0b10000,
  0b10000, 0b10000, 0b10000, 0b10000, 0b10000
};

// ── State ────────────────────────────────────────────────────
unsigned long lastFullRead = 0;
unsigned long lastBleNotify = 0;   // throttle BLE to ~3 s
int   displayedHR    = 0;
int   displayedSpo2  = 0;
float displayedStress = 0;
bool  sensorFound    = false;

// ── HRV placeholder (inter-beat interval, ms) ────────────────
// Simple estimate: stddev of the last 4 beat intervals.
// The SparkFun library doesn't give us raw IBI, so we approximate
// from beat timestamps. Frontend only uses it as a rough input.
unsigned long beatTimes[BEAT_SAMPLES] = {0};
int  hrv = 42;   // default until we accumulate beats

void updateHRV() {
  // Compute mean IBI
  long sum = 0;
  int count = 0;
  for (byte i = 0; i < BEAT_SAMPLES; i++) {
    if (beatTimes[i] > 0) { sum += beatTimes[i]; count++; }
  }
  if (count < 2) return;
  long mean = sum / count;

  // Variance → std-dev (RMSSD approximation)
  long varSum = 0;
  for (byte i = 0; i < BEAT_SAMPLES; i++) {
    if (beatTimes[i] > 0) {
      long d = beatTimes[i] - mean;
      varSum += d * d;
    }
  }
  hrv = (int)sqrt((float)varSum / count);
  hrv = max(5, min(100, hrv));
}

// ============================================================
//  Stress score (0–100)
// ============================================================
float calcStress(int hr, int spo2) {
  float maxHR = 208.0f - 0.7f * USER_AGE;
  float hf = max(0.0f, min(1.0f, (float)(hr - BASELINE_HR) / (maxHR - BASELINE_HR)));

  float hrs;
  if      (hf <= 0.15f) hrs = hf / 0.15f * 10.0f;
  else if (hf <= 0.30f) hrs = 10.0f + (hf - 0.15f) / 0.15f * 20.0f;
  else if (hf <= 0.45f) hrs = 30.0f + (hf - 0.30f) / 0.15f * 25.0f;
  else if (hf <= 0.65f) hrs = 55.0f + (hf - 0.45f) / 0.20f * 25.0f;
  else                  hrs = 80.0f + min((hf - 0.65f) / 0.35f, 1.0f) * 20.0f;

  float ss;
  if      (spo2 >= 96) ss = 0.0f;
  else if (spo2 >= 94) ss = (96.0f - spo2) / 2.0f * 30.0f;
  else if (spo2 >= 92) ss = 30.0f + (94.0f - spo2) / 2.0f * 35.0f;
  else if (spo2 >= 90) ss = 65.0f + (92.0f - spo2) / 2.0f * 25.0f;
  else                 ss = 100.0f;

  float score = 0.55f * hrs + 0.20f * ss + 0.25f * 50.0f;
  if (hrs > 55 && ss > 30)
    score += 5.0f * ((hrs - 55.0f) / 45.0f) * ((ss - 30.0f) / 70.0f);
  return max(0.0f, min(100.0f, score));
}

// ============================================================
//  LCD helpers  (unchanged from original)
// ============================================================
void lcdShowWaiting() {
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print("Place finger on ");
  lcd.setCursor(0, 1); lcd.print("    sensor...   ");
}

void lcdShowSensorError() {
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print(" Sensor error!  ");
  lcd.setCursor(0, 1); lcd.print(" Check wiring   ");
}

void lcdDrawStressBar(float stress) {
  int filled = (int)(stress / 100.0f * 12.0f + 0.5f);
  filled = max(0, min(12, filled));
  lcd.setCursor(0, 1);
  for (int c = 0; c < 12; c++)
    lcd.write(c < filled ? byte(2) : ' ');
  lcd.setCursor(12, 1);
  if      (stress < STRESS_LOW)  lcd.print(" Lo ");
  else if (stress < STRESS_MED)  lcd.print(" Md ");
  else if (stress < STRESS_HIGH) lcd.print(" Hi ");
  else                           lcd.print("!!!!");
}

void lcdUpdateData(int hr, int spo2, float stress) {
  lcd.setCursor(0, 0);
  lcd.write(byte(0));
  if (hr > 0 && hr < 300) {
    char buf[4]; snprintf(buf, sizeof(buf), "%3d", hr); lcd.print(buf);
  } else { lcd.print("---"); }
  lcd.print("bpm ");
  lcd.write(byte(1));
  if (spo2 > 0) {
    char buf[4]; snprintf(buf, sizeof(buf), "%3d", spo2); lcd.print(buf);
  } else { lcd.print("---"); }
  lcd.print('%');
  lcd.print("  ");
  lcdDrawStressBar(stress);
}

// ============================================================
//  Motor (unchanged from original)
// ============================================================
void startBuzz(BuzzPattern p) {
  motorPattern = p; motorRep = 0;
  motorOn = true; motorTimer = millis();
  digitalWrite(MOTOR_PIN, HIGH);
}
void stopMotor() {
  motorOn = false; motorRep = 0;
  digitalWrite(MOTOR_PIN, LOW);
}
void updateMotor() {
  if (motorPattern.reps == 0) return;
  unsigned long now = millis();
  if (motorOn) {
    if (now - motorTimer >= (unsigned long)motorPattern.on) {
      digitalWrite(MOTOR_PIN, LOW);
      motorOn = false; motorTimer = now;
    }
  } else {
    if (now - motorTimer >= (unsigned long)motorPattern.off) {
      motorRep++;
      if (motorRep >= motorPattern.reps) { motorPattern = {0,0,0}; return; }
      digitalWrite(MOTOR_PIN, HIGH);
      motorOn = true; motorTimer = now;
    }
  }
}

// ============================================================
//  Alert logic (unchanged from original)
// ============================================================
void triggerAlert(int hr, int spo2, float stress) {
  if (motorPattern.reps > 0) return;
  if (spo2 > 0 && spo2 < 90)         { Serial.println("ALERT: SpO2 critically low"); startBuzz({100, 80, 8}); }
  else if (spo2 > 0 && spo2 < 94)    { Serial.println("ALERT: SpO2 low");            startBuzz({600,300, 2}); }
  else if (stress >= STRESS_HIGH)     { Serial.println("ALERT: Critical stress");     startBuzz({300,200, 3}); }
  else if (stress >= STRESS_MED)      { Serial.println("ALERT: High stress");         startBuzz({300,200, 2}); }
  else if (hr > 130)                  { Serial.println("ALERT: HR high");             startBuzz({300,200, 3}); }
}

// ============================================================
//  BLE notify  — sends JSON to connected browser
//  {"heart_rate":72,"spo2":98.5,"hrv":42}
// ============================================================
void bleSendReading(int hr, int spo2, int hrv_val) {
  if (!bleConnected) return;
  char json[64];
  snprintf(json, sizeof(json),
    "{\"heart_rate\":%d,\"spo2\":%d.0,\"hrv\":%d}",
    hr, spo2, hrv_val);
  pReadingChar->setValue((uint8_t*)json, strlen(json));
  pReadingChar->notify();
  Serial.printf("BLE notify: %s\n", json);
}

// ============================================================
//  setup()
// ============================================================
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("=== CalmIPet BLE + Sensor ===");

  // ── GPIO ──
  pinMode(MOTOR_PIN, OUTPUT);
  digitalWrite(MOTOR_PIN, LOW);

  // ── I2C ──
  Wire.begin(I2C_SDA, I2C_SCL);

  // ── LCD ──
  lcd.init();
  lcd.backlight();
  lcd.createChar(0, CHR_HEART);
  lcd.createChar(1, CHR_WAVE);
  lcd.createChar(2, CHR_BAR);
  lcd.createChar(3, CHR_HALF);
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print("  CalmIPet v1   ");
  lcd.setCursor(0, 1); lcd.print(" Initialising.. ");
  delay(1200);

  // ── Motor self-test ──
  startBuzz({200, 100, 2});
  while (motorPattern.reps > 0) updateMotor();

  // ── MAX30102 ──
  if (!sensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("ERROR: MAX30102 not found!");
    lcdShowSensorError();
    sensorFound = false;
    for (int i = 0; i < 5; i++) {
      digitalWrite(MOTOR_PIN, HIGH); delay(100);
      digitalWrite(MOTOR_PIN, LOW);  delay(150);
    }
  } else {
    sensorFound = true;
    Serial.println("MAX30102 OK. Place finger on sensor.");
    sensor.setup(60, 4, 2, 100, 411, 4096);
    sensor.setPulseAmplitudeRed(0x0A);
    sensor.setPulseAmplitudeGreen(0);
    lcdShowWaiting();
  }

  // ── BLE ──
  BLEDevice::init("CalmIPet");               // advertised name

  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());

  BLEService* pService = pServer->createService(SERVICE_UUID);

  pReadingChar = pService->createCharacteristic(
    CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_NOTIFY
  );
  // The BLE2902 descriptor is required for notifications to work
  pReadingChar->addDescriptor(new BLE2902());

  pService->start();

  BLEAdvertising* pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  // Helps with iPhone discovery (though Web Bluetooth needs Chrome/Edge)
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMaxPreferred(0x12);
  BLEDevice::startAdvertising();

  Serial.println("BLE advertising as 'CalmIPet'");

  // Show BLE status on LCD row 1 briefly
  lcd.setCursor(0, 1);
  lcd.print("BLE advertising ");
  delay(1500);
  lcdShowWaiting();
}

// ============================================================
//  loop()
// ============================================================
void loop() {
  updateMotor();

  // Re-advertise after disconnect
  if (bleWasConnected && !bleConnected) {
    delay(500);
    BLEDevice::startAdvertising();
    bleWasConnected = false;
    Serial.println("BLE: re-advertising");
  }

  if (!sensorFound) {
    static unsigned long retryTimer = 0;
    if (millis() - retryTimer > 5000) {
      retryTimer = millis();
      if (sensor.begin(Wire, I2C_SPEED_FAST)) {
        sensorFound = true;
        Serial.println("MAX30102 found after retry!");
        sensor.setup(60, 4, 2, 100, 411, 4096);
        sensor.setPulseAmplitudeRed(0x0A);
        sensor.setPulseAmplitudeGreen(0);
        lcdShowWaiting();
      }
    }
    return;
  }

  // ── Initial 100-sample fill (blocks ~4 s) ──
  static bool firstRead = true;
  if (firstRead) {
    lcd.clear();
    lcd.setCursor(0, 0); lcd.print("Calibrating...  ");
    for (byte i = 0; i < BUFFER_LEN; i++) {
      while (!sensor.available()) sensor.check();
      redBuffer[i] = sensor.getRed();
      irBuffer[i]  = sensor.getIR();
      sensor.nextSample();
    }
    maxim_heart_rate_and_oxygen_saturation(
      irBuffer, BUFFER_LEN, redBuffer,
      &spo2Value, &spo2Valid, &hrValue, &hrValid);
    firstRead = false;
    if (hrValid)   displayedHR   = hrValue;
    if (spo2Valid) displayedSpo2 = spo2Value;
    displayedStress = calcStress(displayedHR, displayedSpo2);
    lcdUpdateData(displayedHR, displayedSpo2, displayedStress);
    triggerAlert(displayedHR, displayedSpo2, displayedStress);
    lastFullRead = millis();
    return;
  }

  // ── Sliding-window update every 4 s ──
  if (millis() - lastFullRead >= 4000) {
    for (byte i = 25; i < BUFFER_LEN; i++) {
      redBuffer[i-25] = redBuffer[i];
      irBuffer[i-25]  = irBuffer[i];
    }
    for (byte i = 75; i < BUFFER_LEN; i++) {
      while (!sensor.available()) sensor.check();
      redBuffer[i] = sensor.getRed();
      irBuffer[i]  = sensor.getIR();
      sensor.nextSample();
    }
    maxim_heart_rate_and_oxygen_saturation(
      irBuffer, BUFFER_LEN, redBuffer,
      &spo2Value, &spo2Valid, &hrValue, &hrValid);

    if (hrValid   && hrValue   > 30 && hrValue   < 220) displayedHR   = hrValue;
    if (spo2Valid && spo2Value > 70 && spo2Value <= 100) displayedSpo2 = spo2Value;

    long irVal = irBuffer[BUFFER_LEN-1];
    if (irVal < 5000) {
      lcdShowWaiting();
      displayedHR = 0; displayedSpo2 = 0;
      stopMotor();
      Serial.println("No finger detected.");
      lastFullRead = millis();
      return;
    }

    displayedStress = calcStress(displayedHR, displayedSpo2);
    Serial.printf("HR=%d bpm  SpO2=%d%%  Stress=%.1f  HRV=%d\n",
                  displayedHR, displayedSpo2, displayedStress, hrv);
    lcdUpdateData(displayedHR, displayedSpo2, displayedStress);
    triggerAlert(displayedHR, displayedSpo2, displayedStress);
    lastFullRead = millis();
  }

  // ── Send BLE notification every 3 s (if connected) ──
  if (bleConnected && (millis() - lastBleNotify >= 3000)) {
    updateHRV();
    bleSendReading(displayedHR, displayedSpo2, hrv);
    lastBleNotify = millis();
  }

  // ── Live beat-by-beat BPM ──
  while (sensor.available()) {
    long irRaw = sensor.getIR();
    if (irRaw > 5000) {
      if (checkForBeat(irRaw)) {
        unsigned long now = millis();
        long delta = now - lastBeat;
        if (delta > 300 && delta < 2000) {
          beatsPerMinute = 60000.0f / (float)delta;
          beatHistory[beatIdx]  = (byte)beatsPerMinute;
          beatTimes[beatIdx]    = delta;   // store IBI for HRV
          beatIdx = (beatIdx + 1) % BEAT_SAMPLES;
          long sum = 0;
          for (byte b = 0; b < BEAT_SAMPLES; b++) sum += beatHistory[b];
          bpmAvg = sum / BEAT_SAMPLES;
        }
        lastBeat = now;
      }
    }
    sensor.nextSample();
  }
}
