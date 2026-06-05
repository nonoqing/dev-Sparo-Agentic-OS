# 研究星河 · Cosmos Deep Research — 设计文档

- **日期**: 2026-06-02
- **状态**: 设计已通过交互原型评审,待拆实现计划
- **原型**: `.superpowers/brainstorm/58195-1780399628/content/river-cosmos.html`(交互高保真,本地评审用)

## 1. 目标

在 Sparo Agentic OS 的 deep-research 场景里,做一套"**思维流式展开探索 → 严密收束成报告**"的研究体验,灵感来自秘塔 AI:让探索过程像**星河/河流**一样从中心向外放射、动态生长、可视可交互,最后整张图收束出一篇有据可循的报告。

核心体验诉求(用户原话):
- "让探索思路像河流一样延展" → 放射状、流动、动态生长的探索图谱
- "经过严密的论证和推理,收束成一篇完整的报告" → 汇流后的收束/论证 + 引用可溯源

## 2. 已锁定的设计决策

| 维度 | 决策 | 备注 |
|---|---|---|
| 探索形态 | **C · 河道 + 有机支流**(放射状思维导图) | 非横向流水线、非竖排树 |
| 可视形态 | **放射状脑图画布**,可拖拽节点 / 平移 / 缩放 / 折叠 | B(可拖拽)已确认 |
| 美学方向 | **浩瀚宇宙星河**:深空 + 星云 + 星场,星流放射,星系核中心 | 不适配 app 现有配色(用户明确放弃) |
| 收束严密度 | **轻量收束 MVP**,预留升级接口 | 以后可接 `dev` 项目的引用登记+辩论+仲裁重机器 |
| 承载位置 | 在现有 **ExploreRegion** 基础上演进;完整星河进 deep-research profile 的 **aux pane** | 聊天流内保留缩略锚点,点击"展开星河"提升到 aux pane |
| 引用 | 节点挂**引用数**,点开看**文献详情**(标题/来源/作者/日期/权威度/引述/URL) | 用户明确要求 |
| 星系簇 | 大观点 = 行星,旁边小观点 = 卫星,聚成一簇星系 | 形状由后端产出决定,见 §5 |

## 3. 概念与视觉规格(已在原型验证)

- **背景**: 深空底 `#05060f` + 多层星云(紫/青/玫红辉光)+ 斜贯银河带;两层星场(近/远)带视差,平移时纵深感。
- **星系核(core)**: 金白辐射渐变球 + 涟漪光环,代表"调研主题";点击触发收束成报告。
- **星流(river/stream)**: 父→子的锥形渐细丝带(近根粗、远端细),叠加流动星尘虚线(`stroke-dashoffset` 动画);"流动中"的支流流速更快。
- **节点(node)**: 玻璃拟态 pill + 发光星体 orb + 衬线标签 + `引用 N` 计量 + 状态徽标(流动中 / 新支流)。
- **字体**: Fraunces(展示衬线)+ IBM Plex Mono(计量/元数据)+ Noto Serif SC(正文引述)。
- **配色**: 5 条星流分别 青 `#5fe0ff` / 紫 `#b48cff` / 金 `#ffc861` / 品红 `#ff8fc7` / 翠绿 `#5fffd0`;引用卡按权威度着色(一手/权威/媒体/社区)。

## 4. 数据模型(前后端契约,核心)

可视化与后端解耦的关键:双方约定一份**研究图谱 schema**,前端只渲染图谱,后端负责流式产出图谱。

```ts
// 研究图谱事件流(后端 → 前端,增量)
type GraphEvent =
  | { t: 'node.add';   node: ResearchNode }
  | { t: 'node.update'; id: string; patch: Partial<ResearchNode> } // status / label / 计数变化
  | { t: 'cite.add';   cite: Citation }     // 给某节点挂引用
  | { t: 'verdict';    nodeId: string; verdict: Verdict } // 收束阶段每个子问题的判定
  | { t: 'report';     section: ReportSection };          // 收束阶段逐段产出报告

interface ResearchNode {
  id: string;
  parentId: string | null;          // null = core
  kind: 'core' | 'planet' | 'moon'; // 主题 / 大观点 / 小观点(星系簇)
  label: string;
  status: 'exploring' | 'settled' | 'contested' | 'gap' | 'tentative';
  branch: number;                   // 1..5 用于配色归属(继承自所属大观点)
}

interface Citation {
  id: string;                       // cit_001
  nodeId: string;
  title: string; source: string; author?: string; date?: string;
  authority: 'primary' | 'authoritative' | 'media' | 'community'; // 一手/权威/媒体/社区
  quote?: string;                   // 逐字引述,不翻译
  url?: string;
  corroborated?: boolean;
}

type Verdict = 'decided' | 'contested' | 'gap' | 'tentative';
interface ReportSection { nodeId: string; heading: string; body: string; citeIds: string[]; }
```

