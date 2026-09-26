const furnitureCatalog = [
  { id: 'plant', label: 'Plant', emoji: '🌿', cost: 25, size: { w: 1, h: 1 }, color: '#8be08d' },
  { id: 'bed', label: 'Bed', emoji: '🛏️', cost: 45, size: { w: 2, h: 2 }, color: '#d9a277' },
  { id: 'table', label: 'Table', emoji: '🪵', cost: 35, size: { w: 2, h: 1 }, color: '#c37f57' },
  { id: 'lamp', label: 'Lamp', emoji: '💡', cost: 30, size: { w: 1, h: 1 }, color: '#f3d76d' },
  { id: 'crystal', label: 'Crystal', emoji: '🔮', cost: 50, size: { w: 1, h: 1 }, color: '#9ee2ff' },
  { id: 'sofa', label: 'Sofa', emoji: '🛋️', cost: 60, size: { w: 2, h: 1 }, color: '#a79eff' },
  { id: 'petBed', label: 'Pet bed', emoji: '🐾', cost: 40, size: { w: 2, h: 1 }, color: '#ffb57d' }
];

const state = {
  coins: 180,
  level: 1,
  xp: 0,
  nextXp: 200,
  business: 'Cozy corner',
  visitors: 2,
  homeSize: 6,
  homeItems: [
    { id: 'plant', x: 0, y: 0, w: 1, h: 1, color: '#8be08d' },
    { id: 'lamp', x: 3, y: 0, w: 1, h: 1, color: '#f3d76d' },
    { id: 'bed', x: 1, y: 3, w: 2, h: 2, color: '#d9a277' },
    { id: 'table', x: 4, y: 3, w: 2, h: 1, color: '#c37f57' }
  ],
  selectedFurniture: 'plant',
  buildMode: false,
  pet: { name: 'Mochi', mood: 'Happy', moodValue: 100 },
  quests: [
    {
      id: 'moon-pup',
      title: 'Find the lost Moon Pup',
      text: 'Explore the meadow and rescue the tiny creature hiding behind the glowing flowers.',
      reward: 120,
      progress: 0,
      target: 1,
      complete: false
    },
    {
      id: 'crystal-bloom',
      title: 'Grow the crystal garden',
      text: 'Collect three bright crystals from the bright patch and place them in your home.',
      reward: 180,
      progress: 1,
      target: 3,
      complete: false
    }
  ],
  activeQuestIndex: 0,
  lastExplore: 'Meadow path'
};

const refs = {
  coinCount: document.getElementById('coinCount'),
  levelCount: document.getElementById('levelCount'),
  petName: document.getElementById('petName'),
  petMood: document.getElementById('petMood'),
  petAvatar: document.getElementById('petAvatar'),
  homeRoom: document.getElementById('homeRoom'),
  questTitle: document.getElementById('questTitle'),
  questText: document.getElementById('questText'),
  questReward: document.getElementById('questReward'),
  questProgress: document.getElementById('questProgress'),
  completeQuest: document.getElementById('completeQuest'),
  toggleBuildMode: document.getElementById('toggleBuildMode'),
  shopList: document.getElementById('shopList'),
  homeSizeText: document.getElementById('homeSizeText'),
  businessText: document.getElementById('businessText'),
  visitorText: document.getElementById('visitorText'),
  xpText: document.getElementById('xpText'),
  exploreButton: document.getElementById('exploreButton'),
  restButton: document.getElementById('restButton'),
  shopButton: document.getElementById('shopButton'),
  petButton: document.getElementById('petButton'),
  collectButton: document.getElementById('collectButton')
};

function getSelectedFurnitureData() {
  return furnitureCatalog.find((item) => item.id === state.selectedFurniture) || furnitureCatalog[0];
}

function formatCoins(value) {
  return Intl.NumberFormat('en-US').format(value);
}

function buyFurniture(furnitureId) {
  const item = furnitureCatalog.find((entry) => entry.id === furnitureId);
  if (!item) return;

  if (state.coins < item.cost) {
    alert('Not enough coins yet! Explore or complete a quest.');
    return;
  }

  state.coins -= item.cost;
  state.selectedFurniture = furnitureId;
  state.buildMode = true;
  updateUI();
}

function placeFurnitureAtCell(x, y) {
  const itemData = getSelectedFurnitureData();
  const items = state.homeItems;

  const w = itemData.size.w;
  const h = itemData.size.h;

  const collides = items.some((entry) => {
    return !(x + w <= entry.x || x >= entry.x + entry.w || y + h <= entry.y || y >= entry.y + entry.h);
  });

  if (collides) {
    alert('That space is full. Try another spot.');
    return;
  }

  items.push({
    id: itemData.id,
    x,
    y,
    w,
    h,
    color: itemData.color
  });

  state.business = 'Dream home studio';
  updateUI();
}

