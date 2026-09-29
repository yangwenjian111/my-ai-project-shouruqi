/* ========================================
   日常记账 - 交互逻辑（全栈版）
   认证 + 储备金 + 账单 + 分类 + 统计 + 设置
   ======================================== */

/* ========== 后端 API 配置 ========== */
const API_BASE = window.API_BASE || 'http://localhost:3000/api';

/* ========== 认证状态管理 ========== */
const TOKEN_KEY = 'app_token';
const USER_KEY = 'app_currentUser';
const LAST_USER_KEY = 'app_lastUser';

function getToken() { return localStorage.getItem(TOKEN_KEY); }
function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch (e) { return null; }
}
function isLoggedIn() { return !!getToken(); }

function setAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(LAST_USER_KEY, JSON.stringify({ username: user.username, avatar: user.avatar }));
  localStorage.setItem('app_username', user.username);
  localStorage.setItem('app_userAvatar', user.avatar);
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/* ========== API 请求封装 ========== */
async function apiFetch(path, options) {
  const opts = options || {};
  const method = opts.method || 'GET';
  const headers = { 'Content-Type': 'application/json' };
  if (opts.auth) {
    const token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;
  }
  let res;
  try {
    res = await fetch(API_BASE + path, {
      method: method,
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
  } catch (networkErr) {
    const err = new Error('无法连接服务器，请确认后端已启动');
    err.network = true;
    throw err;
  }
  let data = null;
  try { data = await res.json(); } catch (e) { data = null; }
  if (!res.ok || !data || data.code !== 0) {
    const err = new Error((data && data.message) || ('请求失败 (' + res.status + ')'));
    err.status = res.status;
    throw err;
  }
  return data.data;
}

/* ========== 头像渲染工具 ========== */
const AVATAR_COLORS = {
  pink:     { bg: '#FDDDE6', fill: '#E8849E' },
  orange:   { bg: '#FFE5C2', fill: '#FFD6A5' },
  mint:     { bg: '#D5F5E8', fill: '#B8E6D0' },
  lavender: { bg: '#E8DFF5', fill: '#C9B8E6' },
  blue:     { bg: '#D5EEF5', fill: '#A8D8EA' },
};

function renderAvatar(svgEl, avatar, size) {
  if (!svgEl) return;
  const c = AVATAR_COLORS[avatar] || AVATAR_COLORS.pink;
  if (size === 24) {
    svgEl.innerHTML =
      '<circle cx="12" cy="12" r="12" fill="' + c.bg + '"/>' +
      '<circle cx="12" cy="10" r="4" fill="' + c.fill + '"/>' +
      '<ellipse cx="12" cy="18" rx="7" ry="5" fill="' + c.fill + '"/>' +
      '<path d="M10 9a1 1 0 012 0M10 11c0 1 1 1.5 2 1.5s2-.5 2-1.5" stroke="#4A3728" stroke-width="0.75" fill="none" stroke-linecap="round"/>';
  } else {
    svgEl.innerHTML =
      '<circle cx="24" cy="24" r="24" fill="' + c.bg + '"/>' +
      '<circle cx="24" cy="20" r="8" fill="' + c.fill + '"/>' +
      '<ellipse cx="24" cy="40" rx="14" ry="10" fill="' + c.fill + '"/>' +
      '<path d="M20 18a2 2 0 014 0M20 22c0 2 2 3 4 3s4-1 4-3" stroke="#4A3728" stroke-width="1.5" fill="none" stroke-linecap="round"/>';
  }
}

/* ========== 工具函数 ========== */
function currentPage() {
  const path = window.location.pathname;
  let page = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
  // serve 包会去掉 .html 后缀，补全以便匹配
  if (page && !page.includes('.') && !page.endsWith('.html')) page = page + '.html';
  return page;
}

function formatMoney(n) {
  return '¥' + Number(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function getCurrentMonth() {
  const now = new Date();
  return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
}

function getTodayStr() {
  const now = new Date();
  return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
}

function getTodayDisplay() {
  const now = new Date();
  return (now.getMonth() + 1) + '月' + now.getDate() + '日';
}

/* ========== 问候语（根据时间段） ========== */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return '晚上好';
  if (h < 12) return '早上好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
}

/* ========== 日期显示 ========== */
function getDateDisplay() {
  const now = new Date();
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return (now.getMonth() + 1) + '月' + now.getDate() + '日 ' + weekDays[now.getDay()];
}

/* ========== Toast ========== */
function showToast(message, type) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = 'toast show';
  if (type === 'error') toast.style.background = '#E8849E';
  else if (type === 'success') toast.style.background = '#7BC89C';
  else toast.style.background = '#FFB347';
  setTimeout(() => { toast.className = 'toast'; }, 1500);
}

/* ========== 登录 ========== */
async function handleLogin() {
  const usernameEl = document.getElementById('login-username');
  const passwordEl = document.getElementById('login-password');
  const username = usernameEl ? usernameEl.value.trim() : '';
  const password = passwordEl ? passwordEl.value : '';
  if (!username || !password) { showToast('请输入用户名和密码', 'error'); return; }
  try {
    const data = await apiFetch('/auth/login', { method: 'POST', body: { username, password } });
    setAuth(data.token, data.user);
    showToast('登录成功！', 'success');
    setTimeout(function () { window.location.href = 'dashboard.html'; }, 600);
  } catch (err) {
    showToast(err.message || '登录失败', 'error');
  }
}

function initLoginEnter() {
  ['login-username', 'login-password'].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', function (e) { if (e.key === 'Enter') handleLogin(); });
  });
}

