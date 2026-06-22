const KEYWORD_MAP: Record<string, string[]> = {
  'product-manager': [
    '落地场景', '用户需求', '商业模式', '产品路线', '产品规划', '产品设计',
    'JTBD', '用户旅程', 'PRD', '需求分析', '功能规划', '产品经理',
    '价值主张', '用户故事', '产品迭代', '功能优先级', '产品定位',
  ],
  'strategist': [
    '竞争格局', '市场趋势', '壁垒', '五力', 'SWOT', 'PESTLE',
    '行业周期', '护城河', '市场份额', '行业分析', '战略',
    '竞争对手', '市场结构', '行业格局', '进入壁垒', '价值链',
  ],
  'investor': [
    '融资', '估值', '投资', 'TAM', 'SAM', 'SOM', '退出',
    'ROI', 'IRR', '烧钱', 'LTV', 'CAC', '盈利', '回报',
    '商业模式画布', '现金流', '单位经济', '风投', 'VC', '天使轮',
  ],
  'tech-lead': [
    '技术路线', '架构', '可行性', '技术栈', '微服务', 'API',
    '算法', '模型', '部署', '性能', '技术债', '选型',
    '数据库', '分布式', '云原生', '技术方案', '系统设计',
  ],
  'entrepreneur': [
    '创业', '切入点', 'MVP', '精益', '资源配置', '增长飞轮',
    '冷启动', 'PMF', '验证假设', '从0到1', '早期',
    '启动', '试错', '最小可行', '种子用户', '增长策略',
  ],
  'career-mentor': [
    '求职', '简历', '职业发展', '转行', '行业前景', '能力匹配',
    '涨薪', '晋升', '跳槽', '职业规划', '面试准备',
    '工作机会', '职业方向', '能力提升', '职场', '入行',
  ],
  'ai-interviewer': [
    '面试', '模拟面', 'STAR', 'HR面', '追问', '自我介绍',
    '面试官', '面试题', '行为面', '压力面', '场景题',
    '面试评估', '面试反馈', '面试技巧', '模拟',
  ],
};

type ScoreEntry = { roleId: string; score: number };

function computeKeywordScores(question: string): ScoreEntry[] {
  const q = question.toLowerCase();
  return Object.entries(KEYWORD_MAP).map(([roleId, keywords]) => {
    const score = keywords.reduce((acc, kw) => acc + (q.includes(kw.toLowerCase()) ? 1 : 0), 0);
    return { roleId, score };
  });
}

export function routePrompt(question: string, selectedRoles: string[]): string[] {
  const scores = computeKeywordScores(question);

  const selectedHits = scores
    .filter((s) => selectedRoles.includes(s.roleId) && s.score > 0)
    .sort((a, b) => b.score - a.score);

  const allHits = scores
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (selectedHits.length >= 1) {
    return selectedHits.slice(0, 2).map((s) => s.roleId);
  }
  if (allHits.length >= 1) {
    return allHits.slice(0, 2).map((s) => s.roleId);
  }

  return [];
}

export async function classifyWithAPI(
  question: string,
  apiKey: string,
  baseUrl: string,
  model: string,
): Promise<string[]> {
  const validIds = Object.keys(KEYWORD_MAP);
  const prompt = `判断以下问题最相关的专家角色（只输出ID，逗号分隔，最多2个）：
可选：${validIds.join(',')}

问题：${question}`;

  try {
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 30,
        stream: false,
      }),
    });

    if (!response.ok) return [validIds[0]];

    const json = await response.json();
    const text: string = json.choices?.[0]?.message?.content || '';
    const matched = validIds.filter((id) => text.includes(id));
    return matched.length > 0 ? matched.slice(0, 2) : [validIds[0]];
  } catch {
    return [validIds[0]];
  }
}
