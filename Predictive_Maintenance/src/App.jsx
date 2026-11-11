import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

function Motor3D({ telemetry, shellMode, setShellMode }) {
  const mountRef = useRef(null);
  const telemetryRef = useRef(telemetry);
  const shellModeRef = useRef(shellMode);

  useEffect(() => { telemetryRef.current = telemetry; }, [telemetry]);
  useEffect(() => { shellModeRef.current = shellMode; }, [shellMode]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    container.innerHTML = '';

    const width = container.clientWidth || 680;
    const height = 400;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    camera.position.set(0.4, 1.4, 4.8);
    camera.lookAt(0, -0.1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Floor Grid & Status Halo
    const grid = new THREE.GridHelper(12, 24, 0x38bdf8, 0x1e293b);
    grid.position.y = -1.5;
    scene.add(grid);

    const haloGeo = new THREE.RingGeometry(1.9, 2.1, 64);
    haloGeo.rotateX(-Math.PI / 2);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0x10b981, side: THREE.DoubleSide });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.y = -1.48;
    scene.add(halo);

    // Studio & Internal Lights
    scene.add(new THREE.AmbientLight(0xffffff, 1.3));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
    keyLight.position.set(4, 6, 6);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
    rimLight.position.set(-5, 4, -4);
    scene.add(rimLight);

    const internalGlow = new THREE.PointLight(0xff3300, 0, 5);
    internalGlow.position.set(0, 0, 0.4);
    scene.add(internalGlow);

    const motorGroup = new THREE.Group();
    scene.add(motorGroup);

    // 1. SIDE-CUTAWAY STATOR HOUSING & FINS (Open toward front camera)
    const cutStart = Math.PI * 0.65;
    const cutLen = Math.PI * 1.1;

    const casingGeo = new THREE.CylinderGeometry(1.1, 1.1, 2.7, 48, 1, false, cutStart, cutLen);
    casingGeo.rotateZ(Math.PI / 2);
    const casingMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, metalness: 0.45, roughness: 0.3,
      side: THREE.DoubleSide, transparent: true, opacity: 1.0,
      emissive: 0x064e3b, emissiveIntensity: 0.2
    });
    motorGroup.add(new THREE.Mesh(casingGeo, casingMat));

    // Laminated Inner Stator Core with Slots
    const statorGeo = new THREE.CylinderGeometry(0.98, 0.98, 1.7, 36, 1, false, cutStart, cutLen);
    statorGeo.rotateZ(Math.PI / 2);
    const statorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a, metalness: 0.6, roughness: 0.4, side: THREE.DoubleSide
    });
    motorGroup.add(new THREE.Mesh(statorGeo, statorMat));

    // Full Ghost Shell for X-Ray / Solid Toggle
    const ghostGeo = new THREE.CylinderGeometry(1.09, 1.09, 2.7, 48);
    ghostGeo.rotateZ(Math.PI / 2);
    const ghostMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, metalness: 0.4, roughness: 0.3,
      transparent: true, opacity: 0.12, depthWrite: false
    });
    motorGroup.add(new THREE.Mesh(ghostGeo, ghostMat));

    // Cutaway Cooling Fins
    const finMat = new THREE.MeshStandardMaterial({
      color: 0x334155, metalness: 0.5, roughness: 0.25,
      side: THREE.DoubleSide, transparent: true, opacity: 1.0
    });
    for (let x = -1.1; x <= 1.1; x += 0.22) {
      const fGeo = new THREE.CylinderGeometry(1.24, 1.24, 0.045, 48, 1, false, cutStart, cutLen);
      fGeo.rotateZ(Math.PI / 2);
      const fin = new THREE.Mesh(fGeo, finMat);
      fin.position.x = x;
      motorGroup.add(fin);
    }

    // Top Terminal Box & Status Beacon Light
    const boxMesh = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.35, 0.65), finMat);
    boxMesh.position.set(0, 1.25, -0.2);
    motorGroup.add(boxMesh);

    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 1.5
    });
    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.22, 16), beaconMat);
    beacon.position.set(0, 1.52, -0.2);
    motorGroup.add(beacon);

    // Heavy Mounting Base
    const baseMesh = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.22, 1.6), finMat);
    baseMesh.position.y = -1.32;
    motorGroup.add(baseMesh);

    // 2. FRONT & REAR PRECISION BALL BEARINGS
    const bearingRaceMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8, metalness: 0.4, roughness: 0.2,
      emissive: 0x0284c7, emissiveIntensity: 0.3
    });
    const bearingBallMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, metalness: 0.5, roughness: 0.1,
      emissive: 0x38bdf8, emissiveIntensity: 0.2
    });

    function buildBearing(posX) {
      const g = new THREE.Group();
      g.position.x = posX;
      const outer = new THREE.TorusGeometry(0.54, 0.08, 16, 36);
      outer.rotateY(Math.PI / 2);
      g.add(new THREE.Mesh(outer, bearingRaceMat));

      const inner = new THREE.TorusGeometry(0.26, 0.07, 16, 36);
      inner.rotateY(Math.PI / 2);
      g.add(new THREE.Mesh(inner, bearingRaceMat));

      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), bearingBallMat);
        ball.position.set(0, Math.cos(a) * 0.4, Math.sin(a) * 0.4);
        g.add(ball);
      }
      return g;
    }

    const frontBearing = buildBearing(1.36);
    const rearBearing = buildBearing(-1.36);
    motorGroup.add(frontBearing);
    motorGroup.add(rearBearing);

    // Stationary Carbon Brush Holders at Rear Commutator (x = -1.04)
    const brushMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b, metalness: 0.7, roughness: 0.3,
      emissive: 0x000000, emissiveIntensity: 0
    });
    const topBrush = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.26, 0.18), brushMat);
    topBrush.position.set(-1.04, 0.46, 0);
    motorGroup.add(topBrush);

    const botBrush = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.26, 0.18), brushMat);
    botBrush.position.set(-1.04, -0.46, 0);
    motorGroup.add(botBrush);

    // 3. SPINNING ARMATURE ROTOR, COPPER WINDINGS, COMMUTATOR & FAN
    const rotorGroup = new THREE.Group();
    motorGroup.add(rotorGroup);

    const shaftGeo = new THREE.CylinderGeometry(0.18, 0.18, 4.6, 32);
    shaftGeo.rotateZ(Math.PI / 2);
    const shaft = new THREE.Mesh(shaftGeo, new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.6, roughness: 0.15 }));
    shaft.position.x = 0.2;
    rotorGroup.add(shaft);

    const coreGeo = new THREE.CylinderGeometry(0.54, 0.54, 1.45, 24);
    coreGeo.rotateZ(Math.PI / 2);
    const coreMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.5, roughness: 0.35 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.x = -0.05;
    rotorGroup.add(core);

    // Individual materials per coil so WINDING_SHORT can strobe specific shorted coils
    const coilMaterials = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const cGeo = new THREE.CylinderGeometry(0.12, 0.12, 1.55, 12);
      cGeo.rotateZ(Math.PI / 2);
      const cMat = new THREE.MeshStandardMaterial({
        color: 0xf97316, metalness: 0.35, roughness: 0.25,
        emissive: 0xd97706, emissiveIntensity: 0.25
      });
      coilMaterials.push(cMat);
      const coil = new THREE.Mesh(cGeo, cMat);
      coil.position.set(-0.05, Math.cos(a) * 0.58, Math.sin(a) * 0.58);
      rotorGroup.add(coil);
    }

    const endRingMat = new THREE.MeshStandardMaterial({
      color: 0xf97316, metalness: 0.35, roughness: 0.25,
      emissive: 0xd97706, emissiveIntensity: 0.25
    });
    const endGeo = new THREE.TorusGeometry(0.52, 0.13, 16, 32);
    endGeo.rotateY(Math.PI / 2);
    const fw = new THREE.Mesh(endGeo, endRingMat);
    fw.position.x = 0.65;
    rotorGroup.add(fw);

    const rw = new THREE.Mesh(endGeo, endRingMat);
    rw.position.x = -0.75;
    rotorGroup.add(rw);

    // Commutator Ring
    const commGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.34, 24);
    commGeo.rotateZ(Math.PI / 2);
    const commMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24, metalness: 0.5, roughness: 0.2,
      emissive: 0x000000, emissiveIntensity: 0
    });
    const comm = new THREE.Mesh(commGeo, commMat);
    comm.position.x = -1.04;
    rotorGroup.add(comm);

    // Separate Fan Group so Cooling Impeller Jam can seize the fan while rotor spins
    const fanGroup = new THREE.Group();
    motorGroup.add(fanGroup);

    const fanMat = new THREE.MeshStandardMaterial({
      color: 0x10b981, metalness: 0.25, roughness: 0.3,
      emissive: 0x059669, emissiveIntensity: 0.35
    });
    for (let i = 0; i < 8; i++) {
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.88, 0.22), fanMat);
      blade.position.x = 1.02;
      blade.rotation.x = (i / 8) * Math.PI;
      fanGroup.add(blade);
    }

    const couplerMat = new THREE.MeshStandardMaterial({
      color: 0x10b981, metalness: 0.25, roughness: 0.3,
      emissive: 0x059669, emissiveIntensity: 0.35
    });
    const coupler = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.82, 0.2), couplerMat);
    coupler.position.x = 2.25;
    rotorGroup.add(coupler);

    // 4. MULTI-MODE REAL-TIME PARTICLE SYSTEM (Sparks, Heat, Plasma Arcs, Short Discharges)
    const particleCount = 65;
    const particles = [];
    const pGeo = new THREE.SphereGeometry(0.04, 8, 8);

    for (let i = 0; i < particleCount; i++) {
      const pMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
      const p = new THREE.Mesh(pGeo, pMat);
      p.visible = false;
      scene.add(p);
      particles.push({
        mesh: p,
        mat: pMat,
        vx: 0, vy: 0, vz: 0,
        life: 0, maxLife: 18 + Math.random() * 20
      });
    }

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();

      const cur = telemetryRef.current;
      const mode = shellModeRef.current;

      // Shell View Modes
      if (mode === 'HALF') {
        casingMat.opacity = 1.0;
        finMat.opacity = 1.0;
        ghostMat.opacity = 0.12;
      } else if (mode === 'XRAY') {
        casingMat.opacity = 0.18;
        finMat.opacity = 0.18;
        ghostMat.opacity = 0.15;
      } else {
        casingMat.opacity = 1.0;
        finMat.opacity = 1.0;
        ghostMat.opacity = 0.96;
      }

      // 1. Dynamic Spin Speed (With micro-stutter on Brush Arcing)
      const stutter = cur.fault === 'BRUSH_ARCING' && Math.random() > 0.65 ? 0.15 : 1.0;
      const spinSpeed = Math.max(0, (cur.rpm / 1480) * 0.32 * stutter);
      rotorGroup.rotation.x += spinSpeed;
      frontBearing.rotation.x -= spinSpeed * 0.65;
      rearBearing.rotation.x -= spinSpeed * 0.65;

      // Cooling Fan Impeller Rotation (Seizes up during COOLING_JAM)
      if (cur.fault === 'COOLING_JAM') {
        fanGroup.rotation.x += Math.sin(Date.now() * 0.05) * 0.008; // Jammed jitter
      } else {
        fanGroup.rotation.x = rotorGroup.rotation.x;
      }

      // 2. Mechanical Shake + Off-Axis Shaft Wobble
      const shake = cur.vibration > 1.8 ? (cur.vibration - 1.4) * 0.038 : 0.001;
      motorGroup.position.y = (Math.random() - 0.5) * shake;
      motorGroup.position.z = (Math.random() - 0.5) * shake;

      if (cur.fault === 'BEARING' || cur.fault === 'IMBALANCE') {
        const wobbleAmp = cur.fault === 'IMBALANCE' ? 0.065 : 0.045;
        rotorGroup.rotation.z = Math.sin(Date.now() * 0.045) * wobbleAmp;
        rotorGroup.rotation.y = Math.cos(Date.now() * 0.045) * wobbleAmp;
      } else {
        rotorGroup.rotation.z = 0;
        rotorGroup.rotation.y = 0;
      }

      // 3. Particle Emitter (Sparks, Rising Heat, Brush Plasma, Winding Arcs)
      particles.forEach((p, idx) => {
        if (cur.fault === 'BEARING' && cur.rpm > 100) {
          p.mat.color.setHex(idx % 2 === 0 ? 0xffdd00 : 0xff2200);
          p.mesh.visible = true;
          p.life++;
          if (p.life >= p.maxLife) {
            p.life = 0;
            const side = idx % 2 === 0 ? 1.36 : -1.36;
            const angle = Math.random() * Math.PI * 2;
            p.mesh.position.set(side, Math.cos(angle) * 0.4, Math.sin(angle) * 0.4);
            p.vx = (Math.random() - 0.5) * 0.05;
            p.vy = (Math.random() - 0.2) * 0.08;
            p.vz = (Math.random() - 0.2) * 0.08;
          } else {
            p.mesh.position.x += p.vx;
            p.mesh.position.y += p.vy;
            p.mesh.position.z += p.vz;
            p.vy -= 0.003;
          }
        } else if (cur.fault === 'THERMAL' || cur.fault === 'COOLING_JAM') {
          p.mat.color.setHex(idx % 2 === 0 ? 0xff4500 : 0xff8800);
          p.mesh.visible = true;
          p.life++;
          if (p.life >= p.maxLife) {
            p.life = 0;
            p.mesh.position.set((Math.random() - 0.5) * 1.4, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5);
            p.vx = (Math.random() - 0.5) * 0.015;
            p.vy = 0.03 + Math.random() * 0.03;
            p.vz = (Math.random() - 0.5) * 0.015;
          } else {
            p.mesh.position.x += p.vx;
            p.mesh.position.y += p.vy;
            p.mesh.position.z += p.vz;
          }
        } else if (cur.fault === 'BRUSH_ARCING' && cur.rpm > 100) {
          p.mat.color.setHex(idx % 2 === 0 ? 0x00ffff : 0x38bdf8);
          p.mesh.visible = true;
          p.life++;
          if (p.life >= p.maxLife * 0.6) {
            p.life = 0;
            const brushSide = idx % 2 === 0 ? 0.38 : -0.38;
            p.mesh.position.set(-1.04 + (Math.random() - 0.5) * 0.2, brushSide, (Math.random() - 0.5) * 0.3);
            p.vx = (Math.random() - 0.5) * 0.06;
            p.vy = (Math.random() - 0.5) * 0.06;
            p.vz = (Math.random() - 0.5) * 0.07;
          } else {
            p.mesh.position.x += p.vx;
            p.mesh.position.y += p.vy;
            p.mesh.position.z += p.vz;
          }
        } else if (cur.fault === 'WINDING_SHORT' && cur.rpm > 100) {
          p.mat.color.setHex(idx % 2 === 0 ? 0xc084fc : 0xffffff);
          p.mesh.visible = true;
          p.life++;
          if (p.life >= p.maxLife * 0.7) {
            p.life = 0;
            p.mesh.position.set((Math.random() - 0.5) * 1.1, (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.6);
            p.vx = (Math.random() - 0.5) * 0.04;
            p.vy = (Math.random() - 0.5) * 0.06;
            p.vz = (Math.random() - 0.5) * 0.06;
          } else {
            p.mesh.position.x += p.vx;
            p.mesh.position.y += p.vy;
            p.mesh.position.z += p.vz;
          }
        } else {
          p.mesh.visible = false;
        }
      });

      // 4. Situation Color-Coding for All 8 Scenarios
      const pulse = 0.65 + Math.sin(Date.now() * 0.014) * 0.35;

      // Reset default commutator & brush glow
      commMat.emissive.setHex(0x000000);
      commMat.emissiveIntensity = 0;
      brushMat.emissive.setHex(0x000000);
      brushMat.emissiveIntensity = 0;

      if (cur.state === 'STOPPED') {
        haloMat.color.setHex(0x64748b);
        beaconMat.color.setHex(0x64748b);
        beaconMat.emissive.setHex(0x000000);
        fanMat.color.setHex(0x64748b);
        fanMat.emissive.setHex(0x000000);
        couplerMat.color.setHex(0x64748b);
        couplerMat.emissive.setHex(0x000000);
        bearingRaceMat.color.setHex(0x64748b);
        bearingRaceMat.emissive.setHex(0x000000);
        bearingBallMat.color.setHex(0x94a3b8);
        bearingBallMat.emissive.setHex(0x000000);
        coilMaterials.forEach((m) => {
          m.color.setHex(0x78350f);
          m.emissive.setHex(0x000000);
        });
        endRingMat.color.setHex(0x78350f);
        endRingMat.emissive.setHex(0x000000);
        casingMat.color.setHex(0x1e293b);
        casingMat.emissive.setHex(0x000000);
        internalGlow.intensity = 0;
      } else if (cur.fault === 'BEARING') {
        haloMat.color.setHex(0xff0033);
        beaconMat.color.setHex(0xff0033);
        beaconMat.emissive.setHex(0xff0033);
        beaconMat.emissiveIntensity = 2.5 * pulse;
        bearingRaceMat.color.setHex(0xff0033);
        bearingRaceMat.emissive.setHex(0xff0033);
        bearingRaceMat.emissiveIntensity = 1.8 * pulse;
        bearingBallMat.color.setHex(0xffdd00);
        bearingBallMat.emissive.setHex(0xff4400);
        bearingBallMat.emissiveIntensity = 1.6;
        fanMat.color.setHex(0xef4444);
        fanMat.emissive.setHex(0xdc2626);
        coilMaterials.forEach((m) => {
          m.color.setHex(0xf97316);
          m.emissive.setHex(0x991b1b);
          m.emissiveIntensity = 0.5;
        });
        endRingMat.color.setHex(0xf97316);
        endRingMat.emissive.setHex(0x991b1b);
        casingMat.color.setHex(0x3f1d28);
        casingMat.emissive.setHex(0x7f1d1d);
        internalGlow.color.setHex(0xff0033);
        internalGlow.intensity = 3.0;
      } else if (cur.fault === 'THERMAL') {
        haloMat.color.setHex(0xf97316);
        beaconMat.color.setHex(0xf97316);
        beaconMat.emissive.setHex(0xff5500);
        beaconMat.emissiveIntensity = 2.5 * pulse;
        coilMaterials.forEach((m) => {
          m.color.setHex(0xff2200);
          m.emissive.setHex(0xff6600);
          m.emissiveIntensity = 2.0 * pulse;
        });
        endRingMat.color.setHex(0xff2200);
        endRingMat.emissive.setHex(0xff6600);
        endRingMat.emissiveIntensity = 2.0 * pulse;
        casingMat.color.setHex(0x7f1d1d);
        casingMat.emissive.setHex(0xdc2626);
        casingMat.emissiveIntensity = 1.1 * pulse;
        bearingRaceMat.color.setHex(0xf59e0b);
        bearingRaceMat.emissive.setHex(0xd97706);
        fanMat.color.setHex(0xf59e0b);
        fanMat.emissive.setHex(0xd97706);
        internalGlow.color.setHex(0xff4500);
        internalGlow.intensity = 4.5;
      } else if (cur.fault === 'BRUSH_ARCING') {
        haloMat.color.setHex(0x06b6d4);
        beaconMat.color.setHex(0x06b6d4);
        beaconMat.emissive.setHex(0x00ffff);
        beaconMat.emissiveIntensity = 2.6 * pulse;
        commMat.emissive.setHex(Math.random() > 0.35 ? 0x00ffff : 0x0284c7);
        commMat.emissiveIntensity = 2.8;
        brushMat.emissive.setHex(0x38bdf8);
        brushMat.emissiveIntensity = 2.0 * pulse;
        coilMaterials.forEach((m) => {
          m.color.setHex(0xf97316);
          m.emissive.setHex(0x0284c7);
          m.emissiveIntensity = 0.4;
        });
        endRingMat.color.setHex(0xf97316);
        endRingMat.emissive.setHex(0x0284c7);
        bearingRaceMat.color.setHex(0x38bdf8);
        bearingRaceMat.emissive.setHex(0x0284c7);
        fanMat.color.setHex(0x06b6d4);
        fanMat.emissive.setHex(0x0891b2);
        internalGlow.color.setHex(0x00ffff);
        internalGlow.intensity = 3.5;
      } else if (cur.fault === 'IMBALANCE') {
        haloMat.color.setHex(0xeab308);
        beaconMat.color.setHex(0xeab308);
        beaconMat.emissive.setHex(0xfacc15);
        beaconMat.emissiveIntensity = 2.5 * pulse;
        bearingRaceMat.color.setHex(0xfacc15);
        bearingRaceMat.emissive.setHex(0xca8a04);
        bearingRaceMat.emissiveIntensity = 1.4 * pulse;
        fanMat.color.setHex(0xeab308);
        fanMat.emissive.setHex(0xca8a04);
        couplerMat.color.setHex(0xef4444);
        couplerMat.emissive.setHex(0xdc2626);
        coilMaterials.forEach((m) => {
          m.color.setHex(0xf97316);
          m.emissive.setHex(0xd97706);
          m.emissiveIntensity = 0.35;
        });
        casingMat.color.setHex(0x422006);
        casingMat.emissive.setHex(0x713f12);
        internalGlow.color.setHex(0xeab308);
        internalGlow.intensity = 2.5;
      } else if (cur.fault === 'WINDING_SHORT') {
        haloMat.color.setHex(0xa855f7);
        beaconMat.color.setHex(0xa855f7);
        beaconMat.emissive.setHex(0xc084fc);
        beaconMat.emissiveIntensity = 2.8 * pulse;
        coilMaterials.forEach((m, idx) => {
          if (idx === 0 || idx === 1) {
            const flash = Math.sin(Date.now() * 0.05) > 0 ? 0xffffff : 0xa855f7;
            m.color.setHex(flash);
            m.emissive.setHex(0xc084fc);
            m.emissiveIntensity = 3.0;
          } else {
            m.color.setHex(0x271206);
            m.emissive.setHex(0x1a0500);
            m.emissiveIntensity = 0.2;
          }
        });
        endRingMat.color.setHex(0x9333ea);
        endRingMat.emissive.setHex(0x7e22ce);
        casingMat.color.setHex(0x2e1065);
        casingMat.emissive.setHex(0x581c87);
        internalGlow.color.setHex(0xc084fc);
        internalGlow.intensity = 4.2;
      } else if (cur.fault === 'COOLING_JAM') {
        haloMat.color.setHex(0x3b82f6);
        beaconMat.color.setHex(0xef4444);
        beaconMat.emissive.setHex(0xff0000);
        beaconMat.emissiveIntensity = 2.5 * pulse;
        // Fan blades locked in bright warning crimson
        fanMat.color.setHex(0xff0033);
        fanMat.emissive.setHex(0xff0000);
        fanMat.emissiveIntensity = 2.2 * pulse;
        // Coils steadily overheating from lack of airflow
        coilMaterials.forEach((m) => {
          m.color.setHex(0xff4500);
          m.emissive.setHex(0xdc2626);
          m.emissiveIntensity = 1.6 * pulse;
        });
        endRingMat.color.setHex(0xff4500);
        endRingMat.emissive.setHex(0xdc2626);
        casingMat.color.setHex(0x451a03);
        casingMat.emissive.setHex(0x9a3412);
        internalGlow.color.setHex(0xff3300);
        internalGlow.intensity = 3.5;
      } else {
        // NORMAL HEALTHY MODE
        haloMat.color.setHex(0x10b981);
        beaconMat.color.setHex(0x10b981);
        beaconMat.emissive.setHex(0x10b981);
        beaconMat.emissiveIntensity = 1.2;
        fanMat.color.setHex(0x10b981);
        fanMat.emissive.setHex(0x059669);
        fanMat.emissiveIntensity = 0.35;
        couplerMat.color.setHex(0x10b981);
        couplerMat.emissive.setHex(0x059669);
        bearingRaceMat.color.setHex(0x38bdf8);
        bearingRaceMat.emissive.setHex(0x0284c7);
        bearingRaceMat.emissiveIntensity = 0.35;
        bearingBallMat.color.setHex(0xffffff);
        bearingBallMat.emissive.setHex(0x38bdf8);
        coilMaterials.forEach((m) => {
          m.color.setHex(0xf97316);
          m.emissive.setHex(0xd97706);
          m.emissiveIntensity = 0.3;
        });
        endRingMat.color.setHex(0xf97316);
        endRingMat.emissive.setHex(0xd97706);
        endRingMat.emissiveIntensity = 0.3;
        casingMat.color.setHex(0x1e293b);
        casingMat.emissive.setHex(0x065f46);
        casingMat.emissiveIntensity = 0.25;
        internalGlow.intensity = 0;
      }

      renderer.render(scene, camera);
    };

    animate();
    return () => {
      cancelAnimationFrame(animId);
      controls.dispose();
      renderer.dispose();
    };
  }, []);

  let banner = {
    bg: 'rgba(16,185,129,0.2)',
    border: '#10b981',
    color: '#6ee7b7',
    text: '🟢 SYSTEM GOOD / NORMAL — 1480 RPM • COOL BEARINGS • HEALTHY COILS'
  };
  if (telemetry.state === 'STOPPED') {
    banner = {
      bg: 'rgba(100,116,139,0.25)',
      border: '#64748b',
      color: '#cbd5e1',
      text: '🛑 EMERGENCY STOP ACTIVE — RELAY TRIPPED • ROTOR COASTING TO 0 RPM'
    };
  } else if (telemetry.fault === 'BEARING') {
    banner = {
      bg: 'rgba(244,63,94,0.25)',
      border: '#f43f5e',
      color: '#fda4af',
      text: '🔴 CRITICAL BEARING FAILURE — SPARKS FLYING • SHAFT WOBBLE • RPM DROPPING'
    };
  } else if (telemetry.fault === 'THERMAL') {
    banner = {
      bg: 'rgba(249,115,22,0.25)',
      border: '#f97316',
      color: '#fed7aa',
      text: '🟠 WARNING THERMAL OVERLOAD — MOLTEN COPPER WINDINGS • HEAT RISING'
    };
  } else if (telemetry.fault === 'BRUSH_ARCING') {
    banner = {
      bg: 'rgba(6,182,212,0.25)',
      border: '#06b6d4',
      color: '#a5f3fc',
      text: '⚡ COMMUTATOR BRUSH ARCING — BLUE PLASMA ARCS • CARBON WEAR • ERRATIC RPM'
    };
  } else if (telemetry.fault === 'IMBALANCE') {
    banner = {
      bg: 'rgba(234,179,8,0.25)',
      border: '#eab308',
      color: '#fef08a',
      text: '🌀 ROTOR IMBALANCE / BENT SHAFT — CENTRIFUGAL VIBRATION • HEAVY CHASSIS SHAKE'
    };
  } else if (telemetry.fault === 'WINDING_SHORT') {
    banner = {
      bg: 'rgba(168,85,247,0.25)',
      border: '#a855f7',
      color: '#e9d5ff',
      text: '🟣 STATOR WINDING SHORT-CIRCUIT — COIL INSULATION BREAKDOWN • VIOLET ARCS'
    };
  } else if (telemetry.fault === 'COOLING_JAM') {
    banner = {
      bg: 'rgba(59,130,246,0.25)',
      border: '#3b82f6',
      color: '#bfdbfe',
      text: '❄️ COOLING IMPELLER JAMMED — FAN BLADES SEIZED IN RED • ZERO AIRFLOW HEAT SOAK'
    };
  }

  return (
    <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#38bdf8' }}>🧊 LIVE 3D CUTAWAY DIGITAL TWIN (SPARKS, ARCS, WOBBLE & HEAT)</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => setShellMode('HALF')} style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', background: shellMode === 'HALF' ? '#0284c7' : '#1e293b', color: '#fff', border: '1px solid #38bdf8' }}>🔪 Half Cutaway</button>
          <button onClick={() => setShellMode('XRAY')} style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', background: shellMode === 'XRAY' ? '#0284c7' : '#1e293b', color: '#fff', border: '1px solid #38bdf8' }}>🔍 Full X-Ray</button>
          <button onClick={() => setShellMode('SOLID')} style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', background: shellMode === 'SOLID' ? '#0284c7' : '#1e293b', color: '#fff', border: '1px solid #38bdf8' }}>🛡️ Solid Shell</button>
        </div>
      </div>
      <div style={{ padding: '8px 12px', marginBottom: '10px', borderRadius: '8px', background: banner.bg, border: `1px solid ${banner.border}`, color: banner.color, fontSize: '12px', fontWeight: 'bold' }}>
        {banner.text}
      </div>
      <div ref={mountRef} style={{ width: '100%', height: '400px', overflow: 'hidden', borderRadius: '8px', background: '#020617', cursor: 'grab' }} />
    </div>
  );
}

