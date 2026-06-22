export type DetailSection = {
  id: string;
  title: string;
  summary: string;
  causeEffect: string[];
  dataPoints: string[];
  cases: string[];
  comparison: string[];
  roadmap: string[];
};

export type MarketData = {
  totalSize: string;
  growth: string;
  year: string;
  segments: Array<{ name: string; share: string }>;
  forecast: string;
  source: string;
};

export type PolicyItem = {
  id: string;
  year: string;
  name: string;
  issuer: string;
  impact: string;
  type: 'positive' | 'regulation';
  detailId: string;
};

export type InvestmentItem = {
  id: string;
  year: string;
  event: string;
  amount: string;
  parties: string;
  significance: string;
  detailId: string;
};

export type CompetitiveLandscape = {
  tiers: Array<{
    level: string;
    description: string;
    companies: string[];
  }>;
  dimensions?: Array<{
    name: string;
    tier1: string;
    tier2: string;
    tier3?: string;
  }>;
  summary: string;
};

export type SourceItem = {
  title: string;
  url?: string;
  citedIn: string;
};

export type IndustryAnalysis = {
  industry: string;
  summary: string;
  timeline: Array<{
    year: string;
    event: string;
    impact: string;
    detailId: string;
  }>;
  painPoints: Array<{
    id: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    detailId: string;
  }>;
  aiOpportunities: Array<{
    id: string;
    scenario: string;
    value: string;
    modelType: string;
    relatedPain?: string;
    detailId: string;
  }>;
  companies: Array<{
    id: string;
    name: string;
    aiMaturity: 'low' | 'medium' | 'high';
    notes: string;
    detailId: string;
  }>;
  quickConclusion?: {
    threeMinuteSummary: string;
    interviewLines: Array<string | { scene: string; line: string }>;
  };
  keyFindings?: string[];
  lifecycleStage?: string;
  marketData?: MarketData;
  policies?: PolicyItem[];
  investment?: InvestmentItem[];
  competitiveLandscape?: CompetitiveLandscape;
  sources?: SourceItem[];
  detailSections?: Record<string, DetailSection>;
};

function buildSection(
  id: string,
  title: string,
  summary: string,
  causeEffect: string[],
  dataPoints: string[],
  cases: string[],
  comparison: string[],
  roadmap: string[],
): DetailSection {
  return { id, title, summary, causeEffect, dataPoints, cases, comparison, roadmap };
}

