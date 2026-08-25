/**
 * Growth FormAssist - Main Data Field Identifiers
 *
 * Compatibility export for the current source-data pipeline.
 *
 * The Main Data Repository is based on the field structure
 * represented by the Rater export layout.
 *
 * Carrier fields must never be added here.
 */

import type {
  MainDataFieldId,
} from './types';

/**
 * Main Data fields currently established from the
 * Rater source form structure.
 *
 * These identifiers intentionally retain the existing
 * stable IDs while the source-data layer transitions from
 * the old "canonical" terminology to Main Data terminology.
 */
export const MAIN_DATA_FIELDS = {
  customer: {
    firstName:
      'customer.firstName',
    lastName:
      'customer.lastName',
    dateOfBirth:
      'customer.dateOfBirth',
    prefix:
      'customer.prefix',
    suffix:
      'customer.suffix',
    gender:
      'customer.gender',
    maritalStatus:
      'customer.maritalStatus',
  },

  contact: {
    email:
      'contact.email',
    homePhone:
      'contact.phone.home',
    mobilePhone:
      'contact.phone.mobile',
    workPhone:
      'contact.phone.work',
    preferredContactMethod:
      'contact.preferredContactMethod',
  },

  address: {
    street:
      'address.street',
    city:
      'address.city',
    state:
      'address.state',
    postalCode:
      'address.postalCode',
    county:
      'address.county',
  },

  property: {
    occupancy:
      'property.occupancy',
    dwellingType:
      'property.dwelling.type',
    livingArea:
      'property.dwelling.livingArea',
    yearBuilt:
      'property.dwelling.yearBuilt',
    stories:
      'property.dwelling.stories',
    roofType:
      'property.dwelling.roofType',
    roofYear:
      'property.dwelling.roofYear',
    foundationType:
      'property.dwelling.foundationType',
    heatingType:
      'property.dwelling.heatingType',
  },

  auto: {
    drivers:
      'auto.drivers',
    vehicles:
      'auto.vehicles',
    incidents:
      'auto.incidents',
    coverage:
      'auto.coverage',
  },

  home: {
    coverage:
      'home.coverage',
    losses:
      'home.losses',
  },
} as const;

/**
 * Flattened list of Main Data field identifiers.
 */
export const MAIN_DATA_FIELD_IDS:
  readonly MainDataFieldId[] = [
  MAIN_DATA_FIELDS.customer.firstName,
  MAIN_DATA_FIELDS.customer.lastName,
  MAIN_DATA_FIELDS.customer.dateOfBirth,
  MAIN_DATA_FIELDS.customer.prefix,
  MAIN_DATA_FIELDS.customer.suffix,
  MAIN_DATA_FIELDS.customer.gender,
  MAIN_DATA_FIELDS.customer.maritalStatus,

  MAIN_DATA_FIELDS.contact.email,
  MAIN_DATA_FIELDS.contact.homePhone,
  MAIN_DATA_FIELDS.contact.mobilePhone,
  MAIN_DATA_FIELDS.contact.workPhone,
  MAIN_DATA_FIELDS.contact.preferredContactMethod,

  MAIN_DATA_FIELDS.address.street,
  MAIN_DATA_FIELDS.address.city,
  MAIN_DATA_FIELDS.address.state,
  MAIN_DATA_FIELDS.address.postalCode,
  MAIN_DATA_FIELDS.address.county,

  MAIN_DATA_FIELDS.property.occupancy,
  MAIN_DATA_FIELDS.property.dwellingType,
  MAIN_DATA_FIELDS.property.livingArea,
  MAIN_DATA_FIELDS.property.yearBuilt,
  MAIN_DATA_FIELDS.property.stories,
  MAIN_DATA_FIELDS.property.roofType,
  MAIN_DATA_FIELDS.property.roofYear,
  MAIN_DATA_FIELDS.property.foundationType,
  MAIN_DATA_FIELDS.property.heatingType,

  MAIN_DATA_FIELDS.auto.drivers,
  MAIN_DATA_FIELDS.auto.vehicles,
  MAIN_DATA_FIELDS.auto.incidents,
  MAIN_DATA_FIELDS.auto.coverage,

  MAIN_DATA_FIELDS.home.coverage,
  MAIN_DATA_FIELDS.home.losses,
] as const;

/**
 * Runtime check for a Main Data field identifier.
 */
export function isMainDataFieldId(
  value: string,
): value is MainDataFieldId {
  return MAIN_DATA_FIELD_IDS.includes(
    value as MainDataFieldId,
  );
}

/**
 * ---------------------------------------------------------------------------
 * Temporary compatibility exports
 * ---------------------------------------------------------------------------
 *
 * Existing source-data code still imports these names.
 * They remain temporarily so this batch does not require
 * unrelated mapping changes.
 *
 * New code should use MAIN_DATA_FIELDS and
 * MAIN_DATA_FIELD_IDS instead.
 */

/** @deprecated Use MAIN_DATA_FIELDS instead. */
export const CANONICAL_FIELDS =
  MAIN_DATA_FIELDS;

/** @deprecated Use MAIN_DATA_FIELD_IDS instead. */
export const CANONICAL_FIELD_IDS =
  MAIN_DATA_FIELD_IDS;

/** @deprecated Use isMainDataFieldId instead. */
export const isCanonicalFieldId =
  isMainDataFieldId;

  