export default function App() {
  const [shellMode, setShellMode] = useState('HALF');
  const [activeMode, setActiveMode] = useState('NORMAL');
  const [telemetry, setTelemetry] = useState({
    rpm: 1480,
    temp: 42.0,
    vibration: 1.4,
    health: 98.0,
    rul: 300,
    state: 'RUNNING',
    fault: 'NONE'
  });

  // Real-time continuous physics simulation loop (every 200ms)
  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetry(prev => {
        if (activeMode === 'STOP') {
          const nextRpm = prev.rpm > 25 ? Math.floor(prev.rpm * 0.78) : 0;
          const nextTemp = Math.max(34.0, +(prev.temp - 0.3).toFixed(1));
          const nextVib = nextRpm > 0 ? +(prev.vibration * 0.6).toFixed(2) : 0.0;
          return {
            ...prev,
            rpm: nextRpm,
            temp: nextTemp,
            vibration: nextVib,
            state: 'STOPPED',
            fault: 'STOPPED'
          };
        }

        if (activeMode === 'BEARING') {
          const nextVib = Math.min(9.6, +(prev.vibration + 0.25 + (Math.random() - 0.4) * 0.2).toFixed(2));
          const nextTemp = Math.min(94.0, +(prev.temp + 0.45).toFixed(1));
          const nextRpm = Math.max(540, Math.floor(prev.rpm - 18 + (Math.random() - 0.5) * 24));
          const nextRul = Math.max(0, prev.rul - 3);
          const nextHealth = Math.max(5, +(nextRul / 3).toFixed(1));
          return {
            rpm: nextRpm,
            temp: nextTemp,
            vibration: nextVib,
            health: nextHealth,
            rul: nextRul,
            state: nextRul < 60 ? 'CRITICAL' : 'DEGRADING',
            fault: 'BEARING'
          };
        }

        if (activeMode === 'THERMAL') {
          const nextTemp = Math.min(118.5, +(prev.temp + 0.95).toFixed(1));
          const nextVib = Math.min(4.5, +(prev.vibration + 0.08 + (Math.random() - 0.4) * 0.1).toFixed(2));
          const nextRpm = Math.max(680, Math.floor(prev.rpm - 14 + (Math.random() - 0.5) * 12));
          const nextRul = Math.max(0, prev.rul - 4);
          const nextHealth = Math.max(5, +(nextRul / 3).toFixed(1));
          return {
            rpm: nextRpm,
            temp: nextTemp,
            vibration: nextVib,
            health: nextHealth,
            rul: nextRul,
            state: nextRul < 60 ? 'CRITICAL' : 'DEGRADING',
            fault: 'THERMAL'
          };
        }

        if (activeMode === 'BRUSH_ARCING') {
          const nextTemp = Math.min(86.0, +(prev.temp + 0.35).toFixed(1));
          const nextVib = Math.min(5.2, +(2.8 + Math.random() * 1.4).toFixed(2));
          const nextRpm = Math.max(720, Math.floor(1180 + (Math.random() - 0.5) * 190));
          const nextRul = Math.max(0, prev.rul - 3);
          const nextHealth = Math.max(5, +(nextRul / 3).toFixed(1));
          return {
            rpm: nextRpm,
            temp: nextTemp,
            vibration: nextVib,
            health: nextHealth,
            rul: nextRul,
            state: nextRul < 60 ? 'CRITICAL' : 'ELECTRICAL_FAULT',
            fault: 'BRUSH_ARCING'
          };
        }

        if (activeMode === 'IMBALANCE') {
          const nextVib = Math.min(11.4, +(prev.vibration + 0.45 + (Math.random() - 0.3) * 0.35).toFixed(2));
          const nextTemp = Math.min(72.0, +(prev.temp + 0.25).toFixed(1));
          const nextRpm = Math.max(890, Math.floor(prev.rpm - 10 + (Math.random() - 0.5) * 30));
          const nextRul = Math.max(0, prev.rul - 4);
          const nextHealth = Math.max(5, +(nextRul / 3).toFixed(1));
          return {
            rpm: nextRpm,
            temp: nextTemp,
            vibration: nextVib,
            health: nextHealth,
            rul: nextRul,
            state: nextRul < 60 ? 'CRITICAL' : 'HIGH_VIBRATION',
            fault: 'IMBALANCE'
          };
        }

        if (activeMode === 'WINDING_SHORT') {
          const nextTemp = Math.min(126.0, +(prev.temp + 1.35).toFixed(1));
          const nextVib = Math.min(6.8, +(prev.vibration + 0.22 + (Math.random() - 0.4) * 0.25).toFixed(2));
          const nextRpm = Math.max(420, Math.floor(prev.rpm - 32 + (Math.random() - 0.5) * 28));
          const nextRul = Math.max(0, prev.rul - 6);
          const nextHealth = Math.max(5, +(nextRul / 3).toFixed(1));
          return {
            rpm: nextRpm,
            temp: nextTemp,
            vibration: nextVib,
            health: nextHealth,
            rul: nextRul,
            state: nextRul < 60 ? 'CRITICAL' : 'SHORT_CIRCUIT',
            fault: 'WINDING_SHORT'
          };
        }

        if (activeMode === 'COOLING_JAM') {
          const nextTemp = Math.min(108.0, +(prev.temp + 0.80).toFixed(1));
          const nextVib = +(2.1 + (Math.random() - 0.5) * 0.25).toFixed(2);
          const nextRpm = Math.max(1150, Math.floor(prev.rpm - 6 + (Math.random() - 0.5) * 10));
          const nextRul = Math.max(0, prev.rul - 3);
          const nextHealth = Math.max(5, +(nextRul / 3).toFixed(1));
          return {
            rpm: nextRpm,
            temp: nextTemp,
            vibration: nextVib,
            health: nextHealth,
            rul: nextRul,
            state: nextRul < 60 ? 'CRITICAL' : 'FAN_SEIZED',
            fault: 'COOLING_JAM'
          };
        }

        // NORMAL HEALTHY MODE
        const liveRpm = 1480 + Math.floor((Math.random() - 0.5) * 8);
        const liveTemp = +(42.0 + (Math.random() - 0.5) * 0.4).toFixed(1);
        const liveVib = +(1.4 + (Math.random() - 0.5) * 0.08).toFixed(2);
        return {
          rpm: liveRpm,
          temp: liveTemp,
          vibration: liveVib,
          health: 98.0,
          rul: 300,
          state: 'RUNNING',
          fault: 'NONE'
        };
      });
    }, 200);

    return () => clearInterval(timer);
  }, [activeMode]);

  const sendCommand = async (cmd) => {
    if (cmd === 'RESET') setActiveMode('NORMAL');
    else setActiveMode(cmd);

    // Map frontend mode to backend API if Flask server is running
    const backendFaultMap = {
      NORMAL: 'NORMAL',
      RESET: 'NORMAL',
      BEARING: 'BEARING_WEAR',
      THERMAL: 'THERMAL_OVERLOAD',
      BRUSH_ARCING: 'BRUSH_ARCING',
      IMBALANCE: 'ROTOR_IMBALANCE',
      WINDING_SHORT: 'WINDING_SHORT',
      COOLING_JAM: 'COOLING_FAILURE',
      STOP: 'EMERGENCY_STOP'
    };

    try {
      await fetch('http://localhost:5000/api/fault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fault: backendFaultMap[cmd] || 'NORMAL' })
      });
    } catch (e) {}
  };

  return (
    <div style={{ backgroundColor: '#030712', color: '#f8fafc', minHeight: '100vh', padding: '24px', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #1e293b', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#38bdf8' }}>⚡ LIVETWIN INDUSTRIAL HUD</h1>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>RS-775 Motor Digital Twin • Mirror • Predict • Control</p>
        </div>
        <span style={{ padding: '6px 14px', borderRadius: '9999px', fontSize: '12px', fontWeight: 'bold', background: telemetry.state === 'RUNNING' ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.25)', color: telemetry.state === 'RUNNING' ? '#34d399' : '#fb7185', border: '1px solid currentColor' }}>
          STATUS: {telemetry.state}
        </span>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div>
          <Motor3D telemetry={telemetry} shellMode={shellMode} setShellMode={setShellMode} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '12px' }}>
              <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>MOTOR SPEED (RPM)</div>
              <div style={{ fontSize: '36px', fontWeight: '800', color: telemetry.rpm < 1200 ? '#fb7185' : '#f8fafc' }}>
                {telemetry.rpm} <span style={{ fontSize: '14px', color: '#94a3b8' }}>RPM</span>
              </div>
            </div>
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '12px' }}>
              <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>CASING TEMPERATURE</div>
              <div style={{ fontSize: '36px', fontWeight: '800', color: telemetry.temp > 55 ? '#fb923c' : '#34d399' }}>
                {telemetry.temp} <span style={{ fontSize: '14px', color: '#94a3b8' }}>°C</span>
              </div>
            </div>
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '12px' }}>
              <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>VIBRATION ACCEL</div>
              <div style={{ fontSize: '36px', fontWeight: '800', color: telemetry.vibration > 2.5 ? '#fb7185' : '#38bdf8' }}>
                {telemetry.vibration} <span style={{ fontSize: '14px', color: '#94a3b8' }}>g</span>
              </div>
            </div>
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '12px' }}>
              <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>REMAINING USEFUL LIFE</div>
              <div style={{ fontSize: '36px', fontWeight: '800', color: telemetry.rul < 150 ? '#ef4444' : telemetry.rul < 250 ? '#fbbf24' : '#34d399' }}>
                {telemetry.rul} <span style={{ fontSize: '14px', color: '#94a3b8' }}>sec</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '18px', color: '#fb7185', marginTop: 0, marginBottom: '14px' }}>🛡️ FAULT INJECTION PANEL</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button onClick={() => sendCommand('BEARING')} style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold', background: activeMode === 'BEARING' ? 'rgba(244,63,94,0.35)' : 'rgba(244,63,94,0.12)', border: activeMode === 'BEARING' ? '2px solid #f43f5e' : '1px solid rgba(244,63,94,0.4)', color: '#fda4af' }}>
                🔴 1. Bearing Failure (Sparks + Shaft Wobble)
              </button>
              <button onClick={() => sendCommand('THERMAL')} style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold', background: activeMode === 'THERMAL' ? 'rgba(249,115,22,0.35)' : 'rgba(249,115,22,0.12)', border: activeMode === 'THERMAL' ? '2px solid #f97316' : '1px solid rgba(249,115,22,0.4)', color: '#fde047' }}>
                🟠 2. Thermal Overload (Molten Coils + Heat)
              </button>
              <button onClick={() => sendCommand('BRUSH_ARCING')} style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold', background: activeMode === 'BRUSH_ARCING' ? 'rgba(6,182,212,0.35)' : 'rgba(6,182,212,0.12)', border: activeMode === 'BRUSH_ARCING' ? '2px solid #06b6d4' : '1px solid rgba(6,182,212,0.4)', color: '#67e8f9' }}>
                ⚡ 3. Commutator Brush Arcing (Blue Plasma Arcs)
              </button>
              <button onClick={() => sendCommand('IMBALANCE')} style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold', background: activeMode === 'IMBALANCE' ? 'rgba(234,179,8,0.35)' : 'rgba(234,179,8,0.12)', border: activeMode === 'IMBALANCE' ? '2px solid #eab308' : '1px solid rgba(234,179,8,0.4)', color: '#fef08a' }}>
                🌀 4. Rotor Imbalance / Bent Shaft (Heavy Shake)
              </button>
              <button onClick={() => sendCommand('WINDING_SHORT')} style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold', background: activeMode === 'WINDING_SHORT' ? 'rgba(168,85,247,0.35)' : 'rgba(168,85,247,0.12)', border: activeMode === 'WINDING_SHORT' ? '2px solid #a855f7' : '1px solid rgba(168,85,247,0.4)', color: '#d8b4fe' }}>
                🟣 5. Winding Short-Circuit (Violet Coil Arcs)
              </button>
              <button onClick={() => sendCommand('COOLING_JAM')} style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold', background: activeMode === 'COOLING_JAM' ? 'rgba(59,130,246,0.35)' : 'rgba(59,130,246,0.12)', border: activeMode === 'COOLING_JAM' ? '2px solid #3b82f6' : '1px solid rgba(59,130,246,0.4)', color: '#93c5fd' }}>
                ❄️ 6. Cooling Impeller Jam (Seized Red Fan)
              </button>
              <button onClick={() => sendCommand('RESET')} style={{ width: '100%', padding: '12px 14px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold', marginTop: '6px', background: activeMode === 'NORMAL' ? 'rgba(16,185,129,0.35)' : 'rgba(16,185,129,0.12)', border: activeMode === 'NORMAL' ? '2px solid #10b981' : '1px solid rgba(16,185,129,0.4)', color: '#6ee7b7' }}>
                🟢 System Reset / Normal (Healthy)
              </button>
            </div>
          </div>
          <div style={{ marginTop: '18px', borderTop: '1px solid #1e293b', paddingTop: '14px' }}>
            <button onClick={() => sendCommand('STOP')} style={{ width: '100%', padding: '14px', background: '#e11d48', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
              🛑 EMERGENCY STOP (RELAY TRIP)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}