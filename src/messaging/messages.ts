/**
 * Growth FormAssist - Messaging Contracts
 *
 * Shared message contracts between popup, background service worker,
 * and content scripts.
 */

import type {
  CaptureResponse,
  CapturedFormTemplate,
} from '../capture/types';

/**
 * Request the background service worker to scan the active tab.
 */
export interface ScanActiveTabMessage {
  type: 'FORMASSIST_SCAN_ACTIVE_TAB';
}

/**
 * Request a content script to scan its current webpage.
 */
export interface ScanPageMessage {
  type: 'FORMASSIST_SCAN_PAGE';
}

/**
 * Request saving an explicitly approved page capture.
 */
export interface CapturePageMessage {
  type: 'FORMASSIST_CAPTURE_PAGE';
  template: CapturedFormTemplate;
}

/**
 * Request all saved captures.
 */
export interface GetCapturedTemplatesMessage {
  type: 'FORMASSIST_GET_CAPTURED_TEMPLATES';
}

/**
 * Request deletion of one saved capture.
 */
export interface DeleteCapturedTemplateMessage {
  type: 'FORMASSIST_DELETE_CAPTURED_TEMPLATE';
  templateId: string;
}

/**
 * Request autofill of the active tab.
 */
export interface AutofillActiveTabMessage {
  type: 'FORMASSIST_AUTOFILL_ACTIVE_TAB';
  templateId: string;
}

/**
 * Request the content script to perform autofill.
 */
export interface AutofillPageMessage {
  type: 'FORMASSIST_AUTOFILL_PAGE';
  template: CapturedFormTemplate;
}

/**
 * Lightweight field information returned by a page scan.
 *
 * This intentionally contains field identity and structural
 * information only. Field values are never returned by the scan.
 *
 * Carrier-specific metadata is optional because different carriers
 * expose different DOM attributes.
 */
export interface ScanFieldSummary {
  index: number;
  fieldType: string;

  fingerprint: {
    label: string | null;
    id: string | null;
    name: string | null;
  };

  carrierMetadata: {
    dataLabel: string | null;
    dataCoverageCode: string | null;
  };

  required: boolean;
  disabled: boolean;
  readonly: boolean;
  options: number;
}

/**
 * Page identity returned by a scan.
 *
 * This allows the centralized field-map system to distinguish
 * one carrier/page from another without storing user-entered data.
 */
export interface ScanPageIdentity {
  carrier:
    | 'travelers'
    | 'unknown';

  carrierName: string;
  hostname: string;
  origin: string;
  pathname: string;
  hash: string;
  title: string;
}

/**
 * Successful scan response.
 */
export interface ScanSuccessResponse {
  success: true;

  page: ScanPageIdentity;

  fieldCount: number;

  fields: ScanFieldSummary[];
}

/**
 * Failed scan response.
 */
export interface ScanErrorResponse {
  success: false;
  error: string;
}

/**
 * Complete scan response.
 */
export type ScanResponse =
  | ScanSuccessResponse
  | ScanErrorResponse;

/**
 * Capture response exposed through the messaging layer.
 */
export type CapturePageResponse = CaptureResponse;

/**
 * Successful saved-captures response.
 */
export interface CapturedTemplatesSuccessResponse {
  success: true;
  templates: CapturedFormTemplate[];
}

/**
 * Failed saved-captures response.
 */
export interface CapturedTemplatesErrorResponse {
  success: false;
  error: string;
}

/**
 * Complete saved-captures response.
 */
export type CapturedTemplatesResponse =
  | CapturedTemplatesSuccessResponse
  | CapturedTemplatesErrorResponse;

/**
 * Successful delete response.
 */
export interface DeleteCapturedTemplateSuccessResponse {
  success: true;
  templateId: string;
}

/**
 * Failed delete response.
 */
export interface DeleteCapturedTemplateErrorResponse {
  success: false;
  error: string;
}

/**
 * Complete delete response.
 */
export type DeleteCapturedTemplateResponse =
  | DeleteCapturedTemplateSuccessResponse
  | DeleteCapturedTemplateErrorResponse;

/**
 * Keep this reference used by the messaging layer.
 *
 * The actual shape remains owned by src/autofill/types.ts.
 */
export type {
  AutofillResponse,
} from '../autofill/types';

