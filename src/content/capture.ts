/**
 * Growth FormAssist - Capture Handler
 *
 * Handles the explicit Alt+Click capture workflow.
 *
 * No webpage information is captured until the VA confirms
 * the capture request.
 */

import type {
  CapturePageMessage,
  CapturePageResponse,
} from '../messaging/messages';

import {
  detectFields,
} from '../form-detection/field-detector';

import type {
  CapturedFormTemplate,
} from '../capture/types';

import {
  showCaptureStatus,
} from './page-status';

/**
 * Maximum time FormAssist waits for capture persistence.
 */
const CAPTURE_RESPONSE_TIMEOUT_MS = 10000;

/**
 * Handle an Alt+Click performed by the VA.
 */
export function handleCaptureClick(
  event: MouseEvent,
): void {
  if (!event.altKey) {
    return;
  }

  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  const field =
    findSupportedField(target);

  if (!field) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  void requestCapture(field);
}

/**
 * Find the supported control associated with the click.
 */
function findSupportedField(
  target: HTMLElement,
): HTMLElement | null {
  const selector = [
    'input',
    'select',
    'textarea',
    'button',
    '[contenteditable="true"]',
    '[role="textbox"]',
    '[role="combobox"]',
    '[role="listbox"]',
    '[role="checkbox"]',
    '[role="radio"]',
    '[role="switch"]',
    '[role="button"]',
  ].join(',');

  if (target.matches(selector)) {
    return target;
  }

  return target.closest<HTMLElement>(
    selector,
  );
}

/**
 * Ask the VA to confirm page capture.
 */
async function requestCapture(
  clickedField: HTMLElement,
): Promise<void> {
  const fieldLabel =
    clickedField.getAttribute(
      'aria-label',
    ) ||
    clickedField.getAttribute('name') ||
    clickedField.getAttribute('id') ||
    clickedField.tagName.toLowerCase();

  const confirmed = window.confirm(
    `Save this page for FormAssist?\n\n` +
      `Selected field: ${fieldLabel}\n\n` +
      `FormAssist will save the page structure and current ` +
      `values of the detected fields.`,
  );

  if (!confirmed) {
    return;
  }

  showCaptureStatus(
    'Capturing form...',
    'working',
  );

  try {
    const template =
      createCapturedTemplate();

    const response =
      await sendCaptureMessage(
        template,
      );

    if (!response.success) {
      showCaptureStatus(
        response.error,
        'error',
      );

      return;
    }

    showCaptureStatus(
      `Form saved successfully (${response.fieldCount} fields).`,
      'success',
    );
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(
        '[Growth FormAssist] Capture failed:',
        error,
      );
    }

    showCaptureStatus(
      getCaptureErrorMessage(error),
      'error',
    );
  }
}

/**
 * Send the captured template to the background service worker.
 */
async function sendCaptureMessage(
  template: CapturedFormTemplate,
): Promise<CapturePageResponse> {
  const message: CapturePageMessage = {
    type: 'FORMASSIST_CAPTURE_PAGE',
    template,
  };

  const timeoutPromise =
    new Promise<never>(
      (_, reject) => {
        window.setTimeout(() => {
          reject(
            new Error(
              'The FormAssist background service did not respond within 10 seconds.',
            ),
          );
        }, CAPTURE_RESPONSE_TIMEOUT_MS);
      },
    );

  const response =
    await Promise.race([
      browser.runtime.sendMessage(
        message,
      ) as Promise<CapturePageResponse>,
      timeoutPromise,
    ]);

  if (
    !response ||
    typeof response !== 'object' ||
    typeof response.success !== 'boolean'
  ) {
    throw new Error(
      'FormAssist received an invalid response from the background service.',
    );
  }

  return response;
}

/**
 * Build the complete captured template from the current webpage.
 */
function createCapturedTemplate():
  CapturedFormTemplate {
  const fields =
    detectFields(document);

  const pageUrl =
    window.location.href;

  const parsedUrl =
    new URL(pageUrl);

  return {
    id: createCaptureId(),
    capturedAt:
      new Date().toISOString(),

    page: {
      url: pageUrl,
      origin: parsedUrl.origin,
      hostname: parsedUrl.hostname,
      pathname: parsedUrl.pathname,
      title: document.title.trim(),
    },

    fields,
  };
}

/**
 * Generate a capture identifier.
 */
function createCaptureId(): string {
  if (
    typeof crypto.randomUUID ===
    'function'
  ) {
    return crypto.randomUUID();
  }

  const randomValues =
    new Uint32Array(4);

  crypto.getRandomValues(
    randomValues,
  );

  return Array.from(
    randomValues,
    (value) =>
      value.toString(16),
  ).join('-');
}

/**
 * Convert capture failures into VA-friendly messages.
 */
function getCaptureErrorMessage(
  error: unknown,
): string {
  if (
    error instanceof Error &&
    error.message.includes(
      'did not respond',
    )
  ) {
    return (
      'FormAssist could not contact its background service. ' +
      'Please reload the extension and try again.'
    );
  }

  if (
    error instanceof Error &&
    error.message.includes(
      'invalid response',
    )
  ) {
    return (
      'FormAssist received an unexpected response. ' +
      'Please reload the extension and try again.'
    );
  }

  return 'FormAssist could not save this page.';
}
