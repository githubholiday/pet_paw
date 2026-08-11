/* ===== App State ===== */
const STORAGE_KEY = 'pet-app-state';
const PASSWORD_KEY = 'parent-password';

function getParentPassword() {
  return localStorage.getItem(PASSWORD_KEY) || '1234';
}

/* ===== Version & Config (升级与调参集中管理) ===== */
const APP_VERSION = '2.0.0';      // 产品版本号（显示在"关于"）
const SCHEMA_VERSION = 5;         // 数据架构版本（localStorage 结构）；升级结构时 +1

// 照顾宠物的花费（金币）——集中管理，方便平衡调整
const COSTS = { feed: 10, bath: 8, play: 12, walk: 15 };

// 照顾宠物对各状态的影响（±数值，范围 0~100）——集中管理
const PET_EFFECTS = {
  feed: { hunger: 20,  mood: 5,   clean: 0,   energy: 0   },
  bath: { hunger: 0,   mood: 5,   clean: 25,  energy: 0   },
  play: { hunger: 0,   mood: 20,  clean: 0,   energy: -15 },
  walk: { hunger: -10, mood: 25,  clean: -10, energy: -20 },
};
const TASK_MOOD_BONUS = 5;         // 完成任务额外心情加成

// 单条数据字段默认值（用于旧数据补全，保证升级后不缺字段）
const TASK_FIELDS = { emoji: '📝', points: 10, coins: 5, completed: false };
const PRODUCT_FIELDS = { emoji: '🎁', price: 50, stock: 5, category: '玩具' };

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

/* ===== Pet Level ===== */
// 等级曲线：每级所需任务数递增，前期快后期慢
function computePetLevel(totalTasks) {
  return Math.floor(Math.sqrt(totalTasks)) + 1;
}

// 把一次照顾操作应用到宠物状态
function applyPetEffects(effects) {
  const p = state.pet;
  if (effects.hunger) p.hunger = clamp(p.hunger + effects.hunger, 0, 100);
  if (effects.clean)  p.clean  = clamp(p.clean + effects.clean, 0, 100);
  if (effects.mood)   p.mood   = clamp(p.mood + effects.mood, 0, 100);
  if (effects.energy) p.energy = clamp(p.energy + effects.energy, 0, 100);
}

/* ===== 数据迁移：旧版本 localStorage → 当前结构 =====
   未来改了数据结构（增删字段 / 改名 / 改类型）时，在此按版本号逐级升级。
   简单的新增字段靠下方 loadState 的默认值合并即可；结构性变动才需写迁移。 */
function migrateState(parsed) {
  if (!parsed || typeof parsed !== 'object') return JSON.parse(JSON.stringify(DEFAULT_STATE));
  const data = parsed;
  const v = data.schemaVersion || 0;   // 0 = 早期无版本数据
  // —— 升级模板（未来启用，示例）——
  // if (v < 2) { /* 例如给 pet 增加 happiness 字段 */ data.schemaVersion = 2; }
  if (v < 3) {
    data.totalDays = data.totalDays || 0;
    data.lastCompletedDate = data.lastCompletedDate || '';
    data.schemaVersion = 3;
  }
  if (v < 4) {
    data.taskHistory = Array.isArray(data.taskHistory) ? data.taskHistory : [];
    data.schemaVersion = 4;
  }
  // v5：默认商店内容升级为家庭激励券（冰淇淋券 / 陪伴券 / 外出吃饭券 等）
  if (v < 5) {
    const LEGACY_PRODUCT_NAMES = ['小汽车玩具','拼图套装','故事书','冰淇淋券','动物园门票','绘本套装'];
    const isLegacyDefaultStore = Array.isArray(data.products)
      && data.products.length === LEGACY_PRODUCT_NAMES.length
      && LEGACY_PRODUCT_NAMES.every(n => data.products.some(p => p.name === n));
    if (isLegacyDefaultStore) {
      // 仅当商店仍为出厂默认（未被家长自定义）时才整体替换，避免覆盖真实定制数据
      data.products = DEFAULT_PRODUCTS.map(p => ({ ...p }));
      data.nextProductId = Math.max(data.nextProductId || 0, DEFAULT_PRODUCTS.length + 1);
    }
    data.schemaVersion = 5;
  }
  data.schemaVersion = SCHEMA_VERSION;
  return data;
}

let passwordInput = '';
let setupStep = 0;    // 0 = set password, 1 = confirm
let setupFirst = '';  // first entered password during setup

const EMOJIS = ['📝','📖','🎹','🧹','🎨','🏃','🎻','✏️','🔬','🧮','📐','🎯','🌟','💪','🎵','🖍️','📸','🎮','🧩','🚲','🍳','🧹','🌱','💧'];

const PRODUCT_EMOJIS = ['🚗','🧩','📚','🍦','🦁','🎨','🧸','⚽','🖍️','🎭','📦','🎪','🍭','🎡','🪁','🎸','🍰','🐻','🎬','🧲','🖼️','🎲','🛴','📱','🍽️','🗺️','👪','📅','🍴','💰'];

const DEFAULT_PRODUCTS = [
  { id: 1, name: '冰淇淋券', emoji: '🍦', price: 10, stock: 30, category: '零食' },
  { id: 2, name: '自助午餐/晚餐券（提前一天兑换）', emoji: '🍽️', price: 15, stock: 20, category: '体验券' },
  { id: 3, name: '寻宝游戏', emoji: '🗺️', price: 15, stock: 20, category: '体验券' },
  { id: 4, name: '爸爸妈妈30分钟专属陪伴券', emoji: '👪', price: 10, stock: 30, category: '陪伴' },
  { id: 5, name: '周末自主安排券', emoji: '📅', price: 20, stock: 20, category: '体验券' },
  { id: 6, name: '外出吃饭券', emoji: '🍴', price: 40, stock: 10, category: '体验券' },
  { id: 7, name: '兑换5元钱', emoji: '💰', price: 10, stock: 30, category: '奖励' },
];

