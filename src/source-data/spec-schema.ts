/**
 * Growth FormAssist - Source Form Specification
 *
 * Represents the relevant portion of the source application's
 * specJson structure.
 *
 * This is intentionally an adapter contract. We do not copy
 * the source application's implementation; we only model the
 * information required by FormAssist.
 */

import type {
  SourceFieldDefinition,
  SourceFieldType,
} from './field-catalog';

export interface SourceSpecOption {
  value?: string;
  label?: string;
}

export interface SourceSpecField {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: readonly (
    | string
    | SourceSpecOption
  )[];
}

export interface SourceSpecSection {
  title: string;
  isRepeatable?: boolean;
  minInstances?: number;
  maxInstances?: number;
  fields: readonly SourceSpecField[];
}

export interface SourceFormSpec {
  sections: readonly SourceSpecSection[];
}

/**
 * Convert the source application's field type into
 * our normalized SourceFieldType.
 */
function normalizeFieldType(
  type: string | undefined,
): SourceFieldType {
  switch (type?.toLowerCase()) {
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

/**
 * Normalize source options into display/value strings.
 */
function normalizeOptions(
  options:
    | readonly (
        | string
        | SourceSpecOption
      )[]
    | undefined,
): readonly string[] | undefined {
  if (!options || options.length === 0) {
    return undefined;
  }

  return options.map((option) => {
    if (typeof option === 'string') {
      return option;
    }

    return option.label ?? option.value ?? '';
  });
}

/**
 * Build the FormAssist source-field catalog from
 * the source application's specJson.
 */
export function buildSourceFieldCatalog(
  spec: SourceFormSpec,
): {
  fields: readonly SourceFieldDefinition[];
} {
  const fields: SourceFieldDefinition[] = [];

  for (const section of spec.sections) {
    for (const field of section.fields) {
      fields.push({
        section: section.title,
        name: field.name,
        label: field.label,
        type: normalizeFieldType(field.type),
        required: field.required === true,
        repeatable:
          section.isRepeatable === true,
        options: normalizeOptions(
          field.options,
        ),
      });
    }
  }

  return {
    fields,
  };
}
