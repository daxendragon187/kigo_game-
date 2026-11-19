import { useCallback, useEffect, useRef, useState } from 'react';
import { GameHud } from './components/GameHud';
import { LobbyScreen } from './components/LobbyScreen';
import {
  DownloadGameModal,
  GodotScriptsModal,
  MapMissionsModal,
  PauseModal,
  SettingsModal,
  ShopInventoryModal,
} from './components/Modals';
import { TamilNaduEngine } from './game/engine';
import {
  CharacterConfig,
  FRIENDS_CAST,
  GameSettings,
  OpenWorldHudState,
  SaveGameData,
  WeatherMode,
} from './game/types';

const SETTINGS_KEY = 'kigo_tn_settings_v1';
const SAVE_KEY = 'kigo_tn_save_v1';

const DEFAULT_SETTINGS: GameSettings = {
  weather: 'sunny',
  autoTimeCycle: true,
  mouseSensitivity: 1.0,
  soundEnabled: true,
  masterVolume: 0.7,
  showTouchControls: false,
};

function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

function loadSavedGame(): SaveGameData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return JSON.parse(raw) as SaveGameData;
  } catch {
    // ignore
  }
  return null;
}

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<TamilNaduEngine | null>(null);

  const [settings, setSettings] = useState<GameSettings>(loadSettings);
  const [savedGame, setSavedGame] = useState<SaveGameData | null>(loadSavedGame);
  const [selectedChar, setSelectedChar] = useState<CharacterConfig>(FRIENDS_CAST[0]);
  const [hud, setHud] = useState<OpenWorldHudState | null>(null);

  const [showSettings, setShowSettings] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showGodot, setShowGodot] = useState(false);
  const [showDownload, setShowDownload] = useState(false);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const charRef = useRef(selectedChar);
  charRef.current = selectedChar;

  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    const engine = new TamilNaduEngine(
      mount,
      settingsRef.current,
      charRef.current,
      (nextHud) => setHud(nextHud),
      () => setShowMap(true),
      () => setShowShop(true)
    );
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const updateSettings = useCallback((patch: Partial<GameSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      engineRef.current?.updateSettings(next);
      return next;
    });
  }, []);

  const handleSaveGame = useCallback(() => {
    if (!engineRef.current) return;
    const data = engineRef.current.exportSaveData();
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      setSavedGame(data);
    } catch {
      // ignore
    }
  }, []);

  const handleSetTimeAndWeather = useCallback(
    (hour: number, weather: WeatherMode) => {
      updateSettings({ weather });
      engineRef.current?.setTimeAndWeather(hour, weather);
    },
    [updateSettings]
  );

  const phase = hud?.phase ?? 'lobby';

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0b0f14]">
      <div ref={canvasMountRef} className="absolute inset-0 h-full w-full" />

      {phase === 'lobby' && (
        <LobbyScreen
          selectedChar={selectedChar}
          settings={settings}
          savedGame={savedGame}
          onSelectChar={(c) => {
            setSelectedChar(c);
            engineRef.current?.setCharacterPreview(c);
          }}
          onNewGame={() => engineRef.current?.startNewGame(selectedChar)}
          onContinueGame={() => {
            if (savedGame) engineRef.current?.loadFromSave(savedGame);
          }}
          onUpdateSettings={updateSettings}
          onOpenSettings={() => setShowSettings(true)}
          onOpenGodot={() => setShowGodot(true)}
          onOpenDownload={() => setShowDownload(true)}
        />
      )}

      {hud && (phase === 'playing' || phase === 'paused') && (
        <GameHud
          hud={hud}
          settings={settings}
          onPause={() => engineRef.current?.pauseGame()}
          onSaveGame={handleSaveGame}
          onOpenMap={() => setShowMap(true)}
          onOpenInventory={() => setShowShop(true)}
          onToggleSound={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
          onAdvanceDialogue={() => engineRef.current?.advanceDialogue()}
          onInteract={() => engineRef.current?.triggerInteract()}
          onVehicleToggle={() => engineRef.current?.triggerVehicleToggle()}
          onJump={() => engineRef.current?.triggerJump()}
          onVirtualControl={(patch) => {
            if (engineRef.current) Object.assign(engineRef.current.virtualControls, patch);
          }}
        />
      )}

      {phase === 'paused' && !showSettings && !showMap && !showShop && !showDownload && (
        <PauseModal
          onResume={() => engineRef.current?.resumeGame()}
          onSave={() => {
            handleSaveGame();
            engineRef.current?.resumeGame();
          }}
          onOpenMap={() => setShowMap(true)}
          onOpenInventory={() => setShowShop(true)}
          onOpenSettings={() => setShowSettings(true)}
          onOpenDownload={() => setShowDownload(true)}
          onLobby={() => engineRef.current?.returnToLobby()}
        />
      )}

      {showMap && hud && (
        <MapMissionsModal
          hud={hud}
          onSelectMission={(id) => engineRef.current?.selectMission(id)}
          onFastTravel={(x, z, label) => engineRef.current?.fastTravel(x, z, label)}
          onClose={() => setShowMap(false)}
        />
      )}

      {showShop && hud && (
        <ShopInventoryModal
          hud={hud}
          onBuy={(id) => engineRef.current?.buyShopItem(id)}
          onConsume={(id) => engineRef.current?.consumeInventoryItem(id)}
          onChangeOutfit={(outfit) => engineRef.current?.setOutfit(outfit)}
          onClose={() => setShowShop(false)}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdate={updateSettings}
          onSetTime={handleSetTimeAndWeather}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showGodot && <GodotScriptsModal onClose={() => setShowGodot(false)} />}

      {showDownload && (
        <DownloadGameModal savedGame={savedGame} onClose={() => setShowDownload(false)} />
      )}
    </div>
  );
}
