/**
 * Growth FormAssist - Content Scan Handler
 *
 * Performs the read-only field scan requested by the background
 * service worker.
 */

import {
  detectFields,
} from '../form-detection/field-detector';

import type {
  ScanPageMessage,
  ScanResponse,
} from '../messaging/messages';

/**
 * Handle one explicit scan request.
 */
export function handleScanMessage(
  message: ScanPageMessage,
): ScanResponse | undefined {
  if (
    message.type !==
    'FORMASSIST_SCAN_PAGE'
  ) {
    return undefined;
  }

  const fields =
    detectFields(document);

  if (import.meta.env.DEV) {
    console.info(
      '[Growth FormAssist] Detected form controls:',
      fields.length,
    );

    console.table(
      fields.map((field) => ({
        index: field.index,
        type: field.fieldType,
        tag: field.fingerprint.tagName,
        label:
          field.fingerprint.label || '',
        id:
          field.fingerprint.id || '',
        name:
          field.fingerprint.name || '',
        required: field.required,
        disabled: field.disabled,
        readonly: field.readonly,
        options: field.options.length,
      })),
    );
  }

  return {
    success: true,
    fieldCount: fields.length,
    fields: fields.map((field) => ({
      index: field.index,
      fieldType: field.fieldType,
      fingerprint: {
        label: field.fingerprint.label,
        id: field.fingerprint.id,
        name: field.fingerprint.name,
      },
      required: field.required,
      disabled: field.disabled,
      readonly: field.readonly,
      options: field.options.length,
    })),
  };
}
