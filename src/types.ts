/**
 * Human Infrastructure Layer — Type Definitions
 * @module @hil/sdk/types
 */

// ─── Common ───────────────────────────────────────────────

export type Network = 'testnet' | 'mainnet';

export type Urgency = 'standard' | 'urgent';

export type RiskLevel = 'low' | 'medium' | 'high';

export type PropertyCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

export type InspectorLevel = 'standard' | 'senior' | 'expert';

export type WebhookEvent =
  | 'task.created'
  | 'task.accepted'
  | 'task.completed'
  | 'task.failed'
  | 'payment.settled';

export interface GPSCoordinates {
  lat: number;
  lng: number;
}

export interface Evidence {
  photos: string[];
  gps_coordinates: GPSCoordinates;
  timestamp: string;
}

export interface HILConfig {
  apiKey: string;
  network?: Network;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
  payment?: {
    walletAddress?: string;
  };
}

// ─── Verify Identity ───────────────────────────────────────

export interface VerifyIdentityParams {
  lat: number;
  lng: number;
  document_type?: 'national_id' | 'passport' | 'drivers_license';
  urgency?: Urgency;
  language?: string;
}

export interface VerificationResult {
  verified: boolean;
  trust_score: number;
  operator_id: string;
  evidence: Evidence;
  task_id: string;
  completed_at: string;
}

// ─── Inspect Property ──────────────────────────────────────

export interface InspectPropertyParams {
  address: string;
  checklist?: string[];
  photo_required?: boolean;
  video_required?: boolean;
  inspector_level?: InspectorLevel;
}

export interface InspectionReport {
  condition: PropertyCondition;
  score: number;
  findings: string[];
  photos: string[];
  videos?: string[];
  inspector_id: string;
  inspector_certifications: string[];
  task_id: string;
}

// ─── Sanity Check ──────────────────────────────────────────

export interface SanityCheckParams {
  decision: Record<string, unknown>;
  context?: string;
  risk_level: RiskLevel;
  max_wait_seconds?: number;
}

export interface ApprovalResult {
  approved: boolean;
  notes: string;
  reviewer_id: string;
  confidence: number;
  turnaround_ms: number;
}

// ─── Task Status ───────────────────────────────────────────

export type TaskStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'failed' | 'expired';

export interface Task {
  id: string;
  type: 'verify_identity' | 'inspect_property' | 'sanity_check';
  status: TaskStatus;
  created_at: string;
  updated_at: string;
  result?: VerificationResult | InspectionReport | ApprovalResult;
  operator_id?: string;
  error?: string;
}

// ─── Webhooks ──────────────────────────────────────────────

export interface WebhookPayload<T = unknown> {
  id: string;
  event: WebhookEvent;
  data: T;
  timestamp: string;
}

export interface TaskWebhookData {
  task_id: string;
  operator_id?: string;
  status: TaskStatus;
  reason?: string;
  result?: VerificationResult | InspectionReport | ApprovalResult;
}

export interface PaymentWebhookData {
  task_id: string;
  operator_id: string;
  amount_usdc: string;
  tx_hash: string;
}

// ─── Operator ──────────────────────────────────────────────

export interface Operator {
  id: string;
  trust_score: number;
  location: GPSCoordinates;
  skills: string[];
  total_tasks: number;
  success_rate: number;
  certifications: string[];
  languages: string[];
}
