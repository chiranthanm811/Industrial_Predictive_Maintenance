\# Phase 2: Hardware Wiring Specification



\## 1. Bill of Materials

\* Microcontroller: ESP8266 NodeMCU (Wi-Fi Module)

\* Actuator: RS-775 High-Torque DC Motor

\* Sensor: LM35 Precision Centigrade Temperature Sensor

\* Power Safety: 5V Relay Module

\* Surge Protection: 1N4007 Flyback Diode

\* Power Source: 12V DC Adapter / SMPS



\## 2. Pinout \& Connection Matrix



| Part | Connection |

| :--- | :--- |

| \*\*ESP8266 VIN\*\* | to Breadboard Positive Rail (`+`) |

| \*\*ESP8266 GND\*\* | to Breadboard Ground Rail (`-`) |

| \*\*LM35 Left Pin (VCC)\*\* | to Breadboard Positive Rail (`+`) |

| \*\*LM35 Middle Pin (Out)\*\* | to ESP8266 Analog Pin \*\*A0\*\* |

| \*\*LM35 Right Pin (GND)\*\* | to Breadboard Ground Rail (`-`) |

| \*\*5V Relay VCC\*\* | to Breadboard Positive Rail (`+`) |

| \*\*5V Relay GND\*\* | to Breadboard Ground Rail (`-`) |

| \*\*5V Relay IN\*\* | to ESP8266 Digital Pin \*\*D1\*\* |

| \*\*12V Adapter Positive wire\*\* | to 5V Relay \*\*COM\*\* (Common) screw terminal |

| \*\*5V Relay NO (Normally Open)\*\* | to RS-775 Motor \*\*Positive (`+`) tab\*\* |

| \*\*12V Adapter Negative wire\*\* | to RS-775 Motor \*\*Negative (`-`) tab\*\* |

| \*\*1N4007 Diode Silver Band (Cathode)\*\* | to RS-775 Motor \*\*Positive (`+`) tab\*\* |

| \*\*1N4007 Diode Other Leg (Anode)\*\* | to RS-775 Motor \*\*Negative (`-`) tab\*\* |

