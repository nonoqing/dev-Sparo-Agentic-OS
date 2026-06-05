# 子项目 B 第一期 · dev DeepResearch 后端迁移 + 接入星座

- **日期**: 2026-06-04
- **状态**: 设计中,待评审
- **承接**: `2026-06-02-cosmos-deepresearch-design.md`(GraphEvent 契约)、`2026-06-03-constellation-redesign.md`(星座前端)
- **迁移源**: `/Users/yuyuqingqing/Documents/work/github/dev`(BitFun)的 deep research

## 1. 目标与范围(第一期)
把 `dev` 的 deep research **研究方法**搬进 Sparo,并**自建 markers→GraphEvent 桥**,让星座画布显示**真实研究**(替掉 DEV mock 启动器)。

**第一期搬:** 子问题拆解 → 并行 `ResearchSpecialist` 专家采集 → 引用登记 → 综合出报告 + 发结构化 markers。
**第一期不搬(留二期升级):** 两轮对抗辩论、事实核查冲突分级、Research Manager 仲裁、`citation_renumber` 钩子。符合既定"轻量收束、可升级"。

## 2. 关键发现(决定方案)
- `dev` 的 phase markers **两端都无解析器**——纯 prompt 约定,dev 自己没接 UI;dev DR 是纯后端出文件(`.bitfun/sessions/<id>/research/*.md`)。
- 所以"消费端"我们从零建,正好喂星座。dev 的 prompt 已在吐 `[[SUBQ/CITATION/VERDICT]]`,概念上 1:1 对应我们的 GraphEvent。
- 架构不同:`dev`=`modes/+subagents/` 宏结构;Sparo=扁平 `agents/*.rs`。**必须适配改写,不能照拷。**
- Sparo `task_tool.rs` 按 `subagent_type` 解析注册 agent(已验证)→ 新增注册 `ResearchSpecialist` 即可并行派发。
- Sparo 前端 `flow_chat/services/flow-chat-manager/TextChunkModule.ts` 处理流式 assistant 文本 → marker 解析挂这里。

## 3. Marker 文法(本期定义,prompt 发、前端解析)
单行、ASCII、出现在 assistant 文本流里;前端按行扫描提取。**不暴露给最终读者**(前端解析后从展示文本中剔除)。

```
[[DR:CORE|<主题标题>]]                                  → node.add core
[[DR:NODE|<id>|<core|父id>|<planet|moon>|<标签>]]        → node.add(planet/moon);branch:planet 按出现序,moon 继承父
[[DR:CITE|<cit_id>|<nodeId>|<primary|authoritative|media|community>|<标题>|<来源>|<url>]]  → cite.add
[[DR:STATUS|<nodeId>|<exploring|settled|contested|gap|tentative>]]   → node.update {status}
[[DR:PHASE|<phase 名>]]                                  → 进度提示(本期可仅记录,不入图)
```
- `cit_id`/`nodeId`/ID 全 ASCII;标签/标题可中文。字段以 `|` 分隔,字段内禁用 `|` 和 `]]`(prompt 约束)。
- 引用的逐字引述/日期等完整信息写进 `citations.md` 文件;marker 只带卡片所需最小字段(够节点角标 + 抽屉展示)。

**GraphEvent 映射**(已有契约,见 cosmos design §4):`DR:CORE/NODE`→`node.add`;`DR:CITE`→`cite.add`;`DR:STATUS`→`node.update`。报告见 §5。

## 4. 后端改动(Rust,`src/crates/core/`)
1. **`agentic/agents/prompts/deep_research_agent.md`**:替换为 dev 6 阶段 prompt 的**第一期裁剪版**——保留 Phase 0 拆子问题(+可选用户确认)、Phase 1 四专家并行(`Task subagent_type:"ResearchSpecialist"`)、Phase 2 引用登记、综合出报告;**去掉**辩论/核查/仲裁。在每个对应动作处**追加发 `[[DR:...]]` marker**(NODE/CITE/STATUS/PHASE)。保留 dev 的 per-session 文件布局(`research/` 下产物)。
2. **`agentic/agents/research_specialist_agent.rs`**(新增,仿 `explore_agent.rs`):只读子 agent,工具 `WebSearch/WebFetch/Read`,`is_readonly()=true`,prompt 模板 `research_specialist_agent`;在 `mod.rs`/`registry.rs` 注册,并允许 DeepResearch 的 agent 派发它。
3. **`agentic/agents/prompts/research_specialist_agent.md`**(新增):移植 dev 的专家 brief(claim/url/quote/authority 结构化返回)。
4. **`DeepResearchAgent`**:`default_tools` 已含 `Task/WebSearch/WebFetch/Write/...`,确认含 `Task`;按需放开 WebSearch/WebFetch 的 `ToolExposure::Expanded`。

