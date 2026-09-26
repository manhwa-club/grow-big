const STORAGE_KEY = 'growBigPrototypeSave_v1';

const WORLD = { width: 2200, height: 1400 };

const ZONES = [
  { id: 'home', name: 'Home Base', x: 90, y: 90, w: 620, h: 430, color: '#2f4f72' },
  { id: 'meadow', name: 'Sun Meadow', x: 770, y: 80, w: 1220, h: 560, color: '#2f6642' },
  { id: 'cave', name: 'Crystal Cave', x: 1180, y: 700, w: 760, h: 580, color: '#4d3f73' },
  { id: 'grove', name: 'Timber Grove', x: 140, y: 650, w: 920, h: 640, color: '#516f3b' }
];

const OBSTACLES = [
  { x: 520, y: 180, w: 150, h: 120 },
  { x: 960, y: 240, w: 220, h: 130 },
  { x: 1300, y: 300, w: 230, h: 120 },
  { x: 450, y: 880, w: 210, h: 180 },
  { x: 1640, y: 920, w: 190, h: 170 },
  { x: 980, y: 980, w: 120, h: 250 }
];

const HOME_SLOTS = [
  { x: 190, y: 180 },
  { x: 300, y: 220 },
  { x: 430, y: 190 },
  { x: 560, y: 250 },
  { x: 250, y: 340 },
  { x: 480, y: 360 }
];

const DECOR_CATALOG = [
  { id: 'flower', label: 'Flower Pot', emoji: '🪴', cost: 0 },
  { id: 'lantern', label: 'Lantern', emoji: '🏮', cost: 45 },
  { id: 'totem', label: 'Totem', emoji: '🗿', cost: 65 }
];

const state = {
  player: { x: 200, y: 300, r: 18 },
  camera: { x: 0, y: 0, w: 960, h: 560 },
  coins: 30,
  xp: 0,
  level: 1,
  nextXp: 100,
  upgradeSprint: false,
  resources: { crystal: 0, wood: 0 },
  decorInventory: { flower: 1, lantern: 0, totem: 0 },
  selectedDecor: 'flower',
  placedDecor: {},
  quest: {
    id: 'crystal-call',
    title: 'Crystal Call',
    text: 'Talk to the Meadow Guide, then collect 3 crystals in the Crystal Cave.',
    status: 'available',
    progress: 0,
    target: 3,
    reward: { coins: 90, xp: 80, unlockDecor: 'totem' }
  },
  collectibles: [],
  trackQuest: false,
  status: { text: 'Welcome to Grow Big.', tone: 'ok' },
  promptText: 'Move with WASD / Arrow keys',
  worldTime: 0,
  lastAutoSaveAt: 0
};

const refs = {
  canvas: document.getElementById('gameCanvas'),
  coinCount: document.getElementById('coinCount'),
  levelCount: document.getElementById('levelCount'),
  xpText: document.getElementById('xpText'),
  upgradeText: document.getElementById('upgradeText'),
  questTitle: document.getElementById('questTitle'),
  questText: document.getElementById('questText'),
  questProgress: document.getElementById('questProgress'),
  crystalCount: document.getElementById('crystalCount'),
  woodCount: document.getElementById('woodCount'),
  decorOwnedCount: document.getElementById('decorOwnedCount'),
  decorSelect: document.getElementById('decorSelect'),
  placeDecorButton: document.getElementById('placeDecorButton'),
  buyUpgradeButton: document.getElementById('buyUpgradeButton'),
  buyDecorButton: document.getElementById('buyDecorButton'),
  trackQuestButton: document.getElementById('trackQuestButton'),
  saveButton: document.getElementById('saveButton'),
  resetButton: document.getElementById('resetButton'),
  statusText: document.getElementById('statusText'),
  interactionPrompt: document.getElementById('interactionPrompt')
};

const ctx = refs.canvas.getContext('2d');
const keys = new Set();

const npc = { x: 880, y: 210, r: 22, name: 'Meadow Guide' };

function setStatus(text, tone = 'ok') {
  state.status.text = text;
  state.status.tone = tone;
  refs.statusText.textContent = text;
  refs.statusText.className = `status${tone === 'ok' ? '' : ` ${tone}`}`;
}

function zoneById(id) {
  return ZONES.find((zone) => zone.id === id);
}

function randomPointInZone(zoneId, margin = 40) {
  const zone = zoneById(zoneId);
  return {
    x: zone.x + margin + Math.random() * (zone.w - margin * 2),
    y: zone.y + margin + Math.random() * (zone.h - margin * 2)
  };
}

