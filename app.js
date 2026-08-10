/* ================================================================
   小宠打卡 (Pet PWA) — v2.1.0
   小朋友的电子宠物打卡养成 APP
   ================================================================ */

/* ===== Constants & Config ===== */
var STORAGE_KEY = 'pet-app-state';
var PASSWORD_KEY = 'parent-password';
var AVATAR_KEY = 'pet-app-avatar';
var APP_VERSION = '2.1.1';
var SCHEMA_VERSION = 3;
var _showFullHistory = false;

/* ===== 集中配置 ===== */
var COSTS = { feed: 10, bath: 8, play: 12, walk: 15 };
var PET_EFFECTS = {
  feed: { hunger: 20,  mood: 5,   clean: 0,   energy: 0   },
  bath: { hunger: 0,   mood: 5,   clean: 25,  energy: 0   },
  play: { hunger: 0,   mood: 20,  clean: 0,   energy: -15 },
  walk: { hunger: -10, mood: 25,  clean: -10, energy: -20 },
};
var TASK_MOOD_BONUS = 5;
var TASK_FIELDS = { emoji: '\uD83D\uDCDD', points: 10, coins: 5, completed: false };
var PRODUCT_FIELDS = { emoji: '\uD83C\uDF81', price: 50, stock: 5, category: '\u73A9\u5177' };

var EMOJIS = ['\uD83D\uDCDD','\uD83D\uDCD6','\uD83C\uDFB9','\uD83E\uDDF9','\uD83C\uDFA8','\uD83C\uDFC3','\uD83C\uDFBB','\u270F\uFE0F','\uD83D\uDD2C','\uD83E\uDEEE','\uD83D\uDCD0','\uD83C\uDFAF','\uD83C\uDF1F','\uD83D\uDCAA','\uD83C\uDFB5','\uD83D\uDD8D\uFE0F','\uD83D\uDCF8','\uD83C\uDFAE','\uD83E\uDDE9','\uD83D\uDEB2','\uD83C\uDF73','\uD83E\uDDF9','\uD83C\uDF31','\uD83D\uDCA7'];
var PRODUCT_EMOJIS = ['\uD83D\uDE97','\uD83E\uDDE9','\uD83D\uDCDA','\uD83C\uDF66','\uD83E\uDD81','\uD83C\uDFA8','\uD83E\uDDF8','\u26BD','\uD83D\uDD8D\uFE0F','\uD83C\uDFAD','\uD83D\uDCE6','\uD83C\uDFAA','\uD83C\uDF6D','\uD83C\uDFA1','\uD83E\uDE81','\uD83C\uDFB8','\uD83C\uDF70','\uD83D\uDC3B','\uD83C\uDFAC','\uD83E\uDDF2','\uD83D\uDDBC\uFE0F','\uD83C\uDFB2','\uD83D\uDEB4','\uD83D\uDCF1'];

/* ===== 等级系统配置 ===== */
var LEVEL_CONFIG = [
  { level: 1,  xpRequired: 0,    title: '\u65B0\u624B\u9A6F\u517D\u5E08' },
  { level: 2,  xpRequired: 50,   title: '\u5C0F\u5BA0\u597D\u670B\u53CB' },
  { level: 3,  xpRequired: 120,  title: '\u5BA0\u7269\u8FBE\u4EBA' },
  { level: 4,  xpRequired: 220,  title: '\u5BA0\u7269\u5927\u5E08' },
  { level: 5,  xpRequired: 360,  title: '\u5BA0\u7269\u4E4B\u738B' },
  { level: 6,  xpRequired: 550,  title: '\u4F20\u5947\u9A6F\u517D\u5E08' },
  { level: 7,  xpRequired: 800,  title: '\u5BA0\u7269\u5B88\u62A4\u8005' },
  { level: 8,  xpRequired: 1100, title: '\u5BA0\u7269\u8054\u76DF\u9886\u8896' },
  { level: 9,  xpRequired: 1500, title: '\u5BA0\u7269\u4E4B\u795E' },
  { level: 10, xpRequired: 2000, title: '\u4F20\u8BF4\u7EA7\u5BA0\u7269\u5927\u5E08' },
];

/* ===== 成就徽章配置 ===== */
var ACHIEVEMENTS = [
  { id: 'first_task',    name: '\u521D\u6B21\u6253\u5361', emoji: '\uD83C\uDF1F', desc: '\u5B8C\u6210\u7B2C\u4E00\u4E2A\u4EFB\u52A1', check: function(s) { return s.stats.totalTasks >= 1; } },
  { id: 'streak_7',      name: '\u8FDE\u7EED7\u5929',    emoji: '\uD83D\uDD25', desc: '\u8FDE\u7EAD\u6253\u53617\u5929',     check: function(s) { return s.streak >= 7; } },
  { id: 'streak_30',     name: '\u8FDE\u7EAD30\u5929',   emoji: '\uD83C\uDF0B', desc: '\u8FDE\u7EAD\u6253\u536130\u5929',    check: function(s) { return s.streak >= 30; } },
  { id: 'tasks_50',      name: '\u52E4\u594B\u597D\u5B66',  emoji: '\uD83D\uDCDA', desc: '\u7D2F\u8BA1\u5B8C\u621050\u4E2A\u4EFB\u52A1',  check: function(s) { return s.stats.totalTasks >= 50; } },
  { id: 'exchanges_5',   name: '\u5151\u6362\u8FBE\u4EBA',  emoji: '\uD83C\uDF81', desc: '\u7D2F\u8BA1\u5151\u63625\u6B21\u5956\u54C1',    check: function(s) { return s.exchanges.filter(function(e) { return e.status === 'verified'; }).length >= 5; } },
  { id: 'all_complete',  name: '\u5168\u90E8\u5B8C\u6210',  emoji: '\uD83C\uDFC6', desc: '\u4ECA\u5929\u6240\u6709\u4EFB\u52A1\u90FD\u5B8C\u6210\u4E86', check: function(s) { return s.tasks.length > 0 && s.tasks.every(function(t) { return t.completed; }); } },
  { id: 'points_500',    name: '\u5BCC\u6709\u4E4B\u8DEF',  emoji: '\uD83D\uDCB0', desc: '\u7D2F\u8BA1\u83B7\u5F97500\u79EF\u5206', check: function(s) { return s.stats.totalPoints >= 500; } },
  { id: 'level_5',       name: '\u5BA0\u7269\u4E4B\u738B',  emoji: '\uD83D\uDC51', desc: '\u5BA0\u7269\u5347\u52305\u7EA7',       check: function(s) { return s.pet.level >= 5; } },
];

/* ===== 默认数据 ===== */
var DEFAULT_PRODUCTS = [
  { id: 1, name: '\u5C0F\u6C7D\u8F66\u73A9\u5177', emoji: '\uD83D\uDE97', price: 50, stock: 5, category: '\u73A9\u5177' },
  { id: 2, name: '\u62FC\u56FE\u5957\u88C5', emoji: '\uD83E\uDDE9', price: 30, stock: 8, category: '\u73A9\u5177' },
  { id: 3, name: '\u6545\u4E8B\u4E66', emoji: '\uD83D\uDCDA', price: 40, stock: 3, category: '\u5B66\u4E60' },
  { id: 4, name: '\u51B0\u6DC7\u6DCB\u5238', emoji: '\uD83C\uDF66', price: 20, stock: 10, category: '\u96F6\u98DF' },
  { id: 5, name: '\u52A8\u7269\u56ED\u95E8\u7968', emoji: '\uD83E\uDD81', price: 100, stock: 2, category: '\u4F53\u9A8C\u5238' },
  { id: 6, name: '\u7ED8\u672C\u5957\u88C5', emoji: '\uD83C\uDFA8', price: 60, stock: 0, category: '\u5B66\u4E60' },
];

var DEFAULT_TASKS = [
  { id: 1, name: '\u5B8C\u6210\u6570\u5B66\u4F5C\u4E1A', emoji: '\uD83D\uDCDD', points: 10, coins: 5, completed: false },
  { id: 2, name: '\u9605\u8BFB30\u5206\u949F', emoji: '\uD83D\uDCD6', points: 15, coins: 5, completed: false },
  { id: 3, name: '\u7EC3\u4E60\u94A2\u7434', emoji: '\uD83C\uDFB9', points: 20, coins: 10, completed: false },
  { id: 4, name: '\u6574\u7406\u4E66\u684C', emoji: '\uD83E\uDDF9', points: 5, coins: 3, completed: false },
];

