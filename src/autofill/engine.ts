/**
 * Growth FormAssist - Autofill Engine
 *
 * Applies a saved form template to the current webpage.
 *
 * The engine returns the existing AutofillResponse contract defined
 * by src/autofill/types.ts. It does not define a second response model.
 */

import type {
  CapturedFormTemplate,
} from '../capture/types';

import type {
  AutofillSuccessResponse,
} from './types';

import {
  resolveFieldElement,
} from './matcher';

/**
 * Apply a saved template to the current webpage.
 */
export function autofillTemplate(
  template: CapturedFormTemplate,
  root: Document | ShadowRoot = document,
): AutofillSuccessResponse {
  const skippedFields: string[] = [];
  const unmatchedFields: string[] = [];

  let filledCount = 0;
  let overwrittenCount = 0;

  for (const savedField of template.fields) {
    const fieldIdentifier =
      getFieldIdentifier(savedField);

    /**
     * Never modify disabled or read-only controls.
     */
    if (
      savedField.disabled ||
      savedField.readonly
    ) {
      skippedFields.push(
        fieldIdentifier,
      );

      continue;
    }

    const element =
      resolveFieldElement(
        savedField,
        root,
      );

    if (!element) {
      unmatchedFields.push(
        fieldIdentifier,
      );

      continue;
    }

    try {
      const result =
        applyFieldValue(
          element,
          savedField,
        );

      if (result === 'filled') {
        filledCount += 1;
      } else if (
        result === 'overwritten'
      ) {
        overwrittenCount += 1;
      } else if (
        result === 'skipped'
      ) {
        skippedFields.push(
          fieldIdentifier,
        );
      }
    } catch {
      skippedFields.push(
        fieldIdentifier,
      );
    }
  }

  return {
    success: true,

    filledCount,

    overwrittenCount,

    unchangedCount: 0,

    skippedCount:
      skippedFields.length,

    unmatchedCount:
      unmatchedFields.length,

    skippedFields,

    unmatchedFields,
  };
}

/**
 * Result of applying one field.
 */
type FieldApplyResult =
  | 'filled'
  | 'overwritten'
  | 'skipped';

/**
 * Apply one saved field value.
 */
function applyFieldValue(
  element: HTMLElement,
  savedField: CapturedFormTemplate['fields'][number],
): FieldApplyResult {
  if (
    element instanceof HTMLInputElement
  ) {
    return applyInputValue(
      element,
      savedField,
    );
  }

  if (
    element instanceof HTMLTextAreaElement
  ) {
    if (
      element.value ===
      savedField.value
    ) {
      return 'skipped';
    }

    const hadExistingValue =
      element.value.length > 0;

    setNativeValue(
      element,
      savedField.value,
    );

    dispatchFieldEvents(element);

    return hadExistingValue
      ? 'overwritten'
      : 'filled';
  }

  if (
    element instanceof HTMLSelectElement
  ) {
    const savedOption =
      savedField.options.find(
        (option) =>
          option.selected,
      );

    const targetValue =
      savedOption?.value ??
      savedField.value;

    if (
      element.value ===
      targetValue
    ) {
      return 'skipped';
    }

    const hadExistingValue =
      element.value.length > 0;

    setNativeValue(
      element,
      targetValue,
    );

    dispatchFieldEvents(element);

    return hadExistingValue
      ? 'overwritten'
      : 'filled';
  }

  if (
    element.isContentEditable
  ) {
    const currentValue =
      element.textContent?.trim() ||
      '';

    if (
      currentValue ===
      savedField.value
    ) {
      return 'skipped';
    }

    const hadExistingValue =
      currentValue.length > 0;

    element.textContent =
      savedField.value;

    dispatchFieldEvents(element);

    return hadExistingValue
      ? 'overwritten'
      : 'filled';
  }

  return applyAriaField(
    element,
    savedField,
  );
}

/**
 * Apply a saved value to an input.
 */
