import * as THREE from 'three';
import { WorldTextures } from './textures';
import { RegionId } from './types';

export interface AABBCollider {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

export interface ShopTrigger {
  id: string;
  name: string;
  x: number;
  z: number;
}

export const WORLD_BOUND = 235;
export const WATER_LEVEL = 0.0;

export const REGION_CENTERS: { id: RegionId; label: string; x: number; z: number; radius: number }[] = [
  { id: 'villupuram', label: 'Villupuram Town', x: 0, z: 68, radius: 68 },
  { id: 'farmland', label: 'Villupuram Paddy Fields', x: -125, z: 45, radius: 75 },
  { id: 'pondicherry', label: 'Pondicherry Coast', x: 155, z: 85, radius: 68 },
  { id: 'chennai', label: 'Chennai Metro', x: 0, z: -145, radius: 85 },
];

export function getRegionAt(x: number, z: number): { id: RegionId; label: string } {
  for (const r of REGION_CENTERS) {
    if (Math.hypot(x - r.x, z - r.z) < r.radius) {
      return { id: r.id, label: r.label };
    }
  }
  return { id: 'highway', label: 'Tamil Nadu Highway (NH-32)' };
}

function smoothstep(e0: number, e1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

export function groundHeightAt(x: number, z: number): number {
  // Bay of Bengal coastline on the East (x > 176) and outer island borders
  let h =
    Math.sin(x * 0.022) * Math.cos(z * 0.022) * 1.4 +
    Math.cos((x - z) * 0.015) * 0.9 +
    2.4;

  // Flatten Villupuram, Chennai, Pondicherry, and Farmlands for realistic streets
  const flatten = (cx: number, cz: number, rIn: number, rOut: number, target: number) => {
    const d = Math.hypot(x - cx, z - cz);
    const w = 1 - smoothstep(rIn, rOut, d);
    h = h * (1 - w) + target * w;
  };

  flatten(0, 68, 52, 78, 2.2); // Villupuram
  flatten(0, -145, 70, 95, 2.5); // Chennai
  flatten(-125, 45, 50, 75, 1.8); // Paddy Fields
  flatten(145, 85, 34, 58, 2.1); // Pondicherry town

  // Highway corridors stay flat
  if (Math.abs(x) < 16 && z > -165 && z < 115) {
    h = 2.2;
  }
  if (Math.abs(z - 72) < 14 && x > -140 && x < 168) {
    h = 2.15;
  }

  // Rolling hills far West
  const dHills = Math.hypot(x + 195, z + 115);
  h += (1 - smoothstep(12, 65, dHills)) * 16.0;

  // Gentle sandy beach slope into Bay of Bengal on East coast (x > 174)
  if (x > 170) {
    const coastT = smoothstep(170, 212, x);
    h = h * (1 - coastT) + -2.8 * coastT;
  }

  // Outer perimeter coastline beyond ±215
  const edgeMax = Math.max(Math.abs(x), Math.abs(z));
  if (edgeMax > 205) {
    const drop = smoothstep(205, 245, edgeMax);
    h = h * (1 - drop) + -3.5 * drop;
  }

  return h;
}

export interface TamilNaduWorld {
  group: THREE.Group;
  colliders: AABBCollider[];
  shops: ShopTrigger[];
  streetLampBulbs: THREE.MeshStandardMaterial;
  dispose: () => void;
}

export function buildTamilNaduWorld(textures: WorldTextures): TamilNaduWorld {
  const group = new THREE.Group();
  const colliders: AABBCollider[] = [];
  const shops: ShopTrigger[] = [];
  const disposables: { dispose: () => void }[] = [];

  // 1. Terrain Mesh (540x540m)
  const terrainGeo = new THREE.PlaneGeometry(540, 540, 144, 144);
  terrainGeo.rotateX(-Math.PI / 2);
  const pos = terrainGeo.attributes.position;
  const cols = new Float32Array(pos.count * 3);

  const cGrass = new THREE.Color(0x416d36);
  const cPaddy = new THREE.Color(0x3f8f29);
  const cSand = new THREE.Color(0xdcc796);
  const cTown = new THREE.Color(0x7c766e);
  const cCity = new THREE.Color(0x525862);
  const tmp = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = groundHeightAt(x, z);
    pos.setY(i, y);

    if (y < 0.75 || x > 172) {
      tmp.copy(cSand);
    } else if (Math.hypot(x, z + 145) < 76) {
      tmp.copy(cCity);
    } else if (Math.hypot(x, z - 68) < 55 || Math.hypot(x - 145, z - 85) < 38) {
      tmp.copy(cTown);
    } else if (Math.hypot(x + 125, z - 45) < 62) {
      tmp.copy(cPaddy);
    } else {
      tmp.copy(cGrass);
    }
    cols[i * 3] = tmp.r;
    cols[i * 3 + 1] = tmp.g;
    cols[i * 3 + 2] = tmp.b;
  }

  terrainGeo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  terrainGeo.computeVertexNormals();
  const terrainMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    map: textures.groundDetail,
    roughness: 0.9,
    metalness: 0.02,
  });
  disposables.push(terrainGeo, terrainMat);
  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.receiveShadow = true;
  group.add(terrainMesh);

  // 2. Bay of Bengal Ocean Plane (1800x1800m — seamless horizon)
  const waterGeo = new THREE.PlaneGeometry(1800, 1800, 1, 1);
  waterGeo.rotateX(-Math.PI / 2);
  const waterMat = new THREE.MeshStandardMaterial({
    color: 0x0b7290,
    roughness: 0.14,
    metalness: 0.32,
    transparent: true,
    opacity: 0.88,
  });
  disposables.push(waterGeo, waterMat);
  const waterMesh = new THREE.Mesh(waterGeo, waterMat);
  waterMesh.position.y = WATER_LEVEL;
  waterMesh.receiveShadow = true;
  group.add(waterMesh);

  // 3. Highway & City Asphalt Roads
  const roadMat = new THREE.MeshStandardMaterial({
    map: textures.highwayAsphalt,
    roughness: 0.82,
    metalness: 0.05,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  disposables.push(roadMat);

  const addRoad = (x1: number, z1: number, x2: number, z2: number, width = 9.5) => {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.hypot(dx, dz);
    const steps = Math.max(4, Math.ceil(len / 12));
    const stepLen = len / steps;
    const angle = Math.atan2(dx, dz);

    for (let s = 0; s < steps; s++) {
      const t0 = s / steps;
      const t1 = (s + 1) / steps;
      const mx = x1 + dx * ((t0 + t1) * 0.5);
      const mz = z1 + dz * ((t0 + t1) * 0.5);
      const y0 = groundHeightAt(x1 + dx * t0, z1 + dz * t0);
      const y1 = groundHeightAt(x1 + dx * t1, z1 + dz * t1);
      const segGeo = new THREE.BoxGeometry(width, 0.12, stepLen + 0.4);
      disposables.push(segGeo);
      const seg = new THREE.Mesh(segGeo, roadMat);
      seg.position.set(mx, (y0 + y1) * 0.5 + 0.05, mz);
      seg.rotation.y = angle;
      seg.receiveShadow = true;
      group.add(seg);
    }
  };

  // NH-32 Highway (Villupuram -> Chennai)
  addRoad(0, 112, 0, -175, 11);
  // Villupuram East-West Avenue (Paddy Fields -> Villupuram -> Pondicherry Beach)
  addRoad(-135, 72, 168, 72, 9.5);
  // Villupuram Town Loop Streets
  addRoad(-48, 42, 48, 42, 7.5);
  addRoad(-48, 102, 48, 102, 7.5);
  addRoad(-48, 42, -48, 102, 7.5);
  addRoad(48, 42, 48, 102, 7.5);
  // Farm Crossroad connector
  addRoad(-105, -12, 0, -12, 8.0);
  // Pondicherry Beach Promenade Road
  addRoad(168, 28, 168, 138, 8.5);
  // Chennai Avenue Loop
  addRoad(-65, -145, 65, -145, 10.5);

  // Helper for buildings & Tamil signboards
  const stuccoMat = new THREE.MeshStandardMaterial({ map: textures.stuccoWall, roughness: 0.84 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
  const templeMat = new THREE.MeshStandardMaterial({ map: textures.templeStone, roughness: 0.78 });
  const cityGlassMat = new THREE.MeshStandardMaterial({ map: textures.cityGlass, roughness: 0.18, metalness: 0.75 });
  disposables.push(stuccoMat, trimMat, templeMat, cityGlassMat);

  const addBuilding = (
    x: number,
    z: number,
    w: number,
    h: number,
    d: number,
    colorHex: number,
    roofHex: number,
    signTex?: THREE.CanvasTexture
  ) => {
    const gy = groundHeightAt(x, z);
    const bg = new THREE.Group();
    bg.position.set(x, gy, z);

    const wallM = new THREE.MeshStandardMaterial({ color: colorHex, map: textures.stuccoWall, roughness: 0.82 });
    const roofM = new THREE.MeshStandardMaterial({ color: roofHex, roughness: 0.72 });
    const bodyGeo = new THREE.BoxGeometry(w, h, d);
    const roofGeo = new THREE.BoxGeometry(w + 0.6, 0.45, d + 0.6);
    disposables.push(wallM, roofM, bodyGeo, roofGeo);

    const body = new THREE.Mesh(bodyGeo, wallM);
    body.position.y = h / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    const roof = new THREE.Mesh(roofGeo, roofM);
    roof.position.y = h + 0.22;
    roof.castShadow = true;
    bg.add(body, roof);

    if (signTex) {
      const signGeo = new THREE.PlaneGeometry(Math.min(w * 0.85, 5.2), 1.6);
      const signM = new THREE.MeshBasicMaterial({ map: signTex });
      disposables.push(signGeo, signM);
      const sign = new THREE.Mesh(signGeo, signM);
      sign.position.set(0, h - 0.8, d / 2 + 0.08);
      bg.add(sign);
    }

    group.add(bg);
    colliders.push({
      minX: x - w * 0.5,
      maxX: x + w * 0.5,
      minY: gy,
      maxY: gy + h,
      minZ: z - d * 0.5,
      maxZ: z + d * 0.5,
    });
  };

  // === REGION 1: VILLUPURAM (Starting Hub) ===
  // Villupuram Welcome Arch / Gate
  addBuilding(14, 52, 8, 4.2, 6, 0xfef3c7, 0x92400e, textures.signTeaShop);
  shops.push({ id: 'tea_villupuram', name: 'Friends Tea Kada', x: 14, z: 58 });

  // Villupuram Bus Stand
  addBuilding(28, 60, 14, 4.8, 8, 0xe2e8f0, 0x1e3a8a, textures.signBusStand);

  // Villupuram Railway Station + Train Coach
  addBuilding(-28, 114, 18, 5.6, 8, 0xfde68a, 0xb45309, textures.signRailway);
  const railY = groundHeightAt(-28, 122);
  const trainMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.4, metalness: 0.5 });
  const trainGeo = new THREE.BoxGeometry(22, 3.4, 3.2);
  disposables.push(trainMat, trainGeo);
  const trainMesh = new THREE.Mesh(trainGeo, trainMat);
  trainMesh.position.set(-28, railY + 1.8, 123);
  trainMesh.castShadow = true;
  group.add(trainMesh);

  // Govt Hospital & College
  addBuilding(-38, 86, 12, 6.2, 10, 0xf8fafc, 0x991b1b, textures.signHospital);
  addBuilding(38, 90, 12, 6.0, 9, 0xfef08a, 0x065f46, textures.signVillupuram);
  // Market & Residential Streets
  addBuilding(-36, 56, 10, 4.2, 8, 0xfdba74, 0x9a3412);
  addBuilding(-22, 54, 8, 3.8, 7, 0xa7f3d0, 0x065f46);
  addBuilding(34, 46, 9, 4.4, 7, 0xe9d5ff, 0x6b21a8);
  addBuilding(-18, 88, 9, 4.2, 8, 0xfecdd3, 0xbe123c);

  // Villupuram Traditional Dravidian Temple (Gopuram Tower at x: -2, z: 22)
  const ty = groundHeightAt(-2, 22);
  const templeGroup = new THREE.Group();
  templeGroup.position.set(-2, ty, 22);
  const baseTier = new THREE.Mesh(new THREE.BoxGeometry(10, 4, 8), templeMat);
  baseTier.position.y = 2;
  const midTier = new THREE.Mesh(new THREE.BoxGeometry(7.5, 4, 6), templeMat);
  midTier.position.y = 6;
  const topTier = new THREE.Mesh(new THREE.BoxGeometry(5, 3.5, 4), templeMat);
  topTier.position.y = 9.5;
  const kalasamMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.25, metalness: 0.9 });
  const kalasam = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.5, 1.4, 8), kalasamMat);
  kalasam.position.y = 12;
  templeGroup.add(baseTier, midTier, topTier, kalasam);
  group.add(templeGroup);
  colliders.push({ minX: -7, maxX: 3, minY: ty, maxY: ty + 12, minZ: 18, maxZ: 26 });

  // === REGION 2: AGRICULTURAL FIELDS & VILLAGES ===
  addBuilding(-125, 62, 9, 3.6, 7, 0xfef3c7, 0xb45309);
  addBuilding(-138, 78, 8, 3.2, 6, 0xe7e5e4, 0x78350f);
  addBuilding(-95, -20, 8, 4.0, 7, 0xfde68a, 0x9a3412);

  // === REGION 3: PONDICHERRY COASTAL TOWN ===
  addBuilding(146, 56, 11, 5.2, 9, 0xfef08a, 0xb45309, textures.signPondicherry);
  addBuilding(148, 90, 10, 5.0, 9, 0xfef9c3, 0x92400e);
  addBuilding(146, 114, 12, 4.8, 8, 0xf8fafc, 0x0369a1);
  shops.push({ id: 'coconut_pondy', name: 'Pondy Beach Café', x: 158, z: 96 });

  // Pondicherry Lighthouse
  const lhY = groundHeightAt(162, 86);
  const lhMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
  const lhRed = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.5 });
  const lhBase = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.2, 14, 12), lhMat);
  lhBase.position.set(162, lhY + 7, 86);
  const lhTop = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 2.5, 12), lhRed);
  lhTop.position.set(162, lhY + 15, 86);
  const lhLamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.9, 10, 10),
    new THREE.MeshBasicMaterial({ color: 0xfef08a })
  );
  lhLamp.position.set(162, lhY + 17.2, 86);
  group.add(lhBase, lhTop, lhLamp);
  colliders.push({ minX: 160, maxX: 164, minY: lhY, maxY: lhY + 18, minZ: 84, maxZ: 88 });

  // === REGION 4: CHENNAI METROPOLITAN CITY ===
  // Chennai Central Heritage Building + Skyscrapers
  addBuilding(0, -162, 24, 9.5, 12, 0xb91c1c, 0xf8fafc, textures.signChennai);
  shops.push({ id: 'tea_chennai', name: 'Chennai Marina Bistro', x: 24, z: -138 });

  const towerPositions = [
    [-38, -125, 14, 28, 14],
    [-62, -155, 16, 34, 16],
    [38, -128, 15, 32, 15],
    [62, -160, 16, 38, 16],
    [-35, -172, 14, 24, 14],
    [36, -175, 14, 26, 14],
  ];
  for (const [tx, tz, tw, th, td] of towerPositions) {
    const gy = groundHeightAt(tx, tz);
    const tGeo = new THREE.BoxGeometry(tw, th, td);
    disposables.push(tGeo);
    const tower = new THREE.Mesh(tGeo, cityGlassMat);
    tower.position.set(tx, gy + th / 2, tz);
    tower.castShadow = true;
    tower.receiveShadow = true;
    group.add(tower);
    colliders.push({
      minX: tx - tw * 0.5,
      maxX: tx + tw * 0.5,
      minY: gy,
      maxY: gy + th,
      minZ: tz - td * 0.5,
      maxZ: tz + td * 0.5,
    });
  }

  // 4. Instanced Streetlamps (glowing at dusk/night)
  const lampPositions: [number, number][] = [];
  for (let z = -165; z <= 105; z += 26) {
    lampPositions.push([-6.5, z], [6.5, z]);
  }
  for (let x = -125; x <= 165; x += 28) {
    if (Math.abs(x) > 10) lampPositions.push([x, 66]);
  }

  const poleGeo = new THREE.CylinderGeometry(0.09, 0.13, 5.2, 6);
  poleGeo.translate(0, 2.6, 0);
  const bulbGeo = new THREE.SphereGeometry(0.24, 8, 8);
  bulbGeo.translate(0, 5.2, 0);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.6 });
  const streetLampBulbs = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.2,
  });
  disposables.push(poleGeo, bulbGeo, poleMat, streetLampBulbs);

  const polesInst = new THREE.InstancedMesh(poleGeo, poleMat, lampPositions.length);
  const bulbsInst = new THREE.InstancedMesh(bulbGeo, streetLampBulbs, lampPositions.length);
  const dummy = new THREE.Object3D();
  lampPositions.forEach(([lx, lz], idx) => {
    dummy.position.set(lx, groundHeightAt(lx, lz), lz);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    polesInst.setMatrixAt(idx, dummy.matrix);
    bulbsInst.setMatrixAt(idx, dummy.matrix);
  });
  polesInst.computeBoundingSphere();
  bulbsInst.computeBoundingSphere();
  group.add(polesInst, bulbsInst);

  // 5. Instanced Coconut Palms & Neem/Banyan Trees (220 instances with ±15% scale & color variation)
  const treeCount = 220;
  const trunkGeo = new THREE.CylinderGeometry(0.18, 0.34, 6.4, 6);
  trunkGeo.translate(0, 3.2, 0);
  const crownGeo = new THREE.ConeGeometry(2.5, 2.8, 7);
  crownGeo.translate(0, 6.8, 0);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x6b4c35, roughness: 0.9 });
  const crownMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82 });
  disposables.push(trunkGeo, crownGeo, trunkMat, crownMat);

  const tInst = new THREE.InstancedMesh(trunkGeo, trunkMat, treeCount);
  const cInst = new THREE.InstancedMesh(crownGeo, crownMat, treeCount);
  tInst.castShadow = true;
  cInst.castShadow = true;

  const tCol = new THREE.Color();
  let placed = 0;
  let att = 0;
  while (placed < treeCount && att < 2400) {
    att++;
    const tx = -205 + ((att * 73.1) % 385);
    const tz = -195 + ((att * 137.7) % 355);
    // Keep off main roads & downtown plazas
    if (Math.abs(tx) < 14 || Math.abs(tz - 72) < 12) continue;
    if (Math.hypot(tx, tz - 68) < 48 || Math.hypot(tx, tz + 145) < 75) continue;
    if (Math.hypot(tx - 150, tz - 85) < 42) continue;
    const ty = groundHeightAt(tx, tz);
    if (ty < 0.7) continue;

    const sc = 0.85 + (((att * 19) % 30) / 100);
    dummy.position.set(tx, ty - 0.1, tz);
    dummy.rotation.y = att * 1.3;
    dummy.scale.setScalar(sc);
    dummy.updateMatrix();
    tInst.setMatrixAt(placed, dummy.matrix);
    cInst.setMatrixAt(placed, dummy.matrix);

    const shade = 0.8 + (((att * 11) % 20) / 100);
    tCol.setRGB(0.16 * shade, 0.46 * shade, 0.18 * shade);
    cInst.setColorAt(placed, tCol);
    placed++;
  }
  tInst.count = placed;
  cInst.count = placed;
  tInst.instanceMatrix.needsUpdate = true;
  cInst.instanceMatrix.needsUpdate = true;
  if (cInst.instanceColor) cInst.instanceColor.needsUpdate = true;
  tInst.computeBoundingSphere();
  cInst.computeBoundingSphere();
  group.add(tInst, cInst);

  return {
    group,
    colliders,
    shops,
    streetLampBulbs,
    dispose: () => {
      for (const d of disposables) d.dispose();
    },
  };
}