const DEFAULT_TASKS = [
  { id: 1, name: '叫叫阅读', emoji: '📖', points: 1, coins: 5, completed: false },
  { id: 2, name: '口算练习', emoji: '🧮', points: 1, coins: 5, completed: false },
  { id: 3, name: '古诗背诵', emoji: '📜', points: 1, coins: 5, completed: false },
  { id: 4, name: '整理玩具和书桌', emoji: '🧹', points: 1, coins: 5, completed: false },
];

const DEFAULT_STATE = {
  schemaVersion: SCHEMA_VERSION,
  pet: {
    name: '小宠', emoji: '🐱',
    hunger: 75, clean: 85, mood: 80, energy: 70,
    lastUpdate: Date.now(),
  },
  points: 120, coins: 100,
  streak: 7, streakDate: new Date().toDateString(),
  tasks: DEFAULT_TASKS,
  products: DEFAULT_PRODUCTS,
  exchanges: [
    { id: 'EX20260803', product: '爸爸妈妈30分钟专属陪伴券', emoji: '👪', points: 10, date: '2026-08-03', status: 'verified' },
    { id: 'EX20260804', product: '冰淇淋券', emoji: '🍦', points: 10, date: '2026-08-04', status: 'pending' },
    { id: 'EX20260805', product: '外出吃饭券', emoji: '🍴', points: 40, date: '2026-08-04', status: 'pending' },
  ],
  stats: { totalTasks: 42, totalPoints: 320, totalCoins: 180 },
  parentMode: false,
  lastTaskDate: new Date().toDateString(),
  totalDays: 1,
  lastCompletedDate: '',
  taskHistory: [],   // 每日完成快照: [{ date, taskNames: ['数学作业','阅读'], points, coins }]
  nextTaskId: 5,
  nextProductId: 8,
  profile: { name: '小图', avatar: '' },
};

let state = loadState();
let currentEditTaskId = null;
let currentEditProductId = null;

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = migrateState(JSON.parse(saved));
      return {
        ...DEFAULT_STATE,
        ...data,
        pet: { ...DEFAULT_STATE.pet, ...data.pet },
        profile: { ...DEFAULT_STATE.profile, ...(data.profile || {}) },
        stats: { ...DEFAULT_STATE.stats, ...data.stats },
        tasks: Array.isArray(data.tasks) && data.tasks.length
          ? data.tasks.map(t => ({ ...TASK_FIELDS, ...t }))
          : DEFAULT_TASKS.map(t => ({ ...t })),
        products: Array.isArray(data.products) && data.products.length
          ? data.products.map(p => ({ ...PRODUCT_FIELDS, ...p }))
          : DEFAULT_PRODUCTS.map(p => ({ ...p })),
        exchanges: Array.isArray(data.exchanges) ? data.exchanges : [],
      };
    }
  } catch (e) { console.error('Load error:', e); }
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
}

/* ===== Factory Reset (恢复出厂设置 = 回到首次安装状态) =====
   清空 localStorage 后刷新页面：checkFirstRun 发现无密码 → 重新走首次设密码流程；
   loadState 发现无数据 → 自动载入 DEFAULT_STATE（默认任务/商品/宠物，0 积分金币）。
   等价于把当前设备还原成刚装好的样子，常用于换孩子/清测试数据。 */
function resetAllData() {
  if (!state.parentMode) {
    showToast('请先开启家长模式');
    return;
  }
  if (!confirm(
    '确定要恢复出厂设置吗？\n\n'
    + '将清空全部数据：任务、商品、宠物状态、积分、金币、兑换记录，\n'
    + '并需要重新设置家长密码。\n\n'
    + '此操作不可撤销，建议先「导出备份」再操作。'
  )) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PASSWORD_KEY);
  } catch (e) {}
  location.reload();
}

/* ===== Status Decay & Daily Reset ===== */
function applyDecay() {
  const now = Date.now();
  const elapsed = (now - state.pet.lastUpdate) / 1000;
  if (elapsed < 60) return;
  const decay = Math.floor(elapsed / 600);
  if (decay > 0) {
    state.pet.hunger = Math.max(0, state.pet.hunger - decay);
    state.pet.clean = Math.max(0, state.pet.clean - decay);
    state.pet.mood = Math.max(0, state.pet.mood - decay);
    state.pet.energy = Math.min(100, state.pet.energy + Math.floor(decay / 2));
    state.pet.lastUpdate = now;
    saveState();
  }
}

function checkDailyReset() {
  const today = new Date().toDateString();
  if (state.lastTaskDate !== today) {
    // 快照：把昨天完成的任务记录到历史
    const completedToday = state.tasks.filter(t => t.completed);
    if (completedToday.length > 0) {
      const dayPoints = completedToday.reduce((s, t) => s + t.points, 0);
      const dayCoins = completedToday.reduce((s, t) => s + t.coins, 0);
      state.taskHistory.push({
        date: state.lastTaskDate,
        taskNames: completedToday.map(t => t.name),
        points: dayPoints,
        coins: dayCoins,
        count: completedToday.length,
      });
      // 保留最近 90 天
      if (state.taskHistory.length > 90) {
        state.taskHistory = state.taskHistory.slice(-90);
      }
    }
    state.tasks.forEach(t => t.completed = false);
    state.lastTaskDate = today;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (state.streakDate !== yesterday && state.streakDate !== today) {
      state.streak = 0;
    }
    saveState();
  }
}

/* ===== Password / Parent Mode ===== */
function toggleParentMode() {
  if (state.parentMode) {
    exitParentMode();
    return;
  }
  passwordInput = '';
  updatePasswordDots();
  document.getElementById('password-popup').classList.add('show');
}

function inputPassword(char) {
  if (char === 'delete') {
    passwordInput = passwordInput.slice(0, -1);
  } else if (passwordInput.length < 4) {
    passwordInput += char;
  }
  updatePasswordDots();

  if (passwordInput.length === 4) {
    if (passwordInput === getParentPassword()) {
      state.parentMode = true;
      saveState();
      closePopup('password-popup');
      document.getElementById('parent-bar').classList.add('show');
      document.getElementById('parent-toggle').classList.add('on');
      document.getElementById('parent-mode-text').textContent = '已开启';
      refreshAll();
      showToast('✅ 已进入家长模式');
    } else {
      passwordInput = '';
      updatePasswordDots();
      document.getElementById('password-popup').querySelector('.popup-card').animate([
        { transform: 'translateX(0)' },
        { transform: 'translateX(-8px)' },
        { transform: 'translateX(8px)' },
        { transform: 'translateX(0)' }
      ], { duration: 300 });
      showToast('❌ 密码错误，请重试');
    }
  }
}