function initCollectibles() {
  state.collectibles = [];
  for (let i = 0; i < 7; i += 1) {
    const pos = randomPointInZone('cave', 70);
    state.collectibles.push({ id: `crystal-${i}`, type: 'crystal', x: pos.x, y: pos.y, collected: false, respawnAt: 0 });
  }
  for (let i = 0; i < 6; i += 1) {
    const pos = randomPointInZone('grove', 80);
    state.collectibles.push({ id: `wood-${i}`, type: 'wood', x: pos.x, y: pos.y, collected: false, respawnAt: 0 });
  }
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function insideRect(point, rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
}

function circleRectCollision(x, y, r, rect) {
  const cx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  return (x - cx) ** 2 + (y - cy) ** 2 < r ** 2;
}

function canMoveTo(x, y) {
  const r = state.player.r;
  if (x - r < 0 || y - r < 0 || x + r > WORLD.width || y + r > WORLD.height) {
    return false;
  }
  return !OBSTACLES.some((obstacle) => circleRectCollision(x, y, r, obstacle));
}

function gainXp(amount) {
  state.xp += amount;
  while (state.xp >= state.nextXp) {
    state.xp -= state.nextXp;
    state.level += 1;
    state.nextXp = Math.round(state.nextXp * 1.35);
    setStatus(`Level up! You are now level ${state.level}.`, 'ok');
  }
}

function getCurrentZone() {
  return ZONES.find((zone) => insideRect(state.player, zone))?.id || 'wilds';
}

function saveGame() {
  const saveData = {
    player: state.player,
    coins: state.coins,
    xp: state.xp,
    level: state.level,
    nextXp: state.nextXp,
    upgradeSprint: state.upgradeSprint,
    resources: state.resources,
    decorInventory: state.decorInventory,
    selectedDecor: state.selectedDecor,
    placedDecor: state.placedDecor,
    quest: state.quest,
    collectibles: state.collectibles.map((item) => ({
      id: item.id,
      type: item.type,
      x: item.x,
      y: item.y,
      collected: item.collected,
      respawnAt: item.respawnAt
    }))
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
  state.lastAutoSaveAt = state.worldTime;
}

function loadGame() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    initCollectibles();
    return;
  }

  try {
    const data = JSON.parse(raw);
    Object.assign(state.player, data.player || {});
    state.coins = data.coins ?? state.coins;
    state.xp = data.xp ?? state.xp;
    state.level = data.level ?? state.level;
    state.nextXp = data.nextXp ?? state.nextXp;
    state.upgradeSprint = Boolean(data.upgradeSprint);
    state.resources = { ...state.resources, ...(data.resources || {}) };
    state.decorInventory = { ...state.decorInventory, ...(data.decorInventory || {}) };
    state.selectedDecor = data.selectedDecor || state.selectedDecor;
    state.placedDecor = { ...(data.placedDecor || {}) };
    state.quest = { ...state.quest, ...(data.quest || {}) };
    state.collectibles = Array.isArray(data.collectibles) ? data.collectibles : [];
    if (!state.collectibles.length) {
      initCollectibles();
    }
  } catch {
    initCollectibles();
  }
}

