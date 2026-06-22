import type { PlannerModule, ProjectInfo } from './planner-types';
import type { IndustryAnalysis } from './analysis-schema';

const FRAMEWORK_NEEDS = `## 分析框架：JTBD + 机会评分

使用 Jobs to Be Done 框架分析用户需求：
1. Job Statement 格式："当[情境]，我想要[动机]，这样我就能[预期成果]"
2. Job Map：把用户完成任务拆成步骤（定义→寻找→准备→确认→执行→监控→修改→完成），标注摩擦点
3. 四力分析：推力(现状不满) / 拉力(新方案吸引) / 焦虑(切换顾虑) / 惯性(习惯牵绊)
4. 机会评分：对每个需求评估"重要度"和"满足度"(0-1)，机会分 = 重要度 × (1 - 满足度)，分高者优先`;

const FRAMEWORK_PRODUCT = `## 分析框架：产品规划 + 成果路线图

按以下结构规划产品：
1. 产品定位：一句话（做什么 + 给谁 + 核心差异）
2. MVP 功能：分 P0(必须有) 和 P1(第二版)，每个功能写用户故事格式"当[情境]，我想要[动作]，这样我能[收益]"
3. 路线图按成果划分（不按功能列表）：Phase1=验证核心价值，Phase2=规模化，Phase3=壁垒
4. 关键假设：列出承重假设 + 最小验证实验
5. Non-Goals：明确不做什么，防止范围蔓延
原则：紧凑好过宽泛，先 spec Phase1，成功指标必须具体可衡量`;

const FRAMEWORK_COMPETITIVE = `## 分析框架：竞争定位 Battlecard

1. 竞争格局：列出主要玩家及各自定位
2. 定位声明模板："对于[目标用户]，[产品]是一个[品类]，它能[关键价值]，不同于[竞品]，我们[核心差异]"
3. 我们赢在哪：列出优势维度 + 具体做法对比
4. 他们赢在哪：承认竞品优势 + 我们的应对策略
5. 差异化建议：短期可执行的 + 长期护城河方向
6. 定位风险：写成"如果___则定位失效" + 应对方案`;

const FRAMEWORK_BUSINESS = `## 分析框架：精益画布 + Pre-Mortem 风险评估

精益画布9格：
问题(Top3) | 解决方案(Top3) | 独特价值主张
用户群体 | 渠道 | 收入来源
成本结构 | 关键指标 | 不公平优势

单位经济学：估算 CAC、LTV、盈亏平衡点

Pre-Mortem 风险分类：
- Tigers（真风险，必须缓解）
- Paper Tigers（看着吓人但可控，解释为什么）
- Elephants（不愿面对但必须讨论，给建设性建议）

验证清单：每个关键假设写"本周能做的最小验证"和"判死标准"`;

