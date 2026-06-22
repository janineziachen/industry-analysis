import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { terms, industry } = body;

  if (!Array.isArray(terms) || terms.length === 0) {
    return new Response(JSON.stringify({ error: '请提供术语列表' }), { status: 400 });
  }

  const apiKey = (typeof body.apiKey === 'string' && body.apiKey) || process.env.ANTHROPIC_API_KEY;
  const baseUrl = ((typeof body.baseUrl === 'string' && body.baseUrl) || process.env.ANTHROPIC_BASE_URL || '').replace(/\/$/, '');
  const model = (typeof body.model === 'string' && body.model) || process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

  if (!apiKey) {
    return new Response(JSON.stringify({ error: '未配置 API Key' }), { status: 400 });
  }

  const client = new Anthropic({
    apiKey,
    baseURL: baseUrl || undefined,
    timeout: 60 * 1000,
  });

  const termList = terms.map((t: string, i: number) => `${i + 1}. ${t}`).join('\n');

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await client.messages.stream({
          model,
          max_tokens: 2000,
          temperature: 0.2,
          messages: [{
            role: 'user',
            content: `你是一名${industry}行业专家。请为以下专业术语提供简洁清晰的中文解释，每条解释控制在 50 字以内，面向非专业读者。

只输出 JSON 数组，格式如下，不要输出任何其他内容：
[{"term":"术语1","definition":"解释1"},{"term":"术语2","definition":"解释2"}]

需要解释的术语：
${termList}`,
          }],
        });

        let fullText = '';
        for await (const chunk of anthropicStream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            fullText += chunk.delta.text;
          }
        }

        const cleaned = fullText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '').trim();
        try {
          const result = JSON.parse(cleaned);
          controller.enqueue(encoder.encode(JSON.stringify({ terms: result })));
        } catch {
          controller.enqueue(encoder.encode(JSON.stringify({ error: '解析失败，请重试' })));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        controller.enqueue(encoder.encode(JSON.stringify({ error: `API 调用失败: ${msg}` })));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'application/json' },
  });
}
