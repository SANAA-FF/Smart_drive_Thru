
#include <Arduino.h>
#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <ESP32Servo.h>
#include <WebServer.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <ArduinoJson.h>
// --- WiFi Configuration ---
const char* WIFI_SSID = "sanafathima";
const char* WIFI_PASS = "lalalala";
// --- Backend Endpoint ---
const char* SERVER_URL = "http://10.249.34.105:5000/process-plate";
// --- XIAO ESP32-S3 Sense Camera Pin Mapping ---

;
Servo lockerServo;
bool lockerBusy = false;
WebServer server(80);


#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
String lockerNumber = "1";
String readyTime = "--:--";
#define SERVO_PIN D7
#define PWDN_GPIO_NUM     -1
#define RESET_GPIO_NUM    -1

#define XCLK_GPIO_NUM     10

#define SIOD_GPIO_NUM     40
#define SIOC_GPIO_NUM     39

#define Y9_GPIO_NUM       48
#define Y8_GPIO_NUM       11
#define Y7_GPIO_NUM       12
#define Y6_GPIO_NUM       14
#define Y5_GPIO_NUM       16
#define Y4_GPIO_NUM       18
#define Y3_GPIO_NUM       17
#define Y2_GPIO_NUM       15

#define VSYNC_GPIO_NUM    38
#define HREF_GPIO_NUM     47
#define PCLK_GPIO_NUM     13
// Function Prototypes
void showWaitingScreen();
void showReadyScreen();
void showArrivedScreen();
void openLocker();


void captureAndSendImage() {

  Serial.println("Capturing frame...");

  camera_fb_t *fb = esp_camera_fb_get();

  if (!fb) {
    Serial.println("Camera capture failed!");
    return;
  }

  HTTPClient http;

  http.begin(SERVER_URL);
  http.addHeader("Content-Type", "image/jpeg");

  int code = http.POST(fb->buf, fb->len);

  if (code == 200) {

    String response = http.getString();

    Serial.println(response);

    DynamicJsonDocument doc(512);

    DeserializationError err = deserializeJson(doc, response);

    if (!err) {

      bool match = doc["match"];
      String detectedPlate = doc["plate"].as<String>();

      if (match) {


        Serial.println("Vehicle Matched");
        lockerBusy = true;

        showArrivedScreen();
        delay(100);
        delay(2000);

        openLocker();
        HTTPClient collectedHttp;

        collectedHttp.begin("http://10.249.34.105:5000/mark-collected");
        collectedHttp.addHeader("Content-Type", "application/json");

        String json = "{\"plate\":\"" + detectedPlate + "\"}";

        int collectedCode = collectedHttp.POST(json);

        Serial.print("Collected Update Code: ");
        Serial.println(collectedCode);

        if (collectedCode > 0) {
            Serial.println(collectedHttp.getString());
        }

        collectedHttp.end();

        display.clearDisplay();

        display.setTextSize(2);

        display.setCursor(18,12);
        display.println("THANK");

        display.setCursor(28,38);
        display.println("YOU!");

        display.display();

        delay(3000);

        showWaitingScreen();
        lockerBusy = false;
      }
      else {

        Serial.println("Vehicle Not Found");
      }
    }
  }

  else {

    Serial.print("POST Failed : ");
    Serial.println(code);
  }

  http.end();

  esp_camera_fb_return(fb);
}
void showWaitingScreen() {

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  display.setTextSize(2);
  display.setCursor(0,10);
  display.println("WAITING");

  display.setCursor(0,35);
  display.println("VEHICLE");

  display.display();
}
void showArrivedScreen() {

  Serial.println("Showing Arrived Screen");

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  display.setTextSize(2);

  display.setCursor(0, 8);
  display.println("VEHICLE");

  display.setCursor(10, 35);
  display.println("ARRIVED");

  display.display();
}
void showReadyScreen() {

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  display.setTextSize(2);
  display.setCursor(0, 0);
  display.println("PLEASE");
  display.println("COLLECT");
  display.println("FOOD");

  display.setTextSize(1);

  display.setCursor(0, 50);
  display.print("Locker:");
  display.print(lockerNumber);

  display.setCursor(70, 50);
  display.print("Time:");
  display.print(readyTime);

  display.display();
}

