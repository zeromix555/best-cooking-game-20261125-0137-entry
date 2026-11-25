[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/zeromix555/best-cooking-game-20261125-0137-entry/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/zeromix555/best-cooking-game-20261125-0137-entry/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

# Sizzle & Serve

Entry for the make.fun competition
`best-cooking-game-20261125-0137` — a tiny kitchen, a full shift, and
customers who will not wait. Run the pantry, the chopping board, the grill
and the plating counter as one chef, and get every ticket out before it
burns.

Bounty page: https://make.fun/bounty/best-cooking-game-20261125-0137

## The game

Three tickets hang on the order board, each with a timer. A dish is a
recipe: Classic Burger (bun + grilled patty + chopped lettuce), Cheese Melt,
Garden Salad, Double Stack, Veggie Stack, Onion Burger. A patty only counts
grilled, veg only counts chopped — raw never matches a ticket.

Each order pays its base price plus a tip for speed, and serving several in
a row without losing one builds a combo bonus. Let a ticket expire and a
customer walks out: you lose a life and the combo. Three lives, one
three-minute shift.

## Controls

- WASD / arrow keys — move the chef
- E — use the station you stand by (start chopping, put a patty on the grill, take the grilled patty, add to the plate)
- Click an ingredient in the pantry to grab it · click the chopping board to chop
- SPACE — serve the plated dish at the SERVE window (only when it matches a ticket)
- M mute · R restart

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network requests: `game/` is plain static files, all art
drawn in code and all sound synthesised with WebAudio.
