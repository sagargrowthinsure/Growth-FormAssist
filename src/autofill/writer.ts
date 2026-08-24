/**
 * Growth FormAssist - Autofill Writer
 *
 * Writes one captured value into one resolved webpage control.
 *
 * This module never submits forms and never clicks submit buttons.
 * Browser events are dispatched after writing so modern JavaScript
 * frameworks can recognize the updated value.
 */

import type { DetectedField } from '../form-detection/types';

/**
 * Result of writing one field.
 */
export interface FieldWriteResult {
  success: boolean;
  changed: boolean;
  overwritten: boolean;
  reason?: string;
}

/**
 * Write one captured field into the current webpage element.
 */
export function writeField(
  element: HTMLElement,
  field: DetectedField,
): FieldWriteResult {
  if (isDisabled(element)) {
    return failure(
      'Current field is disabled.',
    );
  }

  if (isReadonly(element)) {
    return failure(
      'Current field is read-only.',
    );
  }

  if (
    field.fieldType === 'button' ||
    field.fieldType === 'submit' ||
    field.fieldType === 'reset' ||
    field.fieldType === 'file'
  ) {
    return failure(
      'This control type is not autofilled.',
    );
  }

  if (
    field.fieldType === 'checkbox' ||
    field.fieldType === 'radio'
  ) {
    return writeCheckable(
      element,
      field.checked === true,
    );
  }

  if (
    element instanceof HTMLSelectElement
  ) {
    return writeSelect(
      element,
      field.value,
    );
  }

  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
  ) {
    return writeNativeValue(
      element,
      field.value,
    );
  }

  const role =
    element.getAttribute('role')
      ?.toLowerCase();

  if (
    role === 'checkbox' ||
    role === 'radio' ||
    role === 'switch'
  ) {
    return writeAriaCheckable(
      element,
      field.checked === true,
    );
  }

  if (role === 'listbox') {
    return writeListbox(
      element,
      field.value,
    );
  }

  if (
    role === 'textbox' ||
    role === 'combobox' ||
    element.isContentEditable
  ) {
    return writeTextLike(
      element,
      field.value,
    );
  }

  if ('value' in element) {
    return writeGenericValue(
      element,
      field.value,
    );
  }

  return failure(
    'Unsupported control type.',
  );
}

/**
 * Write a native input or textarea value using the native
 * prototype setter where available.
 */
function writeNativeValue(
  element:
    | HTMLInputElement
    | HTMLTextAreaElement,
  value: string,
): FieldWriteResult {
  const oldValue = element.value;

  setNativeProperty(
    element,
    'value',
    value,
  );

  dispatchValueEvents(element);

  return successResult(
    oldValue !== value,
    oldValue.length > 0 &&
      oldValue !== value,
  );
}

/**
 * Write a native select value.
 */
function writeSelect(
  element: HTMLSelectElement,
  value: string,
): FieldWriteResult {
  const oldValue = element.value;

  let option =
    Array.from(element.options)
      .find(
        (item) => item.value === value,
      );

  if (!option) {
    const normalizedValue =
      normalize(value);

    option =
      Array.from(element.options)
        .find(
          (item) =>
            normalize(
              item.textContent,
            ) === normalizedValue,
        );
  }

  if (!option) {
    return failure(
      'Saved option does not exist on the current page.',
    );
  }

  element.value = option.value;

  dispatchValueEvents(element);

  return successResult(
    oldValue !== element.value,
    oldValue.length > 0 &&
      oldValue !== element.value,
  );
}

/**
 * Write checkbox/radio state.
 */
function writeCheckable(
  element: HTMLElement,
  checked: boolean,
): FieldWriteResult {
  if (!(element instanceof HTMLInputElement)) {
    return writeAriaCheckable(
      element,
      checked,
    );
  }

  const oldValue = element.checked;

  const setter =
    Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      'checked',
    )?.set;

  if (setter) {
    setter.call(element, checked);
  } else {
    element.checked = checked;
  }

  element.dispatchEvent(
    new Event('input', {
      bubbles: true,
      composed: true,
    }),
  );

  element.dispatchEvent(
    new Event('change', {
      bubbles: true,
      composed: true,
    }),
  );

  return successResult(
    oldValue !== checked,
    oldValue !== checked,
  );
}

/**
 * Write ARIA checkbox/radio/switch state.
 */