var DEFAULT_STATE = {
  schemaVersion: SCHEMA_VERSION,
  pet: {
    name: '\u5C0F\u5BA0', emoji: '\uD83D\uDC31', level: 1,
    hunger: 75, clean: 85, mood: 80, energy: 70,
    lastUpdate: Date.now(),
  },
  points: 0, coins: 50,
  streak: 0, streakDate: new Date().toDateString(),
  tasks: JSON.parse(JSON.stringify(DEFAULT_TASKS)),
  products: JSON.parse(JSON.stringify(DEFAULT_PRODUCTS)),
  exchanges: [],
  stats: { totalTasks: 0, totalPoints: 0, totalCoins: 0 },
  parentMode: false,
  lastTaskDate: new Date().toDateString(),
  nextTaskId: 5,
  nextProductId: 7,
  profile: { name: '\u5C0F\u56FE', avatar: '' },
  achievements: [],
  isOnline: true,
};

/* ===== 工具函数 ===== */
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function applyPetEffects(effects) {
  var p = state.pet;
  if (effects.hunger) p.hunger = clamp(p.hunger + effects.hunger, 0, 100);
  if (effects.clean)  p.clean  = clamp(p.clean + effects.clean, 0, 100);
  if (effects.mood)   p.mood   = clamp(p.mood + effects.mood, 0, 100);
  if (effects.energy) p.energy = clamp(p.energy + effects.energy, 0, 100);
}

function calcXP() {
  return state.stats.totalTasks * 3 + state.stats.totalPoints + state.streak * 10;
}

function getLevelInfo(xp) {
  var info = LEVEL_CONFIG[0];
  for (var i = 0; i < LEVEL_CONFIG.length; i++) {
    if (xp >= LEVEL_CONFIG[i].xpRequired) info = LEVEL_CONFIG[i];
  }
  return info;
}

function getNextLevelInfo(currentLevel) {
  if (currentLevel >= LEVEL_CONFIG.length) return null;
  return LEVEL_CONFIG[currentLevel]; // next level is at current index (0-based)
}

function checkLevelUp() {
  var xp = calcXP();
  var newInfo = getLevelInfo(xp);
  if (newInfo.level > state.pet.level) {
    var oldLevel = state.pet.level;
    state.pet.level = newInfo.level;
    saveState();
    showLevelUpPopup(oldLevel, newInfo);
    return true;
  }
  return false;
}

function checkAchievements() {
  var newAchievements = [];
  for (var i = 0; i < ACHIEVEMENTS.length; i++) {
    var ach = ACHIEVEMENTS[i];
    if (state.achievements.indexOf(ach.id) === -1 && ach.check(state)) {
      state.achievements.push(ach.id);
      newAchievements.push(ach);
    }
  }
  if (newAchievements.length > 0) {
    saveState();
    for (var j = 0; j < newAchievements.length; j++) {
      showAchievementToast(newAchievements[j]);
    }
  }
}

/* ===== 密码哈希 (SHA-256) ===== */
function simpleHash(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    var chr = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash = hash | 0;
  }
  // 二次混淆
  var result = '';
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var seed = Math.abs(hash);
  for (var j = 0; j < 32; j++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    result += chars[seed % chars.length];
  }
  return result;
}

function getParentPassword() {
  var stored = localStorage.getItem(PASSWORD_KEY);
  if (!stored) return { hash: simpleHash('1234'), length: 4 };
  try {
    return JSON.parse(stored);
  } catch (e) {
    return { hash: stored, length: 4 };
  }
}

function setParentPassword(plain) {
  var obj = { hash: simpleHash(plain), length: plain.length };
  localStorage.setItem(PASSWORD_KEY, JSON.stringify(obj));
}

function verifyPassword(input) {
  var pw = getParentPassword();
  return simpleHash(input) === pw.hash;
}

/* ===== IndexedDB 头像存储 ===== */
var avatarCache = null;

function openAvatarDB() {
  return new Promise(function(resolve, reject) {
    var request = indexedDB.open('PetPWA', 1);
    request.onupgradeneeded = function(e) {
      var db = e.target.result;
      if (!db.objectStoreNames.contains('avatars')) {
        db.createObjectStore('avatars', { keyPath: 'id' });
      }
    };
    request.onsuccess = function(e) { resolve(e.target.result); };
    request.onerror = function(e) { reject(e.target.error); };
  });
}

function loadAvatar(callback) {
  if (avatarCache !== null) { callback(avatarCache); return; }
  openAvatarDB().then(function(db) {
    var tx = db.transaction('avatars', 'readonly');
    var store = tx.objectStore('avatars');
    var req = store.get('profile-avatar');
    req.onsuccess = function() {
      if (req.result && req.result.data) {
        avatarCache = req.result.data;
      } else {
        // 回退到 localStorage
        var ls = localStorage.getItem(AVATAR_KEY);
        avatarCache = ls || '';
        // 迁移到 IndexedDB
        if (ls) {
          saveAvatar(ls);
          localStorage.removeItem(AVATAR_KEY);
        }
      }
      callback(avatarCache);
    };
    req.onerror = function() {
      var ls = localStorage.getItem(AVATAR_KEY);
      avatarCache = ls || '';
      callback(avatarCache);
    };
  }).catch(function() {
    avatarCache = localStorage.getItem(AVATAR_KEY) || '';
    callback(avatarCache);
  });
}

function saveAvatar(dataUrl) {
  avatarCache = dataUrl;
  openAvatarDB().then(function(db) {
    var tx = db.transaction('avatars', 'readwrite');
    var store = tx.objectStore('avatars');
    store.put({ id: 'profile-avatar', data: dataUrl });
  }).catch(function() {
    // 回退到 localStorage
    try { localStorage.setItem(AVATAR_KEY, dataUrl); } catch (e2) {}
  });
}

/* ===== 数据迁移 ===== */
function migrateState(parsed) {
  if (!parsed || typeof parsed !== 'object') return JSON.parse(JSON.stringify(DEFAULT_STATE));
  var data = parsed;
  var v = data.schemaVersion || 0;

  if (v < 2) {
    // v0→v2: 确保基础字段存在
    data.schemaVersion = 2;
  }
  if (v < 3) {
    // v2→v3: 添加 achievements 字段，宠物默认 level=1
    if (!Array.isArray(data.achievements)) data.achievements = [];
    if (data.pet && typeof data.pet.level === 'undefined') data.pet.level = 1;
    data.schemaVersion = 3;
  }
  data.schemaVersion = SCHEMA_VERSION;
  return data;
}

/* ===== 全局状态 ===== */
var state = loadState();
var currentEditTaskId = null;
var currentEditProductId = null;
var passwordInput = '';
var setupStep = 0;
var setupFirst = '';
var selectedTaskEmoji = '\uD83D\uDCDD';
var selectedProductEmoji = '\uD83D\uDE97';
var currentCategory = '\u5168\u90E8';
var toastTimer = null;
var audioCtx = null;

function loadState() {
  try {
    var saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      var data = migrateState(JSON.parse(saved));
      var s = {};
      // 合并默认值
      for (var key in DEFAULT_STATE) {
        if (DEFAULT_STATE.hasOwnProperty(key)) {
          s[key] = (typeof data[key] !== 'undefined') ? data[key] : DEFAULT_STATE[key];
        }
      }
      // 深度合并子对象
      s.pet = {};
      for (var pk in DEFAULT_STATE.pet) {
        if (DEFAULT_STATE.pet.hasOwnProperty(pk)) {
          s.pet[pk] = (data.pet && typeof data.pet[pk] !== 'undefined') ? data.pet[pk] : DEFAULT_STATE.pet[pk];
        }
      }
      s.profile = {};
      for (var pfk in DEFAULT_STATE.profile) {
        if (DEFAULT_STATE.profile.hasOwnProperty(pfk)) {
          s.profile[pfk] = (data.profile && typeof data.profile[pfk] !== 'undefined') ? data.profile[pfk] : DEFAULT_STATE.profile[pfk];
        }
      }
      s.stats = {};
      for (var sk in DEFAULT_STATE.stats) {
        if (DEFAULT_STATE.stats.hasOwnProperty(sk)) {
          s.stats[sk] = (data.stats && typeof data.stats[sk] !== 'undefined') ? data.stats[sk] : DEFAULT_STATE.stats[sk];
        }
      }
      s.tasks = Array.isArray(data.tasks) && data.tasks.length
        ? data.tasks.map(function(t) { var nt = {}; for (var k in TASK_FIELDS) { nt[k] = (typeof t[k] !== 'undefined') ? t[k] : TASK_FIELDS[k]; } nt.id = t.id; nt.name = t.name; return nt; })
        : JSON.parse(JSON.stringify(DEFAULT_TASKS));
      s.products = Array.isArray(data.products) && data.products.length
        ? data.products.map(function(p) { var np = {}; for (var k in PRODUCT_FIELDS) { np[k] = (typeof p[k] !== 'undefined') ? p[k] : PRODUCT_FIELDS[k]; } np.id = p.id; np.name = p.name; return np; })
        : JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
      s.exchanges = Array.isArray(data.exchanges) ? data.exchanges : [];
      s.achievements = Array.isArray(data.achievements) ? data.achievements : [];
      s.isOnline = navigator.onLine;
      return s;
    }
  } catch (e) { console.error('Load error:', e); }
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
}

