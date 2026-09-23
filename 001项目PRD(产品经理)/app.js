/* ========================================
   日常财务管理系统 — 展示网站交互逻辑
   包含 p5.js 算法艺术（花瓣流场）
   ======================================== */

// =============================================
// p5.js 算法艺术 — 花瓣流场粒子系统
// =============================================
(function () {
  const palette = [
    [242, 166, 192],  // 樱花粉
    [253, 221, 230],  // 蜜桃奶白
    [232, 132, 158],  // 玫瑰粉
    [255, 214, 165],  // 杏子橙
    [184, 230, 208],  // 薄荷绿
    [201, 184, 230],  // 淡紫
    [255, 248, 240],  // 暖白
  ];

  let particles = [];
  const NUM_PARTICLES = 120;
  const NOISE_SCALE = 0.003;
  let flowField;
  let cols, rows;
  const CELL_SIZE = 20;
  let zOff = 0;

  const sketch = (p) => {
    p.setup = function () {
      const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
      canvas.parent('art-canvas');
      p.background(255, 248, 240);

      cols = Math.ceil(p.width / CELL_SIZE);
      rows = Math.ceil(p.height / CELL_SIZE);
      flowField = new Array(cols * rows);

      for (let i = 0; i < NUM_PARTICLES; i++) {
        particles.push(new Particle(p));
      }
    };

    p.draw = function () {
      // 半透明背景覆盖，产生拖尾效果
      p.background(255, 248, 240, 12);

      // 更新流场
      let yOff = 0;
      for (let y = 0; y < rows; y++) {
        let xOff = 0;
        for (let x = 0; x < cols; x++) {
          const idx = x + y * cols;
          const angle = p.noise(xOff, yOff, zOff) * p.TWO_PI * 2;
          const v = p5.Vector.fromAngle(angle);
          v.setMag(0.5);
          flowField[idx] = v;
          xOff += NOISE_SCALE * CELL_SIZE;
        }
        yOff += NOISE_SCALE * CELL_SIZE;
      }
      zOff += 0.0008;

      // 绘制和更新粒子
      for (const pt of particles) {
        pt.follow(flowField, cols);
        pt.update(p);
        pt.show(p);
        pt.edges(p);
      }
    };

    p.windowResized = function () {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
      cols = Math.ceil(p.width / CELL_SIZE);
      rows = Math.ceil(p.height / CELL_SIZE);
      flowField = new Array(cols * rows);
    };
  };

  class Particle {
    constructor(p) {
      this.pos = p.createVector(p.random(p.width), p.random(p.height));
      this.vel = p5.Vector.random2D();
      this.acc = p.createVector(0, 0);
      this.maxSpeed = p.random(0.8, 2.0);
      this.prevPos = this.pos.copy();
      const c = palette[Math.floor(p.random(palette.length))];
      this.color = c;
      this.alpha = p.random(30, 80);
      this.weight = p.random(1, 3);
    }

    follow(field, cols) {
      const x = Math.floor(this.pos.x / CELL_SIZE);
      const y = Math.floor(this.pos.y / CELL_SIZE);
      const idx = x + y * cols;
      if (field[idx]) {
        this.applyForce(field[idx]);
      }
    }

    applyForce(force) {
      this.acc.add(force);
    }

    update(p) {
      this.vel.add(this.acc);
      this.vel.limit(this.maxSpeed);
      this.prevPos = this.pos.copy();
      this.pos.add(this.vel);
      this.acc.mult(0);
    }

    show(p) {
      p.stroke(this.color[0], this.color[1], this.color[2], this.alpha);
      p.strokeWeight(this.weight);
      p.line(this.pos.x, this.pos.y, this.prevPos.x, this.prevPos.y);
    }

    edges(p) {
      if (this.pos.x > p.width) { this.pos.x = 0; this.prevPos = this.pos.copy(); }
      if (this.pos.x < 0) { this.pos.x = p.width; this.prevPos = this.pos.copy(); }
      if (this.pos.y > p.height) { this.pos.y = 0; this.prevPos = this.pos.copy(); }
      if (this.pos.y < 0) { this.pos.y = p.height; this.prevPos = this.pos.copy(); }
    }
  }

  // 启动 p5.js（实例模式，不影响全局）
  new p5(sketch);
})();