function updatePasswordDots() {
  const dots = document.querySelectorAll('#password-dots .password-dot');
  dots.forEach((d, i) => d.classList.toggle('filled', i < passwordInput.length));
}

function exitParentMode() {
  state.parentMode = false;
  saveState();
  document.getElementById('parent-bar').classList.remove('show');
  document.getElementById('parent-toggle').classList.remove('on');
  document.getElementById('parent-mode-text').textContent = '未开启';
  refreshAll();
  showToast('已退出家长模式');
}

/* ===== First-Time Setup Flow ===== */
function checkFirstRun() {
  if (!localStorage.getItem(PASSWORD_KEY)) {
    startSetup();
    return false;
  }
  return true;
}

function startSetup() {
  setupStep = 0;
  setupFirst = '';
  document.getElementById('setup-screen').classList.add('show');
  updateSetupUI();
}

function updateSetupUI() {
  const title = document.getElementById('setup-title');
  const desc = document.getElementById('setup-desc');
  const error = document.getElementById('setup-error');
  const dots = document.querySelectorAll('#setup-dots .password-dot');

  if (setupStep === 0) {
    title.textContent = '设置家长密码';
    desc.textContent = '请输入一个4位数字密码，用于管理任务和商店';
    error.textContent = '';
    dots.forEach(d => d.classList.remove('filled'));
  } else if (setupStep === 1) {
    title.textContent = '再次确认密码';
    desc.textContent = '请再次输入相同的4位数字密码';
    error.textContent = '';
    dots.forEach(d => d.classList.remove('filled'));
  }
}

function setupInput(char) {
  if (char === 'delete') {
    passwordInput = passwordInput.slice(0, -1);
  } else if (passwordInput.length < 4) {
    passwordInput += char;
  }
  updateSetupDots();

  if (passwordInput.length === 4) {
    if (setupStep === 0) {
      // Step 1: save first entry, move to confirmation
      setupFirst = passwordInput;
      passwordInput = '';
      setupStep = 1;
      updateSetupUI();
    } else if (setupStep === 1) {
      // Step 2: compare
      if (passwordInput === setupFirst) {
        // Match! Save password and proceed
        localStorage.setItem(PASSWORD_KEY, passwordInput);
        passwordInput = '';
        setupStep = 0;
        setupFirst = '';
        document.getElementById('setup-screen').classList.remove('show');
        showToast('✅ 密码设置成功！');
        init(); // now that password is set, initialize the app
      } else {
        // Mismatch — back to step 1
        document.getElementById('setup-error').textContent = '两次密码不一致，请重新设置';
        document.getElementById('setup-desc').textContent = '输入的密码与第一次不同，请重新开始';
        passwordInput = '';
        setupStep = 0;
        updateSetupDots();
        // Shake animation
        const card = document.getElementById('setup-card');
        if (card) {
          card.classList.add('shake');
          setTimeout(() => card.classList.remove('shake'), 400);
        }
      }
    }
  }
}

function updateSetupDots() {
  const dots = document.querySelectorAll('#setup-dots .password-dot');
  dots.forEach((d, i) => d.classList.toggle('filled', i < passwordInput.length));
}

/* ===== Task Editor ===== */
function openTaskEditor(taskId) {
  currentEditTaskId = taskId || null;
  const popup = document.getElementById('task-edit-popup');
  const title = document.getElementById('task-edit-title');
  const deleteBtn = document.getElementById('task-delete-btn');

  // Emoji grid
  const grid = document.getElementById('task-emoji-grid');
  grid.innerHTML = EMOJIS.map(e => `<button class="emoji-item" onclick="selectTaskEmoji('${e}', this)">${e}</button>`).join('');

  if (taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;
    title.textContent = '编辑任务';
    document.getElementById('task-name-input').value = task.name;
    document.getElementById('task-points-input').value = task.points;
    document.getElementById('task-coins-input').value = task.coins;
    deleteBtn.style.display = 'block';

    // Select current emoji
    const emojiBtns = grid.querySelectorAll('.emoji-item');
    emojiBtns.forEach(b => { if (b.textContent === task.emoji) b.classList.add('selected'); });
  } else {
    title.textContent = '添加新任务';
    document.getElementById('task-name-input').value = '';
    document.getElementById('task-points-input').value = '10';
    document.getElementById('task-coins-input').value = '5';
    deleteBtn.style.display = 'none';
    grid.querySelector('.emoji-item')?.classList.add('selected');
  }
  popup.classList.add('show');
}

