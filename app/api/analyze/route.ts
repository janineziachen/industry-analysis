import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { searchWeb, SearchResult } from '@/lib/search';

export const maxDuration = 300;

const SYSTEM_PROMPT = `你是一名资深产业研究员和 AI 产品经理。请只输出符合约定结构的 JSON，不要输出任何额外说明，不要用 markdown 代码块包裹。

重要：JSON 字符串值内部不得使用中文弯引号（"、"），只能用英文直引号（"）。如需在内容里表示引用，用书名号《》或直接描述。

要求的 JSON 结构如下（不要包含 detailSections 字段）：
{
  "industry": "行业名称",
  "summary": "行业概述（2-3句话，说清楚这个行业是什么、当前处于什么阶段、核心矛盾是什么）",
  "lifecycleStage": "行业生命周期阶段（如：导入期、成长期早期、成长期后期、成熟期、衰退期）",
  "keyFindings": ["核心发现1（一句话，包含关键数据）","核心发现2","核心发现3","核心发现4"],
  "marketData": {
    "totalSize": "市场规模（如**350亿元**）",
    "growth": "增长率（如**+34.7%**）",
    "year": "数据年份",
    "segments": [{"name":"细分市场名","share":"占比如30%"}],
    "forecast": "未来预测（如预计2027年达**450亿元**）",
    "source": "数据来源机构名"
  },
  "timeline": [
    { "year": "年份", "event": "关键事件", "impact": "对行业的具体影响", "detailId": "pain-1" }
  ],
  "policies": [
    { "id": "pol-1", "year": "年份", "name": "政策名称", "issuer": "发布机构", "impact": "对行业的具体影响", "type": "positive|regulation", "detailId": "pol-1" }
  ],
  "painPoints": [
    { "id": "pain-1", "title": "痛点名称", "description": "一句话描述核心问题", "severity": "high|medium|low", "detailId": "pain-1" }
  ],
  "aiOpportunities": [
    { "id": "opp-1", "scenario": "AI应用场景", "value": "能带来的具体价值", "modelType": "适用的技术方案", "relatedPain": "pain-1", "detailId": "opp-1" }
  ],
  "competitiveLandscape": {
    "tiers": [{"level":"第一梯队","description":"类型描述","companies":["公司A","公司B"]}],
    "dimensions": [{"name":"竞争维度如技术壁垒","tier1":"第一梯队表现","tier2":"第二梯队表现","tier3":"第三梯队表现（如无第三梯队可省略此字段）"}],
    "summary": "竞争格局一句话总结"
  },
  "companies": [
    { "id": "comp-1", "name": "真实公司名", "aiMaturity": "high|medium|low", "notes": "AI布局概况", "detailId": "comp-1" }
  ],
  "investment": [
    { "id": "inv-1", "year": "年份", "event": "融资/并购事件", "amount": "金额", "parties": "参与方", "significance": "行业意义", "detailId": "inv-1" }
  ],
  "sources": [
    { "title": "来源名称", "url": "链接（如有）", "citedIn": "引用模块如marketData" }
  ]
}

关键要求：
1. timeline 5-7条，painPoints 5-6条，aiOpportunities 5-6条，companies 5-6条（用真实公司名）
2. policies 3-5条（真实政策法规），investment 3-5条（真实融资/并购事件），competitiveLandscape 2-3个梯队
3. sources 5-8条，覆盖 marketData、policies、investment、companies 等主要模块，紧凑输出（只要 title 和 url，citedIn 可省略）
4. detailId 命名规则：painPoints 用 pain-1/pain-2...，aiOpportunities 用 opp-1/opp-2...，companies 用 comp-1/comp-2...，policies 用 pol-1/pol-2...，investment 用 inv-1/inv-2...
5. timeline 的 detailId 指向最相关的 painPoint 或 opportunity 的 id
6. severity 和 aiMaturity 只用 "high"、"medium"、"low"；policies 的 type 只用 "positive"（利好）或 "regulation"（合规要求）
7. aiOpportunities 的 relatedPain 填写该机会所解决的痛点 id（如 "pain-1"），建立痛点→机会的映射关系
8. 对关键数据和重要概念用 **加粗** 格式（如 **350亿元**、**+34.7%**），提高阅读体验
9. 字数控制（严格执行，避免超出 token 限制）：
   - summary：3句话以内
   - painPoints.description：2句话，说清问题本质和规模
   - aiOpportunities.value：2句话，说清价值和可行性
   - companies.notes：2句话，包含1个关键数据
   - threeMinuteSummary：3句话，点出行业本质、核心矛盾、机会方向
   - timeline.impact / policies.impact / investment.significance：1句话
10. 不要输出 detailSections 字段
11. 时效性：timeline必须覆盖到最近1-2年；所有数据注明年份`;