const MODULE_OUTPUT_TEMPLATES: Record<PlannerModule, string> = {
  needs: `## 价值需求分析

### Job Statement
当[情境]，我想要[动机]，这样我就能[预期成果]。

**典型画像：**
[用户角色]，[核心特征]，[主要诉求]。

### Job Map
| 步骤 | 当前做法 | 摩擦点 |
|------|---------|--------|
（列出3-5个关键步骤，摩擦点具体说明痛点）

### 四力分析
- **推力**（现有方案的不满）：[具体描述]
- **拉力**（新方案的吸引力）：[具体描述]
- **焦虑**（切换的顾虑）：[具体描述]
- **惯性**（现有习惯的牵绊）：[具体描述]

### 需求优先级
| 需求 | 重要度 | 满足度 | 机会分 | 建议 |
|------|--------|--------|--------|------|
（列出5-8个核心需求，按机会分排序）

### 核心机会总结
（2-3个最值得切入的方向，每个用2-3句话说清楚为什么值得做）`,

  product: `## 产品规划方案

### 产品定位
（一句话：做什么 + 给谁 + 核心差异）

### MVP 功能范围
**P0 必须有：**
| 序 | 功能 | 用户故事 | 成功指标 |
|---|------|---------|---------|
（3-5个核心功能，用户故事格式：当[情境]，我想要[动作]，这样我能[收益]）

**P1 应该有（第二版）：**
| 序 | 功能 | 用户故事 | 成功指标 |
|---|------|---------|---------|
（3-5个扩展功能）

### 产品路线图
| 阶段 | 时间窗口 | 目标成果 | 关键动作 |
|------|---------|---------|---------|
| Phase 1 | [时间] | 验证核心价值 | [具体动作] |
| Phase 2 | [时间] | 规模化增长 | [具体动作] |
| Phase 3 | [时间] | 生态/壁垒 | [具体动作] |

### 关键假设
（列出3-5个，每条格式如下）

**假设：** [具体假设内容]
验证方式：[最小实验设计]

### Non-Goals
（列出2-3个，每条说明不做的理由）

- **[不做什么]**：[原因，防止范围蔓延]`,

  competitive: `## 竞争定位建议

### 竞争格局速览
（列出3-5个主要玩家，每个说明其核心定位和目标用户）

### 定位声明
对于[目标用户]，[产品名]是一个[品类]，它能[关键价值]，不同于[竞品]，我们[核心差异]。

### 我们赢在哪
| 维度 | 我们的做法 | 竞品做法 | 为什么我们更好 |
|------|-----------|---------|--------------|
（3-4个维度，具体说明差异）

### 他们赢在哪
| 竞品优势 | 我们的应对策略 |
|---------|--------------|
（2-3个，应对策略要具体可执行）

### 差异化建议
- **短期差异化方向：** [具体方向和做法]
- **长期护城河建议：** [具体积累路径]

### 定位风险
- **如果[条件]，则定位失效**
  应对：[具体应对方案]
（列出2-3个风险场景）`,

  business: `## 商业可行性评估

### 精益画布

**第一行**
| 问题(Top3) | 解决方案(Top3) | 独特价值主张 |
|-----------|---------------|-------------|
| [问题1]；[问题2]；[问题3] | [方案1]；[方案2]；[方案3] | [一句话：为谁解决什么，凭什么选你] |

**第二行**
| 用户群体 | 渠道 | 收入来源 |
|---------|------|---------|
| [目标用户群体描述] | [触达渠道列表] | [盈利模式说明] |

**第三行**
| 成本结构 | 关键指标 | 不公平优势 |
|---------|---------|-----------|
| [主要成本项] | [核心监控指标] | [竞争护城河] |

### 单位经济学估算
- **获客成本(CAC)预估：** [金额及依据]
- **用户生命周期价值(LTV)预估：** [金额及依据]
- **盈亏平衡条件：** [用户数/收入目标及时间线]

### 风险评估

**Tigers（真实风险，必须缓解）：**

1. **[风险名称]**
   缓解方案：[具体可执行的缓解措施]

**Paper Tigers（看着吓人但可控）：**

1. **[风险名称]**
   为什么可控：[理由说明]

**Elephants（不愿面对但必须讨论）：**

1. **[风险名称]**
   建设性建议：[正视并应对的具体方案]

### 关键验证清单
| 假设 | 本周能做的最小验证 | 判死标准 |
|------|------------------|---------|
（3-5个关键假设，判死标准要具体可量化）`,
};

function summarizeIndustry(data: IndustryAnalysis): string {
  const parts: string[] = [`行业：${data.industry}`, `概述：${data.summary}`];
  if (data.painPoints?.length) {
    parts.push('核心痛点：' + data.painPoints.map((p) => `${p.title}(${p.severity})`).join('、'));
  }
  if (data.aiOpportunities?.length) {
    parts.push('AI机会：' + data.aiOpportunities.map((o) => o.scenario).join('、'));
  }
  if (data.companies?.length) {
    parts.push('对标企业：' + data.companies.map((c) => `${c.name}(AI${c.aiMaturity})`).join('、'));
  }
  if (data.competitiveLandscape) {
    parts.push('竞争格局：' + data.competitiveLandscape.summary);
  }
  return parts.join('\n');
}

export function buildModulePrompt(
  module: PlannerModule,
  projectInfo: ProjectInfo,
  industryData?: IndustryAnalysis,
): string {
  const frameworks: Record<PlannerModule, string> = {
    needs: FRAMEWORK_NEEDS,
    product: FRAMEWORK_PRODUCT,
    competitive: FRAMEWORK_COMPETITIVE,
    business: FRAMEWORK_BUSINESS,
  };

  const projectSection = `## 项目信息
- 项目描述：${projectInfo.description}
- 目标用户：${projectInfo.targetUser}
- 核心能力/资源：${projectInfo.coreCapability}
- 约束条件：${projectInfo.constraints}
${projectInfo.competitivePreference ? `- 竞争偏好：${projectInfo.competitivePreference}` : ''}
- 分析深度：${projectInfo.depth === 'quick' ? '快速概览' : '详细方案'}`;

  const industrySection = industryData
    ? `\n## 行业背景数据\n${summarizeIndustry(industryData)}`
    : '';

  return `${frameworks[module]}

${projectSection}${industrySection}

## 输出要求
请严格按照以下 Markdown 结构输出（不要加额外的前言或总结）：

${MODULE_OUTPUT_TEMPLATES[module]}`;
}
