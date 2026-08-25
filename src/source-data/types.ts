/**
 * Growth FormAssist - Source Data Types
 *
 * Contracts for imported Rater/source data and the
 * Main Data Repository.
 *
 * The Main Data Repository mirrors the stable field
 * structure represented by the Rater export layout.
 *
 * It is deliberately separate from:
 *
 * - carrier form definitions
 * - carrier field mappings
 * - DOM field detection
 * - autofill
 */

/**
 * A scalar value originating from an imported source file.
 */
export type SourceScalarValue =
  | string
  | number
  | boolean
  | null;

/**
 * A source value may contain nested objects or
 * repeating arrays.
 */
export type SourceValue =
  | SourceScalarValue
  | SourceValue[]
  | {
      [key: string]: SourceValue;
    };

/**
 * One source field after parsing.
 */
export interface SourceFieldValue {
  section: string;
  field: string;
  value: SourceValue;
}

/**
 * Identifies where an imported value originated.
 *
 * The original source identity is retained so that
 * import diagnostics and future mapping administration
 * never lose the Rater field's identity.
 */
export interface SourceFieldPath {
  section: string;
  path: string;
  instance?: number;
}

/**
 * Parsed source data before Main Data mapping.
 */
export interface SourceData {
  [key: string]: SourceValue;
}

/**
 * Stable Main Data Repository field identifier.
 *
 * These identifiers represent fields in our copy of the
 * Rater export data model.
 *
 * They are NOT carrier field identifiers.
 */
export type MainDataFieldId = string;

/**
 * One value stored in the Main Data Repository.
 *
 * Repeating source instances are represented by the
 * source path/instance information rather than being
 * flattened into a carrier-specific structure.
 */
export interface MainDataFieldValue {
  fieldId: MainDataFieldId;
  value: SourceValue;
  source: SourceFieldPath;
}

/**
 * Main Data Repository.
 *
 * This is the populated data set for the current quote.
 *
 * It contains values supplied by the imported Rater
 * export. Fields that are not present in the source remain
 * unavailable; they are not invented or populated with
 * carrier-specific values.
 */
export interface MainData {
  fields: MainDataFieldValue[];
}

/**
 * ---------------------------------------------------------------------------
 * Compatibility aliases
 * ---------------------------------------------------------------------------
 *
 * The current source-data implementation was initially built around the
 * name "CanonicalData". We are transitioning that layer to MainData.
 *
 * These aliases keep the existing pipeline compiling while the mapping
 * contracts are migrated in subsequent buildable batches.
 *
 * They should not be used for new code.
 */

/** @deprecated Use MainDataFieldId instead. */
export type CanonicalFieldId = MainDataFieldId;

/** @deprecated Use MainDataFieldValue instead. */
export type CanonicalFieldValue =
  MainDataFieldValue;

/** @deprecated Use MainData instead. */
export type CanonicalData = MainData;

/**
 * Result of parsing an imported source file.
 */
export interface SourceParseResult {
  success: true;
  source: SourceData;
}

/**
 * Failed source parsing result.
 */
export interface SourceParseError {
  success: false;
  error: string;
}

/**
 * Complete parser result.
 */
export type SourceParseResponse =
  | SourceParseResult
  | SourceParseError;

  