import { buildModulePrompt } from '@/lib/planner-prompts';
import type { PlannerModule, ProjectInfo } from '@/lib/planner-types';
import type { IndustryAnalysis } from '@/lib/analysis-schema';

export async function POST(request: Request) {
  const body = await request.json();
  const {
    module,
    projectInfo,
    industryData,
    apiKey,
    baseUrl,
    model,
  }: {
    module: PlannerModule;
    projectInfo: ProjectInfo;
    industryData?: IndustryAnalysis;
    apiKey: string;
    baseUrl?: string;
    model?: string;
  } = body;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: '请先配置 API Key' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const resolvedBase = (baseUrl || 'https://api.anthropic.com').replace(/\/+$/, '');
  const resolvedModel = model || 'claude-sonnet-4-6';
  const isNativeAnthropic = resolvedBase.includes('anthropic.com');

  const userPrompt = buildModulePrompt(module, projectInfo, industryData);
  const SHORT_SYSTEM = '你是资深产品战略顾问。按照用户指定的框架和格式输出分析。使用中文，保持专业但通俗。';

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
          system: SHORT_SYSTEM,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });
    } else {
      const endpoint = resolvedBase.endsWith('/v1')
        ? `${resolvedBase}/chat/completions`
        : `${resolvedBase}/v1/chat/completions`;
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: resolvedModel,
          max_tokens: 4096,
          stream: true,
          messages: [
            { role: 'system', content: SHORT_SYSTEM },
            { role: 'user', content: userPrompt },
          ],
        }),
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: `网络请求失败: ${msg}` }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!response.ok) {
    const errorText = await response.text();
    return new Response(JSON.stringify({ error: `API 错误 (${response.status}): ${errorText}` }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