export function buildFallbackAnalysis(industry: string): IndustryAnalysis {
  const pain1 = buildSection(
    'pain-data-silo',
    '数据割裂',
    '系统多、口径乱、协同慢，是多数行业数智化的第一堵墙。',
    [
      '前因：组织分工沿着职能线条建立，业务系统也按部门各自建设。',
      '过程：订单、库存、履约、客服等数据无法统一，跨部门协同需要人工搬运。',
      '结果：管理层看板延迟、业务响应变慢、决策依赖经验而非实时数据。',
    ],
    [
      '调研机构普遍指出，企业数据孤岛会显著抬高流程成本与决策时延。',
      '在供应链和运营场景中，主数据一致性不足常导致重复录入和错配。',
      '行业数字化成熟度高的企业，通常会优先建设统一数据底座。',
    ],
    [
      '某大型零售企业通过统一商品/门店/供应链数据口径后，补货效率明显改善。',
      '某物流平台在打通订单与轨迹数据后，客服查询和异常定位时间缩短。',
    ],
    [
      '对比方式 A：先建数据中台，适合资源充足、流程复杂的大企业。',
      '对比方式 B：先做单点数据贯通，适合快速验证 ROI 的中型企业。',
    ],
    [
      '第一步：梳理 3-5 个高价值数据链路。',
      '第二步：统一指标口径和主数据。',
      '第三步：先做一个业务闭环场景，如补货、调度或客服。',
    ],
  );

  const pain2 = buildSection(
    'pain-demand-volatility',
    '需求波动大',
    '需求预测不稳，会把库存、排产、运输和服务全部拖进连锁反应。',
    [
      '前因：市场需求受季节、政策、价格和渠道活动影响明显。',
      '过程：预测不准导致采购偏差，进而影响排产、库存和交付。',
      '结果：一边缺货，一边积压，利润被库存和履约成本侵蚀。',
    ],
    [
      '许多消费和供应链行业的波动，本质是预测窗口太短、数据噪声太大。',
      '优秀企业会将预测粒度下钻到区域、渠道和 SKU 级别。',
      'AI 在这类问题上的价值往往直接体现在周转率和损耗率上。',
    ],
    [
      '某连锁品牌引入需求预测模型后，将促销期缺货率与报损率同时压低。',
      '某冷链企业通过时序预测优化线路和仓位，降低空驶和滞库。',
    ],
    [
      '方式 A：规则预测，解释性强但对复杂波动适应差。',
      '方式 B：机器学习预测，效果更好但需要足够历史数据。',
      '方式 C：混合预测，兼顾规则与模型，适合多数企业。',
    ],
    [
      '优先从高价值 SKU 或高波动区域切入。',
      '先做预测，再做库存/排产/调度联动。',
      '上线后必须建立误差回溯机制，持续校准。',
    ],
  );

  const pain3 = buildSection(
    'pain-knowledge',
    '知识沉淀弱',
    '大量业务经验仍然在个人脑子里，导致培训慢、复制慢、管理难。',
    [
      '前因：业务长期依赖一线老师傅和人工经验。',
      '过程：新人培训成本高，规则更新无法快速传导。',
      '结果：组织扩张越快，知识损耗越明显。',
    ],
    [
      '知识型岗位中，重复问答、SOP 查询、异常处理占用了大量时间。',
      '把隐性知识显性化，往往能直接提升一线服务响应速度。',
      'RAG 类系统在企业知识库场景已经形成较成熟的方法论。',
    ],
    [
      '某制造企业搭建知识助手后，新人上手周期明显缩短。',
      '某客服团队通过问答机器人将重复咨询分流，人工专注复杂问题。',
    ],
    [
      '方式 A：文档库搜索，成本低但召回差。',
      '方式 B：问答机器人，体验好但要控制幻觉。',
      '方式 C：RAG + 规则校验，适合生产环境。',
    ],
    [
      '先从高频、标准化、低风险的问题做起。',
      '建立知识审核机制，避免模型瞎编。',
      '把知识助手接进工作流，而不是孤立成一个聊天框。',
    ],
  );

  const opp1 = buildSection(
    'opp-demand-forecast',
    '需求预测与库存优化',
    'AI 最容易先创造财务价值的场景之一，通常能直接改善周转和损耗。',
    [
      '前因：需求波动和补货经验主义导致库存常常不在最优区间。',
      '过程：错误预测引发连锁反应，影响采购、仓配与销售。',
      '结果：利润被库存成本和缺货损失双向挤压。',
    ],
    [
      '如果预测误差每降低几个百分点，现金流和周转指标往往会明显改善。',
      '这类场景的数据门槛相对明确，但需要历史数据完整。',
      '通常是最适合做 AI ROI 试点的方向。',
    ],
    [
      '某零售企业通过预测模型优化促销期备货，减少了缺货与滞销。',
      '某冷链企业通过品类级预测提升仓配调度效率。',
    ],
    [
      '比传统报表更及时。',
      '比人工经验更稳定。',
      '比简单规则更能应对复杂波动。',
    ],
    [
      '建议优先在一个业务单元跑通，再复制到更多品类/区域。',
      '先做预测，再联动补货和库存策略。',
      '上线初期必须明确“预测误差容忍区间”。',
    ],
  );

  const opp2 = buildSection(
    'opp-scheduling',
    '智能调度与路径规划',
    '调度问题往往是高复杂度约束优化，AI 能把经验型决策变成可计算决策。',
    [
      '前因：订单、车辆、人员、时窗、路线等约束变量越来越多。',
      '过程：人工调度难以同时兼顾成本、时效和服务水平。',
      '结果：空驶、绕路、延误和资源错配频发。',
    ],
    [
      '调度场景通常对实时性要求高，对约束准确性要求也高。',
      '与预测不同，调度更需要把业务规则显式建模。',
      '强化学习和运筹优化常常组合使用。',
    ],
    [
      '某物流平台引入路径优化后，空驶率和平均履约时长下降。',
      '某配送企业在高峰期使用智能派单，缓解人手紧张。',
    ],
    [
      '比纯人工调度更稳定。',
      '比简单最短路更符合业务约束。',
      '比只看成本的方案更平衡体验。',
    ],
    [
      '先把规则边界梳理清楚，再做算法。',
      '选择一个高频、复杂度高的调度场景先试点。',
      '建议保留人工兜底和异常接管机制。',
    ],
  );

  const opp3 = buildSection(
    'opp-knowledge-assistant',
    '知识助手与 SOP 自动化',
    '这个方向适合快速做出可见体验，尤其适合内部效率和客户支持。',
    [
      '前因：业务知识分散在文档、群聊和个人经验里。',
      '过程：新人和一线员工寻找答案耗时较长。',
      '结果：重复问答占用大量时间，服务响应不稳定。',
    ],
    [
      'RAG 方案已经成为企业知识问答的主流路径之一。',
      '若有高质量知识库，落地速度通常较快。',
      '关键在于答案可信度和权限控制。',
    ],
    [
      '某客服中心把产品手册、FAQ、流程文档接入知识助手后，重复咨询下降。',
      '某制造企业用 SOP 助手降低了新员工培训成本。',
    ],
    [
      '比静态知识库更好找。',
      '比纯聊天机器人更可控。',
      '比人工答疑更具规模化能力。',
    ],
    [
      '优先接入标准化文档与 FAQ。',
      '建立引用溯源和人工审核机制。',
      '先做内部助手，再扩到客户侧。',
    ],
  );

  const company1 = buildSection(
    'comp-leader-a',
    '龙头 A',
    '强在数据底座和核心流程的标准化，适合做全链路优化。',
    [
      '前因：业务规模大，管理复杂度高，迫使其较早投入数字化。',
      '过程：先打通底层数据，再把核心流程串起来。',
      '结果：AI 更多用于效率提升和决策优化。',
    ],
    [
      '通常拥有更完整的主数据体系。',
      '更容易承接复杂算法与大模型项目。',
    ],
    [
      '某头部企业先做数据中台，再做调度优化，效果较稳。',
    ],
    [
      '优势：规模大、数据全、流程稳。',
      '短板：组织复杂、推进慢。',
    ],
    [
      '建议重点关注其供应链/运营侧的 AI 投入。',
      '适合作为行业标杆对照。',
    ],
  );

  const company2 = buildSection(
    'comp-leader-b',
    '龙头 B',
    '在局部业务上跑得快，但整体协同和标准化仍有提升空间。',
    [
      '前因：希望快速见效，所以先做高 ROI 单点。',
      '过程：局部试点多，系统化沉淀不足。',
      '结果：短期能出成绩，但横向复制难度较大。',
    ],
    [
      '试点通常更灵活，迭代速度快。',
      '但全局优化的难度更高。',
    ],
    [
      '某企业先做客服机器人，再逐步扩展到运营协同。',
    ],
    [
      '优势：试点敏捷、快速见效。',
      '短板：系统性不强。',
    ],
    [
      '适合作为“单点突破”路线的案例。',
      '可以借鉴其快速验证思路。',
    ],
  );

  const company3 = buildSection(
    'comp-innovator-c',
    '创新玩家 C',
    '更愿意试新场景，但受资源和数据限制，常常停留在局部突破。',
    [
      '前因：业务规模相对小，决策链路短。',
      '过程：更敢尝试新产品、新模型。',
      '结果：创新快，但稳定性和规模化能力有限。',
    ],
    [
      '常见于创业公司和细分赛道玩家。',
      '验证路径短，但抗风险能力弱。',
    ],
    [
      '某细分服务商用 AI 做客服和运营辅助，先跑通局部价值。',
    ],
    [
      '优势：灵活、快。',
      '短板：资源有限。',
    ],
    [
      '适合做“新玩法”对照。',
      '可观察其是否形成产品化能力。',
    ],
  );

  return {
    industry,
    summary: `这是一个关于「${industry}」的结构化行业分析示例。当前使用本地兜底数据，内容已经升级为因果链、对比分析和落地路径模板。`,
    timeline: [
      { year: '2018', event: '行业进入数字化探索期', impact: '基础信息化开始铺开', detailId: pain1.id },
      { year: '2020', event: '业务链路线上化加速', impact: '协同效率成为竞争重点', detailId: pain2.id },
      { year: '2023', event: 'AI 试点项目增多', impact: '知识整理、预测与自动化开始落地', detailId: pain3.id },
    ],
    painPoints: [
      { id: 'pain-data-silo', title: '数据割裂', description: '多系统、多角色之间的数据流转效率低。', severity: 'high', detailId: pain1.id },
      { id: 'pain-demand-volatility', title: '调度复杂', description: '需求波动导致计划与执行难平衡。', severity: 'high', detailId: pain2.id },
      { id: 'pain-knowledge', title: '知识沉淀弱', description: '大量经验依赖人工，难以标准化复用。', severity: 'medium', detailId: pain3.id },
    ],
    aiOpportunities: [
      { id: 'opp-demand-forecast', scenario: '需求预测', value: '降低缺货与库存积压风险', modelType: '时序预测', detailId: opp1.id },
      { id: 'opp-scheduling', scenario: '智能调度', value: '优化资源分配与路径效率', modelType: '强化学习 + 约束优化', detailId: opp2.id },
      { id: 'opp-knowledge-assistant', scenario: '知识助手', value: '自动生成 SOP 与问答支持', modelType: 'RAG + LLM', detailId: opp3.id },
    ],
    companies: [
      { id: 'comp-leader-a', name: '龙头 A', aiMaturity: 'high', notes: '核心流程数字化较成熟，AI 已进入优化阶段。', detailId: company1.id },
      { id: 'comp-leader-b', name: '龙头 B', aiMaturity: 'medium', notes: '在客服和运营侧有局部试点。', detailId: company2.id },
      { id: 'comp-innovator-c', name: '创新玩家 C', aiMaturity: 'medium', notes: '偏向单点场景突破，灵活但规模有限。', detailId: company3.id },
    ],
    quickConclusion: {
      threeMinuteSummary: `「${industry}」的本质是通过更高效的协同、调度和决策来降低成本、提升体验。AI 最先切入的通常是预测、调度和知识助手三类场景。`,
      interviewLines: [
        '这个行业的 AI 价值不在于炫技，而在于把高频、复杂、重复的流程自动化。',
        '最先落地的往往不是“最聪明”的模型，而是能嵌入业务流程的模型。',
        '判断一个行业是否适合 AI，核心看数据可得性、流程标准化和 ROI 是否清晰。',
      ],
    },
    detailSections: {
      [pain1.id]: pain1,
      [pain2.id]: pain2,
      [pain3.id]: pain3,
      [opp1.id]: opp1,
      [opp2.id]: opp2,
      [opp3.id]: opp3,
      [company1.id]: company1,
      [company2.id]: company2,
      [company3.id]: company3,
    },
  };
}
