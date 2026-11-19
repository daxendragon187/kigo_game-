export type RegionId = 'villupuram' | 'farmland' | 'pondicherry' | 'chennai' | 'highway';
export type WeatherMode = 'sunny' | 'dusk' | 'night' | 'rain' | 'thunderstorm';
export type VehicleType = 'auto' | 'bus' | 'motorcycle' | 'scooter' | 'car' | 'tractor' | 'police';
export type OutfitId =
  | 'veshti_shirt'
  | 'modern_casual'
  | 'saree'
  | 'salwar'
  | 'college_uniform'
  | 'police_khakhi'
  | 'festival_silk';

export type GamePhase = 'lobby' | 'playing' | 'paused';

export interface CharacterConfig {
  id: string;
  name: string;
  role: string;
  bio: string;
  defaultOutfit: OutfitId;
  skinColor: number;
  hairColor: number;
  shirtColor: number;
  bottomColor: number;
  accentHex: string;
}

export const FRIENDS_CAST: CharacterConfig[] = [
  {
    id: 'kigo',
    name: 'Arjun "Kigo"',
    role: 'Protagonist · Villupuram',
    bio: 'Resourceful Villupuram youth torn between family responsibilities and uncovering a highway syndicate threatening his hometown.',
    defaultOutfit: 'modern_casual',
    skinColor: 0xb97a4b,
    hairColor: 0x16161a,
    shirtColor: 0xd97706,
    bottomColor: 0x1e293b,
    accentHex: '#f59e0b',
  },
  {
    id: 'kavin',
    name: 'Kavin',
    role: 'Best Friend · Auto Mechanic',
    bio: 'Runs the corner repair shed near Villupuram Bus Stand. Fiercely loyal, always ready with filter coffee and a fast auto.',
    defaultOutfit: 'veshti_shirt',
    skinColor: 0xa86b3e,
    hairColor: 0x111114,
    shirtColor: 0x0f766e,
    bottomColor: 0xf8fafc,
    accentHex: '#14b8a6',
  },
  {
    id: 'meera',
    name: 'Meera',
    role: 'Childhood Friend · Journalist',
    bio: 'Villupuram native studying journalism in Chennai. Returns home on the express train with leaked land-grab documents.',
    defaultOutfit: 'salwar',
    skinColor: 0xc98c63,
    hairColor: 0x141418,
    shirtColor: 0xbe185d,
    bottomColor: 0xfef3c7,
    accentHex: '#ec4899',
  },
  {
    id: 'selva',
    name: 'Selva',
    role: 'Rival / Estranged Friend',
    bio: 'Former college athlete from Villupuram forced to work for the highway syndicate to pay off his family debt.',
    defaultOutfit: 'college_uniform',
    skinColor: 0x9c6036,
    hairColor: 0x121216,
    shirtColor: 0x334155,
    bottomColor: 0x0f172a,
    accentHex: '#ef4444',
  },
  {
    id: 'ananya',
    name: 'Ananya',
    role: 'Coastal Architect · Pondicherry',
    bio: 'Heritage conservationist in Pondicherry protecting coastal villages and temple corridors from illegal demolition.',
    defaultOutfit: 'saree',
    skinColor: 0xd49b72,
    hairColor: 0x15151a,
    shirtColor: 0x0284c7,
    bottomColor: 0xf59e0b,
    accentHex: '#38bdf8',
  },
];

