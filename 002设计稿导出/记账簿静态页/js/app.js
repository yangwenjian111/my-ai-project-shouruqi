/* ==========================================================================
   记账簿 · 静态页
   app.js —— 轻交互（原生 JS，无任何依赖）
     1. 画板等比缩放，适配任意窗口
     2. 页面跳转：底部导航 / 记账按钮 / 账单条目 / 登录注册入口 / 返回
     3. 分段控件：支出-收入、筛选、周-月-年、主题
     4. 数字键盘：点击录入金额
   用到的定位方式是设计稿的图层名（data-name），改结构时不用动这个文件。
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };

  /* ------------------------------------------------------------------ *
   * 1. 画板等比缩放
   * ------------------------------------------------------------------ */
  var stage = $('.stage');

  function fit() {
    if (!stage) return;
    var w = stage.offsetWidth;
    var h = stage.offsetHeight;
    if (!w || !h) return;
    var pad = window.innerWidth > w + 96 ? 48 : 0;   /* 嵌在 iframe 里时不留边距 */
    var scale = Math.min(
      (window.innerWidth - pad) / w,
      (window.innerHeight - pad) / h,
      1
    );
    if (scale < 0.2) scale = 0.2;
    stage.style.transform = 'scale(' + scale.toFixed(4) + ')';
  }

  window.addEventListener('resize', fit);
  window.addEventListener('orientationchange', fit);

  /* ------------------------------------------------------------------ *
   * 2. 页面跳转表：图层名 -> 目标页面
   * ------------------------------------------------------------------ */
  var NAV = {
    '首页Tab': 'home.html',
    '账单Tab': 'bills.html',
    '统计Tab': 'stats.html',
    '预算Tab': 'budget.html',
    '设置Tab': 'settings.html',

    '记账按钮': 'quick-entry.html',
    '完成按钮': 'home.html',
    '编辑按钮': 'quick-entry.html',
    '删除按钮': 'bills.html',
    '搜索按钮': 'bills.html',
    '查看全部': 'bills.html',
    '管理入口': 'budget.html',

    '登录按钮': 'home.html',
    '登录入口': 'login.html',
    '注册按钮': 'register.html',
    '注册入口': 'register.html',
    '返回按钮': null   // 走 history.back()
  };

  var BILL_ITEM = /^账单(条|信息)?\d*$|^账单\d$/;

  function isBillItem(name) {
    return /^账单条\d$/.test(name) || /^账单[123]$/.test(name);
  }

  /* ------------------------------------------------------------------ *
   * 3. 分段控件：支出-收入、筛选、周-月-年、主题
   *    做法：点击时把"当前选中段"和"被点段"的视觉样式互换，
   *    这样不用为每个容器写死选中态颜色，设计稿什么样就什么样。
   * ------------------------------------------------------------------ */
  var SEGMENTS = ['类型切换', '筛选行', '时间切换', '主题选择器'];

  function hasPaint(el) {
    var cs = getComputedStyle(el);
    if (cs.backgroundImage && cs.backgroundImage !== 'none') return true;
    var bg = cs.backgroundColor || '';
    var m = bg.match(/rgba?\(([^)]+)\)/);
    if (!m) return false;
    var parts = m[1].split(',').map(parseFloat);
    return parts.length < 4 || parts[3] > 0.01;
  }

  function snapshot(el) {
    var cs = getComputedStyle(el);
    return {
      bg: cs.backgroundColor,
      bgImage: cs.backgroundImage,
      shadow: cs.boxShadow,
      textColors: $$('.tx', el).map(function (t) { return getComputedStyle(t).color; })
    };
  }

  function applySnapshot(el, snap) {
    el.style.backgroundColor = snap.bg;
    el.style.backgroundImage = snap.bgImage;
    el.style.boxShadow = snap.shadow;
    $$('.tx', el).forEach(function (t, i) {
      if (snap.textColors[i]) t.style.color = snap.textColors[i];
    });
  }

  function bindSegments() {
    SEGMENTS.forEach(function (name) {
      var box = $('[data-name="' + name + '"]');
      if (!box) return;
      var items = Array.prototype.slice.call(box.children)
        .filter(function (el) { return el.getAttribute('data-name'); });
      if (items.length < 2) return;

      items.forEach(function (item) {
        item.classList.add('is-clickable');
        item.addEventListener('click', function () {
          if (item.classList.contains('seg-active')) return;
          var current = items.filter(function (o) {
            return o.classList.contains('seg-active') || hasPaint(o);
          })[0];
          if (!current) return;
          var a = snapshot(current);
          var b = snapshot(item);
          applySnapshot(item, a);
          applySnapshot(current, b);
          current.classList.remove('seg-active');
          item.classList.add('seg-active');
        });
      });

      /* 记下设计稿里默认选中的那一段 */
      var first = items.filter(hasPaint)[0];
      if (first) first.classList.add('seg-active');
    });
  }

  /* ------------------------------------------------------------------ *
   * 4. 数字键盘
   * ------------------------------------------------------------------ */
  var KEYPAD_KEYS = /^(键[0-9]|小数点|退格)$/;

  function bindKeypad() {
    var amountEl = $('[data-name="金额"]');
    if (!amountEl) return;
    var raw = '';

    function render() {
      amountEl.textContent = '¥' + (raw === '' ? '0.00' : raw);
    }

    $$('[data-name]').forEach(function (el) {
      var name = el.getAttribute('data-name');
      if (!KEYPAD_KEYS.test(name)) return;
      el.classList.add('is-clickable');
      el.addEventListener('click', function () {
        el.classList.add('key-active');
        setTimeout(function () { el.classList.remove('key-active'); }, 120);

        if (name === '退格') {
          raw = raw.slice(0, -1);
        } else if (name === '小数点') {
          if (raw.indexOf('.') === -1) raw = (raw || '0') + '.';
        } else {
          var digit = name.slice(1);
          if (raw.indexOf('.') !== -1 && raw.split('.')[1].length >= 2) return;
          raw = (raw === '0' ? '' : raw) + digit;
          if (raw.replace('.', '').length > 8) return;
        }
        render();
      });
    });

    render();
  }

  /* ------------------------------------------------------------------ *
   * 5. 统一委托：页面跳转 + 输入框聚焦
   * ------------------------------------------------------------------ */
  function bindNav() {
    $$('[data-name]').forEach(function (el) {
      var name = el.getAttribute('data-name');
      if (name in NAV || isBillItem(name) || /输入框|占位|添加备注/.test(name)) {
        el.classList.add('is-clickable');
      }
    });

    document.addEventListener('click', function (e) {
      var el = e.target.closest ? e.target.closest('[data-name]') : null;
      if (!el) return;
      var name = el.getAttribute('data-name');

      if (name === '返回按钮') {
        if (history.length > 1) history.back();
        else location.href = 'login.html';
        return;
      }

      var target = NAV[name];
      if (target) {
        location.href = target;
        return;
      }

      if (isBillItem(name)) {
        location.href = 'bill-detail.html';
        return;
      }

      /* 输入框：点一下高亮，模拟聚焦 */
      if (/输入框|占位/.test(name)) {
        $$('.field-focus').forEach(function (o) { o.classList.remove('field-focus'); });
        el.classList.add('field-focus');
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * 启动
   * ------------------------------------------------------------------ */
  function init() {
    fit();
    bindSegments();
    bindKeypad();
    bindNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
