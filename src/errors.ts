/**
 * Human Infrastructure Layer — Error Classes
 * @module @hil/sdk/errors
 */

export class HILError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly request_id?: string,
  ) {
    super(message);
    this.name = 'HILError';
  }
}

export class AuthenticationError extends HILError {
  constructor(message = 'Invalid API key', request_id?: string) {
    super(message, 401, 'AUTH_FAILED', request_id);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends HILError {
  public readonly retry_after: number;

  constructor(retry_after: number, request_id?: string) {
    super(
      `Rate limited. Retry after ${retry_after} seconds`,
      429,
      'RATE_LIMITED',
      request_id,
    );
    this.name = 'RateLimitError';
    this.retry_after = retry_after;
  }
}

export class TaskTimeoutError extends HILError {
  constructor(task_id: string, request_id?: string) {
    super(
      `Task ${task_id} timed out`,
      408,
      'TASK_TIMEOUT',
      request_id,
    );
    this.name = 'TaskTimeoutError';
  }
}

export class TaskFailedError extends HILError {
  public readonly task_id: string;
  public readonly reason: string;

  constructor(task_id: string, reason: string, request_id?: string) {
    super(
      `Task ${task_id} failed: ${reason}`,
      422,
      'TASK_FAILED',
      request_id,
    );
    this.name = 'TaskFailedError';
    this.task_id = task_id;
    this.reason = reason;
  }
}

export class OperatorUnavailableError extends HILError {
  constructor(region: string, request_id?: string) {
    super(
      `No available operator in region: ${region}`,
      503,
      'NO_OPERATOR',
      request_id,
    );
    this.name = 'OperatorUnavailableError';
  }
}

export class InvalidRequestError extends HILError {
  public readonly field?: string;

  constructor(message: string, field?: string, request_id?: string) {
    super(message, 400, 'INVALID_REQUEST', request_id);
    this.name = 'InvalidRequestError';
    this.field = field;
  }
}