// =============================================
// 界面 Tab 切换
// =============================================
const screenData = {
  login: {
    title: '登录 / 注册页',
    desc: '全屏居中卡片布局，粉嫩渐变背景。支持用户名密码登录、注册新用户、忘记密码本地找回。输入框获焦时边框发出樱花粉柔和光芒，登录按钮在未填写完整时为禁用态。',
    features: ['渐变主色按钮（粉→橙）', '密码强度实时指示器', '本地 LocalStorage 存储', '记住我 / 7天免登录']
  },
  dashboard: {
    title: '首页 Dashboard',
    desc: '本月财务概览卡片展示收入、支出、结余三大核心数据，预算进度条直观显示消费进度。近7天账单流水按日分组，FAB浮动按钮提供快速记账入口。',
    features: ['收支结余一目了然', '预算进度可视化', '7天账单快速回顾', 'FAB 3步完成记账']
  },
  transactions: {
    title: '账单页 Transactions',
    desc: '月度账单列表按日分组展示，顶部月份选择器支持左右切换。搜索框支持模糊匹配备注，多维筛选（类型/分类/金额区间）实时过滤结果。',
    features: ['按日分组 + 每日小计', '搜索 & 多维筛选', '左滑编辑/删除', '底部 Sheet 详情弹窗']
  },
  statistics: {
    title: '统计页 Statistics',
    desc: '周/月/年三种时间维度切换，折线图展示支出趋势走势，环形饼图展示分类占比，消费排行榜按金额降序排列 Top 10。',
    features: ['折线趋势图 + 数据气泡', '环形饼图分类占比', '消费排行榜 Top 10', '点击联动筛选']
  },
  budget: {
    title: '预算页 Budget',
    desc: '月度总预算环形进度图直观展示使用情况，分类预算进度条三级变色（绿→橙→红），超支分类首页自动弹出警告提醒。',
    features: ['环形进度图', '三级预警：安全/警告/危险', '分类预算独立管理', '超支首页提醒条']
  },
  settings: {
    title: '设置页 Settings',
    desc: '个人信息管理（头像/昵称/密码），分类管理支持增删改和拖拽排序，记账偏好设置（默认类型/货币/月起始日），CSV数据导入导出，主题切换。',
    features: ['头像 & 昵称自定义', '分类拖拽排序', 'CSV 导入/导出', '浅色/深色/跟随系统']
  }
};

document.querySelectorAll('.screen-tab').forEach(tab => {
  tab.addEventListener('click', function () {
    const screen = this.dataset.screen;

    // 切换 Tab 激活态
    document.querySelectorAll('.screen-tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');

    // 切换屏幕内容
    document.querySelectorAll('.screen-content').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + screen).classList.add('active');

    // 更新右侧说明
    const data = screenData[screen];
    document.getElementById('screen-info-title').textContent = data.title;
    document.getElementById('screen-info-desc').textContent = data.desc;
    const featList = document.getElementById('screen-info-features');
    featList.innerHTML = data.features.map(f => '<li>' + f + '</li>').join('');
  });
});


// =============================================
// 导航栏滚动效果
// =============================================
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});


// =============================================
// 滚动淡入动画
// =============================================
function addFadeIn() {
  const selectors = [
    '.color-card', '.comp-card', '.arch-card', '.model-card',
    '.resp-card', '.cat-item', '.func-color-item',
    '.section-title', '.section-desc', '.subsection-title'
  ];
  const elements = document.querySelectorAll(selectors.join(','));
  elements.forEach(el => el.classList.add('fade-in'));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => observer.observe(el));
}
addFadeIn();


// =============================================
// 平滑滚动锚点
// =============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