let selectedTaskEmoji = '📝';
function selectTaskEmoji(emoji, btn) {
  selectedTaskEmoji = emoji;
  document.querySelectorAll('#task-emoji-grid .emoji-item').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

function saveTask() {
  const name = document.getElementById('task-name-input').value.trim();
  const points = parseInt(document.getElementById('task-points-input').value) || 1;
  const coins = parseInt(document.getElementById('task-coins-input').value) || 0;
  if (!name) { showToast('请输入任务名称'); return; }

  // Get selected emoji
  const selectedBtn = document.querySelector('#task-emoji-grid .emoji-item.selected');
  const emoji = selectedBtn ? selectedBtn.textContent : '📝';

  if (currentEditTaskId) {
    const task = state.tasks.find(t => t.id === currentEditTaskId);
    if (task) {
      task.name = name;
      task.emoji = emoji;
      task.points = points;
      task.coins = coins;
    }
  } else {
    state.tasks.push({
      id: state.nextTaskId++,
      name, emoji, points, coins, completed: false,
    });
  }

  saveState();
  closePopup('task-edit-popup');
  currentEditTaskId = null;
  refreshAll();
  showToast('✅ 任务已保存');
}

function deleteTask() {
  if (!currentEditTaskId) return;
  state.tasks = state.tasks.filter(t => t.id !== currentEditTaskId);
  saveState();
  closePopup('task-edit-popup');
  currentEditTaskId = null;
  refreshAll();
  showToast('🗑️ 任务已删除');
}

/* ===== Product Editor ===== */
function openProductEditor(productId) {
  currentEditProductId = productId || null;
  const popup = document.getElementById('product-edit-popup');
  const title = document.getElementById('product-edit-title');
  const deleteBtn = document.getElementById('product-delete-btn');

  const grid = document.getElementById('product-emoji-grid');
  grid.innerHTML = PRODUCT_EMOJIS.map(e => `<button class="emoji-item" onclick="selectProductEmoji('${e}', this)">${e}</button>`).join('');

  if (productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    title.textContent = '编辑商品';
    document.getElementById('product-name-input').value = product.name;
    document.getElementById('product-price-input').value = product.price;
    document.getElementById('product-stock-input').value = product.stock;
    document.getElementById('product-category-input').value = product.category;
    deleteBtn.style.display = 'block';

    grid.querySelectorAll('.emoji-item').forEach(b => {
      if (b.textContent === product.emoji) b.classList.add('selected');
    });
  } else {
    title.textContent = '上架新商品';
    document.getElementById('product-name-input').value = '';
    document.getElementById('product-price-input').value = '50';
    document.getElementById('product-stock-input').value = '5';
    document.getElementById('product-category-input').value = '玩具';
    deleteBtn.style.display = 'none';
    grid.querySelector('.emoji-item')?.classList.add('selected');
  }
  popup.classList.add('show');
}

let selectedProductEmoji = '🚗';
function selectProductEmoji(emoji, btn) {
  selectedProductEmoji = emoji;
  document.querySelectorAll('#product-emoji-grid .emoji-item').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

function saveProduct() {
  const name = document.getElementById('product-name-input').value.trim();
  const price = parseInt(document.getElementById('product-price-input').value) || 1;
  const stock = parseInt(document.getElementById('product-stock-input').value) || 0;
  const category = document.getElementById('product-category-input').value;
  if (!name) { showToast('请输入商品名称'); return; }

  const selectedBtn = document.querySelector('#product-emoji-grid .emoji-item.selected');
  const emoji = selectedBtn ? selectedBtn.textContent : '🎁';

  if (currentEditProductId) {
    const product = state.products.find(p => p.id === currentEditProductId);
    if (product) {
      product.name = name;
      product.emoji = emoji;
      product.price = price;
      product.stock = stock;
      product.category = category;
    }
  } else {
    state.products.push({
      id: state.nextProductId++,
      name, emoji, price, stock, category,
    });
  }

  // Re-render category tabs
  renderCategoryTabs();
  saveState();
  closePopup('product-edit-popup');
  currentEditProductId = null;
  refreshAll();
  showToast('✅ 商品已保存');
}

function deleteProduct() {
  if (!currentEditProductId) return;
  state.products = state.products.filter(p => p.id !== currentEditProductId);
  saveState();
  closePopup('product-edit-popup');
  currentEditProductId = null;
  refreshAll();
  showToast('🗑️ 商品已删除');
}

/* ===== Tab Navigation ===== */
function switchTab(tabName) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
  const page = document.getElementById('page-' + tabName);
  const tab = document.querySelector(`.tab-item[data-tab="${tabName}"]`);
  if (page) page.classList.add('active');
  if (tab) tab.classList.add('active');
  if (tabName === 'home') renderHome();
  if (tabName === 'tasks') renderTasks();
  if (tabName === 'shop') { renderCategoryTabs(); renderShop(); }
  if (tabName === 'profile') renderProfile();
  if (page) page.scrollTop = 0;
}

/* ===== Render: Home ===== */
function renderHome() {
  document.getElementById('home-points').textContent = state.points;
  document.getElementById('home-coins').textContent = state.coins;
  const moodAvg = (state.pet.hunger + state.pet.clean + state.pet.mood + state.pet.energy) / 4;
  const moods = ['我需要照顾...', '有点不舒服...', '还可以吧~', '心情不错~', '超级开心！'];
  const moodIdx = Math.min(Math.floor(moodAvg / 25), 4);
  document.getElementById('pet-mood').textContent = moods[moodIdx];
  document.getElementById('pet-name').textContent = state.pet.name;
  document.getElementById('pet-level').textContent = 'Lv.' + computePetLevel(state.stats.totalTasks);
  updateStatusBar('hunger', state.pet.hunger, '#FF8C7A');
  updateStatusBar('clean', state.pet.clean, '#6BB6E0');
  updateStatusBar('mood', state.pet.mood, '#FFC857');
  updateStatusBar('energy', state.pet.energy, '#7BB56A');
  const completed = state.tasks.filter(t => t.completed).length;
  document.getElementById('home-task-count').textContent = `${completed}/${state.tasks.length}`;
  document.getElementById('home-task-points').textContent = '+' + state.tasks.filter(t => t.completed).reduce((s, t) => s + t.points, 0) + ' 积分';
  document.getElementById('streak-num').textContent = state.streak;
  const dots = document.getElementById('streak-dots');
  dots.innerHTML = '';
  for (let i = 0; i < 7; i++) {
    const d = document.createElement('div');
    d.className = 'streak-dot' + (i < state.streak ? ' active' : '');
    dots.appendChild(d);
  }
}

function updateStatusBar(id, value, color) {
  const fill = document.getElementById(`bar-${id}-fill`);
  const text = document.getElementById(`bar-${id}-percent`);
  if (fill) { fill.style.width = value + '%'; fill.style.background = color; }
  if (text) text.textContent = Math.round(value) + '%';
}

/* ===== Render: Tasks ===== */
function renderTasks() {
  document.getElementById('task-points').textContent = state.points;
  const list = document.getElementById('task-list');
  list.innerHTML = '';
  const showEdit = state.parentMode;

  state.tasks.forEach(task => {
    const item = document.createElement('div');
    item.className = 'task-item' + (task.completed ? ' completed' : '');
    item.innerHTML = `
      <div class="task-icon">${task.completed ? '✓' : task.emoji}</div>
      <div class="task-body">
        <div class="task-name">${task.name}</div>
        <div class="task-rewards">
          <span class="task-reward points">⭐ +${task.points} 积分</span>
          <span class="task-reward coins">🪙 +${task.coins} 金币</span>
        </div>
      </div>
      ${task.completed
        ? (showEdit ? `<div class="task-edit-controls">
            <button class="edit-icon-btn edit" onclick="openTaskEditor(${task.id})" title="编辑">✏️</button>
            <button class="edit-icon-btn delete" onclick="deleteTaskById(${task.id})" title="删除">🗑️</button>
           </div><div class="task-check">✓</div>` : '<div class="task-check">✓</div>')
        : (showEdit
          ? `<div class="task-edit-controls">
              <button class="edit-icon-btn edit" onclick="openTaskEditor(${task.id})" title="编辑">✏️</button>
              <button class="edit-icon-btn delete" onclick="deleteTaskById(${task.id})" title="删除">🗑️</button>
             </div><button class="task-btn pending" onclick="completeTask(${task.id})">打卡</button>`
          : `<button class="task-btn pending" onclick="completeTask(${task.id})">打卡</button>`)
      }
    `;
    list.appendChild(item);
  });

  document.getElementById('add-task-btn').style.display = showEdit ? 'flex' : 'none';

  const completed = state.tasks.filter(t => t.completed).length;
  document.getElementById('summary-completed').textContent = `${completed}/${state.tasks.length}`;
  document.getElementById('summary-points').textContent = state.tasks.filter(t => t.completed).reduce((s, t) => s + t.points, 0);
  document.getElementById('summary-coins').textContent = state.tasks.filter(t => t.completed).reduce((s, t) => s + t.coins, 0);
  document.getElementById('summary-days').textContent = state.totalDays || 0;
}

function deleteTaskById(taskId) {
  if (!confirm('确定要删除这个任务吗？')) return;
  state.tasks = state.tasks.filter(t => t.id !== taskId);
  saveState();
  renderTasks();
}

/* ===== Render: Shop ===== */
let currentCategory = '全部';

function renderCategoryTabs() {
  const tabs = document.getElementById('category-tabs');
  const allCats = ['全部', ...new Set(state.products.map(p => p.category))];
  tabs.innerHTML = allCats.map((cat, i) => `
    <button class="cat-tab${cat === currentCategory ? ' active' : ''}" onclick="filterCategory('${cat}')">${cat}</button>
  `).join('');
}

function renderShop() {
  document.getElementById('shop-points').textContent = state.points;
  document.getElementById('add-product-btn').style.display = state.parentMode ? 'flex' : 'none';

  const grid = document.getElementById('product-grid');
  grid.innerHTML = '';

  const filtered = currentCategory === '全部'
    ? state.products
    : state.products.filter(p => p.category === currentCategory);

  filtered.forEach(product => {
    const canAfford = state.points >= product.price && product.stock > 0;
    const card = document.createElement('div');
    const stockClass = product.stock <= 3 && product.stock > 0 ? ' low' : '';
    const stockText = product.stock === 0 ? '已兑换' : `库存 ${product.stock}`;

    card.className = 'product-card' + (!canAfford && !state.parentMode ? ' disabled' : '');
    card.style.position = 'relative';
    card.innerHTML = `
      ${state.parentMode ? `
        <div class="product-edit-overlay">
          <button class="edit-icon-btn edit" onclick="openProductEditor(${product.id})" title="编辑">✏️</button>
          <button class="edit-icon-btn delete" onclick="deleteProductById(${product.id})" title="删除">🗑️</button>
        </div>
      ` : ''}
      <div class="product-img">${product.emoji}</div>
      <div class="product-info">
        <div class="product-name">${product.name}</div>
        <div class="product-meta">
          <span class="product-price">⭐ ${product.price}</span>
          <span class="product-stock${stockClass}">${stockText}</span>
        </div>
        ${state.parentMode
          ? `<button class="exchange-btn disabled">家长模式</button>`
          : `<button class="exchange-btn ${canAfford ? 'available' : 'disabled'}"
              ${canAfford ? `onclick="exchangeProduct(${product.id})"` : 'disabled'}>
              ${product.stock === 0 ? '已兑换' : canAfford ? '兑换' : '积分不足'}
            </button>`
        }
      </div>
    `;
    grid.appendChild(card);
  });
}

function filterCategory(cat) {
  currentCategory = cat;
  renderCategoryTabs();
  renderShop();
}

function deleteProductById(productId) {
  if (!confirm('确定要下架这个商品吗？')) return;
  state.products = state.products.filter(p => p.id !== productId);
  saveState();
  renderCategoryTabs();
  renderShop();
}

/* ===== Render: Profile ===== */
function renderProfile() {
  document.getElementById('profile-name').textContent = state.profile.name || '小图';
  const lv = computePetLevel(state.stats.totalTasks);
  document.getElementById('profile-level').textContent = `Lv.${lv} 宠物达人`;
  renderProfileAvatar();
  document.getElementById('stat-tasks').textContent = state.stats.totalTasks;
  document.getElementById('stat-points').textContent = state.stats.totalPoints;
  document.getElementById('stat-coins').textContent = state.stats.totalCoins;

  // 现有余额（扣除兑换和使用后的净额）
  document.getElementById('stat-available-points').textContent = state.points;
  document.getElementById('stat-available-coins').textContent = state.coins;

  // Exchange history (最多显示3条，其余折叠)
  const histList = document.getElementById('history-list');
  histList.innerHTML = '';
  const allExchanges = state.exchanges.slice().reverse();
  if (allExchanges.length === 0) {
    histList.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-light);font-size:14px;">还没有兑换记录哦~</div>';
  } else {
    const showToggle = allExchanges.length > 3;
    const wasExpanded = histList.dataset.expanded === 'true';
    const visible = wasExpanded ? allExchanges : allExchanges.slice(0, 3);

    const container = document.createElement('div');
    container.className = 'history-inner';
    visible.forEach(ex => {
      const item = document.createElement('div');
      item.className = 'history-item';
      const isPending = ex.status === 'pending';
      const canVerify = isPending && state.parentMode;
      item.innerHTML = `
        <div class="history-icon" style="background:${isPending ? 'var(--yellow-soft)' : 'var(--green-soft)'}">${ex.emoji || '🎁'}</div>
        <div class="history-body">
          <div class="history-name">${ex.product}</div>
          <div class="history-date">${ex.date} · ${ex.id}</div>
        </div>
        <div class="history-points">-${ex.points}积分</div>
        ${canVerify
          ? `<button class="verify-btn" onclick="verifyExchange('${ex.id}')">核销</button>`
          : `<span class="history-status ${ex.status}">${isPending ? '待核销' : '已核销'}</span>`
        }
      `;
      container.appendChild(item);
    });
    histList.appendChild(container);

    if (showToggle) {
      const toggle = document.createElement('div');
      toggle.className = 'history-expand';
      toggle.textContent = wasExpanded ? '收起 ▲' : `展开全部 (${allExchanges.length}条) ▼`;
      toggle.onclick = function() {
        histList.dataset.expanded = wasExpanded ? 'false' : 'true';
        renderProfile();
      };
      histList.appendChild(toggle);
    } else {
      histList.dataset.expanded = 'false';
    }
  }

  // Settings
  document.getElementById('parent-toggle').classList.toggle('on', state.parentMode);
  document.getElementById('parent-mode-text').textContent = state.parentMode ? '已开启' : '未开启';

  // Pending verification section
  renderPendingSection();
}

