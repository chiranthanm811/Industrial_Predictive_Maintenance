import time
import json
import threading
from flask import Flask, request, jsonify
from flask_cors import CORS
import paho.mqtt.client as mqtt

app = Flask(__name__)
CORS(app)

motor_state = {
    "rpm": 1480,
    "temp": 42.0,
    "vibration": 1.4,
    "gas": 110,
    "health": 98.0,
    "rul": 300,
    "state": "RUNNING",
    "active_fault": "NONE",
    "fault_start_time": 0
}

broker_address = "localhost"
client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1, "LiveTwin_Publisher")

def on_connect(client, userdata, flags, rc):
    print(f"Connected to MQTT Broker with code {rc}")
    client.subscribe("livetwin/motor/control")

def on_message(client, userdata, msg):
    payload = msg.payload.decode()
    print(f"📥 MQTT Command Received [{msg.topic}]: {payload}")
    if payload in ["BEARING", "THERMAL", "ELECTRICAL", "IMBALANCE"]:
        motor_state["active_fault"] = payload
        motor_state["fault_start_time"] = time.time()
        motor_state["state"] = "DEGRADING"
    elif payload in ["STOP", "RESET"]:
        motor_state["active_fault"] = "NONE"
        motor_state["state"] = "RUNNING"

client.on_connect = on_connect
client.on_message = on_message

try:
    client.connect(broker_address, 1883, 60)
    client.loop_start()
except Exception as e:
    print(f"MQTT Connection Error: {e}")

@app.route('/command', methods=['POST'])
def handle_command():
    data = request.get_json()
    cmd = data.get("command")
    print(f"📥 Dashboard HTTP Command Received: {cmd}")
    
    if cmd in ["BEARING", "THERMAL", "ELECTRICAL", "IMBALANCE"]:
        motor_state["active_fault"] = cmd
        motor_state["fault_start_time"] = time.time()
        motor_state["state"] = "DEGRADING"
        return jsonify({"status": "success", "triggered": cmd}), 200
    elif cmd == "RESET" or cmd == "STOP":
        motor_state["active_fault"] = "NONE"
        motor_state["state"] = "RUNNING"
        return jsonify({"status": "success", "reset": True}), 200
    
    return jsonify({"status": "error", "message": "Unknown command"}), 400

@app.route('/telemetry', methods=['GET'])
def get_telemetry():
    return jsonify({
        "rpm": motor_state["rpm"],
        "temp": round(motor_state["temp"], 1),
        "vibration": round(motor_state["vibration"], 2),
        "gas": motor_state["gas"],
        "health": round(motor_state["health"], 1),
        "rul": max(0, int(300 * (motor_state["health"] / 100.0))),
        "state": motor_state["state"],
        "fault": motor_state["active_fault"]
    })

def publisher_loop():
    while True:
        now = time.time()
        fault = motor_state["active_fault"]
        
        if fault != "NONE":
            elapsed = now - motor_state["fault_start_time"]
            
            if fault == "BEARING":
                motor_state["vibration"] = min(9.5, 1.4 + (elapsed * 0.3))
                motor_state["temp"] = min(95.0, 42.0 + (elapsed * 0.8))
                motor_state["rpm"] = max(600, 1480 - int(elapsed * 20))
                motor_state["health"] = max(5.0, 98.0 - (elapsed * 2.5))
            
            elif fault == "THERMAL":
                motor_state["temp"] = min(115.0, 42.0 + (elapsed * 2.0))
                motor_state["vibration"] = min(6.0, 1.4 + (elapsed * 0.1))
                motor_state["rpm"] = max(500, 1480 - int(elapsed * 30))
                motor_state["health"] = max(5.0, 98.0 - (elapsed * 3.0))
            
            if motor_state["health"] < 20:
                motor_state["state"] = "CRITICAL"
            if motor_state["health"] <= 5:
                motor_state["state"] = "FAULT"
        else:
            motor_state["rpm"] = 1480
            motor_state["temp"] = 42.0
            motor_state["vibration"] = 1.4
            motor_state["gas"] = 110
            motor_state["health"] = 98.0
            motor_state["state"] = "RUNNING"

        payload = {
            "timestamp": int(now * 1000),
            "rpm": motor_state["rpm"],
            "temp": round(motor_state["temp"], 1),
            "vibration": round(motor_state["vibration"], 2),
            "gas": motor_state["gas"],
            "health": round(motor_state["health"], 1),
            "rul": max(0, int(300 * (motor_state["health"] / 100.0))),
            "state": motor_state["state"],
            "fault": motor_state["active_fault"]
        }
        
        try:
            client.publish("livetwin/motor/telemetry", json.dumps(payload))
        except:
            pass
            
        time.sleep(0.5)

if __name__ == '__main__':
    t = threading.Thread(target=publisher_loop, daemon=True)
    t.start()
    print("🚀 Mock Publisher running. HTTP server active on port 5000.")
    app.run(host='0.0.0.0', port=5000)