import time
import json
import threading
import random
from flask import Flask, jsonify, request
from flask_cors import CORS
import paho.mqtt.client as mqtt

app = Flask(__name__)
CORS(app)

# ==========================================
# 1. CONFIGURATION & INDUSTRIAL FAULT PROFILES
# ==========================================
MQTT_BROKER = "localhost"
MQTT_PORT = 1883
TOPIC_TELEMETRY = "livetwin/motor/telemetry"
TOPIC_CONTROL = "livetwin/motor/control"

FAULT_PROFILES = {
    "NORMAL": {
        "name": "Normal Operation",
        "target_rpm": 1480.0,
        "temp_rate": -0.3,
        "target_temp": 41.8,
        "vib_base": 1.42,
        "vib_jitter": 0.08,
        "rul_drain_rate": 0.0,
        "state": "RUNNING"
    },
    "BEARING_WEAR": {
        "name": "Bearing Race Spalling",
        "target_rpm": 1320.0,
        "temp_rate": 0.45,
        "target_temp": 76.0,
        "vib_base": 5.85,
        "vib_jitter": 0.95,
        "rul_drain_rate": 3.2,
        "state": "DEGRADING"
    },
    "THERMAL_OVERLOAD": {
        "name": "Stator Thermal Overload",
        "target_rpm": 1380.0,
        "temp_rate": 1.40,
        "target_temp": 112.0,
        "vib_base": 2.25,
        "vib_jitter": 0.30,
        "rul_drain_rate": 5.5,
        "state": "CRITICAL_HEAT"
    },
    "BRUSH_ARCING": {
        "name": "Commutator Brush Arcing",
        "target_rpm": 1250.0,
        "temp_rate": 0.60,
        "target_temp": 84.0,
        "vib_base": 3.40,
        "vib_jitter": 1.60,
        "rul_drain_rate": 4.0,
        "state": "ELECTRICAL_FAULT"
    },
    "ROTOR_IMBALANCE": {
        "name": "Bent Shaft / Imbalance",
        "target_rpm": 1340.0,
        "temp_rate": 0.30,
        "target_temp": 65.0,
        "vib_base": 7.60,
        "vib_jitter": 1.85,
        "rul_drain_rate": 4.8,
        "state": "HIGH_VIBRATION"
    },
    "WINDING_SHORT": {
        "name": "Winding Short-Circuit",
        "target_rpm": 940.0,
        "temp_rate": 2.10,
        "target_temp": 125.0,
        "vib_base": 4.30,
        "vib_jitter": 0.80,
        "rul_drain_rate": 9.5,
        "state": "SHORT_CIRCUIT"
    },
    "COOLING_FAILURE": {
        "name": "Cooling Impeller Jam",
        "target_rpm": 1460.0,
        "temp_rate": 1.15,
        "target_temp": 102.0,
        "vib_base": 1.90,
        "vib_jitter": 0.20,
        "rul_drain_rate": 3.8,
        "state": "FAN_BLOCKED"
    },
    "EMERGENCY_STOP": {
        "name": "Emergency Stop (Tripped)",
        "target_rpm": 0.0,
        "temp_rate": -0.8,
        "target_temp": 28.0,
        "vib_base": 0.0,
        "vib_jitter": 0.0,
        "rul_drain_rate": 0.0,
        "state": "STOPPED"
    }
}

# ==========================================
# 2. RUNTIME SYSTEM STATE
# ==========================================
state_lock = threading.Lock()
telemetry_state = {
    "rpm": 1480.0,
    "temp": 41.8,
    "vibration": 1.42,
    "rul": 300.0,
    "health": 98.5,
    "state": "RUNNING",
    "active_fault": "NORMAL",
    "relay_closed": True,
    "hardware_connected": False,
    "last_update": time.time()
}

# ==========================================
# 3. MQTT CLIENT SETUP
# ==========================================
mqtt_client = mqtt.Client(client_id="LiveTwin_Python_Core")

def on_connect(client, userdata, flags, rc):
    print(f"[MQTT] Connected to broker with result code {rc}")
    client.subscribe(TOPIC_TELEMETRY)

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        with state_lock:
            # If real LM35 hardware streams temp, inject it directly
            if "temp" in payload and payload["temp"] > 0:
                telemetry_state["temp"] = float(payload["temp"])
                telemetry_state["hardware_connected"] = True
            telemetry_state["last_update"] = time.time()
    except Exception as e:
        print(f"[MQTT ERROR] Failed parsing message: {e}")

mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message

def start_mqtt():
    try:
        mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
        mqtt_client.loop_start()
    except Exception as e:
        print(f"[MQTT WARNING] Local broker connection failed ({e}). Running in standalone simulation mode.")

def publish_relay_command(cmd):
    try:
        mqtt_client.publish(TOPIC_CONTROL, cmd)
        print(f"[HARDWARE INTERLOCK] Published command to Relay: {cmd}")
    except Exception as e:
        print(f"[MQTT ERROR] Failed to send relay command: {e}")

