/**
 * Human Infrastructure Layer — SDK
 * @module @hil/sdk
 *
 * @example
 * ```ts
 * import { Human } from '@hil/sdk';
 *
 * const human = new Human({ apiKey: process.env.HIL_API_KEY! });
 * const result = await human.verify_identity({ lat: 35.7, lng: 51.4 });
 * ```
 */

// Re-export types
export type {
  Network,
  Urgency,
  RiskLevel,
  PropertyCondition,
  InspectorLevel,
  WebhookEvent,
  GPSCoordinates,
  Evidence,
  HILConfig,
  VerifyIdentityParams,
  VerificationResult,
  InspectPropertyParams,
  InspectionReport,
  SanityCheckParams,
  ApprovalResult,
  TaskStatus,
  Task,
  WebhookPayload,
  TaskWebhookData,
  PaymentWebhookData,
  Operator,
} from './types.js';

// Re-export errors
export {
  HILError,
  AuthenticationError,
  RateLimitError,
  TaskTimeoutError,
  TaskFailedError,
  OperatorUnavailableError,
  InvalidRequestError,
} from './errors.js';

// Re-export webhooks
export { Webhooks } from './webhooks.js';

// Internal
import { HILClient } from './client.js';
import { VerifyIdentity } from './resources/verify-identity.js';
import { InspectProperty } from './resources/inspect-property.js';
import { SanityCheck } from './resources/sanity-check.js';
import { Tasks } from './resources/tasks.js';
import type { HILConfig, VerificationResult, InspectPropertyParams, InspectionReport, SanityCheckParams, ApprovalResult, Task } from './types.js';

/**
 * Main entry point for the HIL SDK.
 *
 * @example
 * ```ts
 * import { Human } from '@hil/sdk';
 *
 * const human = new Human({
 *   apiKey: process.env.HIL_API_KEY!,
 *   network: 'mainnet',
 *   payment: { walletAddress: '0x...' },
 * });
 *
 * // Verify identity
 * const v = await human.verify_identity({ lat: 35.7, lng: 51.4 });
 *
 * // Inspect property
 * const r = await human.inspect_property({ address: '123 Main St' });
 *
 * // Sanity check
 * const a = await human.sanity_check({ decision: { ... }, risk_level: 'high' });
 *
 * // Get task status
 * const t = await human.tasks.get('task_abc');
 * ```
 */
export class Human {
  private readonly client: HILClient;

  /** KYC Oracle — on-site identity verification. */
  readonly verify_identity: VerifyIdentity;

  /** Physical Audit — human property inspection. */
  readonly inspect_property: InspectProperty;

  /** Human Firewall — common-sense decision review. */
  readonly sanity_check: SanityCheck;

  /** Task management — poll, list, and cancel tasks. */
  readonly tasks: Tasks;

  constructor(config: HILConfig) {
    this.client = new HILClient(config);
    this.verify_identity = new VerifyIdentity(this.client);
    this.inspect_property = new InspectProperty(this.client);
    this.sanity_check = new SanityCheck(this.client);
    this.tasks = new Tasks(this.client);
  }
}