export interface ShopItem {
  id: string;
  name: string;
  tamilName: string;
  price: number;
  healHp: number;
  restoreStamina: number;
  description: string;
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'filter_coffee',
    name: 'Degree Filter Coffee',
    tamilName: 'டிகிரி ஃபில்டர் காபி',
    price: 20,
    healHp: 18,
    restoreStamina: 40,
    description: 'Steaming brass-tumbler coffee from Villupuram Tea Kada.',
  },
  {
    id: 'masala_dosa',
    name: 'Crispy Masala Dosa',
    tamilName: 'மசாலா தோசை',
    price: 55,
    healHp: 40,
    restoreStamina: 25,
    description: 'Served hot with coconut chutney and sambar.',
  },
  {
    id: 'parotta',
    name: 'Madurai Bun Parotta',
    tamilName: 'பன் பரோட்டா',
    price: 75,
    healHp: 58,
    restoreStamina: 35,
    description: 'Flaky layered parotta with spicy salna.',
  },
  {
    id: 'coconut',
    name: 'Elaneer (Tender Coconut)',
    tamilName: 'இளநீர்',
    price: 35,
    healHp: 24,
    restoreStamina: 60,
    description: 'Freshly cut coastal coconut from Pondicherry.',
  },
  {
    id: 'laddu',
    name: 'Temple Festival Sweet Box',
    tamilName: 'கோவில் பிரசாதம்',
    price: 110,
    healHp: 100,
    restoreStamina: 100,
    description: 'Full health & stamina restoration.',
  },
];

export interface DialogueLine {
  speaker: string;
  tamil: string;
  english: string;
  accentHex?: string;
}

export interface MissionDef {
  id: string;
  chapter: number;
  category: 'Main Story' | 'Friendship' | 'Village' | 'Driving' | 'Rescue';
  title: string;
  subtitle: string;
  region: RegionId;
  targetX: number;
  targetZ: number;
  targetLabel: string;
  rewardMoney: number;
  startDialogue: DialogueLine[];
  completeDialogue: DialogueLine[];
}

