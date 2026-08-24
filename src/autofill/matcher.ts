/**
 * Growth FormAssist - Autofill Matcher
 *
 * Resolves a saved field against the current webpage.
 *
 * Matching priority:
 * 1. Saved CSS selector.
 * 2. Saved XPath.
 * 3. Field fingerprint scoring.
 *
 * A weak or ambiguous fingerprint match is rejected rather than
 * risking data being written into the wrong field.
 */

import type { DetectedField } from '../form-detection/types';

import {
  getAssociatedLabel,
} from '../form-detection/field-metadata';

import {
  getElementType,
  getFormIndex,
} from '../form-detection/field-state';

/**
 * Native and common ARIA controls supported by FormAssist.
 */
const CONTROL_SELECTOR = [
  'input',
  'select',
  'textarea',
  '[contenteditable="true"]',
  '[role="textbox"]',
  '[role="combobox"]',
  '[role="listbox"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="switch"]',
].join(',');

/**
 * Resolve one saved field to the safest current-page element.
 */
export function resolveFieldElement(
  savedField: DetectedField,
  root: Document | ShadowRoot = document,
): HTMLElement | null {
  const selectorMatch = resolveBySelector(
    savedField,
    root,
  );

  if (selectorMatch) {
    return selectorMatch;
  }

  const xpathMatch = resolveByXPath(
    savedField,
    root,
  );

  if (xpathMatch) {
    return xpathMatch;
  }

  return resolveByFingerprint(
    savedField,
    root,
  );
}

/**
 * Try the saved CSS selector first.
 */
function resolveBySelector(
  savedField: DetectedField,
  root: Document | ShadowRoot,
): HTMLElement | null {
  const selector =
    savedField.fingerprint.selector;

  if (!selector) {
    return null;
  }

  try {
    const matches =
      root.querySelectorAll<HTMLElement>(
        selector,
      );

    if (matches.length !== 1) {
      return null;
    }

    /**
     * Explicitly verify the indexed element exists because TypeScript
     * does not guarantee that an array-like indexed value is defined.
     */
    const candidate = matches[0];

    if (!candidate) {
      return null;
    }

    return isCompatible(
      savedField,
      candidate,
    )
      ? candidate
      : null;
  } catch {
    return null;
  }
}

/**
 * Try the saved XPath when the CSS selector is no longer valid.
 */
function resolveByXPath(
  savedField: DetectedField,
  root: Document | ShadowRoot,
): HTMLElement | null {
  const xpath =
    savedField.fingerprint.xpath;

  if (!xpath || !(root instanceof Document)) {
    return null;
  }

  try {
    const result = document.evaluate(
      xpath,
      root,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    );

    const candidate = result.singleNodeValue;

    if (!(candidate instanceof HTMLElement)) {
      return null;
    }

    return isCompatible(
      savedField,
      candidate,
    )
      ? candidate
      : null;
  } catch {
    return null;
  }
}

/**
 * Fall back to fingerprint-based matching when structural selectors
 * have changed since the form was captured.
 */
function resolveByFingerprint(
  savedField: DetectedField,
  root: Document | ShadowRoot,
): HTMLElement | null {
  const candidates =
    collectControls(root);

  const scored = candidates
    .map((element) => ({
      element,
      score: scoreCandidate(
        savedField,
        element,
      ),
    }))
    .filter(
      (candidate) => candidate.score >= 60,
    )
    .sort(
      (left, right) =>
        right.score - left.score,
    );

  if (scored.length === 0) {
    return null;
  }

  /**
   * Explicitly verify the best match exists because TypeScript does
   * not guarantee that an indexed array value is defined.
   */
  const best = scored[0];

  if (!best) {
    return null;
  }

  const second = scored[1];

  /**
   * Reject close scores because selecting the wrong insurance
   * field is worse than leaving the field unmatched.
   */
  if (
    second &&
    best.score - second.score < 10
  ) {
    return null;
  }

  return best.element;
}

