import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { worldAudio } from './audio';
import { createHumanRig, createIndianVehicle, HumanRig, IndianVehicleRig } from './models';
import {
  buildTamilNaduWorld,
  getRegionAt,
  groundHeightAt,
  TamilNaduWorld,
  WATER_LEVEL,
  WORLD_BOUND,
} from './terrain';
import { createWorldTextures, WorldTextures } from './textures';
import {
  CharacterConfig,
  DialogueLine,
  FRIENDS_CAST,
  GamePhase,
  GameSettings,
  MinimapBlip,
  MISSIONS,
  OpenWorldHudState,
  OutfitId,
  SaveGameData,
  SHOP_ITEMS,
  VehicleType,
  WeatherMode,
} from './types';

// Pre-allocated math helpers
const _camDesired = new THREE.Vector3();
const _camLook = new THREE.Vector3();

const NPC_GREETINGS: DialogueLine[] = [
  {
    speaker: 'Villupuram Resident',
    tamil: 'வணக்கம் தம்பி! இன்னைக்கு வெயில் கொஞ்சம் அதிகம், டீ கடைல காபி சாப்பிடுங்க.',
    english: 'Vanakkam! It’s warm today—grab a filter coffee at the tea shop.',
  },
  {
    speaker: 'College Student',
    tamil: 'வணக்கம்! விழுப்புரத்துல இருந்து புதுச்சேரி போற சாலை ரொம்ப அழகா இருக்கு.',
    english: 'Hello! The coastal highway from Villupuram to Pondicherry looks scenic today.',
  },
  {
    speaker: 'TN Traffic Constable',
    tamil: 'வண்டிய மெதுவா ஓட்டுங்க! ஹெல்மெட் மறக்காதீங்க.',
    english: 'Drive safely on the highway and watch out for buses at the junction.',
  },
  {
    speaker: 'Market Vendor',
    tamil: 'புது நெல் அறுவடை வந்திருக்கு! ஊர் மக்கள் எல்லாரும் சந்தோஷமா இருக்காங்க.',
    english: 'Fresh paddy harvest arrived from the western fields today!',
  },
];

interface VehicleEntity {
  id: number;
  type: VehicleType;
  rig: IndianVehicleRig;
  x: number;
  y: number;
  z: number;
  yaw: number;
  speed: number;
  isAiTraffic: boolean;
  trafficAxis: 'ns' | 'ew';
  trafficDir: 1 | -1;
}

interface NpcEntity {
  id: number;
  name: string;
  rig: HumanRig;
  x: number;
  y: number;
  z: number;
  yaw: number;
  walkPhase: number;
  homeX: number;
  homeZ: number;
  targetX: number;
  targetZ: number;
  waitTimer: number;
  isFriend: boolean;
  dialogue: DialogueLine[];
}

export interface VirtualControlsState {
  moveX: number;
  moveY: number;
  sprinting: boolean;
}

