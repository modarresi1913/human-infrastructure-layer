import type { HILConfig, Network } from './types.js';
import {
  HILError,
  AuthenticationError,
  RateLimitError,
  InvalidRequestError,
} from './errors.js';

const DEFAULT_BASE_URL: Record<Network, string> = {
  testnet: 'https://api.testnet.hil.dev/v1',
  mainnet: 'https://api.hil.dev/v1',
};

const DEFAULT_TIMEOUT = 30_000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1_000;
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function buildHeaders(apiKey: string, extra?: Record<string, string>): Headers {
  const h = new Headers({
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'User-Agent': 'hil-sdk/0.1.0',
    'X-HIL-SDK-Version': '0.1.0',
    ...extra,
  });
  return h;
}

export class HILClient {
  private readonly apiKey: string;
  private readonly baseURL: string;
  private readonly timeout: number;
  private readonly maxRetries: number;

  constructor(config: HILConfig) {
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL ?? DEFAULT_BASE_URL[config.network ?? 'testnet'];
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
    this.maxRetries = config.maxRetries ?? MAX_RETRIES;
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    let lastError: HILError | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        await sleep(RETRY_DELAY_MS * attempt);
      }

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeout);

        const res = await fetch(`${this.baseURL}${path}`, {
          method,
          headers: buildHeaders(this.apiKey),
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timer);

        const request_id = res.headers.get('x-request-id') ?? undefined;
        const data = await res.json();

        if (res.ok) return data as T;

        // Non-retryable — throw immediately
        if (res.status === 401) throw new AuthenticationError(data.message, request_id);
        if (res.status === 400) {
          throw new InvalidRequestError(
            data.message || 'Bad request',
            data.field,
            request_id,
          );
        }

        lastError = new HILError(
          data.message || `HTTP ${res.status}`,
          res.status,
          data.code || 'UNKNOWN',
          request_id,
        );

        // Retryable?
        if (!RETRYABLE_STATUS.has(res.status)) throw lastError;

        // Rate limit — use Retry-After header
        if (res.status === 429 && data.retry_after) {
          lastError = new RateLimitError(data.retry_after, request_id);
        }
      } catch (err) {
        if (err instanceof HILError) {
          if (!RETRYABLE_STATUS.has(err.status) || attempt === this.maxRetries) throw err;
          lastError = err;
          continue;
        }
        // Network / abort error
        if (attempt === this.maxRetries) {
          throw new HILError(
            (err as Error).message || 'Network error',
            0,
            'NETWORK_ERROR',
          );
        }
      }
    }

    throw lastError!;
  }

  /** Stream a task's real-time updates via WebSocket. */
  taskStream(taskId: string, opts?: { signal?: AbortSignal }): EventSource {
    const url = `${this.baseURL.replace(/^http/, 'ws')}/tasks/${taskId}/stream`;
    // Return EventSource-like; real impl would use WebSocket.
    throw new Error('WebSocket streaming not supported in Node.js — use a browser environment or ws library.');
  }
}