/* ========== 注册 ========== */
let selectedAvatar = 'pink';

function selectAvatar(element, color) {
  document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
  element.classList.add('selected');
  selectedAvatar = color;
}

async function handleRegister() {
  const usernameEl = document.getElementById('reg-username');
  const nicknameEl = document.getElementById('reg-nickname');
  const passwordEl = document.getElementById('reg-password');
  const confirmEl = document.getElementById('reg-confirm');
  const username = usernameEl ? usernameEl.value.trim() : '';
  const nickname = nicknameEl ? nicknameEl.value.trim() : '';
  const password = passwordEl ? passwordEl.value : '';
  const confirmPassword = confirmEl ? confirmEl.value : '';
  if (!username || username.length < 3) { showToast('用户名至少3位', 'error'); return; }
  if (!nickname) { showToast('请输入昵称', 'error'); return; }
  if (!password || password.length < 6) { showToast('密码不能少于6位', 'error'); return; }
  if (getPasswordStrength(password) === 'weak') { showToast('密码强度太弱', 'error'); return; }
  if (password !== confirmPassword) { showToast('两次密码不一致', 'error'); return; }
  try {
    await apiFetch('/auth/register', { method: 'POST', body: { username, nickname, password, confirmPassword, avatar: selectedAvatar } });
    showToast('注册成功！', 'success');
    setTimeout(function () { window.location.href = 'login.html'; }, 1000);
  } catch (err) {
    showToast(err.message || '注册失败', 'error');
  }
}

function getPasswordStrength(pwd) {
  if (!pwd) return 'weak';
  const hasLower = /[a-z]/.test(pwd), hasUpper = /[A-Z]/.test(pwd);
  const hasDigit = /\d/.test(pwd), hasSpecial = /[^A-Za-z0-9]/.test(pwd);
  if (hasDigit && (hasLower || hasUpper) && (hasUpper || hasSpecial)) return 'strong';
  if (hasDigit && (hasLower || hasUpper)) return 'medium';
  return 'weak';
}