/* ===== Profile: avatar & nickname ===== */
function renderProfileAvatar() {
  const img = document.getElementById('profile-avatar-img');
  const emoji = document.getElementById('profile-avatar-emoji');
  if (!img || !emoji) return;
  if (state.profile.avatar) {
    img.src = state.profile.avatar;
    img.style.display = 'block';
    emoji.style.display = 'none';
  } else {
    img.style.display = 'none';
    emoji.style.display = 'flex';
    emoji.textContent = '👦';
  }
}

function openProfileEditor() {
  document.getElementById('profile-name-input').value = state.profile.name || '';
  const eImg = document.getElementById('profile-edit-avatar-img');
  const eEmoji = document.getElementById('profile-edit-avatar-emoji');
  if (state.profile.avatar) {
    eImg.src = state.profile.avatar;
    eImg.style.display = 'block';
    eEmoji.style.display = 'none';
  } else {
    eImg.style.display = 'none';
    eEmoji.style.display = 'flex';
  }
  document.getElementById('profile-edit-popup').classList.add('show');
}

function saveProfile() {
  const name = document.getElementById('profile-name-input').value.trim();
  if (!name) { showToast('昵称不能为空'); return; }
  state.profile.name = name.slice(0, 12);
  saveState();
  closePopup('profile-edit-popup');
  renderProfile();
  showToast('✅ 资料已保存');
}

