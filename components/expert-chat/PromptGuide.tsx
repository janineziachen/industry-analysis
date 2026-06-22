'use client';

import { useState } from 'react';
import { X, Lightbulb } from 'lucide-react';

type GuideItem = {
  keyword: string;
  explanation: string;
  sampleQuestion: string;
};

type RoleGuide = {
  id: string;
  name: string;
  icon: string;
  items: GuideItem[];
};

const GUIDE_DATA: RoleGuide[] = [
  {
    id: 'product-manager', name: 'AI 产品经理', icon: '🎯',
    items: [
      { keyword: '落地场景', explanation: 'AI技术具体能用在哪些真实业务环节，解决用户的什么问题', sampleQuestion: '这个行业有哪些适合AI落地的场景？' },
      { keyword: '用户需求', explanation: '目标用户真正想解决的问题是什么，表面需求背后的深层动机', sampleQuestion: '这个行业的用户核心需求是什么？' },
      { keyword: '商业模式', explanation: '产品怎么赚钱——收费方式、成本结构、增长飞轮', sampleQuestion: '这个方向可能的商业模式有哪些？' },
      { keyword: '产品路线图', explanation: '产品分几步做，先做什么后做什么，每步的目标是什么', sampleQuestion: '如果要做这个产品，路线图应该怎么规划？' },
      { keyword: 'MVP', explanation: '最小可行产品——用最少的功能验证核心假设是否成立', sampleQuestion: '这个产品的MVP应该包含哪些核心功能？' },
    ],
  },
  {
    id: 'strategist', name: '战略分析师', icon: '📊',
    items: [
      { keyword: '竞争格局', explanation: '这个市场里有谁在竞争、各自的地位和优劣势', sampleQuestion: '当前的竞争格局是怎样的？' },
      { keyword: '市场趋势', explanation: '行业正在往哪个方向发展，什么在变大什么在缩小', sampleQuestion: '这个行业未来3年的核心趋势是什么？' },
      { keyword: '进入壁垒', explanation: '新玩家想进入这个市场有多难——技术、资金、政策等障碍', sampleQuestion: '进入这个行业的主要壁垒有哪些？' },
      { keyword: '五力分析', explanation: '从供应商、客户、竞争者、替代品、新进入者五个角度评估行业吸引力', sampleQuestion: '请用五力模型分析这个行业的竞争强度' },
      { keyword: 'SWOT', explanation: '优势、劣势、机会、威胁四象限分析', sampleQuestion: '帮我做一个SWOT分析' },
    ],
  },
  {
    id: 'investor', name: '投资人', icon: '💰',
    items: [
      { keyword: '市场规模', explanation: '这个市场总共值多少钱（TAM），你能拿到多少（SAM/SOM）', sampleQuestion: '这个市场的TAM/SAM/SOM分别是多少？' },
      { keyword: '估值逻辑', explanation: '一个公司/项目值多少钱，用什么方法来算', sampleQuestion: '这个赛道的公司一般怎么估值？' },
      { keyword: '风险因素', explanation: '可能导致失败的关键风险——市场、技术、团队、政策等', sampleQuestion: '投资这个方向最大的风险是什么？' },
      { keyword: '单位经济', explanation: '获取一个客户花多少钱（CAC），这个客户一生值多少钱（LTV）', sampleQuestion: '这个模式的单位经济模型健康吗？' },
      { keyword: '退出路径', explanation: '投资人怎么把钱收回来——IPO、被收购、还是其他方式', sampleQuestion: '这个赛道的主要退出路径有哪些？' },
    ],
  },
  {
    id: 'tech-lead', name: '技术负责人', icon: '⚙️',
    items: [
      { keyword: '技术路线', explanation: '用什么技术来实现，技术演进的路径和阶段', sampleQuestion: '实现这个产品的技术路线应该怎么规划？' },
      { keyword: '架构选型', explanation: '系统怎么设计——用什么数据库、什么框架、怎么部署', sampleQuestion: '这类产品通常采用什么技术架构？' },
      { keyword: '可行性', explanation: '以现有技术能不能做到，难点在哪里，需要多少资源', sampleQuestion: '以目前的AI技术，这个功能的可行性如何？' },
      { keyword: '技术壁垒', explanation: '技术上的护城河——别人要模仿你需要克服什么难题', sampleQuestion: '这个方向的核心技术壁垒是什么？' },
    ],
  },
  {
    id: 'entrepreneur', name: '创业者', icon: '🚀',
    items: [
      { keyword: '切入点', explanation: '从哪个细分方向开始做，为什么选这个点', sampleQuestion: '如果要创业做这个方向，最佳切入点是什么？' },
      { keyword: '冷启动', explanation: '没有用户的时候怎么获取第一批种子用户', sampleQuestion: '这类产品的冷启动策略有哪些？' },
      { keyword: '增长飞轮', explanation: '产品越用越好的正循环——用户越多→数据越好→产品越好→用户越多', sampleQuestion: '这个产品能形成什么样的增长飞轮？' },
      { keyword: '资源配置', explanation: '有限的钱和人应该优先投在哪里', sampleQuestion: '早期资源有限，应该优先投入哪些方面？' },
    ],
  },
  {
    id: 'career-mentor', name: '求职导师', icon: '🎓',
    items: [
      { keyword: '行业前景', explanation: '这个行业未来好不好、能不能长期发展', sampleQuestion: '这个行业适合现在入行吗？前景如何？' },
      { keyword: '能力匹配', explanation: '你的技能和经验跟目标岗位的要求吻合度', sampleQuestion: '进入这个行业需要哪些核心能力？' },
      { keyword: '职业路径', explanation: '进入后的发展路线——从初级到高级怎么走', sampleQuestion: '这个行业的典型职业发展路径是什么？' },
      { keyword: '转行建议', explanation: '从其他行业切换到这里需要准备什么', sampleQuestion: '从其他行业转入需要补足哪些能力？' },
    ],
  },
  {
    id: 'ai-interviewer', name: 'AI面试官', icon: '🎙️',
    items: [
      { keyword: '模拟面试', explanation: '模拟真实面试场景，练习回答并获得反馈', sampleQuestion: '请模拟一场这个行业的产品经理面试' },
      { keyword: 'STAR法则', explanation: '用情境-任务-行动-结果的结构讲述你的经历', sampleQuestion: '帮我用STAR法则梳理一段项目经历' },
      { keyword: '面试准备', explanation: '针对目标岗位应该准备哪些知识和问题', sampleQuestion: '面试这个方向的岗位需要准备什么？' },
      { keyword: '自我介绍', explanation: '1-3分钟的结构化自我介绍怎么讲', sampleQuestion: '帮我准备一个针对这个行业的自我介绍' },
    ],
  },
];

