import { ROLES } from '@/lib/chat-types';
import type { DepthLevel } from '@/lib/chat-types';
import { ROLE_PROMPTS } from '@/lib/role-prompts';
import { searchWeb } from '@/lib/search';
import { routePrompt, classifyWithAPI } from '@/lib/prompt-router';

function buildSystemPrompt(roles: string[], depth: DepthLevel, industry?: string): string {
  const depthInstruction = {
    beginner: '用通俗易懂的语言解释，避免术语，多用类比。',
    intermediate: '保留专业术语但给出简要释义。',
    professional: '直接使用学术/行业语言，假设用户有深厚背景知识。',
  }[depth];

  const selectedRoles = ROLES.filter((r) => roles.includes(r.id));

  if (selectedRoles.length === 0) {
    return `你是一位资深行业分析专家。${depthInstruction}\n\n请基于提供的行业报告内容回答用户的问题。如果报告中没有相关信息，请如实说明。`;
  }

  if (selectedRoles.length === 1 && ROLE_PROMPTS[selectedRoles[0].id]) {
    const contextLine = industry ? `\n\n当前分析行业：${industry}` : '';
    return `${ROLE_PROMPTS[selectedRoles[0].id]}\n\n## 当前会话设置\n- 语言深度：${depthInstruction}${contextLine}\n- 请基于提供的行业报告内容进行分析，如果报告中信息不足，请如实说明。`;
  }

  const roleInstructions = selectedRoles
    .map((r) => {
      if (ROLE_PROMPTS[r.id]) {
        return `## ${r.icon} ${r.name}视角\n${ROLE_PROMPTS[r.id].split('## Skills')[0].trim()}\n\n关注点：${r.focusAreas.join('、')}\n分析框架：${r.frameworks.join('、')}\n请从此角色出发给出分析。`;
      }
      return `## ${r.icon} ${r.name}视角\n关注点：${r.focusAreas.join('、')}\n分析框架：${r.frameworks.join('、')}\n请从此角色出发给出分析。`;
    })
    .join('\n\n');

  return `你是一位能够切换多重专家视角的行业分析顾问。${depthInstruction}

用户选择了以下视角，请分区输出每个视角的分析：

${roleInstructions}

规则：
- 每个视角用独立的二级标题分区
- 基于提供的行业报告内容回答
- 如果报告中信息不足，请如实说明
- 回答要有结构、有数据支撑、有可操作建议`;
}

export async function POST(request: Request) {
  const body = await request.json();
  const { question, context, roles = [], depth = 'intermediate', messages = [], apiKey, baseUrl, model, searchApiKey } = body;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: '请先配置 API Key' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  let contextText = '';
  if (context?.selectedText) {
    contextText = `用户选中的文字：\n${context.selectedText}\n\n`;
  }
  if (context?.activeSection) {
    contextText += `当前查看的模块：\n${JSON.stringify(context.activeSection)}\n\n`;
  }
  if (context?.fullReport) {
    const report = context.fullReport;
    contextText += `行业报告概要：\n行业：${report.industry}\n概述：${report.summary}\n痛点：${report.painPoints?.map((p: {title: string; description: string}) => p.title + ' - ' + p.description).join('; ')}\nAI机会：${report.aiOpportunities?.map((o: {scenario: string; value: string}) => o.scenario + ' - ' + o.value).join('; ')}\n对标企业：${report.companies?.map((c: {name: string; notes: string}) => c.name + ' - ' + c.notes).join('; ')}\n`;
  }

  let searchContext = '';
  if (searchApiKey) {
    try {
      const results = await searchWeb(question, searchApiKey);
      if (results.length > 0) {
        searchContext = '\n\n[联网搜索结果]\n' + results.map((r) => `- ${r.title}: ${r.content} (来源: ${r.url})`).join('\n');
      }
    } catch {
      // search failure is non-blocking
    }
  }

  const userContent = contextText ? `[上下文]\n${contextText}\n[问题]\n${question}` : question;
  const apiMessages = [
    ...messages.slice(-10).map((m: {role: string; content: string}) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userContent + searchContext },
  ];

  const resolvedBase = (baseUrl || 'https://api.anthropic.com').replace(/\/+$/, '').replace(/\/v1\/chat\/completions$/, '').replace(/\/v1$/, '');
  const resolvedModel = model || 'claude-sonnet-4-6';
  const isNativeAnthropic = resolvedBase.includes('anthropic.com');

  // 动态路由：根据问题内容决定注入哪些角色 prompt（最多2个）
  let routedRoles = routePrompt(question, roles);
  if (routedRoles.length === 0 && !isNativeAnthropic) {
    routedRoles = await classifyWithAPI(question, apiKey, resolvedBase, resolvedModel);
  }
  if (routedRoles.length === 0) {
    routedRoles = roles.length > 0 ? roles.slice(0, 1) : [];
  }
  console.log('[chat/route] question:', question.slice(0, 50), '| routed roles:', routedRoles);

  const systemPrompt = buildSystemPrompt(routedRoles, depth, context?.fullReport?.industry);

  let response: Response;

  try {
    if (isNativeAnthropic) {
      response = await fetch(resolvedBase + '/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: resolvedModel,
          max_tokens: 4096,
          stream: true,
          system: systemPrompt,
          messages: apiMessages,
        }),
      });
    } else {
      const SHORT_SYSTEM = '你是一位资深行业分析专家，帮助用户进行行业研究和竞品分析。使用中文回复。';
      response = await fetch(resolvedBase + '/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: resolvedModel,
          max_tokens: 2048,
          stream: true,
          messages: [
            { role: 'system', content: SHORT_SYSTEM },
            { role: 'user', content: `[分析指令]\n${systemPrompt}\n\n请按以上指引回答后续问题。` },
            { role: 'assistant', content: '明白，我会按照以上专家视角和指引进行分析。请提问。' },
            ...apiMessages,
          ],
        }),
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: `网络请求失败: ${msg}` }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }

  if (!response.ok) {
    const errorText = await response.text();
    return new Response(JSON.stringify({ error: `API 错误 (${response.status}): ${errorText}` }), { status: response.status, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(response.body, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
  });
}
