/**
 * Growth FormAssist - Source Field Catalog
 *
 * Describes fields belonging to a source form schema.
 *
 * This is deliberately separate from canonical fields.
 * A source field describes what the source system calls
 * something; a canonical field describes what the data means.
 */

export type SourceFieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'textarea'
  | 'unknown';

export interface SourceFieldDefinition {
  /**
   * Section containing the field.
   */
  section: string;

  /**
   * Stable field name from the source schema.
   *
   * Example:
   * squareFootage
   */
  name: string;

  /**
   * User-facing label.
   *
   * Example:
   * Square Footage
   */
  label: string;

  /**
   * Source field type.
   */
  type: SourceFieldType;

  /**
   * Whether the source form requires this field.
   */
  required: boolean;

  /**
   * Whether the containing section can repeat.
   */
  repeatable: boolean;

  /**
   * Source options, when applicable.
   */
  options?: readonly string[];
}

export interface SourceFieldCatalog {
  fields: readonly SourceFieldDefinition[];
}

/**
 * Find a source field by its source section/name.
 */
export function findSourceField(
  catalog: SourceFieldCatalog,
  section: string,
  name: string,
): SourceFieldDefinition | undefined {
  return catalog.fields.find(
    (field) =>
      field.section === section &&
      field.name === name,
  );
}

/**
 * Find all source fields belonging to a section.
 */
export function findSourceFieldsBySection(
  catalog: SourceFieldCatalog,
  section: string,
): readonly SourceFieldDefinition[] {
  return catalog.fields.filter(
    (field) => field.section === section,
  );
}

/**
 * Return source fields that do not have a valid definition
 * in the supplied catalog.
 *
 * This is intended for development-time validation of source
 * schemas and mappings. It does not modify the catalog.
 */
export function findMissingSourceFields(
  catalog: SourceFieldCatalog,
  fields: readonly {
    section: string;
    name: string;
  }[],
): readonly {
  section: string;
  name: string;
}[] {
  return fields.filter(
    (field) =>
      !findSourceField(
        catalog,
        field.section,
        field.name,
      ),
  );
}

