import * as THREE from 'three';
import { CharacterConfig, OutfitId, VehicleType } from './types';

export interface HumanRig {
  root: THREE.Group;
  bodyGroup: THREE.Group;
  headGroup: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  setOutfit: (outfit: OutfitId) => void;
  animate: (
    dt: number,
    speed: number,
    isCrouching: boolean,
    isSwimming: boolean,
    isDriving: boolean,
    walkPhase: number
  ) => void;
  dispose: () => void;
}

export function createHumanRig(
  config: CharacterConfig,
  contactShadowTex: THREE.Texture,
  initialOutfit?: OutfitId
): HumanRig {
  const root = new THREE.Group();
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const disposables: { dispose: () => void }[] = [];

  // Contact shadow disc
  const shadowGeo = new THREE.PlaneGeometry(1.05, 1.05);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: contactShadowTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.45,
  });
  const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
  shadowDisc.position.y = 0.03;
  root.add(shadowDisc);
  disposables.push(shadowGeo, shadowMat);

  const skinMat = new THREE.MeshStandardMaterial({ color: config.skinColor, roughness: 0.62, metalness: 0.02 });
  const hairMat = new THREE.MeshStandardMaterial({ color: config.hairColor, roughness: 0.85, metalness: 0.04 });
  const shirtMat = new THREE.MeshStandardMaterial({ color: config.shirtColor, roughness: 0.72, metalness: 0.04 });
  const bottomMat = new THREE.MeshStandardMaterial({ color: config.bottomColor, roughness: 0.78, metalness: 0.04 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.45, metalness: 0.25 });
  const shoeMat = new THREE.MeshStandardMaterial({ color: 0x1e1b18, roughness: 0.82, metalness: 0.08 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111827 });
  disposables.push(skinMat, hairMat, shirtMat, bottomMat, accentMat, shoeMat, eyeMat);

  // Pelvis / Waist
  const pelvisGeo = new THREE.CylinderGeometry(0.18, 0.2, 0.18, 10);
  disposables.push(pelvisGeo);
  const pelvis = new THREE.Mesh(pelvisGeo, bottomMat);
  pelvis.position.y = 0.9;
  pelvis.castShadow = true;
  bodyGroup.add(pelvis);

  // Sculpted Torso (natural tapered chest/waist)
  const torsoGeo = new THREE.CylinderGeometry(0.22, 0.17, 0.54, 10);
  disposables.push(torsoGeo);
  const torso = new THREE.Mesh(torsoGeo, shirtMat);
  torso.position.y = 1.24;
  torso.scale.set(1.05, 1, 0.72);
  torso.castShadow = true;
  bodyGroup.add(torso);

  // Saree / Dupatta Sash + Veshti Wrap + Police Cap (outfit-specific layers)
  const sashGeo = new THREE.BoxGeometry(0.42, 0.56, 0.27);
  const sashMesh = new THREE.Mesh(sashGeo, accentMat);
  sashMesh.position.y = 1.24;
  sashMesh.rotation.z = 0.28;
  sashMesh.scale.set(0.45, 1, 1.02);
  bodyGroup.add(sashMesh);

  const veshtiSkirtGeo = new THREE.CylinderGeometry(0.2, 0.24, 0.72, 12);
  const veshtiSkirt = new THREE.Mesh(veshtiSkirtGeo, bottomMat);
  veshtiSkirt.position.y = 0.58;
  veshtiSkirt.castShadow = true;
  bodyGroup.add(veshtiSkirt);

  const zariBorderGeo = new THREE.CylinderGeometry(0.242, 0.246, 0.07, 12);
  const zariBorder = new THREE.Mesh(zariBorderGeo, accentMat);
  zariBorder.position.y = 0.26;
  bodyGroup.add(zariBorder);
  disposables.push(sashGeo, veshtiSkirtGeo, zariBorderGeo);

  // Neck & Proportional Head
  const neckGeo = new THREE.CylinderGeometry(0.065, 0.075, 0.12, 8);
  const neck = new THREE.Mesh(neckGeo, skinMat);
  neck.position.y = 1.54;
  bodyGroup.add(neck);
  disposables.push(neckGeo);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.66, 0);
  bodyGroup.add(headGroup);

  const headGeo = new THREE.SphereGeometry(0.135, 14, 12);
  headGeo.scale(0.88, 1.08, 0.96);
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Facial detail: eyes + hair cap + police cap
  const eyeGeo = new THREE.SphereGeometry(0.014, 6, 6);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.044, 0.02, 0.118);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeR.position.set(0.044, 0.02, 0.118);
  headGroup.add(eyeL, eyeR);

  const hairGeo = new THREE.SphereGeometry(0.142, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.58);
  const hairMesh = new THREE.Mesh(hairGeo, hairMat);
  hairMesh.position.set(0, 0.02, -0.01);
  headGroup.add(hairMesh);

  const capGeo = new THREE.CylinderGeometry(0.145, 0.135, 0.08, 12);
  const policeCap = new THREE.Mesh(capGeo, bottomMat);
  policeCap.position.set(0, 0.11, 0.01);
  headGroup.add(policeCap);
  disposables.push(headGeo, eyeGeo, hairGeo, capGeo);

  // Proportional Legs
  const buildLeg = (side: number) => {
    const leg = new THREE.Group();
    leg.position.set(side * 0.105, 0.84, 0);
    const thighGeo = new THREE.CylinderGeometry(0.082, 0.068, 0.42, 8);
    const shinGeo = new THREE.CylinderGeometry(0.064, 0.052, 0.38, 8);
    const shoeGeo = new THREE.BoxGeometry(0.1, 0.07, 0.2);
    disposables.push(thighGeo, shinGeo, shoeGeo);

    const thigh = new THREE.Mesh(thighGeo, bottomMat);
    thigh.position.y = -0.2;
    thigh.castShadow = true;
    const shin = new THREE.Mesh(shinGeo, bottomMat);
    shin.position.y = -0.57;
    shin.castShadow = true;
    const shoe = new THREE.Mesh(shoeGeo, shoeMat);
    shoe.position.set(0, -0.79, 0.04);
    shoe.castShadow = true;
    leg.add(thigh, shin, shoe);
    bodyGroup.add(leg);
    return leg;
  };
  const leftLeg = buildLeg(-1);
  const rightLeg = buildLeg(1);

  // Proportional Arms
  const buildArm = (side: number) => {
    const arm = new THREE.Group();
    arm.position.set(side * 0.26, 1.46, 0);
    const upperGeo = new THREE.CylinderGeometry(0.06, 0.052, 0.3, 8);
    const foreGeo = new THREE.CylinderGeometry(0.048, 0.04, 0.28, 8);
    const handGeo = new THREE.SphereGeometry(0.044, 8, 8);
    disposables.push(upperGeo, foreGeo, handGeo);

    const upper = new THREE.Mesh(upperGeo, shirtMat);
    upper.position.y = -0.14;
    upper.castShadow = true;
    const fore = new THREE.Mesh(foreGeo, skinMat);
    fore.position.y = -0.4;
    fore.castShadow = true;
    const hand = new THREE.Mesh(handGeo, skinMat);
    hand.position.y = -0.55;
    arm.add(upper, fore, hand);
    bodyGroup.add(arm);
    return arm;
  };
  const leftArm = buildArm(-1);
  const rightArm = buildArm(1);

  const setOutfit = (outfit: OutfitId) => {
    sashMesh.visible = false;
    veshtiSkirt.visible = false;
    zariBorder.visible = false;
    policeCap.visible = false;

    if (outfit === 'veshti_shirt') {
      shirtMat.color.setHex(0xe2e8f0);
      bottomMat.color.setHex(0xf8fafc);
      accentMat.color.setHex(0xd97706);
      veshtiSkirt.visible = true;
      zariBorder.visible = true;
    } else if (outfit === 'festival_silk') {
      shirtMat.color.setHex(0xf59e0b);
      bottomMat.color.setHex(0xfef3c7);
      accentMat.color.setHex(0xb45309);
      veshtiSkirt.visible = true;
      zariBorder.visible = true;
      sashMesh.visible = true;
    } else if (outfit === 'saree') {
      shirtMat.color.setHex(0xbe185d);
      bottomMat.color.setHex(0x9d174d);
      accentMat.color.setHex(0xfbbf24);
      veshtiSkirt.visible = true;
      zariBorder.visible = true;
      sashMesh.visible = true;
    } else if (outfit === 'salwar') {
      shirtMat.color.setHex(0x0284c7);
      bottomMat.color.setHex(0xfef3c7);
      accentMat.color.setHex(0x38bdf8);
      sashMesh.visible = true;
    } else if (outfit === 'college_uniform') {
      shirtMat.color.setHex(0xbae6fd);
      bottomMat.color.setHex(0x1e293b);
    } else if (outfit === 'police_khakhi') {
      shirtMat.color.setHex(0xb89b6a);
      bottomMat.color.setHex(0x9c8052);
      policeCap.visible = true;
    } else {
      // modern_casual
      shirtMat.color.setHex(config.shirtColor);
      bottomMat.color.setHex(config.bottomColor);
    }
  };

  setOutfit(initialOutfit ?? config.defaultOutfit);

  const animate = (
    dt: number,
    speed: number,
    isCrouching: boolean,
    isSwimming: boolean,
    isDriving: boolean,
    walkPhase: number
  ) => {
    if (isDriving) {
      root.visible = false;
      return;
    }
    root.visible = true;

    if (isSwimming) {
      shadowDisc.visible = false;
      bodyGroup.rotation.x = THREE.MathUtils.damp(bodyGroup.rotation.x, Math.PI * 0.44, 8, dt);
      bodyGroup.position.y = THREE.MathUtils.damp(bodyGroup.position.y, 0.35, 8, dt);
      const stroke = Math.sin(walkPhase * 1.4);
      leftArm.rotation.x = stroke * 1.1 - 0.8;
      rightArm.rotation.x = -stroke * 1.1 - 0.8;
      leftLeg.rotation.x = -stroke * 0.6;
      rightLeg.rotation.x = stroke * 0.6;
      return;
    }

    shadowDisc.visible = true;
    bodyGroup.rotation.x = THREE.MathUtils.damp(bodyGroup.rotation.x, 0, 12, dt);

    const crouchY = isCrouching ? -0.32 : 0;
    const blend = Math.min(1, speed / 5.5);
    const swing = Math.sin(walkPhase) * 0.62 * blend;

    bodyGroup.position.y = THREE.MathUtils.damp(
      bodyGroup.position.y,
      crouchY + Math.abs(Math.sin(walkPhase)) * 0.04 * blend,
      14,
      dt
    );

    leftLeg.rotation.x = swing;
    rightLeg.rotation.x = -swing;
    leftArm.rotation.x = -swing * 0.72;
    rightArm.rotation.x = swing * 0.72;
  };

  return {
    root,
    bodyGroup,
    headGroup,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    setOutfit,
    animate,
    dispose: () => {
      for (const d of disposables) d.dispose();
    },
  };
}