function resetGame() {
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

function handleCollect(item) {
  item.collected = true;
  item.respawnAt = state.worldTime + 18;
  if (item.type === 'crystal') {
    state.resources.crystal += 1;
    state.coins += 12;
    gainXp(10);
    if (state.quest.status === 'active') {
      state.quest.progress = Math.min(state.quest.target, state.quest.progress + 1);
    }
    setStatus('Collected crystal +12 coins +10 XP', 'ok');
  } else {
    state.resources.wood += 1;
    state.coins += 8;
    gainXp(6);
    setStatus('Collected wood +8 coins +6 XP', 'ok');
  }
}

function nearestHomeSlot(maxDistance = 120) {
  let bestIndex = -1;
  let bestDistance = Infinity;
  HOME_SLOTS.forEach((slot, index) => {
    const d = distance(state.player, slot);
    if (d < bestDistance && d <= maxDistance) {
      bestDistance = d;
      bestIndex = index;
    }
  });
  return bestIndex;
}

function placeDecorAtNearestSlot() {
  if (getCurrentZone() !== 'home') {
    setStatus('You can only place decor in Home Base.', 'warn');
    return;
  }
  const slotIndex = nearestHomeSlot();
  if (slotIndex < 0) {
    setStatus('Move closer to a glowing home pad.', 'warn');
    return;
  }
  if (state.placedDecor[slotIndex]) {
    setStatus('That slot is already occupied.', 'warn');
    return;
  }
  const decorId = state.selectedDecor;
  if ((state.decorInventory[decorId] || 0) < 1) {
    setStatus('You do not own the selected decor.', 'bad');
    return;
  }
  state.decorInventory[decorId] -= 1;
  state.placedDecor[slotIndex] = decorId;
  gainXp(12);
  setStatus(`${DECOR_CATALOG.find((d) => d.id === decorId).label} placed!`, 'ok');
  saveGame();
  updateHUD();
}

function interactWithNpc() {
  if (state.quest.status === 'available') {
    state.quest.status = 'active';
    state.quest.text = 'Collect 3 crystals from Crystal Cave, then return to the Meadow Guide.';
    setStatus('Quest accepted: Crystal Call', 'ok');
  } else if (state.quest.status === 'active') {
    if (state.quest.progress >= state.quest.target) {
      state.quest.status = 'completed';
      state.coins += state.quest.reward.coins;
      gainXp(state.quest.reward.xp);
      state.decorInventory[state.quest.reward.unlockDecor] = (state.decorInventory[state.quest.reward.unlockDecor] || 0) + 1;
      setStatus(`Quest complete! +${state.quest.reward.coins} coins and totem unlocked.`, 'ok');
    } else {
      setStatus(`Quest progress ${state.quest.progress}/${state.quest.target}: collect more crystals.`, 'warn');
    }
  } else {
    setStatus('Meadow Guide: Keep growing your home and level up!', 'ok');
  }
  saveGame();
  updateHUD();
}

function handleInteract() {
  if (distance(state.player, npc) <= 74) {
    interactWithNpc();
    return;
  }

  const collectible = state.collectibles.find((item) => !item.collected && distance(state.player, item) <= 38);
  if (collectible) {
    handleCollect(collectible);
    updateHUD();
    saveGame();
    return;
  }

  if (getCurrentZone() === 'home') {
    placeDecorAtNearestSlot();
    return;
  }

  setStatus('Nothing to interact with here.', 'warn');
}

function handleButtons() {
  refs.placeDecorButton.addEventListener('click', placeDecorAtNearestSlot);

  refs.buyUpgradeButton.addEventListener('click', () => {
    if (state.upgradeSprint) {
      setStatus('Sprint upgrade already purchased.', 'warn');
      return;
    }
    if (state.level < 2) {
      setStatus('Reach level 2 to unlock the sprint upgrade.', 'warn');
      return;
    }
    if (state.coins < 80) {
      setStatus('Not enough coins for sprint upgrade.', 'bad');
      return;
    }
    state.coins -= 80;
    state.upgradeSprint = true;
    setStatus('Sprint upgrade purchased! Hold Shift while moving.', 'ok');
    saveGame();
    updateHUD();
  });

  refs.buyDecorButton.addEventListener('click', () => {
    if (state.coins < 45) {
      setStatus('Not enough coins to buy lantern decor.', 'bad');
      return;
    }
    state.coins -= 45;
    state.decorInventory.lantern = (state.decorInventory.lantern || 0) + 1;
    setStatus('Lantern decor bought and added to inventory.', 'ok');
    saveGame();
    updateHUD();
  });

  refs.trackQuestButton.addEventListener('click', () => {
    state.trackQuest = !state.trackQuest;
    refs.trackQuestButton.textContent = state.trackQuest ? 'Tracking quest...' : 'Track quest';
    setStatus(state.trackQuest ? 'Quest tracking enabled.' : 'Quest tracking disabled.', 'ok');
  });

  refs.decorSelect.addEventListener('change', (event) => {
    state.selectedDecor = event.target.value;
    setStatus(`Selected decor: ${DECOR_CATALOG.find((d) => d.id === state.selectedDecor)?.label || state.selectedDecor}`, 'ok');
  });

  refs.saveButton.addEventListener('click', () => {
    saveGame();
    setStatus('Game saved.', 'ok');
  });

  refs.resetButton.addEventListener('click', () => {
    if (confirm('Reset all saved progress?')) {
      resetGame();
    }
  });
}

function setupInput() {
  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", "shift"].includes(key)) {
      event.preventDefault();
      keys.add(key);
    }
    if (key === 'e' && !event.repeat) {
      event.preventDefault();
      handleInteract();
    }
  });

  window.addEventListener('keyup', (event) => {
    keys.delete(event.key.toLowerCase());
  });

  window.addEventListener('beforeunload', () => {
    saveGame();
  });
}

