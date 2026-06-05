# 研究星座 · 视觉重设计 v2(Constellation)

- **日期**: 2026-06-03
- **状态**: 经多轮交互原型评审通过,开始实现
- **参照原型(评审用)**: `.superpowers/brainstorm/92569-1780496161/content/constellation-full.html`
- **承接**: 替换 `2026-06-02-cosmos-deepresearch-design.md` 里"宇宙星河(紫色星云 + 锥形彩色河流 + 放射布局)"那套视觉与布局。

## 为什么改
初版放射布局在 4 个大观点时落在正上下左右四个轴上、卫星与中心共线,连成"+"字粗射线,且紫色星云光晕显假。用户提供金色星座参考图,确定新方向。

## 不变(重要)
- 数据契约 `GraphEvent` / `ResearchNode` / `Citation` / 报告 —— 完全不动。
- `researchGraphStore`、`applyGraphEvent`(含引用聚合)、点击节点→`CitationDrawer`、点核心→`ReportDrawer`、拖拽/平移/缩放/折叠交互 —— 逻辑不动,只换视觉。

## 视觉规格(从原型移植)
- **背景**: 午夜蓝径向渐变(`#1c2c52→#111d3c→#070d1c`)+ 蓝/白细星场(约 220 颗,随机)+ 极淡蓝色辉光。去掉紫色星云、银河带、彩色分支。
- **连线(星座线)**: 金色直线 `#d8b46a` 1px,opacity .5;底垫一层 `#e8c878` 3px、opacity .08、模糊的辉光;"流动中"用 `stroke-dasharray:1 7` 金色虚线。父→子关系,非锥形。
- **节点(金色星)**: 羽化光晕(渐变到透明,奶金 `#fff3d2→#ffe2a0→#f3cf86→透明`)+ 短十字星芒(核心 len≈19/宽 2,大观点 12/1.3;轻微 twinkle)+ 通透亮点(`#fff5d8` + 纯白心)。**无球体、无暗金边、无硬边扩散圈。**
- **光晕呼吸**: 每颗星的光晕**原地**明暗(opacity base→base+0.3)+ 微涨缩(r ±10%),ease-in-out,各星按 id 错峰(周期 4–6s)。
- **配色**: 节点/连线统一金色(单色高级感);核心星略大略亮。引用权威度标签仍保留四色(一手/权威/媒体/社区)。
- **抽屉**: 配色改午夜蓝 + 金色描边(替换原紫色主题),内容/结构不变。
- **字体**: 标签 Cormorant Garamond / Noto Serif SC;计量 IBM Plex Mono。

## 布局规格(自适应,治"+"字)
确定性、永远像星座、任意节点数自适应、生长不退化:
- core 在原点。
- 大观点(planet): 角度 = `i × 黄金角(137.5°) + 播种抖动(±0.35) − π/2`;半径 = `PLANET_R ± 抖动`。黄金角保证不落正轴、不对称。
- 小观点(moon): 角度 = `(planet 背向 core 的方向) + 偏置(≈0.55,**确保不与 core→planet 共线**) + 扇形展开 + 播种抖动`;半径 = `MOON_R ± 抖动`。
- 播种 = 按节点 id 的 FNV 哈希 → 同一份研究每次布局一致、稳定。
- 用户拖动产生的 override 坐标优先于算法坐标(已有逻辑,保留)。

## 实现任务(在现有 `src/web-ui/src/flow_chat/research-graph/` 上改)
- **R1** `computeLayout.ts`(+test): 改自适应黄金角 + 播种抖动 + 卫星不共线;重写测试。
- **R2** `StarStreams.tsx`: 锥形彩色河流 → 细金星座线(辉光垫底 + 1px 线 + 流动虚线);移除 `ribbon.ts`/`ribbon.test.ts`(不再使用)。
- **R3** `StarNode.tsx`(+ SCSS): 玻璃 pill orb → 金色星(内联 SVG:光晕+呼吸+短星芒+亮点)+ 仍保留 HTML 标签/引用 chip/徽标/折叠按钮在旁。
- **R4** `Starfield.tsx`/`.scss`: 紫色星云 → 午夜蓝 + 蓝白细星场。
- **R5** `CosmosCanvas.scss`(+ `CosmosCanvas.tsx` 的 `branchColor`): 调色板午夜蓝+金;pill→星样式;抽屉金色化;呼吸 keyframes;`branchColor` 简化为金色系。

数据/契约/抽屉逻辑/点击/拖拽不在改动范围。