export interface IndianVehicleRig {
  root: THREE.Group;
  wheels: THREE.Mesh[];
  headlightGlows: THREE.Mesh[];
  dispose: () => void;
}

export function createIndianVehicle(
  type: VehicleType,
  contactShadowTex: THREE.Texture,
  customColor?: number
): IndianVehicleRig {
  const root = new THREE.Group();
  const wheels: THREE.Mesh[] = [];
  const headlightGlows: THREE.Mesh[] = [];
  const disposables: { dispose: () => void }[] = [];

  const tireMat = new THREE.MeshStandardMaterial({ color: 0x16181c, roughness: 0.88, metalness: 0.08 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.8 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.14, metalness: 0.8 });
  const lightMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfacc15,
    emissiveIntensity: 0.75,
  });
  disposables.push(tireMat, rimMat, glassMat, lightMat);

  const shadowW = type === 'bus' ? 3.8 : type === 'motorcycle' || type === 'scooter' ? 1.8 : 3.2;
  const shadowL = type === 'bus' ? 9.5 : type === 'motorcycle' || type === 'scooter' ? 2.8 : 4.6;
  const shGeo = new THREE.PlaneGeometry(shadowW, shadowL);
  shGeo.rotateX(-Math.PI / 2);
  const shMat = new THREE.MeshBasicMaterial({
    map: contactShadowTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.52,
  });
  const sh = new THREE.Mesh(shGeo, shMat);
  sh.position.y = 0.04;
  root.add(sh);
  disposables.push(shGeo, shMat);

  const addWheel = (x: number, y: number, z: number, r: number, w: number) => {
    const wg = new THREE.CylinderGeometry(r, r, w, 14);
    wg.rotateZ(Math.PI / 2);
    const rg = new THREE.CylinderGeometry(r * 0.55, r * 0.55, w + 0.02, 10);
    rg.rotateZ(Math.PI / 2);
    disposables.push(wg, rg);
    const tire = new THREE.Mesh(wg, tireMat);
    const rim = new THREE.Mesh(rg, rimMat);
    tire.add(rim);
    tire.position.set(x, y, z);
    tire.castShadow = true;
    root.add(tire);
    wheels.push(tire);
  };

  if (type === 'auto') {
    // Classic Tamil Nadu Yellow & Black Auto-Rickshaw (3-wheeler)
    const yellowMat = new THREE.MeshPhysicalMaterial({ color: 0xfacc15, roughness: 0.3, metalness: 0.4, clearcoat: 0.7 });
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85, metalness: 0.05 });
    const trimMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });
    disposables.push(yellowMat, canopyMat, trimMat);

    const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.72, 2.3), yellowMat);
    lowerBody.position.set(0, 0.65, -0.1);
    lowerBody.castShadow = true;
    const frontNose = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.82, 0.75), yellowMat);
    frontNose.position.set(0, 0.72, 1.05);
    frontNose.castShadow = true;
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.46, 0.08), glassMat);
    windshield.position.set(0, 1.32, 0.82);
    windshield.rotation.x = -0.22;
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.68, 1.95), canopyMat);
    canopy.position.set(0, 1.36, -0.2);
    canopy.castShadow = true;
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.14, 2.32), trimMat);
    stripe.position.set(0, 0.42, -0.1);
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), lightMat);
    hl.position.set(0, 0.78, 1.44);
    root.add(lowerBody, frontNose, windshield, canopy, stripe, hl);
    headlightGlows.push(hl);

    addWheel(0, 0.28, 1.05, 0.28, 0.18);
    addWheel(-0.74, 0.28, -0.85, 0.28, 0.2);
    addWheel(0.74, 0.28, -0.85, 0.28, 0.2);
  } else if (type === 'bus') {
    // Tamil Nadu State Express Bus
    const bodyMat = new THREE.MeshPhysicalMaterial({ color: customColor ?? 0x1d4ed8, roughness: 0.35, metalness: 0.45, clearcoat: 0.6 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.45 });
    disposables.push(bodyMat, whiteMat);

    const lower = new THREE.Mesh(new THREE.BoxGeometry(2.55, 1.45, 8.6), bodyMat);
    lower.position.y = 1.25;
    lower.castShadow = true;
    const upper = new THREE.Mesh(new THREE.BoxGeometry(2.52, 1.05, 8.5), whiteMat);
    upper.position.y = 2.45;
    upper.castShadow = true;
    const windows = new THREE.Mesh(new THREE.BoxGeometry(2.56, 0.65, 7.6), glassMat);
    windows.position.y = 2.4;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.16, 8.3), bodyMat);
    roof.position.y = 3.04;
    root.add(lower, upper, windows, roof);

    for (const sx of [-0.9, 0.9]) {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.2, 0.1), lightMat);
      hl.position.set(sx, 0.9, 4.31);
      root.add(hl);
      headlightGlows.push(hl);
    }
    addWheel(-1.25, 0.52, 2.7, 0.52, 0.38);
    addWheel(1.25, 0.52, 2.7, 0.52, 0.38);
    addWheel(-1.25, 0.52, -2.6, 0.52, 0.38);
    addWheel(1.25, 0.52, -2.6, 0.52, 0.38);
  } else if (type === 'tractor') {
    // Tamil Nadu Agricultural Tractor
    const paintMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5, metalness: 0.35 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.6, metalness: 0.7 });
    disposables.push(paintMat, ironMat);

    const engineBlock = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.95, 2.3), paintMat);
    engineBlock.position.set(0, 1.05, 0.55);
    engineBlock.castShadow = true;
    const cabinBase = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.55, 1.3), ironMat);
    cabinBase.position.set(0, 0.95, -0.95);
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.1, 8), ironMat);
    exhaust.position.set(0.35, 1.9, 1.1);
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), lightMat);
    hl.position.set(0, 1.1, 1.72);
    root.add(engineBlock, cabinBase, exhaust, hl);
    headlightGlows.push(hl);

    addWheel(-0.72, 0.38, 1.25, 0.38, 0.24);
    addWheel(0.72, 0.38, 1.25, 0.38, 0.24);
    addWheel(-0.98, 0.72, -0.95, 0.72, 0.45);
    addWheel(0.98, 0.72, -0.95, 0.72, 0.45);
  } else if (type === 'motorcycle' || type === 'scooter') {
    const paintMat = new THREE.MeshPhysicalMaterial({
      color: customColor ?? (type === 'scooter' ? 0x0284c7 : 0xb91c1c),
      roughness: 0.25,
      metalness: 0.55,
      clearcoat: 0.7,
    });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.2, metalness: 0.9 });
    disposables.push(paintMat, chromeMat);

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(type === 'scooter' ? 0.5 : 0.36, 0.44, 1.35),
      paintMat
    );
    body.position.set(0, 0.65, 0);
    body.castShadow = true;
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.15, 0.75), tireMat);
    seat.position.set(0, 0.9, -0.22);
    const fork = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.85, 8), chromeMat);
    fork.position.set(0, 0.82, 0.68);
    fork.rotation.x = -0.3;
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.68, 8), chromeMat);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 1.15, 0.55);
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), lightMat);
    hl.position.set(0, 0.98, 0.76);
    root.add(body, seat, fork, bar, hl);
    headlightGlows.push(hl);

    const wr = type === 'scooter' ? 0.28 : 0.36;
    addWheel(0, wr, 0.82, wr, 0.16);
    addWheel(0, wr, -0.78, wr, 0.18);
  } else {
    // Car or Police Jeep
    const isPolice = type === 'police';
    const paintMat = new THREE.MeshPhysicalMaterial({
      color: isPolice ? 0xf1f5f9 : customColor ?? 0xd97706,
      roughness: 0.3,
      metalness: 0.55,
      clearcoat: 0.75,
    });
    disposables.push(paintMat);

    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.74, 4.2), paintMat);
    chassis.position.y = 0.74;
    chassis.castShadow = true;
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.66, 2.2), glassMat);
    cabin.position.set(0, 1.38, -0.15);
    cabin.castShadow = true;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.08, 1.95), paintMat);
    roof.position.set(0, 1.72, -0.15);
    root.add(chassis, cabin, roof);

    if (isPolice) {
      const redBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.14, 0.22),
        new THREE.MeshBasicMaterial({ color: 0xef4444 })
      );
      redBar.position.set(-0.3, 1.82, 0.1);
      const blueBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.5, 0.14, 0.22),
        new THREE.MeshBasicMaterial({ color: 0x3b82f6 })
      );
      blueBar.position.set(0.3, 1.82, 0.1);
      root.add(redBar, blueBar);
    }

    for (const sx of [-0.7, 0.7]) {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.1), lightMat);
      hl.position.set(sx, 0.78, 2.11);
      root.add(hl);
      headlightGlows.push(hl);
    }
    addWheel(-1.02, 0.4, 1.32, 0.4, 0.28);
    addWheel(1.02, 0.4, 1.32, 0.4, 0.28);
    addWheel(-1.02, 0.4, -1.32, 0.4, 0.28);
    addWheel(1.02, 0.4, -1.32, 0.4, 0.28);
  }

  return {
    root,
    wheels,
    headlightGlows,
    dispose: () => {
      for (const d of disposables) d.dispose();
    },
  };
}
