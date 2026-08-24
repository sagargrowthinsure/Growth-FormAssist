/**
 * Growth FormAssist - Capture Types
 *
 * Contracts used when a VA explicitly captures a webpage form.
 *
 * Capture data is intentionally separate from scan-result data because
 * scanning is read-only and does not expose field values, while capture
 * is an explicit user-approved operation.
 */

import type { DetectedField } from '../form-detection/types';

/**
 * Complete captured representation of one webpage.
 */
export interface CapturedFormTemplate {
  id: string;
  capturedAt: string;
  page: CapturedPageIdentity;
  fields: DetectedField[];
}

/**
 * Information used to recognize the webpage later.
 */
export interface CapturedPageIdentity {
  url: string;
  origin: string;
  hostname: string;
  pathname: string;
  title: string;
}

/**
 * Result returned after an explicit capture request.
 */
export interface CaptureSuccessResponse {
  success: true;
  templateId: string;
  fieldCount: number;
}

/**
 * Error returned when a capture cannot be completed.
 */
export interface CaptureErrorResponse {
  success: false;
  error: string;
}

/**
 * Complete capture response contract.
 */
export type CaptureResponse =
  | CaptureSuccessResponse
  | CaptureErrorResponse;

  