/**
 * Sanitize LLM-produced text before JSON.parse.
 *
 * Models generating Chinese content commonly embed typographic ("curly") quotes
 * inside JSON string values — U+201C " and U+201D " — which are not valid JSON
 * and cause syntax errors at the first occurrence (typically around position
 * 150-250 in early string values).  Replacing them with straight ASCII quotes
 * is safe because JSON structural delimiters are always ASCII " anyway.
 *
 * Also strips ASCII control characters (U+0000–U+001F) other than the three
 * whitespace characters JSON allows (\t \n \r).
 */
function sanitizeJsonText(text: string): string {
  let result = '';
  let inString = false;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    const code = text.charCodeAt(i);
    if (inString) {
      if (ch === '\\') {
        result += ch + (text[i + 1] ?? '');
        i += 2;
        continue;
      }
      if (ch === '”') {
        inString = false;
        result += ch;
      } else if (code === 0x201C || code === 0x201D) {
        // U+201C “ and U+201D “ inside a JSON string → escape as \”
        result += '\\”';
      } else {
        result += ch;
      }
    } else {
      if (ch === '”') {
        inString = true;
        result += ch;
      } else if (code === 0x201C || code === 0x201D) {
        // outside a string → drop
      } else {
        result += ch;
      }
    }
    i++;
  }
  // eslint-disable-next-line no-control-regex
  return result.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const industry = typeof body.industry === 'string' ? body.industry.trim() : '';

  if (!industry) {
    return new Response(JSON.stringify({ error: '请输入行业名称' }), { status: 400 });
  }

  const apiKey = (typeof body.apiKey === 'string' && body.apiKey) || process.env.ANTHROPIC_API_KEY;
  const baseUrl = ((typeof body.baseUrl === 'string' && body.baseUrl) || process.env.ANTHROPIC_BASE_URL || '').replace(/\/$/, '');
  const model = (typeof body.model === 'string' && body.model) || process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
  const partialText = (typeof body.partialText === 'string' && body.partialText) || '';

  if (!apiKey) {
    return new Response(JSON.stringify({ error: '未配置 API Key，请在右上角设置中配置' }), { status: 400 });
  }

  const isAnthropic = !baseUrl || baseUrl.includes('anthropic') || model.startsWith('claude');
  const encoder = new TextEncoder();

  const searchApiKey = (typeof body.searchApiKey === 'string' && body.searchApiKey) || process.env.TAVILY_API_KEY || '';

  let searchContext = '';
  // 有 partial 说明是续写，跳过联网搜索（上次已搜过）
  if (searchApiKey && !partialText) {
    try {
      const results = await searchWeb(`"${industry}" 最新 融资 并购 政策 2025 2026 市场规模`, searchApiKey);
      if (results.length > 0) {
        searchContext = results
          .map((r: SearchResult) => `【${r.title}】\n${r.content}\n来源: ${r.url}`)
          .join('\n\n');
      }
    } catch {
      // search failure is non-blocking
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (isAnthropic) {
          await streamAnthropic(controller, encoder, apiKey, baseUrl, model, industry, searchContext, partialText);
        } else {
          await streamOpenAICompat(controller, encoder, apiKey, baseUrl, model, industry, searchContext, partialText);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: `API 调用失败: ${msg}` })}\n\n`));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

const USER_PROMPT = (industry: string, searchContext?: string) => {
  const currentYear = new Date().getFullYear();
  let prompt = `请深度分析行业：${industry}。

