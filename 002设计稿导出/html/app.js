/* ========================================
   日常记账 - 交互逻辑
   ======================================== */

// --- 页面切换 ---
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
}

function switchTab(index) {
  const pages = ['page-dashboard', 'page-transactions', 'page-statistics', 'page-budget', 'page-settings'];
  document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
  document.getElementById(pages[index]).classList.add('active');
}

// --- 登录 ---
function handleLogin() {
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  
  if (!username || !password) {
    showToast('请输入用户名和密码', 'error');
    return;
  }
  
  // 保存用户名到 localStorage（如果之前没有）
  if (!localStorage.getItem('username')) {
    localStorage.setItem('username', username);
  }
  
  // 模拟登录，跳转到首页
  window.location.href = 'dashboard.html';
}

// --- 注册 ---
let selectedAvatar = 'pink'; // 默认头像颜色

function selectAvatar(element, color) {
  document.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
  element.classList.add('selected');
  selectedAvatar = color;
}

function handleRegister() {
  const username = document.getElementById('reg-username').value;
  const password = document.getElementById('reg-password').value;
  const confirm = document.getElementById('reg-confirm').value;
  
  if (!username || username.length < 3) {
    showToast('用户名至少3位', 'error');
    return;
  }
  if (!password || password.length < 6) {
    showToast('密码至少6位', 'error');
    return;
  }
  if (password !== confirm) {
    showToast('两次密码不一致', 'error');
    return;
  }
  
  // 保存头像颜色到 localStorage
  localStorage.setItem('userAvatar', selectedAvatar);
  localStorage.setItem('username', username);
  
  showToast('注册成功！', 'success');
  setTimeout(() => window.location.href = 'login.html', 1000);
}

// --- 密码强度检测 ---
function checkPasswordStrength() {
  const password = document.getElementById('reg-password').value;
  const strengthText = document.querySelector('.strength-text');
  const fills = document.querySelectorAll('.strength-fill');
  
  let strength = 0;
  if (password.length >= 6) strength++;
  if (password.length >= 10) strength++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  
  // 重置所有进度条
  fills.forEach(fill => {
    fill.className = 'strength-fill';
  });
  
  if (strength <= 2) {
    strengthText.textContent = '密码强度：弱';
    fills[0].classList.add('weak');
  } else if (strength <= 4) {
    strengthText.textContent = '密码强度：中等';
    fills[0].classList.add('medium');
    fills[1].classList.add('medium');
  } else {
    strengthText.textContent = '密码强度：强';
    fills[0].classList.add('strong');
    fills[1].classList.add('strong');
    fills[2].classList.add('strong');
  }
}

// --- 退出登录 ---
function handleLogout() {
  if (confirm('确定退出登录？')) {
    document.getElementById('app-container').style.display = 'none';
    document.getElementById('page-login').style.display = 'block';
    showToast('已退出登录', 'success');
  }
}

// --- 快速记账 ---
function showQuickAdd() {
  document.getElementById('quick-add-sheet').classList.add('active');
}

function hideQuickAdd() {
  document.getElementById('quick-add-sheet').classList.remove('active');
}

function completeQuickAdd() {
  const amount = document.getElementById('quick-amount').textContent;
  if (amount === '0.00') {
    showToast('请输入金额', 'error');
    return;
  }
  showToast('记账成功！', 'success');
  document.getElementById('quick-amount').textContent = '0.00';
  document.getElementById('quick-note-input').value = '';
  setTimeout(() => hideQuickAdd(), 800);
}

// --- Toast ---
function showToast(message, type) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = 'toast show';
  if (type === 'error') toast.style.background = '#E8849E';
  else if (type === 'success') toast.style.background = '#7BC89C';
  else toast.style.background = '#FFB347';
  
  setTimeout(() => { toast.className = 'toast'; }, 1500);
}

