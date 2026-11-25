// kitchen.js — the world state: the chef, what is in hand, what sits on
// the grill, what is being chopped, and what is stacked on the plate.
// Every interaction is one small function so the main loop stays readable.
import {
  STATIONS, BIN_LAYOUT, INGREDIENTS, CHEF_SPEED, CHEF_RADIUS,
  GRILL_SLOTS, FLOOR, VIEW_W, VIEW_H, BOARD_H, HUD_H,
} from './config.js';
import { sfx } from './audio.js';

export function createKitchen() {
  return {
    chef: { x: VIEW_W / 2, y: 430, face: 1, walking: false, walkPhase: 0 },
    carry: null, // { key, state: 'raw' | 'chopped' | 'grilled' }
    grill: [null, null], // { key, progress, done } per slot, or null
    chopping: null, // { key, progress } or null
    plate: [], // keys stacked on the plating counter, in stack order
    plateFlash: 0, // timer for the "wrong ingredient" shake
    grillFlash: 0,
  };
}

function stationById(id) {
  return STATIONS.find((s) => s.id === id);
}

// The chef can use a station when standing close to its front edge.
export function nearestStation(kitchen) {
  const c = kitchen.chef;
  let best = null, bestD = 110;
  for (const s of STATIONS) {
    const cx = Math.max(s.x, Math.min(c.x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(c.y, s.y + s.h));
    const d = Math.hypot(c.x - cx, c.y - cy);
    if (d < bestD) { bestD = d; best = s; }
  }
  return best;
}

export function moveChef(kitchen, vec, dt) {
  const c = kitchen.chef;
  if (vec.x === 0 && vec.y === 0) { c.walking = false; return; }
  c.walking = true;
  c.walkPhase += dt * 10;
  if (vec.x !== 0) c.face = vec.x > 0 ? 1 : -1;
  const nx = c.x + vec.x * CHEF_SPEED * dt;
  const ny = c.y + vec.y * CHEF_SPEED * dt;
  c.x = Math.max(FLOOR.x + CHEF_RADIUS, Math.min(FLOOR.x + FLOOR.w - CHEF_RADIUS, nx));
  c.y = Math.max(FLOOR.y + CHEF_RADIUS + 8, Math.min(VIEW_H - HUD_H - CHEF_RADIUS, ny));
  // Counters are solid: push the chef out of station rectangles.
  for (const s of STATIONS) {
    if (c.x > s.x - CHEF_RADIUS && c.x < s.x + s.w + CHEF_RADIUS &&
        c.y > s.y - CHEF_RADIUS && c.y < s.y + s.h + CHEF_RADIUS) {
      const dxl = c.x - (s.x - CHEF_RADIUS);
      const dxr = (s.x + s.w + CHEF_RADIUS) - c.x;
      const dyt = c.y - (s.y - CHEF_RADIUS);
      const dyb = (s.y + s.h + CHEF_RADIUS) - c.y;
      const m = Math.min(dxl, dxr, dyt, dyb);
      if (m === dxl) c.x = s.x - CHEF_RADIUS;
      else if (m === dxr) c.x = s.x + s.w + CHEF_RADIUS;
      else if (m === dyt) c.y = s.y - CHEF_RADIUS;
      else c.y = s.y + s.h + CHEF_RADIUS;
    }
  }
}

// Which pantry bin, if any, is under the mouse.
export function binAt(mx, my) {
  return BIN_LAYOUT.find((b) => mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) ?? null;
}

// Which station, if any, is under the mouse.
export function stationAt(mx, my) {
  return STATIONS.find((s) => mx >= s.x && mx <= s.x + s.w && my >= s.y && my <= s.y + s.h) ?? null;
}

function carryLabel(kitchen) {
  if (!kitchen.carry) return null;
  const ing = INGREDIENTS[kitchen.carry.key];
  const suffix = kitchen.carry.state === 'chopped' ? ' (chopped)' : kitchen.carry.state === 'grilled' ? ' (grilled)' : '';
  return ing.name + suffix;
}

// The one interaction key: E (or a click). What happens depends on the
// station the chef stands by and what is in hand. Returns a short message
// for the toast line, or null.
export function interact(kitchen, station) {
  if (!station) return null;
  const k = kitchen;
  if (station.kind === 'bins') {
    if (k.carry) { sfx.wrong(); return 'Hands full — plate it or put it down first'; }
    return null; // bins need a click on a specific ingredient, see grabBin
  }
  if (station.kind === 'board') {
    if (k.chopping) return 'Still chopping…';
    if (!k.carry) { sfx.wrong(); return 'Bring something to chop'; }
    const ing = INGREDIENTS[k.carry.key];
    if (!ing.chop) { sfx.wrong(); return `${ing.name} needs no chopping`; }
    k.chopping = { key: k.carry.key, progress: 0, total: ing.chop };
    k.carry = null;
    sfx.chop();
    return `Chopping ${ing.name}… (mash E)`;
  }
  if (station.kind === 'grill') {
    if (k.carry) {
      const ing = INGREDIENTS[k.carry.key];
      if (!ing.grill) { sfx.wrong(); return `${ing.name} does not go on the grill`; }
      const slot = k.grill.findIndex((g) => g === null);
      if (slot === -1) { sfx.wrong(); return 'Grill is full'; }
      k.grill[slot] = { key: k.carry.key, progress: 0, total: ing.grill, done: false };
      k.carry = null;
      sfx.sizzle();
      return 'Patty on the grill…';
    }
    const done = k.grill.findIndex((g) => g && g.done);
    if (done === -1) return 'Nothing ready on the grill yet';
    k.carry = { key: k.grill[done].key, state: 'grilled' };
    k.grill[done] = null;
    sfx.pickup();
    return 'Grilled patty in hand';
  }
  if (station.kind === 'plate') {
    if (!k.carry) {
      if (k.plate.length) {
        // Take the top item back off the plate.
        const item = k.plate.pop();
        k.carry = { key: item.key, state: item.state };
        sfx.pickup();
        return `Took ${INGREDIENTS[item.key].name} back`;
      }
      return 'Plate is empty — bring an ingredient';
    }
    k.plate.push({ key: k.carry.key, state: k.carry.state });
    sfx.plated();
    const done = k.carry;
    k.carry = null;
    return `${carryLabel({ carry: done })} on the plate`;
  }
  if (station.kind === 'window') return null; // serving is handled by main.js
  return null;
}

// Click a pantry bin to grab that ingredient (only when hands are empty).
export function grabBin(kitchen, binKey) {
  const k = kitchen;
  if (k.carry) { sfx.wrong(); return 'Hands full'; }
  k.carry = { key: binKey, state: 'raw' };
  sfx.pickup();
  return `${INGREDIENTS[binKey].name} in hand`;
}

// Chopping progress: each E press (or click on the board) adds a chop.
export function chopHit(kitchen) {
  const k = kitchen;
  if (!k.chopping) return null;
  k.chopping.progress += 0.55;
  sfx.chop();
  if (k.chopping.progress >= k.chopping.total) {
    const key = k.chopping.key;
    k.chopping = null;
    k.carry = { key, state: 'chopped' };
    sfx.chopped();
    return `${INGREDIENTS[key].name} chopped`;
  }
  return null;
}

export function updateKitchen(kitchen, dt) {
  // The grill cooks on its own; a patty left too long burns.
  for (let i = 0; i < kitchen.grill.length; i++) {
    const g = kitchen.grill[i];
    if (!g) continue;
    g.progress += dt;
    if (!g.done && g.progress >= g.total) {
      g.done = true;
      sfx.grilled();
    }
    if (g.done && g.progress > g.total + 8) {
      // Burnt: the slot clears itself with a puff.
      kitchen.grill[i] = null;
      kitchen.grillFlash = 0.6;
    }
  }
  if (kitchen.plateFlash > 0) kitchen.plateFlash -= dt;
  if (kitchen.grillFlash > 0) kitchen.grillFlash -= dt;
}

export function plateDescription(kitchen) {
  if (!kitchen.plate.length) return 'empty plate';
  return kitchen.plate.map((item) => {
    const suffix = item.state === 'chopped' ? ' (chopped)' : item.state === 'grilled' ? ' (grilled)' : '';
    return INGREDIENTS[item.key].name + suffix;
  }).join(' + ');
}

export { stationById };
