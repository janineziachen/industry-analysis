export type SearchResult = {
  title: string;
  url: string;
  content: string;
};

export async function searchWeb(query: string, apiKey: string): Promise<SearchResult[]> {
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey, query, max_results: 5, include_answer: false }),
  });

  if (!res.ok) return [];

  const data = await res.json();
  return (data.results || []).map((r: { title: string; url: string; content: string }) => ({
    title: r.title,
    url: r.url,
    content: r.content?.slice(0, 500) || '',
  }));
}