function checkPasswordStrength() {
  const passwordEl = document.getElementById('reg-password');
  const password = passwordEl ? passwordEl.value : '';
  const strengthText = document.querySelector('.strength-text');
  const fills = document.querySelectorAll('.strength-fill');
  const level = getPasswordStrength(password);
  fills.forEach(fill => { fill.className = 'strength-fill'; });
  if (level === 'strong') {
    if (strengthText) strengthText.textContent = '密码强度：强';
    fills[0].classList.add('strong'); fills[1].classList.add('strong'); fills[2].classList.add('strong');
  } else if (level === 'medium') {
    if (strengthText) strengthText.textContent = '密码强度：中等';
    fills[0].classList.add('medium'); fills[1].classList.add('medium');
  } else {
    if (strengthText) strengthText.textContent = '密码强度：弱';
    if (password) fills[0].classList.add('weak');
  }
}

/* ========== 退出登录 ========== */
function handleLogout() {
  if (confirm('确定退出登录？')) {
    clearAuth();
    showToast('已退出登录', 'success');
    setTimeout(function () { window.location.href = 'login.html'; }, 800);
  }
}

/* ========== 用户信息回显 ========== */
function loadUserInfo() {
  const user = getCurrentUser();
  const avatar = (user && user.avatar) || 'pink';
  const displayName = (user && (user.nickname || user.username)) || '记账达人';
  const greetingEl = document.getElementById('greeting-text');
  if (greetingEl) greetingEl.textContent = getGreeting() + '，' + displayName;
  const dateEl = document.querySelector('.date');
  if (dateEl) dateEl.textContent = getDateDisplay();
  renderAvatar(document.getElementById('user-avatar'), avatar, 24);
}

function loadLoginAvatar() {
  let last = null;
  try { last = JSON.parse(localStorage.getItem(LAST_USER_KEY) || 'null'); } catch (e) { last = null; }
  if (!last) return;
  const displayEl = document.getElementById('login-avatar-display');
  if (displayEl) displayEl.style.display = 'flex';
  renderAvatar(document.getElementById('login-avatar-svg'), last.avatar, 48);
  const usernameEl = document.getElementById('login-username');
  if (usernameEl && !usernameEl.value && last.username) usernameEl.value = last.username;
}

function loadSettingsInfo() {
  const user = getCurrentUser();
  const avatar = (user && user.avatar) || 'pink';
  const nickname = (user && user.nickname) || '记账达人';
  const username = (user && user.username) || '';
  renderAvatar(document.getElementById('settings-avatar-svg'), avatar, 48);
  const nameInput = document.querySelector('.user-name-input');
  if (nameInput) nameInput.value = nickname;
  const userIdEl = document.querySelector('.user-id');
  if (userIdEl) userIdEl.textContent = '用户名：' + username;
}

async function refreshProfile(target) {
  try {
    const user = await apiFetch('/auth/profile', { auth: true });
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem('app_username', user.username);
    localStorage.setItem('app_userAvatar', user.avatar);
    if (target === 'settings') loadSettingsInfo();
    else loadUserInfo();
  } catch (err) {
    clearAuth();
    window.location.replace('login.html');
  }
}