/* ===== 恢复出厂设置 ===== */
function resetAllData() {
  if (!confirm(
    '\u786E\u5B9A\u8981\u6062\u590D\u51FA\u5382\u8BBE\u7F6E\u5417\uFF1F\n\n'
    + '\u5C06\u6E05\u7A7A\u5168\u90E8\u6570\u636E\uFF1A\u4EFB\u52A1\u3001\u5546\u54C1\u3001\u5BA0\u7269\u72B6\u6001\u3001\u79EF\u5206\u3001\u91D1\u5E01\u3001\u5151\u6362\u8BB0\u5F55\uFF0C\n'
    + '\u5E76\u9700\u8981\u91CD\u65B0\u8BBE\u7F6E\u5BB6\u957F\u5BC6\u7801\u3002\n\n'
    + '\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\uFF0C\u5EFA\u8BAE\u5148\u300C\u5BFC\u51FA\u5907\u4EFD\u300D\u518D\u64CD\u4F5C\u3002'
  )) return;
  try {
    // 清空 localStorage
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PASSWORD_KEY);
    localStorage.removeItem(AVATAR_KEY);
    // 清空 IndexedDB 头像
    openAvatarDB().then(function(db) {
      var tx = db.transaction('avatars', 'readwrite');
      tx.objectStore('avatars').clear();
    }).catch(function() {});
    avatarCache = null;
  } catch (e) {}
  // 重置内存状态
  state = JSON.parse(JSON.stringify(DEFAULT_STATE));
  // 强制缓存穿透刷新
  location.href = location.href.split('?')[0] + '?reset=' + Date.now();
}

/* ===== 衰减与每日重置 ===== */
function applyDecay() {
  var now = Date.now();
  var elapsed = (now - state.pet.lastUpdate) / 1000;
  if (elapsed < 60) return;
  var decay = Math.floor(elapsed / 600);
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
  var today = new Date().toDateString();
  if (state.lastTaskDate !== today) {
    state.tasks.forEach(function(t) { t.completed = false; });
    state.lastTaskDate = today;
    var yesterday = new Date(Date.now() - 86400000).toDateString();
    if (state.streakDate !== yesterday && state.streakDate !== today) {
      state.streak = 0;
    }
    saveState();
  }
}

/* ===== 在线/离线监听 ===== */
function updateOnlineStatus() {
  state.isOnline = navigator.onLine;
  var indicator = document.getElementById('online-indicator');
  if (indicator) {
    indicator.textContent = state.isOnline ? '\uD83D\uDFE2 \u5728\u7EBF' : '\uD83D\uDD34 \u79BB\u7EBF';
    indicator.style.background = state.isOnline ? 'rgba(123,181,106,0.15)' : 'rgba(255,140,122,0.15)';
    indicator.style.color = state.isOnline ? '#4A8A3A' : '#D63A2F';
    if (!state.isOnline) {
      indicator.classList.add('visible');
      setTimeout(function() {
        if (!state.isOnline) indicator.classList.add('visible');
      }, 100);
    } else {
      indicator.classList.remove('visible');
    }
  }
}

/* ===== Service Worker 更新检测 ===== */
function registerSW() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('sw.js?v=' + APP_VERSION)
    .then(function(reg) {
      console.log('SW registered:', reg.scope);
      // 检测更新
      reg.addEventListener('updatefound', function() {
        var newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', function() {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showToast('\uD83D\uDD04 \u53D1\u73B0\u65B0\u7248\u672C\uFF0C\u5373\u5C06\u5237\u65B0...');
            setTimeout(function() { location.reload(); }, 1500);
          }
        });
      });
    })
    .catch(function(err) {
      console.warn('SW registration failed:', err);
    });
}

/* ===== 家长模式 ===== */
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
  var pwLen = getParentPassword().length;
  if (char === 'delete') {
    passwordInput = passwordInput.slice(0, -1);
  } else if (passwordInput.length < pwLen) {
    passwordInput += char;
  }
  updatePasswordDots();

  if (passwordInput.length === pwLen) {
    if (verifyPassword(passwordInput)) {
      state.parentMode = true;
      saveState();
      closePopup('password-popup');
      document.getElementById('parent-bar').classList.add('show');
      document.getElementById('parent-toggle').classList.add('on');
      document.getElementById('parent-mode-text').textContent = '\u5DF2\u5F00\u542F';
      refreshAll();
      showToast('\u2705 \u5DF2\u8FDB\u5165\u5BB6\u957F\u6A21\u5F0F');
    } else {
      passwordInput = '';
      updatePasswordDots();
      var card = document.getElementById('password-popup').querySelector('.popup-card');
      if (card) {
        card.animate([
          { transform: 'translateX(0)' },
          { transform: 'translateX(-8px)' },
          { transform: 'translateX(8px)' },
          { transform: 'translateX(0)' }
        ], { duration: 300 });
      }
      showToast('\u274C \u5BC6\u7801\u9519\u8BEF\uFF0C\u8BF7\u91CD\u8BD5');
    }
  }
}

function updatePasswordDots() {
  var dots = document.querySelectorAll('#password-dots .password-dot');
  dots.forEach(function(d, i) { d.classList.toggle('filled', i < passwordInput.length); });
}

function exitParentMode() {
  state.parentMode = false;
  saveState();
  document.getElementById('parent-bar').classList.remove('show');
  document.getElementById('parent-toggle').classList.remove('on');
  document.getElementById('parent-mode-text').textContent = '\u672A\u5F00\u542F';
  refreshAll();
  showToast('\u5DF2\u9000\u51FA\u5BB6\u957F\u6A21\u5F0F');
}

/* ===== 首次设置流程 ===== */
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
  var title = document.getElementById('setup-title');
  var desc = document.getElementById('setup-desc');
  var error = document.getElementById('setup-error');
  var dots = document.querySelectorAll('#setup-dots .password-dot');

  if (setupStep === 0) {
    title.textContent = '\u8BBE\u7F6E\u5BB6\u957F\u5BC6\u7801';
    desc.textContent = '\u8BF7\u8F93\u5165\u4E00\u4E2A4~6\u4F4D\u6570\u5B57\u5BC6\u7801\uFF0C\u7528\u4E8E\u7BA1\u7406\u4EFB\u52A1\u548C\u5546\u5E97';
    error.textContent = '';
    dots.forEach(function(d) { d.classList.remove('filled'); });
  } else if (setupStep === 1) {
    title.textContent = '\u518D\u6B21\u786E\u8BA4\u5BC6\u7801';
    desc.textContent = '\u8BF7\u518D\u6B21\u8F93\u5165\u76F8\u540C\u7684\u5BC6\u7801';
    error.textContent = '';
    dots.forEach(function(d) { d.classList.remove('filled'); });
  }
}

function setupInput(char) {
  var pwLen = 6; // 支持最多6位
  if (char === 'delete') {
    passwordInput = passwordInput.slice(0, -1);
  } else if (passwordInput.length < pwLen) {
    passwordInput += char;
  }
  updateSetupDots();

  // 密码至少4位，最多6位，输入满4位后可点确认
  if (passwordInput.length >= 4) {
    if (setupStep === 0) {
      setupFirst = passwordInput;
      passwordInput = '';
      setupStep = 1;
      updateSetupUI();
    } else if (setupStep === 1) {
      if (passwordInput === setupFirst) {
        setParentPassword(passwordInput);
        passwordInput = '';
        setupStep = 0;
        setupFirst = '';
        document.getElementById('setup-screen').classList.remove('show');
        showToast('\u2705 \u5BC6\u7801\u8BBE\u7F6E\u6210\u529F\uFF01');
        init();
      } else {
        document.getElementById('setup-error').textContent = '\u4E24\u6B21\u5BC6\u7801\u4E0D\u4E00\u81F4\uFF0C\u8BF7\u91CD\u65B0\u8BBE\u7F6E';
        document.getElementById('setup-desc').textContent = '\u8F93\u5165\u7684\u5BC6\u7801\u4E0E\u7B2C\u4E00\u6B21\u4E0D\u540C\uFF0C\u8BF7\u91CD\u65B0\u5F00\u59CB';
        passwordInput = '';
        setupStep = 0;
        updateSetupDots();
        var card = document.getElementById('setup-card');
        if (card) {
          card.classList.add('shake');
          setTimeout(function() { card.classList.remove('shake'); }, 400);
        }
      }
    }
  }
}

function updateSetupDots() {
  var dots = document.querySelectorAll('#setup-dots .password-dot');
  dots.forEach(function(d, i) { d.classList.toggle('filled', i < passwordInput.length); });
}

