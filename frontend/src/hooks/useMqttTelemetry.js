import { useState, useEffect, useRef } from 'react';
import mqtt from 'mqtt';

/**
 * useMqttTelemetry.js
 * -----------------------------------------------------------------------------
 * Custom React Hook that establishes and manages a resilient WebSocket MQTT
 * connection to ingest telemetry from the physical ESP8266/ESP32 NodeMCU.
 *
 * Plain-Language Analogy:
 * Think of this hook as a radio communication officer stationed at a base.
 * As long as the base is operational (mounted), the officer listens on the
 * assigned frequency (topic). When raw Morse code arrives (JSON packet), the
 * officer validates the signal, extracts the mission parameters (rpm, temp),
 * and posts them onto the operations board. If communications drop, the officer
 * continuously attempts reconnection. When the station shuts down (unmount),
 * the officer cleanly signs off to avoid radio static (memory leaks).
 */

// Default public MQTT WebSocket broker & topic
const DEFAULT_BROKER_URL = 'wss://test.mosquitto.org:8081/mqtt';
const DEFAULT_TOPIC = 'pdm/rs775/telemetry';

export function useMqttTelemetry({
  brokerUrl = DEFAULT_BROKER_URL,
  topic = DEFAULT_TOPIC,
  enableSimulation = false,
} = {}) {
  // Connection state: 'connecting' | 'connected' | 'disconnected' | 'error'
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  // Real-time telemetry state exposed to UI components for rendering dials/gauges
  const [telemetry, setTelemetry] = useState({
    rpm: 0,
    temp: 28, // Default ambient room temperature (28°C)
    timestamp: Date.now(),
    source: 'idle',
  });

  // Reference to hold latest telemetry without forcing React re-render cycles
  // when passed directly into high-frequency Three.js useFrame animation loops.
  const telemetryRef = useRef(telemetry);
  useEffect(() => {
    telemetryRef.current = telemetry;
  }, [telemetry]);

  /**
   * CORE REACT HOOK: useEffect for Network Lifecycle Management
   * 
   * Role:
   * 1. Runs once when the component mounts (or when brokerUrl/topic changes).
   * 2. Opens the asynchronous WebSocket connection to the MQTT broker.
   * 3. Sets up event listeners for 'connect', 'message', 'error', and 'close'.
   * 4. Returns a cleanup function that guarantees the WebSocket socket is safely
   *    terminated when the component unmounts, preventing ghost socket leaks.
   */
  useEffect(() => {
    // If the developer activates simulation mode, bypass network connection
    if (enableSimulation) {
      setConnectionStatus('simulated');
      return;
    }

    setConnectionStatus('connecting');

    // Generate unique client ID to prevent broker connection collisions
    const clientId = `livetwin_client_${Math.random().toString(16).substring(2, 10)}`;

    // Initialize MQTT client over secure WebSockets
    const client = mqtt.connect(brokerUrl, {
      clientId,
      clean: true,
      connectTimeout: 5000,
      reconnectPeriod: 3000, // Auto-reconnect every 3 seconds if disconnected
    });

    // 1. Connection established callback
    client.on('connect', () => {
      setConnectionStatus('connected');
      // Subscribe to telemetry topic
      client.subscribe(topic, { qos: 0 }, (err) => {
        if (err) {
          console.error(`[MQTT] Failed to subscribe to topic ${topic}:`, err);
        } else {
          console.log(`[MQTT] Successfully subscribed to ${topic}`);
        }
      });
    });

    // 2. Incoming message callback (Async packet processing)
    client.on('message', (receivedTopic, messageBuffer) => {
      if (receivedTopic !== topic) return;

      try {
        const payloadString = messageBuffer.toString();
        const data = JSON.parse(payloadString);

        // Extract and sanitize telemetry properties
        const newRpm = typeof data.rpm === 'number' ? Math.max(0, data.rpm) : 0;
        const newTemp = typeof data.temp === 'number' ? Math.max(0, data.temp) : 28;

        const updatedTelemetry = {
          rpm: newRpm,
          temp: newTemp,
          timestamp: Date.now(),
          source: 'mqtt-live',
        };

        // Update React state (triggers UI gauge updates)
        setTelemetry(updatedTelemetry);
      } catch (err) {
        console.warn('[MQTT] Received malformed JSON payload:', err);
      }
    });

    // 3. Error handling
    client.on('error', (err) => {
      console.error('[MQTT] Connection error:', err);
      setConnectionStatus('error');
    });

    // 4. Disconnect handling
    client.on('close', () => {
      setConnectionStatus('disconnected');
    });

    // Cleanup: When component unmounts, tear down the socket cleanly
    return () => {
      if (client.connected) {
        client.unsubscribe(topic);
      }
      client.end(true); // Force clean disconnect
    };
  }, [brokerUrl, topic, enableSimulation]);

  return {
    telemetry,
    telemetryRef, // Mutable ref for 60fps render loop direct access
    connectionStatus,
    setTelemetry, // Allows manual override in UI simulator
  };
}
