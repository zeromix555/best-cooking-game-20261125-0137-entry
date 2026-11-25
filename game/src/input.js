// input.js — keyboard and mouse state for the kitchen.
// WASD or arrows move the chef. E (or a click on a nearby station) uses it.
// Space starts the shift / serves at the window. M mutes. R restarts.
export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set(); // edge-triggered: cleared every frame by main.js
  let mouse = { x: 0, y: 0, clicked: false, down: false };

  function code(e) {
    return e.code;
  }

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    if (!e.repeat) pressed.add(e.code);
    keys.add(e.code);
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());

  function toCanvas(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (canvas.width / r.width),
      y: (e.clientY - r.top) * (canvas.height / r.height),
    };
  }
  canvas.addEventListener('mousemove', (e) => { mouse = { ...mouse, ...toCanvas(e) }; });
  canvas.addEventListener('mousedown', (e) => { mouse = { ...toCanvas(e), clicked: true, down: true }; });
  canvas.addEventListener('mouseup', () => { mouse.down = false; });
  canvas.addEventListener('mouseleave', () => { mouse.down = false; });

  return {
    // Held-down movement vector, normalised.
    moveVector() {
      let x = 0, y = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
      if (x !== 0 && y !== 0) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
      return { x, y };
    },
    // True once, on the frame the key went down.
    wasPressed(...codes) {
      return codes.some((c) => pressed.has(c));
    },
    consumeClick() {
      const c = mouse.clicked;
      mouse.clicked = false;
      return c;
    },
    mousePos() {
      return { x: mouse.x, y: mouse.y };
    },
    endFrame() {
      pressed.clear();
    },
  };
}
