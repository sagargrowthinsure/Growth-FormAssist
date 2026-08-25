/**
 * Growth FormAssist - Source Data Normalizer
 *
 * Converts parsed source data into the canonical data contract.
 *
 * Source-to-canonical mappings are intentionally explicit.
 * We do not perform fuzzy matching here because incorrect
 * insurance-field mapping could result in incorrect data entry.
 */

import type {
  CanonicalData,
  CanonicalFieldId,
  SourceData,
  SourceFieldPath,
  SourceValue,
} from './types';

/**
 * Explicit mapping between a source field path and
 * a canonical field.
 *
 * Example:
 *
 * Home Quote - Dwelling Info.squareFootage
 *     ->
 * property.dwelling.livingArea
 */
export interface SourceCanonicalMapping {
  sourcePath: string;
  canonicalField: CanonicalFieldId;
}

/**
 * Normalize source data using explicit mappings.
 *
 * Fields without a mapping are deliberately ignored.
 */
export function normalizeSourceData(
  source: SourceData,
  mappings: readonly SourceCanonicalMapping[],
): CanonicalData {
  const fields: CanonicalData['fields'] = [];

  for (const mapping of mappings) {
    const value = getSourcePathValue(
      source,
      mapping.sourcePath,
    );

    if (value === undefined) {
      continue;
    }

    fields.push({
      fieldId: mapping.canonicalField,
      value,
      source: buildSourceFieldPath(
        mapping.sourcePath,
      ),
    });
  }

  return {
    fields,
  };
}

/**
 * Read a dot-separated path from source data.
 *
 * Array indexes are supported.
 *
 * Example:
 *
 * AutoQuoteVehicles.0.vehicleVIN
 */
function getSourcePathValue(
  source: SourceData,
  path: string,
): SourceValue | undefined {
  const segments = path
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean);

  let current: SourceValue = source;

  for (const segment of segments) {
    if (
      current === null ||
      typeof current !== 'object'
    ) {
      return undefined;
    }

    if (Array.isArray(current)) {
    const index = Number(segment);

    if (
        !Number.isInteger(index) ||
        index < 0 ||
        index >= current.length
    ) {
        return undefined;
    }

    const nextValue: SourceValue | undefined = current[index];

    if (nextValue === undefined) {
        return undefined;
    }

    current = nextValue;
    continue;
    }

    if (!(segment in current)) {
    return undefined;
    }

    const nextValue: SourceValue | undefined = current[segment];

    if (nextValue === undefined) {
    return undefined;
    }

    current = nextValue;
  }

  return current;
}

/**
 * Preserve the original source identity for diagnostics
 * and future mapping administration.
 */
function buildSourceFieldPath(
  path: string,
): SourceFieldPath {
  const segments = path
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean);

  return {
    section: segments[0] ?? '',
    path,
  };
}
