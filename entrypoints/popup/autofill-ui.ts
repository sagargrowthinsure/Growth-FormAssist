/**
 * Growth FormAssist - Autofill Popup UI
 *
 * Provides the VA with an explicit saved-capture selection and
 * autofill action.
 *
 * The popup never reads webpage fields directly.
 */

import {
  getCapturedTemplates,
} from '../../src/capture/storage';

import type {
  CapturedFormTemplate,
} from '../../src/capture/types';

import type {
  AutofillPageMessage,
  AutofillResponse,
} from '../../src/autofill/types';

/**
 * Initialize the autofill interface and load saved captures.
 */
export async function initializeAutofillUi():
  Promise<void> {
  const select =
    document.querySelector<
      HTMLSelectElement
    >('#autofill-template');

  const button =
    document.querySelector<
      HTMLButtonElement
    >('#autofill-button');

  const status =
    document.querySelector<
      HTMLDivElement
    >('#autofill-status');

  if (!select || !button || !status) {
    return;
  }

  button.disabled = true;
  select.innerHTML =
    '<option value="">Loading saved captures...</option>';

  status.textContent = '';

  try {
    const templates =
      await getCapturedTemplates();

    renderTemplateOptions(
      select,
      templates,
    );

    button.disabled =
      templates.length === 0;

    select.addEventListener(
      'change',
      () => {
        button.disabled =
          select.value === '';
      },
      {
        once: false,
      },
    );

    button.onclick = () => {
      void performAutofill(
        select,
        button,
        status,
        templates,
      );
    };

    if (templates.length === 0) {
      status.textContent =
        'No saved captures available.';
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(
        '[Growth FormAssist] Unable to load autofill captures:',
        error,
      );
    }

    select.innerHTML =
      '<option value="">Unable to load saved captures</option>';

    status.textContent =
      'FormAssist could not load saved captures.';
  }
}

/**
 * Populate the saved-capture selector.
 */
function renderTemplateOptions(
  select: HTMLSelectElement,
  templates: CapturedFormTemplate[],
): void {
  select.innerHTML = '';

  const placeholder =
    document.createElement('option');

  placeholder.value = '';
  placeholder.textContent =
    'Select a saved capture';

  select.appendChild(
    placeholder,
  );

  templates.forEach(
    (template) => {
      const option =
        document.createElement(
          'option',
        );

      option.value =
        template.id;

      option.textContent =
        `${template.page.title || template.page.hostname} ` +
        `(${template.fields.length} fields)`;

      select.appendChild(
        option,
      );
    },
  );
}

/**
 * Confirm and execute the explicit autofill operation.
 */
async function performAutofill(
  select: HTMLSelectElement,
  button: HTMLButtonElement,
  status: HTMLDivElement,
  templates: CapturedFormTemplate[],
): Promise<void> {
  const template =
    templates.find(
      (item) =>
        item.id === select.value,
    );

  if (!template) {
    status.textContent =
      'Select a saved capture first.';
    return;
  }

  const confirmed =
    window.confirm(
      `Autofill this page using "${template.page.title || template.page.hostname}"?\n\n` +
        `Existing field values may be replaced.\n\n` +
        `FormAssist will fill fields only. It will not submit the form.`,
    );

  if (!confirmed) {
    return;
  }

  button.disabled = true;
  button.textContent =
    'Autofilling...';

  status.className =
    'autofill-status working';

  status.textContent =
    'FormAssist is filling the current page...';

  try {
    const tabs =
      await browser.tabs.query({
        active: true,
        currentWindow: true,
      });

    const activeTab = tabs[0];

    if (!activeTab?.id) {
      throw new Error(
        'No active browser tab was found.',
      );
    }

    const message:
      AutofillPageMessage = {
      type:
        'FORMASSIST_AUTOFILL_PAGE',
      template,
    };

    const response =
      await browser.tabs.sendMessage(
        activeTab.id,
        message,
      ) as AutofillResponse;

    renderAutofillResponse(
      response,
      status,
    );
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(
        '[Growth FormAssist] Popup autofill failed:',
        error,
      );
    }

    status.className =
      'autofill-status error';

    status.textContent =
      'FormAssist could not access the current page. Reload the page and try again.';
  } finally {
    button.disabled =
      select.value === '';

    button.textContent =
      'Autofill Current Page';
  }
}

/**
 * Render the completion summary.
 */
function renderAutofillResponse(
  response: AutofillResponse,
  status: HTMLDivElement,
): void {
  if (!response.success) {
    status.className =
      'autofill-status error';

    status.textContent =
      response.error;

    return;
  }

  status.className =
    response.unmatchedCount > 0
      ? 'autofill-status warning'
      : 'autofill-status success';

  status.textContent =
    `Filled ${response.filledCount}; ` +
    `unchanged ${response.unchangedCount}; ` +
    `skipped ${response.skippedCount}; ` +
    `unmatched ${response.unmatchedCount}.`;
}
