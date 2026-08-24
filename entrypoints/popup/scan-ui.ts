/**
 * Growth FormAssist - Popup Scan UI
 *
 * Contains scan-result presentation logic used by the popup.
 *
 * Keeping this logic separate from popup initialization prevents the
 * popup entrypoint from becoming a large monolithic file.
 */

import type {
  ScanFieldSummary,
  ScanResponse,
} from '../../src/messaging/messages';

/**
 * References to the popup elements used by the scan feature.
 */
export interface ScanUiElements {
  scanButton: HTMLButtonElement;
  statusElement: HTMLDivElement;
  resultsSection: HTMLElement;
  fieldCountElement: HTMLSpanElement;
  fieldListElement: HTMLDivElement;
}

/**
 * Render a successful scan response.
 */
export function renderScanResponse(
  response: Extract<ScanResponse, { success: true }>,
  elements: ScanUiElements,
): void {
  const fields = response.fields;

  elements.resultsSection.hidden = false;
  elements.fieldCountElement.textContent = String(
    response.fieldCount,
  );

  elements.statusElement.className = 'status';
  elements.statusElement.textContent =
    'Page scanned successfully.';

  if (fields.length === 0) {
    elements.fieldListElement.innerHTML = `
      <div class="empty-state">
        No supported form controls were detected.
      </div>
    `;

    return;
  }

  elements.fieldListElement.innerHTML = fields
    .map((field) => createFieldMarkup(field))
    .join('');
}

/**
 * Display a user-friendly scan error.
 */
export function showScanError(
  message: string,
  elements: ScanUiElements,
): void {
  elements.resultsSection.hidden = true;
  elements.statusElement.className = 'status error';
  elements.statusElement.textContent = message;
}

/**
 * Update the popup while a scan is running.
 */
export function setScanningState(
  scanning: boolean,
  elements: ScanUiElements,
): void {
  elements.scanButton.disabled = scanning;
  elements.scanButton.textContent = scanning
    ? 'Scanning...'
    : 'Scan Current Page';

  if (scanning) {
    elements.statusElement.className = 'status';
    elements.statusElement.textContent =
      'Inspecting the current page...';
  }
}

/**
 * Create one safe field-summary row.
 *
 * Field values are never rendered.
 */
function createFieldMarkup(field: ScanFieldSummary): string {
  const identity =
    field.fingerprint.label ||
    field.fingerprint.name ||
    field.fingerprint.id ||
    `Field ${field.index + 1}`;

  const metadata = [
    field.fingerprint.id
      ? `id: ${field.fingerprint.id}`
      : '',
    field.fingerprint.name
      ? `name: ${field.fingerprint.name}`
      : '',
    field.options > 0
      ? `${field.options} options`
      : '',
  ].filter(Boolean);

  const state = [
    field.required ? 'Required' : '',
    field.disabled ? 'Disabled' : '',
    field.readonly ? 'Read-only' : '',
  ].filter(Boolean);

  return `
    <article class="field-row">
      <div class="field-main">
        <strong>${escapeHtml(identity)}</strong>
        <span>${escapeHtml(field.fieldType)}</span>
      </div>

      ${
        metadata.length > 0
          ? `<div class="field-meta">${metadata
              .map((item) => escapeHtml(item))
              .join(' · ')}</div>`
          : ''
      }

      ${
        state.length > 0
          ? `<div class="field-state">${state
              .map((item) => escapeHtml(item))
              .join(' · ')}</div>`
          : ''
      }
    </article>
  `;
}

/**
 * Escape text before placing it into popup HTML.
 */
function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

