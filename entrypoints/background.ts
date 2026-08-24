/**
 * Growth FormAssist - Background Service Worker
 *
 * The background service worker coordinates communication between
 * extension pages and browser tabs.
 *
 * Responsibilities:
 * - Forward scan requests to the active tab.
 * - Forward autofill requests to the active tab.
 * - Persist explicitly captured form templates.
 * - Keep webpage DOM access inside the content script.
 */

import type {
  AutofillActiveTabMessage,
  AutofillResponse,
  CapturePageMessage,
  CapturePageResponse,
  ScanActiveTabMessage,
  ScanResponse,
} from '../src/messaging/messages';

import type {
  CapturedFormTemplate,
} from '../src/capture/types';

/**
 * Storage key used for all locally captured form templates.
 */
const CAPTURED_TEMPLATES_STORAGE_KEY =
  'formassist.capturedTemplates';

/**
 * Register the FormAssist background service worker.
 */
export default defineBackground(() => {
  /**
   * Handle requests from extension pages and content scripts.
   */
  browser.runtime.onMessage.addListener(
    async (
      message:
        | ScanActiveTabMessage
        | CapturePageMessage
        | AutofillActiveTabMessage,
    ) => {
      if (
        message.type ===
        'FORMASSIST_SCAN_ACTIVE_TAB'
      ) {
        return scanActiveTab();
      }

      if (
        message.type ===
        'FORMASSIST_CAPTURE_PAGE'
      ) {
        return saveCapturedTemplate(
          message.template,
        );
      }

      if (
        message.type ===
        'FORMASSIST_AUTOFILL_ACTIVE_TAB'
      ) {
        return autofillActiveTab(
          message,
        );
      }

      return undefined;
    },
  );
});

/**
 * Ask the active browser tab to perform a fresh read-only field scan.
 */
async function scanActiveTab():
  Promise<ScanResponse> {
  const tabs =
    await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

  const activeTab =
    tabs[0];

  if (!activeTab?.id) {
    return {
      success: false,
      error:
        'No active browser tab was found.',
    };
  }

  try {
    return await browser.tabs.sendMessage(
      activeTab.id,
      {
        type:
          'FORMASSIST_SCAN_PAGE',
      },
    );
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(
        '[Growth FormAssist] Unable to contact content script:',
        error,
      );
    }

    return {
      success: false,
      error:
        'FormAssist could not access this page. Reload the page and try again. Browser-protected pages such as chrome:// pages cannot be scanned.',
    };
  }
}

/**
 * Send a saved capture to the active tab for explicit autofill.
 */
async function autofillActiveTab(
  message:
    AutofillActiveTabMessage,
): Promise<AutofillResponse> {
  const tabs =
    await browser.tabs.query({
      active: true,
      currentWindow: true,
    });

  const activeTab =
    tabs[0];

  if (!activeTab?.id) {
    return {
      success: false,
      error:
        'No active browser tab was found.',
    };
  }

  try {
    const stored =
      await browser.storage.local.get(
        CAPTURED_TEMPLATES_STORAGE_KEY,
      );

    const templates =
      readStoredTemplates(
        stored[
          CAPTURED_TEMPLATES_STORAGE_KEY
        ],
      );

    const template =
      templates.find(
        (item) =>
          item.id ===
          message.templateId,
      );

    if (!template) {
      return {
        success: false,
        error:
          'The selected saved form could not be found.',
      };
    }

    return await browser.tabs.sendMessage(
      activeTab.id,
      {
        type:
          'FORMASSIST_AUTOFILL_PAGE',
        template,
      },
    );
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(
        '[Growth FormAssist] Autofill failed:',
        error,
      );
    }

    return {
      success: false,
      error:
        'FormAssist could not access the current page. Reload the page and try again.',
    };
  }
}

/**
 * Persist a VA-approved captured template in local extension storage.
 */
async function saveCapturedTemplate(
  template: CapturedFormTemplate,
): Promise<CapturePageResponse> {
  try {
    const stored =
      await browser.storage.local.get(
        CAPTURED_TEMPLATES_STORAGE_KEY,
      );

    const templates =
      readStoredTemplates(
        stored[
          CAPTURED_TEMPLATES_STORAGE_KEY
        ],
      );

    /**
     * Replace an existing capture with the same ID or append
     * the newly captured template.
     */
    const existingIndex =
      templates.findIndex(
        (item) =>
          item.id ===
          template.id,
      );

    if (existingIndex >= 0) {
      templates[existingIndex] =
        template;
    } else {
      templates.push(template);
    }

    await browser.storage.local.set({
      [CAPTURED_TEMPLATES_STORAGE_KEY]:
        templates,
    });

    return {
      success: true,
      templateId:
        template.id,
      fieldCount:
        template.fields.length,
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(
        '[Growth FormAssist] Unable to save captured template:',
        error,
      );
    }

    return {
      success: false,
      error:
        'FormAssist could not save the captured form to local storage.',
    };
  }
}

/**
 * Validate the value retrieved from browser storage.
 */
function readStoredTemplates(
  value: unknown,
): CapturedFormTemplate[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    isCapturedFormTemplate,
  );
}

/**
 * Perform lightweight runtime validation of a stored capture.
 */
function isCapturedFormTemplate(
  value: unknown,
): value is CapturedFormTemplate {
  if (
    typeof value !== 'object' ||
    value === null
  ) {
    return false;
  }

  const candidate =
    value as Partial<CapturedFormTemplate>;

  return (
    typeof candidate.id ===
      'string' &&
    typeof candidate.capturedAt ===
      'string' &&
    typeof candidate.page ===
      'object' &&
    candidate.page !== null &&
    Array.isArray(
      candidate.fields,
    )
  );
}
