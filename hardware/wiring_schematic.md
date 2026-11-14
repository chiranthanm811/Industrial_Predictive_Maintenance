# Phase 2: Hardware Wiring & Bill of Materials (BOM) Specification
**Project:** Industrial Predictive Maintenance & Condition Monitoring Suite (LiveTwin)  
**Lab:** MVJCE Tinkering Lab  

---

## 1. Bill of Materials (Parts List)

| Item | Component Name | Quantity | Lab Specification / Purpose |
| :--- | :--- | :---: | :--- |
| **1** | ESP8266 NodeMCU | 1 | Main Wi-Fi microcontroller (CP2102 or CH340) |
| **2** | DS18B20 Digital Temp Probe | 1 | Waterproof stainless steel probe (1-Wire digital) |
| **3** | Resistor 4.7kΩ (1/4W) | 1 | DS18B20 data line pull-up resistor (Yellow-Purple-Red) |
| **4** | Piezoelectric Vibration Sensor | 1 | Ceramic piezo element / disc (Analog vibration pickup) |
| **5** | 0.96" I2C OLED Display | 1 | SSD1306 (128x64 resolution, 4 pins: VCC, GND, SCL, SDA) |
| **6** | 1-Channel 5V Relay Module | 1 | Optocoupled coil with COM / NO / NC screw terminals |
| **7** | RS-775 High-Torque DC Motor | 1 | 12V Industrial motor rig under test |
| **8** | 1N4007 Diode | 1 | Inductive flyback diode (1A 1000V rated) |
| **9** | 12V DC Power Adapter | 1 | External power supply for RS-775 motor (>= 2A) |
| **10** | Green 5mm LED | 1 | "System Healthy / Running" status indicator |
| **11** | Red 5mm LED | 1 | "System Tripped / Fault Warning" status indicator |
| **12** | Resistor 220Ω (1/4W) | 2 | Current limiting for LEDs (Red-Red-Brown) |
| **13** | 5V Active Buzzer | 1 | Critical audio alarm |
| **14** | Solderless Breadboard | 1 | Full-size 830 tie-point breadboard |
| **15** | Jumper Wires (M-M & M-F) | ~20 | Solid-core & stranded Dupont jumpers |

---

## 2. Final Part-by-Part Connection Matrix

| Part | Connection |
| :--- | :--- |
| **ESP8266 VIN** | to Breadboard Positive Rail (`+`) |
| **ESP8266 GND** | to Breadboard Ground Rail (`-`) |
| | |
| **Green LED long leg (Anode)** | to one leg of a 220 ohm resistor |
| **That resistor's other leg** | to ESP8266 **D5** |
| **Green LED short leg (Cathode)** | to Breadboard Ground Rail (`-`) |
| | |
| **Red LED long leg (Anode)** | to one leg of the second 220 ohm resistor |
| **That resistor's other leg** | to ESP8266 **D6** |
| **Red LED short leg (Cathode)** | to Breadboard Ground Rail (`-`) |
| | |
| **Buzzer + leg (marked with a plus / longer leg)** | to ESP8266 **D7** |
| **Buzzer other leg** | to Breadboard Ground Rail (`-`) |
| | |
| **DS18B20 Red wire (VCC)** | to ESP8266 **3V3** |
| **DS18B20 Black wire (GND)** | to Breadboard Ground Rail (`-`) |
| **DS18B20 Yellow wire (DATA)** | to ESP8266 **D4** |
| **4.7k ohm resistor one leg** | to ESP8266 **3V3** |
| **That 4.7k ohm resistor other leg** | to ESP8266 **D4** *(same tie-point row as yellow wire)* |
| | |
| **Piezo sensor Red wire (Center disc)** | to ESP8266 **A0** |
| **Piezo sensor Black wire (Outer ring)** | to Breadboard Ground Rail (`-`) |
| | |
| **OLED VCC** | to Breadboard Positive Rail (`+`) |
| **OLED GND** | to Breadboard Ground Rail (`-`) |
| **OLED SCL** | to ESP8266 **D2** |
| **OLED SDA** | to ESP8266 **D3** |
| | |
| **5V Relay VCC** | to Breadboard Positive Rail (`+`) |
| **5V Relay GND** | to Breadboard Ground Rail (`-`) |
| **5V Relay IN** | to ESP8266 **D1** |
| | |
| **12V Adapter Positive wire (`+`)** | to Relay **COM** screw terminal |
| **Relay NO (Normally Open) terminal** | to RS-775 Motor **Positive (`+`) tab** |
| **12V Adapter Negative wire (`-`)** | to RS-775 Motor **Negative (`-`) tab** |
| | |
| **1N4007 Diode Silver stripe end (Cathode)** | to RS-775 Motor **Positive (`+`) tab** |
| **1N4007 Diode other end (Anode)** | to RS-775 Motor **Negative (`-`) tab** |