## 5. 报告(收束)处理 — 第一期取巧
- dev 产出 `report.md`(真实文件)。第一期:**点星系核 → 打开真实 `report.md`**(走 Sparo 现有 `markdown-viewer` 面板 + `computer://` 链接),不走流式 report 段。
- 现有 `ReportDrawer`(渲染 `graph.report`)第一期可保留为空态/或显示"打开完整报告"按钮链到 report.md。`graph.report` 的流式分段留二期(配合仲裁)。

## 6. 前端改动(TS,`src/web-ui/`)
1. **`flow_chat/research-graph/markerBridge.ts`**(新增,纯函数 + 测试):`parseDrMarkers(text): { events: GraphEvent[]; cleanedText: string }` —— 扫描 `[[DR:...]]`,产出 GraphEvent 并从展示文本剔除 marker。
2. **`flow_chat/services/flow-chat-manager/TextChunkModule.ts`**(改):在处理 assistant 文本块时,对 deep-research 会话调用 `parseDrMarkers`,把 events 派发到该会话的 research graph store,并用 cleanedText 继续渲染。需处理 marker 跨 chunk 截断(缓冲未闭合的 `[[…`)。
3. **每会话 research graph store**:`researchGraphStore` 工厂已支持。建一个"按 sessionId 取/建 store"的注册表(`researchGraphStores.ts`),TextChunkModule 写入、`CosmosCanvasPanel` 读取同一 store。
4. **`CosmosCanvasPanel`**(改):从 mock 流改为绑定 `sessionId` 对应的 live store(`data.sessionId`);保留 `source:'mock'` 调试旁路。
5. **会话接入**:deep-research 会话**自动打开**星座面板(在 profile/scene 进入时 `agent-create-tab` 'cosmos-canvas' with `data.sessionId`),**移除**临时 DEV 启动器(`WelcomePanel` 改动回滚)。
6. **核心点击 → 打开 report.md**:`CosmosCanvas` 的 core→`onOpenReport` 改为派发打开 `computer://.bitfun/sessions/<id>/research/report.md` 的 markdown 面板(若该会话已产出)。

## 7. 文件级任务清单
- **B1** 后端:`research_specialist_agent.rs` + prompt + 注册(mod/registry)+ 测试。
- **B2** 后端:`deep_research_agent.md` 换成第一期裁剪版 + 发 marker;DeepResearchAgent 工具/exposure 校准 + 测试。
- **B3** 前端:`markerBridge.ts`(parseDrMarkers)+ 单测。
- **B4** 前端:`researchGraphStores.ts`(按 session 注册表)+ 单测。
- **B5** 前端:`TextChunkModule` 接入 marker 桥(含跨 chunk 缓冲)+ 测试。
- **B6** 前端:`CosmosCanvasPanel` 绑 live store;deep-research 会话自动开面板;移除 DEV 启动器;core→report.md。

## 8. 不变 / 复用
- GraphEvent 契约、`applyGraphEvent`、星座视觉层(布局/星/线/抽屉)、引用聚合、拖拽/缩放/折叠 —— 不动。
- dev 的 per-session 文件布局与 report.md 产物 —— 复用。

## 9. 风险 / 待定
- Marker 跨流式 chunk 截断 → B5 需缓冲未闭合标记(测试覆盖)。
- prompt 让模型**稳定**发 marker 的依从性(可在 prompt 里强约束 + 容错解析:坏 marker 丢弃不崩)。
- Sparo 的 WebSearch provider 是否就绪(dev 用 Exa)—— 需确认 Sparo 侧 WebSearch 工具可用。
- 二期:辩论/核查/仲裁 + 流式 report 分段 + citation_renumber 钩子 + 节点 verdict 着色细化。