type Props = {
  open: boolean;
  onClose: () => void;
  onUseQuestion: (question: string) => void;
};

export function PromptGuide({ open, onClose, onUseQuestion }: Props) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  if (!open) return null;

  const handleUse = (question: string) => {
    onUseQuestion(question);
    onClose();
  };

  const activeItem = expandedItem
    ? GUIDE_DATA.flatMap((r) => r.items.map((i) => ({ ...i, roleId: r.id }))).find(
        (i) => `${i.roleId}-${i.keyword}` === expandedItem
      )
    : null;

  return (
    <div className="absolute inset-0 z-10 flex flex-col rounded-2xl bg-[var(--color-surface)] overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-medium text-[var(--color-ink-strong)]">提问导航</h3>
        </div>
        <button onClick={onClose} className="text-[var(--color-muted)] hover:text-[var(--color-ink-strong)]">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        <p className="text-xs text-[var(--color-muted)]">点击关键词查看解释，再决定是否用它提问</p>

        {GUIDE_DATA.map((role) => (
          <div key={role.id}>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-sm">{role.icon}</span>
              <span className="text-xs font-medium text-[var(--color-ink)]">{role.name}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {role.items.map((item) => {
                const key = `${role.id}-${item.keyword}`;
                const isExpanded = expandedItem === key;
                return (
                  <button
                    key={key}
                    onClick={() => setExpandedItem(isExpanded ? null : key)}
                    className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                      isExpanded
                        ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/40'
                        : 'bg-[var(--color-panel)] text-[var(--color-ink)] border border-[var(--color-border)] hover:bg-[var(--color-elevated)] hover:text-[var(--color-ink-strong)]'
                    }`}
                  >
                    {item.keyword}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {activeItem && (
        <div className="shrink-0 border-t border-[var(--color-border)] px-4 py-3 bg-[var(--color-panel)]">
          <p className="text-xs font-medium text-[var(--color-ink-strong)] mb-1">{activeItem.keyword}</p>
          <p className="text-xs text-[var(--color-muted)] mb-2">{activeItem.explanation}</p>
          <button
            onClick={() => handleUse(activeItem.sampleQuestion)}
            className="w-full text-left rounded-md bg-[var(--color-accent)]/10 px-2.5 py-2 text-xs text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 transition-colors"
          >
            → {activeItem.sampleQuestion}
          </button>
        </div>
      )}
    </div>
  );
}

export function PromptGuideButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="提问导航"
      className="rounded-lg bg-amber-500/10 p-2 text-amber-400 hover:bg-amber-500/20 transition-colors"
    >
      <Lightbulb className="h-4 w-4" />
    </button>
  );
}