重要时效性要求：
- 当前是${currentYear}年，你的分析必须覆盖到${currentYear}年最新动态
- timeline 编年史必须包含${currentYear - 1}年和${currentYear}年的事件
- policies 政策必须包含${currentYear - 1}年或${currentYear}年的最新政策
- investment 投融资必须包含${currentYear - 1}年或${currentYear}年的最新事件
- marketData 的数据年份应为${currentYear - 1}年或${currentYear}年
- 所有涉及数据的描述，如果不是当年数据，必须标注数据年份（如"截至${currentYear - 1}年"）

内容深度要求：
- 输出中文，内容专业、有深度、有具体数据和真实案例
- 每个模块都要有充分的内容量，不要一笔带过
- 痛点和机会的描述要有因果逻辑，说清"为什么是痛点""为什么是机会"
- 公司分析要包含具体的AI应用案例或数据
- sources 要覆盖全面，每个主要模块至少有1条真实来源`;
  if (searchContext) {
    prompt += `\n\n[联网搜索结果 - 请参考以下最新信息，优先使用其中的真实数据、事件和来源]\n${searchContext}`;
  }
  return prompt;
};

async function streamAnthropic(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  apiKey: string,
  baseUrl: string,
  model: string,
  industry: string,
  searchContext: string,
  partialText: string,
) {
  const client = new Anthropic({
    apiKey,
    baseURL: baseUrl || undefined,
    timeout: 10 * 60 * 1000,
  });

  const anthropicStream = await client.messages.stream({
    model,
    max_tokens: 16000,
    temperature: 0.3,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: USER_PROMPT(industry, searchContext) }],
  });

  let fullText = '';

  for await (const chunk of anthropicStream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      fullText += chunk.delta.text;
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: chunk.delta.text })}\n\n`));
    }
  }

  const finalMessage = await anthropicStream.finalMessage();
  if (finalMessage.stop_reason === 'max_tokens') {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: '生成被截断，请重试' })}\n\n`));
    return;
  }

  const cleaned = sanitizeJsonText(
    fullText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '').trim()
  );
  try {
    const analysis = JSON.parse(cleaned);
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, analysis })}\n\n`));
  } catch (e) {
    const err = e as Error;
    // position 从错误信息提取，输出前后各100字符
    const posMatch = err.message.match(/position (\d+)/);
    const pos = posMatch ? parseInt(posMatch[1]) : -1;
    const context = pos > 0 ? cleaned.slice(Math.max(0, pos - 100), pos + 100) : cleaned.slice(-300);
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: `JSON 解析失败：${err.message}。出错位置上下文：${context}` })}\n\n`));
  }
}

async function streamOpenAICompat(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  apiKey: string,
  baseUrl: string,
  model: string,
  industry: string,
  searchContext: string,
  partialText: string,
) {
  const messages: { role: string; content: string }[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: USER_PROMPT(industry, searchContext) },
  ];

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 16000,
    }),
  });

  if (!response.ok || !response.body) {
    const errText = await response.text().catch(() => '');
    throw new Error(`API ${response.status}: ${errText.slice(0, 200)}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = partialText;

  let finishReason = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const payload = trimmed.slice(6);
      if (payload === '[DONE]') break;
      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) {
          fullText += delta;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: delta })}\n\n`));
        }
        const reason = json.choices?.[0]?.finish_reason;
        if (reason) finishReason = reason;
      } catch { /* skip malformed chunks */ }
    }
  }

  if (finishReason === 'length') {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: '生成被截断，请重试' })}\n\n`));
    return;
  }

  const cleaned = sanitizeJsonText(
    fullText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '').trim()
  );
  try {
    const analysis = JSON.parse(cleaned);
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, analysis })}\n\n`));
  } catch (e) {
    const err = e as Error;
    const posMatch = err.message.match(/position (\d+)/);
    const pos = posMatch ? parseInt(posMatch[1]) : -1;
    const context = pos > 0 ? cleaned.slice(Math.max(0, pos - 100), pos + 100) : cleaned.slice(-300);
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: `JSON 解析失败：${err.message}。出错位置上下文：${context}` })}\n\n`));
  }
}