export class TamilNaduEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean;
  private clock = new THREE.Clock();
  private frameId = 0;
  private disposed = false;

  private sunLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private vehicleSpotLight!: THREE.SpotLight;

  private textures: WorldTextures;
  private world: TamilNaduWorld;
  private waypointMesh!: THREE.Mesh;
  private rainPoints!: THREE.Points;
  private rainPositions!: Float32Array;

  // Player state
  private phase: GamePhase = 'lobby';
  private settings: GameSettings;
  private character: CharacterConfig = FRIENDS_CAST[0];
  private playerRig!: HumanRig;
  private playerX = 8;
  private playerY = 2.2;
  private playerZ = 62;
  private playerVy = 0;
  private playerGrounded = true;
  private coyoteTimer = 0;
  private playerYaw = 0.2;
  private camYaw = 0.2;
  private camPitch = 0.2;
  private camDist = 4.6;
  private walkPhase = 0;
  private footstepTimer = 0;

  private hp = 100;
  private maxHp = 100;
  private stamina = 100;
  private maxStamina = 100;
  private money = 350;
  private outfit: OutfitId = 'modern_casual';
  private inventory: Record<string, number> = { filter_coffee: 1 };
  private isCrouching = false;
  private isSprinting = false;
  private isSwimming = false;

  // Time & Weather
  private timeOfDay = 8.5; // 8:30 AM morning in Villupuram
  private weather: WeatherMode = 'sunny';
  private lightningTimer = 5;
  private lightningFlash = 0;

  // Missions & Dialogue
  private activeMissionId: string | null = MISSIONS[0].id;
  private completedMissions: string[] = [];
  private activeDialogue: DialogueLine[] | null = null;
  private dialogueIndex = 0;
  private pendingMissionCompleteId: string | null = null;
  private toastMessage: string | null = null;
  private toastTimer = 0;

  // World entities
  private vehicles: VehicleEntity[] = [];
  private playerVehicle: VehicleEntity | null = null;
  private npcs: NpcEntity[] = [];
  private nextId = 1;

  // Inputs
  private keys = new Set<string>();
  private pointerLocked = false;
  private dragLook = false;
  private lastPx = 0;
  private lastPy = 0;
  public virtualControls: VirtualControlsState = { moveX: 0, moveY: 0, sprinting: false };

  private onHudUpdate: (hud: OpenWorldHudState) => void;
  private onOpenMapModal: () => void;
  private onOpenShopModal: () => void;
  private hudTimer = 0;
  private lobbyAngle = 0;
  private boundHandlers: { target: EventTarget; type: string; fn: EventListenerOrEventListenerObject }[] = [];

  constructor(
    container: HTMLElement,
    initialSettings: GameSettings,
    initialChar: CharacterConfig,
    onHudUpdate: (hud: OpenWorldHudState) => void,
    onOpenMapModal: () => void,
    onOpenShopModal: () => void
  ) {
    this.container = container;
    this.settings = { ...initialSettings };
    this.character = initialChar;
    this.outfit = initialChar.defaultOutfit;
    this.weather = initialSettings.weather;
    this.onHudUpdate = onHudUpdate;
    this.onOpenMapModal = onOpenMapModal;
    this.onOpenShopModal = onOpenShopModal;

    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    const aspect = (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight);
    this.camera = new THREE.PerspectiveCamera(62, aspect, 0.15, 920);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.setupLighting();
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    this.textures = createWorldTextures(maxAniso);
    this.world = buildTamilNaduWorld(this.textures);
    this.scene.add(this.world.group);

    this.setupWaypointBeacon();
    this.setupRainSystem();
    this.rebuildPlayerRig();
    this.spawnWorldVehiclesAndNpcs();
    this.applyAtmosphere();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.bindEvents();
    this.clock.start();
    this.emitHud();
    this.tick();
  }

  private setupLighting() {
    this.hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x4b5d3b, 0.72);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfff1d6, 1.8);
    this.sunLight.position.set(120, 150, 90);
    this.sunLight.castShadow = !this.isSoftwareGl;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 360;
    const d = 110;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.025;
    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    this.vehicleSpotLight = new THREE.SpotLight(0xfef08a, 0, 60, Math.PI / 5, 0.4, 1.4);
    this.scene.add(this.vehicleSpotLight);
    this.scene.add(this.vehicleSpotLight.target);
  }

  private setupWaypointBeacon() {
    const geo = new THREE.CylinderGeometry(1.1, 1.1, 46, 16, 1, true);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.34,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.waypointMesh = new THREE.Mesh(geo, mat);
    this.waypointMesh.visible = false;
    this.scene.add(this.waypointMesh);
  }

  private setupRainSystem() {
    const count = 750;
    this.rainPositions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      this.rainPositions[i * 3] = (Math.random() - 0.5) * 60;
      this.rainPositions[i * 3 + 1] = Math.random() * 28;
      this.rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));
    const mat = new THREE.PointsMaterial({ color: 0xbae6fd, size: 0.16, transparent: true, opacity: 0.65 });
    this.rainPoints = new THREE.Points(geo, mat);
    this.rainPoints.visible = false;
    this.scene.add(this.rainPoints);
  }

  private rebuildPlayerRig() {
    if (this.playerRig) {
      this.scene.remove(this.playerRig.root);
      this.playerRig.dispose();
    }
    this.playerRig = createHumanRig(this.character, this.textures.contactShadow, this.outfit);
    this.playerY = groundHeightAt(this.playerX, this.playerZ);
    this.playerRig.root.position.set(this.playerX, this.playerY, this.playerZ);
    this.scene.add(this.playerRig.root);
  }

  private spawnWorldVehiclesAndNpcs() {
    // Clear existing
    for (const v of this.vehicles) {
      this.scene.remove(v.rig.root);
      v.rig.dispose();
    }
    this.vehicles = [];
    for (const n of this.npcs) {
      this.scene.remove(n.rig.root);
      n.rig.dispose();
    }
    this.npcs = [];

    const addVeh = (
      type: VehicleType,
      x: number,
      z: number,
      yaw: number,
      isAiTraffic = false,
      trafficAxis: 'ns' | 'ew' = 'ns',
      trafficDir: 1 | -1 = 1,
      color?: number
    ) => {
      const rig = createIndianVehicle(type, this.textures.contactShadow, color);
      const y = groundHeightAt(x, z);
      rig.root.position.set(x, y, z);
      rig.root.rotation.y = yaw;
      this.scene.add(rig.root);
      this.vehicles.push({
        id: this.nextId++,
        type,
        rig,
        x,
        y,
        z,
        yaw,
        speed: isAiTraffic ? 9 : 0,
        isAiTraffic,
        trafficAxis,
        trafficDir,
      });
    };

    // Parked Indian Vehicles ready to drive around Villupuram, Paddy Fields, Pondicherry & Chennai
    addVeh('auto', 14, 65, 0.6); // Right beside Villupuram Tea Kada!
    addVeh('motorcycle', 4, 66, -0.4); // Kigo's bike in Villupuram
    addVeh('scooter', -14, 72, 1.2);
    addVeh('bus', 28, 74, Math.PI / 2); // Villupuram Bus Stand
    addVeh('police', -32, 82, 0.2); // Near Govt Hospital
    addVeh('car', -22, 102, 1.5, false, 'ns', 1, 0xe11d48); // Villupuram Railway Station
    addVeh('tractor', -120, 68, 0.4); // Agricultural Paddy Fields
    addVeh('auto', 152, 82, -0.7); // Pondicherry Promenade
    addVeh('car', 14, -142, 0.0, false, 'ns', 1, 0x0284c7); // Chennai Plaza

    // Living AI Traffic on NH-32 & East-West Highway
    addVeh('bus', 2.8, 10, Math.PI, true, 'ns', -1, 0x0369a1);
    addVeh('auto', -2.8, -55, 0, true, 'ns', 1);
    addVeh('car', 2.8, -110, Math.PI, true, 'ns', -1, 0x64748b);
    addVeh('motorcycle', -55, 74.5, Math.PI / 2, true, 'ew', 1);
    addVeh('auto', 85, 69.5, -Math.PI / 2, true, 'ew', -1);

    // 5 Story Friend NPCs placed at their story locations
    const friendSpots: { cfg: CharacterConfig; x: number; z: number; dialogue: DialogueLine[] }[] = [
      {
        cfg: FRIENDS_CAST[1], // Kavin
        x: 11,
        z: 59,
        dialogue: [
          {
            speaker: 'Kavin',
            tamil: 'வா அர்ஜுன்! ஒரு டிகிரி காபி குடிச்சிட்டு வேலைய ஆரம்பிப்போம்.',
            english: 'Hey Arjun! Grab a filter coffee and check our next mission on the map.',
            accentHex: '#14b8a6',
          },
        ],
      },
      {
        cfg: FRIENDS_CAST[2], // Meera
        x: -28,
        z: 105,
        dialogue: [
          {
            speaker: 'Meera',
            tamil: 'விழுப்புரம் நில ஆவணங்கள் எல்லாம் என் பையில் பத்திரமா இருக்கு அர்ஜுன்.',
            english: 'I’ve got the Villupuram land deeds safe in my bag, Arjun.',
            accentHex: '#ec4899',
          },
        ],
      },
      {
        cfg: FRIENDS_CAST[4], // Ananya
        x: 158,
        z: 88,
        dialogue: [
          {
            speaker: 'Ananya',
            tamil: 'புதுச்சேரி கடற்கரை ரொம்ப அமைதியா இருக்கு, ஆனா சென்னை கும்பல் ரொம்ப ஆபத்தானவங்க.',
            english: 'Pondicherry coast is peaceful, but the Chennai syndicate moves fast.',
            accentHex: '#38bdf8',
          },
        ],
      },
      {
        cfg: FRIENDS_CAST[3], // Selva
        x: -95,
        z: -12,
        dialogue: [
          {
            speaker: 'Selva',
            tamil: 'நம்ம நட்பை விடப் பெரியது எதுவும் இல்ல அர்ஜுன்.',
            english: 'Nothing matters more than our Villupuram friendship, Arjun.',
            accentHex: '#ef4444',
          },
        ],
      },
    ];

    for (const fs of friendSpots) {
      const rig = createHumanRig(fs.cfg, this.textures.contactShadow);
      const y = groundHeightAt(fs.x, fs.z);
      rig.root.position.set(fs.x, y, fs.z);
      this.scene.add(rig.root);
      this.npcs.push({
        id: this.nextId++,
        name: fs.cfg.name,
        rig,
        x: fs.x,
        y,
        z: fs.z,
        yaw: 0,
        walkPhase: 0,
        homeX: fs.x,
        homeZ: fs.z,
        targetX: fs.x,
        targetZ: fs.z,
        waitTimer: 99,
        isFriend: true,
        dialogue: fs.dialogue,
      });
    }

    // Living Pedestrians across Villupuram, Pondicherry, and Chennai wearing Tamil outfits
    const outfits: OutfitId[] = ['veshti_shirt', 'saree', 'salwar', 'modern_casual', 'college_uniform', 'police_khakhi'];
    const hubs = [
      [-12, 65], [22, 65], [-24, 78], [18, 92], [-8, 34], // Villupuram
      [148, 72], [156, 102], // Pondicherry
      [-15, -142], [20, -146], [0, -130], // Chennai
      [-120, 74], // Farmland
    ];
    for (let i = 0; i < 18; i++) {
      const [hx, hz] = hubs[i % hubs.length];
      const baseCfg = FRIENDS_CAST[i % FRIENDS_CAST.length];
      const outfit = outfits[i % outfits.length];
      const rig = createHumanRig(baseCfg, this.textures.contactShadow, outfit);
      const nx = hx + (Math.random() - 0.5) * 14;
      const nz = hz + (Math.random() - 0.5) * 14;
      const ny = groundHeightAt(nx, nz);
      rig.root.position.set(nx, ny, nz);
      this.scene.add(rig.root);

      this.npcs.push({
        id: this.nextId++,
        name: NPC_GREETINGS[i % NPC_GREETINGS.length].speaker,
        rig,
        x: nx,
        y: ny,
        z: nz,
        yaw: Math.random() * Math.PI * 2,
        walkPhase: Math.random() * 5,
        homeX: hx,
        homeZ: hz,
        targetX: hx + (Math.random() - 0.5) * 18,
        targetZ: hz + (Math.random() - 0.5) * 18,
        waitTimer: Math.random() * 2,
        isFriend: false,
        dialogue: [NPC_GREETINGS[i % NPC_GREETINGS.length]],
      });
    }
  }

  public startNewGame(charCfg: CharacterConfig) {
    worldAudio.unlock();
    this.character = charCfg;
    this.outfit = charCfg.defaultOutfit;
    this.playerX = 8;
    this.playerZ = 62;
    this.playerY = groundHeightAt(this.playerX, this.playerZ);
    this.hp = 100;
    this.stamina = 100;
    this.money = 350;
    this.inventory = { filter_coffee: 1 };
    this.activeMissionId = MISSIONS[0].id;
    this.completedMissions = [];
    this.timeOfDay = 8.5;
    this.playerVehicle = null;
    this.rebuildPlayerRig();
    this.phase = 'playing';
    this.activeDialogue = MISSIONS[0].startDialogue;
    this.dialogueIndex = 0;
    this.emitHud();
  }

  public loadFromSave(save: SaveGameData) {
    worldAudio.unlock();
    this.playerX = save.playerX;
    this.playerZ = save.playerZ;
    this.playerY = groundHeightAt(this.playerX, this.playerZ);
    this.hp = save.hp;
    this.money = save.money;
    this.outfit = save.outfit;
    this.inventory = { ...save.inventory };
    this.activeMissionId = save.activeMissionId;
    this.completedMissions = [...save.completedMissions];
    this.timeOfDay = save.timeOfDay;
    this.weather = save.weather;
    this.playerVehicle = null;
    this.rebuildPlayerRig();
    this.applyAtmosphere();
    this.phase = 'playing';
    this.showToast('Saved progress loaded.');
    this.emitHud();
  }

  public exportSaveData(): SaveGameData {
    return {
      playerX: this.playerX,
      playerZ: this.playerZ,
      hp: Math.round(this.hp),
      money: this.money,
      outfit: this.outfit,
      inventory: { ...this.inventory },
      activeMissionId: this.activeMissionId,
      completedMissions: [...this.completedMissions],
      timeOfDay: this.timeOfDay,
      weather: this.weather,
      savedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  }

  public setCharacterPreview(charCfg: CharacterConfig) {
    this.character = charCfg;
    this.outfit = charCfg.defaultOutfit;
    this.rebuildPlayerRig();
  }

  public setOutfit(outfit: OutfitId) {
    this.outfit = outfit;
    this.playerRig.setOutfit(outfit);
    this.showToast(`Equipped ${outfit.replace('_', ' ')}`);
    this.emitHud();
  }

  public updateSettings(next: GameSettings) {
    this.settings = { ...next };
    if (next.weather !== this.weather) {
      this.weather = next.weather;
      this.applyAtmosphere();
    }
    worldAudio.setEnabled(next.soundEnabled);
    worldAudio.setVolume(next.masterVolume);
  }

  public setTimeAndWeather(hour: number, weather: WeatherMode) {
    this.timeOfDay = hour;
    this.weather = weather;
    this.applyAtmosphere();
    this.emitHud();
  }

  public fastTravel(x: number, z: number, label: string) {
    if (this.playerVehicle) {
      this.playerVehicle = null;
      worldAudio.setVehicleEngine(false, 'car', 0);
    }
    this.playerX = x;
    this.playerZ = z;
    this.playerY = groundHeightAt(x, z);
    this.playerRig.root.position.set(this.playerX, this.playerY, this.playerZ);
    this.showToast(`Arrived at ${label}`);
    this.emitHud();
  }

  public selectMission(missionId: string) {
    this.activeMissionId = missionId;
    const m = MISSIONS.find((x) => x.id === missionId);
    if (m) {
      this.activeDialogue = m.startDialogue;
      this.dialogueIndex = 0;
    }
    this.emitHud();
  }

  public buyShopItem(itemId: string) {
    const item = SHOP_ITEMS.find((i) => i.id === itemId);
    if (!item) return;
    if (this.money < item.price) {
      this.showToast('Not enough ₹ Rupees!');
      return;
    }
    this.money -= item.price;
    this.inventory[item.id] = (this.inventory[item.id] ?? 0) + 1;
    worldAudio.playInteract();
    this.showToast(`Bought ${item.name} (-₹${item.price})`);
    this.emitHud();
  }

  public consumeInventoryItem(itemId: string) {
    const count = this.inventory[itemId] ?? 0;
    if (count <= 0) return;
    const item = SHOP_ITEMS.find((i) => i.id === itemId);
    if (!item) return;
    this.inventory[itemId] = count - 1;
    this.hp = Math.min(this.maxHp, this.hp + item.healHp);
    this.stamina = Math.min(this.maxStamina, this.stamina + item.restoreStamina);
    worldAudio.playInteract();
    this.showToast(`Enjoyed ${item.name}!`);
    this.emitHud();
  }

  public advanceDialogue() {
    if (!this.activeDialogue) return;
    if (this.dialogueIndex + 1 < this.activeDialogue.length) {
      this.dialogueIndex += 1;
    } else {
      this.activeDialogue = null;
      this.dialogueIndex = 0;
      if (this.pendingMissionCompleteId) {
        const nextIdx = MISSIONS.findIndex((m) => m.id === this.pendingMissionCompleteId) + 1;
        this.pendingMissionCompleteId = null;
        if (nextIdx < MISSIONS.length && MISSIONS[nextIdx].chapter > 0) {
          this.activeMissionId = MISSIONS[nextIdx].id;
          this.activeDialogue = MISSIONS[nextIdx].startDialogue;
        }
      }
    }
    this.emitHud();
  }

  public pauseGame() {
    if (this.phase === 'playing') {
      this.phase = 'paused';
      if (document.pointerLockElement) document.exitPointerLock?.();
      worldAudio.setVehicleEngine(false, 'car', 0);
      this.emitHud();
    }
  }

  public resumeGame() {
    if (this.phase === 'paused') {
      this.phase = 'playing';
      this.emitHud();
    }
  }

  public returnToLobby() {
    if (document.pointerLockElement) document.exitPointerLock?.();
    worldAudio.setVehicleEngine(false, 'car', 0);
    this.phase = 'lobby';
    this.activeDialogue = null;
    this.emitHud();
  }

  private showToast(msg: string) {
    this.toastMessage = msg;
    this.toastTimer = 3.2;
  }

  private applyAtmosphere() {
    const isNight = this.timeOfDay >= 19 || this.timeOfDay < 5.5;
    const isDusk = this.weather === 'dusk' || (this.timeOfDay >= 17 && this.timeOfDay < 19);
    const isStorm = this.weather === 'rain' || this.weather === 'thunderstorm';

    let skyHex = 0x7bc2ea;
    let fogDensity = 0.0018;
    let sunColor = 0xfff1d6;
    let sunIntensity = 1.85;
    let hemiSky = 0x93c5fd;
    let hemiGround = 0x455838;

    if (isNight) {
      skyHex = 0x0b1426;
      fogDensity = 0.0032;
      sunColor = 0x93c5fd;
      sunIntensity = 0.65;
      hemiSky = 0x334155;
      hemiGround = 0x0f172a;
    } else if (isDusk) {
      skyHex = 0xd98555;
      fogDensity = 0.0022;
      sunColor = 0xff9e5e;
      sunIntensity = 1.45;
      hemiSky = 0xfdba74;
      hemiGround = 0x3f3028;
    }

    if (isStorm) {
      skyHex = isNight ? 0x070d18 : 0x475569;
      fogDensity = 0.0046;
      sunIntensity *= 0.5;
    }

    this.scene.background = new THREE.Color(skyHex);
    this.scene.fog = new THREE.FogExp2(skyHex, fogDensity);
    this.sunLight.color.setHex(sunColor);
    this.sunLight.intensity = sunIntensity + this.lightningFlash;
    this.hemiLight.color.setHex(hemiSky);
    this.hemiLight.groundColor.setHex(hemiGround);
    this.rainPoints.visible = isStorm;

    // Streetlamps & vehicle headlights glow at dusk/night/storm
    const lampGlow = isNight || isDusk || isStorm ? 1.8 : 0.15;
    this.world.streetLampBulbs.emissiveIntensity = lampGlow;
    this.vehicleSpotLight.intensity = this.playerVehicle && (isNight || isDusk || isStorm) ? 4.2 : 0;
  }

  private bindEvents() {
    const add = (target: EventTarget, type: string, fn: EventListenerOrEventListenerObject) => {
      target.addEventListener(type, fn);
      this.boundHandlers.push({ target, type, fn });
    };
    const canvas = this.renderer.domElement;

    add(window, 'resize', () => {
      const w = this.container.clientWidth || window.innerWidth;
      const h = this.container.clientHeight || window.innerHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    });

    add(window, 'keydown', (e: Event) => {
      const ke = e as KeyboardEvent;
      this.keys.add(ke.code);

      if (ke.code === 'Escape') {
        if (this.phase === 'playing') this.pauseGame();
        else if (this.phase === 'paused') this.resumeGame();
        return;
      }

      if (this.phase !== 'playing') return;

      if (ke.code === 'KeyC') this.isCrouching = !this.isCrouching;
      else if (ke.code === 'Space') {
        if (this.activeDialogue) this.advanceDialogue();
        else this.triggerJump();
      } else if (ke.code === 'Enter' && this.activeDialogue) {
        this.advanceDialogue();
      } else if (ke.code === 'KeyE') {
        this.triggerVehicleToggle();
      } else if (ke.code === 'KeyF') {
        this.triggerInteract();
      } else if (ke.code === 'KeyH' && this.playerVehicle) {
        worldAudio.playHorn(this.playerVehicle.type);
      } else if (ke.code === 'KeyM') {
        if (document.pointerLockElement) document.exitPointerLock?.();
        this.onOpenMapModal();
      }
    });

    add(window, 'keyup', (e: Event) => {
      this.keys.delete((e as KeyboardEvent).code);
    });

    add(window, 'blur', () => {
      this.keys.clear();
      this.dragLook = false;
    });

    add(document, 'pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === canvas;
    });

    add(canvas, 'mousedown', (e: Event) => {
      const me = e as MouseEvent;
      if (this.phase !== 'playing') return;
      worldAudio.unlock();
      if (!this.pointerLocked && canvas.requestPointerLock) {
        try {
          canvas.requestPointerLock();
        } catch {
          // fallback drag look
        }
      }
      this.dragLook = true;
      this.lastPx = me.clientX;
      this.lastPy = me.clientY;
    });

    add(window, 'mouseup', () => {
      this.dragLook = false;
    });

    add(window, 'mousemove', (e: Event) => {
      const me = e as MouseEvent;
      if (this.phase !== 'playing') return;
      const sens = 0.0022 * this.settings.mouseSensitivity;
      if (this.pointerLocked) {
        this.camYaw -= me.movementX * sens;
        this.camPitch = THREE.MathUtils.clamp(this.camPitch + me.movementY * sens, -0.35, 0.85);
      } else if (this.dragLook) {
        const dx = me.clientX - this.lastPx;
        const dy = me.clientY - this.lastPy;
        this.lastPx = me.clientX;
        this.lastPy = me.clientY;
        this.camYaw -= dx * sens * 1.4;
        this.camPitch = THREE.MathUtils.clamp(this.camPitch + dy * sens * 1.4, -0.35, 0.85);
      }
    });

    add(canvas, 'webglcontextlost', (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(this.frameId);
      clearTimeout(this.frameId);
    });
    add(canvas, 'webglcontextrestored', () => this.tick());
  }

  public triggerJump() {
    if (this.phase !== 'playing' || this.playerVehicle || this.isSwimming) return;
    if (this.playerGrounded || this.coyoteTimer > 0) {
      this.playerVy = 8.2;
      this.playerGrounded = false;
      this.coyoteTimer = 0;
      this.isCrouching = false;
    }
  }

  public triggerVehicleToggle() {
    if (this.phase !== 'playing') return;
    if (this.playerVehicle) {
      const v = this.playerVehicle;
      this.playerVehicle = null;
      this.playerX = v.x + Math.cos(v.yaw) * 2.5;
      this.playerZ = v.z - Math.sin(v.yaw) * 2.5;
      this.playerY = groundHeightAt(this.playerX, this.playerZ);
      this.playerRig.root.visible = true;
      worldAudio.setVehicleEngine(false, v.type, 0);
      return;
    }

    let best: VehicleEntity | null = null;
    let bestD = 5.0;
    for (const v of this.vehicles) {
      const d = Math.hypot(v.x - this.playerX, v.z - this.playerZ);
      if (d < bestD) {
        bestD = d;
        best = v;
      }
    }
    if (best) {
      best.isAiTraffic = false; // Player takes control
      this.playerVehicle = best;
      this.playerRig.root.visible = false;
      worldAudio.playInteract();
      this.showToast(`Driving ${best.type.toUpperCase()} — Press [H] for Horn`);
    }
  }

  public triggerInteract() {
    if (this.phase !== 'playing' || this.playerVehicle) return;
    if (this.activeDialogue) {
      this.advanceDialogue();
      return;
    }

    // Check nearby shop
    for (const s of this.world.shops) {
      if (Math.hypot(s.x - this.playerX, s.z - this.playerZ) < 6.5) {
        if (document.pointerLockElement) document.exitPointerLock?.();
        this.onOpenShopModal();
        return;
      }
    }

    // Check nearby NPC
    let nearestNpc: NpcEntity | null = null;
    let bestD = 4.2;
    for (const n of this.npcs) {
      const d = Math.hypot(n.x - this.playerX, n.z - this.playerZ);
      if (d < bestD) {
        bestD = d;
        nearestNpc = n;
      }
    }
    if (nearestNpc) {
      this.activeDialogue = nearestNpc.dialogue;
      this.dialogueIndex = 0;
      worldAudio.playInteract();
      this.emitHud();
    }
  }

  private resolveCollisions(x: number, z: number, y: number, r: number): { x: number; z: number } {
    let rx = THREE.MathUtils.clamp(x, -WORLD_BOUND, WORLD_BOUND);
    let rz = THREE.MathUtils.clamp(z, -WORLD_BOUND, WORLD_BOUND);

    for (const c of this.world.colliders) {
      if (y > c.maxY - 0.1 || y + 1.6 < c.minY) continue;
      const cx = Math.max(c.minX, Math.min(rx, c.maxX));
      const cz = Math.max(c.minZ, Math.min(rz, c.maxZ));
      const dx = rx - cx;
      const dz = rz - cz;
      const dSq = dx * dx + dz * dz;
      if (dSq < r * r) {
        const d = Math.sqrt(dSq);
        if (d > 0.001) {
          rx += (dx / d) * (r - d);
          rz += (dz / d) * (r - d);
        } else {
          rx += r;
        }
      }
    }
    return { x: rx, z: rz };
  }

  private tick = () => {
    if (this.disposed) return;
    const dt = Math.min(this.clock.getDelta(), 0.05);

    if (this.phase === 'lobby') {
      this.lobbyAngle += dt * 0.2;
      this.playerRig.animate(dt, 0, false, false, false, 0);
      this.camera.position.set(
        this.playerX + Math.sin(this.lobbyAngle) * 4.2,
        this.playerY + 2.1,
        this.playerZ + Math.cos(this.lobbyAngle) * 4.2
      );
      this.camera.lookAt(this.playerX, this.playerY + 1.25, this.playerZ);
    } else if (this.phase === 'playing') {
      if (this.toastTimer > 0) {
        this.toastTimer -= dt;
        if (this.toastTimer <= 0) this.toastMessage = null;
      }

      if (this.settings.autoTimeCycle) {
        this.timeOfDay = (this.timeOfDay + dt * 0.09) % 24;
      }

      this.updateWeather(dt);
      this.updatePlayer(dt);
      this.updateVehicles(dt);
      this.updateNpcs(dt);
      this.updateMissions();
      this.updateCameraFollow(dt);
    }

    this.sunLight.target.position.set(this.playerX, 0, this.playerZ);
    this.sunLight.position.set(this.playerX + 120, 150, this.playerZ + 90);
    this.renderer.render(this.scene, this.camera);

    this.hudTimer += dt;
    if (this.hudTimer >= 0.07) {
      this.hudTimer = 0;
      this.emitHud();
    }

    this.scheduleNext();
  };

  private scheduleNext() {
    if (this.disposed) return;
    if (this.isSoftwareGl) {
      const gl = this.renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (this.disposed) return;
        const st = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (st === gl.UNSIGNALED) {
          this.frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          this.frameId = window.setTimeout(this.tick, 80);
        }
      };
      this.frameId = window.setTimeout(poll, 5);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  }

  private updateWeather(dt: number) {
    const nearCoast = this.playerX > 135;
    worldAudio.updateAtmosphereAudio(this.weather, nearCoast);

    if (this.weather === 'rain' || this.weather === 'thunderstorm') {
      for (let i = 0; i < this.rainPositions.length; i += 3) {
        this.rainPositions[i + 1] -= 26 * dt;
        if (this.rainPositions[i + 1] < 0) {
          this.rainPositions[i] = this.playerX + (Math.random() - 0.5) * 58;
          this.rainPositions[i + 1] = 24 + Math.random() * 6;
          this.rainPositions[i + 2] = this.playerZ + (Math.random() - 0.5) * 58;
        }
      }
      this.rainPoints.geometry.attributes.position.needsUpdate = true;
    }

    if (this.weather === 'thunderstorm') {
      this.lightningTimer -= dt;
      if (this.lightningTimer <= 0) {
        this.lightningTimer = 7 + Math.random() * 10;
        this.lightningFlash = 4.5;
        worldAudio.playThunder();
      }
    }
    if (this.lightningFlash > 0) {
      this.lightningFlash = Math.max(0, this.lightningFlash - dt * 12);
    }
    this.applyAtmosphere();
  }

  private updatePlayer(dt: number) {
    if (this.keys.has('ArrowLeft')) this.camYaw += 1.8 * dt;
    if (this.keys.has('ArrowRight')) this.camYaw -= 1.8 * dt;
    if (this.keys.has('ArrowUp')) this.camPitch = Math.max(-0.35, this.camPitch - 1.1 * dt);
    if (this.keys.has('ArrowDown')) this.camPitch = Math.min(0.85, this.camPitch + 1.1 * dt);

    if (this.playerVehicle) {
      const v = this.playerVehicle;
      const throttle =
        (this.keys.has('KeyW') ? 1 : 0) -
        (this.keys.has('KeyS') ? 1 : 0) +
        this.virtualControls.moveY;
      const steer =
        (this.keys.has('KeyA') ? 1 : 0) -
        (this.keys.has('KeyD') ? 1 : 0) -
        this.virtualControls.moveX;

      const maxSpd =
        v.type === 'motorcycle' ? 27 : v.type === 'car' || v.type === 'police' ? 24 : v.type === 'auto' ? 18 : 15;
      const accel = v.type === 'motorcycle' ? 20 : 14;

      if (Math.abs(throttle) > 0.05) {
        v.speed = THREE.MathUtils.clamp(v.speed + throttle * accel * dt, -9, maxSpd);
      } else {
        v.speed = THREE.MathUtils.damp(v.speed, 0, 3.0, dt);
      }
      if (Math.abs(v.speed) > 0.35) {
        const sign = v.speed >= 0 ? 1 : -1;
        v.yaw += steer * sign * 2.1 * dt * Math.min(1, Math.abs(v.speed) / 6);
      }

      const nx = v.x + Math.sin(v.yaw) * v.speed * dt;
      const nz = v.z + Math.cos(v.yaw) * v.speed * dt;
      const res = this.resolveCollisions(nx, nz, v.y, 1.5);
      if (Math.hypot(res.x - nx, res.z - nz) > 0.1) v.speed *= 0.35;
      v.x = res.x;
      v.z = res.z;
      v.y = Math.max(WATER_LEVEL - 0.1, groundHeightAt(v.x, v.z));

      this.playerX = v.x;
      this.playerY = v.y;
      this.playerZ = v.z;
      this.playerYaw = v.yaw;
      worldAudio.setVehicleEngine(true, v.type, v.speed / maxSpd);

      this.vehicleSpotLight.position.set(v.x, v.y + 1.2, v.z);
      this.vehicleSpotLight.target.position.set(
        v.x + Math.sin(v.yaw) * 20,
        v.y + 0.2,
        v.z + Math.cos(v.yaw) * 20
      );
      return;
    }

    worldAudio.setVehicleEngine(false, 'car', 0);

    let inX = (this.keys.has('KeyD') ? 1 : 0) - (this.keys.has('KeyA') ? 1 : 0) + this.virtualControls.moveX;
    let inZ = (this.keys.has('KeyW') ? 1 : 0) - (this.keys.has('KeyS') ? 1 : 0) + this.virtualControls.moveY;
    const m = Math.hypot(inX, inZ);
    if (m > 1) {
      inX /= m;
      inZ /= m;
    }

    const wantsSprint =
      (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.virtualControls.sprinting) &&
      m > 0.15 &&
      !this.isCrouching;
    this.isSprinting = wantsSprint && this.stamina > 2;
    if (this.isSprinting) {
      this.stamina = Math.max(0, this.stamina - 16 * dt);
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + 14 * dt);
    }

    const groundY = groundHeightAt(this.playerX, this.playerZ);
    this.isSwimming = groundY < WATER_LEVEL - 0.55;

    const speed = this.isSwimming ? 4.4 : this.isCrouching ? 3.0 : this.isSprinting ? 10.2 : 6.2;

    const fwdX = -Math.sin(this.camYaw);
    const fwdZ = -Math.cos(this.camYaw);
    const rightX = Math.cos(this.camYaw);
    const rightZ = -Math.sin(this.camYaw);

    const vx = (fwdX * inZ + rightX * inX) * speed;
    const vz = (fwdZ * inZ + rightZ * inX) * speed;
    const hSpd = Math.hypot(vx, vz);

    const res = this.resolveCollisions(this.playerX + vx * dt, this.playerZ + vz * dt, this.playerY, 0.45);
    this.playerX = res.x;
    this.playerZ = res.z;

    const newGround = groundHeightAt(this.playerX, this.playerZ);
    if (this.isSwimming) {
      this.playerY = THREE.MathUtils.damp(this.playerY, WATER_LEVEL - 0.85, 8, dt);
      this.playerVy = 0;
      this.playerGrounded = false;
    } else if (this.playerGrounded) {
      this.coyoteTimer = 0.12;
      if (this.playerY > newGround + 0.35) {
        this.playerGrounded = false;
      } else {
        this.playerY = newGround;
        this.playerVy = 0;
      }
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
      this.playerVy -= 21 * dt;
      this.playerY += this.playerVy * dt;
      if (this.playerY <= newGround) {
        this.playerY = newGround;
        this.playerVy = 0;
        this.playerGrounded = true;
      }
    }

    if (hSpd > 0.2) {
      const targetYaw = Math.atan2(vx, vz);
      let diff = targetYaw - this.playerYaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.playerYaw += diff * Math.min(1, dt * 12);

      this.walkPhase += dt * (this.isSprinting ? 13 : 8.2);
      this.footstepTimer -= dt;
      if (this.footstepTimer <= 0 && (this.playerGrounded || this.isSwimming)) {
        this.footstepTimer = this.isSwimming ? 0.55 : this.isSprinting ? 0.32 : 0.48;
        worldAudio.playFootstep(this.isSprinting, this.isSwimming);
      }
    }

    this.playerRig.root.position.set(this.playerX, this.playerY, this.playerZ);
    this.playerRig.root.rotation.y = this.playerYaw;
    this.playerRig.animate(dt, hSpd, this.isCrouching, this.isSwimming, false, this.walkPhase);
  }

  private updateVehicles(dt: number) {
    for (const v of this.vehicles) {
      if (v.isAiTraffic && v !== this.playerVehicle) {
        // Gentle highway traffic loop, stops if player stands directly in front
        const distPlayer = Math.hypot(v.x - this.playerX, v.z - this.playerZ);
        const targetSpd = distPlayer < 7.5 ? 0 : 8.5;
        v.speed = THREE.MathUtils.damp(v.speed, targetSpd, 4, dt);

        if (v.trafficAxis === 'ns') {
          v.z += v.trafficDir * v.speed * dt;
          v.yaw = v.trafficDir > 0 ? 0 : Math.PI;
          if (v.z > 105) v.trafficDir = -1;
          else if (v.z < -165) v.trafficDir = 1;
        } else {
          v.x += v.trafficDir * v.speed * dt;
          v.yaw = v.trafficDir > 0 ? Math.PI / 2 : -Math.PI / 2;
          if (v.x > 160) v.trafficDir = -1;
          else if (v.x < -125) v.trafficDir = 1;
        }
        v.y = groundHeightAt(v.x, v.z);
      } else if (v !== this.playerVehicle && Math.abs(v.speed) > 0.05) {
        v.speed = THREE.MathUtils.damp(v.speed, 0, 2.5, dt);
        v.x += Math.sin(v.yaw) * v.speed * dt;
        v.z += Math.cos(v.yaw) * v.speed * dt;
        v.y = groundHeightAt(v.x, v.z);
      }

      v.rig.root.position.set(v.x, v.y, v.z);
      v.rig.root.rotation.y = v.yaw;
      for (const w of v.rig.wheels) {
        w.rotation.x += v.speed * dt * 1.4;
      }
    }
  }

  private updateNpcs(dt: number) {
    for (const n of this.npcs) {
      if (n.isFriend) {
        // Face player when nearby
        const d = Math.hypot(this.playerX - n.x, this.playerZ - n.z);
        if (d < 10) {
          n.yaw = Math.atan2(this.playerX - n.x, this.playerZ - n.z);
        }
        n.rig.root.rotation.y = n.yaw;
        n.rig.animate(dt, 0, false, false, false, 0);
        continue;
      }

      if (n.waitTimer > 0) {
        n.waitTimer -= dt;
        n.rig.animate(dt, 0, false, false, false, 0);
        if (n.waitTimer <= 0) {
          n.targetX = n.homeX + (Math.random() - 0.5) * 20;
          n.targetZ = n.homeZ + (Math.random() - 0.5) * 20;
        }
        continue;
      }

      const dx = n.targetX - n.x;
      const dz = n.targetZ - n.z;
      const dist = Math.hypot(dx, dz);
      if (dist < 1.0) {
        n.waitTimer = 1.5 + Math.random() * 2.5;
        continue;
      }

      const spd = 2.1;
      n.x += (dx / dist) * spd * dt;
      n.z += (dz / dist) * spd * dt;
      n.y = groundHeightAt(n.x, n.z);
      n.yaw = Math.atan2(dx, dz);
      n.walkPhase += dt * 6.5;

      n.rig.root.position.set(n.x, n.y, n.z);
      n.rig.root.rotation.y = n.yaw;
      n.rig.animate(dt, spd, false, false, false, n.walkPhase);
    }
  }

  private updateMissions() {
    const mission = MISSIONS.find((m) => m.id === this.activeMissionId);
    if (!mission) {
      this.waypointMesh.visible = false;
      return;
    }

    const wy = groundHeightAt(mission.targetX, mission.targetZ);
    this.waypointMesh.visible = true;
    this.waypointMesh.position.set(mission.targetX, wy + 22, mission.targetZ);

    const dist = Math.hypot(this.playerX - mission.targetX, this.playerZ - mission.targetZ);
    if (dist < 7.5 && !this.activeDialogue) {
      if (!this.completedMissions.includes(mission.id)) {
        this.completedMissions.push(mission.id);
        this.money += mission.rewardMoney;
        worldAudio.playMissionChime();
        this.showToast(`Mission Complete: ${mission.title} (+₹${mission.rewardMoney})`);
        this.activeDialogue = mission.completeDialogue;
        this.dialogueIndex = 0;
        this.pendingMissionCompleteId = mission.id;
        this.emitHud();
      }
    }
  }

  private updateCameraFollow(dt: number) {
    const targetDist = this.playerVehicle ? (this.playerVehicle.type === 'bus' ? 11.5 : 7.6) : 4.7;
    this.camDist = THREE.MathUtils.damp(this.camDist, targetDist, 10, dt);

    const pivotY = this.playerVehicle ? 1.9 : this.isCrouching ? 1.15 : 1.55;
    const sinY = Math.sin(this.camYaw);
    const cosY = Math.cos(this.camYaw);
    const sinP = Math.sin(this.camPitch);
    const cosP = Math.cos(this.camPitch);

    _camDesired.set(
      this.playerX + sinY * cosP * this.camDist,
      this.playerY + pivotY + sinP * this.camDist,
      this.playerZ + cosY * cosP * this.camDist
    );

    const gy = groundHeightAt(_camDesired.x, _camDesired.z);
    if (_camDesired.y < gy + 0.65) _camDesired.y = gy + 0.65;

    this.camera.position.lerp(_camDesired, 1 - Math.exp(-16 * dt));
    _camLook.set(this.playerX, this.playerY + pivotY * 0.85, this.playerZ);
    this.camera.lookAt(_camLook);
  }

  private emitHud() {
    const reg = getRegionAt(this.playerX, this.playerZ);

    let interactPrompt: string | null = null;
    let nearbyShop = false;
    if (this.playerVehicle) {
      interactPrompt = `[E] Exit ${this.playerVehicle.type.toUpperCase()} · [H] Horn`;
    } else {
      for (const s of this.world.shops) {
        if (Math.hypot(s.x - this.playerX, s.z - this.playerZ) < 6.5) {
          interactPrompt = `[F] Visit ${s.name}`;
          nearbyShop = true;
          break;
        }
      }
      if (!interactPrompt) {
        for (const v of this.vehicles) {
          if (Math.hypot(v.x - this.playerX, v.z - this.playerZ) < 4.8) {
            interactPrompt = `[E] Drive ${v.type.toUpperCase()}`;
            break;
          }
        }
      }
      if (!interactPrompt) {
        for (const n of this.npcs) {
          if (Math.hypot(n.x - this.playerX, n.z - this.playerZ) < 4.0) {
            interactPrompt = `[F] Talk to ${n.name}`;
            break;
          }
        }
      }
    }

    const blips: MinimapBlip[] = [];
    for (const v of this.vehicles) {
      blips.push({ x: v.x, z: v.z, kind: 'vehicle', color: '#fbbf24' });
    }
    for (const s of this.world.shops) {
      blips.push({ x: s.x, z: s.z, kind: 'shop', color: '#10b981' });
    }
    for (const n of this.npcs) {
      if (n.isFriend) blips.push({ x: n.x, z: n.z, kind: 'npc', color: '#38bdf8' });
    }
    const mission = MISSIONS.find((m) => m.id === this.activeMissionId);
    if (mission) {
      blips.push({ x: mission.targetX, z: mission.targetZ, kind: 'mission', color: '#f59e0b' });
    }

    const hr = Math.floor(this.timeOfDay);
    const mn = Math.floor((this.timeOfDay - hr) * 60);
    const timeLabel = `${hr.toString().padStart(2, '0')}:${mn.toString().padStart(2, '0')}`;

    this.onHudUpdate({
      phase: this.phase,
      region: reg.id,
      regionLabel: reg.label,
      timeOfDay: this.timeOfDay,
      timeLabel,
      weather: this.weather,
      hp: Math.ceil(this.hp),
      maxHp: this.maxHp,
      stamina: Math.ceil(this.stamina),
      maxStamina: this.maxStamina,
      money: this.money,
      outfit: this.outfit,
      inventory: { ...this.inventory },
      isSwimming: this.isSwimming,
      isSprinting: this.isSprinting,
      isCrouching: this.isCrouching,
      inVehicle: this.playerVehicle ? this.playerVehicle.type : null,
      vehicleSpeedKmh: this.playerVehicle ? Math.round(Math.abs(this.playerVehicle.speed) * 3.6) : 0,
      playerX: this.playerX,
      playerZ: this.playerZ,
      playerYaw: this.camYaw,
      pointerLocked: this.pointerLocked,
      activeMissionId: this.activeMissionId,
      completedMissions: [...this.completedMissions],
      activeDialogue: this.activeDialogue,
      dialogueIndex: this.dialogueIndex,
      interactPrompt,
      nearbyShop,
      minimapBlips: blips,
      toastMessage: this.toastMessage,
    });
  }

  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    worldAudio.setVehicleEngine(false, 'car', 0);

    for (const h of this.boundHandlers) {
      h.target.removeEventListener(h.type, h.fn);
    }
    this.boundHandlers = [];
    for (const v of this.vehicles) {
      this.scene.remove(v.rig.root);
      v.rig.dispose();
    }
    for (const n of this.npcs) {
      this.scene.remove(n.rig.root);
      n.rig.dispose();
    }
    this.playerRig.dispose();
    this.world.dispose();
    this.waypointMesh.geometry.dispose();
    (this.waypointMesh.material as THREE.Material).dispose();
    this.rainPoints.geometry.dispose();
    (this.rainPoints.material as THREE.Material).dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