function movePlayer(dt) {
  let dx = 0;
  let dy = 0;
  if (keys.has('w') || keys.has('arrowup')) dy -= 1;
  if (keys.has('s') || keys.has('arrowdown')) dy += 1;
  if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
  if (keys.has('d') || keys.has('arrowright')) dx += 1;

  if (!dx && !dy) return;

  const mag = Math.hypot(dx, dy) || 1;
  const sprint = state.upgradeSprint && keys.has('shift') ? 1.5 : 1;
  const speed = 215 * sprint;
  const nextX = state.player.x + (dx / mag) * speed * dt;
  const nextY = state.player.y + (dy / mag) * speed * dt;

  if (canMoveTo(nextX, state.player.y)) {
    state.player.x = nextX;
  }
  if (canMoveTo(state.player.x, nextY)) {
    state.player.y = nextY;
  }
}

function updateCamera() {
  state.camera.w = refs.canvas.width;
  state.camera.h = refs.canvas.height;

  state.camera.x = state.player.x - state.camera.w / 2;
  state.camera.y = state.player.y - state.camera.h / 2;

  state.camera.x = Math.max(0, Math.min(state.camera.x, WORLD.width - state.camera.w));
  state.camera.y = Math.max(0, Math.min(state.camera.y, WORLD.height - state.camera.h));
}

function updateCollectibleRespawns() {
  for (const item of state.collectibles) {
    if (item.collected && state.worldTime >= item.respawnAt) {
      const zone = item.type === 'crystal' ? 'cave' : 'grove';
      const nextPos = randomPointInZone(zone, 80);
      item.x = nextPos.x;
      item.y = nextPos.y;
      item.collected = false;
    }
  }
}

function updatePrompt() {
  const nearNpc = distance(state.player, npc) <= 80;
  const nearbyCollectible = state.collectibles.some((item) => !item.collected && distance(state.player, item) <= 42);
  const nearSlot = nearestHomeSlot(110) >= 0 && getCurrentZone() === 'home';

  if (nearNpc) {
    state.promptText = 'Press E to talk to Meadow Guide';
  } else if (nearbyCollectible) {
    state.promptText = 'Press E to collect resource';
  } else if (nearSlot) {
    state.promptText = 'Press E to place selected decor';
  } else {
    state.promptText = 'Move with WASD / Arrows · Interact with E · Shift to sprint (after upgrade)';
  }

  refs.interactionPrompt.textContent = state.promptText;
}

function drawZone(zone) {
  ctx.fillStyle = zone.color;
  ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
  ctx.fillStyle = '#ffffff18';
  ctx.fillRect(zone.x, zone.y, zone.w, 22);
  ctx.strokeStyle = '#a6c4e82b';
  ctx.lineWidth = 2;
  ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
  ctx.fillStyle = '#e6f3ff';
  ctx.font = 'bold 20px Inter, sans-serif';
  ctx.fillText(zone.name, zone.x + 14, zone.y + 32);
}