export const MISSIONS: MissionDef[] = [
  {
    id: 'ch1_villupuram_dawn',
    chapter: 1,
    category: 'Main Story',
    title: 'Villupuram Dawn',
    subtitle: 'Meet Meera arriving at Villupuram Railway Station on the Chennai Express.',
    region: 'villupuram',
    targetX: -28,
    targetZ: 105,
    targetLabel: 'Villupuram Railway Station',
    rewardMoney: 250,
    startDialogue: [
      {
        speaker: 'Kavin',
        tamil: 'டேய் அர்ஜுன்! மீரா சென்னை எக்ஸ்பிரஸ்ல விழுப்புரம் ஸ்டேஷனுக்கு வந்துட்டா. சீக்கிரம் போ!',
        english: 'Hey Arjun! Meera just arrived at Villupuram Railway Station on the Chennai Express. Hurry over!',
        accentHex: '#14b8a6',
      },
    ],
    completeDialogue: [
      {
        speaker: 'Meera',
        tamil: 'அர்ஜுன்! நம்ம ஊர் நிலத்தை ஒரு பெரிய கும்பல் ஆக்கிரமிக்கப் பார்க்குது. இந்த ஃபைல பாரு.',
        english: 'Arjun! A syndicate is trying to seize our village farmland. Look at these leaked records.',
        accentHex: '#ec4899',
      },
      {
        speaker: 'Arjun "Kigo"',
        tamil: 'கவலைப்படாத மீரா. நாம் ஒன்னா சேர்ந்து உண்மையை வெளியே கொண்டு வருவோம்.',
        english: 'Don’t worry, Meera. Together, we’ll uncover the truth and protect Villupuram.',
        accentHex: '#f59e0b',
      },
    ],
  },
  {
    id: 'ch2_market_shadows',
    chapter: 2,
    category: 'Main Story',
    title: 'Shadows at the Bus Stand',
    subtitle: 'Drive an Auto-Rickshaw or Motorcycle to Villupuram Bus Stand & Local Market.',
    region: 'villupuram',
    targetX: 28,
    targetZ: 68,
    targetLabel: 'Villupuram Bus Stand',
    rewardMoney: 400,
    startDialogue: [
      {
        speaker: 'Kavin',
        tamil: 'மார்க்கெட் பக்கத்துல ஆளுங்க பிரச்சனை பண்றாங்க! என் ஆட்டோவை எடுத்துக்கிட்டு பஸ் ஸ்டாண்ட் வா.',
        english: 'Trouble is brewing near the market! Grab my Auto-Rickshaw and head to Villupuram Bus Stand.',
        accentHex: '#14b8a6',
      },
    ],
    completeDialogue: [
      {
        speaker: 'Shopkeeper',
        tamil: 'நன்றி தம்பி! உன் நண்பன் செல்வா அந்த புதுச்சேரி கும்பலோட போனதைப் பார்த்தேன்.',
        english: 'Thank you, brother! I saw your old friend Selva heading east toward the Pondicherry gang.',
        accentHex: '#f59e0b',
      },
    ],
  },
  {
    id: 'ch3_pondicherry_coast',
    chapter: 3,
    category: 'Main Story',
    title: 'Pondicherry Coastal Clues',
    subtitle: 'Follow the East Coast Highway to Pondicherry Promenade & meet Ananya.',
    region: 'pondicherry',
    targetX: 158,
    targetZ: 88,
    targetLabel: 'Pondicherry Promenade Lighthouse',
    rewardMoney: 600,
    startDialogue: [
      {
        speaker: 'Meera',
        tamil: 'பாண்டிச்சேரி பீச் ரோட்டுல அனன்யா நமக்காகக் காத்துக்கிட்டு இருக்கா. கடற்கரை சாலை வழியா போ.',
        english: 'Ananya is waiting for us along Pondicherry Promenade Beach. Take the highway east!',
        accentHex: '#ec4899',
      },
    ],
    completeDialogue: [
      {
        speaker: 'Ananya',
        tamil: 'வரவேற்கிறேன் அர்ஜுன்! ஆவணங்கள் எல்லாம் சென்னை துறைமுகத் தலைமையகத்துல இருக்கு.',
        english: 'Welcome to Pondicherry, Arjun! The master deeds are locked inside the Chennai Syndicate Tower.',
        accentHex: '#38bdf8',
      },
    ],
  },
  {
    id: 'ch4_highway_betrayal',
    chapter: 4,
    category: 'Main Story',
    title: 'The Highway Confrontation',
    subtitle: 'Meet Selva near the Villupuram–Chennai Highway Temple Crossroad.',
    region: 'farmland',
    targetX: -95,
    targetZ: -12,
    targetLabel: 'Highway Temple & Farm Crossroad',
    rewardMoney: 850,
    startDialogue: [
      {
        speaker: 'Selva',
        tamil: 'அர்ஜுன்... இந்த வழக்கை இத்தோட விட்டுடு. அவங்க குடும்பக் கடனை வச்சு என்னை மிரட்டுறாங்க.',
        english: 'Arjun... drop this investigation. They are threatening my family over our farm debt.',
        accentHex: '#ef4444',
      },
    ],
    completeDialogue: [
      {
        speaker: 'Selva',
        tamil: 'என்னை மன்னிச்சிடு நண்பா... நம்ம நட்பு தான் பெருசு. சென்னை போக நான் உதவுறேன்.',
        english: 'Forgive me, brother... our friendship comes first. Take this keycard and let’s finish this in Chennai.',
        accentHex: '#ef4444',
      },
    ],
  },
  {
    id: 'ch5_chennai_reunion',
    chapter: 5,
    category: 'Main Story',
    title: 'Chennai Reunion',
    subtitle: 'Drive North on NH-32 to Chennai Central Plaza to expose the syndicate.',
    region: 'chennai',
    targetX: 0,
    targetZ: -145,
    targetLabel: 'Chennai Central Plaza',
    rewardMoney: 1500,
    startDialogue: [
      {
        speaker: 'Arjun "Kigo"',
        tamil: 'கவின், மீரா, அனன்யா, செல்வா — எல்லாரும் ஒன்னா சென்னை போறோம்!',
        english: 'Kavin, Meera, Ananya, Selva — all five of us ride into Chennai together!',
        accentHex: '#f59e0b',
      },
    ],
    completeDialogue: [
      {
        speaker: 'Meera',
        tamil: 'நாம ஜெயிச்சிட்டோம் அர்ஜுன்! விழுப்புரம் விவசாய நிலங்களும் கோவில் திருவிழாவும் பாதுகாக்கப்பட்டுடுச்சு!',
        english: 'We did it, Arjun! Villupuram’s farmlands are safe, and the press has exposed the entire syndicate!',
        accentHex: '#ec4899',
      },
      {
        speaker: 'Kavin',
        tamil: 'வாங்க நண்பர்களே, விழுப்புரம் போய் திருவிழா கொண்டாடலாம்!',
        english: 'Let’s head back to Villupuram and celebrate the village temple festival together!',
        accentHex: '#14b8a6',
      },
    ],
  },
  {
    id: 'side_tractor_harvest',
    chapter: 0,
    category: 'Village',
    title: 'Paddy Field Harvest Run',
    subtitle: 'Visit the Villupuram Green Fields Farmstead to deliver festival supplies.',
    region: 'farmland',
    targetX: -125,
    targetZ: 72,
    targetLabel: 'Green Paddy Farmstead',
    rewardMoney: 300,
    startDialogue: [
      {
        speaker: 'Farmer Murugan',
        tamil: 'தம்பி, டிராக்டர் ஷெட் பக்கத்துல நெல் மூட்டைங்க காத்துக்கிட்டு இருக்கு.',
        english: 'Son, check in at the paddy farmstead near the tractor shed to help transport festival grain.',
        accentHex: '#10b981',
      },
    ],
    completeDialogue: [
      {
        speaker: 'Farmer Murugan',
        tamil: 'ரொம்ப நன்றி தம்பி! விழுப்புரம் எப்பவும் உன் கூட இருக்கும்.',
        english: 'Thank you kindly! Villupuram’s farmers will always stand by you.',
        accentHex: '#10b981',
      },
    ],
  },
  {
    id: 'side_tea_delivery',
    chapter: 0,
    category: 'Friendship',
    title: 'Temple Festival Procession',
    subtitle: 'Check in at the Villupuram Dravidian Temple Gopuram with festival offerings.',
    region: 'villupuram',
    targetX: -2,
    targetZ: 28,
    targetLabel: 'Villupuram Temple Gopuram',
    rewardMoney: 280,
    startDialogue: [
      {
        speaker: 'Kavin',
        tamil: 'கோவில் திருவிழாவுக்கு பிரசாதம் கொண்டு போகணும், சீக்கிரம் கோவிலுக்கு வா!',
        english: 'The temple festival bells are ringing—head to the Villupuram Temple Gopuram!',
        accentHex: '#14b8a6',
      },
    ],
    completeDialogue: [
      {
        speaker: 'Priest',
        tamil: 'நல்லா இருங்க தம்பி! ஊர் நன்மைக்காக உழைக்கிறீங்க.',
        english: 'Blessings upon you and your friends for protecting our town.',
        accentHex: '#f59e0b',
      },
    ],
  },
];