function applyInputValue(
  element: HTMLInputElement,
  savedField: CapturedFormTemplate['fields'][number],
): FieldApplyResult {
  const type =
    element.type.toLowerCase();

  if (
    type === 'checkbox' ||
    type === 'radio'
  ) {
    if (
      savedField.checked === null
    ) {
      return 'skipped';
    }

    if (
      element.checked ===
      savedField.checked
    ) {
      return 'skipped';
    }

    element.checked =
      savedField.checked;

    dispatchFieldEvents(element);

    return 'overwritten';
  }

  /**
   * File inputs cannot safely be populated from an extension
   * template and are intentionally skipped.
   */
  if (type === 'file') {
    return 'skipped';
  }

  /**
   * Buttons are controls, not data fields.
   */
  if (
    type === 'button' ||
    type === 'submit' ||
    type === 'reset'
  ) {
    return 'skipped';
  }

  if (
    element.value ===
    savedField.value
  ) {
    return 'skipped';
  }

  const hadExistingValue =
    element.value.length > 0;

  setNativeValue(
    element,
    savedField.value,
  );

  dispatchFieldEvents(element);

  return hadExistingValue
    ? 'overwritten'
    : 'filled';
}

/**
 * Apply a value to common ARIA/custom controls.
 */
function applyAriaField(
  element: HTMLElement,
  savedField: CapturedFormTemplate['fields'][number],
): FieldApplyResult {
  const role =
    element
      .getAttribute('role')
      ?.toLowerCase();

  if (
    role === 'checkbox' ||
    role === 'radio' ||
    role === 'switch'
  ) {
    if (
      savedField.checked === null
    ) {
      return 'skipped';
    }

    const current =
      element.getAttribute(
        'aria-checked',
      ) === 'true';

    if (
      current ===
      savedField.checked
    ) {
      return 'skipped';
    }

    element.setAttribute(
      'aria-checked',
      savedField.checked
        ? 'true'
        : 'false',
    );

    dispatchFieldEvents(element);

    return 'overwritten';
  }

  if (
    role === 'textbox' ||
    role === 'combobox' ||
    role === 'listbox'
  ) {
    const currentValue =
      element.textContent?.trim() ||
      '';

    if (
      currentValue ===
      savedField.value
    ) {
      return 'skipped';
    }

    const hadExistingValue =
      currentValue.length > 0;

    setNativeValue(
      element,
      savedField.value,
    );

    dispatchFieldEvents(element);

    return hadExistingValue
      ? 'overwritten'
      : 'filled';
  }

  return 'skipped';
}

/**
 * Set a native control's value through its prototype setter.
 *
 * This allows React and similar frameworks to observe the value
 * change correctly.
 */
function setNativeValue(
  element: HTMLElement,
  value: string,
): void {
  if (
    element instanceof HTMLInputElement
  ) {
    const descriptor =
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      );

    descriptor?.set?.call(
      element,
      value,
    );

    return;
  }

  if (
    element instanceof HTMLTextAreaElement
  ) {
    const descriptor =
      Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        'value',
      );

    descriptor?.set?.call(
      element,
      value,
    );

    return;
  }

  if (
    element instanceof HTMLSelectElement
  ) {
    const descriptor =
      Object.getOwnPropertyDescriptor(
        HTMLSelectElement.prototype,
        'value',
      );

    descriptor?.set?.call(
      element,
      value,
    );

    return;
  }

  element.textContent =
    value;
}

/**
 * Notify the webpage that a field changed.
 */
function dispatchFieldEvents(
  element: HTMLElement,
): void {
  element.dispatchEvent(
    new Event(
      'input',
      {
        bubbles: true,
      },
    ),
  );

  element.dispatchEvent(
    new Event(
      'change',
      {
        bubbles: true,
      },
    ),
  );
}

/**
 * Produce a stable human-readable identifier for result reporting.
 */
function getFieldIdentifier(
  field: CapturedFormTemplate['fields'][number],
): string {
  return (
    field.fingerprint.label ||
    field.fingerprint.name ||
    field.fingerprint.id ||
    field.fingerprint.selector ||
    `Field ${field.index + 1}`
  );
}