/* ========== Dashboard 数据加载 ========== */
async function loadDashboardData() {
  try {
    // 并行请求月度概览、今日支出、近期账单、储备金
    const [monthly, today, recent] = await Promise.all([
      apiFetch('/transactions/monthly', { auth: true }),
      apiFetch('/transactions/today', { auth: true }),
      apiFetch('/transactions?pageSize=5', { auth: true }),
    ]);

    // 月度概览卡片
    const overviewAmount = document.querySelector('.overview-amount');
    if (overviewAmount) overviewAmount.textContent = formatMoney(monthly.balance);

    const statItems = document.querySelectorAll('.stat-value');
    if (statItems.length >= 3) {
      statItems[0].textContent = '+' + formatMoney(monthly.reserve);
      statItems[1].textContent = '-' + formatMoney(monthly.totalExpense);
      statItems[2].textContent = formatMoney(monthly.balance);
    }

    // 储备金标签
    const reserveLabels = document.querySelectorAll('.stat-label');
    if (reserveLabels.length >= 1) reserveLabels[0].textContent = '储备金';

    // 进度条
    const progressInfo = document.querySelector('.progress-info span:first-child');
    if (progressInfo) progressInfo.textContent = '储备金 ' + formatMoney(monthly.reserve);
    const progressPct = document.querySelector('.progress-pct');
    if (progressPct) progressPct.textContent = '已用 ' + monthly.progressPercent + '%';
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) progressFill.style.width = Math.min(monthly.progressPercent, 100) + '%';

    // 月份选择器
    const monthSelector = document.querySelector('.month-selector');
    if (monthSelector) {
      const d = new Date();
      monthSelector.textContent = (d.getMonth() + 1) + '月';
    }

    // 今日支出
    const txSummary = document.querySelector('.tx-summary');
    if (txSummary) txSummary.textContent = '支出 ' + formatMoney(today.totalExpense);

    // 近期账单列表
    renderTransactionList(recent.list, '.transaction-list');

    // 检查储备金是否已设置
    const reserve = await apiFetch('/reserve/current', { auth: true });
    if (!reserve) {
      showReserveModal();
    }
  } catch (err) {
    console.error('加载首页数据失败:', err.message);
  }
}

function renderTransactionList(list, containerSelector) {
  const container = document.querySelector(containerSelector);
  if (!container) return;
  container.innerHTML = '';
  if (!list || list.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:20px;color:#9C8578;font-size:13px;">暂无账单</div>';
    return;
  }
  list.forEach(function (tx) {
    const isExpense = tx.type === 'expense';
    const amountStr = (isExpense ? '-' : '+') + formatMoney(tx.amount);
    const dateStr = tx.transactionDate ? tx.transactionDate.substring(5).replace('-', '月') + '日' : '';
    const noteStr = tx.note || '';
    const item = document.createElement('div');
    item.className = 'transaction-item';
    item.innerHTML =
      '<div class="tx-icon" style="background:' + (isExpense ? '#FDDDE6' : '#D5F5E8') + '">' +
        '<span style="font-size:18px;">' + getCategoryIcon(tx.categoryName) + '</span>' +
      '</div>' +
      '<div class="tx-info">' +
        '<div class="tx-name">' + tx.categoryName + '</div>' +
        '<div class="tx-note">' + (noteStr || dateStr) + '</div>' +
      '</div>' +
      '<div class="tx-amount ' + (isExpense ? 'expense' : 'income') + '">' + amountStr + '</div>';
    container.appendChild(item);
  });
}

function getCategoryIcon(name) {
  const icons = {
    '餐饮': '🍜', '交通': '🚗', '购物': '🛒', '娱乐': '🎮',
    '居住': '🏠', '医疗': '💊', '教育': '📚', '通讯': '📱',
    '人情': '🎁', '其他': '📌', '工资': '💰', '兼职': '💼',
    '理财': '📈',
  };
  return icons[name] || '📌';
}

/* ========== 储备金设置弹窗 ========== */
function showReserveModal() {
  const modal = document.getElementById('reserve-modal');
  if (modal) modal.classList.add('active');
}

function hideReserveModal() {
  const modal = document.getElementById('reserve-modal');
  if (modal) modal.classList.remove('active');
}

async function submitReserve() {
  const input = document.getElementById('reserve-amount-input');
  if (!input) return;
  const amount = parseFloat(input.value);
  if (!amount || amount <= 0) { showToast('请输入有效金额', 'error'); return; }
  try {
    await apiFetch('/reserve', { method: 'POST', auth: true, body: { amount } });
    showToast('储备金设置成功！', 'success');
    hideReserveModal();
    loadDashboardData();
  } catch (err) {
    showToast(err.message || '设置失败', 'error');
  }
}

