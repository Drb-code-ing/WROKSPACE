# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指引。

## 项目概述

基于浏览器的 JavaScript 鼓点模拟器（#JavaScript30 挑战项目）。按键盘 A-L 键播放对应鼓声，同时伴有视觉反馈。无构建工具、无包管理器、无测试。

## 关键文件

- `index-FINISHED.html` — 完整版，包含可运行的 JS（keydown 监听、transition 处理）
- `index-START.html` — 初始模板，`<script>` 标签为空（供学习者使用）
- `style.css` — 完整样式，包括按键时触发的 `.playing` 类（缩放 + 发光动画）
- `sounds/*.wav` — 9 个鼓声文件，分别映射到 A-L 键

## 架构说明

- 9 个 `.key` 的 `div` 元素，通过 `data-key` 属性与 `KeyboardEvent.keyCode` 关联
- 9 个隐藏的 `<audio>` 元素，同样通过 `data-key` 匹配，用于播放对应声音
- 按键时：根据 keyCode 查找对应 audio 元素，重置播放时间到 0 并播放；同时给 key div 添加 `.playing` 类
- 过渡结束时：移除 `.playing` 类（仅响应 `transform` 属性的 transitionend 事件）

## 按键映射 (keyCode → 声音)

| 键 | keyCode | 声音    |
|----|---------|---------|
| A  | 65      | clap    |
| S  | 83      | hihat   |
| D  | 68      | kick    |
| F  | 70      | openhat |
| G  | 71      | boom    |
| H  | 72      | ride    |
| J  | 74      | snare   |
| K  | 75      | tom     |
| L  | 76      | tink    |

## 开发方式

直接在任何浏览器中打开 `.html` 文件即可运行，无需启动服务器。
