import { Code2, Play, RotateCcw, Settings, Volume2, VolumeX } from 'lucide-react';
import {
  CharacterConfig,
  FRIENDS_CAST,
  GameSettings,
  SaveGameData,
  WeatherMode,
} from '../game/types';

interface LobbyScreenProps {
  selectedChar: CharacterConfig;
  settings: GameSettings;
  savedGame: SaveGameData | null;
  onSelectChar: (char: CharacterConfig) => void;
  onNewGame: () => void;
  onContinueGame: () => void;
  onUpdateSettings: (patch: Partial<GameSettings>) => void;
  onOpenSettings: () => void;
  onOpenGodot: () => void;
}

export function LobbyScreen({
  selectedChar,
  settings,
  savedGame,
  onSelectChar,
  onNewGame,
  onContinueGame,
  onUpdateSettings,
  onOpenSettings,
  onOpenGodot,
}: LobbyScreenProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-5 sm:p-8">
      {/* Top Row */}
      <div className="flex items-start justify-between gap-4">
        <div className="pointer-events-auto flex items-center gap-3.5 rounded-xl border border-slate-700/75 bg-[#0b1118]/92 px-4 py-3 shadow-xl">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <rect x="2" y="2" width="36" height="36" rx="8" fill="#111827" stroke="#f59e0b" strokeWidth="2" />
            <path d="M12 11V29M12 20L24 11M17 17L27 29" stroke="#f8fafc" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M27 11H31V15" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-wide text-white leading-none">
              KIGO – THE TAMIL NADU OPEN WORLD
            </h1>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-300">
              <span className="text-amber-400 font-semibold">தமிழ்நாடு திறந்த உலகம்</span>
              <span aria-hidden="true">·</span>
              <span>Villupuram · Pondicherry · Chennai</span>
            </div>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
            aria-label="Toggle Sound"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700/80 bg-[#0b1118]/92 text-slate-200 hover:border-amber-400 cursor-pointer"
          >
            {settings.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="flex h-10 items-center gap-1.5 rounded-lg border border-slate-700/80 bg-[#0b1118]/92 px-3 text-xs font-semibold text-slate-200 hover:border-amber-400 cursor-pointer whitespace-nowrap"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>

          <button
            type="button"
            onClick={onOpenGodot}
            className="flex h-10 items-center gap-1.5 rounded-lg border border-sky-700/70 bg-[#0b1118]/92 px-3 text-xs font-semibold text-sky-300 hover:border-sky-400 cursor-pointer whitespace-nowrap"
          >
            <Code2 className="h-4 w-4" />
            <span>Godot 4 Scripts (Stage 1–9)</span>
          </button>
        </div>
      </div>

      {/* Left Command Panel */}
      <div className="my-auto flex flex-col gap-3.5 max-w-sm">
        {/* Character Selection (Villupuram Cast) */}
        <div className="pointer-events-auto rounded-xl border border-slate-700/75 bg-[#0b1118]/92 p-4 shadow-xl">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-slate-400">Select Character</span>
            <span className="font-semibold text-amber-400">{selectedChar.role}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FRIENDS_CAST.map((c) => {
              const active = c.id === selectedChar.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onSelectChar(c)}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                    active
                      ? 'border-amber-400 bg-slate-800 text-white'
                      : 'border-slate-700/70 bg-slate-900/80 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: c.accentHex }} />
                  <span>{c.name}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2.5 text-xs text-slate-300 leading-relaxed">{selectedChar.bio}</p>
        </div>

        {/* Weather & Launch */}
        <div className="pointer-events-auto rounded-xl border border-slate-700/75 bg-[#0b1118]/92 p-4 shadow-xl flex flex-col gap-3">
          <div>
            <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tamil Nadu Weather
            </div>
            <div className="grid grid-cols-4 gap-1 rounded-lg bg-slate-900 p-1">
              {(['sunny', 'dusk', 'rain', 'thunderstorm'] as WeatherMode[]).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => onUpdateSettings({ weather: w })}
                  className={`rounded py-1.5 text-[11px] font-semibold capitalize cursor-pointer ${
                    settings.weather === w ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {w === 'thunderstorm' ? 'Storm' : w}
                </button>
              ))}
            </div>
          </div>

          {savedGame && (
            <button
              type="button"
              onClick={onContinueGame}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-5 py-3 font-display text-sm font-bold text-slate-950 hover:bg-emerald-400 transition-colors cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" />
              <span>CONTINUE GAME (Saved {savedGame.savedAt})</span>
            </button>
          )}

          <button
            type="button"
            onClick={onNewGame}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 py-3.5 font-display text-base font-bold tracking-wide text-slate-950 hover:bg-amber-400 transition-colors shadow-lg cursor-pointer"
          >
            <Play className="h-5 w-5 fill-current" />
            <span>NEW GAME — START IN VILLUPURAM</span>
          </button>
        </div>
      </div>

      {/* Bottom Control Hint */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="rounded-lg border border-slate-700/70 bg-[#0b1118]/88 px-3.5 py-2 text-xs text-slate-300">
          WASD Move · Shift Sprint · Space Jump · C Crouch · F Talk / Tea Kada · E Drive Auto/Bus/Bike · H Horn · M World Map · Esc Pause
        </div>
      </div>
    </div>
  );
}