// --- 类型切换 ---
document.querySelectorAll('.type-tab').forEach(tab => {
  tab.addEventListener('click', function() {
    document.querySelectorAll('.type-tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
  });
});

// --- 分类选择 ---
document.querySelectorAll('.cat-item').forEach(item => {
  item.addEventListener('click', function() {
    document.querySelectorAll('.cat-item').forEach(i => i.classList.remove('active'));
    this.classList.add('active');
  });
});

// --- 筛选标签 ---
document.querySelectorAll('.filter-tag').forEach(tag => {
  tag.addEventListener('click', function() {
    document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
  });
});

// --- 时间切换 ---
document.querySelectorAll('.time-tabs button').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.time-tabs button').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
  });
});

// --- 主题切换 ---
document.querySelector('.toggle')?.addEventListener('click', function() {
  const knob = this.querySelector('.toggle-knob');
  if (knob.style.left === '22px') {
    knob.style.left = '2px';
    this.style.background = 'var(--border)';
  } else {
    knob.style.left = '22px';
    this.style.background = 'var(--pink)';
  }
});

// --- 数字键盘输入 ---
let currentAmount = '0';

// 数字键盘按钮点击
function inputNum(num) {
  if (currentAmount === '0' && num !== '.') {
    currentAmount = num;
  } else if (num === '.' && currentAmount.includes('.')) {
    return; // 已有小数点，不能再输入
  } else {
    currentAmount += num;
  }
  updateAmountDisplay();
}

// 删除最后一位
function deleteNum() {
  if (currentAmount.length <= 1) {
    currentAmount = '0';
  } else {
    currentAmount = currentAmount.slice(0, -1);
  }
  updateAmountDisplay();
}

// 键盘事件（支持物理键盘）
document.addEventListener('keydown', function(e) {
  if (!document.getElementById('quick-add-sheet').classList.contains('active')) return;
  
  if (e.key >= '0' && e.key <= '9') {
    inputNum(e.key);
  } else if (e.key === '.') {
    inputNum('.');
  } else if (e.key === 'Backspace') {
    deleteNum();
  }
});

function updateAmountDisplay() {
  document.getElementById('quick-amount').textContent = currentAmount;
}

// --- 初始化 ---
console.log('日常记账应用已启动');

// --- 首页用户信息显示 ---
function loadUserInfo() {
  const avatar = localStorage.getItem('userAvatar') || 'pink';
  const username = localStorage.getItem('username') || '记账达人';
  
  // 头像颜色映射
  const colorMap = {
    pink: { bg: '#FDDDE6', fill: '#E8849E' },
    orange: { bg: '#FFE5C2', fill: '#FFD6A5' },
    mint: { bg: '#D5F5E8', fill: '#B8E6D0' },
    lavender: { bg: '#E8DFF5', fill: '#C9B8E6' },
    blue: { bg: '#D5EEF5', fill: '#A8D8EA' }
  };
  
  const colors = colorMap[avatar] || colorMap.pink;
  
  // 更新用户名
  const greetingEl = document.getElementById('greeting-text');
  if (greetingEl) {
    greetingEl.textContent = `早上好，${username}`;
  }
  
  // 更新头像
  const avatarSvg = document.getElementById('user-avatar');
  if (avatarSvg) {
    avatarSvg.innerHTML = `
      <circle cx="12" cy="12" r="12" fill="${colors.bg}"/>
      <circle cx="12" cy="10" r="4" fill="${colors.fill}"/>
      <ellipse cx="12" cy="18" rx="7" ry="5" fill="${colors.fill}"/>
      <path d="M10 9a1 1 0 012 0M10 11c0 1 1 1.5 2 1.5s2-.5 2-1.5" stroke="#4A3728" stroke-width="0.75" fill="none" stroke-linecap="round"/>
    `;
  }
}

// 页面加载时执行
if (window.location.pathname.includes('dashboard.html')) {
  window.addEventListener('DOMContentLoaded', loadUserInfo);
}

// --- 账单项点击跳转详情 ---
document.querySelectorAll('.transaction-item').forEach(item => {
  item.addEventListener('click', function() {
    window.location.href = 'transaction_detail.html';
  });
});