/* ===== 任务编辑器 ===== */
function openTaskEditor(taskId) {
  currentEditTaskId = taskId || null;
  var popup = document.getElementById('task-edit-popup');
  var title = document.getElementById('task-edit-title');
  var deleteBtn = document.getElementById('task-delete-btn');

  var grid = document.getElementById('task-emoji-grid');
  grid.innerHTML = EMOJIS.map(function(e) { return '<button class="emoji-item" onclick="selectTaskEmoji(\'' + e + '\', this)">' + e + '</button>'; }).join('');

  if (taskId) {
    var task = state.tasks.find(function(t) { return t.id === taskId; });
    if (!task) return;
    title.textContent = '\u7F16\u8F91\u4EFB\u52A1';
    document.getElementById('task-name-input').value = task.name;
    document.getElementById('task-points-input').value = task.points;
    document.getElementById('task-coins-input').value = task.coins;
    deleteBtn.style.display = 'block';

    var emojiBtns = grid.querySelectorAll('.emoji-item');
    emojiBtns.forEach(function(b) { if (b.textContent === task.emoji) b.classList.add('selected'); });
  } else {
    title.textContent = '\u6DFB\u52A0\u65B0\u4EFB\u52A1';
    document.getElementById('task-name-input').value = '';
    document.getElementById('task-points-input').value = '10';
    document.getElementById('task-coins-input').value = '5';
    deleteBtn.style.display = 'none';
    var firstBtn = grid.querySelector('.emoji-item');
    if (firstBtn) firstBtn.classList.add('selected');
  }
  popup.classList.add('show');
}

function selectTaskEmoji(emoji, btn) {
  selectedTaskEmoji = emoji;
  document.querySelectorAll('#task-emoji-grid .emoji-item').forEach(function(b) { b.classList.remove('selected'); });
  btn.classList.add('selected');
}

function saveTask() {
  var name = document.getElementById('task-name-input').value.trim();
  var points = parseInt(document.getElementById('task-points-input').value) || 1;
  var coins = parseInt(document.getElementById('task-coins-input').value) || 0;
  if (!name) { showToast('\u8BF7\u8F93\u5165\u4EFB\u52A1\u540D\u79F0'); return; }

  var selectedBtn = document.querySelector('#task-emoji-grid .emoji-item.selected');
  var emoji = selectedBtn ? selectedBtn.textContent : '\uD83D\uDCDD';

  if (currentEditTaskId) {
    var task = state.tasks.find(function(t) { return t.id === currentEditTaskId; });
    if (task) {
      task.name = name;
      task.emoji = emoji;
      task.points = points;
      task.coins = coins;
    }
  } else {
    state.tasks.push({
      id: state.nextTaskId++,
      name: name, emoji: emoji, points: points, coins: coins, completed: false,
    });
  }

  saveState();
  closePopup('task-edit-popup');
  currentEditTaskId = null;
  refreshAll();
  showToast('\u2705 \u4EFB\u52A1\u5DF2\u4FDD\u5B58');
}

function deleteTask() {
  if (!currentEditTaskId) return;
  if (!confirm('\u786E\u5B9A\u8981\u5220\u9664\u8FD9\u4E2A\u4EFB\u52A1\u5417\uFF1F')) return;
  state.tasks = state.tasks.filter(function(t) { return t.id !== currentEditTaskId; });
  saveState();
  closePopup('task-edit-popup');
  currentEditTaskId = null;
  refreshAll();
  showToast('\uD83D\uDDD1\uFE0F \u4EFB\u52A1\u5DF2\u5220\u9664');
}

function deleteTaskById(taskId) {
  if (!confirm('\u786E\u5B9A\u8981\u5220\u9664\u8FD9\u4E2A\u4EFB\u52A1\u5417\uFF1F')) return;
  state.tasks = state.tasks.filter(function(t) { return t.id !== taskId; });
  saveState();
  renderTasks();
}

/* ===== 商品编辑器 ===== */
function openProductEditor(productId) {
  currentEditProductId = productId || null;
  var popup = document.getElementById('product-edit-popup');
  var title = document.getElementById('product-edit-title');
  var deleteBtn = document.getElementById('product-delete-btn');

  var grid = document.getElementById('product-emoji-grid');
  grid.innerHTML = PRODUCT_EMOJIS.map(function(e) { return '<button class="emoji-item" onclick="selectProductEmoji(\'' + e + '\', this)">' + e + '</button>'; }).join('');

  if (productId) {
    var product = state.products.find(function(p) { return p.id === productId; });
    if (!product) return;
    title.textContent = '\u7F16\u8F91\u5546\u54C1';
    document.getElementById('product-name-input').value = product.name;
    document.getElementById('product-price-input').value = product.price;
    document.getElementById('product-stock-input').value = product.stock;
    document.getElementById('product-category-input').value = product.category;
    deleteBtn.style.display = 'block';

    grid.querySelectorAll('.emoji-item').forEach(function(b) {
      if (b.textContent === product.emoji) b.classList.add('selected');
    });
  } else {
    title.textContent = '\u4E0A\u67B6\u65B0\u5546\u54C1';
    document.getElementById('product-name-input').value = '';
    document.getElementById('product-price-input').value = '50';
    document.getElementById('product-stock-input').value = '5';
    document.getElementById('product-category-input').value = '\u73A9\u5177';
    deleteBtn.style.display = 'none';
    var firstBtn = grid.querySelector('.emoji-item');
    if (firstBtn) firstBtn.classList.add('selected');
  }
  popup.classList.add('show');
}

function selectProductEmoji(emoji, btn) {
  selectedProductEmoji = emoji;
  document.querySelectorAll('#product-emoji-grid .emoji-item').forEach(function(b) { b.classList.remove('selected'); });
  btn.classList.add('selected');
}

function saveProduct() {
  var name = document.getElementById('product-name-input').value.trim();
  var price = parseInt(document.getElementById('product-price-input').value) || 1;
  var stock = parseInt(document.getElementById('product-stock-input').value) || 0;
  var category = document.getElementById('product-category-input').value;
  if (!name) { showToast('\u8BF7\u8F93\u5165\u5546\u54C1\u540D\u79F0'); return; }

  var selectedBtn = document.querySelector('#product-emoji-grid .emoji-item.selected');
  var emoji = selectedBtn ? selectedBtn.textContent : '\uD83C\uDF81';

  if (currentEditProductId) {
    var product = state.products.find(function(p) { return p.id === currentEditProductId; });
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
      name: name, emoji: emoji, price: price, stock: stock, category: category,
    });
  }

  renderCategoryTabs();
  saveState();
  closePopup('product-edit-popup');
  currentEditProductId = null;
  refreshAll();
  showToast('\u2705 \u5546\u54C1\u5DF2\u4FDD\u5B58');
}

function deleteProduct() {
  if (!currentEditProductId) return;
  if (!confirm('\u786E\u5B9A\u8981\u4E0B\u67B6\u8FD9\u4E2A\u5546\u54C1\u5417\uFF1F')) return;
  state.products = state.products.filter(function(p) { return p.id !== currentEditProductId; });
  saveState();
  closePopup('product-edit-popup');
  currentEditProductId = null;
  refreshAll();
  showToast('\uD83D\uDDD1\uFE0F \u5546\u54C1\u5DF2\u5220\u9664');
}

function deleteProductById(productId) {
  if (!confirm('\u786E\u5B9A\u8981\u4E0B\u67B6\u8FD9\u4E2A\u5546\u54C1\u5417\uFF1F')) return;
  state.products = state.products.filter(function(p) { return p.id !== productId; });
  saveState();
  renderCategoryTabs();
  renderShop();
}

/* ===== Tab 导航 ===== */
function switchTab(tabName) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.tab-item').forEach(function(t) { t.classList.remove('active'); });
  var page = document.getElementById('page-' + tabName);
  var tab = document.querySelector('.tab-item[data-tab="' + tabName + '"]');
  if (page) page.classList.add('active');
  if (tab) tab.classList.add('active');
  if (tabName === 'home') renderHome();
  if (tabName === 'tasks') renderTasks();
  if (tabName === 'shop') { renderCategoryTabs(); renderShop(); }
  if (tabName === 'profile') renderProfile();
  if (page) page.scrollTop = 0;
}

