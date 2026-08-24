/**
 * Growth FormAssist - Capture Storage
 *
 * Centralized storage operations for captured form templates.
 *
 * This module owns browser.local storage access so the background
 * service worker remains focused on extension communication.
 */

import type {
  CaptureResponse,
  CapturedFormTemplate,
} from './types';

/**
 * Storage key used for all locally captured form templates.
 */
export const CAPTURED_TEMPLATES_STORAGE_KEY =
  'formassist.capturedTemplates';

/**
 * Read all valid captured templates from extension storage.
 */
export async function getCapturedTemplates(): Promise<
  CapturedFormTemplate[]
> {
  const stored = await browser.storage.local.get(
    CAPTURED_TEMPLATES_STORAGE_KEY,
  );

  return readStoredTemplates(
    stored[CAPTURED_TEMPLATES_STORAGE_KEY],
  );
}

/**
 * Persist a VA-approved captured template.
 */
export async function saveCapturedTemplate(
  template: CapturedFormTemplate,
): Promise<CaptureResponse> {
  try {
    const templates = await getCapturedTemplates();

    /**
     * Replace an existing capture with the same ID or append
     * the newly captured template.
     */
    const existingIndex = templates.findIndex(
      (item) => item.id === template.id,
    );

    if (existingIndex >= 0) {
      templates[existingIndex] = template;
    } else {
      templates.push(template);
    }

    await browser.storage.local.set({
      [CAPTURED_TEMPLATES_STORAGE_KEY]: templates,
    });

    return {
      success: true,
      templateId: template.id,
      fieldCount: template.fields.length,
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
 * Delete one captured template by its stable ID.
 */
export async function deleteCapturedTemplate(
  templateId: string,
): Promise<boolean> {
  try {
    const templates = await getCapturedTemplates();

    const filteredTemplates = templates.filter(
      (template) => template.id !== templateId,
    );

    if (filteredTemplates.length === templates.length) {
      return false;
    }

    await browser.storage.local.set({
      [CAPTURED_TEMPLATES_STORAGE_KEY]: filteredTemplates,
    });

    return true;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(
        '[Growth FormAssist] Unable to delete captured template:',
        error,
      );
    }

    return false;
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

  return value.filter(isCapturedFormTemplate);
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
    typeof candidate.id === 'string' &&
    typeof candidate.capturedAt === 'string' &&
    typeof candidate.page === 'object' &&
    candidate.page !== null &&
    Array.isArray(candidate.fields)
  );
}
