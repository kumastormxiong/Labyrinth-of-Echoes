# Labyrinth of Echoes / 回响迷宫

[English](#english) | [中文](#chinese)

---

<a name="english"></a>
## English

### Description
**Labyrinth of Echoes** is an infinite, first-person 3D maze runner built with React, Three.js, and Tailwind CSS. Players navigate through procedurally generated corridors with shifting psychedelic textures, searching for exits to progress through increasingly complex levels while tracking their lifetime stats.

### Core Features
- **Procedural Maze Generation**: Every level is uniquely generated using a Depth-First Search (DFS) algorithm.
- **Endless Progression**: The maze grows in size as your total score increases.
- **Bifurcated Exits**: 
  - **Exit A**: Standard exit (+1 score).
  - **Exit B**: Rare/Alternative exit (+3 score).
- **Psychedelic Visuals**: Dynamic, color-shifting materials and glowing markers powered by `@react-three/fiber`.
- **Statistics Tracking**: Persistent storage of player name, total score, total time, and key presses.
- **Minimap System**: Toggleable 2D map (Tab key) to help with navigation.
- **Responsive HUD**: Real-time display of current session and lifetime achievements.

### Controls
- **Arrow Keys**: Move (Forward/Backward) and Turn (Left/Right).
- **Enter**: Use/Interact with exits when standing on them.
- **Tab**: Toggle Minimap.
- **Esc**: Toggle Menu / Pause.

### Tech Stack
- **Framework**: React 19
- **3D Engine**: Three.js with `@react-three/fiber` & `@react-three/drei`
- **Styling**: Vanilla CSS & Tailwind CSS
- **State Management**: React Hooks (useState, useEffect, useMemo, useCallback)
- **Deployment**: ESM-based (using esm.sh)

---

<a name="chinese"></a>
## 中文

### 项目简介
**Labyrinth of Echoes（回响迷宫）** 是一款基于 React、Three.js 和 Tailwind CSS 构建的无限第一人称 3D 迷宫跑酷游戏。玩家在充满迷幻色彩、不断变化的走廊中穿行，寻找出口以晋级到更复杂的关卡，并记录其终身统计数据。

### 核心功能
- **程序化迷宫生成**：每一关都使用深度优先搜索（DFS）算法唯一生成。
- **无尽挑战**：迷宫规模随总积分的增加而逐渐增大。
- **双重出口系统**：
  - **出口 A**：普通出口（+1 积分）。
  - **出口 B**：稀有/备选出口（+3 积分）。
- **迷幻视觉效果**：由 `@react-three/fiber` 驱动的动态颜色变换材质和发光标记。
- **数据追踪**：持久化存储玩家姓名、总分、总时长及按键次数。
- **小地图系统**：可切换的 2D 地图（Tab 键）辅助导航。
- **实时 HUD**：实时显示当前进度和历史成就。

### 操作指南
- **方向键**：移动（前进/后退）和转向（左转/右转）。
- **回车键 (Enter)**：当在出口上方时，进行交互/进入下一关。
- **Tab 键**：切换显示小地图。
- **Esc 键**：切换菜单/暂停。

### 技术栈
- **框架**：React 19
- **3D 引擎**：Three.js 配合 `@react-three/fiber` 和 `@react-three/drei`
- **样式**：Vanilla CSS 和 Tailwind CSS
- **状态管理**：React Hooks (useState, useEffect, useMemo, useCallback)
- **部署**：基于 ESM (使用 esm.sh)

---

### GitHub Repository
[https://github.com/kumastormxiong/Labyrinth-of-Echoes](https://github.com/kumastormxiong/Labyrinth-of-Echoes)
