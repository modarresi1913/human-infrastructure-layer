import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Human } from '../index.js';
import { TaskFailedError } from '../errors.js';

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => { mockFetch.mockReset(); });

describe('Human.verify_identity', () => {
  it('calls POST /verify-identity with params and returns result', async () => {
    const mockResult = {
      verified: true,
      trust_score: 0.94,
      operator_id: 'op_7x9k2m',
      task_id: 'task_abc123',
      completed_at: '2026-08-31T08:00:00Z',
      evidence: {
        photos: ['https://ipfs.hil.dev/Qm...'],
        gps_coordinates: { lat: 35.6892, lng: 51.389 },
        timestamp: '2026-08-31T08:00:00Z',
      },
    };
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'x-request-id': 'req_1' }),
      json: async () => mockResult,
    });

    const human = new Human({ apiKey: 'hil_test_key' });
    const result = await human.verify_identity.create({
      lat: 35.6892,
      lng: 51.389,
      document_type: 'national_id',
      urgency: 'standard',
    });

    expect(result.verified).toBe(true);
    expect(result.trust_score).toBe(0.94);
    expect(result.operator_id).toBe('op_7x9k2m');
    expect(result.evidence.photos).toHaveLength(1);
  });

  it('waitForResult polls until completed', async () => {
    const completed = {
      id: 'task_poll',
      type: 'verify_identity',
      status: 'completed',
      created_at: '2026-08-31T08:00:00Z',
      updated_at: '2026-08-31T08:04:00Z',
      result: { verified: true, trust_score: 0.9, operator_id: 'op_1', task_id: 'task_poll', completed_at: '2026-08-31T08:04:00Z', evidence: { photos: [], gps_coordinates: { lat: 0, lng: 0 }, timestamp: '' } },
    };

    mockFetch.mockResolvedValue({
      ok: true, status: 200, headers: new Headers(),
      json: async () => completed,
    });

    const human = new Human({ apiKey: 'test' });
    const result = await human.verify_identity.waitForResult('task_poll', {
      intervalMs: 10,
      timeoutMs: 1000,
    });
    expect(result.verified).toBe(true);
  });

  it('waitForResult throws on failed task', async () => {
    const failed = {
      id: 'task_fail',
      type: 'verify_identity',
      status: 'failed',
      error: 'No operator available',
      created_at: '2026-08-31T08:00:00Z',
      updated_at: '2026-08-31T08:00:05Z',
    };

    mockFetch.mockResolvedValue({
      ok: true, status: 200, headers: new Headers(),
      json: async () => failed,
    });

    const human = new Human({ apiKey: 'test' });
    await expect(
      human.verify_identity.waitForResult('task_fail', { intervalMs: 10, timeoutMs: 1000 }),
    ).rejects.toThrow(TaskFailedError);
  });
});