- **星系簇**: `kind: planet`(大观点)下挂 `kind: moon`(小观点),前端对 moon 用**局部环绕布局**(围着 planet 公转),对 planet 用**放射布局**(围着 core)。
- 节点 `引用数` = 自身 + 子孙 Citation 计数;`引用详情`抽屉读 `Citation` 列表。
- 收束阶段:`verdict` 决定节点状态着色(contested→双视角、gap→灰、tentative→低置信标记);`report` 逐段流入报告抽屉。

## 5. 后端耦合(用户已点破)

星河的形状 = 后端 deep research 的产出结构。当前 Sparo 的 `DeepResearchAgent`(`src/crates/core/.../deep_research_agent.rs` + prompt)走的是 **Longitudinal + Cross-sectional** 三段式,产出单文件报告,**不产出结构化图谱**。

落地路径(轻量收束 MVP):
1. 演进 deep research agent 的 prompt,使其在探索时**发射结构化标记/事件**(类比 `dev` 项目的 `[[PHASE/SUBQ/CITATION/VERDICT]]` markers,但映射到上面的 GraphEvent schema)。
2. 探索阶段:每拆一个子问题 → `node.add`;每挂一条来源 → `cite.add`;新发现 → 再 `node.add`(新支流)。
3. 收束阶段(轻量):一次"批判性自审"(找冲突/标不确定/剔除无源)→ 发 `verdict`,再逐段发 `report`。
4. 升级接口预留:以后可把 `dev` 项目的引用登记表 + 两轮辩论 + 事实核查 + 仲裁接进收束阶段,schema 不变。

## 6. 前端架构(组件按单一职责拆分)

复用 Sparo 现有流式管线(`flow_chat` 事件 → store → 渲染),新增:

- **`researchGraphStore`** — 消费 GraphEvent 流,维护 `{nodes, citations, report}` 图谱;纯数据,可独立测试。
- **`useGraphLayout`** — 把图谱算成坐标:core 居中、planet 放射、moon 环绕 planet;增量稳定(新节点不抖动旧节点)。纯函数,可独立测试。
- **`CosmosCanvas`**(aux pane 面板)— 渲染:星云/星场背景层、`StarStreams`(SVG 锥形丝带)、`StarNode`(节点)、HUD(缩放/复位/图例)。承接 pan/zoom/drag/collapse 交互。
- **`CitationDrawer`** — 节点引用详情抽屉(文献卡列表)。
- **`ReportDrawer`** — 收束报告抽屉(逐段引用号浮现)。
- **ExploreRegion 演进** — 聊天流内的探索摘要升级成"星河缩略 + 展开按钮",点击把同一图谱提升进 aux pane。
- **`deepResearchProfile`** 调整 — 默认开启 aux pane 承载 CosmosCanvas。

交互(原型已实现,可作为实现参照):拖节点重布线、滚轮缩放、拖空平移、点折叠、点引用看文献、点核心收束。

## 7. 实施拆分(建议两个子项目)

**契约先行**:先定 §4 的 GraphEvent schema(TS 类型 + Rust 镜像),作为前后端解耦边界。

- **子项目 A — 前端 Cosmos Canvas(先做)**: 按 schema,用 **mock 事件流**驱动,把 §6 全部组件实现+接进 deep-research aux pane。可独立 demo、独立测试,承载本设计的全部视觉/交互。
- **子项目 B — 后端图谱产出 agent**: 演进 deep research agent,使其按 schema 流式发射 GraphEvent(探索 + 轻量收束)。

理由:可视化是本设计的重心且能独立验收;schema 把它和后端解耦,后端可后续渐进增强(直至接入重机器)。先实现 A,用 mock 跑通体验,再做 B 对接真实研究。

## 8. 测试策略

- `researchGraphStore` / `useGraphLayout`:纯逻辑单测(事件增量、簇布局稳定性、引用聚合计数)。
- `CosmosCanvas` 交互:投影/快照测试(参照现有 `*.projection.test.tsx` 模式)。
- 后端 agent:沿用现有 agent 测试约定(default_tools / prompt template),新增 GraphEvent 标记解析的解析器测试。

## 9. MVP 边界

**做**: 子项目 A 全部(星河画布 + 引用抽屉 + 报告抽屉 + ExploreRegion 演进,mock 流驱动);schema 定义;后端 B 的最小可用版(探索发节点+引用、轻量收束发报告)。

**先不做(预留)**: 重型收束(辩论/仲裁/事实核查分级)、可拖拽自由画布的持久化布局、小地图、多节点框选、报告导出为文件、多语言策略。

## 10. 待澄清 / 风险

- GraphEvent 走哪条通道:复用现有 tool/agent 事件流,还是新增专用 SSE 通道?(实现计划阶段定)
- 星系簇布局在节点很多时的性能与可读性(虚拟化 / LOD 分级)。
- 轻量收束的"批判性自审"提示词强度,与产出质量的平衡。
