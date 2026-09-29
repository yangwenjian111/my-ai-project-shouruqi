---
name: weekly-report
description: 读取本地 Git 提交历史或 GitHub 活动记录，汇总本周工作内容并生成周报 Markdown 文件，存放到 000文档机要 目录。当用户提到"周报"、"本周总结"、"工作汇报"、"weekly report"时使用此 skill。
---

# 周报生成

## 触发场景

- 用户要求生成周报 / 本周工作总结 / 工作汇报
- 用户使用 `/weekly-report` 命令

## 执行流程

### Step 1: 确定时间范围

获取当前日期，计算本周一（周一为一周起始日）到今天的日期范围。

```bash
# PowerShell 获取本周一和今天的日期
$today = Get-Date
$monday = $today.AddDays(-($today.DayOfWeek.value__ - 1))
$since = $monday.ToString("yyyy-MM-dd")
$until = $today.AddDays(1).ToString("yyyy-MM-dd")
```

如果用户指定了其他时间范围，以用户指定为准。

### Step 2: 收集 Git 提交历史

在项目根目录下执行：

```bash
git log --since="YYYY-MM-DD" --until="YYYY-MM-DD" --pretty=format:"%h|%ad|%s" --date=short --no-merges
```

如果需要区分作者（多人协作场景），加上 `--author="用户名"`。

**补充信息（可选）**：
- 若用户要求更详细，可用 `--stat` 查看文件变更统计
- 若本地历史不够，可通过 GitHub MCP 工具读取远程 PR/Issue 活动

### Step 3: 分析与归类

将 commit 信息按以下维度归类：

1. **功能开发**：新增功能、新模块、新页面
2. **Bug 修复**：修复问题、错误处理
3. **优化改进**：性能优化、代码重构、样式调整
4. **配置部署**：环境配置、数据库变更、依赖更新
5. **文档其他**：文档编写、测试、杂项

### Step 4: 生成周报

使用以下模板生成周报内容：

```markdown
# 周报 - YYYY年第WW周（MM/DD - MM/DD）

## 本周工作概要

> 简要总结本周的主要工作方向和成果（2-3 句话）

## 工作内容详情

### 一、功能开发
- 【模块名】具体完成的工作内容
- 【模块名】具体完成的工作内容

### 二、Bug 修复
- 修复了 XXX 问题
- 解决了 XXX 异常

### 三、优化改进
- 优化了 XXX 逻辑
- 改进了 XXX 体验

### 四、配置与部署
- 更新了 XXX 配置
- 完成了 XXX 环境搭建

### 五、其他
- 文档编写、会议沟通等

## 下周计划

> （可选）根据当前进度推测或留空由用户填写

## 附：本周提交记录

| 日期 | Commit | 说明 |
|------|--------|------|
| YYYY-MM-DD | abc1234 | 提交说明 |
```

### Step 5: 保存文件

文件命名格式：`周报_YYYY年第WW周_MMDD-MMDD.md`

保存路径：`000文档机要/周报_YYYY年第WW周_MMDD-MMDD.md`

其中 `WW` 为 ISO 周数。

```bash
# PowerShell 计算 ISO 周数
$weekNum = [System.Globalization.CultureInfo]::CurrentCulture.Calendar.GetWeekOfYear($today, [System.Globalization.CalendarWeekRule]::FirstFourDayWeek, [System.DayOfWeek]::Monday)
```

## 注意事项

- 如果本周没有任何提交，生成空报告并提示用户"本周无 Git 提交记录"
- commit 信息为中文时直接展示；为英文时保留原文但补充中文说明
- 归类时根据 commit 内容智能判断，不要生搬硬套分类
- 如果某个分类下没有内容，省略该分类
- 周报语言默认中文，用户要求时可用英文
