/**
 * Growth FormAssist - Content Autofill Handler
 *
 * Handles autofill requests received by the webpage content script.
 */

import type {
  AutofillPageMessage,
  AutofillResponse,
} from '../messaging/messages';

import {
  autofillTemplate,
} from '../autofill/engine';

/**
 * Execute an autofill request against the current webpage.
 */
export async function handleAutofillRequest(
  message: AutofillPageMessage,
): Promise<AutofillResponse> {
  try {
    const response =
      autofillTemplate(
        message.template,
        document,
      );

    showAutofillStatus(
      buildAutofillStatus(response),
      'success',
    );

    return response;
  } catch (error) {
    const messageText =
      error instanceof Error
        ? error.message
        : 'Unable to autofill the page.';

    showAutofillStatus(
      messageText,
      'error',
    );

    return {
      success: false,
      error: messageText,
    };
  }
}

/**
 * Build the user-facing autofill status message.
 */
function buildAutofillStatus(
  response: Extract<
    AutofillResponse,
    { success: true }
  >,
): string {
  const filled =
    response.filledCount;

  const overwritten =
    response.overwrittenCount;

  const skipped =
    response.skippedFields.length;

  const unmatched =
    response.unmatchedFields.length;

  const parts: string[] = [
    `Autofill completed: ${filled} fields filled.`,
  ];

  if (overwritten > 0) {
    parts.push(
      `${overwritten} existing fields overwritten.`,
    );
  }

  if (skipped > 0) {
    parts.push(
      `${skipped} fields skipped.`,
    );
  }

  if (unmatched > 0) {
    parts.push(
      `${unmatched} fields could not be matched.`,
    );
  }

  return parts.join(' ');
}

/**
 * Display autofill status without interfering with the webpage.
 */
function showAutofillStatus(
  message: string,
  type: 'success' | 'error',
): void {
  const existing =
    document.getElementById(
      'formassist-autofill-status',
    );

  existing?.remove();

  const status =
    document.createElement('div');

  status.id =
    'formassist-autofill-status';

  status.textContent =
    message;

  status.setAttribute(
    'role',
    'status',
  );

  status.style.position =
    'fixed';

  status.style.top =
    '20px';

  status.style.right =
    '20px';

  status.style.zIndex =
    '2147483647';

  status.style.padding =
    '12px 16px';

  status.style.borderRadius =
    '6px';

  status.style.fontFamily =
    'Arial, sans-serif';

  status.style.fontSize =
    '14px';

  status.style.fontWeight =
    '600';

  status.style.maxWidth =
    '420px';

  status.style.boxShadow =
    '0 4px 16px rgba(0, 0, 0, 0.25)';

  status.style.background =
    type === 'success'
      ? '#198754'
      : '#dc3545';

  status.style.color =
    '#ffffff';

  document.body.appendChild(
    status,
  );

  window.setTimeout(() => {
    status.remove();
  }, 5000);
}

