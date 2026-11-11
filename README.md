# Industrial Predictive Maintenance Suite (LiveTwin)

An industrial condition monitoring and predictive maintenance (PdM) cyber-physical testbench for an RS-775 DC motor. Pairs real-time sensor telemetry and a closed-loop hardware safety interlock with an interactive 3D WebGL SCADA digital twin.

---

##  Tech Stack & Components

### Software
* **Frontend:** React, Vite, Three.js (WebGL 3D SCADA Twin)
* **Backend:** Python (Flask), REST / WebSockets
* **Firmware:** C++ / Arduino (ESP8266 NodeMCU)

### Hardware Under Test
* **RS-775 High-Torque DC Motor** (12V)
* **ESP8266 NodeMCU** (Wi-Fi Telemetry Node)
* **LM35 Precision Centigrade Sensor** (Motor Casing Temperature)
* **5V 1-Channel Relay Module** (Hardware Power-Cutoff Safety Interlock)
* **1N4007 Diode** (Flyback / Back-EMF Surge Protection)
* **12V DC Adapter / SMPS** (High-Current Motor Drive)

---

##  Hardware Pinout & Wiring Matrix (Phase 2 Spec)

| Part Pin / Wire | Connects To | Purpose |
| :--- | :--- | :--- |
| **ESP8266 VIN** | Breadboard Positive Rail (`+`) | 5V Logic Power Feed |
| **ESP8266 GND** | Breadboard Ground Rail (`-`) | Common Ground Reference |
| **LM35 Left Pin (VCC)** | Breadboard Positive Rail (`+`) | 5V Sensor Supply |
| **LM35 Middle Pin (Out)** | ESP8266 Pin **A0** | Analog Temperature Signal |
| **LM35 Right Pin (GND)** | Breadboard Ground Rail (`-`) | Sensor Ground |
| **5V Relay VCC** | Breadboard Positive Rail (`+`) | Relay Coil Power |
| **5V Relay GND** | Breadboard Ground Rail (`-`) | Relay Ground |
| **5V Relay IN** | ESP8266 Pin **D1** | Digital Safety Trip Control |
| **12V Adapter Positive wire** | Relay **COM** Terminal | Switched Motor Power In |
| **Relay NO Terminal** | RS-775 Motor **Positive (`+`) tab** | Motor Power Out |
| **12V Adapter Negative wire** | RS-775 Motor **Negative (`-`) tab** | Direct Ground Return |
| **1N4007 Diode (Silver Band)**| RS-775 Motor **Positive (`+`) tab** | Flyback Cathode |
| **1N4007 Diode (Black End)** | RS-775 Motor **Negative (`-`) tab** | Flyback Anode |

---

##  Repository Structure

```text
Industrial_Predictive_Maintenance/
├── frontend/             # React + Three.js 3D Diagnostic SCADA
├── backend/              # Python API & Telemetry Processing
├── firmware/             # ESP8266 Microcontroller Code
├── hardware/             # Wiring Schematics & BOM
└── README.md             # Project Execution & Milestone Log
