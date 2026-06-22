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

const SYSTEM_PROMPT = `你是一名资深产业研究员和 AI 产品经理。请只输出符合约定结构的 JSON，不要输出任何额外说明，不要用 markdown 代码块包裹。

要求的 JSON 结构如下：
{
  "id": "传入的id",
  "title": "标题",
  "summary": "2-3句话深度点明本质，包含关键数据",
  "causeEffect": ["前因：...", "过程：...", "结果：..."],
  "dataPoints": ["具体数据或趋势1（含数字和来源）", "具体数据2", "具体数据3", "具体数据4"],
  "cases": ["真实案例1（公司名+具体做法+量化结果）", "真实案例2", "真实案例3"],
  "comparison": ["维度1：方案A vs 方案B — 差异分析", "维度2：横向对比"],
  "roadmap": ["第一步：...", "第二步：...", "第三步：...", "第四步：..."]
}

关键要求：
1. 这是主报告的深度展开，主报告只有摘要，这里要给出完整分析
2. causeEffect：讲清完整因果链，每条1-2句话，共3条
3. dataPoints：必须有具体数字，注明数据年份，3-4条
4. cases：真实公司名+具体措施+量化成果，2-3条
5. comparison：对比不同方案/竞争路径/技术选型，2-3条
6. roadmap：可落地的行动建议，3-4步
7. 内容专业有深度，是主报告摘要的3-5倍展开，补充主报告未涉及的细节和数据`;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { industry, id, type, title } = body;

  if (!industry || !id || !type) {
    return new Response(JSON.stringify({ error: '参数不完整' }), { status: 400 });
  }

  const typeLabel: Record<string, string> = {
    pain: '核心痛点',
    opportunity: 'AI 机会点',
    company: '对标企业',
    timeline: '关键事件',
    policy: '政策解读',
    investment: '投融资事件',
    market: '市场数据',
  };

  const apiKey = (typeof body.apiKey === 'string' && body.apiKey) || process.env.ANTHROPIC_API_KEY;
  const baseUrl = ((typeof body.baseUrl === 'string' && body.baseUrl) || process.env.ANTHROPIC_BASE_URL || '').replace(/\/$/, '');
  const model = (typeof body.model === 'string' && body.model) || process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

  if (!apiKey) {
    return new Response(JSON.stringify({ error: '未配置 API Key' }), { status: 400 });
  }

  const client = new Anthropic({
    apiKey,
    baseURL: baseUrl || undefined,
    timeout: 3 * 60 * 1000,
  });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await client.messages.stream({
          model,
          max_tokens: 4000,
          temperature: 0.3,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: `行业：${industry}
分析类型：${typeLabel[type] || type}
具体主题：${title || id}
ID：${id}

注意：主报告中对此主题只有摘要性描述，请在这里给出完整深度分析，补充主报告未展开的因果逻辑、具体数据、真实案例和行动建议。`,
            },
          ],
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
          controller.close();
          return;
        }

        const cleaned = sanitizeJsonText(fullText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, ''));
        try {
          const section = JSON.parse(cleaned);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, section })}\n\n`));
        } catch {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'JSON 解析失败，请重试' })}\n\n`));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: `Claude API 调用失败: ${msg}` })}\n\n`));
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
