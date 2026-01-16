# 幻径迷宫 / Labyrinth of Echoes

[中文](#chinese) | [English](#english)

---

<a name="chinese"></a>
## 中文说明

### 游戏简介
**Labyrinth of Echoes（幻径迷宫）** 是一款基于 React 和 Three.js 构建的无尽第一人称 3D 迷宫探险游戏。在这个充满迷幻色彩和回响的世界中，你需要不断寻找出口，收集音乐，并挑战更高的积分。

### 🎮 具体玩法

#### 1. 游戏目标
你的目标是在不断生成的迷宫中生存下去，找到出口进入下一关，同时尽可能多地积累分数。迷宫的大小会随着你的分数增加而变得越来越复杂。

#### 2. 双出口机制
每个迷宫关卡都有两个不同的出口，它们提供不同的奖励：
*   **🔵 出口 A (Exit A)**: 
    *   通常较容易找到。
    *   奖励：**+1 积分**。
*   **🔴 出口 B (Exit B)**: 
    *   位置更隐蔽或距离更远。
    *   奖励：**+3 积分**。

#### 3. 🎵 沉浸式音乐系统
音乐是游戏的核心体验之一：
*   **背景音乐 (BGM)**：每个关卡都有独特的背景音乐循环播放。
*   **出口预览**：当你站在出口的格子上时，你听到的音乐会平滑切换为**下一关的预告曲目**。
    *   如果你离开出口，音乐会柔和地切回当前关卡的 BGM。
*   **音乐收集**：当你通过某个出口（按 Enter）进入下一关时，该出口的预览曲目将成为新关卡的 BGM，并被记录在你的**历史播放列表**中。
*   **菜单试听**：在菜单中点击历史记录，可以预览你收集过的音乐。

#### 4. 🗺️ 小地图与策略
游戏提供小地图辅助，但使用它是有代价的：
*   按 **Tab 键** 可以打开/关闭小地图。
*   **代价**：每次打开小地图，你的当前分数将 **扣除 5 分**。请谨慎使用！

#### 5. 迷宫成长
*   **初始大小**：6x6 网格。
*   **难度提升**：随着你的总分增加，迷宫的尺寸会自动扩大（7x7, 8x8...），路径会变得更加错综复杂。

### ⌨️ 操作指南
| 按键 | 功能 |
| --- | --- |
| **W / ↑** | 前进 |
| **S / ↓** | 后退 |
| **A / ←** | 左转 |
| **D / →** | 右转 |
| **Enter (回车)** | 目前在出口上时，确认进入下一关 |
| **Tab** | 打开/关闭小地图 (**注意：扣5分**) |
| **Esc** | 打开/关闭菜单 (暂停游戏) |

---

<a name="english"></a>
## English Instructions

### Introduction
**Labyrinth of Echoes** is an infinite first-person 3D maze explorer built with React and Three.js. In this psychedelic world of shifting colors and echoes, your goal is to survive, find exits, collect music, and achieve the highest score possible.

### 🎮 Gameplay Mechanics

#### 1. Objective
Navigate through procedurally generated mazes, find an exit to advance to the next level, and accumulate points. The maze grows larger and more complex as your score increases.

#### 2. Dual Exit System
Each level features two distinct exits with different rewards:
*   **🔵 Exit A**: 
    *   Standard exit.
    *   Reward: **+1 Point**.
*   **🔴 Exit B**: 
    *   Harder to reach or hidden.
    *   Reward: **+3 Points**.

#### 3. 🎵 Immersive Music System
Music is central to the experience:
*   **Background Music (BGM)**: A unique track plays for each level.
*   **Exit Preview**: When you stand on an exit tile, the audio seamlessly crossfades to a **preview of the next level's track**.
    *   Stepping off the exit tile smoothly reverts the audio to the current level's BGM.
*   **Music Collection**: Confirming an exit (Press Enter) locks that previewed track as the BGM for the *next* level and adds it to your **History**.
*   **Menu Preview**: You can replay collected tracks from the history list in the Pause Menu (Esc).

#### 4. 🗺️ Minimap Strategy
A minimap is available, but it comes at a cost:
*   Press **Tab** to toggle the minimap.
*   **Penalty**: Opening the minimap deducts **5 Points** from your score. Use it wisely!

#### 5. Progressive Difficulty
*   **Starting Size**: 6x6 grid.
*   **Growth**: As your total score increases, the maze dimensions expand (7x7, 8x8, etc.), making navigation increasingly difficult.

### ⌨️ Controls
| Key | Action |
| --- | --- |
| **W / Up Arrow** | Move Forward |
| **S / Down Arrow** | Move Backward |
| **A / Left Arrow** | Turn Left |
| **D / Right Arrow** | Turn Right |
| **Enter** | Enter Next Level (when on Exit) |
| **Tab** | Toggle Minimap (**Cost: -5 Points**) |
| **Esc** | Toggle Menu / Pause |

---
### Tech Stack
- **Framework**: React 19
- **3D Engine**: Three.js (`@react-three/fiber`)
- **Styling**: Tailwind CSS
- **State**: React Hooks & Context