void openLocker() {
  Serial.println("openLocker() called");

  Serial.println();
  Serial.println("========================================");
  Serial.println("VEHICLE MATCHED");
  Serial.println("Opening Locker...");
  Serial.println("========================================");

  // Show vehicle matched
  display.clearDisplay();

  display.setTextColor(SSD1306_WHITE);

  display.setTextSize(2);

  display.setCursor(10,0);
  display.println("PLEASE");

  display.setCursor(0,24);
  display.println("TAKE FOOD");

  display.display();
  delay(100);
  // Open servo
  Serial.println("Opening Door");

  lockerServo.write(90);   // Open position
  delay(500);

  Serial.println("Servo Opened");

  // Ask customer to take food
  display.clearDisplay();

  display.setTextSize(2);
  display.setCursor(10, 0);
  display.println("PLEASE");

  display.setCursor(0, 22);
  display.println("TAKE FOOD");

  display.setTextSize(1);
  display.setCursor(20, 52);
  display.println("Door Open");
  display.display();

  // Keep door open
  delay(5000);

  // Closing message
  display.clearDisplay();

  display.setTextSize(2);
  display.setCursor(10, 15);
  display.println("CLOSING");

  display.display();

  Serial.println("Closing Door");

  lockerServo.write(0);   // Closed position
  delay(700);

  Serial.println("Servo Closed");

  Serial.println("Locker Closed");
  Serial.println("========================================");

}

void setup() {

  Serial.begin(115200);
  delay(3000);
  Wire.begin(D8, D9);

  Serial.println();
  Serial.println("========================================");
  Serial.println(" SMART LOCKER SYSTEM");
  Serial.println("========================================");

  // ---------------- OLED ----------------
  

  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("OLED Initialization Failed!");
    while (1);
  }

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(2);
  display.setCursor(10,20);
  display.println("BOOTING");
  display.display();

  Serial.println("OLED Initialized");

  // ---------------- WiFi ----------------
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  Serial.print("Connecting to WiFi");

  int retry = 0;

  while (WiFi.status() != WL_CONNECTED && retry < 60) {
    delay(500);
    Serial.print(".");
    retry++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("WiFi Connected! IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("WiFi connection failed!");

    Serial.print("WiFi Status = ");
  
    Serial.println(WiFi.status());
  }

  // ---------------- Camera ----------------
  camera_config_t config;

  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;

  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;

  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;

  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;

  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;

  config.xclk_freq_hz = 20000000;

  config.pixel_format = PIXFORMAT_JPEG;

  config.grab_mode = CAMERA_GRAB_WHEN_EMPTY;

  config.fb_location = CAMERA_FB_IN_PSRAM;

  config.frame_size = FRAMESIZE_VGA;

  config.jpeg_quality = 12;

  config.fb_count = 1;

  esp_err_t err = esp_camera_init(&config);

  if (err != ESP_OK) {
    Serial.printf("Camera Init Failed : 0x%x\n", err);
    return;
  }

  Serial.println("Camera Initialized");
  camera_fb_t *fb = esp_camera_fb_get();

if (fb) {
    Serial.println("Initial camera test OK");
    esp_camera_fb_return(fb);
} else {
    Serial.println("Initial camera test FAILED");
}

  sensor_t *s = esp_camera_sensor_get();

  if (s != NULL) {
    s->set_vflip(s, 0);
    s->set_hmirror(s, 0);
  }

  // ---------------- Servo ----------------
  lockerServo.setPeriodHertz(50);

  lockerServo.attach(SERVO_PIN, 500, 2400);

  Serial.println("Servo Attached");

  Serial.println("Testing Servo...");

  lockerServo.write(90);

  delay(1500);

  lockerServo.write(0);

  delay(1000);

  Serial.println("Servo Test Complete");

  // ---------------- Web Server ----------------

  

  server.on("/ready", []() {

    if (server.hasArg("locker"))
      lockerNumber = server.arg("locker");

    if (server.hasArg("time"))
      readyTime = server.arg("time");

    Serial.println("========================");
    Serial.println("Food Ready");
    Serial.print("Locker : ");
    Serial.println(lockerNumber);
    Serial.print("Ready Time : ");
    Serial.println(readyTime);

    showReadyScreen();     

    server.send(200, "text/plain", "READY");
});


  

  server.begin();

  Serial.println("Locker Server Started");

  // ---------------- Initial Screen ----------------

  showWaitingScreen();

  Serial.println();
  Serial.println("========================================");
  Serial.println(" SYSTEM READY");
  Serial.println(" Waiting For Customer...");
  Serial.println("========================================");
}

void loop() {

  server.handleClient();

  static unsigned long lastCapture = 0;

  if (!lockerBusy && millis() - lastCapture >= 5000) {

    lastCapture = millis();

    captureAndSendImage();
}

  delay(10);
}