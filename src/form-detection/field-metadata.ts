/**
 * Growth FormAssist - Field Metadata Helpers
 *
 * Shared DOM helpers used by the field-detection engine. These functions
 * read page information only; they never change the webpage.
 */

import type { DetectedOption } from './types';

/**
 * Resolve the most useful human-readable label associated with a field.
 */
export function getAssociatedLabel(element: HTMLElement): string | null {
  const id = element.getAttribute('id');

  if (id) {
    const root = element.getRootNode() as Document | ShadowRoot;
    const explicitLabel = root.querySelector(
      `label[for="${escapeCssValue(id)}"]`,
    );

    const text = explicitLabel?.textContent?.trim();
    if (text) return cleanText(text);
  }

  const parentLabel = element.closest('label')?.textContent?.trim();
  if (parentLabel) return cleanText(parentLabel);

  const labelledBy = element.getAttribute('aria-labelledby');

  if (labelledBy) {
    const root = element.getRootNode() as Document | ShadowRoot;

    const text = labelledBy
      .split(/\s+/)
      .map(
        (labelId) =>
          root
            .querySelector(`#${escapeCssValue(labelId)}`)
            ?.textContent?.trim() || '',
      )
      .filter(Boolean)
      .join(' ');

    if (text) return cleanText(text);
  }

  return (
    cleanText(element.getAttribute('aria-label') || '') ||
    cleanText(element.getAttribute('placeholder') || '') ||
    cleanText(element.getAttribute('title') || '') ||
    null
  );
}

/**
 * Read the current value without changing the control.
 */
export function getElementValue(element: HTMLElement): string {
  if (element instanceof HTMLInputElement) {
    return element.value;
  }

  if (
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  ) {
    return element.value;
  }

  return element.textContent?.trim() || '';
}

/**
 * Read checkbox/radio/switch state when the control exposes one.
 */
export function getElementChecked(element: HTMLElement): boolean | null {
  if (element instanceof HTMLInputElement) {
    if (element.type === 'checkbox' || element.type === 'radio') {
      return element.checked;
    }
  }

  const role = element.getAttribute('role')?.toLowerCase();

  if (role === 'checkbox' || role === 'radio' || role === 'switch') {
    return element.getAttribute('aria-checked') === 'true';
  }

  return null;
}

/**
 * Extract options from native select elements and common ARIA list controls.
 */
export function getFieldOptions(element: HTMLElement): DetectedOption[] {
  if (element instanceof HTMLSelectElement) {
    return Array.from(element.options).map((option) => ({
      value: option.value,
      text: cleanText(option.textContent || ''),
      selected: option.selected,
    }));
  }

  const role = element.getAttribute('role')?.toLowerCase();

  if (role !== 'listbox' && role !== 'combobox') {
    return [];
  }

  return Array.from(
    element.querySelectorAll<HTMLElement>('[role="option"]'),
  ).map((option) => ({
    value:
      option.getAttribute('data-value') ||
      option.textContent?.trim() ||
      '',
    text: cleanText(option.textContent || ''),
    selected: option.getAttribute('aria-selected') === 'true',
  }));
}

/**
 * Build a stable CSS selector using the strongest available identifiers.
 */
export function buildCssSelector(element: HTMLElement): string {
  if (element.id) {
    return `#${escapeCssValue(element.id)}`;
  }

  const parts: string[] = [];
  let current: HTMLElement | null = element;

  while (
    current !== null &&
    current.nodeType === Node.ELEMENT_NODE &&
    parts.length < 8
  ) {
    let part = current.tagName.toLowerCase();
    const name = current.getAttribute('name');

    if (name) {
      part += `[name="${escapeCssValue(name)}"]`;
    }

    const currentTagName = current.tagName;
    const parent: HTMLElement | null = current.parentElement;

    if (parent !== null) {
      const children: Element[] = Array.from(
        parent.children,
      ) as Element[];

      const siblings = children.filter(
        (child: Element) => child.tagName === currentTagName,
      );

      if (siblings.length > 1) {
        part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
      }
    }

    parts.unshift(part);
    current = parent;
  }

  return parts.join(' > ');
}

/**
 * Build an XPath fallback for environments where a CSS selector changes.
 */
export function buildXPath(element: HTMLElement): string {
  const parts: string[] = [];
  let current: HTMLElement | null = element;

  while (
    current !== null &&
    current.nodeType === Node.ELEMENT_NODE &&
    parts.length < 8
  ) {
    let index = 1;
    let sibling = current.previousElementSibling;

    while (sibling) {
      if (sibling.tagName === current.tagName) {
        index += 1;
      }

      sibling = sibling.previousElementSibling;
    }

    parts.unshift(`${current.tagName.toLowerCase()}[${index}]`);
    current = current.parentElement;
  }

  return `/${parts.join('/')}`;
}

/**
 * Normalize descriptive text so it is suitable for field matching later.
 */
function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/**
 * Escape values before placing them into generated CSS selectors.
 */
function escapeCssValue(value: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') {
    return CSS.escape(value);
  }

  return value.replace(/([^\w-])/g, '\\$1');
}

