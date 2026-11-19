import * as THREE from 'three';

export interface WorldTextures {
  groundDetail: THREE.CanvasTexture;
  highwayAsphalt: THREE.CanvasTexture;
  stuccoWall: THREE.CanvasTexture;
  templeStone: THREE.CanvasTexture;
  cityGlass: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  signVillupuram: THREE.CanvasTexture;
  signTeaShop: THREE.CanvasTexture;
  signBusStand: THREE.CanvasTexture;
  signRailway: THREE.CanvasTexture;
  signPondicherry: THREE.CanvasTexture;
  signChennai: THREE.CanvasTexture;
  signHospital: THREE.CanvasTexture;
}

function makeCanvasTex(
  canvas: HTMLCanvasElement,
  repX: number,
  repY: number,
  maxAniso: number
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repX, repY);
  tex.anisotropy = maxAniso;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function createSignboardTexture(
  tamilText: string,
  englishText: string,
  bgHex: string,
  borderHex: string,
  textHex: string,
  maxAniso: number
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 192;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, 512, 192);
  ctx.strokeStyle = borderHex;
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, 496, 176);

  ctx.fillStyle = textHex;
  ctx.textAlign = 'center';
  ctx.font = 'bold 38px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(tamilText, 256, 78);
  ctx.font = 'bold 34px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(englishText, 256, 142);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = maxAniso;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function createWorldTextures(maxAniso: number): WorldTextures {
  // Ground detail
  const gCan = document.createElement('canvas');
  gCan.width = 256;
  gCan.height = 256;
  const gCtx = gCan.getContext('2d')!;
  gCtx.fillStyle = '#e2e2e2';
  gCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 4500; i++) {
    const v = 195 + Math.floor(Math.random() * 55);
    gCtx.fillStyle = `rgb(${v},${v},${v})`;
    gCtx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  const groundDetail = makeCanvasTex(gCan, 48, 48, maxAniso);

  // Highway Asphalt
  const rCan = document.createElement('canvas');
  rCan.width = 256;
  rCan.height = 256;
  const rCtx = rCan.getContext('2d')!;
  rCtx.fillStyle = '#2b2f36';
  rCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2000; i++) {
    const v = 35 + Math.floor(Math.random() * 22);
    rCtx.fillStyle = `rgb(${v},${v + 1},${v + 3})`;
    rCtx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  rCtx.fillStyle = '#e2e8f0';
  rCtx.fillRect(10, 0, 6, 256);
  rCtx.fillRect(240, 0, 6, 256);
  rCtx.fillStyle = '#facc15';
  rCtx.fillRect(124, 16, 8, 92);
  rCtx.fillRect(124, 148, 8, 92);
  const highwayAsphalt = makeCanvasTex(rCan, 1, 16, maxAniso);

  // Stucco architectural wall
  const sCan = document.createElement('canvas');
  sCan.width = 256;
  sCan.height = 256;
  const sCtx = sCan.getContext('2d')!;
  sCtx.fillStyle = '#dedad2';
  sCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2200; i++) {
    const v = 200 + Math.floor(Math.random() * 35);
    sCtx.fillStyle = `rgba(${v},${v - 3},${v - 8},0.45)`;
    sCtx.fillRect(Math.random() * 256, Math.random() * 256, 3, 2);
  }
  const stuccoWall = makeCanvasTex(sCan, 2, 2, maxAniso);

  // Temple Gopuram carved sandstone tiers
  const tCan = document.createElement('canvas');
  tCan.width = 256;
  tCan.height = 256;
  const tCtx = tCan.getContext('2d')!;
  tCtx.fillStyle = '#c9844e';
  tCtx.fillRect(0, 0, 256, 256);
  const bandColors = ['#d97706', '#b45309', '#f59e0b', '#9a3412', '#e11d48', '#0284c7'];
  for (let y = 0; y < 256; y += 32) {
    tCtx.fillStyle = bandColors[(y / 32) % bandColors.length];
    tCtx.fillRect(0, y, 256, 10);
    tCtx.fillStyle = 'rgba(0,0,0,0.2)';
    for (let x = 8; x < 256; x += 24) {
      tCtx.fillRect(x, y + 12, 12, 16);
    }
  }
  const templeStone = makeCanvasTex(tCan, 2, 3, maxAniso);

  // Chennai Tower Curtain Glass
  const cCan = document.createElement('canvas');
  cCan.width = 256;
  cCan.height = 256;
  const cCtx = cCan.getContext('2d')!;
  cCtx.fillStyle = '#16324f';
  cCtx.fillRect(0, 0, 256, 256);
  for (let y = 6; y < 256; y += 32) {
    for (let x = 6; x < 256; x += 32) {
      cCtx.fillStyle = Math.random() > 0.35 ? '#38bdf8' : '#1e4e79';
      cCtx.fillRect(x, y, 22, 22);
    }
  }
  const cityGlass = makeCanvasTex(cCan, 3, 6, maxAniso);

  // Contact shadow
  const shCan = document.createElement('canvas');
  shCan.width = 128;
  shCan.height = 128;
  const shCtx = shCan.getContext('2d')!;
  const grad = shCtx.createRadialGradient(64, 64, 6, 64, 64, 60);
  grad.addColorStop(0, 'rgba(0,0,0,0.58)');
  grad.addColorStop(0.6, 'rgba(0,0,0,0.2)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  shCtx.fillStyle = grad;
  shCtx.fillRect(0, 0, 128, 128);
  const contactShadow = new THREE.CanvasTexture(shCan);
  contactShadow.colorSpace = THREE.SRGBColorSpace;
  contactShadow.needsUpdate = true;

  return {
    groundDetail,
    highwayAsphalt,
    stuccoWall,
    templeStone,
    cityGlass,
    contactShadow,
    signVillupuram: createSignboardTexture('விழுப்புரம்', 'VILLUPURAM', '#065f46', '#f8fafc', '#ffffff', maxAniso),
    signTeaShop: createSignboardTexture('நண்பர்கள் டீ கடை', 'FRIENDS TEA KADA', '#92400e', '#fef08a', '#fef9c3', maxAniso),
    signBusStand: createSignboardTexture('பேருந்து நிலையம்', 'BUS STAND', '#1e3a8a', '#93c5fd', '#ffffff', maxAniso),
    signRailway: createSignboardTexture('விழுப்புரம் சந்திப்பு', 'VILLUPURAM JN', '#b45309', '#fef08a', '#ffffff', maxAniso),
    signPondicherry: createSignboardTexture('புதுச்சேரி', 'PONDICHERRY', '#0369a1', '#e0f2fe', '#ffffff', maxAniso),
    signChennai: createSignboardTexture('சென்னை', 'CHENNAI CENTRAL', '#1e293b', '#f59e0b', '#f8fafc', maxAniso),
    signHospital: createSignboardTexture('அரசு மருத்துவமனை', 'GOVT HOSPITAL', '#991b1b', '#fecaca', '#ffffff', maxAniso),
  };
}
