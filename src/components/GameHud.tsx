import { Backpack, CloudRain, Compass, Map as MapIcon, Pause, Save, Sun, Volume2, VolumeX } from 'lucide-react';
import { GameSettings, MISSIONS, OpenWorldHudState } from '../game/types';
import { Minimap } from './Minimap';

interface GameHudProps {
  hud: OpenWorldHudState;
  settings: GameSettings;
  onPause: () => void;
  onSaveGame: () => void;
  onOpenMap: () => void;
  onOpenInventory: () => void;
  onToggleSound: () => void;
  onAdvanceDialogue: () => void;
  onInteract: () => void;
  onVehicleToggle: () => void;
  onJump: () => void;
  onVirtualControl: (patch: { moveX?: number; moveY?: number; sprinting?: boolean }) => void;
}

export function GameHud({
  hud,
  settings,
  onPause,
  onSaveGame,
  onOpenMap,
  onOpenInventory,
  onToggleSound,
  onAdvanceDialogue,
  onInteract,
  onVehicleToggle,
  onJump,
  onVirtualControl,
}: GameHudProps) {
  const activeMission = MISSIONS.find((m) => m.id === hud.activeMissionId);
  const currentDialogue =
    hud.activeDialogue && hud.activeDialogue[hud.dialogueIndex]
      ? hud.activeDialogue[hud.dialogueIndex]
      : null;

  const distToMission = activeMission
    ? Math.round(Math.hypot(activeMission.targetX - hud.playerX, activeMission.targetZ - hud.playerZ))
    : null;

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-3 sm:p-4">
      {/* TOP BAR */}
      <div className="flex items-start justify-between gap-4">
        {/* Top-Left: Minimap + Region + Active Mission */}
        <div className="flex flex-col gap-2 max-w-[270px]">
          <div className="flex items-start gap-2.5">
            <Minimap hud={hud} />
            <div className="rounded-lg border border-slate-700/80 bg-[#0b1118]/92 px-3 py-2 shadow-lg">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                <Compass className="h-3.5 w-3.5" />
                <span>Region</span>
              </div>
              <div className="font-display text-sm font-bold text-white leading-tight mt-0.5">
                {hud.regionLabel}
              </div>
              <div className="mt-1.5 text-[11px] text-slate-400">
                {hud.isSwimming ? 'Swimming · Bay of Bengal' : hud.pointerLocked ? 'Mouse Aim Active' : 'Click Screen to Look'}
              </div>
            </div>
          </div>

          {activeMission && (
            <div className="rounded-lg border border-amber-500/45 bg-[#0b1118]/92 px-3 py-2 shadow-lg">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-amber-400">
                <span>
                  {activeMission.chapter > 0 ? `Chapter ${activeMission.chapter}` : activeMission.category} · {activeMission.title}
                </span>
                {distToMission !== null && (
                  <span className="font-mono-num text-slate-200">{distToMission}m</span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-slate-200 leading-snug">{activeMission.subtitle}</p>
            </div>
          )}
        </div>

        {/* Top-Center: Toast Notifications */}
        <div className="flex flex-col items-center gap-2">
          {hud.toastMessage && (
            <div className="rounded-lg border border-amber-400/60 bg-[#0b1118]/95 px-4 py-2 text-xs font-semibold text-amber-200 shadow-xl">
              {hud.toastMessage}
            </div>
          )}
        </div>

        {/* Top-Right: Time, Weather, Wallet, Health, Stamina, Utility Buttons */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-3 rounded-lg border border-slate-700/80 bg-[#0b1118]/92 px-3.5 py-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                {hud.weather === 'rain' || hud.weather === 'thunderstorm' ? (
                  <CloudRain className="h-4 w-4 text-sky-400" />
                ) : (
                  <Sun className="h-4 w-4 text-amber-400" />
                )}
                <span className="font-mono-num">{hud.timeLabel}</span>
              </div>
              <div className="h-5 w-px bg-slate-700" />
              <div className="font-display font-mono-num text-base font-bold text-emerald-400">
                ₹{hud.money}
              </div>
            </div>

            <div className="pointer-events-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={onOpenMap}
                title="Map & Missions [M]"
                className="flex h-10 items-center gap-1.5 rounded-lg border border-slate-700 bg-[#0b1118]/92 px-3 text-xs font-semibold text-slate-200 hover:border-amber-400 cursor-pointer"
              >
                <MapIcon className="h-4 w-4 text-amber-400" />
                <span className="hidden sm:inline">Map [M]</span>
              </button>
              <button
                type="button"
                onClick={onOpenInventory}
                title="Food & Wardrobe"
                className="flex h-10 items-center gap-1.5 rounded-lg border border-slate-700 bg-[#0b1118]/92 px-3 text-xs font-semibold text-slate-200 hover:border-amber-400 cursor-pointer"
              >
                <Backpack className="h-4 w-4 text-emerald-400" />
                <span className="hidden sm:inline">Bag</span>
              </button>
              <button
                type="button"
                onClick={onSaveGame}
                title="Quick Save"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-[#0b1118]/92 text-slate-200 hover:border-amber-400 cursor-pointer"
              >
                <Save className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onToggleSound}
                aria-label="Toggle Sound"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-[#0b1118]/92 text-slate-200 hover:border-amber-400 cursor-pointer"
              >
                {settings.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={onPause}
                aria-label="Pause"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-[#0b1118]/92 text-slate-200 hover:border-amber-400 cursor-pointer"
              >
                <Pause className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Health & Stamina Bars */}
          <div className="w-56 rounded-lg border border-slate-700/80 bg-[#0b1118]/92 p-2.5">
            <div className="mb-1 flex justify-between text-[11px] font-semibold">
              <span className="text-emerald-400">Health</span>
              <span className="font-mono-num text-white">{hud.hp}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded bg-slate-800">
              <div className="h-full bg-emerald-500 transition-all duration-150" style={{ width: `${hud.hp}%` }} />
            </div>
            <div className="mt-2 mb-1 flex justify-between text-[11px] font-semibold">
              <span className="text-sky-400">Stamina</span>
              <span className="font-mono-num text-white">{hud.stamina}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded bg-slate-800">
              <div className="h-full bg-sky-400 transition-all duration-150" style={{ width: `${hud.stamina}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM BAR: Dialogue Subtitles / Vehicle Speedometer / Prompts / Touch Pad */}
      <div className="flex items-end justify-between gap-4">
        <div className="pointer-events-auto">
          {settings.showTouchControls && (
            <div className="grid grid-cols-3 gap-1 rounded-lg border border-slate-700/80 bg-[#0b1118]/90 p-1.5">
              <div />
              <button
                type="button"
                onPointerDown={() => onVirtualControl({ moveY: 1 })}
                onPointerUp={() => onVirtualControl({ moveY: 0 })}
                onPointerLeave={() => onVirtualControl({ moveY: 0 })}
                className="flex h-10 w-10 items-center justify-center rounded bg-slate-800 text-xs font-bold text-white"
              >
                W
              </button>
              <button
                type="button"
                onPointerDown={() => onVirtualControl({ sprinting: true, moveY: 1 })}
                onPointerUp={() => onVirtualControl({ sprinting: false, moveY: 0 })}
                className="flex h-10 w-10 items-center justify-center rounded bg-slate-800 text-[10px] font-bold text-amber-300"
              >
                RUN
              </button>
              <button
                type="button"
                onPointerDown={() => onVirtualControl({ moveX: -1 })}
                onPointerUp={() => onVirtualControl({ moveX: 0 })}
                onPointerLeave={() => onVirtualControl({ moveX: 0 })}
                className="flex h-10 w-10 items-center justify-center rounded bg-slate-800 text-xs font-bold text-white"
              >
                A
              </button>
              <button
                type="button"
                onPointerDown={() => onVirtualControl({ moveY: -1 })}
                onPointerUp={() => onVirtualControl({ moveY: 0 })}
                onPointerLeave={() => onVirtualControl({ moveY: 0 })}
                className="flex h-10 w-10 items-center justify-center rounded bg-slate-800 text-xs font-bold text-white"
              >
                S
              </button>
              <button
                type="button"
                onPointerDown={() => onVirtualControl({ moveX: 1 })}
                onPointerUp={() => onVirtualControl({ moveX: 0 })}
                onPointerLeave={() => onVirtualControl({ moveX: 0 })}
                className="flex h-10 w-10 items-center justify-center rounded bg-slate-800 text-xs font-bold text-white"
              >
                D
              </button>
            </div>
          )}
        </div>

        {/* Center-Bottom: Dialogue Box, Interact Prompt, or Speedometer */}
        <div className="mx-auto flex flex-col items-center gap-2.5 max-w-2xl w-full">
          {hud.interactPrompt && !currentDialogue && (
            <button
              type="button"
              onClick={hud.inVehicle || hud.interactPrompt.includes('Drive') ? onVehicleToggle : onInteract}
              className="pointer-events-auto rounded-lg border border-amber-400/80 bg-[#0b1118]/94 px-4 py-2 text-xs font-bold tracking-wide text-amber-300 shadow-lg cursor-pointer"
            >
              {hud.interactPrompt}
            </button>
          )}

          {currentDialogue && (
            <div className="pointer-events-auto w-full rounded-xl border border-amber-500/60 bg-[#0b1118]/95 p-4 shadow-2xl">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="font-display text-sm font-bold"
                  style={{ color: currentDialogue.accentHex ?? '#f59e0b' }}
                >
                  {currentDialogue.speaker}
                </span>
                <button
                  type="button"
                  onClick={onAdvanceDialogue}
                  className="rounded bg-amber-500 px-3 py-1 text-xs font-bold text-slate-950 hover:bg-amber-400 cursor-pointer"
                >
                  Continue [Space]
                </button>
              </div>
              <p className="mt-1.5 text-sm font-medium text-amber-100 leading-relaxed">
                {currentDialogue.tamil}
              </p>
              <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                “{currentDialogue.english}”
              </p>
            </div>
          )}

          {hud.inVehicle && (
            <div className="pointer-events-auto flex items-center gap-5 rounded-lg border border-amber-500/50 bg-[#0b1118]/92 px-5 py-2.5">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {hud.inVehicle}
                </div>
                <div className="font-display font-mono-num text-2xl font-bold text-amber-400">
                  {hud.vehicleSpeedKmh} <span className="text-xs text-slate-300">KM/H</span>
                </div>
              </div>
              <div className="h-8 w-px bg-slate-700" />
              <button
                type="button"
                onClick={onVehicleToggle}
                className="rounded bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-500 hover:text-slate-950 cursor-pointer"
              >
                Exit [E]
              </button>
            </div>
          )}
        </div>

        <div className="pointer-events-auto">
          {settings.showTouchControls && (
            <div className="flex gap-1.5 rounded-lg border border-slate-700/80 bg-[#0b1118]/90 p-1.5">
              <button
                type="button"
                onClick={onJump}
                className="h-11 px-3 rounded bg-slate-800 text-xs font-bold text-white"
              >
                JUMP
              </button>
              <button
                type="button"
                onClick={onInteract}
                className="h-11 px-3 rounded bg-amber-500 text-xs font-bold text-slate-950"
              >
                USE [F]
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