# ==========================================
# 4. PHYSICS ENGINE SIMULATION THREAD
# ==========================================
def physics_simulation_loop():
    while True:
        with state_lock:
            fault_key = telemetry_state["active_fault"]
            profile = FAULT_PROFILES.get(fault_key, FAULT_PROFILES["NORMAL"])

            # 1. RPM Ramp Dynamics
            target_rpm = profile["target_rpm"]
            if not telemetry_state["relay_closed"]:
                target_rpm = 0.0

            rpm_step = 45.0 if target_rpm > telemetry_state["rpm"] else 75.0
            if abs(telemetry_state["rpm"] - target_rpm) > 2.0:
                if telemetry_state["rpm"] < target_rpm:
                    telemetry_state["rpm"] = min(target_rpm, telemetry_state["rpm"] + rpm_step)
                else:
                    telemetry_state["rpm"] = max(target_rpm, telemetry_state["rpm"] - rpm_step)
            else:
                telemetry_state["rpm"] = target_rpm

            # Brush arcing erratic stutter
            if fault_key == "BRUSH_ARCING" and telemetry_state["rpm"] > 200:
                telemetry_state["rpm"] += random.uniform(-65.0, 45.0)

            # 2. Temperature Dynamics (only simulate if hardware sensor isn't actively overriding)
            if not telemetry_state["hardware_connected"]:
                target_temp = profile["target_temp"]
                if telemetry_state["temp"] < target_temp:
                    telemetry_state["temp"] += profile["temp_rate"] * 0.15
                elif telemetry_state["temp"] > target_temp:
                    telemetry_state["temp"] -= 0.15
                telemetry_state["temp"] = max(24.0, telemetry_state["temp"])

            # 3. Vibration Acceleration Dynamics (g)
            if telemetry_state["rpm"] > 50:
                rpm_ratio = telemetry_state["rpm"] / 1480.0
                jitter = random.uniform(-profile["vib_jitter"], profile["vib_jitter"])
                telemetry_state["vibration"] = max(0.05, round((profile["vib_base"] * rpm_ratio) + jitter, 2))
            else:
                telemetry_state["vibration"] = 0.0

            # 4. Remaining Useful Life (RUL) & Health Drain
            if profile["rul_drain_rate"] > 0 and telemetry_state["rul"] > 0:
                telemetry_state["rul"] = max(0.0, telemetry_state["rul"] - profile["rul_drain_rate"] * 0.2)
            elif fault_key == "NORMAL" and telemetry_state["rul"] < 300.0:
                telemetry_state["rul"] = min(300.0, telemetry_state["rul"] + 1.5)

            telemetry_state["health"] = max(0.0, min(100.0, round((telemetry_state["rul"] / 300.0) * 100.0, 1)))

            # 5. Automated Hardware Trip Protection
            if telemetry_state["relay_closed"]:
                if telemetry_state["rul"] <= 0.0 or telemetry_state["temp"] >= 120.0 or fault_key == "EMERGENCY_STOP":
                    telemetry_state["relay_closed"] = False
                    telemetry_state["state"] = "TRIPPED_OFFLINE"
                    publish_relay_command("STOP")
                else:
                    telemetry_state["state"] = profile["state"]
            else:
                telemetry_state["state"] = "STOPPED"

        time.sleep(0.1)

# ==========================================
# 5. REST API ENDPOINTS
# ==========================================
@app.route('/api/telemetry', methods=['GET'])
def get_telemetry():
    with state_lock:
        return jsonify({
            "rpm": round(telemetry_state["rpm"], 0),
            "temp": round(telemetry_state["temp"], 1),
            "vibration": round(telemetry_state["vibration"], 2),
            "rul": round(telemetry_state["rul"], 0),
            "health": telemetry_state["health"],
            "state": telemetry_state["state"],
            "active_fault": telemetry_state["active_fault"],
            "relay_closed": telemetry_state["relay_closed"],
            "hardware_connected": telemetry_state["hardware_connected"]
        })

@app.route('/api/fault', methods=['POST'])
def inject_fault():
    data = request.get_json() or {}
    fault = data.get("fault", "NORMAL").upper()
    if fault not in FAULT_PROFILES:
        return jsonify({"error": f"Unknown fault mode: {fault}"}), 400

    with state_lock:
        telemetry_state["active_fault"] = fault
        if fault == "NORMAL":
            telemetry_state["relay_closed"] = True
            telemetry_state["rul"] = 300.0
            publish_relay_command("RESET")
        elif fault == "EMERGENCY_STOP":
            telemetry_state["relay_closed"] = False
            publish_relay_command("STOP")

    return jsonify({"status": "SUCCESS", "active_fault": fault})

@app.route('/api/control', methods=['POST'])
def control_system():
    data = request.get_json() or {}
    cmd = data.get("command", "").upper()

    with state_lock:
        if cmd == "STOP":
            telemetry_state["active_fault"] = "EMERGENCY_STOP"
            telemetry_state["relay_closed"] = False
            publish_relay_command("STOP")
        elif cmd == "RESET":
            telemetry_state["active_fault"] = "NORMAL"
            telemetry_state["relay_closed"] = True
            telemetry_state["rul"] = 300.0
            publish_relay_command("RESET")
        else:
            return jsonify({"error": f"Invalid command: {cmd}"}), 400

    return jsonify({"status": "SUCCESS", "command": cmd, "relay_closed": telemetry_state["relay_closed"]})

# ==========================================
# 6. SERVER ENTRY POINT
# ==========================================
if __name__ == '__main__':
    start_mqtt()
    sim_thread = threading.Thread(target=physics_simulation_loop, daemon=True)
    sim_thread.start()
    print("[SYSTEM READY] LiveTwin Industrial Core serving on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=False)