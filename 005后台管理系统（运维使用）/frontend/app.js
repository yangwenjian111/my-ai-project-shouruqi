/* ========================================
   后台管理系统 - 全局交互
   认证 + API 封装 + Toast + 分页 + 路由守卫
   ======================================== */

/* ========== API 配置 ========== */
var API_BASE = 'http://localhost:3001/api/admin';

/* ========== 认证状态 ========== */
var TOKEN_KEY = 'admin_token';
var ADMIN_KEY = 'admin_user';

function getToken() { return localStorage.getItem(TOKEN_KEY); }
function getAdmin() {
  try { return JSON.parse(localStorage.getItem(ADMIN_KEY) || 'null'); } catch (e) { return null; }
}
function isLoggedIn() { return !!getToken(); }

function setAuth(token, admin) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
}

function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
}

/* ========== API 请求封装 ========== */
function apiFetch(path, options) {
  var opts = options || {};
  var method = opts.method || 'GET';
  var headers = { 'Content-Type': 'application/json' };
  if (opts.auth !== false) {
    var token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;
  }
  return fetch(API_BASE + path, {
    method: method,
    headers: headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  }).then(function (res) {
    return res.json().then(function (data) {
      if (!res.ok || !data || data.code !== 0) {
        var err = new Error((data && data.message) || ('请求失败 (' + res.status + ')'));
        err.status = res.status;
        if (res.status === 401) { clearAuth(); redirectToLogin(); }
        throw err;
      }
      return data.data;
    });
  });
}

/* ========== Toast ========== */
function showToast(message, type) {
  var toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = 'toast toast-' + (type || 'info') + ' show';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(function () {
    toast.classList.remove('show');
  }, 3000);
}

/* ========== 路由守卫 ========== */
function redirectToLogin() {
  var page = location.pathname.split('/').pop() || 'dashboard.html';
  if (page === 'login.html' || page === 'index.html') return;
  location.href = 'login.html';
}

function checkAuth() {
  if (!isLoggedIn()) {
    redirectToLogin();
    return false;
  }
  return true;
}

/* ========== 分页渲染 ========== */
function renderPagination(container, total, page, pageSize, onPageChange) {
  var totalPages = Math.ceil(total / pageSize) || 1;
  var start = (page - 1) * pageSize + 1;
  var end = Math.min(page * pageSize, total);

  var info = total > 0
    ? '显示 ' + start + '-' + end + ' 条，共 ' + total + ' 条'
    : '暂无数据';

  var html = '<div class="pagination-info">' + info + '</div>';
  html += '<div class="pagination-btns">';
  html += '<button ' + (page <= 1 ? 'disabled' : '') + ' data-page="' + (page - 1) + '">上一页</button>';

  var startPage = Math.max(1, page - 2);
  var endPage = Math.min(totalPages, page + 2);

  if (startPage > 1) {
    html += '<button data-page="1">1</button>';
    if (startPage > 2) html += '<button disabled>...</button>';
  }

  for (var i = startPage; i <= endPage; i++) {
    html += '<button data-page="' + i + '" class="' + (i === page ? 'active' : '') + '">' + i + '</button>';
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) html += '<button disabled>...</button>';
    html += '<button data-page="' + totalPages + '">' + totalPages + '</button>';
  }

  html += '<button ' + (page >= totalPages ? 'disabled' : '') + ' data-page="' + (page + 1) + '">下一页</button>';
  html += '</div>';

  container.innerHTML = html;

  container.querySelectorAll('.pagination-btns button[data-page]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var p = parseInt(this.getAttribute('data-page'));
      if (p >= 1 && p <= totalPages) onPageChange(p);
    });
  });
}

/* ========== 格式化 ========== */
function formatAmount(amount) {
  return '¥' + Number(amount || 0).toFixed(2);
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  var d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  var y = d.getFullYear();
  var m = String(d.getMonth() + 1).padStart(2, '0');
  var day = String(d.getDate()).padStart(2, '0');
  var h = String(d.getHours()).padStart(2, '0');
  var min = String(d.getMinutes()).padStart(2, '0');
  return y + '-' + m + '-' + day + ' ' + h + ':' + min;
}

function formatType(type) {
  return type === 'expense' ? '支出' : '储备金';
}

function formatStatus(status) {
  return status === 1 ? '正常' : '注销';
}

/* ========== 退出登录 ========== */
function handleLogout() {
  clearAuth();
  location.href = 'login.html';
}

/* ========== 侧边栏高亮 ========== */
function highlightNav(activePage) {
  document.querySelectorAll('.nav-item').forEach(function (item) {
    if (item.getAttribute('data-page') === activePage) {
      item.classList.add('active');
    }
  });
  var admin = getAdmin();
  var el = document.getElementById('admin-name');
  if (el && admin) el.textContent = admin.nickname || admin.username;
}

/* ========== 搜索防抖 ========== */
function debounce(fn, delay) {
  var timer;
  return function () {
    var args = arguments;
    var ctx = this;
    clearTimeout(timer);
    timer = setTimeout(function () { fn.apply(ctx, args); }, delay);
  };
}

/* ========== 确认弹窗 ========== */
function showConfirm(title, message, onConfirm) {
  var overlay = document.getElementById('confirm-overlay');
  if (!overlay) return;
  overlay.querySelector('h4').textContent = title;
  overlay.querySelector('p').textContent = message;
  overlay.classList.add('show');

  var confirmBtn = overlay.querySelector('.btn-danger');
  var cancelBtn = overlay.querySelector('.btn-outline');

  function close() {
    overlay.classList.remove('show');
    confirmBtn.removeEventListener('click', onOk);
    cancelBtn.removeEventListener('click', close);
  }

  function onOk() {
    close();
    onConfirm();
  }

  confirmBtn.addEventListener('click', onOk);
  cancelBtn.addEventListener('click', close);
}

/* ========== Loading ========== */
function showLoading(container) {
  container.innerHTML = '<div class="loading"><div class="loading-spinner"></div><p>加载中...</p></div>';
}

function showEmpty(container, text) {
  container.innerHTML = '<div class="empty-state"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-3.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg><p>' + (text || '暂无数据') + '</p></div>';
}
