/**
 * Growth FormAssist - Source Catalog Builder
 *
 * Builds the source-field catalog from the source application's
 * form specification.
 *
 * This module contains no carrier mappings.
 */

import type {
  SourceFieldCatalog,
  SourceFieldDefinition,
  SourceFieldType,
} from './field-catalog';

import type {
  SourceFormSpec,
  SourceSpecField,
} from './spec-schema';

/**
 * Build a complete source-field catalog from specJson.
 */
export function buildCatalogFromSpec(
  spec: SourceFormSpec,
): SourceFieldCatalog {
  const fields: SourceFieldDefinition[] = [];

  for (const section of spec.sections) {
    const repeatable =
      section.isRepeatable === true;

    for (const field of section.fields) {
      fields.push(
        createFieldDefinition(
          section.title,
          repeatable,
          field,
        ),
      );
    }
  }

  return {
    fields,
  };
}

function createFieldDefinition(
  section: string,
  repeatable: boolean,
  field: SourceSpecField,
): SourceFieldDefinition {
  return {
    section,
    name: field.name,
    label: field.label,
    type: normalizeFieldType(field.type),
    required: field.required === true,
    repeatable,
    options: normalizeOptions(field),
  };
}

function normalizeFieldType(
  type: string | undefined,
): SourceFieldType {
  switch (type?.trim().toLowerCase()) {
    case 'text':
      return 'text';

    case 'number':
      return 'number';

    case 'date':
      return 'date';

    case 'select':
      return 'select';

    case 'checkbox':
      return 'checkbox';

    case 'radio':
      return 'radio';

    case 'textarea':
      return 'textarea';

    default:
      return 'unknown';
  }
}

function normalizeOptions(
  field: SourceSpecField,
): readonly string[] | undefined {
  if (!field.options?.length) {
    return undefined;
  }

  return field.options.map(
    (option) =>
      typeof option === 'string'
        ? option
        : option.label ??
          option.value ??
          '',
  );
}
