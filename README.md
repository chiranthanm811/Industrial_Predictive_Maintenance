# Industrial Predictive Maintenance Suite (LiveTwin)

A real-time Condition Monitoring and Predictive Maintenance testbench for an RS-775 industrial DC motor. This system uses an ESP8266 Wi-Fi microcontroller, physical sensors, a 5V relay safety cut-off switch, a Python backend, and a 3D SCADA dashboard.

---

## Hardware Components Used

* **RS-775 DC Motor**: High-power motor under test
* **ESP8266 NodeMCU**: Microcontroller with Wi-Fi
* **LM35 Temperature Sensor**: Monitors motor temperature
* **5V Relay Module**: Emergency automatic shut-off switch
* **1N4007 Diode**: Protects electronics from motor voltage spikes
* **12V DC Adapter**: Powers the motor
* **Breadboard & Jumper Wires**: Connects the circuit

---

## Step-by-Step Wiring Connections

### 1. Breadboard & Sensor Connections
* **ESP8266 VIN pin** -> Breadboard Positive Rail (+)
* **ESP8266 GND pin** -> Breadboard Negative Rail (-)
* **LM35 Left pin (VCC)** -> Breadboard Positive Rail (+)
* **LM35 Middle pin (Signal)** -> ESP8266 pin A0
* **LM35 Right pin (GND)** -> Breadboard Negative Rail (-)

### 2. Relay & Motor Safety Switch
* **5V Relay VCC pin** -> Breadboard Positive Rail (+)
* **5V Relay GND pin** -> Breadboard Negative Rail (-)
* **5V Relay IN pin** -> ESP8266 pin D1
* **12V Adapter Positive wire (+)** -> Relay COM terminal
* **Relay NO terminal** -> Motor Positive (+) tab
* **12V Adapter Negative wire (-)** -> Motor Negative (-) tab

### 3. Diode Protection (Across Motor)
* **1N4007 Diode Silver stripe side** -> Motor Positive (+) tab
* **1N4007 Diode Black side** -> Motor Negative (-) tab

---

## Project Status

- [x] Phase 1: Clean folder setup and GitHub repository
- [ ] Phase 2: Benchtop assembly and physical wiring
- [ ] Phase 3: ESP8266 code for reading temperature and switching relay
- [ ] Phase 4: Python backend live data stream
- [ ] Phase 5: 3D interactive dashboard