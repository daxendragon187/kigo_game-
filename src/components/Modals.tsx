import { Check, Coffee, Compass, Copy, MapPin, Play, Save, Shirt, X } from 'lucide-react';
import { useState } from 'react';
import { GODOT_FOLDER_STRUCTURE, GODOT_STAGE_DOCS } from '../game/godotScripts';
import {
  GameSettings,
  MISSIONS,
  OpenWorldHudState,
  OutfitId,
  SHOP_ITEMS,
  WeatherMode,
} from '../game/types';

export function PauseModal({
  onResume,
  onSave,
  onOpenMap,
  onOpenInventory,
  onOpenSettings,
  onLobby,
}: {
  onResume: () => void;
  onSave: () => void;
  onOpenMap: () => void;
  onOpenInventory: () => void;
  onOpenSettings: () => void;
  onLobby: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-700 bg-[#0f1620] p-6 shadow-2xl">
        <h2 className="font-display text-2xl font-bold text-white text-center">GAME PAUSED</h2>
        <p className="mt-1 text-center text-xs text-slate-400">Kigo – The Tamil Nadu Open World</p>

        <div className="mt-5 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="flex items-center justify-center gap-2 rounded-lg bg-amber-500 py-3 font-display text-sm font-bold text-slate-950 hover:bg-amber-400 cursor-pointer"
          >
            <Play className="h-4 w-4 fill-current" /> RESUME EXPLORATION
          </button>
          <button
            type="button"
            onClick={onSave}
            className="flex items-center justify-center gap-2 rounded-lg border border-emerald-700/70 bg-emerald-950/60 py-2.5 text-sm font-semibold text-emerald-200 hover:bg-emerald-900/70 cursor-pointer"
          >
            <Save className="h-4 w-4" /> Save Progress
          </button>
          <button
            type="button"
            onClick={onOpenMap}
            className="rounded-lg border border-slate-600 bg-slate-800 py-2.5 text-sm font-semibold text-slate-100 hover:border-amber-400 cursor-pointer"
          >
            World Map & Story Missions
          </button>
          <button
            type="button"
            onClick={onOpenInventory}
            className="rounded-lg border border-slate-600 bg-slate-800 py-2.5 text-sm font-semibold text-slate-100 hover:border-amber-400 cursor-pointer"
          >
            Food, Inventory & Tamil Outfits
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="rounded-lg border border-slate-600 bg-slate-800 py-2.5 text-sm font-semibold text-slate-100 hover:border-amber-400 cursor-pointer"
          >
            Settings
          </button>
          <button
            type="button"
            onClick={onLobby}
            className="rounded-lg border border-red-800/70 bg-red-950/60 py-2.5 text-sm font-semibold text-red-200 hover:bg-red-900/70 cursor-pointer"
          >
            Return to Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}

export function MapMissionsModal({
  hud,
  onSelectMission,
  onFastTravel,
  onClose,
}: {
  hud: OpenWorldHudState;
  onSelectMission: (missionId: string) => void;
  onFastTravel: (x: number, z: number, label: string) => void;
  onClose: () => void;
}) {
  const fastTravelSpots = [
    { label: 'Villupuram Town (Tea Kada)', x: 8, z: 62 },
    { label: 'Villupuram Railway Station', x: -24, z: 102 },
    { label: 'Green Paddy Fields & Farm', x: -120, z: 68 },
    { label: 'Pondicherry Promenade Beach', x: 158, z: 88 },
    { label: 'Chennai Central Plaza', x: 0, z: -140 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col rounded-xl border border-slate-700 bg-[#0f1620] shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Compass className="h-5 w-5 text-amber-400" />
            <h2 className="font-display text-lg font-bold text-white">
              Tamil Nadu Map & Story Missions
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 grid gap-5 md:grid-cols-2">
          {/* Fast Travel Locations */}
          <div>
            <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              Fast Travel Across Tamil Nadu
            </h3>
            <div className="space-y-2">
              {fastTravelSpots.map((spot) => (
                <button
                  key={spot.label}
                  type="button"
                  onClick={() => {
                    onFastTravel(spot.x, spot.z, spot.label);
                    onClose();
                  }}
                  className="flex w-full items-center justify-between rounded-lg border border-slate-800 bg-slate-900/80 px-3.5 py-2.5 text-left text-xs font-semibold text-slate-200 hover:border-amber-400 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-amber-400" />
                    {spot.label}
                  </span>
                  <span className="text-[11px] text-amber-400">Travel</span>
                </button>
              ))}
            </div>
          </div>

          {/* Story & Side Missions */}
          <div>
            <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              Main Story & Side Quests ({hud.completedMissions.length}/{MISSIONS.length})
            </h3>
            <div className="space-y-2">
              {MISSIONS.map((m) => {
                const done = hud.completedMissions.includes(m.id);
                const active = hud.activeMissionId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onSelectMission(m.id);
                      onClose();
                    }}
                    className={`w-full rounded-lg border p-3 text-left transition-colors cursor-pointer ${
                      active
                        ? 'border-amber-400 bg-amber-950/35'
                        : 'border-slate-800 bg-slate-900/80 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className={done ? 'text-emerald-400' : 'text-amber-400'}>
                        {m.chapter > 0 ? `Chapter ${m.chapter}` : m.category} · {m.title}
                      </span>
                      <span className="font-mono-num text-emerald-300">
                        {done ? 'Completed' : `+₹${m.rewardMoney}`}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-300">{m.subtitle}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ShopInventoryModal({
  hud,
  onBuy,
  onConsume,
  onChangeOutfit,
  onClose,
}: {
  hud: OpenWorldHudState;
  onBuy: (itemId: string) => void;
  onConsume: (itemId: string) => void;
  onChangeOutfit: (outfit: OutfitId) => void;
  onClose: () => void;
}) {
  const outfits: { id: OutfitId; label: string }[] = [
    { id: 'modern_casual', label: 'Modern Casual' },
    { id: 'veshti_shirt', label: 'White Veshti & Shirt' },
    { id: 'festival_silk', label: 'Festival Pattu Silk' },
    { id: 'saree', label: 'Traditional Saree' },
    { id: 'salwar', label: 'Salwar Suit' },
    { id: 'college_uniform', label: 'College Uniform' },
    { id: 'police_khakhi', label: 'TN Police Khaki' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col rounded-xl border border-slate-700 bg-[#0f1620] shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div className="flex items-center gap-3">
            <Coffee className="h-5 w-5 text-amber-400" />
            <div>
              <h2 className="font-display text-lg font-bold text-white">
                Tamil Nadu Tea Kada, Bag & Cultural Wardrobe
              </h2>
              <div className="text-xs text-emerald-400 font-mono-num">Wallet: ₹{hud.money}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 grid gap-5 md:grid-cols-2">
          {/* Food & Tea Kada Shop */}
          <div>
            <h3 className="mb-2.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              Tea Shop & Food Bag
            </h3>
            <div className="space-y-2">
              {SHOP_ITEMS.map((item) => {
                const owned = hud.inventory[item.id] ?? 0;
                return (
                  <div
                    key={item.id}
                    className="rounded-lg border border-slate-800 bg-slate-900/80 p-3 flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs font-bold text-white">{item.name}</div>
                        <div className="text-[11px] text-amber-300">{item.tamilName}</div>
                      </div>
                      <span className="font-mono-num text-xs font-bold text-emerald-400">₹{item.price}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{item.description}</p>
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="font-mono-num text-[11px] text-slate-300">In Bag: {owned}</span>
                      <div className="flex gap-1.5">
                        {owned > 0 && (
                          <button
                            type="button"
                            onClick={() => onConsume(item.id)}
                            className="rounded bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-500 cursor-pointer"
                          >
                            Eat (+{item.healHp} HP)
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onBuy(item.id)}
                          className="rounded bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-slate-950 hover:bg-amber-400 cursor-pointer"
                        >
                          Buy ₹{item.price}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cultural Wardrobe */}
          <div>
            <h3 className="mb-2.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Shirt className="h-3.5 w-3.5 text-sky-400" />
              <span>Tamil Culture & Costumes</span>
            </h3>
            <div className="space-y-2">
              {outfits.map((o) => {
                const active = hud.outfit === o.id;
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => onChangeOutfit(o.id)}
                    className={`flex w-full items-center justify-between rounded-lg border px-3.5 py-2.5 text-xs font-semibold cursor-pointer ${
                      active
                        ? 'border-amber-400 bg-amber-950/40 text-amber-200'
                        : 'border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <span>{o.label}</span>
                    {active && <span className="text-[11px] text-amber-400">Equipped</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SettingsModal({
  settings,
  onUpdate,
  onSetTime,
  onClose,
}: {
  settings: GameSettings;
  onUpdate: (patch: Partial<GameSettings>) => void;
  onSetTime: (hour: number, weather: WeatherMode) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-[#0f1620] p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-white">Settings & Weather</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-4 text-sm">
          <div>
            <div className="mb-1.5 text-xs text-slate-300">Time & Weather Preset</div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => onSetTime(9, 'sunny')}
                className="rounded border border-slate-700 bg-slate-900 py-2 text-xs font-semibold text-amber-300 hover:border-amber-400 cursor-pointer"
              >
                Villupuram Morning
              </button>
              <button
                type="button"
                onClick={() => onSetTime(17.8, 'dusk')}
                className="rounded border border-slate-700 bg-slate-900 py-2 text-xs font-semibold text-orange-300 hover:border-amber-400 cursor-pointer"
              >
                Pondicherry Dusk
              </button>
              <button
                type="button"
                onClick={() => onSetTime(21.5, 'sunny')}
                className="rounded border border-slate-700 bg-slate-900 py-2 text-xs font-semibold text-sky-300 hover:border-sky-400 cursor-pointer"
              >
                Chennai Night
              </button>
              <button
                type="button"
                onClick={() => onSetTime(15, 'thunderstorm')}
                className="rounded border border-slate-700 bg-slate-900 py-2 text-xs font-semibold text-slate-200 hover:border-sky-400 cursor-pointer"
              >
                Monsoon Thunderstorm
              </button>
            </div>
          </div>

          <div>
            <div className="mb-1 flex justify-between text-xs text-slate-300">
              <span>Mouse Sensitivity</span>
              <span className="font-mono-num">{settings.mouseSensitivity.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min={0.4}
              max={2.4}
              step={0.1}
              value={settings.mouseSensitivity}
              onChange={(e) => onUpdate({ mouseSensitivity: parseFloat(e.target.value) })}
              className="w-full accent-amber-500"
            />
          </div>

          <div>
            <div className="mb-1 flex justify-between text-xs text-slate-300">
              <span>Master Audio Volume</span>
              <span className="font-mono-num">{Math.round(settings.masterVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.masterVolume}
              onChange={(e) => onUpdate({ masterVolume: parseFloat(e.target.value) })}
              className="w-full accent-amber-500"
            />
          </div>

          <label className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/70 px-3.5 py-2.5 cursor-pointer">
            <span className="text-xs font-medium text-slate-200">Dynamic Day / Night Cycle</span>
            <input
              type="checkbox"
              checked={settings.autoTimeCycle}
              onChange={(e) => onUpdate({ autoTimeCycle: e.target.checked })}
              className="h-4 w-4 accent-amber-500"
            />
          </label>

          <label className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/70 px-3.5 py-2.5 cursor-pointer">
            <span className="text-xs font-medium text-slate-200">On-Screen Touch / Click Pad</span>
            <input
              type="checkbox"
              checked={settings.showTouchControls}
              onChange={(e) => onUpdate({ showTouchControls: e.target.checked })}
              className="h-4 w-4 accent-amber-500"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-amber-500 py-2.5 font-display text-sm font-bold text-slate-950 hover:bg-amber-400 cursor-pointer"
        >
          Done
        </button>
      </div>
    </div>
  );
}

export function GodotScriptsModal({ onClose }: { onClose: () => void }) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const current = GODOT_STAGE_DOCS[selectedIdx] ?? GODOT_STAGE_DOCS[0];

  const handleCopy = () => {
    navigator.clipboard?.writeText(current.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl border border-slate-700 bg-[#0f1620] shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-white">
              KIGO – Godot 4 GDScript Architecture (Stages 1–9)
            </h2>
            <p className="text-xs text-slate-400">
              Complete modular GDScript files, folder tree, Input Map & GLB character import guide
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 border-b border-slate-800 bg-slate-950/60 px-5 py-2.5">
          {GODOT_STAGE_DOCS.map((doc, idx) => (
            <button
              key={doc.filePath}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                selectedIdx === idx ? 'bg-sky-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              {doc.title}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Scene Hierarchy
              </div>
              <pre className="font-mono-num text-xs text-amber-300 whitespace-pre-wrap">{current.sceneHierarchy}</pre>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Godot 4 Setup & GLB Import
              </div>
              <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">{current.setupSteps}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-3.5 py-2">
            <span className="font-mono-num text-xs text-sky-300">{current.filePath}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-700 cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy GDScript'}</span>
            </button>
          </div>

          <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono-num text-xs leading-relaxed text-slate-200">
            {current.code}
          </pre>

          <div className="rounded-lg border border-slate-800 bg-slate-950/80 p-3">
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Complete Godot 4 Folder Structure
            </div>
            <pre className="font-mono-num text-xs text-slate-300 whitespace-pre-wrap">{GODOT_FOLDER_STRUCTURE}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
