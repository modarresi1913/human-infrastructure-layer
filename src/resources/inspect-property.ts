import type { HILClient } from '../client.js';
import type { InspectPropertyParams, InspectionReport, Task } from '../types.js';
import { TaskFailedError } from '../errors.js';

export class InspectProperty {
  constructor(private readonly client: HILClient) {}

  /**
   * Dispatch a trained human inspector to assess a property.
   *
   * @example
   * ```ts
   * const report = await human.inspect_property({
   *   address: '123 Main St, Tehran',
   *   photo_required: true,
   *   inspector_level: 'senior',
   * });
   * console.log(report.condition); // 'fair'
   * console.log(report.score);      // 62
   * ```
   */
  async create(params: InspectPropertyParams): Promise<InspectionReport> {
    return this.client.request<InspectionReport>('POST', '/inspect-property', params);
  }

  /** Poll an inspection task until it completes or fails. */
  async waitForResult(taskId: string, { intervalMs = 5000, timeoutMs = 86400000 } = {}): Promise<InspectionReport> {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      const task = await this.client.request<Task>('GET', `/tasks/${taskId}`);

      if (task.status === 'completed') {
        return task.result as InspectionReport;
      }
      if (task.status === 'failed') {
        throw new TaskFailedError(taskId, task.error || 'Task failed');
      }

      await new Promise((r) => setTimeout(r, intervalMs));
    }

    throw new Error(`Timeout waiting for task ${taskId}`);
  }
}
