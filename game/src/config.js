// config.js — every constant that defines Sizzle & Serve: the kitchen's
// layout, its ingredients, its recipes and its difficulty curve.
// Nothing here is loaded from the network; the whole game is static files.
export const VIEW_W = 1280;
export const VIEW_H = 720;

// The kitchen floor, in canvas pixels. The top strip is the order board;
// the bottom strip is the HUD. The middle is the walkable kitchen.
export const BOARD_H = 108;
export const HUD_H = 64;
export const FLOOR = { x: 0, y: BOARD_H, w: VIEW_W, h: VIEW_H - BOARD_H - HUD_H };

// Ingredient definitions. Each one knows its colour, its shape key, whether
// it needs chopping or grilling, and how long that work takes.
export const INGREDIENTS = {
  bun:     { name: 'Bun',     color: '#e8a95c', dark: '#b97e33', chop: 0,    grill: 0,    shape: 'bun' },
  patty:   { name: 'Patty',   color: '#8a4b2d', dark: '#5f3018', chop: 0,    grill: 6.0,  shape: 'patty' },
  lettuce: { name: 'Lettuce', color: '#7dc242', dark: '#4e8f2a', chop: 2.0,  grill: 0,    shape: 'leaf' },
  tomato:  { name: 'Tomato',  color: '#e2483d', dark: '#a92c24', chop: 2.0,  grill: 0,    shape: 'round' },
  cheese:  { name: 'Cheese',  color: '#ffc93c', dark: '#d99a12', chop: 0,    grill: 0,    shape: 'square' },
  onion:   { name: 'Onion',   color: '#f2e6f5', dark: '#b98fc4', chop: 2.5,  grill: 0,    shape: 'rings' },
};
export const INGREDIENT_KEYS = ['bun', 'patty', 'lettuce', 'tomato', 'cheese', 'onion'];

// The state a recipe demands for each ingredient: a patty must be grilled,
// veg must be chopped, bun and cheese go on as they are.
export const REQUIRED_STATE = {
  bun: 'raw', patty: 'grilled', lettuce: 'chopped',
  tomato: 'chopped', cheese: 'raw', onion: 'chopped',
};

// A recipe is a plate: the ordered list of ingredient keys a dish needs.
// `needs` may repeat a key (a double patty). `base` is the coins it pays.
export const RECIPES = [
  { id: 'classic',  name: 'Classic Burger', needs: ['bun', 'patty', 'lettuce'],            base: 18 },
  { id: 'cheese',   name: 'Cheese Melt',    needs: ['bun', 'patty', 'cheese'],             base: 20 },
  { id: 'garden',   name: 'Garden Salad',   needs: ['lettuce', 'tomato', 'onion'],         base: 14 },
  { id: 'double',   name: 'Double Stack',   needs: ['bun', 'patty', 'patty', 'cheese'],    base: 28 },
  { id: 'veggie',   name: 'Veggie Stack',   needs: ['bun', 'lettuce', 'tomato', 'cheese'],  base: 22 },
  { id: 'onion',    name: 'Onion Burger',   needs: ['bun', 'patty', 'onion', 'cheese'],     base: 24 },
];

// Stations. Each is a rectangle on the floor with an id, a label and a kind.
// The chef stands in front of one and presses E (or clicks it) to use it.
export const STATIONS = [
  { id: 'bins',    label: 'PANTRY',   kind: 'bins',    x: 24,  y: 300, w: 150, h: 190 },
  { id: 'board',   label: 'CHOPPING', kind: 'board',   x: 24,  y: 500, w: 150, h: 96 },
  { id: 'grill',   label: 'GRILL',    kind: 'grill',   x: 560, y: 596, w: 220, h: 60 },
  { id: 'plate',   label: 'PLATING',  kind: 'plate',   x: 1100, y: 300, w: 156, h: 190 },
  { id: 'window',  label: 'SERVE',    kind: 'window',  x: 1100, y: 500, w: 156, h: 96 },
];

// Pantry bins: one slot per ingredient, laid out inside the pantry station.
export const BIN_LAYOUT = INGREDIENT_KEYS.map((key, i) => ({
  key,
  x: STATIONS[0].x + 12 + (i % 2) * 68,
  y: STATIONS[0].y + 30 + Math.floor(i / 2) * 56,
  w: 58,
  h: 46,
}));

// Difficulty: orders arrive faster and their timers shrink as the shift goes on.
export const SHIFT_SECONDS = 180;
export const ORDER_SLOTS = 3;
export function orderInterval(elapsed) {
  // Seconds between new orders: 14s at the start, 8s by the end of the shift.
  return Math.max(8, 14 - (elapsed / SHIFT_SECONDS) * 6);
}
export function orderTimeLimit(elapsed) {
  // How long a customer waits: 75s early, 55s late.
  return Math.max(55, 75 - (elapsed / SHIFT_SECONDS) * 20);
}

export const CHEF_SPEED = 260; // pixels per second
export const CHEF_RADIUS = 22;
export const GRILL_SLOTS = 2;
export const MAX_CARRY = 1; // one item in hand at a time — plan your route

// Colours for the kitchen itself.
export const COLORS = {
  floor: '#c98f5f',
  floorDark: '#b57a4c',
  wall: '#7a4a2b',
  board: '#2b1d16',
  boardEdge: '#4a3226',
  ticket: '#fff6d8',
  ticketUrgent: '#ffe1d6',
  ink: '#2b1d16',
  accent: '#ffb347',
};
