import { useEffect, useRef } from 'react';
import { OpenWorldHudState } from '../game/types';

export function Minimap({ hud }: { hud: OpenWorldHudState }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 152;
    const worldMin = -235;
    const worldSpan = 470;
    const toPx = (wx: number, wz: number) => ({
      x: ((wx - worldMin) / worldSpan) * size,
      y: ((wz - worldMin) / worldSpan) * size,
    });

    // Landmass & Bay of Bengal Coastline
    ctx.fillStyle = '#254229';
    ctx.fillRect(0, 0, size, size);

    // Bay of Bengal Ocean (East Coast x > 180)
    const coastX = toPx(180, 0).x;
    ctx.fillStyle = '#0c4a6e';
    ctx.fillRect(coastX, 0, size - coastX, size);

    // Highways
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 4;
    ctx.beginPath();
    const nEnd = toPx(0, -175);
    const sEnd = toPx(0, 112);
    ctx.moveTo(nEnd.x, nEnd.y);
    ctx.lineTo(sEnd.x, sEnd.y);
    const wEnd = toPx(-135, 72);
    const eEnd = toPx(168, 72);
    ctx.moveTo(wEnd.x, wEnd.y);
    ctx.lineTo(eEnd.x, eEnd.y);
    ctx.stroke();

    // City / Town Blocks
    const drawZone = (wx: number, wz: number, r: number, color: string, label: string) => {
      const p = toPx(wx, wz);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(248, 250, 252, 0.72)';
      ctx.font = '600 7px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, p.x, p.y - r - 2);
    };

    drawZone(0, 68, 12, 'rgba(217, 119, 6, 0.25)', 'Villupuram');
    drawZone(0, -145, 14, 'rgba(56, 189, 248, 0.22)', 'Chennai');
    drawZone(155, 85, 10, 'rgba(250, 204, 21, 0.24)', 'Pondy');
    drawZone(-125, 45, 12, 'rgba(34, 197, 94, 0.22)', 'Farms');

    // Blips
    for (const b of hud.minimapBlips) {
      const p = toPx(b.x, b.z);
      ctx.fillStyle = b.color;
      if (b.kind === 'mission') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        ctx.fillRect(p.x - 1.8, p.y - 1.8, 3.6, 3.6);
      }
    }

    // Player Marker
    const pp = toPx(hud.playerX, hud.playerZ);
    ctx.save();
    ctx.translate(pp.x, pp.y);
    ctx.rotate(-hud.playerYaw);
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4.5, 4);
    ctx.lineTo(-4.5, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }, [hud]);

  return (
    <div className="rounded-lg border border-slate-700/80 bg-[#0b1118]/92 p-1.5 shadow-lg">
      <canvas ref={canvasRef} width={152} height={152} className="block rounded" />
    </div>
  );
}
