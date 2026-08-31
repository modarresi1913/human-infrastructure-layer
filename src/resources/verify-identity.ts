import type { HILClient } from '../client.js';
import type { VerifyIdentityParams, VerificationResult, Task } from '../types.js';
import { TaskFailedError } from '../errors.js';

export class VerifyIdentity {
  constructor(private readonly client: HILClient) {}

  /**
   * Dispatch a human operator for on-site identity verification.
   *
   * @example
   * ```ts
   * const result = await human.verify_identity({
   *   lat: 35.6892,
   *   lng: 51.3890,
   *   document_type: 'national_id',
   *   urgency: 'standard',
   * });
   * console.log(result.verified);      // true
   * console.log(result.trust_score);  // 0.94
   * ```
   */
  async create(params: VerifyIdentityParams): Promise<VerificationResult> {
    return this.client.request<VerificationResult>('POST', '/verify-identity', params);
  }

  /** Poll a verification task until it completes or fails. */
  async waitForResult(taskId: string, { intervalMs = 5000, timeoutMs = 14400000 } = {}): Promise<VerificationResult> {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      const task = await this.client.request<Task>('GET', `/tasks/${taskId}`);

      if (task.status === 'completed') {
        return task.result as VerificationResult;
      }
      if (task.status === 'failed') {
        throw new TaskFailedError(taskId, task.error || 'Task failed');
      }

      await new Promise((r) => setTimeout(r, intervalMs));
    }

    throw new Error(`Timeout waiting for task ${taskId}`);
  }
}
