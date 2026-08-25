/**
 * Growth FormAssist - Source → Canonical Mapping Registry
 *
 * Initial verified/high-confidence mappings.
 *
 * The registry is currently code-backed. Later it can be replaced
 * or supplemented by persisted mapping configuration without
 * changing the consumer-facing mapping contract.
 */
import {
  SOURCE_SYSTEMS,
  type SourceSystem,
} from './source-systems';

import type {
  CanonicalFieldId,
} from './types';

import type {
  FieldMapping,
} from './mapping-types';

export const SOURCE_CANONICAL_MAPPINGS:
  readonly FieldMapping[] = [
  // ---------------------------------------------------------------------------
  // Applicant
  // ---------------------------------------------------------------------------

  {
    id: 'rater-applicant-first-name',
    sourceSystem:
  SOURCE_SYSTEMS.RATER,
    sourceSection:
      'COMMON INFORMATION - APPLICANT',
    sourceFieldName: 'firstName',
    sourceLabel: 'First Name',
    canonicalField:
      'customer.firstName',
    confidence: 'verified',
    status: 'active',
    notes: 'Applicant first name',
  },

  {
    id: 'rater-applicant-last-name',
    sourceSystem:
  SOURCE_SYSTEMS.RATER,
    sourceSection:
      'COMMON INFORMATION - APPLICANT',
    sourceFieldName: 'lastName',
    sourceLabel: 'Last Name',
    canonicalField:
      'customer.lastName',
    confidence: 'verified',
    status: 'active',
    notes: 'Applicant last name',
  },

  {
    id: 'rater-applicant-dob',
    sourceSystem:
  SOURCE_SYSTEMS.RATER,
    sourceSection:
      'COMMON INFORMATION - APPLICANT',
    sourceFieldName: 'dateOfBirth',
    sourceLabel: 'Date of Birth',
    canonicalField:
      'customer.dateOfBirth',
    confidence: 'verified',
    status: 'active',
    notes: 'Applicant date of birth',
  },

  {
    id: 'rater-applicant-gender',
    sourceSystem:
  SOURCE_SYSTEMS.RATER,
    sourceSection:
      'COMMON INFORMATION - APPLICANT',
    sourceFieldName: 'gender',
    sourceLabel: 'Gender',
    canonicalField:
      'customer.gender',
    confidence: 'verified',
    status: 'active',
    notes: 'Applicant gender',
  },

  {
    id: 'rater-applicant-marital-status',
    sourceSystem:
  SOURCE_SYSTEMS.RATER,
    sourceSection:
      'COMMON INFORMATION - APPLICANT',
    sourceFieldName: 'maritalStatus',
    sourceLabel: 'Marital Status',
    canonicalField:
      'customer.maritalStatus',
    confidence: 'verified',
    status: 'active',
    notes: 'Applicant marital status',
  },

  // ---------------------------------------------------------------------------
  // Property address
  // ---------------------------------------------------------------------------

  {
    id: 'rater-property-street',
    sourceSystem:
  SOURCE_SYSTEMS.RATER,
    sourceSection: 'PROPERTY ADDRESS',
    sourceFieldName: 'propAddress',
    sourceLabel: 'Address',
    canonicalField:
      'address.street',
    confidence: 'verified',
    status: 'active',
    notes: 'Property street address',
  },

  {
    id: 'rater-property-city',
    sourceSystem:
  SOURCE_SYSTEMS.RATER,
    sourceSection: 'PROPERTY ADDRESS',
    sourceFieldName: 'propCity',
    sourceLabel: 'City',
    canonicalField:
      'address.city',
    confidence: 'verified',
    status: 'active',
    notes: 'Property city',
  },

  {
    id: 'rater-property-state',
    sourceSystem:
  SOURCE_SYSTEMS.RATER,
    sourceSection: 'PROPERTY ADDRESS',
    sourceFieldName: 'propState',
    sourceLabel: 'State',
    canonicalField:
      'address.state',
    confidence: 'verified',
    status: 'active',
    notes: 'Property state',
  },

  {
    id: 'rater-property-postal-code',
    sourceSystem:
  SOURCE_SYSTEMS.RATER,
    sourceSection: 'PROPERTY ADDRESS',
    sourceFieldName: 'propPostalCode',
    sourceLabel: 'Postal Code',
    canonicalField:
      'address.postalCode',
    confidence: 'verified',
    status: 'active',
    notes: 'Property postal code',
  },

  // ---------------------------------------------------------------------------
  // Contact
  // ---------------------------------------------------------------------------

  {
    id: 'rater-contact-email',
    sourceSystem:
  SOURCE_SYSTEMS.RATER,
    sourceSection: 'CONTACT DETAILS',
    sourceFieldName: 'emailAddress',
    sourceLabel: 'Email Address',
    canonicalField:
      'contact.email',
    confidence: 'verified',
    status: 'active',
    notes: 'Primary contact email address',
  },

  {
    id: 'rater-contact-phone',
    sourceSystem:
  SOURCE_SYSTEMS.RATER,
    sourceSection: 'CONTACT DETAILS',
    sourceFieldName: 'phoneNumber',
    sourceLabel: 'Phone Number',
    canonicalField:
      'contact.homePhone',
    confidence: 'medium',
    status: 'active',
    notes:
      'Current source has a separate Phone Type field. This mapping will need conditional handling before production use.',
  },
];

/**
 * Return all configured mappings.
 */
export function getSourceCanonicalMappings():
  readonly FieldMapping[] {
  return SOURCE_CANONICAL_MAPPINGS;
}

export function getMappingsForSourceSystem(
  sourceSystem: SourceSystem,
): readonly FieldMapping[] {
  return SOURCE_CANONICAL_MAPPINGS.filter(
    (mapping) =>
      mapping.sourceSystem === sourceSystem &&
      mapping.status === 'active',
  );
}

/**
 * Find a mapping by complete source identity.
 */
export function findCanonicalMapping(
  sourceSystem: string,
  sourceSection: string,
  sourceFieldName: string,
): FieldMapping | undefined {
  return SOURCE_CANONICAL_MAPPINGS.find(
    (mapping) =>
      mapping.sourceSystem === sourceSystem &&
      mapping.sourceSection === sourceSection &&
      mapping.sourceFieldName === sourceFieldName &&
      mapping.status === 'active',
  );
}

/**
 * Determine whether a canonical field currently has
 * at least one active source mapping.
 */
export function isMappedCanonicalField(
  fieldId: CanonicalFieldId,
): boolean {
  return SOURCE_CANONICAL_MAPPINGS.some(
    (mapping) =>
      mapping.canonicalField === fieldId &&
      mapping.status === 'active',
  );
}

