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
  const { industry, summary, painPoints, aiOpportunities, apiKey, baseUrl, model } = body;

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

  const prompt = `行业：${industry}
行业概述：${summary || ''}
核心痛点：${(painPoints || []).join('、')}
AI机会：${(aiOpportunities || []).join('、')}

请输出以下 JSON，不要包含任何额外说明：
{
  "threeMinuteSummary": "3句话讲清行业本质、核心矛盾和最大机会，适合面试开场",
  "interviewLines": [
    {"scene": "行业认知", "line": "金句"},
    {"scene": "商业判断", "line": "金句"},
    {"scene": "技术理解", "line": "金句"},
    {"scene": "战略思维", "line": "金句"},
    {"scene": "趋势预判", "line": "金句"}
  ]
}

要求：金句要有观点、有数据、有逻辑，不能是废话套话。`;

  try {
    let result = '';

    if (isAnthropic) {
      const client = new Anthropic({ apiKey: resolvedKey, baseURL: resolvedBase || undefined, timeout: 100000 });
      const msg = await client.messages.create({
        model: resolvedModel,
        max_tokens: 2000,
        temperature: 0.4,
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
          temperature: 0.4,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const json = await res.json();
      result = json.choices?.[0]?.message?.content || '';
    }

    const cleaned = sanitizeJsonText(result.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '').trim());
    const parsed = JSON.parse(cleaned);
    return new Response(JSON.stringify(parsed), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 });
  }
}
