// Thin typed wrapper around the Firecrawl REST API.
// Used by the competitor directory crawlers (crawl-treatstock, crawl-all3dp, ...).
// Schemas are plain JSON-Schema objects — keeps Deno edge function deps minimal.

const API_BASE = 'https://api.firecrawl.dev/v1';

export interface FirecrawlMapResult {
  links: string[];
}

export interface FirecrawlExtractResult<T> {
  data: T;
  status: 'completed' | 'failed' | 'processing';
  error?: string;
}

export class FirecrawlClient {
  constructor(private apiKey: string) {}

  // Discover URLs reachable from a root URL. Used to enumerate listing pages.
  async map(rootUrl: string, opts?: { search?: string; limit?: number }): Promise<string[]> {
    const res = await fetch(`${API_BASE}/map`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: rootUrl,
        search: opts?.search,
        limit: opts?.limit ?? 200,
      }),
    });
    if (!res.ok) {
      throw new Error(`Firecrawl /map failed: ${res.status} ${await res.text()}`);
    }
    const json = await res.json();
    return json.links ?? [];
  }

  // Structured extraction with a JSON schema. Firecrawl /extract is async —
  // poll the returned id until it completes or times out.
  async extract<T>(
    urls: string[],
    schema: Record<string, unknown>,
    prompt: string,
    timeoutMs = 120_000,
  ): Promise<T | null> {
    const startRes = await fetch(`${API_BASE}/extract`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ urls, schema, prompt }),
    });
    if (!startRes.ok) {
      throw new Error(`Firecrawl /extract start failed: ${startRes.status} ${await startRes.text()}`);
    }
    const startJson = await startRes.json();
    const jobId = startJson.id;
    if (!jobId) {
      // Some Firecrawl plans return data inline.
      return (startJson.data ?? null) as T | null;
    }

    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 3000));
      const pollRes = await fetch(`${API_BASE}/extract/${jobId}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      });
      if (!pollRes.ok) continue;
      const pollJson = await pollRes.json();
      if (pollJson.status === 'completed') return (pollJson.data ?? null) as T | null;
      if (pollJson.status === 'failed') {
        throw new Error(`Firecrawl /extract failed: ${pollJson.error ?? 'unknown'}`);
      }
    }
    throw new Error('Firecrawl /extract timed out');
  }

  // Single-page markdown scrape. Fallback when /extract overshoots.
  async scrape(url: string): Promise<{ markdown?: string; html?: string }> {
    const res = await fetch(`${API_BASE}/scrape`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true }),
    });
    if (!res.ok) {
      throw new Error(`Firecrawl /scrape failed: ${res.status} ${await res.text()}`);
    }
    const json = await res.json();
    return json.data ?? {};
  }
}
