/**
 * Human Infrastructure Layer — Webhook Handler
 * @module @hil/sdk/webhooks
 */

import EventEmitter from 'eventemitter3';
import crypto from 'node:crypto';
import type {
  WebhookEvent,
  WebhookPayload,
  TaskWebhookData,
  PaymentWebhookData,
} from './types.js';

type EventMap = {
  'task.created': (data: TaskWebhookData) => void;
  'task.accepted': (data: TaskWebhookData) => void;
  'task.completed': (data: TaskWebhookData) => void;
  'task.failed': (data: TaskWebhookData) => void;
  'payment.settled': (data: PaymentWebhookData) => void;
};

type SignedPayload = WebhookPayload & { signature: string; timestamp: number };

export class Webhooks extends EventEmitter<EventMap> {
  private readonly signingSecret: string;
  private readonly toleranceSeconds: number;

  constructor(signingSecret: string, { toleranceSeconds = 300 } = {}) {
    super();
    this.signingSecret = signingSecret;
    this.toleranceSeconds = toleranceSeconds;
  }

  /**
   * Verify and emit a webhook event from a raw JSON body.
   *
   * @example
   * ```ts
   * const wh = new Webhooks(process.env.HIL_WEBHOOK_SECRET!);
   * wh.on('task.completed', (data) => console.log(data.task_id));
   *
   * // In your HTTP handler:
   * app.post('/webhooks/hil', (req, res) => {
   *   wh.handle(req.body, req.headers['x-hil-signature'] as string);
   *   res.sendStatus(200);
   * });
   * ```
   */
  handle(body: SignedPayload, signatureHeader: string): void {
    if (!this.verifySignature(body, signatureHeader)) {
      throw new Error('Invalid webhook signature');
    }

    const age = Math.floor(Date.now() / 1000) - body.timestamp;
    if (age > this.toleranceSeconds) {
      throw new Error(`Webhook too old: ${age}s > ${this.toleranceSeconds}s tolerance`);
    }

    this.emit(body.event, body.data as never);
  }

  /** Verify HMAC-SHA256 signature. */
  verifySignature(body: SignedPayload, signatureHeader: string): boolean {
    const payload = JSON.stringify({ ...body, signature: undefined });
    const expected = 'sha256=' + crypto
      .createHmac('sha256', this.signingSecret)
      .update(payload)
      .digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(expected),
    );
  }

  /** Parse a raw HTTP body (string) and handle. */
  handleRaw(rawBody: string, signatureHeader: string): void {
    const body = JSON.parse(rawBody) as SignedPayload;
    return this.handle(body, signatureHeader);
  }
}