/* ===== 渲染: 首页 ===== */
function renderHome() {
  document.getElementById('home-points').textContent = state.points;
  document.getElementById('home-coins').textContent = state.coins;
  var moodAvg = (state.pet.hunger + state.pet.clean + state.pet.mood + state.pet.energy) / 4;
  var moods = ['\u6211\u9700\u8981\u7167\u987E...', '\u6709\u70B9\u4E0D\u8212\u670D...', '\u8FD8\u53EF\u4EE5\u5427~', '\u5FC3\u60C5\u4E0D\u9519~', '\u8D85\u7EA7\u5F00\u5FC3\uFF01'];
  var moodIdx = Math.min(Math.floor(moodAvg / 25), 4);
  document.getElementById('pet-mood').textContent = moods[moodIdx];
  document.getElementById('pet-name').textContent = state.pet.name;
  var lvlInfo = getLevelInfo(calcXP());
  document.getElementById('pet-level').textContent = 'Lv.' + state.pet.level + ' ' + lvlInfo.title;
  updateStatusBar('hunger', state.pet.hunger, '#FF8C7A');
  updateStatusBar('clean', state.pet.clean, '#6BB6E0');
  updateStatusBar('mood', state.pet.mood, '#FFC857');
  updateStatusBar('energy', state.pet.energy, '#7BB56A');
  var completed = state.tasks.filter(function(t) { return t.completed; }).length;
  document.getElementById('home-task-count').textContent = completed + '/' + state.tasks.length;
  var taskPoints = state.tasks.filter(function(t) { return t.completed; }).reduce(function(s, t) { return s + t.points; }, 0);
  document.getElementById('home-task-points').textContent = '+' + taskPoints + ' \u79EF\u5206';
  document.getElementById('streak-num').textContent = state.streak;
  var dotsEl = document.getElementById('streak-dots');
  dotsEl.innerHTML = '';
  for (var i = 0; i < 7; i++) {
    var d = document.createElement('div');
    d.className = 'streak-dot' + (i < state.streak ? ' active' : '');
    dotsEl.appendChild(d);
  }
  // 更新宠物外观状态
  updatePetAppearance(moodAvg);
  // 更新在线状态
  updateOnlineStatus();
}

function updateStatusBar(id, value, color) {
  var fill = document.getElementById('bar-' + id + '-fill');
  var text = document.getElementById('bar-' + id + '-percent');
  if (fill) { fill.style.width = value + '%'; fill.style.background = color; }
  if (text) text.textContent = Math.round(value) + '%';
}

/* ===== 宠物外观随状态变化 ===== */
function updatePetAppearance(moodAvg) {
  var cat = document.getElementById('cat');
  if (!cat) return;
  // 移除旧状态类
  cat.classList.remove('pet-sad', 'pet-hungry', 'pet-dirty', 'pet-tired', 'pet-happy');
  // 饥饿状态
  if (state.pet.hunger < 25) cat.classList.add('pet-hungry');
  // 脏状态
  if (state.pet.clean < 25) cat.classList.add('pet-dirty');
  // 疲惫状态
  if (state.pet.energy < 15) cat.classList.add('pet-tired');
  // 不开心状态
  if (moodAvg < 30) cat.classList.add('pet-sad');
  // 非常开心
  if (moodAvg > 80) cat.classList.add('pet-happy');
}

/* ===== 渲染: 任务 ===== */
function renderTasks() {
  document.getElementById('task-points').textContent = state.points;
  var list = document.getElementById('task-list');
  list.innerHTML = '';
  var showEdit = state.parentMode;

  state.tasks.forEach(function(task) {
    var item = document.createElement('div');
    item.className = 'task-item' + (task.completed ? ' completed' : '');
    var iconHtml = task.completed ? '\u2713' : task.emoji;
    var editHtml = '';
    if (showEdit) {
      editHtml = '<div class="task-edit-controls">'
        + '<button class="edit-icon-btn edit" onclick="openTaskEditor(' + task.id + ')" title="\u7F16\u8F91">\u270F\uFE0F</button>'
        + '<button class="edit-icon-btn delete" onclick="deleteTaskById(' + task.id + ')" title="\u5220\u9664">\uD83D\uDDD1\uFE0F</button>'
        + '</div>';
    }
    var actionHtml = task.completed
      ? '<div class="task-check">\u2713</div>'
      : '<button class="task-btn pending" onclick="completeTask(' + task.id + ')">\u6253\u5361</button>';

    item.innerHTML = ''
      + '<div class="task-icon">' + iconHtml + '</div>'
      + '<div class="task-body">'
      + '<div class="task-name">' + task.name + '</div>'
      + '<div class="task-rewards">'
      + '<span class="task-reward points">\u2B50 +' + task.points + ' \u79EF\u5206</span>'
      + '<span class="task-reward coins">\uD83E\uDE99 +' + task.coins + ' \u91D1\u5E01</span>'
      + '</div>'
      + '</div>'
      + (showEdit ? editHtml : '')
      + actionHtml;
    list.appendChild(item);
  });

  document.getElementById('add-task-btn').style.display = showEdit ? 'flex' : 'none';

  var completed = state.tasks.filter(function(t) { return t.completed; }).length;
  document.getElementById('summary-completed').textContent = completed + '/' + state.tasks.length;
  document.getElementById('summary-points').textContent = state.tasks.filter(function(t) { return t.completed; }).reduce(function(s, t) { return s + t.points; }, 0);
  document.getElementById('summary-coins').textContent = state.tasks.filter(function(t) { return t.completed; }).reduce(function(s, t) { return s + t.coins; }, 0);
}

/* ===== 渲染: 商店 ===== */
function renderCategoryTabs() {
  var tabs = document.getElementById('category-tabs');
  var cats = ['\u5168\u90E8'];
  var seen = {};
  state.products.forEach(function(p) {
    if (!seen[p.category]) { seen[p.category] = true; cats.push(p.category); }
  });
  tabs.innerHTML = cats.map(function(cat, i) {
    return '<button class="cat-tab' + (cat === currentCategory ? ' active' : '') + '" onclick="filterCategory(\'' + cat + '\')">' + cat + '</button>';
  }).join('');
}

function renderShop() {
  document.getElementById('shop-points').textContent = state.points;
  document.getElementById('add-product-btn').style.display = state.parentMode ? 'flex' : 'none';

  var grid = document.getElementById('product-grid');
  grid.innerHTML = '';

  var filtered = currentCategory === '\u5168\u90E8'
    ? state.products
    : state.products.filter(function(p) { return p.category === currentCategory; });

  filtered.forEach(function(product) {
    var canAfford = state.points >= product.price && product.stock > 0;
    var card = document.createElement('div');
    var stockClass = product.stock <= 3 && product.stock > 0 ? ' low' : '';
    var stockText = product.stock === 0 ? '\u5DF2\u5151\u6362' : '\u5E93\u5B58 ' + product.stock;

    card.className = 'product-card' + (!canAfford && !state.parentMode ? ' disabled' : '');
    card.style.position = 'relative';

    var editOverlayHtml = state.parentMode
      ? '<div class="product-edit-overlay">'
        + '<button class="edit-icon-btn edit" onclick="openProductEditor(' + product.id + ')" title="\u7F16\u8F91">\u270F\uFE0F</button>'
        + '<button class="edit-icon-btn delete" onclick="deleteProductById(' + product.id + ')" title="\u5220\u9664">\uD83D\uDDD1\uFE0F</button>'
        + '</div>'
      : '';

    var btnHtml = state.parentMode
      ? '<button class="exchange-btn disabled">\u5BB6\u957F\u6A21\u5F0F</button>'
      : '<button class="exchange-btn ' + (canAfford ? 'available' : 'disabled') + '"'
        + (canAfford ? ' onclick="exchangeProduct(' + product.id + ')"' : ' disabled')
        + '>' + (product.stock === 0 ? '\u5DF2\u5151\u6362' : (canAfford ? '\u5151\u6362' : '\u79EF\u5206\u4E0D\u8DB3')) + '</button>';

    card.innerHTML = ''
      + editOverlayHtml
      + '<div class="product-img">' + product.emoji + '</div>'
      + '<div class="product-info">'
      + '<div class="product-name">' + product.name + '</div>'
      + '<div class="product-meta">'
      + '<span class="product-price">\u2B50 ' + product.price + '</span>'
      + '<span class="product-stock' + stockClass + '">' + stockText + '</span>'
      + '</div>'
      + btnHtml
      + '</div>';
    grid.appendChild(card);
  });
}

function filterCategory(cat) {
  currentCategory = cat;
  renderCategoryTabs();
  renderShop();
}

