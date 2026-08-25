/**
 * Growth FormAssist - Main Data Fields
 *
 * Public entry point for the Main Data Repository field
 * identifiers.
 *
 * The actual field definitions currently live in
 * canonical-fields.ts for compatibility with the existing
 * source-data implementation.
 *
 * This adapter will be removed once the remaining source
 * mapping contracts have been migrated.
 */

export {
  MAIN_DATA_FIELDS,
  MAIN_DATA_FIELD_IDS,
  isMainDataFieldId,
} from './canonical-fields';

export type {
  MainDataFieldId,
} from './types';

