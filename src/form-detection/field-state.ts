/**
 * Growth FormAssist - Field State Helpers
 *
 * Small DOM helpers that read native and ARIA state without modifying
 * the current webpage.
 */

/**
 * Read the native element type without making assumptions about custom
 * controls.
 */
export function getElementType(element: HTMLElement): string {
  if (element instanceof HTMLInputElement) {
    return element.type || 'text';
  }

  if (element instanceof HTMLButtonElement) {
    return element.type || 'button';
  }

  return element.getAttribute('type') || element.tagName.toLowerCase();
}

/**
 * Determine the position of a field within its containing form.
 */
export function getFormIndex(element: HTMLElement): number {
  const form = element.closest('form');

  if (!form) {
    return -1;
  }

  const controls = Array.from(
    form.querySelectorAll<HTMLElement>(
      'input, select, textarea, button, [contenteditable="true"], ' +
        '[role="textbox"], [role="combobox"], [role="listbox"], ' +
        '[role="checkbox"], [role="radio"], [role="switch"], [role="button"]',
    ),
  );

  return controls.indexOf(element);
}

/**
 * Determine whether a control is disabled.
 */
export function isDisabled(element: HTMLElement): boolean {
  if ('disabled' in element && Boolean(element.disabled)) {
    return true;
  }

  return element.getAttribute('aria-disabled') === 'true';
}

/**
 * Determine whether a control is required.
 */
export function isRequired(element: HTMLElement): boolean {
  if ('required' in element && Boolean(element.required)) {
    return true;
  }

  return element.getAttribute('aria-required') === 'true';
}

/**
 * Determine whether a control is read-only.
 */
export function isReadonly(element: HTMLElement): boolean {
  if ('readOnly' in element && Boolean(element.readOnly)) {
    return true;
  }

  return element.getAttribute('aria-readonly') === 'true';
}