/* ===== 渲染: 我的 ===== */
function renderProfile() {
  document.getElementById('profile-name').textContent = state.profile.name || '\u5C0F\u56FE';
  var lvlInfo = getLevelInfo(calcXP());
  document.getElementById('profile-level').textContent = 'Lv.' + state.pet.level + ' ' + lvlInfo.title;
  renderProfileAvatar();
  document.getElementById('stat-tasks').textContent = state.stats.totalTasks;
  document.getElementById('stat-points').textContent = state.stats.totalPoints;
  document.getElementById('stat-coins').textContent = state.stats.totalCoins;

  // 进度条: 距下一级
  var xp = calcXP();
  var lvlData = getLevelInfo(xp);
  var nextLvl = getNextLevelInfo(lvlData.level);
  if (nextLvl) {
    var currentXP = xp - lvlData.xpRequired;
    var neededXP = nextLvl.xpRequired - lvlData.xpRequired;
    var pct = Math.min(100, Math.round(currentXP / neededXP * 100));
    var xpBar = document.getElementById('xp-progress-bar');
    var xpText = document.getElementById('xp-progress-text');
    if (xpBar) xpBar.style.width = pct + '%';
    if (xpText) xpText.textContent = currentXP + '/' + neededXP + ' XP';
  } else {
    var xpBar2 = document.getElementById('xp-progress-bar');
    var xpText2 = document.getElementById('xp-progress-text');
    if (xpBar2) xpBar2.style.width = '100%';
    if (xpText2) xpText2.textContent = 'MAX';
  }

  // 兑换记录
  var histList = document.getElementById('history-list');
  histList.innerHTML = '';
  var allExchanges = state.exchanges.slice().reverse();
  var showLimit = 3;
  var displayExchanges = _showFullHistory ? allExchanges : allExchanges.slice(0, showLimit);
  var hasMore = allExchanges.length > showLimit;

  var moreBtn = document.getElementById('history-more');
  if (moreBtn) moreBtn.style.display = (hasMore && !_showFullHistory) ? 'inline' : 'none';

  if (state.exchanges.length === 0) {
    histList.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-light);font-size:14px;">\u8FD8\u6CA1\u6709\u5151\u6362\u8BB0\u5F55\u54E6~</div>';
  } else {
    displayExchanges.forEach(function(ex) {
      var item = document.createElement('div');
      item.className = 'history-item';
      var isPending = ex.status === 'pending';
      var canVerify = isPending && state.parentMode;
      item.innerHTML = ''
        + '<div class="history-icon" style="background:' + (isPending ? 'var(--yellow-soft)' : 'var(--green-soft)') + '">' + (ex.emoji || '\uD83C\uDF81') + '</div>'
        + '<div class="history-body">'
        + '<div class="history-name">' + ex.product + '</div>'
        + '<div class="history-date">' + ex.date + ' \u00B7 ' + ex.id + '</div>'
        + '</div>'
        + '<div class="history-points">-' + ex.points + '\u79EF\u5206</div>'
        + (canVerify
          ? '<button class="verify-btn" onclick="verifyExchange(\'' + ex.id + '\')">\u6838\u9500</button>'
          : '<span class="history-status ' + ex.status + '">' + (isPending ? '\u5F85\u6838\u9500' : '\u5DF2\u6838\u9500') + '</span>'
        );
      histList.appendChild(item);
    });
  }

  // 成就徽章
  renderAchievements();

  // 设置
  document.getElementById('parent-toggle').classList.toggle('on', state.parentMode);
  document.getElementById('parent-mode-text').textContent = state.parentMode ? '\u5DF2\u5F00\u542F' : '\u672A\u5F00\u542F';
  renderPendingSection();
}

/* ===== 显示全部兑换记录 ===== */
function showAllHistory() {
  _showFullHistory = true;
  renderProfile();
}

/* ===== 成就徽章渲染 ===== */
function renderAchievements() {
  var container = document.getElementById('achievements-container');
  if (!container) return;
  container.innerHTML = '';
  ACHIEVEMENTS.forEach(function(ach) {
    var earned = state.achievements.indexOf(ach.id) !== -1;
    var div = document.createElement('div');
    div.className = 'achievement-badge' + (earned ? ' earned' : ' locked');
    div.title = ach.desc;
    div.innerHTML = ''
      + '<div class="achievement-icon">' + (earned ? ach.emoji : '\uD83D\uDD12') + '</div>'
      + '<div class="achievement-name">' + ach.name + '</div>';
    container.appendChild(div);
  });
}

/* ===== 头像渲染 ===== */
function renderProfileAvatar() {
  var img = document.getElementById('profile-avatar-img');
  var emoji = document.getElementById('profile-avatar-emoji');
  if (!img || !emoji) return;
  loadAvatar(function(avatarData) {
    if (avatarData) {
      img.src = avatarData;
      img.style.display = 'block';
      emoji.style.display = 'none';
    } else {
      img.style.display = 'none';
      emoji.style.display = 'flex';
    }
  });
}

function openProfileEditor() {
  document.getElementById('profile-name-input').value = state.profile.name || '';
  loadAvatar(function(avatarData) {
    var eImg = document.getElementById('profile-edit-avatar-img');
    var eEmoji = document.getElementById('profile-edit-avatar-emoji');
    if (avatarData) {
      eImg.src = avatarData;
      eImg.style.display = 'block';
      eEmoji.style.display = 'none';
    } else {
      eImg.style.display = 'none';
      eEmoji.style.display = 'flex';
    }
  });
  document.getElementById('profile-edit-popup').classList.add('show');
}

function saveProfile() {
  var name = document.getElementById('profile-name-input').value.trim();
  if (!name) { showToast('\u6635\u79F0\u4E0D\u80FD\u4E3A\u7A7A'); return; }
  state.profile.name = name.slice(0, 12);
  saveState();
  closePopup('profile-edit-popup');
  renderProfile();
  showToast('\u2705 \u8D44\u6599\u5DF2\u4FDD\u5B58');
}

function triggerAvatarUpload() {
  var input = document.getElementById('avatar-file');
  if (input) input.click();
}

function handleAvatarFile(input) {
  var file = input.files && input.files[0];
  if (!file) return;
  resizeImageToDataURL(file, 256, function(dataUrl) {
    if (!dataUrl) { showToast('\u274C \u56FE\u7247\u8BFB\u53D6\u5931\u8D25'); input.value = ''; return; }
    saveAvatar(dataUrl);
    renderProfile();
    var eImg = document.getElementById('profile-edit-avatar-img');
    var eEmoji = document.getElementById('profile-edit-avatar-emoji');
    if (eImg) { eImg.src = dataUrl; eImg.style.display = 'block'; }
    if (eEmoji) eEmoji.style.display = 'none';
    showToast('\u2705 \u5934\u50CF\u5DF2\u66F4\u65B0');
    input.value = '';
  });
}

function resizeImageToDataURL(file, maxSize, cb) {
  var reader = new FileReader();
  reader.onload = function() {
    var img = new Image();
    img.onload = function() {
      var scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      var w = Math.round(img.width * scale);
      var h = Math.round(img.height * scale);
      var canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      try { cb(canvas.toDataURL('image/jpeg', 0.85)); }
      catch (e) { cb(null); }
    };
    img.onerror = function() { cb(null); };
    img.src = reader.result;
  };
  reader.onerror = function() { cb(null); };
  reader.readAsDataURL(file);
}

function renderPendingSection() {
  var pending = state.exchanges.filter(function(e) { return e.status === 'pending'; });
  var badge = document.getElementById('pending-count-badge');
  var countText = document.getElementById('pending-count-text');
  var list = document.getElementById('pending-list');

  badge.textContent = pending.length;
  countText.textContent = pending.length + '\u4EF6\u5F85\u6838\u9500\u5546\u54C1';

  list.innerHTML = '';
  if (pending.length === 0) {
    list.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-light);font-size:13px;">\u6682\u65E0\u5F85\u6838\u9500\u5546\u54C1~</div>';
  } else {
    var displayPending = pending.slice(0, 5);
    displayPending.forEach(function(ex) {
      list.innerHTML += ''
        + '<div class="pending-item">'
        + '<div class="pending-item-icon">' + ex.emoji + '</div>'
        + '<div class="pending-item-body">'
        + '<div class="pending-item-name">' + ex.product + '</div>'
        + '<div class="pending-item-date">' + ex.date + ' \u00B7 <span class="pending-item-code">' + ex.id + '</span></div>'
        + '</div>'
        + '<span class="pending-item-action" onclick="viewPendingDetail(\'' + ex.id + '\')">\u67E5\u770B \u203A</span>'
        + '</div>';
    });
    if (pending.length > 5) {
      list.innerHTML += '<div onclick="showAllPending()" style="padding:10px;text-align:center;color:var(--text-light);font-size:13px;cursor:pointer">查看全部 ' + pending.length + ' 件待核销 ›</div>';
    }
  }
}
function showAllPending() {
  var pending = state.exchanges.filter(function(e) { return e.status === 'pending'; });
  var list = document.getElementById('pending-list');
  list.innerHTML = '';
  pending.forEach(function(ex) {
    list.innerHTML += ''
      + '<div class="pending-item">'
      + '<div class="pending-item-icon">' + ex.emoji + '</div>'
      + '<div class="pending-item-body">'
      + '<div class="pending-item-name">' + ex.product + '</div>'
      + '<div class="pending-item-date">' + ex.date + ' \u00B7 <span class="pending-item-code">' + ex.id + '</span></div>'
      + '</div>'
      + '<span class="pending-item-action" onclick="viewPendingDetail(\'' + ex.id + '\')">\u67E5\u770B \u203A</span>'
      + '</div>';
  });
}

function viewPendingDetail(exId) {
  var ex = state.exchanges.find(function(e) { return e.id === exId; });
  if (!ex) return;
  showExchangePopup(ex);
}

function togglePendingList() {
  var list = document.getElementById('pending-list');
  var arrow = document.getElementById('pending-arrow');
  var isOpen = list.classList.toggle('show');
  arrow.textContent = isOpen ? '\u2304' : '\u203A';
}

