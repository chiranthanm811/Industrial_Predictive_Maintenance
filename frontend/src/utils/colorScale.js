import * as THREE from 'three';

/**
 * colorScale.js
 * -----------------------------------------------------------------------------
 * Provides thermal color gradient calculation for the RS-775 motor casing.
 * 
 * Physics / Thermal Context:
 * - Nominal Room / Safe Operating Temperature: <= 35°C (Cool Industrial Steel: #94a3b8)
 * - Elevated Load / Caution Temperature: ~55°C (Warm Amber Warning: #f59e0b)
 * - Critical Thermal Overheat / Coil Degradation: >= 80°C (Crimson Red / Hazard: #ef4444)
 */

// Baseline normal color (Cold / Nominal steel casing)
const COLOR_NORMAL = new THREE.Color('#94a3b8');

// Intermediate caution color (Thermal stress)
const COLOR_WARNING = new THREE.Color('#f59e0b');

// Critical overheat color (Thermal runaway threshold)
const COLOR_CRITICAL = new THREE.Color('#ef4444');

/**
 * Calculates a THREE.Color corresponding to the provided temperature in Celsius.
 *
 * @param {number} temp - Current motor temperature in degrees Celsius (°C)
 * @returns {THREE.Color} - Interpolated color instance
 */
export function getMotorThermalColor(temp) {
  const result = new THREE.Color();
  
  if (temp <= 35) {
    // Under 35°C, casing remains baseline metallic steel
    result.copy(COLOR_NORMAL);
  } else if (temp < 65) {
    // Between 35°C and 65°C, smoothly interpolate from Steel to Amber
    const factor = (temp - 35) / (65 - 35);
    result.copy(COLOR_NORMAL).lerp(COLOR_WARNING, factor);
  } else if (temp < 90) {
    // Between 65°C and 90°C, smoothly interpolate from Amber to Danger Red
    const factor = (temp - 65) / (90 - 65);
    result.copy(COLOR_WARNING).lerp(COLOR_CRITICAL, factor);
  } else {
    // Above 90°C: Maximum thermal alarm
    result.copy(COLOR_CRITICAL);
  }

  return result;
}

/**
 * Returns a human-readable thermal status label.
 */
export function getThermalStatusLabel(temp) {
  if (temp < 45) return { label: 'NOMINAL', colorClass: 'text-emerald-400' };
  if (temp < 70) return { label: 'ELEVATED', colorClass: 'text-amber-400' };
  return { label: 'CRITICAL OVERHEAT', colorClass: 'text-rose-500' };
}