/* ========== 快速记账 ========== */
let currentAmount = '0';
let numpadDisabled = false;
let expenseCategories = [];
let reserveCategories = [];

async function loadCategories() {
  try {
    const all = await apiFetch('/categories', { auth: true });
    expenseCategories = all.filter(c => c.type === 'expense');
    reserveCategories = all.filter(c => c.type === 'reserve');
    renderCategoryGrid('expense');
  } catch (err) {
    console.error('加载分类失败:', err.message);
  }
}

function renderCategoryGrid(type) {
  const grid = document.querySelector('.category-grid');
  if (!grid) return;
  const cats = type === 'expense' ? expenseCategories : reserveCategories;
  grid.innerHTML = '';
  cats.forEach(function (cat, i) {
    const item = document.createElement('div');
    item.className = 'cat-item' + (i === 0 ? ' active' : '');
    item.dataset.catId = cat.id;
    item.dataset.catName = cat.name;
    item.dataset.catColor = cat.bgColor;
    item.innerHTML =
      '<button class="cat-icon-btn" style="background:' + cat.bgColor + '">' +
        '<span style="font-size:22px;">' + cat.icon + '</span>' +
      '</button>' +
      '<span class="cat-label">' + cat.name + '</span>';
    item.addEventListener('click', function () {
      grid.querySelectorAll('.cat-item').forEach(el => el.classList.remove('active'));
      item.classList.add('active');
    });
    grid.appendChild(item);
  });
}

function showQuickAdd() {
  numpadDisabled = false;
  currentAmount = '0';
  updateAmountDisplay();
  const dateBtn = document.querySelector('.date-btn');
  if (dateBtn) dateBtn.textContent = getTodayDisplay();
  document.getElementById('quick-add-sheet').classList.add('active');
}

function hideQuickAdd() {
  document.getElementById('quick-add-sheet').classList.remove('active');
}

async function completeQuickAdd() {
  const amount = document.getElementById('quick-amount').textContent;
  if (amount === '0' || amount === '0.00' || amount === '') {
    showToast('请输入金额', 'error'); return;
  }
  const activeTypeTab = document.querySelector('.type-tab.active');
  const type = activeTypeTab ? activeTypeTab.dataset.type : 'expense';
  const activeCat = document.querySelector('.cat-item.active');
  const categoryId = activeCat ? parseInt(activeCat.dataset.catId) : undefined;
  const categoryName = activeCat ? activeCat.dataset.catName : '其他';
  const noteInput = document.querySelector('.note-input');
  const note = noteInput ? noteInput.value.trim() : '';

  try {
    await apiFetch('/transactions', {
      method: 'POST', auth: true,
      body: { type, amount: parseFloat(amount), categoryId, categoryName, transactionDate: getTodayStr(), note },
    });
    showToast('记账成功！', 'success');
    currentAmount = '0';
    if (noteInput) noteInput.value = '';
    hideQuickAdd();
    // 刷新首页数据
    if (currentPage() === 'dashboard.html') loadDashboardData();
  } catch (err) {
    showToast(err.message || '记账失败', 'error');
  }
}

/* ========== 数字键盘 ========== */
function inputNum(num) {
  if (numpadDisabled) return;
  if (currentAmount === '0' && num !== '.') currentAmount = num;
  else if (num === '.' && currentAmount.includes('.')) return;
  else currentAmount += num;
  updateAmountDisplay();
}

function deleteNum() {
  if (numpadDisabled) return;
  if (currentAmount.length <= 1) currentAmount = '0';
  else currentAmount = currentAmount.slice(0, -1);
  updateAmountDisplay();
}

function updateAmountDisplay() {
  const el = document.getElementById('quick-amount');
  if (el) el.textContent = currentAmount;
}

