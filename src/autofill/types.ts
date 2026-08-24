/**
 * Growth FormAssist - Autofill Contracts
 *
 * Contracts used by the popup and webpage content script during
 * an explicit saved-form autofill operation.
 */

import type { CapturedFormTemplate } from '../capture/types';

/**
 * Message sent from the popup to the webpage content script.
 */
export interface AutofillPageMessage {
  type: 'FORMASSIST_AUTOFILL_PAGE';
  template: CapturedFormTemplate;
}

/**
 * Successful autofill response.
 */
export interface AutofillSuccessResponse {
  success: true;
  filledCount: number;
  unchangedCount: number;
  skippedCount: number;
  unmatchedCount: number;
  overwrittenCount: number;
  skippedFields: string[];
  unmatchedFields: string[];
}

/**
 * Failed autofill response.
 */
export interface AutofillErrorResponse {
  success: false;
  error: string;
}

/**
 * Complete autofill response contract.
 */
export type AutofillResponse =
  | AutofillSuccessResponse
  | AutofillErrorResponse;

  