function triggerAvatarUpload() {
  const input = document.getElementById('avatar-file');
  if (input) input.click();
}

function handleAvatarFile(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  resizeImageToDataURL(file, 256, (dataUrl) => {
    if (!dataUrl) { showToast('❌ 图片读取失败'); input.value = ''; return; }
    state.profile.avatar = dataUrl;
    saveState();
    renderProfile();
    // 同步刷新编辑弹窗里的预览
    const eImg = document.getElementById('profile-edit-avatar-img');
    const eEmoji = document.getElementById('profile-edit-avatar-emoji');
    if (eImg) { eImg.src = dataUrl; eImg.style.display = 'block'; }
    if (eEmoji) eEmoji.style.display = 'none';
    showToast('✅ 头像已更新');
    input.value = '';
  });
}

// 把上传的图片压缩到最大边 maxSize，转成 dataURL 存进 localStorage（避免体积过大）
function resizeImageToDataURL(file, maxSize, cb) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      try { cb(canvas.toDataURL('image/jpeg', 0.85)); }
      catch (e) { cb(null); }
    };
    img.onerror = () => cb(null);
    img.src = reader.result;
  };
  reader.onerror = () => cb(null);
  reader.readAsDataURL(file);
}

function renderPendingSection() {
  const pending = state.exchanges.filter(e => e.status === 'pending');
  const badge = document.getElementById('pending-count-badge');
  const countText = document.getElementById('pending-count-text');
  const list = document.getElementById('pending-list');

  badge.textContent = pending.length;
  countText.textContent = pending.length + '件待核销商品';

  list.innerHTML = '';
  if (pending.length === 0) {
    list.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-light);font-size:13px;">暂无待核销商品~</div>';
  } else {
    pending.forEach(ex => {
      list.innerHTML += `
        <div class="pending-item">
          <div class="pending-item-icon">${ex.emoji}</div>
          <div class="pending-item-body">
            <div class="pending-item-name">${ex.product}</div>
            <div class="pending-item-date">${ex.date} · <span class="pending-item-code">${ex.id}</span></div>
          </div>
          <span class="pending-item-action" onclick="viewPendingDetail('${ex.id}')">查看 ›</span>
        </div>
      `;
    });
  }
}

function viewPendingDetail(exId) {
  const ex = state.exchanges.find(e => e.id === exId);
  if (!ex) return;
  showExchangePopup(ex);
}

function togglePendingList() {
  const list = document.getElementById('pending-list');
  const arrow = document.getElementById('pending-arrow');
  const isOpen = list.classList.toggle('show');
  arrow.textContent = isOpen ? '⌄' : '›';
}

/* ===== Actions ===== */
function completeTask(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task || task.completed) return;
  task.completed = true;
  state.points += task.points;
  state.coins += task.coins;
  const oldLevel = computePetLevel(state.stats.totalTasks);
  state.stats.totalTasks += 1;
  state.stats.totalPoints += task.points;
  state.stats.totalCoins += task.coins;
  const newLevel = computePetLevel(state.stats.totalTasks);
  // 累计打卡天数：每日首次完成任务时 +1
  const todayStr = new Date().toDateString();
  if (state.lastCompletedDate !== todayStr) {
    state.totalDays = (state.totalDays || 0) + 1;
    state.lastCompletedDate = todayStr;
  }
  if (state.tasks.every(t => t.completed)) {
    if (state.streakDate !== new Date().toDateString()) {
      state.streak += 1;
      state.streakDate = new Date().toDateString();
    }
  }
  state.pet.mood = clamp(state.pet.mood + TASK_MOOD_BONUS, 0, 100);
  saveState();
  showTaskPopup(task);
  fireConfetti();
  if (newLevel > oldLevel) {
    setTimeout(() => showToast(`🎉 小宠升到 Lv.${newLevel} 啦！`), 1200);
  }
}

