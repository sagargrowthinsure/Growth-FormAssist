/**
 * Growth FormAssist - Saved Capture UI
 *
 * Presentation and interaction logic for locally saved form captures.
 *
 * This module keeps the popup entrypoint focused on initialization and
 * communication while this file handles capture-specific rendering.
 */

import type { CapturedFormTemplate } from '../../src/capture/types';
import type {
  CapturedTemplatesResponse,
  DeleteCapturedTemplateResponse,
} from '../../src/messaging/messages';

/**
 * References to the popup elements used by saved captures.
 */
export interface CaptureUiElements {
  section: HTMLElement;
  list: HTMLDivElement;
  status: HTMLDivElement;
}

/**
 * Render the saved capture collection.
 */
export function renderCapturedTemplates(
  response: CapturedTemplatesResponse,
  elements: CaptureUiElements,
): void {
  if (!response.success) {
    elements.section.hidden = false;
    elements.status.className = 'capture-status error';
    elements.status.textContent = response.error;
    elements.list.innerHTML = '';
    return;
  }

  elements.section.hidden = false;
  elements.status.className = 'capture-status';

  if (response.templates.length === 0) {
    elements.status.textContent =
      'No saved captures yet.';
    elements.list.innerHTML = `
      <div class="capture-empty">
        Capture a form using Alt+Click to save it here.
      </div>
    `;
    return;
  }

  elements.status.textContent =
    `${response.templates.length} saved capture${
      response.templates.length === 1 ? '' : 's'
    }.`;

  elements.list.innerHTML = response.templates
    .map((template) => createCaptureMarkup(template))
    .join('');

  registerCaptureActions(elements, response.templates);
}

/**
 * Render detailed field information for one capture.
 */
export function showCaptureDetails(
  template: CapturedFormTemplate,
  elements: CaptureUiElements,
): void {
  elements.section.hidden = false;
  elements.status.className = 'capture-status';
  elements.status.textContent =
    `${template.fields.length} captured field${
      template.fields.length === 1 ? '' : 's'
    }.`;

  elements.list.innerHTML = `
    <div class="capture-detail-header">
      <button
        id="capture-back"
        class="secondary-button"
        type="button"
      >
        ← Back
      </button>

      <div class="capture-detail-title">
        <strong>${escapeHtml(
          template.page.title || template.page.hostname,
        )}</strong>
        <span>${escapeHtml(template.page.hostname)}</span>
      </div>
    </div>

    <div class="capture-field-list">
      ${
        template.fields.length > 0
          ? template.fields
              .map((field) => createCapturedFieldMarkup(field))
              .join('')
          : `
            <div class="capture-empty">
              This capture contains no detected fields.
            </div>
          `
      }
    </div>
  `;

  document
    .querySelector<HTMLButtonElement>('#capture-back')
    ?.addEventListener('click', () => {
      /**
       * Re-rendering the collection is handled by the caller because
       * it owns the current capture list.
       */
      elements.list.dispatchEvent(
        new CustomEvent('formassist:capture-back'),
      );
    });
}

/**
 * Render one saved capture row.
 */
function createCaptureMarkup(
  template: CapturedFormTemplate,
): string {
  const title =
    template.page.title ||
    template.page.hostname ||
    'Untitled page';

  const capturedDate = formatCapturedDate(
    template.capturedAt,
  );

  return `
    <article class="capture-row">
      <div class="capture-main">
        <strong>${escapeHtml(title)}</strong>

        <span class="capture-host">
          ${escapeHtml(template.page.hostname)}
        </span>

        <span class="capture-meta">
          ${template.fields.length} field${
            template.fields.length === 1 ? '' : 's'
          } · ${escapeHtml(capturedDate)}
        </span>
      </div>

      <div class="capture-actions">
        <button
          class="secondary-button capture-view"
          type="button"
          data-capture-id="${escapeHtml(template.id)}"
        >
          View
        </button>

        <button
          class="danger-button capture-delete"
          type="button"
          data-capture-id="${escapeHtml(template.id)}"
        >
          Delete
        </button>
      </div>
    </article>
  `;
}

/**
 * Register View and Delete actions for saved captures.
 */
function registerCaptureActions(
  elements: CaptureUiElements,
  templates: CapturedFormTemplate[],
): void {
  elements.list
    .querySelectorAll<HTMLButtonElement>(
      '.capture-view',
    )
    .forEach((button) => {
      button.addEventListener('click', () => {
        const template = templates.find(
          (item) =>
            item.id === button.dataset.captureId,
        );

        if (template) {
          showCaptureDetails(template, elements);
        }
      });
    });

  elements.list
    .querySelectorAll<HTMLButtonElement>(
      '.capture-delete',
    )
    .forEach((button) => {
      button.addEventListener('click', async () => {
        const templateId =
          button.dataset.captureId;

        if (!templateId) {
          return;
        }

        const confirmed = window.confirm(
          'Delete this saved capture?',
        );

        if (!confirmed) {
          return;
        }

        button.disabled = true;

        try {
          const response =
            (await browser.runtime.sendMessage({
              type:
                'FORMASSIST_DELETE_CAPTURED_TEMPLATE',
              templateId,
            })) as DeleteCapturedTemplateResponse;

          if (!response.success) {
            window.alert(response.error);
            button.disabled = false;
            return;
          }

          const remaining = templates.filter(
            (item) => item.id !== templateId,
          );

          renderCapturedTemplates(
            {
              success: true,
              templates: remaining,
            },
            elements,
          );
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error(
              '[Growth FormAssist] Capture deletion failed:',
              error,
            );
          }

          window.alert(
            'FormAssist could not delete the capture.',
          );

          button.disabled = false;
        }
      });
    });
}

/**
 * Create one captured-field detail row.
 */
function createCapturedFieldMarkup(
  field: CapturedFormTemplate['fields'][number],
): string {
  const identity =
    field.fingerprint.label ||
    field.fingerprint.name ||
    field.fingerprint.id ||
    `Field ${field.index + 1}`;

  const value =
    field.fieldType === 'checkbox' ||
    field.fieldType === 'radio'
      ? field.checked === null
        ? 'Not available'
        : field.checked
          ? 'Checked'
          : 'Not checked'
      : field.value || '(empty)';

  const state = [
    field.required ? 'Required' : '',
    field.disabled ? 'Disabled' : '',
    field.readonly ? 'Read-only' : '',
  ].filter(Boolean);

  return `
    <article class="captured-field-row">
      <div class="captured-field-main">
        <strong>${escapeHtml(identity)}</strong>
        <span>${escapeHtml(field.fieldType)}</span>
      </div>

      <div class="captured-field-value">
        ${escapeHtml(value)}
      </div>

      ${
        state.length > 0
          ? `
            <div class="captured-field-state">
              ${escapeHtml(state.join(' · '))}
            </div>
          `
          : ''
      }
    </article>
  `;
}

/**
 * Convert an ISO timestamp into a readable local date/time.
 */
function formatCapturedDate(
  value: string,
): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown time';
  }

  return date.toLocaleString();
}

/**
 * Escape dynamic values before inserting them into popup HTML.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