function drawCollectible(item) {
  ctx.beginPath();
  ctx.fillStyle = item.type === 'crystal' ? '#87a8ff' : '#b87c4e';
  ctx.arc(item.x, item.y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '14px sans-serif';
  ctx.fillText(item.type === 'crystal' ? '✦' : '◼', item.x - 5, item.y + 5);
}

function drawHomeSlots() {
  HOME_SLOTS.forEach((slot, index) => {
    ctx.beginPath();
    ctx.arc(slot.x, slot.y, 18, 0, Math.PI * 2);
    ctx.fillStyle = state.placedDecor[index] ? '#4f5f72' : '#97d6ff66';
    ctx.fill();
    ctx.strokeStyle = '#d7f0ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    const decorId = state.placedDecor[index];
    if (decorId) {
      const decor = DECOR_CATALOG.find((entry) => entry.id === decorId);
      ctx.font = '24px sans-serif';
      ctx.fillText(decor?.emoji || '✨', slot.x - 12, slot.y + 9);
    }
  });
}

function drawNpc() {
  ctx.beginPath();
  ctx.fillStyle = '#ffd885';
  ctx.arc(npc.x, npc.y, npc.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3f2a00';
  ctx.font = '14px Inter, sans-serif';
  ctx.fillText('NPC', npc.x - 14, npc.y + 5);
}

function drawPlayer() {
  const bob = Math.sin(state.worldTime * 8) * 1.4;
  ctx.beginPath();
  ctx.fillStyle = '#00000044';
  ctx.ellipse(state.player.x, state.player.y + 19, 17, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = '#7ee9ba';
  ctx.arc(state.player.x, state.player.y + bob, state.player.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#173733';
  ctx.font = 'bold 14px Inter, sans-serif';
  ctx.fillText('You', state.player.x - 13, state.player.y + 5 + bob);
}

function drawQuestMarker() {
  if (!state.trackQuest || state.quest.status === 'completed') return;
  const target = state.quest.status === 'available' || state.quest.status === 'active' && state.quest.progress >= state.quest.target
    ? npc
    : zoneById('cave');
  const tx = target.x + (target.w ? target.w / 2 : 0);
  const ty = target.y + (target.h ? target.h / 2 : 0);
  ctx.strokeStyle = '#ffd96d';
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 6]);
  ctx.beginPath();
  ctx.moveTo(state.player.x, state.player.y);
  ctx.lineTo(tx, ty);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawWorld() {
  ctx.clearRect(0, 0, refs.canvas.width, refs.canvas.height);
  ctx.save();
  ctx.translate(-state.camera.x, -state.camera.y);

  ctx.fillStyle = '#142235';
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  ZONES.forEach(drawZone);

  ctx.fillStyle = '#253246';
  OBSTACLES.forEach((obstacle) => {
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h);
    ctx.strokeStyle = '#89a8d633';
    ctx.strokeRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h);
  });

  drawHomeSlots();
  drawNpc();

  state.collectibles.forEach((item) => {
    if (!item.collected) drawCollectible(item);
  });

  drawQuestMarker();
  drawPlayer();

  ctx.restore();
}

function totalOwnedDecor() {
  return Object.values(state.decorInventory).reduce((sum, value) => sum + value, 0);
}

function updateDecorSelect() {
  const previous = refs.decorSelect.value || state.selectedDecor;
  refs.decorSelect.innerHTML = '';
  DECOR_CATALOG.forEach((decor) => {
    const option = document.createElement('option');
    option.value = decor.id;
    option.textContent = `${decor.emoji} ${decor.label} (${state.decorInventory[decor.id] || 0})`;
    refs.decorSelect.appendChild(option);
  });
  refs.decorSelect.value = state.decorInventory[previous] !== undefined ? previous : DECOR_CATALOG[0].id;
  state.selectedDecor = refs.decorSelect.value;
}

function updateHUD() {
  refs.coinCount.textContent = String(state.coins);
  refs.levelCount.textContent = String(state.level);
  refs.xpText.textContent = `${state.xp} / ${state.nextXp}`;
  refs.upgradeText.textContent = state.upgradeSprint ? 'Sprint unlocked' : 'Locked';
  refs.crystalCount.textContent = String(state.resources.crystal);
  refs.woodCount.textContent = String(state.resources.wood);
  refs.decorOwnedCount.textContent = String(totalOwnedDecor());

  refs.questTitle.textContent = state.quest.title;
  refs.questText.textContent = state.quest.text;
  if (state.quest.status === 'available') {
    refs.questProgress.textContent = 'Available: talk to Meadow Guide';
  } else if (state.quest.status === 'active') {
    refs.questProgress.textContent = `${state.quest.progress}/${state.quest.target} crystals collected`;
  } else {
    refs.questProgress.textContent = 'Completed ✓';
  }

  refs.buyUpgradeButton.textContent = state.upgradeSprint ? 'Sprint Upgrade Purchased' : 'Buy Sprint Upgrade (80 coins)';
  refs.buyUpgradeButton.disabled = state.upgradeSprint;

  updateDecorSelect();
}

function resizeCanvas() {
  const rect = refs.canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  refs.canvas.width = Math.round(rect.width * ratio);
  refs.canvas.height = Math.round(rect.height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  state.camera.w = rect.width;
  state.camera.h = rect.height;
}

let previousTime = 0;
function loop(timestamp) {
  const dt = Math.min(0.033, (timestamp - previousTime) / 1000 || 0);
  previousTime = timestamp;
  state.worldTime += dt;

  movePlayer(dt);
  updateCollectibleRespawns();
  updateCamera();
  updatePrompt();
  drawWorld();

  if (state.worldTime - state.lastAutoSaveAt > 12) {
    saveGame();
  }

  requestAnimationFrame(loop);
}

function boot() {
  loadGame();
  setupInput();
  handleButtons();
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  updateHUD();
  requestAnimationFrame(loop);
}

boot();