/* ========== 类型切换 ========== */
function initTypeTabs() {
  document.querySelectorAll('.type-tab').forEach(tab => {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.type-tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      renderCategoryGrid(this.dataset.type);
    });
  });
}

/* ========== Transactions 页面 ========== */
let txPage = 1;
let txLoading = false;
let txHasMore = true;
let txFilterType = 'all';
let txFilterMonth = getCurrentMonth();

async function loadTransactions(reset) {
  if (txLoading) return;
  if (!reset && !txHasMore) return;
  if (reset) { txPage = 1; txHasMore = true; document.querySelector('.transaction-list').innerHTML = ''; }
  txLoading = true;
  try {
    const data = await apiFetch('/transactions?page=' + txPage + '&pageSize=20&month=' + txFilterMonth + '&type=' + txFilterType, { auth: true });
    renderTransactionListAppend(data.list);
    txHasMore = data.list.length >= data.pageSize;
    txPage++;
  } catch (err) {
    console.error('加载账单失败:', err.message);
  }
  txLoading = false;
}

function renderTransactionListAppend(list) {
  const container = document.querySelector('.transaction-list');
  if (!container) return;
  if (!list || list.length === 0) {
    if (txPage === 1) container.innerHTML = '<div style="text-align:center;padding:20px;color:#9C8578;font-size:13px;">暂无账单</div>';
    return;
  }
  // 按日期分组
  let currentDate = '';
  list.forEach(function (tx) {
    const dateStr = tx.transactionDate;
    if (dateStr !== currentDate) {
      currentDate = dateStr;
      const d = new Date(dateStr);
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const display = (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + weekDays[d.getDay()];
      const group = document.createElement('div');
      group.className = 'tx-date-group';
      group.innerHTML = '<div class="tx-date">' + display + '</div><div class="tx-summary"></div>';
      container.appendChild(group);
    }
    const isExpense = tx.type === 'expense';
    const item = document.createElement('div');
    item.className = 'transaction-item';
    item.innerHTML =
      '<div class="tx-icon" style="background:' + (isExpense ? '#FDDDE6' : '#D5F5E8') + '">' +
        '<span style="font-size:18px;">' + getCategoryIcon(tx.categoryName) + '</span>' +
      '</div>' +
      '<div class="tx-info">' +
        '<div class="tx-name">' + tx.categoryName + '</div>' +
        '<div class="tx-note">' + (tx.note || '') + '</div>' +
      '</div>' +
      '<div class="tx-amount ' + (isExpense ? 'expense' : 'income') + '">' +
        (isExpense ? '-' : '+') + formatMoney(tx.amount) + '</div>';
    container.appendChild(item);
  });
}

function initTransactionsScroll() {
  const content = document.querySelector('.content');
  if (!content) return;
  content.addEventListener('scroll', function () {
    if (content.scrollTop + content.clientHeight >= content.scrollHeight - 50) {
      loadTransactions(false);
    }
  });
}

function initTransactionsFilter() {
  document.querySelectorAll('.filter-tag').forEach(tag => {
    tag.addEventListener('click', function () {
      document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      const text = this.textContent;
      if (text === '全部') txFilterType = 'all';
      else if (text === '支出') txFilterType = 'expense';
      else txFilterType = 'reserve';
      loadTransactions(true);
    });
  });
}

/* ========== Statistics 页面 ========== */
let currentPeriod = 'month';
let lineChart = null;
let pieChart = null;

async function loadStatistics(period) {
  currentPeriod = period || currentPeriod;
  try {
    const [trend, category, ranking] = await Promise.all([
      apiFetch('/statistics/trend?period=' + currentPeriod, { auth: true }),
      apiFetch('/statistics/category?period=' + currentPeriod, { auth: true }),
      apiFetch('/statistics/ranking?period=' + currentPeriod, { auth: true }),
    ]);
    renderLineChart(trend);
    renderPieChart(category);
    renderRanking(ranking);
    // 更新副标题
    const subtitle = document.querySelector('.card-subtitle');
    if (subtitle) subtitle.textContent = '总支出 ' + formatMoney(category.totalExpense);
  } catch (err) {
    console.error('加载统计失败:', err.message);
  }
}

function renderLineChart(data) {
  const el = document.getElementById('lineChart');
  if (!el || typeof echarts === 'undefined') return;
  if (!lineChart) lineChart = echarts.init(el);
  lineChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 10, right: 10, top: 10, bottom: 20, containLabel: true },
    xAxis: {
      type: 'category', data: data.labels,
      axisLine: { show: false }, axisTick: { show: false },
      axisLabel: { color: '#9C8578', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', color: '#F2E8E0' } },
      axisLabel: { color: '#9C8578', fontSize: 11 },
    },
    series: [{
      type: 'line', smooth: true, symbol: 'circle', symbolSize: 6,
      data: data.data,
      lineStyle: { color: '#F2A6C0', width: 2.5 },
      itemStyle: { color: '#E8849E' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(242,166,192,0.3)' },
          { offset: 1, color: 'rgba(242,166,192,0.02)' },
        ]),
      },
    }],
  });
}

