import type { HILClient } from '../client.js';
import type { Task } from '../types.js';

export class Tasks {
  constructor(private readonly client: HILClient) {}

  /** Retrieve the current status and result of a task. */
  async get(taskId: string): Promise<Task> {
    return this.client.request<Task>('GET', `/tasks/${taskId}`);
  }

  /** List recent tasks with optional status filter. */
  async list(filter?: { status?: Task['status']; limit?: number }): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filter?.status) params.set('status', filter.status);
    if (filter?.limit) params.set('limit', String(filter.limit));
    const qs = params.toString();
    return this.client.request<Task[]>('GET', `/tasks${qs ? `?${qs}` : ''}`);
  }

  /** Cancel a pending or in-progress task. */
  async cancel(taskId: string): Promise<Task> {
    return this.client.request<Task>('POST', `/tasks/${taskId}/cancel`);
  }
}