/**
 * Collect supported controls, including controls inside open
 * Shadow DOM roots.
 */
function collectControls(
  root: Document | ShadowRoot,
): HTMLElement[] {
  const result: HTMLElement[] = [];
  const visited = new Set<HTMLElement>();

  const visitRoot = (
    currentRoot: Document | ShadowRoot,
  ): void => {
    currentRoot
      .querySelectorAll<HTMLElement>(
        CONTROL_SELECTOR,
      )
      .forEach((element) => {
        if (!visited.has(element)) {
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
 * Score a current-page candidate against the saved fingerprint.
 */
function scoreCandidate(
  savedField: DetectedField,
  candidate: HTMLElement,
): number {
  if (!isCompatible(savedField, candidate)) {
    return 0;
  }

  const saved =
    savedField.fingerprint;

  const current = {
    tagName:
      candidate.tagName.toLowerCase(),
    type:
      getElementType(candidate),
    id:
      normalize(candidate.id),
    name:
      normalize(
        candidate.getAttribute('name'),
      ),
    label:
      normalize(
        getAssociatedLabel(candidate),
      ),
    ariaLabel:
      normalize(
        candidate.getAttribute(
          'aria-label',
        ),
      ),
    placeholder:
      normalize(
        candidate.getAttribute(
          'placeholder',
        ),
      ),
    title:
      normalize(
        candidate.getAttribute('title'),
      ),
    autocomplete:
      normalize(
        candidate.getAttribute(
          'autocomplete',
        ),
      ),
    formId:
      normalize(
        candidate.closest('form')?.id,
      ),
    formAction:
      normalize(
        candidate.closest('form')
          ?.getAttribute('action'),
      ),
    indexWithinForm:
      getFormIndex(candidate),
  };

  let score = 0;

  if (
    saved.id &&
    current.id === normalize(saved.id)
  ) {
    score += 100;
  }

  if (
    saved.name &&
    current.name === normalize(saved.name)
  ) {
    score += 80;
  }

  if (
    saved.label &&
    current.label === normalize(saved.label)
  ) {
    score += 70;
  }

  if (
    saved.ariaLabel &&
    current.ariaLabel ===
      normalize(saved.ariaLabel)
  ) {
    score += 60;
  }

  if (
    saved.placeholder &&
    current.placeholder ===
      normalize(saved.placeholder)
  ) {
    score += 35;
  }

  if (
    saved.autocomplete &&
    current.autocomplete ===
      normalize(saved.autocomplete)
  ) {
    score += 30;
  }

  if (
    saved.title &&
    current.title === normalize(saved.title)
  ) {
    score += 20;
  }

  if (
    saved.tagName === current.tagName
  ) {
    score += 20;
  }

  if (
    saved.type === current.type
  ) {
    score += 20;
  }

  if (
    saved.formId &&
    current.formId === normalize(saved.formId)
  ) {
    score += 15;
  }

  if (
    saved.formAction &&
    current.formAction ===
      normalize(saved.formAction)
  ) {
    score += 10;
  }

  if (
    saved.indexWithinForm ===
    current.indexWithinForm
  ) {
    score += 15;
  }

  return score;
}

/**
 * Reject candidates whose fundamental HTML identity is incompatible
 * with the captured field.
 */
function isCompatible(
  savedField: DetectedField,
  candidate: HTMLElement,
): boolean {
  const saved =
    savedField.fingerprint;

  if (
    saved.tagName &&
    saved.tagName.toLowerCase() !==
      candidate.tagName.toLowerCase()
  ) {
    return false;
  }

  if (
    saved.type &&
    getElementType(candidate) !== saved.type
  ) {
    return false;
  }

  return true;
}

/**
 * Normalize matching text consistently.
 */
function normalize(
  value: string | null | undefined,
): string {
  return (value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

