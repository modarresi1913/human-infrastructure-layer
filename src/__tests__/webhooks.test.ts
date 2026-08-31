import { describe, it, expect, vi } from 'vitest';
import { Webhooks } from '../webhooks.js';
import crypto from 'node:crypto';

function signPayload(payload: object, secret: string): string {
  const str = JSON.stringify(payload);
  return 'sha256=' + crypto.createHmac('sha256', secret).update(str).digest('hex');
}

describe('Webhooks', () => {
  it('emits task.completed event with valid signature', () => {
    const secret = 'whsec_test';
    const wh = new Webhooks(secret);

    const handler = vi.fn();
    wh.on('task.completed', handler);

    const payload = {
      id: 'evt_1',
      event: 'task.completed',
      data: { task_id: 'task_abc', status: 'completed', operator_id: 'op_1' },
      timestamp: Math.floor(Date.now() / 1000),
    };
    const signature = signPayload(payload, secret);

    wh.handle({ ...payload, signature }, signature);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({
      task_id: 'task_abc',
      status: 'completed',
      operator_id: 'op_1',
    });
  });

  it('throws on invalid signature', () => {
    const secret = 'secret_a';
    const wh = new Webhooks(secret);
    const payload = {
      id: 'evt_2',
      event: 'task.completed',
      data: {},
      timestamp: Math.floor(Date.now() / 1000),
    };
    const signature = signPayload(payload, secret);
    expect(() => wh.handle({ ...payload, signature }, 'sha256=' + 'a'.repeat(64))).toThrow('Invalid webhook signature');
  });

  it('throws on expired timestamp', () => {
    const secret = 'whsec_test';
    const wh = new Webhooks(secret, { toleranceSeconds: 60 });

    const payload = {
      id: 'evt_3',
      event: 'task.completed',
      data: {},
      timestamp: Math.floor(Date.now() / 1000) - 120,
    };
    const signature = signPayload(payload, secret);

    expect(() => wh.handle({ ...payload, signature }, signature)).toThrow('Webhook too old');
  });
});