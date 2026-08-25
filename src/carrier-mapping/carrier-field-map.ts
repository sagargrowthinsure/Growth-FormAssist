/**
 * Growth FormAssist - Carrier Field Map
 *
 * Represents the shared mapping definition for one carrier page.
 *
 * Architecture:
 *
 *   Source / TXT
 *        ↓
 *   Canonical Field
 *        ↓
 *   Carrier Field Map
 *        ↓
 *   Carrier webpage
 *
 * A carrier field may intentionally have no canonical mapping yet.
 * This allows fields such as carrier-specific underwriting questions
 * to remain visible and become mappable later when the canonical model
 * is expanded.
 */

import type {
  CanonicalFieldId,
} from '../source-data/types';

import type {
  DetectedField,
} from '../form-detection/types';

export type CarrierFieldKind =
  | 'data'
  | 'action'
  | 'unknown';

export type CarrierMappingStatus =
  | 'unmapped'
  | 'mapped'
  | 'disabled';

export interface CarrierPageIdentity {
  carrierId: string;
  carrierName: string;
  pageKey: string;
  pageTitle: string;
  origin: string;
  pathname: string;
}

export interface CarrierFieldFingerprint {
  tagName: string;
  type: string;
  id: string | null;
  name: string | null;
  label: string | null;
  ariaLabel: string | null;
  placeholder: string | null;
  title: string | null;
  formId: string | null;
  indexWithinForm: number;
}

export interface CarrierFieldOption {
  value: string;
  text: string;
}

export interface CarrierFieldMapEntry {
  /**
   * Stable identifier for this carrier field within
   * the centralized mapping repository.
   */
  id: string;

  /**
   * Stable identity of the carrier page containing this field.
   */
  page: CarrierPageIdentity;

  /**
   * Human-readable carrier metadata discovered from
   * the live page.
   */
  carrierLabel: string | null;
  coverageCode: string | null;

  /**
   * How the control should initially be treated.
   */
  kind: CarrierFieldKind;

  /**
   * Current mapping state.
   *
   * "unmapped" is valid and expected.
   */
  mappingStatus: CarrierMappingStatus;

  /**
   * Canonical field this carrier control maps to.
   *
   * Null means the carrier field is currently unmapped.
   */
  canonicalField:
    CanonicalFieldId | null;

  /**
   * Complete fingerprint required to recognize the
   * control again on a future visit.
   */
  fingerprint: CarrierFieldFingerprint;

  fieldType: string;

  required: boolean;
  disabled: boolean;
  readonly: boolean;

  options: readonly CarrierFieldOption[];

  /**
   * Position is retained for diagnostics and administration.
   * It is NOT the primary identity of the field.
   */
  scanIndex: number;

  createdAt: string;
  updatedAt: string;
}

/**
 * Complete field map for one carrier page.
 */
export interface CarrierFieldMap {
  id: string;
  page: CarrierPageIdentity;

  version: number;

  fields: readonly CarrierFieldMapEntry[];

  createdAt: string;
  updatedAt: string;
}

/**
 * Build a stable identifier from carrier/page/field identity.
 *
 * We deliberately prefer actual DOM identity such as id/name and
 * carrier metadata over the scan index because DOM ordering can change.
 */
export function buildCarrierFieldId(
  page: CarrierPageIdentity,
  field: DetectedField,
  carrierLabel: string | null,
  coverageCode: string | null,
): string {
  const identity =
    [
      page.carrierId,
      page.pageKey,
      field.fingerprint.id ?? '',
      field.fingerprint.name ?? '',
      coverageCode ?? '',
      carrierLabel ?? '',
      field.fingerprint.label ?? '',
    ]
      .map(normalizeIdentityPart)
      .filter(Boolean)
      .join('|');

  return `carrier-field:${identity}`;
}

/**
 * Create a new carrier field map from one page scan.
 *
 * No fields are silently discarded.
 */
export function createCarrierFieldMap(
  page: CarrierPageIdentity,
  fields: readonly DetectedField[],
  metadata: readonly CarrierFieldMetadata[],
  now: string = new Date().toISOString(),
): CarrierFieldMap {
  const entries =
    fields.map(
      (field, index) => {
        const fieldMetadata =
          metadata[index];

        const carrierLabel =
          fieldMetadata?.dataLabel ??
          null;

        const coverageCode =
          fieldMetadata?.dataCoverageCode ??
          null;

        return createCarrierFieldMapEntry(
          page,
          field,
          index,
          carrierLabel,
          coverageCode,
          now,
        );
      },
    );

  return {
    id:
      buildCarrierPageId(page),

    page,

    version: 1,

    fields: entries,

    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Metadata currently supplied by carrier discovery.
 *
 * Travelers already exposes these through data-label and
 * data-coveragecode attributes.
 */
export interface CarrierFieldMetadata {
  dataLabel: string | null;
  dataCoverageCode: string | null;
}

function createCarrierFieldMapEntry(
  page: CarrierPageIdentity,
  field: DetectedField,
  scanIndex: number,
  carrierLabel: string | null,
  coverageCode: string | null,
  now: string,
): CarrierFieldMapEntry {
  return {
    id:
      buildCarrierFieldId(
        page,
        field,
        carrierLabel,
        coverageCode,
      ),

    page,

    carrierLabel,
    coverageCode,

    kind:
      classifyFieldKind(
        field.fieldType,
      ),

    mappingStatus:
      'unmapped',

    canonicalField:
      null,

    fingerprint: {
      tagName:
        field.fingerprint.tagName,

      type:
        field.fingerprint.type,

      id:
        field.fingerprint.id,

      name:
        field.fingerprint.name,

      label:
        field.fingerprint.label,

      ariaLabel:
        field.fingerprint.ariaLabel,

      placeholder:
        field.fingerprint.placeholder,

      title:
        field.fingerprint.title,

      formId:
        field.fingerprint.formId,

      indexWithinForm:
        field.fingerprint.indexWithinForm,
    },

    fieldType:
      field.fieldType,

    required:
      field.required,

    disabled:
      field.disabled,

    readonly:
      field.readonly,

    options:
      field.options.map(
        (option) => ({
          value:
            option.value,

          text:
            option.text,
        }),
      ),

    scanIndex,

    createdAt: now,
    updatedAt: now,
  };
}

function classifyFieldKind(
  fieldType: string,
): CarrierFieldKind {
  switch (fieldType) {
    case 'button':
    case 'submit':
    case 'reset':
      return 'action';

    case 'text':
    case 'number':
    case 'date':
    case 'email':
    case 'tel':
    case 'url':
    case 'search':
    case 'textarea':
    case 'select':
    case 'checkbox':
    case 'radio':
    case 'range':
    case 'color':
      return 'data';

    default:
      return 'unknown';
  }
}

function buildCarrierPageId(
  page: CarrierPageIdentity,
): string {
  return [
    'carrier-page',
    normalizeIdentityPart(
      page.carrierId,
    ),
    normalizeIdentityPart(
      page.pageKey,
    ),
  ].join(':');
}

function normalizeIdentityPart(
  value: string,
): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

