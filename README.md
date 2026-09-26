# Grow Big

A ready-to-play browser vertical slice of **Grow Big** with exploration, quests, home customization, and local progression.

## Prototype features

- Keyboard movement (WASD / Arrow keys) with world boundaries, collision, and a follow camera.
- Distinct areas: **Home Base**, **Sun Meadow**, **Crystal Cave**, and **Timber Grove**.
- NPC quest loop: accept quest, track objective progress, return for rewards.
- Collectibles and economy: crystals/wood resources, coins, XP, level-ups.
- Progression unlock: level-gated sprint upgrade purchase.
- Home customization: place owned decor on home pads; quest rewards and shop expand decor options.
- Persistent progress in `localStorage` (player state, quest state, inventory, placed decor, collectibles).
- HUD + menus for quest state, hints, resources, XP/level, save and reset behavior.

## Run from a clean checkout

No backend is required.

### Option A: open directly

Open `index.html` from your local `grow-big` checkout in a modern desktop browser.

### Option B: local server (recommended)

```bash
# example (after cloning)
cd grow-big
# or use your local checkout path
# cd /path/to/your/clone
python -m http.server 8000
```

Then open: `http://localhost:8000`

## Controls

- **Move:** `WASD` or `Arrow Keys`
- **Interact / collect / talk / place decor:** `E`
- **Sprint (after buying sprint upgrade):** Hold `Shift`
- **Save:** `Save` button
- **Reset all progress:** `Reset` button

## Gameplay loop

1. Talk to the **Meadow Guide** to accept the crystal quest.
2. Explore and collect resources (especially crystals in Crystal Cave).
3. Return to the NPC to complete the quest for coin/XP rewards and decor unlock.
4. Buy upgrades/decor, return to Home Base, and place decor near glowing home pads.
5. Keep collecting, leveling, and improving your base.
