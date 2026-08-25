/**
 * Growth FormAssist - Source Data Import Pipeline
 *
 * Complete pipeline:
 *
 * TXT
 *  ↓
 * TXT Parser
 *  ↓
 * Source Field Resolver
 *  ↓
 * Source → Canonical Mapping
 *  ↓
 * Canonical Data
 *
 * The pipeline deliberately keeps unmapped fields visible.
 * We must never silently discard source data.
 */

import {
  findSourceSystem,
} from './source-system-registry';

import {
  getMappingsForSourceSystem,
} from './mapping-registry';

import {
  SOURCE_SYSTEMS,
} from './source-systems';

import type {
  SourceSystem,
} from './source-systems';

import type {
  FieldMapping,
} from './mapping-types';

import type {
  CanonicalData,
  SourceValue,
} from './types';

import type {
  SourceFieldCatalog,
} from './field-catalog';

import {
  parseRaterTxt,
} from './txt-parser';

import {
  resolveRaterTxtFields,
  type ResolvedSourceField,
} from './txt-resolver';

import {
  normalizeResolvedSourceFields,
  type CanonicalNormalizationWarning,
} from './canonical-normalizer';

export interface UnmappedSourceField {
  section: string;
  name: string;
  label: string;
  value: SourceValue;
  instance?: number;
}

export interface SourceImportSummary {
  totalResolvedFields: number;
  mappedFields: number;
  unmappedFields: number;
  warningCount: number;
}

export type SourceImportStatus =
  | 'success'
  | 'partial'
  | 'error';

export interface SourceImportResult {
  success: boolean;

  sourceSystem: SourceSystem;

  status: SourceImportStatus;

  /**
   * Canonical data produced from all successfully mapped fields.
   */
  data: CanonicalData;

  /**
   * Fields that were successfully parsed and resolved
   * but do not yet have a canonical mapping.
   */
  unmapped: readonly UnmappedSourceField[];

  /**
   * Non-fatal normalization warnings.
   */
  warnings: readonly CanonicalNormalizationWarning[];

  /**
   * Useful statistics for UI and diagnostics.
   */
  summary: SourceImportSummary;

  /**
   * Parser or import error.
   */
  error?: string;
}

/**
 * Import TXT source data and normalize it into the
 * canonical FormAssist data model.
 */
export function importSourceText(
  text: string,
  catalog: SourceFieldCatalog,
  mappings: readonly FieldMapping[],
  sourceSystem: SourceSystem,
): SourceImportResult {
  const sourceSystemDefinition =
    findSourceSystem(sourceSystem);

  if (!sourceSystemDefinition) {
    return {
        success: false,
        sourceSystem,
        status: 'error',
      data: {
        fields: [],
      },
      unmapped: [],
      warnings: [],
      summary: {
        totalResolvedFields: 0,
        mappedFields: 0,
        unmappedFields: 0,
        warningCount: 0,
      },
      error:
        `Unknown source system: ${sourceSystem}`,
    };
  }

  const parsed = parseRaterTxt(text);

  if (!parsed.success) {
    return {
        success: false,
        sourceSystem,
        status: 'error',
      data: {
        fields: [],
      },
      unmapped: [],
      warnings: [],
      summary: {
        totalResolvedFields: 0,
        mappedFields: 0,
        unmappedFields: 0,
        warningCount: 0,
      },
      error: parsed.error,
    };
  }

  const resolved =
    resolveRaterTxtFields(
      parsed.source,
      catalog,
    );

  const normalized =
    normalizeResolvedSourceFields(
      resolved.fields,
      mappings,
      sourceSystem,
    );

  const unmapped =
    resolved.fields.filter(
      (field) =>
        !mappings.some(
          (mapping) =>
            mapping.status === 'active' &&
            mapping.sourceSystem ===
              sourceSystem &&
            mapping.sourceSection ===
              field.section &&
            mapping.sourceFieldName ===
              field.name,
        ),
    );

    return {
    success: true,
    sourceSystem,
    status:
        unmapped.length > 0
        ? 'partial'
        : 'success',
    data: normalized.data,
    unmapped: unmapped.map(
        toUnmappedSourceField,
    ),
    warnings: normalized.warnings,
    summary: {
        totalResolvedFields:
        resolved.fields.length,
        mappedFields:
        normalized.data.fields.length,
        unmappedFields:
        unmapped.length,
        warningCount:
        normalized.warnings.length,
    },
    };
}

export function importRaterSourceText(
  text: string,
  catalog: SourceFieldCatalog,
): SourceImportResult {
  return importSourceText(
    text,
    catalog,
    getMappingsForSourceSystem(
      SOURCE_SYSTEMS.RATER,
    ),
    SOURCE_SYSTEMS.RATER,
  );
}

/**
 * Import Rater TXT using the registered Rater source
 * catalog and return the complete import result.
 *
 * This is the explicit application-facing entry point
 * for Rater source data.
 */
export function importRaterSourceTextWithMappings(
  text: string,
  catalog: SourceFieldCatalog,
): SourceImportResult {
  const mappings =
    getMappingsForSourceSystem(
      SOURCE_SYSTEMS.RATER,
    );

  return importSourceText(
    text,
    catalog,
    mappings,
    SOURCE_SYSTEMS.RATER,
  );
}

function toUnmappedSourceField(
  field: ResolvedSourceField,
): UnmappedSourceField {
  return {
    section: field.section,
    name: field.name,
    label: field.label,
    value: field.value,
    ...(field.instance !== undefined
      ? { instance: field.instance }
      : {}),
  };
}
