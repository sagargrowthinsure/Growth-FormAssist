/**
 * Growth FormAssist - Field Detector
 *
 * Read-only engine that discovers native and ARIA form controls on the
 * current page. It does not store, transmit, or modify field values.
 */

import type {
  DetectedField,
  DetectedFieldType,
  FieldFingerprint,
} from './types';

import {
  buildCssSelector,
  buildXPath,
  getAssociatedLabel,
  getElementChecked,
  getElementValue,
  getFieldOptions,
} from './field-metadata';

import {
  getElementType,
  getFormIndex,
  isDisabled,
  isReadonly,
  isRequired,
} from './field-state';

const CONTROL_SELECTOR = [
  'input',
  'select',
  'textarea',
  'button',
  '[contenteditable="true"]',
  '[role="textbox"]',
  '[role="combobox"]',
  '[role="listbox"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
  '[role="button"]',
].join(',');

/**
 * Detect supported form controls in the supplied document or open
 * Shadow DOM root.
 */
export function detectFields(
  root: Document | ShadowRoot = document,
): DetectedField[] {
  const elements = collectElements(root);

  return elements
    .map((element, index) => createDetectedField(element, index))
    .filter(
      (field): field is DetectedField => field !== null,
    );
}

/**
 * Collect native controls, ARIA controls, and controls inside open
 * Shadow DOM roots without collecting the same element twice.
 */
function collectElements(root: Document | ShadowRoot): HTMLElement[] {
  const result: HTMLElement[] = [];
  const visited = new Set<HTMLElement>();

  const visitRoot = (currentRoot: Document | ShadowRoot): void => {
    currentRoot.querySelectorAll<HTMLElement>('*').forEach((element) => {
      if (element.matches(CONTROL_SELECTOR) && !visited.has(element)) {
        visited.add(element);
        result.push(element);
      }

      if (element.shadowRoot) {
        visitRoot(element.shadowRoot);
      }
    });
  };

  visitRoot(root);

  return result;
}

/**
 * Build the normalized field record used by future capture and autofill
 * functionality.
 */
function createDetectedField(
  element: HTMLElement,
  index: number,
): DetectedField | null {
  const fieldType = determineFieldType(element);

  if (fieldType === 'hidden') {
    return null;
  }

  const fingerprint: FieldFingerprint = {
    tagName: element.tagName.toLowerCase(),
    type: getElementType(element),
    id: normalizeAttribute(element, 'id'),
    name: normalizeAttribute(element, 'name'),
    label: getAssociatedLabel(element),
    ariaLabel: normalizeAttribute(element, 'aria-label'),
    placeholder: normalizeAttribute(element, 'placeholder'),
    title: normalizeAttribute(element, 'title'),
    autocomplete: normalizeAttribute(element, 'autocomplete'),
    selector: buildCssSelector(element),
    xpath: buildXPath(element),
    formId: element.closest('form')?.id || null,
    formAction: element.closest('form')?.getAttribute('action') || null,
    indexWithinForm: getFormIndex(element),
  };

  return {
    index,
    fieldType,
    fingerprint,
    value: getElementValue(element),
    checked: getElementChecked(element),
    disabled: isDisabled(element),
    required: isRequired(element),
    readonly: isReadonly(element),
    options: getFieldOptions(element),
  };
}

/**
 * Resolve the logical type using native HTML semantics first and ARIA
 * roles second so legacy and modern controls can be recognized together.
 */
function determineFieldType(element: HTMLElement): DetectedFieldType {
  const tagName = element.tagName.toLowerCase();
  const nativeType = getElementType(element).toLowerCase();
  const role = element.getAttribute('role')?.toLowerCase();

  if (tagName === 'textarea' || role === 'textbox') {
    return 'textarea';
  }

  if (
    tagName === 'select' ||
    role === 'listbox' ||
    role === 'combobox'
  ) {
    return 'select';
  }

  if (tagName === 'input') {
    const supportedTypes: DetectedFieldType[] = [
      'text',
      'number',
      'date',
      'email',
      'tel',
      'url',
      'password',
      'search',
      'checkbox',
      'radio',
      'file',
      'range',
      'color',
      'hidden',
      'button',
      'submit',
      'reset',
    ];

    if (
      supportedTypes.includes(
        nativeType as DetectedFieldType,
      )
    ) {
      return nativeType as DetectedFieldType;
    }
  }

  if (role === 'checkbox' || role === 'switch') {
    return 'checkbox';
  }

  if (role === 'radio') {
    return 'radio';
  }

  if (role === 'button' || tagName === 'button') {
    return 'button';
  }

  if (element.isContentEditable) {
    return 'textarea';
  }

  return 'unknown';
}

/**
 * Read an optional element attribute and normalize empty values to null.
 */
function normalizeAttribute(
  element: HTMLElement,
  name: string,
): string | null {
  const value = element.getAttribute(name)?.trim();

  return value || null;
}

