import type { IndustryAnalysis } from './analysis-schema';

export type PlannerModule = 'needs' | 'product' | 'competitive' | 'business';

export type ProjectInfo = {
  description: string;
  targetUser: string;
  coreCapability: string;
  constraints: string;
  competitivePreference: string;
  depth: 'quick' | 'detailed';
  linkedIndustry: string;
};

export type ModuleResult = {
  module: PlannerModule;
  content: string;
  generatedAt: number;
};

export type PlannerSession = {
  projectInfo: ProjectInfo;
  modules: ModuleResult[];
  createdAt: number;
  updatedAt: number;
};

export const MODULE_META: Record<PlannerModule, { title: string; icon: string; description: string }> = {
  needs: { title: '价值需求分析', icon: '🎯', description: 'JTBD、四力模型、需求优先级' },
  product: { title: '产品规划方案', icon: '📋', description: 'MVP范围、路线图、用户故事' },
  competitive: { title: '竞争定位建议', icon: '⚔️', description: '竞争格局、定位声明、差异化' },
  business: { title: '商业可行性评估', icon: '💡', description: '精益画布、风险评估、验证清单' },
};
