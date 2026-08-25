/**
 * Growth FormAssist - Source Systems
 *
 * Stable identifiers for systems that produce source data.
 *
 * These identifiers are internal contracts. Display names should
 * be handled separately by the UI.
 */

export const SOURCE_SYSTEMS = {
  RATER: 'rater',
} as const;

export type SourceSystem =
  (typeof SOURCE_SYSTEMS)[keyof typeof SOURCE_SYSTEMS];

  