/* ===== 操作 ===== */
function completeTask(taskId) {
  var task = state.tasks.find(function(t) { return t.id === taskId; });
  if (!task || task.completed) return;
  task.completed = true;
  state.points += task.points;
  state.coins += task.coins;
  state.stats.totalTasks += 1;
  state.stats.totalPoints += task.points;
  state.stats.totalCoins += task.coins;
  if (state.tasks.every(function(t) { return t.completed; })) {
    if (state.streakDate !== new Date().toDateString()) {
      state.streak += 1;
      state.streakDate = new Date().toDateString();
    }
  }
  state.pet.mood = clamp(state.pet.mood + TASK_MOOD_BONUS, 0, 100);
  saveState();
  showTaskPopup(task);
  fireConfetti();
  // 检查升级与成就
  setTimeout(function() { checkLevelUp(); checkAchievements(); }, 500);
}

function feedPet() {
  var cost = COSTS.feed;
  if (state.coins < cost) { showToast('\u91D1\u5E01\u4E0D\u8DB3\uFF01'); return; }
  if (state.pet.hunger >= 100) { showToast('\u5C0F\u5BA0\u5DF2\u7ECF\u5403\u9971\u5566~'); return; }
  state.coins -= cost;
  applyPetEffects(PET_EFFECTS.feed);
  saveState();
  triggerPetAnimation('eating');
  dropFood();
  playSound('eat');
  setTimeout(function() {
    triggerPetAnimation('happy');
    renderHome();
  }, 800);
  showToast('\uD83C\uDF56 \u5582\u98DF\u6210\u529F\uFF01');
}

function bathPet() {
  var cost = COSTS.bath;
  if (state.coins < cost) { showToast('\u91D1\u5E01\u4E0D\u8DB3\uFF01'); return; }
  if (state.pet.clean >= 100) { showToast('\u5C0F\u5BA0\u5DF2\u7ECF\u5F88\u5E72\u51C0\u5566~'); return; }
  state.coins -= cost;
  applyPetEffects(PET_EFFECTS.bath);
  saveState();
  triggerPetAnimation('bathing');
  playSound('water');
  setTimeout(function() {
    triggerPetAnimation(null);
    renderHome();
  }, 1200);
  showToast('\uD83D\uDEC1 \u6D17\u6FA1\u6210\u529F\uFF01');
}

function playPet() {
  var cost = COSTS.play;
  if (state.coins < cost) { showToast('\u91D1\u5E01\u4E0D\u8DB3\uFF01'); return; }
  if (state.pet.energy < 10) { showToast('\u5C0F\u5BA0\u592A\u7D2F\u4E86\uFF0C\u9700\u8981\u4F11\u606F~'); return; }
  state.coins -= cost;
  applyPetEffects(PET_EFFECTS.play);
  saveState();
  triggerPetAnimation('playing');
  playSound('happy');
  setTimeout(function() {
    triggerPetAnimation(null);
    renderHome();
  }, 1500);
  showToast('\uD83C\uDFBE \u73A9\u800D\u6210\u529F\uFF01');
}

function walkPet() {
  var cost = COSTS.walk;
  if (state.coins < cost) { showToast('\u91D1\u5E01\u4E0D\u8DB3\uFF01'); return; }
  if (state.pet.energy < 15) { showToast('\u5C0F\u5BA0\u592A\u7D2F\u4E86\uFF0C\u9700\u8981\u4F11\u606F~'); return; }
  state.coins -= cost;
  applyPetEffects(PET_EFFECTS.walk);
  saveState();
  var ground = document.getElementById('walk-ground');
  if (ground) ground.classList.add('show');
  triggerPetAnimation('walking');
  playSound('walk');
  setTimeout(function() {
    triggerPetAnimation(null);
    if (ground) ground.classList.remove('show');
    renderHome();
  }, 3200);
  showToast('\uD83C\uDF33 \u51FA\u95E8\u6563\u6B65\u6210\u529F\uFF01');
}

function dropFood() {
  var food = document.getElementById('food-particle');
  if (!food) return;
  var foods = ['\uD83D\uDC1F','\uD83C\uDF56','\uD83C\uDF57','\uD83E\uDEB4','\uD83E\uDD69','\uD83C\uDF64','\uD83E\uDDC0'];
  food.textContent = foods[Math.floor(Math.random() * foods.length)];
  food.classList.remove('drop');
  void food.offsetWidth;
  food.classList.add('drop');
}

function triggerPetAnimation(type) {
  var cat = document.getElementById('cat');
  if (!cat) return;
  cat.classList.remove('eating', 'walking', 'bathing', 'playing', 'happy');
  if (type) {
    void cat.offsetWidth;
    cat.classList.add(type);
  }
}

/* ===== 音效 (Web Audio API) ===== */
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playSound(type) {
  try {
    var ctx = getAudioContext();
    var now = ctx.currentTime;

    if (type === 'eat') {
      for (var i = 0; i < 2; i++) {
        var t = now + i * 0.12;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
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
      for (var j = 0; j < 8; j++) {
        var t2 = now + j * 0.35;
        var osc2 = ctx.createOscillator();
        var gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(200 + Math.random() * 100, t2);
        gain2.gain.setValueAtTime(0.04, t2);
        gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.05);
        osc2.start(t2);
        osc2.stop(t2 + 0.05);
      }
    } else if (type === 'water') {
      var bufferSize = ctx.sampleRate * 0.3;
      var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      var data = buffer.getChannelData(0);
      for (var k = 0; k < bufferSize; k++) {
        data[k] = (Math.random() * 2 - 1) * Math.exp(-k / (ctx.sampleRate * 0.05));
      }
      var source = ctx.createBufferSource();
      var gain3 = ctx.createGain();
      source.buffer = buffer;
      source.connect(gain3);
      gain3.connect(ctx.destination);
      gain3.gain.setValueAtTime(0.08, now);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      source.start(now);
    } else if (type === 'happy') {
      var notes = [523, 659, 784];
      notes.forEach(function(freq, i) {
        var t3 = now + i * 0.12;
        var osc3 = ctx.createOscillator();
        var gain4 = ctx.createGain();
        osc3.connect(gain4);
        gain4.connect(ctx.destination);
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(freq, t3);
        gain4.gain.setValueAtTime(0.06, t3);
        gain4.gain.exponentialRampToValueAtTime(0.001, t3 + 0.2);
        osc3.start(t3);
        osc3.stop(t3 + 0.22);
      });
    }
  } catch(e) {}
}

function exchangeProduct(productId) {
  var product = state.products.find(function(p) { return p.id === productId; });
  if (!product || product.stock <= 0) return;
  if (state.points < product.price) { showToast('\u79EF\u5206\u4E0D\u8DB3\uFF01'); return; }
  state.points -= product.price;
  product.stock -= 1;
  // 使用 crypto.randomUUID() 或回退
  var exId;
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    exId = 'EX' + crypto.randomUUID().slice(0, 8).toUpperCase();
  } else {
    exId = 'EX' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + Math.floor(Math.random() * 100).toString().padStart(2, '0');
  }
  var exchange = {
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
  var ex = state.exchanges.find(function(e) { return e.id === exId; });
  if (!ex || ex.status !== 'pending') return;
  ex.status = 'verified';
  saveState();
  renderProfile();
  checkAchievements();
  showToast('\u2705 \u6838\u9500\u6210\u529F\uFF01');
}

/* ===== 弹窗 ===== */
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

function showLevelUpPopup(oldLevel, newInfo) {
  document.getElementById('levelup-old').textContent = oldLevel;
  document.getElementById('levelup-new').textContent = newInfo.level;
  document.getElementById('levelup-title').textContent = newInfo.title;
  document.getElementById('levelup-popup').classList.add('show');
  fireConfetti();
  playSound('happy');
}

function showAchievementToast(ach) {
  showToast(ach.emoji + ' \uD83C\uDFC6 \u83B7\u5F97\u5FBD\u7AE0: ' + ach.name + '\uFF01');
}

function closePopup(id) {
  document.getElementById(id).classList.remove('show');
  if (id === 'task-edit-popup') currentEditTaskId = null;
  if (id === 'product-edit-popup') currentEditProductId = null;
  refreshAll();
}

function refreshAll() {
  var activePage = document.querySelector('.page.active');
  if (!activePage) return;
  if (activePage.id === 'page-home') renderHome();
  if (activePage.id === 'page-tasks') renderTasks();
  if (activePage.id === 'page-shop') { renderCategoryTabs(); renderShop(); }
  if (activePage.id === 'page-profile') renderProfile();
  // 避免在非首页时操作首页元素
  var hp = document.getElementById('home-points');
  var hc = document.getElementById('home-coins');
  if (hp) hp.textContent = state.points;
  if (hc) hc.textContent = state.coins;
  var pb = document.getElementById('parent-bar');
  if (pb) pb.classList.toggle('show', state.parentMode);
}

