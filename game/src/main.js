// main.js — the game loop and the rules that tie the kitchen together:
// move, use stations, serve plates, lose lives, end the shift.
// State machine: title -> play -> over. R restarts from anywhere.
import { VIEW_W, VIEW_H, SHIFT_SECONDS } from './config.js';
import { createInput } from './input.js';
import { createOrderBoard, updateOrderBoard, matchOrder, serveOrder, serveValue } from './orders.js';
import {
  createKitchen, moveChef, nearestStation, interact, grabBin, chopHit,
  binAt, stationAt, updateKitchen, plateDescription,
} from './kitchen.js';
import { render } from './render.js';
import { applyShot } from './shots.js';
import { sfx, unlockAudio, toggleMute } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// A small seeded RNG so screenshot scenes are stable; gameplay uses Math.random.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') || 7);
const shot = params.get('shot');

const input = createInput(canvas);

function freshState() {
  return {
    phase: 'title',
    titleTime: 0,
    elapsed: 0,
    coins: 0,
    served: 0,
    combo: 0,
    lives: 3,
    board: createOrderBoard(mulberry32(seed)),
    kitchen: createKitchen(),
    toast: null,
    nearStation: null,
    matchedOrder: null,
  };
}

let state = freshState();
if (shot) applyShot(state, shot);

function showToast(text, seconds = 2.6) {
  state.toast = { text, time: seconds };
}

// What the prompt line above the kitchen says right now.
function currentPrompt() {
  const k = state.kitchen;
  if (state.phase !== 'play') return null;
  const near = nearestStation(k);
  if (k.chopping) return 'Mash E (or click the board) to finish chopping';
  if (!near) {
    return k.carry
      ? `Carrying ${plateDescription({ plate: [k.carry] })} — head to the chopping board, grill or plate`
      : 'Walk to the PANTRY and click an ingredient to grab it';
  }
  if (near.kind === 'bins') return 'Click an ingredient in the pantry to grab it';
  if (near.kind === 'board') return k.carry ? 'E — start chopping what you carry' : 'E — chop (bring something first)';
  if (near.kind === 'grill') return k.carry ? 'E — put it on the grill' : 'E — take the grilled patty';
  if (near.kind === 'plate') return k.carry ? 'E — add it to the plate' : 'E — take the top item back';
  if (near.kind === 'window') {
    return state.matchedOrder
      ? `SPACE — serve ${state.matchedOrder.recipe.name} to ticket #${state.matchedOrder.id}!`
      : 'Serve here when a plate matches a ticket';
  }
  return null;
}

function servePlate() {
  const k = state.kitchen;
  if (!k.plate.length) { showToast('The plate is empty'); sfx.wrong(); return; }
  const order = matchOrder(state.board, k.plate);
  if (!order) {
    showToast('No ticket wants this plate — check the order board');
    sfx.wrong();
    k.plateFlash = 0.8;
    return;
  }
  const value = serveValue(order, state.combo);
  state.coins += value.coins;
  state.served += 1;
  state.combo += 1;
  serveOrder(state.board, order);
  k.plate = [];
  sfx.served();
  showToast(`Served ${order.recipe.name}! +$${value.coins} (tip $${value.tip}${value.comboBonus ? `, combo +$${value.comboBonus}` : ''})`, 3);
}

function endShift() {
  state.phase = 'over';
  sfx.gameover();
}

function restart() {
  state = freshState();
  state.phase = 'play';
  sfx.start();
  showToast('New shift — first tickets coming in!', 3);
}

function update(dt) {
  state.titleTime += dt;
  if (state.toast && state.toast.time > 0) state.toast.time -= dt;

  if (state.phase === 'title') {
    if (input.wasPressed('Space', 'Enter') || input.consumeClick()) {
      unlockAudio();
      state.phase = 'play';
      sfx.start();
      showToast('First tickets coming in — grab ingredients from the pantry!', 3.5);
    }
    return;
  }
  if (state.phase === 'over') {
    if (input.wasPressed('KeyR', 'Space', 'Enter')) restart();
    return;
  }

  // --- play ---
  state.elapsed += dt;
  if (state.elapsed >= SHIFT_SECONDS) { endShift(); return; }

  if (input.wasPressed('KeyM')) {
    const muted = toggleMute();
    showToast(muted ? 'Sound off' : 'Sound on');
  }
  if (input.wasPressed('KeyR')) { restart(); return; }

  moveChef(state.kitchen, input.moveVector(), dt);
  updateKitchen(state.kitchen, dt);
  updateOrderBoard(state.board, dt, state.elapsed, (order) => {
    state.combo = 0;
    state.lives -= 1;
    sfx.expired();
    showToast(`Ticket #${order.id} walked out — ${order.recipe.name} never arrived`, 3);
    if (state.lives <= 0) endShift();
  });

  state.nearStation = nearestStation(state.kitchen);
  state.matchedOrder = state.kitchen.plate.length ? matchOrder(state.board, state.kitchen.plate) : null;

  // A ticking sound in the last ten seconds of any ticket.
  const urgent = state.board.orders.some((o) => o.remaining < 10);
  if (urgent && Math.floor(state.elapsed * 2) !== Math.floor((state.elapsed - dt) * 2)) sfx.tick();

  // E uses the nearby station; mashing E while chopping speeds it up.
  if (input.wasPressed('KeyE')) {
    unlockAudio();
    if (state.kitchen.chopping) {
      const msg = chopHit(state.kitchen);
      if (msg) showToast(msg);
    } else {
      const msg = interact(state.kitchen, state.nearStation);
      if (msg) showToast(msg);
    }
  }
  if (input.wasPressed('Space')) {
    unlockAudio();
    if (state.nearStation && state.nearStation.kind === 'window') servePlate();
    else if (state.matchedOrder) servePlate();
    else showToast('Stand at SERVE (or finish a matching plate) to serve');
  }

  // Mouse: click a pantry bin to grab, click the board to chop, click a
  // station to use it when the chef stands by it.
  if (input.consumeClick()) {
    unlockAudio();
    const m = input.mousePos();
    const bin = binAt(m.x, m.y);
    if (bin && state.nearStation && state.nearStation.kind === 'bins') {
      const msg = grabBin(state.kitchen, bin.key);
      if (msg) showToast(msg);
    } else if (state.nearStation && state.nearStation.kind === 'board' && state.kitchen.chopping) {
      const msg = chopHit(state.kitchen);
      if (msg) showToast(msg);
    } else if (state.nearStation && stationAt(m.x, m.y) === state.nearStation) {
      const msg = interact(state.kitchen, state.nearStation);
      if (msg) showToast(msg);
    } else if (bin) {
      showToast('Walk over to the pantry first');
    }
  }

  // Keep the matched-order highlight fresh after every action.
  state.matchedOrder = state.kitchen.plate.length ? matchOrder(state.board, state.kitchen.plate) : null;
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render(ctx, state, currentPrompt());
  input.endFrame();
  requestAnimationFrame(frame);
}

// Surface page errors and a read-only state handle for the play-test harness.
window.addEventListener('error', (e) => {
  (window.__errs = window.__errs || []).push(String(e.message));
});
window.addEventListener('unhandledrejection', (e) => {
  (window.__errs = window.__errs || []).push('rejection: ' + String(e.reason));
});
window.__sizzle = { state: () => state, servePlate, freshState };

requestAnimationFrame(frame);
