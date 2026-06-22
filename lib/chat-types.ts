import type { IndustryAnalysis, DetailSection } from './analysis-schema';

export type DepthLevel = 'beginner' | 'intermediate' | 'professional';

export type Role = {
  id: string;
  name: string;
  icon: string;
  description: string;
  focusAreas: string[];
  frameworks: string[];
};

export const ROLES: Role[] = [
  {
    id: 'product-manager',
    name: 'AI 产品经理',
    icon: '🎯',
    description: '落地场景、用户需求、商业模式',
    focusAreas: ['落地场景', '用户需求', '商业模式', '产品路线图'],
    frameworks: ['JTBD 价值主张', '机会方案树', '用户旅程地图'],
  },
  {
    id: 'strategist',
    name: '战略分析师',
    icon: '📊',
    description: '竞争格局、市场趋势、壁垒',
    focusAreas: ['竞争格局', '市场趋势', '进入壁垒', '行业周期'],
    frameworks: ['SWOT', 'PESTLE', 'Porter 五力', 'Ansoff 矩阵'],
  },
  {
    id: 'investor',
    name: '投资人',
    icon: '💰',
    description: '增长潜力、估值逻辑、风险',
    focusAreas: ['增长潜力', '估值逻辑', '风险因素', '退出路径'],
    frameworks: ['TAM/SAM/SOM', '商业模式画布', '定价策略分析'],
  },
  {
    id: 'tech-lead',
    name: '技术负责人',
    icon: '⚙️',
    description: '技术路线、可行性、架构选型',
    focusAreas: ['技术路线', '可行性评估', '架构选型', '技术债务'],
    frameworks: ['可行性假设测试', '优先级框架', '技术成熟度评估'],
  },
  {
    id: 'entrepreneur',
    name: '创业者',
    icon: '🚀',
    description: '切入点、MVP、资源配置',
    focusAreas: ['市场切入点', 'MVP 定义', '资源配置', '增长策略'],
    frameworks: ['精益画布', 'MVP 实验设计', '增长飞轮'],
  },
  {
    id: 'career-mentor',
    name: '求职导师',
    icon: '🎓',
    description: '行业趋势、公司前景、能力匹配',
    focusAreas: ['行业生命周期', '公司战略评估', '能力匹配度', '职业路径'],
    frameworks: ['胜任力模型', '行业周期分析', 'STAR面试法'],
  },
  {
    id: 'ai-interviewer',
    name: 'AI面试官',
    icon: '🎙️',
    description: 'HR面、领导面、专业面全流程模拟',
    focusAreas: ['AI产品设计', '战略思维', '团队管理', 'STAR追问'],
    frameworks: ['STAR面试法', '行为锚定评分', '场景模拟'],
  },
];

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  depth?: DepthLevel;
  expertRoles?: string[];
};

export type ChatSession = {
  industry: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
};

export type ChatSettings = {
  anthropicApiKey: string;
  anthropicBaseUrl: string;
  anthropicModel: string;
  searchApiKey: string;
};

export type ChatContext = {
  fullReport: IndustryAnalysis;
  activeSection?: DetailSection | null;
  selectedText?: string;
};
