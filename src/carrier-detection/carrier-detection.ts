/**
 * Growth FormAssist - Carrier Page Discovery
 *
 * Identifies the carrier and basic page identity from the current webpage.
 *
 * This module does not capture field values.
 * It only describes the page and extracts carrier-specific metadata
 * that can help establish a durable field map.
 */

import type {
  DetectedField,
} from '../form-detection/types';

export type CarrierId =
  | 'travelers'
  | 'unknown';

export interface CarrierPageIdentity {
  carrier: CarrierId;
  carrierName: string;
  hostname: string;
  origin: string;
  pathname: string;
  hash: string;
  title: string;
}

export interface CarrierFieldMetadata {
  dataLabel: string | null;
  dataCoverageCode: string | null;
}

export interface CarrierPageDiscoveryResult {
  page: CarrierPageIdentity;
  fieldMetadata: CarrierFieldMetadata[];
}

/**
 * Discover carrier and page information.
 */
export function discoverCarrierPage(
  root: Document,
  fields: readonly DetectedField[],
): CarrierPageDiscoveryResult {
  const url =
    new URL(
      root.location.href,
    );

  const carrier =
    identifyCarrier(
      url.hostname,
    );

  return {
    page: {
      carrier,
      carrierName:
        carrier === 'travelers'
          ? 'Travelers'
          : 'Unknown carrier',
      hostname:
        url.hostname,
      origin:
        url.origin,
      pathname:
        url.pathname,
      hash:
        url.hash,
      title:
        root.title.trim(),
    },

    fieldMetadata:
      fields.map(
        (field) =>
          getCarrierFieldMetadata(
            root,
            field,
          ),
      ),
  };
}

/**
 * Identify a supported carrier from the hostname.
 */
function identifyCarrier(
  hostname: string,
): CarrierId {
  const normalized =
    hostname.toLowerCase();

  if (
    normalized ===
      'travelers.com' ||
    normalized.endsWith(
      '.travelers.com',
    )
  ) {
    return 'travelers';
  }

  return 'unknown';
}

/**
 * Extract carrier-specific metadata from a detected field.
 *
 * We intentionally keep this metadata optional.
 *
 * A carrier may expose useful attributes today that are not
 * available on another carrier or on another page.
 */
function getCarrierFieldMetadata(
  root: Document,
  field: DetectedField,
): CarrierFieldMetadata {
  const element =
    findFieldElement(
      root,
      field,
    );

  if (!element) {
    return {
      dataLabel: null,
      dataCoverageCode: null,
    };
  }

  return {
    dataLabel:
      readAttribute(
        element,
        'data-label',
      ),

    dataCoverageCode:
      readAttribute(
        element,
        'data-coveragecode',
      ),
  };
}

/**
 * Locate the DOM element represented by a detected field.
 */
function findFieldElement(
  root: Document,
  field: DetectedField,
): HTMLElement | null {
  try {
    const element =
      root.querySelector<HTMLElement>(
        field.fingerprint.selector,
      );

    if (element) {
      return element;
    }
  } catch {
    // Fall back to XPath.
  }

  const xpath =
    field.fingerprint.xpath;

  if (!xpath) {
    return null;
  }

  try {
    const result =
      root.evaluate(
        xpath,
        root,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null,
      );

    const node =
      result.singleNodeValue;

    return node instanceof
      HTMLElement
      ? node
      : null;
  } catch {
    return null;
  }
}

/**
 * Read and normalize an optional DOM attribute.
 */
function readAttribute(
  element: HTMLElement,
  attributeName: string,
): string | null {
  const value =
    element
      .getAttribute(
        attributeName,
      )
      ?.trim();

  return value || null;
}

