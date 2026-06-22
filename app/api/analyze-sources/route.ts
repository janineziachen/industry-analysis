import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

export const maxDuration = 120;

function sanitizeJsonText(text: string): string {
  let result = '';
  let inString = false;
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    const code = text.charCodeAt(i);
    if (inString) {
      if (ch === '\\') { result += ch + (text[i + 1] ?? ''); i += 2; continue; }
      if (ch === '"') { inString = false; result += ch; }
      else if (code === 0x201C || code === 0x201D) { result += '\\"'; }
      else { result += ch; }
    } else {
      if (ch === '"') { inString = true; result += ch; }
      else if (code === 0x201C || code === 0x201D) { /* drop */ }
      else { result += ch; }
    }
    i++;
  }
  // eslint-disable-next-line no-control-regex
  return result.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { industry, apiKey, baseUrl, model } = body;

  if (!industry) {
    return new Response(JSON.stringify({ error: '参数不完整' }), { status: 400 });
  }

  const resolvedKey = (typeof apiKey === 'string' && apiKey) || process.env.ANTHROPIC_API_KEY;
  const resolvedBase = ((typeof baseUrl === 'string' && baseUrl) || process.env.ANTHROPIC_BASE_URL || '').replace(/\/$/, '');
  const resolvedModel = (typeof model === 'string' && model) || process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

  if (!resolvedKey) {
    return new Response(JSON.stringify({ error: '未配置 API Key' }), { status: 400 });
  }

  const isAnthropic = !resolvedBase || resolvedBase.includes('anthropic') || resolvedModel.startsWith('claude');

  const prompt = `请为"${industry}"行业分析报告生成8-10条参考来源，涵盖市场数据、政策法规、投融资事件、头部企业动态等模块。

只输出 JSON，不要用弯引号（"、"），格式如下：
{
  "sources": [
    { "title": "来源标题", "url": "链接（如有，填真实URL）", "citedIn": "引用模块如marketData" }
  ]
}

要求：
1. 尽量使用真实存在的报告、新闻、政策文件
2. 来源要覆盖多个模块：marketData、policies、investment、companies、painPoints、aiOpportunities
3. 优先IDC、Gartner、艾瑞、36氪、政府官网、上市公司公告等权威来源`;

  try {
    let result = '';

    if (isAnthropic) {
      const client = new Anthropic({ apiKey: resolvedKey, baseURL: resolvedBase || undefined, timeout: 100000 });
      const msg = await client.messages.create({
        model: resolvedModel,
        max_tokens: 2000,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }],
      });
      result = (msg.content[0] as { type: string; text: string }).text;
    } else {
      const endpoint = resolvedBase.endsWith('/v1') ? `${resolvedBase}/chat/completions` : `${resolvedBase}/v1/chat/completions`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resolvedKey}` },
        body: JSON.stringify({
          model: resolvedModel,
          max_tokens: 2000,
          temperature: 0.3,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!res.ok) throw new Error(`API ${res.status}: ${await res.text().then(t => t.slice(0, 200))}`);
      const json = await res.json();
      result = json.choices?.[0]?.message?.content || '';
    }

    const cleaned = sanitizeJsonText(result.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '').trim());
    const parsed = JSON.parse(cleaned);
    return new Response(JSON.stringify(parsed), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    const msg = (e as Error).message;
    console.error('[analyze-sources]', msg);
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}
