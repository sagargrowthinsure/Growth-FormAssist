/**
 * Growth FormAssist - Rater TXT Field Resolver
 *
 * Resolves human-readable TXT labels against the source
 * form schema while preserving repeatable-section instances.
 */

import type {
  SourceData,
  SourceValue,
} from './types';

import type {
  SourceFieldCatalog,
  SourceFieldDefinition,
} from './field-catalog';

export interface ResolvedSourceField {
  /**
   * Source section name.
   */
  section: string;

  /**
   * Stable source field name from the schema.
   */
  name: string;

  /**
   * Human-readable source label.
   */
  label: string;

  /**
   * Parsed value.
   */
  value: SourceValue;

  /**
   * Instance number for repeatable sections.
   *
   * First instance = 1.
   *
   * Undefined for non-repeatable sections.
   */
  instance?: number;
}

export interface ResolvedSourceData {
  fields: readonly ResolvedSourceField[];
}

/**
 * Resolve parsed TXT data against the source field catalog.
 *
 * Matching is deliberately based on:
 *
 *   normalized section + normalized label
 *
 * No fuzzy matching is performed.
 */
export function resolveRaterTxtFields(
  source: SourceData,
  catalog: SourceFieldCatalog,
): ResolvedSourceData {
  const fields: ResolvedSourceField[] = [];

  for (const [sectionName, sectionValue] of Object.entries(source)) {
    resolveSection(
      sectionName,
      sectionValue,
      catalog,
      fields,
    );
  }

  return {
    fields,
  };
}

function resolveSection(
  sectionName: string,
  sectionValue: SourceValue,
  catalog: SourceFieldCatalog,
  output: ResolvedSourceField[],
): void {
  if (
    sectionValue === null ||
    typeof sectionValue !== 'object'
  ) {
    return;
  }

  /*
   * Repeatable section.
   *
   * The parser represents instances as an array:
   *
   * [
   *   { VIN: 'ABC123' },
   *   { VIN: 'XYZ789' }
   * ]
   */
  if (Array.isArray(sectionValue)) {
    sectionValue.forEach(
      (instanceValue, index) => {
        if (
          instanceValue === null ||
          typeof instanceValue !== 'object' ||
          Array.isArray(instanceValue)
        ) {
          return;
        }

        const instanceNumber = index + 1;

        for (const [
          label,
          value,
        ] of Object.entries(instanceValue)) {
          const definition =
            findDefinition(
              catalog,
              sectionName,
              label,
            );

          if (!definition) {
            continue;
          }

          output.push({
            section: sectionName,
            name: definition.name,
            label: definition.label,
            value,
            instance: instanceNumber,
          });
        }
      },
    );

    return;
  }

  /*
   * Normal, non-repeatable section.
   */
  for (const [label, value] of Object.entries(
    sectionValue,
  )) {
    const definition =
      findDefinition(
        catalog,
        sectionName,
        label,
      );

    if (!definition) {
      continue;
    }

    output.push({
      section: sectionName,
      name: definition.name,
      label: definition.label,
      value,
    });
  }
}

function findDefinition(
  catalog: SourceFieldCatalog,
  section: string,
  label: string,
): SourceFieldDefinition | undefined {
  const normalizedSection =
    normalizeLabel(section);

  const normalizedLabel =
    normalizeLabel(label);

  return catalog.fields.find(
    (field) =>
      normalizeLabel(field.section) ===
        normalizedSection &&
      normalizeLabel(field.label) ===
        normalizedLabel,
  );
}

function normalizeLabel(
  value: string,
): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