function feedPet() {
  const cost = COSTS.feed;
  if (state.coins < cost) { showToast('金币不足！'); return; }
  if (state.pet.hunger >= 100) { showToast('小宠已经吃饱啦~'); return; }
  state.coins -= cost;
  applyPetEffects(PET_EFFECTS.feed);
  saveState();

  // Eating animation
  triggerPetAnimation('eating');
  dropFood();
  playSound('eat');
  setTimeout(() => {
    triggerPetAnimation('happy');
    renderHome();
  }, 800);
  showToast('🍖 喂食成功！');
}

function bathPet() {
  const cost = COSTS.bath;
  if (state.coins < cost) { showToast('金币不足！'); return; }
  if (state.pet.clean >= 100) { showToast('小宠已经很干净啦~'); return; }
  state.coins -= cost;
  applyPetEffects(PET_EFFECTS.bath);
  saveState();

  triggerPetAnimation('bathing');
  playSound('water');
  setTimeout(() => {
    triggerPetAnimation(null);
    renderHome();
  }, 1200);
  showToast('🛁 洗澡成功！');
}

function playPet() {
  const cost = COSTS.play;
  if (state.coins < cost) { showToast('金币不足！'); return; }
  if (state.pet.energy < 10) { showToast('小宠太累了，需要休息~'); return; }
  state.coins -= cost;
  applyPetEffects(PET_EFFECTS.play);
  saveState();

  triggerPetAnimation('playing');
  playSound('happy');
  setTimeout(() => {
    triggerPetAnimation(null);
    renderHome();
  }, 1500);
  showToast('🎾 玩耍成功！');
}

function walkPet() {
  const cost = COSTS.walk;
  if (state.coins < cost) { showToast('金币不足！'); return; }
  if (state.pet.energy < 15) { showToast('小宠太累了，需要休息~'); return; }
  state.coins -= cost;
  applyPetEffects(PET_EFFECTS.walk);
  saveState();

  // Walking animation with ground
  const ground = document.getElementById('walk-ground');
  if (ground) ground.classList.add('show');
  triggerPetAnimation('walking');
  playSound('walk');

  setTimeout(() => {
    triggerPetAnimation(null);
    if (ground) ground.classList.remove('show');
    renderHome();
  }, 3200);
  showToast('🌳 出门散步成功！');
}

function dropFood() {
  const food = document.getElementById('food-particle');
  if (!food) return;
  const foods = ['🐟','🍖','🍗','🦴','🥩','🍤','🧀'];
  food.textContent = foods[Math.floor(Math.random() * foods.length)];
  food.classList.remove('drop');
  void food.offsetWidth; // force reflow
  food.classList.add('drop');
}

function triggerPetAnimation(type) {
  const cat = document.getElementById('cat');
  if (!cat) return;
  // Remove all animation classes
  cat.classList.remove('eating', 'walking', 'bathing', 'playing', 'happy');
  if (type) {
    void cat.offsetWidth; // force reflow
    cat.classList.add(type);
  }
}

/* ===== Sound Effects (Web Audio API) ===== */
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playSound(type) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    if (type === 'eat') {
      // Two short percussive "nom" sounds
      for (let i = 0; i < 2; i++) {
        const t = now + i * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800 + i * 200, t);
        osc.frequency.exponentialRampToValueAtTime(400, t + 0.08);
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.start(t);
        osc.stop(t + 0.1);
      }
    } else if (type === 'walk') {
      // Rhythmic footstep taps
      for (let i = 0; i < 8; i++) {
        const t = now + i * 0.35;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200 + Math.random() * 100, t);
        gain.gain.setValueAtTime(0.04, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.start(t);
        osc.stop(t + 0.05);
      }
    } else if (type === 'water') {
      // Splashy noise burst
      const bufferSize = ctx.sampleRate * 0.3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
      }
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      source.buffer = buffer;
      source.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      source.start(now);
    } else if (type === 'happy') {
      // Two-note ascending happy chime
      const notes = [523, 659, 784]; // C5, E5, G5
      notes.forEach((freq, i) => {
        const t = now + i * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.start(t);
        osc.stop(t + 0.22);
      });
    }
  } catch(e) {
    // Audio not available — silently skip
  }
}

function exchangeProduct(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product || product.stock <= 0) return;
  if (state.points < product.price) { showToast('积分不足！'); return; }
  state.points -= product.price;
  product.stock -= 1;
  const exId = 'EX' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + Math.floor(Math.random() * 100).toString().padStart(2, '0');
  const exchange = {
    id: exId,
    product: product.name,
    emoji: product.emoji,
    points: product.price,
    date: new Date().toISOString().slice(0, 10),
    status: 'pending',
  };
  state.exchanges.push(exchange);
  saveState();
  showExchangePopup(exchange);
}

function verifyExchange(exId) {
  const ex = state.exchanges.find(e => e.id === exId);
  if (!ex || ex.status !== 'pending') return;
  ex.status = 'verified';
  saveState();
  renderProfile();
  showToast('✅ 核销成功！');
}

/* ===== Popups ===== */
function showTaskPopup(task) {
  document.getElementById('popup-task-points').textContent = '+' + task.points;
  document.getElementById('popup-task-coins').textContent = '+' + task.coins;
  document.getElementById('task-popup').classList.add('show');
}

function showExchangePopup(exchange) {
  document.getElementById('popup-ex-name').textContent = exchange.product;
  document.getElementById('popup-ex-code').textContent = exchange.id;
  drawQRCode(exchange.id);
  document.getElementById('exchange-popup').classList.add('show');
}

function closePopup(id) {
  document.getElementById(id).classList.remove('show');
  if (id === 'task-edit-popup') currentEditTaskId = null;
  if (id === 'product-edit-popup') currentEditProductId = null;
  refreshAll();
}

