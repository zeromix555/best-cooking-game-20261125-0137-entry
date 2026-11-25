// shots.js — deterministic scenes for the entry's screenshots.
// ?shot=start  — the title screen over a dressed kitchen.
// ?shot=play   — mid-shift: three tickets up, a dish mid-assembly on the
//                plate, a patty on the grill, lettuce being chopped.
// ?shot=serve  — a finished plate at the window, its ticket glowing.
// ?shot=end    — the shift-complete screen.
// A fixed seed keeps the scenes identical on every run.
import { RECIPES } from './config.js';

export function applyShot(state, shot) {
  const { board, kitchen } = state;
  if (shot === 'start') {
    state.phase = 'title';
    board.orders = [
      { id: 1, recipe: RECIPES[0], remaining: 62, limit: 75 },
      { id: 2, recipe: RECIPES[2], remaining: 41, limit: 75 },
    ];
    kitchen.plate = [
      { key: 'bun', state: 'raw' },
      { key: 'patty', state: 'grilled' },
    ];
    kitchen.grill = [{ key: 'patty', progress: 4.2, total: 6, done: false }, null];
    kitchen.chef = { x: 640, y: 430, face: 1, walking: false, walkPhase: 0 };
    return;
  }
  if (shot === 'play') {
    state.phase = 'play';
    state.elapsed = 64;
    board.orders = [
      { id: 4, recipe: RECIPES[0], remaining: 38, limit: 75 },
      { id: 5, recipe: RECIPES[3], remaining: 17, limit: 65 },
      { id: 6, recipe: RECIPES[2], remaining: 52, limit: 75 },
    ];
    board.spawnTimer = 6;
    kitchen.plate = [
      { key: 'bun', state: 'raw' },
      { key: 'patty', state: 'grilled' },
    ];
    kitchen.carry = { key: 'lettuce', state: 'chopped' };
    kitchen.chopping = null;
    kitchen.grill = [{ key: 'patty', progress: 5.4, total: 6, done: false }, null];
    kitchen.chef = { x: 1030, y: 430, face: -1, walking: false, walkPhase: 0 };
    state.coins = 54;
    state.served = 3;
    state.combo = 2;
    state.toast = { text: 'Lettuce chopped — plate it to finish ticket #4', time: 99 };
    return;
  }
  if (shot === 'serve') {
    state.phase = 'play';
    state.elapsed = 96;
    board.orders = [
      { id: 7, recipe: RECIPES[1], remaining: 29, limit: 70 },
      { id: 8, recipe: RECIPES[4], remaining: 44, limit: 75 },
    ];
    board.spawnTimer = 9;
    kitchen.plate = [
      { key: 'bun', state: 'raw' },
      { key: 'patty', state: 'grilled' },
      { key: 'cheese', state: 'raw' },
    ];
    kitchen.carry = null;
    kitchen.grill = [null, null];
    kitchen.chef = { x: 1030, y: 560, face: 1, walking: false, walkPhase: 0 };
    state.coins = 86;
    state.served = 5;
    state.combo = 3;
    state.toast = { text: 'Cheese Melt ready — ring the bell at SERVE!', time: 99 };
    return;
  }
  if (shot === 'end') {
    state.phase = 'over';
    state.elapsed = 180;
    state.coins = 214;
    state.served = 11;
    state.combo = 4;
    board.orders = [];
    kitchen.plate = [];
    return;
  }
}
