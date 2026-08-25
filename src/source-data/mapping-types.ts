/**
 * Growth FormAssist - Mapping Types
 *
 * Data contracts for source-field → canonical-field mappings.
 *
 * These contracts are intentionally independent of the UI.
 * Later they can be persisted in extension storage/database
 * and managed by authorized users.
 */

import type {
  CanonicalFieldId,
} from './types';

export type MappingStatus =
  | 'active'
  | 'disabled';

export type MappingConfidence =
  | 'verified'
  | 'high'
  | 'medium'
  | 'low';

export interface FieldMapping {
  /**
   * Unique identifier for this mapping.
   */
  id: string;

  /**
   * Source system/form identifier.
   *
   * Example:
   *   rater
   *   safeco
   *   travelers
   */
  sourceSystem: string;

  /**
   * Source section.
   */
  sourceSection: string;

  /**
   * Stable source field name.
   */
  sourceFieldName: string;

  /**
   * Source display label.
   *
   * Stored for diagnostics and administration.
   */
  sourceLabel: string;

  /**
   * Canonical field represented by the source field.
   */
  canonicalField: CanonicalFieldId;

  /**
   * How confidently the mapping has been established.
   */
  confidence: MappingConfidence;

  /**
   * Whether the mapping is currently usable.
   */
  status: MappingStatus;

  /**
   * Optional administrator notes.
   */
  notes?: string;
}