function createGridRoom() {
  const room = refs.homeRoom;
  room.innerHTML = '';

  const cellSize = 100 / state.homeSize;

  for (let row = 0; row < state.homeSize; row += 1) {
    for (let col = 0; col < state.homeSize; col += 1) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      cell.style.left = `${col * cellSize}%`;
      cell.style.top = `${row * cellSize}%`;
      cell.style.width = `${cellSize}%`;
      cell.style.height = `${cellSize}%`;
      room.appendChild(cell);
    }
  }

  for (const item of state.homeItems) {
    const piece = document.createElement('div');
    piece.className = 'furniture-item';
    piece.style.left = `${(item.x / state.homeSize) * 100}%`;
    piece.style.top = `${(item.y / state.homeSize) * 100}%`;
    piece.style.width = `${(item.w / state.homeSize) * 100}%`;
    piece.style.height = `${(item.h / state.homeSize) * 100}%`;
    piece.style.background = item.color;
    piece.style.borderRadius = '14px';
    piece.innerHTML = '<span class="emoji">' + (furnitureCatalog.find((entry) => entry.id === item.id)?.emoji || '✨') + '</span>';
    piece.addEventListener('click', () => {
      if (!state.buildMode) return;
      const x = Math.floor((Math.random() * (state.homeSize - item.w + 1)));
      const y = Math.floor((Math.random() * (state.homeSize - item.h + 1)));
      Object.assign(item, { x, y });
      updateUI();
    });
    room.appendChild(piece);
  }

  const petDot = document.createElement('div');
  petDot.className = 'furniture-item';
  petDot.style.left = '58%';
  petDot.style.top = '58%';
  petDot.style.width = '12%';
  petDot.style.height = '12%';
  petDot.style.background = '#ffcf7f';
  petDot.style.zIndex = '10';
  petDot.style.borderRadius = '50%';
  petDot.innerHTML = '<span class="emoji">🐣</span>';
  room.appendChild(petDot);
}

function renderHomeRoom() {
  refs.homeRoom.onclick = function (event) {
    if (!state.buildMode) return;

    const rect = refs.homeRoom.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * state.homeSize);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * state.homeSize);

    if (x >= 0 && y >= 0 && x < state.homeSize && y < state.homeSize) {
      placeFurnitureAtCell(x, y);
    }
  };

  createGridRoom();
}

function updateQuestUI() {
  const quest = state.quests[state.activeQuestIndex];
  if (!quest) return;

  refs.questTitle.textContent = quest.title;
  refs.questText.textContent = quest.text;
  refs.questReward.textContent = `+${quest.reward} coins`;
  refs.questProgress.textContent = `${Math.min(quest.progress, quest.target)}/${quest.target}`;
}

function completeActiveQuest() {
  const quest = state.quests[state.activeQuestIndex];
  if (!quest) return;

  state.coins += quest.reward;
  state.xp += 60;
  quest.complete = true;

  if (state.activeQuestIndex < state.quests.length - 1) {
    state.activeQuestIndex += 1;
  }

  state.business = 'Growing business';
  levelUpIfNeeded();
  updateUI();
}

function levelUpIfNeeded() {
  while (state.xp >= state.nextXp) {
    state.xp -= state.nextXp;
    state.level += 1;
    state.nextXp = Math.round(state.nextXp * 1.5);
    state.visitors += 1;
  }
}

function renderShop() {
  refs.shopList.innerHTML = '';

  furnitureCatalog.forEach((item) => {
    const entry = document.createElement('div');
    entry.className = 'shop-item';
    entry.innerHTML = `
      <div class="left">
        <div class="shop-emoji">${item.emoji}</div>
        <div>
          <strong>${item.label}</strong>
          <p>${item.cost} coins</p>
        </div>
      </div>
      <button type="button">Buy</button>
    `;

    const button = entry.querySelector('button');
    button.addEventListener('click', () => {
      buyFurniture(item.id);
    });

    refs.shopList.appendChild(entry);
  });
}

function updateUI() {
  refs.coinCount.textContent = formatCoins(state.coins);
  refs.levelCount.textContent = String(state.level);
  refs.petName.textContent = state.pet.name;
  refs.petMood.textContent = state.pet.mood;
  refs.homeSizeText.textContent = `${state.homeSize / 2} room`;
  refs.businessText.textContent = state.business;
  refs.visitorText.textContent = `${state.visitors} today`;
  refs.xpText.textContent = `${state.xp} / ${state.nextXp}`;
  refs.toggleBuildMode.textContent = state.buildMode ? 'Place' : 'Build';

  updateQuestUI();
  renderShop();
  renderHomeRoom();
}

refs.toggleBuildMode.addEventListener('click', () => {
  state.buildMode = !state.buildMode;
  refs.toggleBuildMode.textContent = state.buildMode ? 'Place mode' : 'Build';
  refs.toggleBuildMode.classList.toggle('primary', !state.buildMode);
});

refs.exploreButton.addEventListener('click', () => {
  const rewards = [65, 80, 110, 130];
  const gain = rewards[Math.floor(Math.random() * rewards.length)];
  state.coins += gain;
  state.pet.mood = 'Curious';
  state.business = 'Adventure corner';
  state.lastExplore = ['Meadow path', 'Sunset market', 'Mystic cave', 'Cloud bridge'][Math.floor(Math.random() * 4)];
  state.quests[state.activeQuestIndex].progress = Math.min(state.quests[state.activeQuestIndex].progress + 1, state.quests[state.activeQuestIndex].target);
  levelUpIfNeeded();
  updateUI();
});

refs.restButton.addEventListener('click', () => {
  state.pet.mood = 'Relaxed';
  state.coins += 20;
  updateUI();
});

refs.shopButton.addEventListener('click', () => {
  state.buildMode = true;
  updateUI();
});

refs.petButton.addEventListener('click', () => {
  state.pet.mood = 'Joyful';
  state.coins += 15;
  refs.petAvatar.style.transform = 'scale(1.1)';
  setTimeout(() => { refs.petAvatar.style.transform = 'scale(1)'; }, 180);
  updateUI();
});

refs.collectButton.addEventListener('click', () => {
  state.coins += 30;
  state.pet.mood = 'Happy';
  updateUI();
});

refs.completeQuest.addEventListener('click', completeActiveQuest);

updateUI();