function writeAriaCheckable(
  element: HTMLElement,
  checked: boolean,
): FieldWriteResult {
  const oldValue =
    element.getAttribute('aria-checked');

  const newValue =
    checked ? 'true' : 'false';

  element.setAttribute(
    'aria-checked',
    newValue,
  );

  dispatchValueEvents(element);

  return successResult(
    oldValue !== newValue,
    oldValue !== null &&
      oldValue !== newValue,
  );
}

/**
 * Write a custom listbox by selecting its matching option.
 */
function writeListbox(
  element: HTMLElement,
  value: string,
): FieldWriteResult {
  const normalizedValue =
    normalize(value);

  const options =
    Array.from(
      element.querySelectorAll<HTMLElement>(
        '[role="option"]',
      ),
    );

  const match =
    options.find(
      (option) =>
        normalize(
          option.getAttribute(
            'data-value',
          ),
        ) === normalizedValue,
    ) ||
    options.find(
      (option) =>
        normalize(
          option.textContent,
        ) === normalizedValue,
    );

  if (!match) {
    return failure(
      'Saved list option does not exist on the current page.',
    );
  }

  options.forEach((option) => {
    option.setAttribute(
      'aria-selected',
      option === match
        ? 'true'
        : 'false',
    );
  });

  dispatchValueEvents(element);

  return successResult(true, true);
}

/**
 * Write text into custom text-like controls.
 */
function writeTextLike(
  element: HTMLElement,
  value: string,
): FieldWriteResult {
  const oldValue =
    'value' in element
      ? String(
          (element as HTMLElement & {
            value?: unknown;
          }).value ?? '',
        )
      : element.textContent || '';

  if ('value' in element) {
    setNativeProperty(
      element,
      'value',
      value,
    );
  } else {
    element.textContent = value;
  }

  dispatchValueEvents(element);

  return successResult(
    oldValue !== value,
    oldValue.length > 0 &&
      oldValue !== value,
  );
}

/**
 * Write an element exposing a generic value property.
 */
function writeGenericValue(
  element: HTMLElement,
  value: string,
): FieldWriteResult {
  const oldValue = String(
    (element as HTMLElement & {
      value?: unknown;
    }).value ?? '',
  );

  setNativeProperty(
    element,
    'value',
    value,
  );

  dispatchValueEvents(element);

  return successResult(
    oldValue !== value,
    oldValue.length > 0 &&
      oldValue !== value,
  );
}

/**
 * Set a DOM property through its native setter.
 */
function setNativeProperty(
  element: HTMLElement,
  property: string,
  value: unknown,
): void {
  const prototype =
    Object.getPrototypeOf(element);

  const setter =
    Object.getOwnPropertyDescriptor(
      prototype,
      property,
    )?.set;

  if (setter) {
    setter.call(element, value);
    return;
  }

  (
    element as HTMLElement & {
      [key: string]: unknown;
    }
  )[property] = value;
}

/**
 * Fire framework-compatible value events.
 */
function dispatchValueEvents(
  element: HTMLElement,
): void {
  element.dispatchEvent(
    new Event('input', {
      bubbles: true,
      composed: true,
    }),
  );

  element.dispatchEvent(
    new Event('change', {
      bubbles: true,
      composed: true,
    }),
  );
}

/**
 * Check current disabled state.
 */
function isDisabled(
  element: HTMLElement,
): boolean {
  return (
    element.getAttribute(
      'aria-disabled',
    ) === 'true' ||
    (
      'disabled' in element &&
      Boolean(
        (
          element as HTMLElement & {
            disabled?: boolean;
          }
        ).disabled,
      )
    )
  );
}

/**
 * Check current readonly state.
 */
function isReadonly(
  element: HTMLElement,
): boolean {
  return (
    element.getAttribute(
      'aria-readonly',
    ) === 'true' ||
    (
      'readOnly' in element &&
      Boolean(
        (
          element as HTMLElement & {
            readOnly?: boolean;
          }
        ).readOnly,
      )
    )
  );
}

/**
 * Build a successful write result.
 */
function successResult(
  changed: boolean,
  overwritten: boolean,
): FieldWriteResult {
  return {
    success: true,
    changed,
    overwritten,
  };
}

/**
 * Build a failed write result.
 */
function failure(
  reason: string,
): FieldWriteResult {
  return {
    success: false,
    changed: false,
    overwritten: false,
    reason,
  };
}

/**
 * Normalize text for option comparisons.
 */
function normalize(
  value: string | null,
): string {
  return (value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

