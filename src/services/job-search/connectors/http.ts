const FETCH_TIMEOUT_MS = 20_000;
const USER_AGENT =
  "AI-Job-Agent/1.0 (+https://github.com/Sararellano/AI-Job-Agent)";

/**
 * Shared JSON fetch helper for job connectors.
 */
export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
        ...init?.headers,
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Shared text fetch helper for HTML-based connectors.
 */
export async function fetchText(url: string, init?: RequestInit & { timeoutMs?: number }): Promise<string> {
  const timeoutMs = init?.timeoutMs ?? FETCH_TIMEOUT_MS;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const { timeoutMs: _ignored, ...requestInit } = init ?? {};
    const response = await fetch(url, {
      ...requestInit,
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/json",
        "User-Agent": USER_AGENT,
        ...init?.headers,
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}