function renderPieChart(data) {
  const el = document.getElementById('pieChart');
  if (!el || typeof echarts === 'undefined') return;
  if (!pieChart) pieChart = echarts.init(el);
  const pieData = data.list.map(function (item) {
    const pct = data.totalExpense > 0 ? Math.round(item.value / data.totalExpense * 100) : 0;
    return { value: item.value, name: item.name + ' ' + pct + '%', itemStyle: { color: item.color } };
  });
  pieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: {
      orient: 'vertical', right: 10, top: 'center',
      textStyle: { color: '#4A3728', fontSize: 13 },
      itemWidth: 10, itemHeight: 10, itemGap: 12,
    },
    series: [{
      type: 'pie', radius: ['40%', '65%'], center: ['35%', '50%'],
      avoidLabelOverlap: false, label: { show: false },
      data: pieData,
    }],
  });
}

function renderRanking(data) {
  const container = document.querySelector('.rank-list');
  if (!container) return;
  container.innerHTML = '';
  if (!data.list || data.list.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:16px;color:#9C8578;font-size:13px;">暂无数据</div>';
    return;
  }
  data.list.forEach(function (item, i) {
    const row = document.createElement('div');
    row.className = 'rank-item';
    row.innerHTML =
      '<span class="rank-no" style="background:' + item.color + '">' + (i + 1) + '</span>' +
      '<span class="rank-name">' + item.icon + ' ' + item.name + '</span>' +
      '<span class="rank-amount">' + formatMoney(item.amount) + '</span>';
    container.appendChild(row);
  });
}

function initStatisticsTabs() {
  document.querySelectorAll('.time-tab').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.time-tab').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const text = this.textContent;
      const period = text === '周' ? 'week' : text === '月' ? 'month' : 'year';
      loadStatistics(period);
    });
  });
}

/* ========== Settings 页面 ========== */
function initEditName() {
  const editBtn = document.getElementById('edit-name-btn');
  const nameInput = document.getElementById('settings-username-input');
  if (!editBtn || !nameInput) return;
  let isEditing = false;
  editBtn.addEventListener('click', function () {
    if (!isEditing) {
      nameInput.readOnly = false;
      nameInput.style.borderColor = 'var(--pink)';
      nameInput.focus();
      nameInput.select();
      isEditing = true;
    } else {
      saveName();
    }
  });
  nameInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') saveName(); });
  nameInput.addEventListener('blur', function () { if (isEditing) saveName(); });

  async function saveName() {
    const newName = nameInput.value.trim();
    if (!newName) return;
    try {
      const user = await apiFetch('/auth/nickname', { method: 'PUT', auth: true, body: { nickname: newName } });
      // 更新本地缓存
      const local = getCurrentUser();
      if (local) { local.nickname = user.nickname; localStorage.setItem(USER_KEY, JSON.stringify(local)); }
      showToast('昵称已更新', 'success');
    } catch (err) {
      showToast(err.message || '修改失败', 'error');
    }
    nameInput.readOnly = true;
    nameInput.style.borderColor = '';
    isEditing = false;
  }
}