export interface MinimapBlip {
  x: number;
  z: number;
  kind: 'vehicle' | 'npc' | 'shop' | 'mission';
  color: string;
}

export interface OpenWorldHudState {
  phase: GamePhase;
  region: RegionId;
  regionLabel: string;
  timeOfDay: number; // 0..24 hours
  timeLabel: string;
  weather: WeatherMode;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  money: number;
  outfit: OutfitId;
  inventory: Record<string, number>;
  isSwimming: boolean;
  isSprinting: boolean;
  isCrouching: boolean;
  inVehicle: VehicleType | null;
  vehicleSpeedKmh: number;
  playerX: number;
  playerZ: number;
  playerYaw: number;
  pointerLocked: boolean;
  activeMissionId: string | null;
  completedMissions: string[];
  activeDialogue: DialogueLine[] | null;
  dialogueIndex: number;
  interactPrompt: string | null;
  nearbyShop: boolean;
  minimapBlips: MinimapBlip[];
  toastMessage: string | null;
}

export interface GameSettings {
  weather: WeatherMode;
  autoTimeCycle: boolean;
  mouseSensitivity: number;
  soundEnabled: boolean;
  masterVolume: number;
  showTouchControls: boolean;
}

export interface SaveGameData {
  playerX: number;
  playerZ: number;
  hp: number;
  money: number;
  outfit: OutfitId;
  inventory: Record<string, number>;
  activeMissionId: string | null;
  completedMissions: string[];
  timeOfDay: number;
  weather: WeatherMode;
  savedAt: string;
}