/* ===== 数据备份 ===== */
function exportBackup() {
  var payload = {
    app: 'pet-pwa',
    version: APP_VERSION,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    state: state,
    password: JSON.parse(localStorage.getItem(PASSWORD_KEY) || '{}'),
  };
  // 备份时去除敏感的头像base64
  if (payload.state.profile) payload.state.profile.avatar = '';
  var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = '\u5C0F\u5BA0\u6253\u5361\u5907\u4EFD_' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast('\u2705 \u5907\u4EFD\u5DF2\u5BFC\u51FA');
}

function handleBackupFile(input) {
  var file = input.files && input.files[0];
  if (!file) return;
  importBackup(file);
  input.value = '';
}

function importBackup(file) {
  var reader = new FileReader();
  reader.onload = function() {
    try {
      var payload = JSON.parse(reader.result);
      if (!payload || !payload.state) throw new Error('invalid');
      var data = migrateState(payload.state);
      state = loadStateFromData(data);
      if (payload.password) {
        var pwStr = typeof payload.password === 'object' ? JSON.stringify(payload.password) : payload.password;
        localStorage.setItem(PASSWORD_KEY, pwStr);
      }
      saveState();
      // 刷新头像
      avatarCache = data.profile && data.profile.avatar ? data.profile.avatar : '';
      if (avatarCache) saveAvatar(avatarCache);
      refreshAll();
      showToast('\u2705 \u6570\u636E\u5DF2\u6062\u590D');
    } catch (e) {
      showToast('\u274C \u5907\u4EFD\u6587\u4EF6\u65E0\u6548');
    }
  };
  reader.readAsText(file);
}

function loadStateFromData(data) {
  var s = {};
  for (var key in DEFAULT_STATE) {
    if (DEFAULT_STATE.hasOwnProperty(key)) {
      s[key] = (typeof data[key] !== 'undefined') ? data[key] : DEFAULT_STATE[key];
    }
  }
  s.pet = {}; for (var pk in DEFAULT_STATE.pet) { s.pet[pk] = (data.pet && typeof data.pet[pk] !== 'undefined') ? data.pet[pk] : DEFAULT_STATE.pet[pk]; }
  s.profile = {}; for (var pfk in DEFAULT_STATE.profile) { s.profile[pfk] = (data.profile && typeof data.profile[pfk] !== 'undefined') ? data.profile[pfk] : DEFAULT_STATE.profile[pfk]; }
  s.stats = {}; for (var sk in DEFAULT_STATE.stats) { s.stats[sk] = (data.stats && typeof data.stats[sk] !== 'undefined') ? data.stats[sk] : DEFAULT_STATE.stats[sk]; }
  s.tasks = Array.isArray(data.tasks) && data.tasks.length ? data.tasks.map(function(t) { var nt = { id: t.id, name: t.name }; for (var k in TASK_FIELDS) { nt[k] = (typeof t[k] !== 'undefined') ? t[k] : TASK_FIELDS[k]; } return nt; }) : JSON.parse(JSON.stringify(DEFAULT_TASKS));
  s.products = Array.isArray(data.products) && data.products.length ? data.products.map(function(p) { var np = { id: p.id, name: p.name }; for (var k in PRODUCT_FIELDS) { np[k] = (typeof p[k] !== 'undefined') ? p[k] : PRODUCT_FIELDS[k]; } return np; }) : JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
  s.exchanges = Array.isArray(data.exchanges) ? data.exchanges : [];
  s.achievements = Array.isArray(data.achievements) ? data.achievements : [];
  s.isOnline = navigator.onLine;
  return s;
}

/* ===== 二维码 ===== */
function drawQRCode(text) {
  var canvas = document.getElementById('qr-canvas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var size = 140;
  canvas.width = size; canvas.height = size;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);
  var grid = 21;
  var cell = size / grid;
  ctx.fillStyle = '#3D3D3D';
  var hash = 0;
  for (var i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
  }
  for (var y = 0; y < grid; y++) {
    for (var x = 0; x < grid; x++) {
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

/* ===== Canvas 彩带 (性能优化) ===== */
var confettiCanvas = null;
var confettiCtx = null;
var confettiParticles = [];
var confettiRAF = null;

function initConfettiCanvas() {
  confettiCanvas = document.getElementById('confetti-canvas');
  if (!confettiCanvas) return;
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
  confettiCtx = confettiCanvas.getContext('2d');
}

function fireConfetti() {
  initConfettiCanvas();
  if (!confettiCtx) return;
  var colors = ['#FFC857', '#FF8C7A', '#6BB6E0', '#7BB56A', '#B8A4F0'];
  for (var i = 0; i < 50; i++) {
    confettiParticles.push({
      x: Math.random() * confettiCanvas.width,
      y: -20,
      w: 6 + Math.random() * 8,
      h: 6 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 3,
      vy: 3 + Math.random() * 5,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 8,
      opacity: 1,
      life: 1,
    });
  }
  if (!confettiRAF) {
    confettiRAF = requestAnimationFrame(animateConfetti);
  }
}

function animateConfetti() {
  if (!confettiCtx || !confettiCanvas) { confettiRAF = null; return; }
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  var alive = false;
  for (var i = confettiParticles.length - 1; i >= 0; i--) {
    var p = confettiParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1;
    p.rotation += p.rotationSpeed;
    p.life -= 0.008;
    p.opacity = Math.max(0, p.life);

    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate(p.rotation * Math.PI / 180);
    confettiCtx.globalAlpha = p.opacity;
    confettiCtx.fillStyle = p.color;
    confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    confettiCtx.restore();

    if (p.life > 0 && p.y < confettiCanvas.height + 40) {
      alive = true;
    } else {
      confettiParticles.splice(i, 1);
    }
  }
  if (alive) {
    confettiRAF = requestAnimationFrame(animateConfetti);
  } else {
    confettiRAF = null;
    confettiParticles = [];
  }
}

/* ===== Toast (修复不消失问题) ===== */
function showToast(msg) {
  var toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function() {
    toast.classList.remove('show');
    toastTimer = null;
  }, 2500);
}

/* ===== 时钟 ===== */
function updateClock() {
  var now = new Date();
  var h = now.getHours().toString().padStart(2, '0');
  var m = now.getMinutes().toString().padStart(2, '0');
  document.querySelectorAll('.status-time').forEach(function(el) { el.textContent = h + ':' + m; });
}

/* ===== 初始化 ===== */
function init() {
  // 首次设置
  if (!checkFirstRun()) return;

  checkDailyReset();
  applyDecay();

  // 确保 ID 正确
  if (!state.nextTaskId || state.nextTaskId < 5) {
    state.nextTaskId = Math.max.apply(null, state.tasks.map(function(t) { return t.id; }).concat([4])) + 1;
  }
  if (!state.nextProductId || state.nextProductId < 7) {
    state.nextProductId = Math.max.apply(null, state.products.map(function(p) { return p.id; }).concat([6])) + 1;
  }

  // 确保分类标签容器存在
  if (!document.getElementById('category-tabs')) {
    var tabsDiv = document.createElement('div');
    tabsDiv.className = 'category-tabs';
    tabsDiv.id = 'category-tabs';
    var grid = document.getElementById('product-grid');
    if (grid && grid.parentNode) {
      grid.parentNode.insertBefore(tabsDiv, grid);
    }
  }

  // 标签导航事件
  document.querySelectorAll('.tab-item').forEach(function(tab) {
    tab.addEventListener('click', function() { switchTab(tab.dataset.tab); });
  });

  renderCategoryTabs();
  renderHome();
  renderTasks();
  renderShop();
  renderProfile();

  var pb = document.getElementById('parent-bar');
  if (pb) pb.classList.toggle('show', state.parentMode);

  var aboutVer = document.getElementById('app-version');
  if (aboutVer) aboutVer.textContent = 'v' + APP_VERSION;

  updateClock();
  setInterval(updateClock, 30000);
  setInterval(applyDecay, 60000);

  // 弹窗遮罩点击关闭
  document.querySelectorAll('.popup-overlay').forEach(function(overlay) {
    overlay.addEventListener('click', function(e) {
      if (e.target === this) this.classList.remove('show');
    });
  });

  // 在线/离线监听
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();

  // Canvas 彩带画布
  initConfettiCanvas();
  window.addEventListener('resize', function() {
    if (confettiCanvas) {
      confettiCanvas.width = window.innerWidth;
      confettiCanvas.height = window.innerHeight;
    }
  });

  // Service Worker
  registerSW();

  // 初始化头像（从 IndexedDB 加载到缓存）
  loadAvatar(function() {});

  // 页面可见性变化时触发衰减
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      applyDecay();
      renderHome();
    }
  });

  console.log('Pet PWA v' + APP_VERSION + ' initialized');
}

document.addEventListener('DOMContentLoaded', init);
