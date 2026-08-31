import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HILClient } from '../client.js';
import { AuthenticationError, RateLimitError, InvalidRequestError, HILError } from '../errors.js';

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => { mockFetch.mockReset(); });
afterEach(() => { vi.restoreAllMocks(); });

function mockResponse(status: number, body: Record<string, unknown>, headers?: Record<string, string>) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'x-request-id': 'req_123', ...headers }),
    json: async () => body,
  };
}

describe('HILClient', () => {
  it('sends Authorization header with Bearer token', async () => {
    mockFetch.mockResolvedValue(mockResponse(200, { verified: true, trust_score: 0.95 }));
    const client = new HILClient({ apiKey: 'hil_test_abc' });
    await client.request('POST', '/verify-identity', { lat: 35.7, lng: 51.4 });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/verify-identity'),
      expect.objectContaining({
        headers: expect.any(Headers),
      }),
    );
    const call = mockFetch.mock.calls[0];
    const headers = call[1].headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer hil_test_abc');
  });

  it('uses testnet by default', async () => {
    mockFetch.mockResolvedValue(mockResponse(200, { id: 't1' }));
    const client = new HILClient({ apiKey: 'test' });
    await client.request('GET', '/tasks/t1');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('api.testnet.hil.dev'),
      expect.anything(),
    );
  });

  it('uses mainnet when configured', async () => {
    mockFetch.mockResolvedValue(mockResponse(200, { id: 't1' }));
    const client = new HILClient({ apiKey: 'test', network: 'mainnet' });
    await client.request('GET', '/tasks/t1');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('api.hil.dev/v1'),
      expect.anything(),
    );
  });

  it('throws AuthenticationError on 401', async () => {
    mockFetch.mockResolvedValue(mockResponse(401, { message: 'Invalid API key' }));
    const client = new HILClient({ apiKey: 'bad' });
    await expect(client.request('GET', '/tasks/t1')).rejects.toThrow(AuthenticationError);
  });

  it('throws InvalidRequestError on 400', async () => {
    mockFetch.mockResolvedValue(mockResponse(400, { message: 'lat is required', field: 'lat' }));
    const client = new HILClient({ apiKey: 'test' });
    await expect(client.request('POST', '/verify-identity', {})).rejects.toThrow(InvalidRequestError);
  });

  it('throws HILError (non-retryable) immediately', async () => {
    mockFetch.mockResolvedValue(mockResponse(403, { message: 'Forbidden', code: 'FORBIDDEN' }));
    const client = new HILClient({ apiKey: 'test', maxRetries: 3 });
    await expect(client.request('GET', '/tasks/t1')).rejects.toThrow(HILError);
    expect(mockFetch).toHaveBeenCalledTimes(1); // no retry
  });

  it('retries on 503 and eventually throws', async () => {
    mockFetch.mockResolvedValue(mockResponse(503, { message: 'Service unavailable' }));
    const client = new HILClient({ apiKey: 'test', maxRetries: 2, timeout: 1000 });
    await expect(client.request('GET', '/tasks/t1')).rejects.toThrow(HILError);
    expect(mockFetch).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it('returns parsed JSON on success', async () => {
    const body = { verified: true, trust_score: 0.94, operator_id: 'op_1', task_id: 't1', completed_at: '2026-08-31T08:00:00Z', evidence: { photos: [], gps_coordinates: { lat: 35.7, lng: 51.4 }, timestamp: '2026-08-31T08:00:00Z' } };
    mockFetch.mockResolvedValue(mockResponse(200, body));
    const client = new HILClient({ apiKey: 'test' });
    const result = await client.request('POST', '/verify-identity', { lat: 35.7, lng: 51.4 });
    expect(result).toEqual(body);
  });
});