async function handleExport() {
  try {
    const list = await apiFetch('/transactions/export', { auth: true });
    if (!list || list.length === 0) { showToast('暂无账单可导出', 'error'); return; }
    // 生成 CSV
    const header = '日期,类型,分类,金额,备注\n';
    const rows = list.map(function (tx) {
      const type = tx.type === 'expense' ? '支出' : '储备金';
      return [tx.transactionDate, type, tx.categoryName, tx.amount, '"' + (tx.note || '') + '"'].join(',');
    }).join('\n');
    const csv = '\uFEFF' + header + rows; // BOM for Excel
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '账单导出_' + getTodayStr() + '.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('导出成功', 'success');
  } catch (err) {
    showToast(err.message || '导出失败', 'error');
  }
}

/* ========== 物理键盘支持 ========== */
document.addEventListener('keydown', function (e) {
  const sheet = document.getElementById('quick-add-sheet');
  if (!sheet || !sheet.classList.contains('active')) return;
  if (document.activeElement && document.activeElement.classList.contains('note-input')) return;
  if (e.key >= '0' && e.key <= '9') inputNum(e.key);
  else if (e.key === '.') inputNum('.');
  else if (e.key === 'Backspace') deleteNum();
});

/* ========== 备注输入 ========== */
function initNoteInput() {
  const noteInput = document.querySelector('.note-input');
  const numpad = document.querySelector('.numpad');
  if (!noteInput || !numpad) return;
  noteInput.addEventListener('focus', function () {
    numpadDisabled = true;
    numpad.classList.add('disabled');
  });
  noteInput.addEventListener('blur', function () {
    setTimeout(function () { numpadDisabled = false; numpad.classList.remove('disabled'); }, 100);
  });
}

/* ========== 页面初始化 & 路由守卫 ========== */
(async function initApp() {
  const page = currentPage();
  const protectedPages = ['dashboard.html', 'transactions.html', 'statistics.html', 'settings.html'];

  if (protectedPages.indexOf(page) !== -1) {
    if (!isLoggedIn()) {
      window.location.replace('login.html');
      return;
    }
    // 先验证 token 有效性，无效则跳登录，避免页面闪烁零值
    try {
      await apiFetch('/auth/profile', { auth: true });
    } catch (err) {
      clearAuth();
      window.location.replace('login.html');
      return;
    }
  }

  if (page === 'login.html') {
    loadLoginAvatar();
    initLoginEnter();
  } else if (page === 'dashboard.html') {
    loadUserInfo();
    refreshProfile('dashboard');
    loadCategories().then(function () { loadDashboardData(); });
    initTypeTabs();
  } else if (page === 'transactions.html') {
    loadTransactions(true);
    initTransactionsScroll();
    initTransactionsFilter();
  } else if (page === 'statistics.html') {
    loadStatistics('month');
    initStatisticsTabs();
  } else if (page === 'settings.html') {
    loadSettingsInfo();
    initEditName();
    refreshProfile('settings');
    // 导出按钮
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) exportBtn.addEventListener('click', handleExport);
  }

  // 通用初始化
  initNoteInput();
  initTypeTabs();

  // 分类选择事件委托
  document.addEventListener('click', function (e) {
    const catItem = e.target.closest('.cat-item');
    if (catItem && catItem.parentElement.classList.contains('category-grid')) {
      catItem.parentElement.querySelectorAll('.cat-item').forEach(i => i.classList.remove('active'));
      catItem.classList.add('active');
    }
  });
})();

console.log('日常记账应用已启动');
