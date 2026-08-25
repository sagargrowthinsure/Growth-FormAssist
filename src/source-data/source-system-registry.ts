/**
 * Growth FormAssist - Source System Registry
 *
 * Metadata describing systems that produce source data.
 *
 * This is intentionally separate from FieldMapping.
 * A source system describes WHERE data came from.
 * A mapping describes WHAT a particular source field means.
 */

import {
  SOURCE_SYSTEMS,
  type SourceSystem,
} from './source-systems';

export interface SourceSystemDefinition {
  id: SourceSystem;
  name: string;
  description: string;
  fileFormat: 'txt';
}

export const SOURCE_SYSTEM_DEFINITIONS:
  readonly SourceSystemDefinition[] = [
  {
    id: SOURCE_SYSTEMS.RATER,
    name: 'Rater',
    description:
      'Source data exported from the Rater application.',
    fileFormat: 'txt',
  },
];

/**
 * Find a registered source system.
 */
export function findSourceSystem(
  id: SourceSystem,
): SourceSystemDefinition | undefined {
  return SOURCE_SYSTEM_DEFINITIONS.find(
    (system) => system.id === id,
  );
}

/**
 * Return all registered source systems.
 */
export function getSourceSystems():
  readonly SourceSystemDefinition[] {
  return SOURCE_SYSTEM_DEFINITIONS;
}

