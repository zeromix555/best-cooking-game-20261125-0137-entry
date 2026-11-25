// render.js — everything the player sees, drawn on one 2D canvas:
// the kitchen floor, the order board, the stations, the chef and the HUD.
// All art is drawn in code (shapes and text) — no image files are shipped.
import {
  VIEW_W, VIEW_H, BOARD_H, HUD_H, STATIONS, BIN_LAYOUT, INGREDIENTS,
  INGREDIENT_KEYS, COLORS, CHEF_RADIUS, SHIFT_SECONDS,
} from './config.js';
import { REQUIRED_STATE } from './config.js';

// --- ingredient icons -------------------------------------------------------
export function drawIngredientIcon(ctx, key, state, x, y, s) {
  const ing = INGREDIENTS[key];
  ctx.save();
  ctx.translate(x, y);
  const u = s / 40; // unit scale, icon drawn in a 40x40 box
  ctx.lineWidth = 2 * u;
  if (key === 'bun') {
    ctx.fillStyle = ing.color;
    ctx.strokeStyle = ing.dark;
    roundRect(ctx, -16 * u, -10 * u, 32 * u, 14 * u, 7 * u);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff2cf';
    for (const sx of [-9, 0, 9]) {
      ctx.beginPath(); ctx.arc(sx * u, -3 * u, 1.6 * u, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = ing.dark;
    roundRect(ctx, -17 * u, 4 * u, 34 * u, 5 * u, 2.5 * u);
    ctx.fill();
  } else if (key === 'patty') {
    ctx.fillStyle = state === 'grilled' ? '#6b3a1f' : ing.color;
    ctx.strokeStyle = ing.dark;
    roundRect(ctx, -17 * u, -8 * u, 34 * u, 16 * u, 8 * u);
    ctx.fill(); ctx.stroke();
    if (state === 'grilled') {
      ctx.strokeStyle = '#3d2110';
      ctx.beginPath();
      ctx.moveTo(-10 * u, -3 * u); ctx.lineTo(10 * u, -3 * u);
      ctx.moveTo(-12 * u, 3 * u); ctx.lineTo(12 * u, 3 * u);
      ctx.stroke();
    }
  } else if (key === 'lettuce') {
    ctx.fillStyle = ing.color;
    ctx.strokeStyle = ing.dark;
    ctx.beginPath();
    ctx.moveTo(0, -14 * u);
    ctx.quadraticCurveTo(16 * u, -8 * u, 12 * u, 6 * u);
    ctx.quadraticCurveTo(6 * u, 14 * u, 0, 10 * u);
    ctx.quadraticCurveTo(-6 * u, 14 * u, -12 * u, 6 * u);
    ctx.quadraticCurveTo(-16 * u, -8 * u, 0, -14 * u);
    ctx.fill(); ctx.stroke();
    ctx.strokeStyle = ing.dark;
    ctx.beginPath(); ctx.moveTo(0, -10 * u); ctx.lineTo(0, 8 * u); ctx.stroke();
  } else if (key === 'tomato') {
    ctx.fillStyle = ing.color;
    ctx.strokeStyle = ing.dark;
    ctx.beginPath(); ctx.arc(0, 0, 13 * u, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath(); ctx.arc(-4 * u, -4 * u, 3.5 * u, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4e8f2a';
    ctx.beginPath(); ctx.arc(0, -12 * u, 3 * u, 0, Math.PI * 2); ctx.fill();
  } else if (key === 'cheese') {
    ctx.fillStyle = ing.color;
    ctx.strokeStyle = ing.dark;
    ctx.save(); ctx.rotate(-0.12);
    roundRect(ctx, -15 * u, -11 * u, 30 * u, 22 * u, 3 * u);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = ing.dark;
    for (const [hx, hy] of [[-7, -4], [6, 2], [-1, 6]]) {
      ctx.beginPath(); ctx.arc(hx * u, hy * u, 2.2 * u, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  } else if (key === 'onion') {
    ctx.strokeStyle = ing.dark;
    ctx.lineWidth = 2.5 * u;
    for (const r of [13, 9, 5]) {
      ctx.beginPath(); ctx.arc(0, 0, r * u, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = '#e9d3ef';
    ctx.beginPath(); ctx.arc(0, 0, 3 * u, 0, Math.PI * 2); ctx.fill();
  }
  if (state === 'chopped') {
    // Chopped veg shows as neat shreds: three short strokes over the icon.
    ctx.strokeStyle = '#2b1d16';
    ctx.lineWidth = 2 * u;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.moveTo((i * 10 - 4) * u, 12 * u); ctx.lineTo((i * 10 + 4) * u, 12 * u); ctx.stroke();
    }
  }
  ctx.restore();
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'center', weight = 'bold') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// --- the kitchen ------------------------------------------------------------
function drawFloor(ctx) {
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, BOARD_H, VIEW_W, VIEW_H - BOARD_H - HUD_H);
  ctx.fillStyle = COLORS.floorDark;
  const tile = 64;
  for (let y = BOARD_H; y < VIEW_H - HUD_H; y += tile) {
    for (let x = ((y / tile) % 2 ? tile / 2 : 0); x < VIEW_W; x += tile) {
      ctx.fillRect(x, y, tile - 2, 2);
    }
  }
  // Wall trim under the order board.
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, BOARD_H - 6, VIEW_W, 6);
}

function drawOrderBoard(ctx, board) {
  ctx.fillStyle = COLORS.board;
  ctx.fillRect(0, 0, VIEW_W, BOARD_H);
  ctx.fillStyle = COLORS.boardEdge;
  ctx.fillRect(0, BOARD_H - 4, VIEW_W, 4);
  text(ctx, 'ORDER BOARD', 14, 18, 15, '#8a6a4a', 'left');
  text(ctx, 'SIZZLE & SERVE', VIEW_W - 14, 18, 15, '#ffb347', 'right');
  const slotW = 300, gap = 18, startX = 14;
  for (let i = 0; i < 3; i++) {
    const x = startX + i * (slotW + gap);
    const y = 30, w = slotW, h = 66;
    const o = board.orders[i];
    if (!o) {
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      roundRect(ctx, x, y, w, h, 8); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.setLineDash([5, 5]);
      roundRect(ctx, x, y, w, h, 8); ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'waiting for orders…', x + w / 2, y + h / 2, 14, '#8a6a4a');
      continue;
    }
    const urgent = o.remaining < 20;
    ctx.fillStyle = urgent ? COLORS.ticketUrgent : COLORS.ticket;
    roundRect(ctx, x, y, w, h, 8); ctx.fill();
    if (urgent) {
      ctx.strokeStyle = '#e2483d'; ctx.lineWidth = 2.5;
      roundRect(ctx, x, y, w, h, 8); ctx.stroke();
    }
    text(ctx, `#${o.id}  ${o.recipe.name}`, x + 12, y + 14, 15, COLORS.ink, 'left');
    // Needed ingredients as icons, with a tick when the plate already has one.
    const needs = o.recipe.needs;
    needs.forEach((key, j) => {
      drawIngredientIcon(ctx, key, REQUIRED_STATE[key], x + 24 + j * 34, y + 40, 26);
    });
    // Timer bar + seconds.
    const frac = Math.max(0, o.remaining / o.limit);
    ctx.fillStyle = '#d8c9a3';
    roundRect(ctx, x + 12, y + 56, w - 24, 6, 3); ctx.fill();
    ctx.fillStyle = urgent ? '#e2483d' : '#4e8f2a';
    roundRect(ctx, x + 12, y + 56, (w - 24) * frac, 6, 3); ctx.fill();
    text(ctx, `${Math.ceil(o.remaining)}s`, x + w - 12, y + 14, 14, urgent ? '#e2483d' : '#7a5a3a', 'right');
  }
}

function drawStation(ctx, s, highlight) {
  ctx.save();
  ctx.fillStyle = '#8a5a34';
  ctx.strokeStyle = highlight ? '#ffd24d' : '#5f3a1e';
  ctx.lineWidth = highlight ? 4 : 2;
  roundRect(ctx, s.x, s.y, s.w, s.h, 10);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(s.x + 4, s.y + s.h - 12, s.w - 8, 6);
  text(ctx, s.label, s.x + s.w / 2, s.y + 13, 12, '#ffe9c4');
  ctx.restore();
}

function drawPantry(ctx) {
  for (const bin of BIN_LAYOUT) {
    const ing = INGREDIENTS[bin.key];
    ctx.fillStyle = '#f7ead2';
    roundRect(ctx, bin.x, bin.y, bin.w, bin.h, 6); ctx.fill();
    ctx.strokeStyle = '#c9a06a';
    ctx.lineWidth = 1.5;
    roundRect(ctx, bin.x, bin.y, bin.w, bin.h, 6); ctx.stroke();
    drawIngredientIcon(ctx, bin.key, 'raw', bin.x + bin.w / 2, bin.y + bin.h / 2 - 4, 26);
    text(ctx, ing.name, bin.x + bin.w / 2, bin.y + bin.h - 7, 9, '#6b4a26');
  }
}

function drawGrill(ctx, kitchen) {
  const g = STATIONS.find((s) => s.id === 'grill');
  // Grate lines.
  ctx.strokeStyle = '#3a3a3a';
  ctx.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    const y = g.y + 24 + i * 7;
    ctx.beginPath(); ctx.moveTo(g.x + 10, y); ctx.lineTo(g.x + g.w - 10, y); ctx.stroke();
  }
  kitchen.grill.forEach((slot, i) => {
    if (!slot) return;
    const cx = g.x + 55 + i * 110, cy = g.y + 38;
    drawIngredientIcon(ctx, slot.key, slot.done ? 'grilled' : 'raw', cx, cy, 34);
    const frac = Math.min(1, slot.progress / slot.total);
    ctx.fillStyle = '#222';
    roundRect(ctx, cx - 22, cy + 20, 44, 5, 2); ctx.fill();
    ctx.fillStyle = slot.done ? '#ffb347' : '#7dc242';
    roundRect(ctx, cx - 22, cy + 20, 44 * frac, 5, 2); ctx.fill();
    if (slot.done) text(ctx, slot.progress > slot.total + 5 ? 'BURNING!' : 'READY', cx, g.y - 12, 11, slot.progress > slot.total + 5 ? '#ff5a3c' : '#ffd24d');
  });
  if (kitchen.grillFlash > 0) {
    text(ctx, 'burnt!', g.x + g.w / 2, g.y - 12, 14, '#ff5a3c');
  }
}

function drawBoard(ctx, kitchen) {
  const b = STATIONS.find((s) => s.id === 'board');
  ctx.fillStyle = '#e8d3a8';
  roundRect(ctx, b.x + 10, b.y + 24, b.w - 20, b.h - 36, 6); ctx.fill();
  ctx.strokeStyle = '#b89a6a';
  roundRect(ctx, b.x + 10, b.y + 24, b.w - 20, b.h - 36, 6); ctx.stroke();
  if (kitchen.chopping) {
    const c = kitchen.chopping;
    drawIngredientIcon(ctx, c.key, 'raw', b.x + b.w / 2, b.y + 52, 34);
    const frac = Math.min(1, c.progress / c.total);
    ctx.fillStyle = '#222';
    roundRect(ctx, b.x + 22, b.y + b.h - 18, b.w - 44, 6, 3); ctx.fill();
    ctx.fillStyle = '#7dc242';
    roundRect(ctx, b.x + 22, b.y + b.h - 18, (b.w - 44) * frac, 6, 3); ctx.fill();
    text(ctx, 'mash E to chop!', b.x + b.w / 2, b.y + b.h - 30, 11, '#2b1d16');
  } else {
    // A knife resting on the board.
    ctx.save();
    ctx.translate(b.x + b.w / 2, b.y + 52);
    ctx.rotate(-0.5);
    ctx.fillStyle = '#cfd6dd';
    roundRect(ctx, -26, -4, 40, 8, 3); ctx.fill();
    ctx.fillStyle = '#5f3a1e';
    roundRect(ctx, 14, -4, 16, 8, 3); ctx.fill();
    ctx.restore();
  }
}

function drawPlate(ctx, kitchen) {
  const p = STATIONS.find((s) => s.id === 'plate');
  // The white plate.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(p.x + p.w / 2, p.y + 58, 62, 26, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c9c9c9';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(p.x + p.w / 2, p.y + 58, 62, 26, 0, 0, Math.PI * 2); ctx.stroke();
  // Stack the items, lowest first, slightly overlapping.
  kitchen.plate.forEach((item, i) => {
    drawIngredientIcon(ctx, item.key, item.state, p.x + p.w / 2, p.y + 58 - i * 13, 34);
  });
  if (kitchen.plate.length === 0) {
    text(ctx, 'plate the dish here', p.x + p.w / 2, p.y + 58, 11, '#8a6a4a');
  }
  if (kitchen.plateFlash > 0) {
    text(ctx, 'not that!', p.x + p.w / 2, p.y + 22, 12, '#ff5a3c');
  }
}

function drawWindow(ctx, kitchen, matchedOrder) {
  const w = STATIONS.find((s) => s.id === 'window');
  // A warm serving hatch with a bell.
  ctx.fillStyle = '#3d2b1f';
  roundRect(ctx, w.x + 10, w.y + 24, w.w - 20, w.h - 36, 6); ctx.fill();
  ctx.fillStyle = '#ffb347';
  ctx.beginPath(); ctx.arc(w.x + w.w / 2, w.y + 44, 12, Math.PI, 0); ctx.fill();
  ctx.fillRect(w.x + w.w / 2 - 14, w.y + 44, 28, 4);
  if (matchedOrder) {
    text(ctx, `SERVE #${matchedOrder.id}!`, w.x + w.w / 2, w.y + 74, 13, '#7dc242');
  } else if (kitchen.plate.length) {
    text(ctx, 'no order matches', w.x + w.w / 2, w.y + 74, 11, '#ff9a7a');
  } else {
    text(ctx, 'ring the bell', w.x + w.w / 2, w.y + 74, 11, '#8a6a4a');
  }
}

function drawChef(ctx, kitchen) {
  const c = kitchen.chef;
  const bob = c.walking ? Math.sin(c.walkPhase) * 2 : 0;
  ctx.save();
  ctx.translate(c.x, c.y + bob * 0.4);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(0, 20, 20, 7, 0, 0, Math.PI * 2); ctx.fill();
  // Body: white apron over a shirt.
  ctx.fillStyle = '#3f6fb5';
  roundRect(ctx, -14, -6, 28, 26, 9); ctx.fill();
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, -11, 2, 22, 18, 6); ctx.fill();
  // Head + chef hat.
  ctx.fillStyle = '#f2c9a0';
  ctx.beginPath(); ctx.arc(0, -16, 12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-6, -26, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(6, -26, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -28, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(-11, -28, 22, 6);
  // Eyes look the way the chef faces.
  ctx.fillStyle = '#2b1d16';
  ctx.beginPath(); ctx.arc(c.face * 4 - 3, -16, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(c.face * 4 + 3, -16, 1.8, 0, Math.PI * 2); ctx.fill();
  // Carried item floats above the hat.
  if (kitchen.carry) {
    drawIngredientIcon(ctx, kitchen.carry.key, kitchen.carry.state, 0, -48, 30);
  }
  ctx.restore();
}

function drawHud(ctx, state) {
  ctx.fillStyle = COLORS.board;
  ctx.fillRect(0, VIEW_H - HUD_H, VIEW_W, HUD_H);
  ctx.fillStyle = COLORS.boardEdge;
  ctx.fillRect(0, VIEW_H - HUD_H, VIEW_W, 4);
  const y = VIEW_H - HUD_H / 2;
  text(ctx, `COINS  $${state.coins}`, 18, y, 20, '#ffd24d', 'left');
  text(ctx, `SERVED  ${state.served}`, 220, y, 16, '#ffffff', 'left');
  text(ctx, `COMBO  x${Math.max(1, state.combo)}`, 360, y, 16, state.combo >= 3 ? '#7dc242' : '#ffffff', 'left');
  // Shift timer: a bar plus the clock.
  const remain = Math.max(0, SHIFT_SECONDS - state.elapsed);
  const mm = Math.floor(remain / 60), ss = Math.floor(remain % 60);
  text(ctx, `SHIFT  ${mm}:${String(ss).padStart(2, '0')}`, VIEW_W - 300, y, 16, remain < 30 ? '#ff9a7a' : '#ffffff', 'left');
  const frac = remain / SHIFT_SECONDS;
  ctx.fillStyle = '#1d130d';
  roundRect(ctx, VIEW_W - 170, y - 8, 150, 16, 8); ctx.fill();
  ctx.fillStyle = remain < 30 ? '#e2483d' : '#ffb347';
  roundRect(ctx, VIEW_W - 170, y - 8, 150 * frac, 16, 8); ctx.fill();
  // Hearts for expired orders.
  for (let i = 0; i < 3; i++) {
    const hx = 560 + i * 30;
    ctx.fillStyle = i < state.lives ? '#e2483d' : 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.arc(hx - 5, y - 3, 6, 0, Math.PI * 2);
    ctx.arc(hx + 5, y - 3, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hx - 10, y - 1); ctx.lineTo(hx + 10, y - 1); ctx.lineTo(hx, y + 11); ctx.closePath(); ctx.fill();
  }
  text(ctx, 'lives', 548, y - 22, 10, '#8a6a4a', 'left');
}

function drawToast(ctx, toast) {
  if (!toast || toast.time <= 0) return;
  const alpha = Math.min(1, toast.time);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.font = 'bold 15px "Trebuchet MS", Verdana, sans-serif';
  const tw = ctx.measureText(toast.text).width + 28;
  // The toast sits just under the order board, clear of the grill and the HUD.
  roundRect(ctx, VIEW_W / 2 - tw / 2, BOARD_H + 44, tw, 30, 15);
  ctx.fill();
  text(ctx, toast.text, VIEW_W / 2, BOARD_H + 60, 15, '#ffffff');
  ctx.restore();
}

function drawPrompt(ctx, prompt) {
  if (!prompt) return;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.font = 'bold 14px "Trebuchet MS", Verdana, sans-serif';
  const tw = ctx.measureText(prompt).width + 24;
  roundRect(ctx, VIEW_W / 2 - tw / 2, BOARD_H + 10, tw, 26, 13);
  ctx.fill();
  text(ctx, prompt, VIEW_W / 2, BOARD_H + 24, 14, '#ffd24d');
  ctx.restore();
}

// --- screens -----------------------------------------------------------------
export function drawTitle(ctx, state) {
  drawFloor(ctx);
  // A dressed kitchen behind the title: a full order board and a plated dish.
  drawOrderBoard(ctx, state.board);
  for (const s of STATIONS) drawStation(ctx, s, false);
  drawPantry(ctx);
  drawGrill(ctx, state.kitchen);
  drawBoard(ctx, state.kitchen);
  drawPlate(ctx, state.kitchen);
  drawWindow(ctx, state.kitchen, null);
  drawChef(ctx, state.kitchen);
  ctx.fillStyle = 'rgba(20,10,5,0.62)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, 'SIZZLE & SERVE', VIEW_W / 2, 220, 64, '#ffb347');
  text(ctx, 'a tiny kitchen, a full shift, and customers who will not wait', VIEW_W / 2, 278, 20, '#ffffff');
  text(ctx, 'Grab ingredients from the PANTRY · chop on the BOARD · grill the PATTY', VIEW_W / 2, 330, 17, '#ffe9c4');
  text(ctx, 'Stack the dish on the PLATE · ring the bell at SERVE before the ticket burns', VIEW_W / 2, 356, 17, '#ffe9c4');
  text(ctx, 'WASD / arrows to move · E to use a station · click the pantry to grab · SPACE to serve', VIEW_W / 2, 396, 15, '#ffd24d');
  const pulse = 0.7 + Math.sin(state.titleTime * 4) * 0.3;
  ctx.save();
  ctx.globalAlpha = pulse;
  text(ctx, '— press SPACE or click to start the shift —', VIEW_W / 2, 452, 19, '#ffffff');
  ctx.restore();
  text(ctx, '3 lives · 3-minute shift · tips for fast service', VIEW_W / 2, 500, 14, '#c9a06a');
}

export function drawGameOver(ctx, state) {
  drawFloor(ctx);
  drawOrderBoard(ctx, state.board);
  for (const s of STATIONS) drawStation(ctx, s, false);
  drawPantry(ctx);
  drawGrill(ctx, state.kitchen);
  drawBoard(ctx, state.kitchen);
  drawPlate(ctx, state.kitchen);
  drawWindow(ctx, state.kitchen, null);
  ctx.fillStyle = 'rgba(20,10,5,0.66)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, state.lives > 0 ? 'SHIFT COMPLETE!' : 'KITCHEN CLOSED', VIEW_W / 2, 220, 52, '#ffb347');
  text(ctx, `You served ${state.served} dishes and earned $${state.coins}`, VIEW_W / 2, 290, 22, '#ffffff');
  const best = state.served >= 12 ? 'Head Chef! The regulars ask for you by name.' :
    state.served >= 7 ? 'Sous Chef — solid service, sharper knives next time.' :
    state.served >= 3 ? 'Line Cook — the rush got away from you.' :
    'Dishwasher… for now. The grill believes in you.';
  text(ctx, best, VIEW_W / 2, 330, 18, '#ffe9c4');
  text(ctx, 'press R to run another shift', VIEW_W / 2, 400, 16, '#ffd24d');
}

// --- main frame ---------------------------------------------------------------
export function render(ctx, state, prompt) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  if (state.phase === 'title') { drawTitle(ctx, state); return; }
  if (state.phase === 'over') { drawGameOver(ctx, state); return; }
  drawFloor(ctx);
  drawOrderBoard(ctx, state.board);
  const near = state.nearStation;
  for (const s of STATIONS) drawStation(ctx, s, near && near.id === s.id);
  drawPantry(ctx);
  drawGrill(ctx, state.kitchen);
  drawBoard(ctx, state.kitchen);
  drawPlate(ctx, state.kitchen);
  drawWindow(ctx, state.kitchen, state.matchedOrder);
  drawChef(ctx, state.kitchen);
  drawHud(ctx, state);
  drawPrompt(ctx, prompt);
  drawToast(ctx, state.toast);
}
