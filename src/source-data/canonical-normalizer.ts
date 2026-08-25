/**
 * Growth FormAssist - Canonical Normalizer
 *
 * Converts resolved source fields into canonical insurance data.
 *
 * The source resolver is responsible for answering:
 *
 *   "What source field is this?"
 *
 * This module answers:
 *
 *   "What does that field mean in our canonical model?"
 *
 * No fuzzy matching is performed here.
 */

import type {
  SourceSystem,
} from './source-systems';

import type {
  FieldMapping,
} from './mapping-types';

import type {
  CanonicalData,
} from './types';

import type {
  ResolvedSourceField,
} from './txt-resolver';

export interface CanonicalNormalizationWarning {
  sourceSystem: SourceSystem;
  section: string;
  field: string;
  message: string;
}

export interface CanonicalNormalizationResult {
  data: CanonicalData;
  warnings: readonly CanonicalNormalizationWarning[];
}

/**
 * Normalize resolved source fields into canonical fields.
 *
 * Only explicitly mapped source fields are included.
 */
export function normalizeResolvedSourceFields(
  fields: readonly ResolvedSourceField[],
  mappings: readonly FieldMapping[],
  sourceSystem: SourceSystem,
): CanonicalNormalizationResult {
  const canonicalFields: CanonicalData['fields'] = [];
  const warnings: CanonicalNormalizationWarning[] =
    [];

  for (const field of fields) {
    const mapping = mappings.find(
      (candidate) =>
        candidate.status === 'active' &&
        candidate.sourceSystem ===
          sourceSystem &&
        candidate.sourceSection ===
          field.section &&
        candidate.sourceFieldName ===
          field.name,
    );

    if (!mapping) {
        warnings.push({
        sourceSystem,
        section: field.section,
        field: field.name,
        message:
            'Source field has no canonical mapping.',
        });

      continue;
    }

    canonicalFields.push({
      fieldId: mapping.canonicalField,
      value: field.value,
      source: {
        section: field.section,
        path: field.name,
        ...(field.instance !== undefined
          ? { instance: field.instance }
          : {}),
      },
    });
  }

  return {
    data: {
      fields: canonicalFields,
    },
    warnings,
  };
}

