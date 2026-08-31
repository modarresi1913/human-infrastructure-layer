import type { HILClient } from '../client.js';
import type { SanityCheckParams, ApprovalResult, Task } from '../types.js';
import { TaskFailedError } from '../errors.js';

export class SanityCheck {
  constructor(private readonly client: HILClient) {}

  /**
   * Route a high-stakes AI decision to a human reviewer for common-sense judgment.
   *
   * @example
   * ```ts
   * const result = await human.sanity_check({
   *   decision: { action: 'transfer', amount: 500_000, to: '0x...' },
   *   context: 'Large USDC transfer flagged by internal risk model',
   *   risk_level: 'high',
   * });
   * console.log(result.approved);      // false
   * console.log(result.notes);         // 'Recipient address is on OFAC sanctions list'
   * console.log(result.turnaround_ms); // 42000
   * ```
   */
  async create(params: SanityCheckParams): Promise<ApprovalResult> {
    return this.client.request<ApprovalResult>('POST', '/sanity-check', params);
  }

  /** Poll a sanity-check task until it completes or fails. */
  async waitForResult(taskId: string, { intervalMs = 3000, timeoutMs = 3600000 } = {}): Promise<ApprovalResult> {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      const task = await this.client.request<Task>('GET', `/tasks/${taskId}`);

      if (task.status === 'completed') {
        return task.result as ApprovalResult;
      }
      if (task.status === 'failed') {
        throw new TaskFailedError(taskId, task.error || 'Task failed');
      }

      await new Promise((r) => setTimeout(r, intervalMs));
    }

    throw new Error(`Timeout waiting for task ${taskId}`);
  }
}