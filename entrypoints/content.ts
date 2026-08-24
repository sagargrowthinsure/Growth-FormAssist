/**
 * Growth FormAssist - Content Script
 *
 * The content script is the bridge between FormAssist and the webpage
 * currently open in the VA's browser.
 *
 * Responsibilities:
 * - Detect supported form controls.
 * - Perform explicit Alt+Click capture actions.
 * - Collect page identity and field values after user approval.
 * - Send captured templates to the background service worker.
 * - Execute explicitly requested autofill operations.
 *
 * The content script never captures data silently.
 */

import type {
  AutofillPageMessage,
  CapturePageMessage,
  CapturePageResponse,
  ScanPageMessage,
} from '../src/messaging/messages';

import {
  detectFields,
} from '../src/form-detection/field-detector';

import {
  autofillTemplate,
} from '../src/autofill/engine';

import type {
  CapturedFormTemplate,
} from '../src/capture/types';

/**
 * Maximum time FormAssist will wait for the background service worker
 * to respond to a capture request.
 */
const CAPTURE_RESPONSE_TIMEOUT_MS = 10000;

/**
 * Register the FormAssist content script.
 */
export default defineContentScript({
  /**
   * FormAssist operates on normal HTTP and HTTPS webpages.
   *
   * Capture, scanning, and autofill are always explicitly initiated
   * by the VA.
   */
  matches: ['*://*/*'],

  main() {
    /**
     * Register the explicit Alt+Click capture gesture.
     */
    document.addEventListener(
      'click',
      handleCaptureClick,
      true,
    );

    /**
     * Register requests from the background service worker.
     */
    browser.runtime.onMessage.addListener(
      handleContentMessage,
    );
  },
});

/**
 * Handle an Alt+Click performed by the VA.
 */
function handleCaptureClick(
  event: MouseEvent,
): void {
  if (!event.altKey) {
    return;
  }

  const target = event.target;

  if (!(target instanceof HTMLElement)) {
    return;
  }

  /**
   * Only activate capture when the VA Alt+Clicks an actual
   * supported form control or an element belonging to one.
   */
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
 * Find the supported form control associated with the clicked element.
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
 * Ask the VA to confirm that the current page should be captured.
 */
async function requestCapture(
  clickedField: HTMLElement,
): Promise<void> {
  const fieldLabel =
    clickedField.getAttribute(
      'aria-label',
    ) ||
    clickedField.getAttribute(
      'name',
    ) ||
    clickedField.getAttribute(
      'id',
    ) ||
    clickedField.tagName.toLowerCase();

  const confirmed =
    window.confirm(
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
 * Send a captured template to the background service worker.
 */
async function sendCaptureMessage(
  template: CapturedFormTemplate,
): Promise<CapturePageResponse> {
  const message:
    CapturePageMessage = {
    type:
      'FORMASSIST_CAPTURE_PAGE',
    template,
  };

  const timeoutPromise =
    new Promise<never>(
      (_, reject) => {
        window.setTimeout(
          () => {
            reject(
              new Error(
                'The FormAssist background service did not respond within 10 seconds.',
              ),
            );
          },
          CAPTURE_RESPONSE_TIMEOUT_MS,
        );
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
    typeof response.success !==
      'boolean'
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
      hostname:
        parsedUrl.hostname,
      pathname:
        parsedUrl.pathname,
      title:
        document.title.trim(),
    },

    fields,
  };
}

/**
 * Generate a unique capture identifier.
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

  return [
    randomValues[0]!,
    randomValues[1]!,
    randomValues[2]!,
    randomValues[3]!,
  ]
    .map((value) =>
      value.toString(16),
    )
    .join('-');
}

/**
 * Handle requests sent from the background service worker.
 */
function handleContentMessage(
  message:
    | ScanPageMessage
    | AutofillPageMessage,
): unknown {
  if (
    message?.type ===
    'FORMASSIST_SCAN_PAGE'
  ) {
    return handleScanRequest();
  }

  if (
    message?.type ===
    'FORMASSIST_AUTOFILL_PAGE'
  ) {
    return handleAutofillRequest(
      message,
    );
  }

  return undefined;
}

/**
 * Perform a fresh read-only field scan.
 */
function handleScanRequest(): unknown {
  const fields =
    detectFields(document);

  return {
    success: true,
    fieldCount: fields.length,

    fields:
      fields.map((field) => ({
        index: field.index,
        fieldType:
          field.fieldType,

        fingerprint: {
          label:
            field.fingerprint.label,
          id:
            field.fingerprint.id,
          name:
            field.fingerprint.name,
        },

        required:
          field.required,
        disabled:
          field.disabled,
        readonly:
          field.readonly,
        options:
          field.options.length,
      })),
  };
}

/**
 * Apply the selected saved template to the current webpage.
 */
function handleAutofillRequest(
  message: AutofillPageMessage,
): {
  success: true;
  matchedFields: number;
  skippedFields: number;
} {
  const result =
    autofillTemplate(
      message.template,
      document,
    );

  /**
   * Give the webpage a short visual indication that the operation
   * completed. This is intentionally separate from popup UI.
   */
  showCaptureStatus(
    `Autofill completed: ${result.filledCount} fields filled.`,
    'success',
  );

  return {
    success: true,
    matchedFields:
      result.filledCount +
      result.overwrittenCount,
    skippedFields:
      result.skippedCount +
      result.unmatchedCount,
  };
}

/**
 * Convert unexpected capture failures into a useful message for
 * the VA without exposing technical implementation details.
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

  return (
    'FormAssist could not save this page.'
  );
}

/**
 * Display a temporary status message directly on the webpage.
 */
function showCaptureStatus(
  message: string,
  state:
    | 'working'
    | 'success'
    | 'error',
): void {
  const existing =
    document.querySelector(
      '[data-formassist-capture-status]',
    );

  existing?.remove();

  const status =
    document.createElement('div');

  status.dataset
    .formassistCaptureStatus =
    'true';

  status.className =
    `formassist-capture-status formassist-${state}`;

  status.textContent = message;

  /**
   * Keep the notification above the webpage's normal content and
   * independent from the site's existing stylesheet.
   */
  status.style.position =
    'fixed';

  status.style.top = '20px';
  status.style.right = '20px';
  status.style.zIndex =
    '2147483647';

  status.style.maxWidth =
    '420px';

  status.style.padding =
    '14px 18px';

  status.style.borderRadius =
    '8px';

  status.style.background =
    '#ffffff';

  status.style.border =
    '1px solid #d1d5db';

  status.style.boxShadow =
    '0 4px 16px rgba(0, 0, 0, 0.18)';

  status.style.fontFamily =
    'Arial, Helvetica, sans-serif';

  status.style.fontSize = '14px';
  status.style.fontWeight = '600';
  status.style.lineHeight = '1.4';
  status.style.color = '#111827';

  document.documentElement
    .appendChild(status);

  if (state !== 'working') {
    window.setTimeout(() => {
      status.remove();
    }, 3500);
  }
}

