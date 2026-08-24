/**
 * Growth FormAssist - Form Detection Types
 *
 * Shared contracts used by the field-detection engine and future capture
 * and autofill components.
 */

export type DetectedFieldType =
  | 'text'
  | 'number'
  | 'date'
  | 'email'
  | 'tel'
  | 'url'
  | 'password'
  | 'search'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'file'
  | 'range'
  | 'color'
  | 'hidden'
  | 'button'
  | 'submit'
  | 'reset'
  | 'unknown';

export interface DetectedOption {
  value: string;
  text: string;
  selected: boolean;
}

export interface FieldFingerprint {
  tagName: string;
  type: string;
  id: string | null;
  name: string | null;
  label: string | null;
  ariaLabel: string | null;
  placeholder: string | null;
  title: string | null;
  autocomplete: string | null;
  selector: string;
  xpath: string | null;
  formId: string | null;
  formAction: string | null;
  indexWithinForm: number;
}

export interface DetectedField {
  index: number;
  fieldType: DetectedFieldType;
  fingerprint: FieldFingerprint;
  value: string;
  checked: boolean | null;
  disabled: boolean;
  required: boolean;
  readonly: boolean;
  options: DetectedOption[];
}

