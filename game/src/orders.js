// orders.js — the order board: which tickets are up, how long each
// customer waits, and what a served plate is worth.
// A plate matches an order only when its ingredient multiset equals the
// recipe's, order aside (a bun, a patty and lettuce in any stack order).
import { RECIPES, REQUIRED_STATE, ORDER_SLOTS, orderInterval, orderTimeLimit, SHIFT_SECONDS } from './config.js';

let nextId = 1;

export function createOrderBoard(random) {
  return {
    orders: [], // { id, recipe, remaining, limit, served }
    spawnTimer: 2.5, // first ticket lands a couple of seconds in
    random,
  };
}

function pickRecipe(board, elapsed) {
  // Early in the shift only the simple recipes appear; the harder ones
  // join as the kitchen warms up, so pressure grows without new chores.
  const unlocked = RECIPES.filter((r, i) => elapsed > i * 22 || i < 3);
  const pool = unlocked.length ? unlocked : RECIPES;
  return pool[Math.floor(board.random() * pool.length)];
}

export function updateOrderBoard(board, dt, elapsed, onExpired) {
  board.spawnTimer -= dt;
  if (board.spawnTimer <= 0 && board.orders.length < ORDER_SLOTS) {
    const recipe = pickRecipe(board, elapsed);
    board.orders.push({
      id: nextId++,
      recipe,
      remaining: orderTimeLimit(elapsed),
      limit: orderTimeLimit(elapsed),
    });
    board.spawnTimer = orderInterval(elapsed);
  }
  for (let i = board.orders.length - 1; i >= 0; i--) {
    const o = board.orders[i];
    o.remaining -= dt;
    if (o.remaining <= 0) {
      board.orders.splice(i, 1);
      onExpired(o);
    }
  }
}

// Find the ticket a plate satisfies, if any. A plate matches only when its
// items equal the recipe's needs in both ingredient and state: a patty must
// be grilled, veg must be chopped. Order on the plate does not matter.
export function matchOrder(board, plateItems) {
  const wanted = (needs) => needs.map((key) => `${key}:${REQUIRED_STATE[key]}`).sort();
  const have = plateItems.map((item) => `${item.key}:${item.state}`).sort();
  return board.orders.find((o) => {
    const w = wanted(o.recipe.needs);
    return w.length === have.length && w.every((v, i) => v === have[i]);
  }) ?? null;
}

export function serveOrder(board, order) {
  const i = board.orders.indexOf(order);
  if (i >= 0) board.orders.splice(i, 1);
}

// Coins for a served order: base pay plus a tip for speed, plus a combo
// bonus for serving several in a row without letting one expire.
export function serveValue(order, combo) {
  const speed = Math.max(0, order.remaining / order.limit); // 1 = instant
  const tip = Math.round(order.recipe.base * 0.5 * speed);
  const comboBonus = combo >= 2 ? (combo - 1) * 2 : 0;
  return { coins: order.recipe.base + tip + comboBonus, tip, comboBonus };
}

export function shiftProgress(elapsed) {
  return Math.min(1, elapsed / SHIFT_SECONDS);
}
