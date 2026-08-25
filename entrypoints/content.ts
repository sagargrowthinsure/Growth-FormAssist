/**
 * Growth FormAssist - Content Script
 *
 * The content script is the bridge between FormAssist and the webpage
 * currently open in the VA's browser.
 *
 * Responsibilities:
 * - Detect supported form controls.
 * - Display the floating FormAssist UI.
 * - Perform explicit Alt+Click capture actions.
 * - Collect page identity and field values after user approval.
 * - Send captured templates to the background service worker.
 * - Execute explicitly requested autofill operations.
 *
 * The content script never captures data silently.
 */

import {
  createCarrierFieldMap,
} from '../src/carrier-mapping';

import {
  discoverCarrierPage,
} from '../src/carrier-detection/carrier-discovery';

import {
  mountFormAssistFloatingUi,
} from '../src/content/formassist-floating-ui';

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

const CAPTURE_RESPONSE_TIMEOUT_MS = 10000;

/**
 * Register the FormAssist content script.
 */
export default defineContentScript({
  matches: ['*://*/*'],

  main() {
    /**
     * Mount the primary FormAssist UI directly inside the webpage.
     *
     * This is important for carrier applications such as Travelers
     * that open their quote workflow in a separate browser window
     * where the extension toolbar is not visible.
     */
    mountFormAssistFloatingUi(
      document,
      {
        onScan:
          handleFloatingUiScan,
      },
    );

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
 * Scan the current carrier page and build the in-memory
 * centralized carrier field map.
 *
 * Important:
 * - This does NOT save customer/quote values.
 * - This does NOT modify the carrier page.
 * - This does NOT persist anything yet.
 *
 * It creates the shared structural definition of the carrier page.
 */
function handleFloatingUiScan():
  {
    carrierName: string;
    fieldCount: number;
    fields: Array<{
      index: number;
      label: string;
      fieldType: string;
      value: string;
      checked: boolean | null;
      id: string;
      name: string;
      required: boolean;
      disabled: boolean;
      readonly: boolean;
      options: number;
      carrierLabel: string;
      coverageCode: string;
    }>;
  } {
  const fields =
    detectFields(document);

  const discovery =
    discoverCarrierPage(
      document,
      fields,
    );

  const pageUrl =
    new URL(
      window.location.href,
    );

  /**
   * The hash is important for carrier applications such as
   * Travelers because different quote sections are represented
   * by routes such as:
   *
   * #/home/homeCoverage
   *
   * #/home/homeResidence
   *
   * etc.
   */
  const pageKey =
    [
      pageUrl.pathname,
      pageUrl.hash,
    ]
      .join('')
      .replace(/^\/+/, '')
      .replace(/^#+/, '')
      .replace(/[^a-zA-Z0-9/_-]+/g, '-');

  const carrierPage = {
    carrierId:
      normalizeCarrierId(
        discovery.page.carrierName,
      ),

    carrierName:
      discovery.page.carrierName,

    pageKey:
      pageKey ||
      'unknown-page',

    pageTitle:
      document.title.trim(),

    origin:
      pageUrl.origin,

    pathname:
      pageUrl.pathname,
  };

  const carrierMetadata =
    fields.map(
      (_field, index) =>
        discovery
          .fieldMetadata[index] ?? {
          dataLabel: null,
          dataCoverageCode: null,
        },
    );

  const carrierFieldMap =
    createCarrierFieldMap(
      carrierPage,
      fields,
      carrierMetadata,
    );

  if (import.meta.env.DEV) {
    console.info(
      '[Growth FormAssist] Carrier field map created:',
      carrierFieldMap,
    );

    console.info(
      '[Growth FormAssist] Carrier page:',
      carrierFieldMap.page,
    );

    console.info(
      '[Growth FormAssist] Carrier fields:',
      carrierFieldMap.fields.length,
    );

    console.info(
      '[Growth FormAssist] Unmapped fields:',
      carrierFieldMap.fields.filter(
        (field) =>
          field.mappingStatus ===
          'unmapped',
      ).length,
    );

    console.table(
      carrierFieldMap.fields.map(
        (field) => ({
          id:
            field.id,

          kind:
            field.kind,

          label:
            field.carrierLabel ||
            field.fingerprint.label ||
            '',

          coverageCode:
            field.coverageCode ||
            '',

          type:
            field.fieldType,

          mapping:
            field.mappingStatus,

          canonical:
            field.canonicalField ||
            '',

          domId:
            field.fingerprint.id ||
            '',

          name:
            field.fingerprint.name ||
            '',
        }),
      ),
    );
  }

  return {
    carrierName:
      carrierFieldMap.page.carrierName,

    fieldCount:
      carrierFieldMap.fields.length,

    fields:
      carrierFieldMap.fields.map(
        (field) => ({
          index:
            field.scanIndex,

          label:
            field.carrierLabel ||
            field.fingerprint.label ||
            field.fingerprint.ariaLabel ||
            field.fingerprint.name ||
            field.fingerprint.id ||
            '',

          fieldType:
            field.fieldType,

          /**
           * These are displayed only for diagnostics.
           *
           * They are NOT stored in CarrierFieldMap.
           */
          value:
            fields[field.scanIndex]?.value ??
            '',

          checked:
            fields[field.scanIndex]?.checked ??
            null,

          id:
            field.fingerprint.id ||
            '',

          name:
            field.fingerprint.name ||
            '',

          required:
            field.required,

          disabled:
            field.disabled,

          readonly:
            field.readonly,

          options:
            field.options.length,

          carrierLabel:
            field.carrierLabel ||
            '',

          coverageCode:
            field.coverageCode ||
            '',
        }),
      ),
  };
}

/**
 * Normalize the carrier name into a stable internal identifier.
 *
 * Example:
 *
 * Travelers
 *   ↓
 * travelers
 */
function normalizeCarrierId(
  carrierName: string,
): string {
  return carrierName
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      '-',
    )
    .replace(
      /^-+|-+$/g,
      '');
}

/**
 * Handle an Alt+Click performed by the VA.
 */
function handleCaptureClick(
  event: MouseEvent,
): void {
  if (!event.altKey) {
    return;
  }

  const target =
    event.target;

  if (
    !(target instanceof HTMLElement)
  ) {
    return;
  }

  const field =
    findSupportedField(
      target,
    );

  if (!field) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  void requestCapture(
    field,
  );
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

  if (
    target.matches(selector)
  ) {
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
    id:
      createCaptureId(),

    capturedAt:
      new Date().toISOString(),

    page: {
      url:
        pageUrl,

      origin:
        parsedUrl.origin,

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
    .map(
      (value) =>
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

  const discovery =
    discoverCarrierPage(
      document,
      fields,
    );

  if (import.meta.env.DEV) {
    console.info(
      '[Growth FormAssist] Page discovery:',
      discovery.page,
    );

    console.info(
      '[Growth FormAssist] Detected form controls:',
      fields.length,
    );

    console.table(
      fields.map(
        (field, index) => ({
          index:
            field.index,

          type:
            field.fieldType,

          tag:
            field.fingerprint.tagName,

          label:
            field.fingerprint.label ||
            '',

          dataLabel:
            discovery
              .fieldMetadata[index]
              ?.dataLabel ||
            '',

          coverageCode:
            discovery
              .fieldMetadata[index]
              ?.dataCoverageCode ||
            '',

          id:
            field.fingerprint.id ||
            '',

          name:
            field.fingerprint.name ||
            '',

          required:
            field.required,

          disabled:
            field.disabled,

          readonly:
            field.readonly,

          options:
            field.options.length,
        }),
      ),
    );
  }

  return {
    success: true,

    page:
      discovery.page,

    fieldCount:
      fields.length,

    fields:
      fields.map(
        (field, index) => ({
          index:
            field.index,

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

          carrierMetadata:
            discovery
              .fieldMetadata[index] ?? {
              dataLabel: null,
              dataCoverageCode: null,
            },

          required:
            field.required,

          disabled:
            field.disabled,

          readonly:
            field.readonly,

          options:
            field.options.length,
        }),
      ),
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
 * Convert unexpected capture failures into a useful message.
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

  status.textContent =
    message;

  status.style.position =
    'fixed';

  status.style.top =
    '20px';

  status.style.right =
    '20px';

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

  status.style.fontSize =
    '14px';

  status.style.fontWeight =
    '600';

  status.style.lineHeight =
    '1.4';

  status.style.color =
    '#111827';

  document.documentElement
    .appendChild(status);

  if (
    state !== 'working'
  ) {
    window.setTimeout(
      () => {
        status.remove();
      },
      3500,
    );
  }
}