function refreshAll() {
  const activePage = document.querySelector('.page.active');
  if (!activePage) return;
  if (activePage.id === 'page-home') renderHome();
  if (activePage.id === 'page-tasks') renderTasks();
  if (activePage.id === 'page-shop') { renderCategoryTabs(); renderShop(); }
  if (activePage.id === 'page-profile') renderProfile();
  // Always update parent bar and home currencies
  document.getElementById('home-points').textContent = state.points;
  document.getElementById('home-coins').textContent = state.coins;
  document.getElementById('parent-bar').classList.toggle('show', state.parentMode);
}

/* ===== Data Backup (导出/导入，跨设备与升级保险) ===== */
function exportBackup() {
  const payload = {
    app: 'pet-pwa',
    version: APP_VERSION,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    state,
    password: getParentPassword(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '小宠打卡备份_' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast('✅ 备份已导出');
}

function handleBackupFile(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  importBackup(file);
  input.value = '';
}

function importBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(reader.result);
      if (!payload || !payload.state) throw new Error('invalid');
      const data = migrateState(payload.state);
      state = {
        ...DEFAULT_STATE,
        ...data,
        pet: { ...DEFAULT_STATE.pet, ...data.pet },
        profile: { ...DEFAULT_STATE.profile, ...(data.profile || {}) },
        stats: { ...DEFAULT_STATE.stats, ...data.stats },
        tasks: Array.isArray(data.tasks) && data.tasks.length
          ? data.tasks.map(t => ({ ...TASK_FIELDS, ...t }))
          : DEFAULT_TASKS.map(t => ({ ...t })),
        products: Array.isArray(data.products) && data.products.length
          ? data.products.map(p => ({ ...PRODUCT_FIELDS, ...p }))
          : DEFAULT_PRODUCTS.map(p => ({ ...p })),
        exchanges: Array.isArray(data.exchanges) ? data.exchanges : [],
      };
      if (payload.password) localStorage.setItem(PASSWORD_KEY, payload.password);
      saveState();
      refreshAll();
      showToast('✅ 数据已恢复');
    } catch (e) {
      showToast('❌ 备份文件无效');
    }
  };
  reader.readAsText(file);
}

/* ===== QR Code ===== */
function drawQRCode(text) {
  const canvas = document.getElementById('qr-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const size = 140;
  canvas.width = size; canvas.height = size;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);
  const grid = 21;
  const cell = size / grid;
  ctx.fillStyle = '#3D3D3D';
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }
  for (let y = 0; y < grid; y++) {
    for (let x = 0; x < grid; x++) {
      if ((x < 7 && y < 7) || (x >= grid - 7 && y < 7) || (x < 7 && y >= grid - 7)) {
        if (x === 0 || x === 6 || y === 0 || y === 6 ||
            (x >= 2 && x <= 4 && y >= 2 && y <= 4) ||
            x === grid - 1 || x === grid - 7 || y === grid - 1 || y === grid - 7) {
          ctx.fillRect(x * cell, y * cell, cell, cell);
        }
        if (x >= grid - 6 && x <= grid - 2 && y >= 2 && y <= 4) ctx.fillRect(x * cell, y * cell, cell, cell);
        if (x >= 2 && x <= 4 && y >= grid - 6 && y <= grid - 2) ctx.fillRect(x * cell, y * cell, cell, cell);
        continue;
      }
      if ((hash >> ((x * 7 + y * 13) % 31)) & 1) ctx.fillRect(x * cell, y * cell, cell, cell);
      hash = (hash * 31 + x * 17 + y * 23) | 0;
    }
  }
}

/* ===== Confetti ===== */
function fireConfetti() {
  const colors = ['#FFC857', '#FF8C7A', '#6BB6E0', '#7BB56A', '#B8A4F0'];
  for (let i = 0; i < 40; i++) {
    const c = document.createElement('div');
    c.className = 'confetti';
    c.style.background = colors[Math.floor(Math.random() * colors.length)];
    c.style.left = Math.random() * 100 + '%';
    c.style.top = '-20px';
    c.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    document.body.appendChild(c);
    const duration = 2000 + Math.random() * 1500;
    const drift = (Math.random() - 0.5) * 200;
    c.animate([
      { transform: `translate(0, 0) rotate(0deg)`, opacity: 1 },
      { transform: `translate(${drift}px, ${window.innerHeight + 40}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
    ], { duration, easing: 'cubic-bezier(0.5, 0, 0.5, 1)' });
    setTimeout(() => c.remove(), duration);
  }
}

/* ===== Toast ===== */
let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

/* ===== Clock ===== */
function updateClock() {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  document.querySelectorAll('.status-time').forEach(el => el.textContent = `${h}:${m}`);
}

/* ===== Init ===== */
function init() {
  // First-time password setup
  if (!checkFirstRun()) return;

  checkDailyReset();
  applyDecay();

  // Ensure IDs are set for new installs
  if (!state.nextTaskId || state.nextTaskId < 5) {
    state.nextTaskId = Math.max(...state.tasks.map(t => t.id), 4) + 1;
  }
  if (!state.nextProductId || state.nextProductId < 7) {
    state.nextProductId = Math.max(...state.products.map(p => p.id), 6) + 1;
  }

  // Add category tabs container if not exists
  if (!document.getElementById('category-tabs')) {
    const tabsDiv = document.createElement('div');
    tabsDiv.className = 'category-tabs';
    tabsDiv.id = 'category-tabs';
    const grid = document.getElementById('product-grid');
    if (grid && grid.parentNode) {
      grid.parentNode.insertBefore(tabsDiv, grid);
    }
  }

  document.querySelectorAll('.tab-item').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  renderCategoryTabs();
  renderHome();
  renderTasks();
  renderShop();
  renderProfile();

  document.getElementById('parent-bar').classList.toggle('show', state.parentMode);

  const aboutVer = document.getElementById('app-version');
  if (aboutVer) aboutVer.textContent = 'v' + APP_VERSION;

  updateClock();
  setInterval(updateClock, 30000);
  setInterval(applyDecay, 60000);

  // Close popups on overlay click
  document.querySelectorAll('.popup-overlay').forEach(overlay => {
    overlay.addEventListener('click', function(e) {
      if (e.target === this) this.classList.remove('show');
    });
  });

  // Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', init);
